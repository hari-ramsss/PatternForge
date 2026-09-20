import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LOCAL_LEETCODE_DATABASE: Record<string, any> = {
  'contains-duplicate': {
    title: 'Contains Duplicate',
    difficulty: 'EASY',
    topic: 'arrays',
    optimalTime: 'O(N)',
    optimalSpace: 'O(N)',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.\n\nExample 1:\nInput: nums = [1,2,3,1]\nOutput: true\n\nExample 2:\nInput: nums = [1,2,3,4]\nOutput: false',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^9 <= nums[i] <= 10^9'
    ],
    examples: [
      { input: '[1,2,3,1]', output: 'true', explanation: '1 appears twice at indices 0 and 3.' },
      { input: '[1,2,3,4]', output: 'false', explanation: 'All elements are distinct.' }
    ],
    starterCodes: [
      { language: 'python', boilerplate: 'class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        # Write your code here\n        pass' },
      { language: 'javascript', boilerplate: 'class Solution {\n    containsDuplicate(nums) {\n        // Write your code here\n    }\n}' },
      { language: 'java', boilerplate: 'import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your code here\n        return false;\n    }\n}' },
      { language: 'cpp', boilerplate: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your code here\n        return false;\n    }\n};' }
    ],
    testCases: [
      { input: '[1,2,3,1]\n', expected: 'true', isPublic: true },
      { input: '[1,2,3,4]\n', expected: 'false', isPublic: true },
      { input: '[1,1,1,3,3,4,3,2,4,2]\n', expected: 'true', isPublic: false }
    ]
  },
  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'EASY',
    topic: 'arrays',
    optimalTime: 'O(N)',
    optimalSpace: 'O(1)',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.\n\nExample 1:\nInput: prices = [7,1,5,3,6,4]\nOutput: 5',
    constraints: [
      '1 <= prices.length <= 10^5',
      '0 <= prices[i] <= 10^4'
    ],
    examples: [
      { input: '[7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' }
    ],
    starterCodes: [
      { language: 'python', boilerplate: 'class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your code here\n        pass' },
      { language: 'javascript', boilerplate: 'class Solution {\n    maxProfit(prices) {\n        // Write your code here\n    }\n}' },
      { language: 'java', boilerplate: 'import java.util.*;\n\nclass Solution {\n    public int maxProfit(int[] prices) {\n        // Write your code here\n        return 0;\n    }\n}' },
      { language: 'cpp', boilerplate: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your code here\n        return 0;\n    }\n};' }
    ],
    testCases: [
      { input: '[7,1,5,3,6,4]\n', expected: '5', isPublic: true },
      { input: '[7,6,4,3,1]\n', expected: '0', isPublic: true }
    ]
  },
  'climbing-stairs': {
    title: 'Climbing Stairs',
    difficulty: 'EASY',
    topic: 'dp',
    optimalTime: 'O(N)',
    optimalSpace: 'O(1)',
    description: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?\n\nExample 1:\nInput: n = 2\nOutput: 2',
    constraints: [
      '1 <= n <= 45'
    ],
    examples: [
      { input: '2', output: '2', explanation: '1 step + 1 step, or 2 steps.' }
    ],
    starterCodes: [
      { language: 'python', boilerplate: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        pass' },
      { language: 'javascript', boilerplate: 'class Solution {\n    climbStairs(n) {\n        // Write your code here\n    }\n}' },
      { language: 'java', boilerplate: 'import java.util.*;\n\nclass Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n}' },
      { language: 'cpp', boilerplate: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n        return 0;\n    }\n};' }
    ],
    testCases: [
      { input: '2\n', expected: '2', isPublic: true },
      { input: '3\n', expected: '3', isPublic: true },
      { input: '5\n', expected: '8', isPublic: false }
    ]
  }
};

@Injectable()
export class LeetcodeSyncService {
  private readonly logger = new Logger(LeetcodeSyncService.name);

  constructor(private prisma: PrismaService) {}

