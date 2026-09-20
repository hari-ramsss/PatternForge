import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionService } from './execution.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiOrchestratorService } from '../assessment/ai-orchestrator.service';

interface Judge0Response {
  token: string;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
}

@Processor('compile-queue')
export class ExecutionProcessor extends WorkerHost {
  private judgeUrl: string;

  constructor(
    private prisma: PrismaService,
    private executionService: ExecutionService,
    private configService: ConfigService,
    private aiOrchestrator: AiOrchestratorService,
  ) {
    super();
    this.judgeUrl = this.configService.get<string>('JUDGE0_URL') || 'http://localhost:8000';
  }

  private mapLanguageToJudgeId(lang: string): number {
    switch (lang.toLowerCase()) {
      case 'python':
        return 71; // Python 3
      case 'javascript':
        return 63; // Node.js
      case 'cpp':
        return 54; // GCC C++
      case 'java':
        return 62; // Java
      default:
        return 71;
    }
  }

  private mapJudgeStatusToVerdict(statusId: number): 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' {
    switch (statusId) {
      case 3:
        return 'ACCEPTED';
      case 4:
        return 'WRONG_ANSWER';
      case 5:
        return 'TIME_LIMIT_EXCEEDED';
      case 6:
        return 'COMPILATION_ERROR';
      case 12:
        return 'MEMORY_LIMIT_EXCEEDED';
      default:
        if (statusId >= 7 && statusId <= 11) return 'RUNTIME_ERROR';
        return 'RUNTIME_ERROR';
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { submissionId, isSubmit, customTestCases } = job.data;

    // Notify client: RUNNING
    this.executionService.eventEmitter.emit(`status:${submissionId}`, { status: 'RUNNING' });

    // 1. Fetch submission details
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: true },
    });

    if (!submission) {
      return;
    }

    // 2. Generate and save AI edge cases if this is a submission run and no private test cases exist
    if (isSubmit) {
      const privateCount = await this.prisma.testCase.count({
        where: {
          problemId: submission.problemId,
          isPublic: false,
        },
      });

      if (privateCount === 0) {
        try {
          const generated = await this.aiOrchestrator.generateEdgeCases(submission.problem);
          if (generated && generated.length > 0) {
            await this.prisma.testCase.createMany({
              data: generated.map((tc) => ({
                problemId: submission.problemId,
                input: tc.input,
                expected: tc.expected,
                isPublic: false,
              })),
            });
          }
        } catch (err) {
          console.error('Failed to generate dynamic AI edge cases:', err.message);
        }
      }
    }

    // Fetch test cases
    let testCases: Array<{ id?: string; input: string; expected: string; isPublic: boolean }> = [];

    if (customTestCases && Array.isArray(customTestCases) && customTestCases.length > 0) {
      testCases = customTestCases.map((ctc: any, idx: number) => ({
        id: `custom-${idx}`,
        input: ctc.input || '',
        expected: ctc.expected || '',
        isPublic: true,
      }));
    } else {
      // Fetch test cases from database (including any newly generated/saved ones)
      testCases = await this.prisma.testCase.findMany({
        where: {
          problemId: submission.problemId,
          ...(isSubmit ? {} : { isPublic: true }),
        },
      });

      // Fallback if no test cases match
      if (testCases.length === 0) {
        const fallbackCase = await this.prisma.testCase.findFirst({
          where: { problemId: submission.problemId },
        });
        if (fallbackCase) testCases.push(fallbackCase);
      }
    }

    if (testCases.length === 0) {
      // Mark as error
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'COMPILATION_ERROR', stderr: 'No test cases configured for this problem.' },
      });
      this.executionService.eventEmitter.emit(`status:${submissionId}`, {
        status: 'COMPILATION_ERROR',
        stderr: 'No test cases configured for this problem.',
      });
      return;
    }

    const languageId = this.mapLanguageToJudgeId(submission.language);

    // 3. Prepare Batch submissions to Judge0 with strict Resource Caps
    const payloads = testCases.map((tc) => ({
      source_code: this.wrapCode(submission.code, submission.language, submission.problem.title),
      language_id: languageId,
      stdin: tc.input,
      ...(tc.expected && tc.expected.trim() !== '' ? { expected_output: tc.expected } : {}),
      cpu_limit: 2.0,
      memory_limit: 131072, // 128MB RAM limit in KB
      wall_time_limit: 4.0, // 4.0 seconds wall clock hard cutoff
      max_processes_and_or_lightweight_tasks: 20, // Fork bomb protection
      max_file_size: 1024, // 1MB file creation cap
    }));

    try {
      // Post batch execution
      const postUrl = `${this.judgeUrl}/submissions/batch?base64_encoded=false&wait=false`;
      const response = await axios.post(postUrl, { submissions: payloads });
      const tokens: string[] = response.data.map((item: { token: string }) => item.token);

      // 4. Poll Judge0 batch status
      let allFinished = false;
      let results: Judge0Response[] = [];
      const getUrl = `${this.judgeUrl}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=false&fields=token,status,time,memory,stdout,stderr,compile_output`;

      // Poll every 1 second, max 15 attempts
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const checkResponse = await axios.get(getUrl);
        results = checkResponse.data.submissions;

        // Status IDs 1 (In Queue) and 2 (Processing) mean still running
        const pendingCount = results.filter((res) => res.status.id === 1 || res.status.id === 2).length;
        if (pendingCount === 0) {
          allFinished = true;
          break;
        }
      }

      if (!allFinished) {
        throw new Error('Judge0 sandbox execution timeout');
      }

      console.log('Judge0 results:', JSON.stringify(results, null, 2));
      // 5. Aggregate Verdicts
      let finalStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' = 'ACCEPTED';
      let maxRuntime = 0.0;
      let maxMemory = 0;
      let finalStdout = '';
      let finalStderr = '';

      for (const res of results) {
        const verdict = this.mapJudgeStatusToVerdict(res.status.id);
        const runtime = parseFloat(res.time || '0.0');
        const memory = res.memory || 0; // memory usage in KB

        if (runtime > maxRuntime) maxRuntime = runtime;
        if (memory > maxMemory) maxMemory = memory;

        if (verdict !== 'ACCEPTED') {
          // Record the first non-accepted verdict as final
          if (finalStatus === 'ACCEPTED') {
            finalStatus = verdict;
            finalStdout = res.stdout || '';
            
            if (verdict === 'TIME_LIMIT_EXCEEDED') {
              finalStderr = 'Time Limit Exceeded: Your solution exceeded the execution limit. This typically indicates an infinite loop, an infinite recursion loop without base cases, or a suboptimal algorithm (e.g. O(N^2) nested loops on N >= 10^5).';
            } else if (verdict === 'MEMORY_LIMIT_EXCEEDED') {
              finalStderr = 'Memory Limit Exceeded: Your solution exceeded the 256MB sandbox memory limit. Check for infinite recursion call stacks or large memory leaks.';
            } else {
              let errText = res.stderr || res.compile_output || '';
              if (errText.includes('maximum recursion depth exceeded') || errText.includes('RecursionError')) {
                errText += '\n\n💡 AI Mentor Tip: Maximum recursion depth exceeded! Consider adding a proper recursion base case, optimizing memoization lookup checks, or converting the algorithm to an iterative tabulation (bottom-up) format.';
              } else if (errText.includes('StackOverflowError') || errText.includes('java.lang.StackOverflowError')) {
                errText += '\n\n💡 AI Mentor Tip: Stack Overflow detected! The call stack has run out of memory. Check if your recursion base cases return correctly and are reached before max depth.';
              } else if (errText.includes('Segmentation fault') || errText.includes('SIGSEGV')) {
                errText += '\n\n💡 AI Mentor Tip: Segmentation Fault (SIGSEGV)! This usually means your code accessed unauthorized memory. Common causes include infinite recursion leading to stack overflow, array out of bounds indexes, or uninitialized pointers.';
              }
              finalStderr = errText;
            }
          }
        }
      }

      // 6. Update database record with sanitized (truncated) output
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: finalStatus,
          judgeToken: tokens[0],
          runtime: maxRuntime,
          memory: maxMemory,
          stdout: this.sanitizeOutput(finalStdout || (results[results.length - 1]?.stdout ?? null)),
          stderr: this.sanitizeOutput(finalStderr || null),
        },
      });

      // 7. Emit complete event to SSE streams
      const testCasesResults = results.map((res, idx) => {
        const tc = testCases[idx];
        return {
          id: tc?.id,
          input: tc?.input,
          expected: tc?.expected,
          status: this.mapJudgeStatusToVerdict(res.status.id),
          runtime: parseFloat(res.time || '0.0'),
          memory: res.memory || 0,
          stdout: this.sanitizeOutput(res.stdout || ''),
          stderr: this.sanitizeOutput(res.stderr || res.compile_output || ''),
        };
      });

      let analysis: any = null;
      if (isSubmit && finalStatus === 'ACCEPTED') {
        try {
          analysis = await this.aiOrchestrator.analyzeSubmissionCode(
            submission.problem,
            submission.code,
            submission.language
          );
        } catch (err) {
          console.error('Failed to run AI performance analysis:', err.message);
        }
      }

      this.executionService.eventEmitter.emit(`status:${submissionId}`, {
        status: finalStatus,
        runtime: maxRuntime,
        memory: maxMemory,
        stdout: finalStdout || (results[results.length - 1]?.stdout ?? null),
        stderr: finalStderr || null,
        testCases: testCasesResults,
        analysis,
      });

    } catch (err) {
      console.error('Judge0 run error:', err.message);
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'COMPILATION_ERROR',
          stderr: 'Sandbox execution pipeline failure: ' + err.message,
        },
      });
      this.executionService.eventEmitter.emit(`status:${submissionId}`, {
        status: 'COMPILATION_ERROR',
        stderr: 'Sandbox execution pipeline failure: ' + err.message,
      });
    }
  }

  private wrapCode(code: string, language: string, problemTitle: string): string {
    const titleSlug = problemTitle.toLowerCase().replace(/\s+/g, '-');
    const langLower = language.toLowerCase();
    
    // 1. PYTHON DYNAMIC DRIVERS
    if (langLower === 'python') {
      const typingImports = `from __future__ import annotations
from typing import List, Dict, Tuple, Optional

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_tree_from_list(arr):
    if not arr or arr[0] is None or arr[0] == -1:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        curr = queue.pop(0)
        if i < len(arr) and arr[i] is not None and arr[i] != -1:
            curr.left = TreeNode(arr[i])
            queue.append(curr.left)
        i += 1
        if i < len(arr) and arr[i] is not None and arr[i] != -1:
            curr.right = TreeNode(arr[i])
            queue.append(curr.right)
        i += 1
    return root

def build_linked_list(arr):
    if not arr:
        return None
    dummy = ListNode(0)
    curr = dummy
    for val in arr:
        curr.next = ListNode(val)
        curr = curr.next
    return dummy.next

def tree_to_list(root):
    if not root:
        return []
    res = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            res.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            res.append(None)
    while res and res[-1] is None:
        res.pop()
    return res
`;
      const codeWithTyping = typingImports + code;

      if (titleSlug === 'contains-duplicate') {
        return `${codeWithTyping}
if __name__ == '__main__':
    import sys
    import json
    line = sys.stdin.read().strip()
    if line:
        try:
            nums = json.loads(line)
            sol = Solution()
            ans = sol.containsDuplicate(nums)
            print(json.dumps(ans))
        except Exception as e:
            print(f"Driver Error: {e}", file=sys.stderr)
            sys.exit(1)
`;
      }
      if (titleSlug === 'best-time-to-buy-and-sell-stock') {
        return `${codeWithTyping}
if __name__ == '__main__':
    import sys
    import json
    line = sys.stdin.read().strip()
    if line:
        try:
            prices = json.loads(line)
            sol = Solution()
            ans = sol.maxProfit(prices)
            print(json.dumps(ans))
        except Exception as e:
            print(f"Driver Error: {e}", file=sys.stderr)
            sys.exit(1)
`;
      }
      if (titleSlug === 'top-k-frequent-elements') {
        return `${codeWithTyping}
if __name__ == '__main__':
    import sys
    import json
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        try:
            nums = json.loads(lines[0])
            k = int(lines[1])
            sol = Solution()
            ans = sol.topKFrequent(nums, k)
            print(json.dumps(sorted(ans) if ans else []).replace(" ", ""))
        except Exception as e:
            print(f"Driver Error: {e}", file=sys.stderr)
            sys.exit(1)
`;
      }
      if (titleSlug === 'climbing-stairs') {
        return `${codeWithTyping}
if __name__ == '__main__':
    import sys
    line = sys.stdin.read().strip()
    if line:
        try:
            n = int(line)
            sol = Solution()
            ans = sol.climbStairs(n)
            print(ans)
        except Exception as e:
            print(f"Driver Error: {e}", file=sys.stderr)
            sys.exit(1)
`;
      }
      // Fallback: Dynamic Reflection for Custom Problems
      return `${codeWithTyping}
if __name__ == '__main__':
    import sys
    import json
    import inspect
    
    # Sandbox Security Lockdown: Disable system execution without breaking Python's internal threading._shutdown
    for _forbidden in ['os', 'subprocess', 'socket', 'urllib', 'requests', 'shutil', 'ctypes', 'pty']:
        sys.modules[_forbidden] = None

    # Log Bomb Protection: Cap max print() invocations to prevent output stream flooding
    import builtins
    _print_count = 0
    _orig_print = builtins.print
    def _safe_print(*args, **kwargs):
        global _print_count
        _print_count += 1
        if _print_count > 300:
            if _print_count == 301:
                _orig_print("\\n[Output Truncated: Exceeded maximum 300 print calls to prevent log flooding]")
            return
        _orig_print(*args, **kwargs)
    builtins.print = _safe_print
    
    stdin_content = sys.stdin.read()
    lines = [line.strip() for line in stdin_content.splitlines() if line.strip()]
    
    try:
        sol = Solution()
        methods = [m for m in dir(sol) if not m.startswith('__') and callable(getattr(sol, m))]
        if not methods:
            raise Exception("No callable methods found on Solution class")
        
        method_name = 'solve'
        if 'solve' in methods:
            method_name = 'solve'
        elif len(methods) > 0:
            method_name = methods[0]
            
        method = getattr(sol, method_name)
        sig = inspect.signature(method)
        params = list(sig.parameters.values())
        
        args = []
        for i, param in enumerate(params):
            if i >= len(lines):
                break
            val_str = lines[i]
            try:
                parsed_val = json.loads(val_str)
            except Exception:
                if val_str.lower() in ('true', 'false'):
                    parsed_val = val_str.lower() == 'true'
                else:
                    try:
                        parsed_val = int(val_str)
                    except ValueError:
                        try:
                            parsed_val = float(val_str)
                        except ValueError:
                            parsed_val = val_str
            if isinstance(parsed_val, list):
                p_name = param.name.lower()
                p_anno = str(param.annotation).lower()
                if 'treenode' in p_anno or p_name in ('root', 'tree'):
                    parsed_val = build_tree_from_list(parsed_val)
                elif 'listnode' in p_anno or p_name in ('head', 'node'):
                    parsed_val = build_linked_list(parsed_val)

            args.append(parsed_val)
            
        ans = method(*args)
        if isinstance(ans, TreeNode):
            print(json.dumps(tree_to_list(ans)))
        elif isinstance(ans, (list, dict, bool, int, float, str)) or ans is None:
            print(json.dumps(ans))
        else:
            print(ans)
    except Exception as e:
        print(f"Driver Error: {e}", file=sys.stderr)
        sys.exit(1)
`;
    }
    
    // 2. JAVASCRIPT DYNAMIC DRIVERS
    if (langLower === 'javascript') {
      if (titleSlug === 'contains-duplicate') {
        return `${code}
const fs = require('fs');
try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (input) {
        const nums = JSON.parse(input);
        const sol = new Solution();
        const ans = sol.containsDuplicate(nums);
        console.log(JSON.stringify(ans));
    }
} catch (e) {
    console.error("Driver Error:", e);
    process.exit(1);
}
`;
      }
      if (titleSlug === 'best-time-to-buy-and-sell-stock') {
        return `${code}
const fs = require('fs');
try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (input) {
        const prices = JSON.parse(input);
        const sol = new Solution();
        const ans = sol.maxProfit(prices);
        console.log(JSON.stringify(ans));
    }
} catch (e) {
    console.error("Driver Error:", e);
    process.exit(1);
}
`;
      }
      if (titleSlug === 'climbing-stairs') {
        return `${code}
const fs = require('fs');
try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (input) {
        const n = parseInt(input);
        const sol = new Solution();
        const ans = sol.climbStairs(n);
        console.log(JSON.stringify(ans));
    }
} catch (e) {
    console.error("Driver Error:", e);
    process.exit(1);
}
`;
      }
      if (titleSlug === 'top-k-frequent-elements') {
        return `${code}
const fs = require('fs');
try {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\n');
    if (lines.length >= 2) {
        const nums = JSON.parse(lines[0]);
        const k = parseInt(lines[1]);
        const sol = new Solution();
        const ans = sol.topKFrequent(nums, k);
        console.log(JSON.stringify(ans ? ans.sort((a,b)=>a-b) : []));
    }
} catch (e) {
    console.error("Driver Error:", e);
    process.exit(1);
}
`;
      }
      // Fallback: Dynamic Reflection for Custom Problems
      return `${code}
const fs = require('fs');
try {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\n').map(l => l.trim()).filter(l => l);
    const sol = new Solution();
    
    const proto = Object.getPrototypeOf(sol);
    const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof sol[m] === 'function');
    if (methods.length === 0) {
        throw new Error("No custom methods found on Solution class");
    }
    
    let methodName = 'solve';
    if (methods.includes('solve')) {
        methodName = 'solve';
    } else {
        methodName = methods[0];
    }
    
    const args = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch (err) {
            if (line.toLowerCase() === 'true') return true;
            if (line.toLowerCase() === 'false') return false;
            if (!isNaN(line)) return Number(line);
            return line;
        }
    });

    const ans = sol[methodName](...args);
    console.log(JSON.stringify(ans));
} catch (e) {
    console.error("Driver Error:", e.message || e);
    process.exit(1);
}
`;
    }

    // 3. JAVA DYNAMIC DRIVERS
    if (langLower === 'java') {
      if (titleSlug === 'contains-duplicate') {
        return `${code}
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            String cleanNums = line.trim().substring(1, line.trim().length() - 1);
            int[] nums;
            if (cleanNums.trim().isEmpty()) {
                nums = new int[0];
            } else {
                String[] items = cleanNums.split(",");
                nums = new int[items.length];
                for (int i = 0; i < items.length; i++) {
                    nums[i] = Integer.parseInt(items[i].trim());
                }
            }
            Solution sol = new Solution();
            System.out.println(sol.containsDuplicate(nums));
        }
    }
}
`;
      }
      if (titleSlug === 'best-time-to-buy-and-sell-stock') {
        return `${code}
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            String cleanNums = line.trim().substring(1, line.trim().length() - 1);
            int[] prices;
            if (cleanNums.trim().isEmpty()) {
                prices = new int[0];
            } else {
                String[] items = cleanNums.split(",");
                prices = new int[items.length];
                for (int i = 0; i < items.length; i++) {
                    prices[i] = Integer.parseInt(items[i].trim());
                }
            }
            Solution sol = new Solution();
            System.out.println(sol.maxProfit(prices));
        }
    }
}
`;
      }
      if (titleSlug === 'climbing-stairs') {
        return `${code}
import java.io.BufferedReader;
import java.io.InputStreamReader;
public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            int n = Integer.parseInt(line.trim());
            Solution sol = new Solution();
            System.out.println(sol.climbStairs(n));
        }
    }
}
`;
      }
      if (titleSlug === 'top-k-frequent-elements') {
        return `${code}
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line1 = br.readLine();
        String line2 = br.readLine();
        if (line1 != null && line2 != null) {
            String cleanNums = line1.trim().substring(1, line1.trim().length() - 1);
            int[] nums;
            if (cleanNums.trim().isEmpty()) {
                nums = new int[0];
            } else {
                String[] items = cleanNums.split(",");
                nums = new int[items.length];
                for (int i = 0; i < items.length; i++) {
                    nums[i] = Integer.parseInt(items[i].trim());
                }
            }
            int k = Integer.parseInt(line2.trim());
            Solution sol = new Solution();
            int[] ans = sol.topKFrequent(nums, k);
            if (ans != null) {
                Arrays.sort(ans);
            }
            System.out.println(Arrays.toString(ans).replace(" ", ""));
        }
    }
}
`;
      }
      // Fallback: Dynamic Reflection for Custom Problems
      const parsed = this.parseMethodSignature(code, 'java');
      if (parsed) {
        let readStmts = '';
        let callArgs: string[] = [];
        
        parsed.args.forEach((arg, i) => {
          const type = arg.type.trim();
          const varName = `arg_${i}`;
          callArgs.push(varName);
          
          if (type === 'int[]') {
            readStmts += `
            String line_${i} = br.readLine();
            int[] ${varName};
            if (line_${i} == null) {
                ${varName} = new int[0];
            } else {
                String clean = line_${i}.trim();
                if (clean.startsWith("[")) clean = clean.substring(1);
                if (clean.endsWith("]")) clean = clean.substring(0, clean.length() - 1);
                if (clean.trim().isEmpty()) {
                    ${varName} = new int[0];
                } else {
                    String[] items = clean.split(",");
                    ${varName} = new int[items.length];
                    for (int idx = 0; idx < items.length; idx++) {
                        ${varName}[idx] = Integer.parseInt(items[idx].trim());
                    }
                }
            }
`;
          } else if (type === 'int') {
            readStmts += `
            String line_${i} = br.readLine();
            int ${varName} = (line_${i} != null) ? Integer.parseInt(line_${i}.trim()) : 0;
`;
          } else if (type === 'String') {
            readStmts += `
            String line_${i} = br.readLine();
            String ${varName} = (line_${i} != null) ? line_${i}.trim() : "";
            if (${varName}.startsWith("\"") && ${varName}.endsWith("\"")) {
                ${varName} = ${varName}.substring(1, ${varName}.length() - 1);
            }
`;
          } else {
            readStmts += `
            String line_${i} = br.readLine();
            String ${varName} = (line_${i} != null) ? line_${i}.trim() : "";
`;
          }
        });
        
        const printStmt = parsed.returnType.includes('[]')
          ? `System.out.println(Arrays.toString(ans).replace(" ", ""));`
          : `System.out.println(ans);`;
          
        return `${code}
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        try {
            ${readStmts}
            Solution sol = new Solution();
            ${parsed.returnType} ans = sol.${parsed.name}(${callArgs.join(', ')});
            ${printStmt}
        } catch (Exception e) {
            System.err.println("Driver Error: " + e.getMessage());
            System.exit(1);
        }
    }
}
`;
      }
    }

    // 4. C++ DYNAMIC DRIVERS
    if (langLower === 'cpp') {
      if (titleSlug === 'contains-duplicate') {
        return `${code}
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> nums;
        std::string clean = line;
        if (!clean.empty() && clean.front() == '[') clean.erase(clean.begin());
        if (!clean.empty() && clean.back() == ']') clean.pop_back();
        std::stringstream ss(clean);
        std::string item;
        while (std::getline(ss, item, ',')) {
            if (!item.empty()) {
                nums.push_back(std::stoi(item));
            }
        }
        Solution sol;
        std::cout << (sol.containsDuplicate(nums) ? "true" : "false") << std::endl;
    }
    return 0;
}
`;
      }
      if (titleSlug === 'best-time-to-buy-and-sell-stock') {
        return `${code}
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
int main() {
    std::string line;
    if (std::getline(std::cin, line)) {
        std::vector<int> prices;
        std::string clean = line;
        if (!clean.empty() && clean.front() == '[') clean.erase(clean.begin());
        if (!clean.empty() && clean.back() == ']') clean.pop_back();
        std::stringstream ss(clean);
        std::string item;
        while (std::getline(ss, item, ',')) {
            if (!item.empty()) {
                prices.push_back(std::stoi(item));
            }
        }
        Solution sol;
        std::cout << sol.maxProfit(prices) << std::endl;
    }
    return 0;
}
`;
      }
      if (titleSlug === 'climbing-stairs') {
        return `${code}
#include <iostream>
int main() {
    int n;
    if (std::cin >> n) {
        Solution sol;
        std::cout << sol.climbStairs(n) << std::endl;
    }
    return 0;
}
`;
      }
      if (titleSlug === 'top-k-frequent-elements') {
        return `${code}
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>

int main() {
    std::string line1, line2;
    if (std::getline(std::cin, line1) && std::getline(std::cin, line2)) {
        std::vector<int> nums;
        std::string clean = line1;
        if (!clean.empty() && clean.front() == '[') clean.erase(clean.begin());
        if (!clean.empty() && clean.back() == ']') clean.pop_back();
        std::stringstream ss(clean);
        std::string item;
        while (std::getline(ss, item, ',')) {
            if (!item.empty()) {
                nums.push_back(std::stoi(item));
            }
        }
        int k = std::stoi(line2);
        Solution sol;
        std::vector<int> ans = sol.topKFrequent(nums, k);
        std::sort(ans.begin(), ans.end());
        std::cout << "[";
        for (size_t i = 0; i < ans.size(); i++) {
            std::cout << ans[i];
            if (i < ans.size() - 1) std::cout << ",";
        }
        std::cout << "]\n";
    }
    return 0;
}
`;
      }
      // Fallback: Dynamic Reflection for Custom Problems
      const parsed = this.parseMethodSignature(code, 'cpp');
      if (parsed) {
        let readStmts = '';
        let callArgs: string[] = [];
        
        parsed.args.forEach((arg, i) => {
          const type = arg.type.replace('&', '').replace('const', '').trim();
          const varName = `arg_${i}`;
          callArgs.push(varName);
          
          if (type === 'vector<int>' || type === 'std::vector<int>') {
            readStmts += `
        std::string line_${i};
        std::vector<int> ${varName};
        if (std::getline(std::cin, line_${i})) {
            std::string clean = line_${i};
            if (!clean.empty() && clean.front() == '[') clean.erase(clean.begin());
            if (!clean.empty() && clean.back() == ']') clean.pop_back();
            std::stringstream ss(clean);
            std::string item;
            while (std::getline(ss, item, ',')) {
                if (!item.empty()) {
                    ${varName}.push_back(std::stoi(item));
                }
            }
        }
`;
          } else if (type === 'int') {
            readStmts += `
        int ${varName} = 0;
        std::cin >> ${varName};
        std::string dummy_${i};
        std::getline(std::cin, dummy_${i});
`;
          } else if (type === 'string' || type === 'std::string') {
            readStmts += `
        std::string ${varName};
        std::getline(std::cin, ${varName});
        if (!${varName}.empty() && ${varName}.front() == '"') ${varName}.erase(${varName}.begin());
        if (!${varName}.empty() && ${varName}.back() == '"') ${varName}.pop_back();
`;
          }
        });
        
        let printStmt = '';
        if (parsed.returnType.includes('vector') || parsed.returnType.includes('std::vector')) {
          printStmt = `
        std::cout << "[";
        for (size_t idx = 0; idx < ans.size(); idx++) {
            std::cout << ans[idx];
            if (idx < ans.size() - 1) std::cout << ",";
        }
        std::cout << "]\\n";
`;
        } else if (parsed.returnType === 'bool') {
          printStmt = `std::cout << (ans ? "true" : "false") << std::endl;`;
        } else {
          printStmt = `std::cout << ans << std::endl;`;
        }
        
        return `${code}
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>

int main() {
    try {
        ${readStmts}
        Solution sol;
        auto ans = sol.${parsed.name}(${callArgs.join(', ')});
        ${printStmt}
    } catch (const std::exception& e) {
        std::cerr << "Driver Error: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
`;
      }
    }

    return code;
  }

  private parseMethodSignature(code: string, language: string): { name: string; returnType: string; args: Array<{ type: string; name: string }> } | null {
    try {
      const langLower = language.toLowerCase();
      if (langLower === 'java') {
        const regex = /public\s+([A-Za-z0-9_<>[\]\s]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/;
        const match = code.match(regex);
        if (match) {
          const returnType = match[1].trim();
          const name = match[2].trim();
          const paramsStr = match[3].trim();
          const args = paramsStr ? paramsStr.split(',').map(p => {
            const parts = p.trim().split(/\s+/);
            const name = parts.pop() || '';
            const type = parts.join(' ');
            return { type, name };
          }) : [];
          return { name, returnType, args };
        }
      } else if (langLower === 'cpp') {
        const regex = /(?:virtual\s+)?([A-Za-z0-9_<>&*[\]\s]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/;
        const matches = [...code.matchAll(new RegExp(regex, 'g'))];
        for (const match of matches) {
          const returnType = match[1].trim();
          const name = match[2].trim();
          const paramsStr = match[3].trim();
          if (name !== 'Solution' && !returnType.includes('class') && !returnType.includes('private') && !returnType.includes('public')) {
            const args = paramsStr ? paramsStr.split(',').map(p => {
              const parts = p.trim().split(/\s+/);
              const name = parts.pop() || '';
              const type = parts.join(' ');
              return { type, name };
            }) : [];
            return { name, returnType, args };
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse method signature:', e);
    }
    return null;
  }

  private sanitizeOutput(output: string | null | undefined, maxChars = 20000): string {
    if (!output) return '';
    if (output.length > maxChars) {
      return output.slice(0, maxChars) + `\n... [Output Truncated: Exceeded Maximum ${maxChars} Characters Limit]`;
    }
    return output;
  }

  private analyzeCode(code: string, language: string) {
    const codeClean = code.replace(/\s+/g, ' ');
    
    let method = 'Brute Force (Nested Loops)';
    let timeComplexity = 'O(N^2)';
    let spaceComplexity = 'O(1)';
    let avgTime = 0.12;
    let feedback = 'Your solution uses nested loops to check all pairs of numbers. While correct, it has a quadratic time complexity of O(N^2), which will run very slowly on large inputs. You can optimize this to O(N) using a Hash Map to store seen numbers and look up the complement in O(1) time.';
    
    const hasMapInPython = language === 'python' && (codeClean.includes('seen') || codeClean.includes('dict') || codeClean.includes('{}') || codeClean.includes('map'));
    const hasMapInJS = language === 'javascript' && (codeClean.includes('Map') || codeClean.includes('seen') || codeClean.includes('{}') || codeClean.includes('obj'));
    const hasMapInJava = language === 'java' && (codeClean.includes('HashMap') || codeClean.includes('Map'));
    const hasMapInCpp = language === 'cpp' && (codeClean.includes('unordered_map') || codeClean.includes('map'));
    
    if (hasMapInPython || hasMapInJS || hasMapInJava || hasMapInCpp) {
      method = 'Single-Pass Hash Map Lookup';
      timeComplexity = 'O(N)';
      spaceComplexity = 'O(N)';
      avgTime = 0.04;
      feedback = 'Excellent! Your solution utilizes a Hash Map to achieve linear time complexity O(N). By storing numbers as keys and their index as value, you look up the target complement in O(1) average time. This is the optimal time-complexity solution for the Two Sum problem.';
    }

    return {
      method,
      timeComplexity,
      spaceComplexity,
      avgTime,
      feedback
    };
  }
}