  async syncProblem(slug: string): Promise<any> {
    const cleanSlug = slug.toLowerCase().trim();

    // 1. Check if problem already exists in our DB by ID or title
    const existing = await this.prisma.problem.findFirst({
      where: {
        OR: [
          { id: cleanSlug },
          { id: slug },
          { title: { equals: cleanSlug.replace(/-/g, ' '), mode: 'insensitive' } },
          { title: { equals: cleanSlug, mode: 'insensitive' } },
        ],
      },
      include: {
        starterCodes: true,
        testCases: true,
      },
    });

    if (existing) {
      return existing;
    }

    // 2. Try falling back to our progressive local index map
    let rawProb = LOCAL_LEETCODE_DATABASE[cleanSlug];

    // 3. If not in fallback index, query the live LeetCode GraphQL API
    if (!rawProb) {
      try {
        const query = `
          query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              titleSlug
              content
              difficulty
              codeSnippets {
                lang
                langSlug
                code
              }
            }
          }
        `;
        const response = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            query,
            variables: { titleSlug: cleanSlug },
          }),
        });

        if (response.ok) {
          const resJson = await response.json();
          const q = resJson.data?.question;
          if (q) {
            const cleanDesc = q.content ? this.parseLeetcodeHtmlToMarkdown(q.content) : '';
            const starterCodes = (q.codeSnippets || [])
              .filter((snip: any) => ['python', 'javascript', 'java', 'cpp'].includes(snip.langSlug))
              .map((snip: any) => ({
                language: snip.langSlug === 'cpp' ? 'cpp' : snip.langSlug === 'python3' ? 'python' : snip.langSlug,
                boilerplate: snip.code,
              }));

            const testCases: any[] = [];
            // Basic extraction attempts from description HTML
            const exampleMatches = q.content ? [...q.content.matchAll(/Input:<\/strong>\s*(.*?)\s*<br>/g)] : [];
            const outputMatches = q.content ? [...q.content.matchAll(/Output:<\/strong>\s*(.*?)\s*<\/pre>/g)] : [];

            for (let i = 0; i < Math.min(exampleMatches.length, 3); i++) {
              testCases.push({
                input: exampleMatches[i]?.[1] || '',
                expected: outputMatches[i]?.[1] || '',
                isPublic: i < 2,
              });
            }

            rawProb = {
              title: q.title,
              difficulty: q.difficulty.toUpperCase(),
              topic: 'arrays',
              optimalTime: 'O(N)',
              optimalSpace: 'O(N)',
              description: cleanDesc,
              constraints: ['1 <= nums.length <= 10^5'],
              examples: [],
              starterCodes,
              testCases,
            };
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch ${cleanSlug} from LeetCode GraphQL: ${err.message}`);
      }
    }

    if (!rawProb) {
      throw new Error(`Problem slug "${cleanSlug}" is not supported offline or LeetCode API is unreachable.`);
    }

    // 4. Save the synchronized model to PostgreSQL DB
    const problem = await this.prisma.problem.create({
      data: {
        title: rawProb.title,
        description: rawProb.description,
        difficulty: rawProb.difficulty,
        topic: rawProb.topic,
        optimalTime: rawProb.optimalTime,
        optimalSpace: rawProb.optimalSpace,
        constraints: {
          create: (rawProb.constraints || []).map((stmt: string) => ({
            statement: stmt,
          })),
        },
        examples: {
          create: (rawProb.examples || []).map((ex: any) => ({
            input: ex.input,
            output: ex.output,
            explanation: ex.explanation,
          })),
        },
        starterCodes: {
          create: (rawProb.starterCodes || []).map((sc: any) => ({
            language: sc.language,
            boilerplate: sc.boilerplate,
          })),
        },
        testCases: {
          create: (rawProb.testCases || []).map((tc: any) => ({
            input: tc.input,
            expected: tc.expected,
            isPublic: tc.isPublic,
          })),
        },
      },
      include: {
        starterCodes: true,
        testCases: true,
      },
    });

    return problem;
  }

  private parseLeetcodeHtmlToMarkdown(html: string): string {
    if (!html) return '';
    let md = html;
    md = md.replace(/<sup>(.*?)<\/sup>/gi, '^$1');
    md = md.replace(/<sub>(.*?)<\/sub>/gi, '_$1');
    md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    md = md.replace(/<pre>(.*?)<\/pre>/gis, '\n```\n$1\n```\n');
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<li>/gi, '\n* ');
    md = md.replace(/<\/li>/gi, '');
    md = md.replace(/<ul>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol>/gi, '\n');
    md = md.replace(/<\/ol>/gi, '\n');
    md = md.replace(/<p>/gi, '\n\n');
    md = md.replace(/<\/p>/gi, '');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    md = md.replace(/<[^>]*>/g, '');
    md = md
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&middot;/g, '·')
      .replace(/&deg;/g, '°')
      .replace(/&ge;/g, '≥')
      .replace(/&le;/g, '≤');
    return md.trim();
  }
}
