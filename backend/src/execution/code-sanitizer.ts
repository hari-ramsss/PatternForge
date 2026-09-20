export interface SecurityCheckResult {
  isSafe: boolean;
  violationReason?: string;
  blockedPattern?: string;
}

export class CodeSanitizer {
  private static forbiddenPython = [
    { pattern: /\bimport\s+os\b/, reason: "Access to system 'os' module is strictly forbidden in the sandbox environment." },
    { pattern: /\bfrom\s+os\s+import\b/, reason: "Access to system 'os' module is strictly forbidden in the sandbox environment." },
    { pattern: /\bimport\s+subprocess\b/, reason: "Process creation via 'subprocess' is strictly forbidden." },
    { pattern: /\bfrom\s+subprocess\s+import\b/, reason: "Process creation via 'subprocess' is strictly forbidden." },
    { pattern: /\bimport\s+sys\b/, reason: "Access to system 'sys' module is restricted in user solutions." },
    { pattern: /\bfrom\s+sys\s+import\b/, reason: "Access to system 'sys' module is restricted in user solutions." },
    { pattern: /\bimport\s+socket\b/, reason: "Network access via 'socket' is strictly forbidden." },
    { pattern: /\bimport\s+urllib\b/, reason: "Network access via 'urllib' is strictly forbidden." },
    { pattern: /\bimport\s+requests\b/, reason: "Network access via 'requests' is strictly forbidden." },
    { pattern: /\bimport\s+ctypes\b/, reason: "Low-level memory access via 'ctypes' is strictly forbidden." },
    { pattern: /\bimport\s+multiprocessing\b/, reason: "Multiprocessing execution is forbidden." },
    { pattern: /\bimport\s+threading\b/, reason: "Multithreading execution is forbidden." },
    { pattern: /\bimport\s+shutil\b/, reason: "File system operations via 'shutil' are forbidden." },
    { pattern: /\bimport\s+builtins\b/, reason: "Direct access to module 'builtins' is forbidden." },
    { pattern: /\b__import__\b/, reason: "Dynamic module importing via '__import__' is forbidden." },
    { pattern: /\bexec\s*\(/, reason: "Dynamic code execution via 'exec()' is forbidden." },
    { pattern: /\beval\s*\(/, reason: "Dynamic code evaluation via 'eval()' is forbidden." },
    { pattern: /\bopen\s*\(/, reason: "Direct file system access via 'open()' is forbidden." },
    { pattern: /\bglobals\s*\(/, reason: "Global environment reflection via 'globals()' is forbidden." },
    { pattern: /\blocals\s*\(/, reason: "Local environment reflection via 'locals()' is forbidden." },
    { pattern: /\bgetattr\s*\(/, reason: "Reflection via 'getattr()' is forbidden." },
    { pattern: /\bsetattr\s*\(/, reason: "Reflection via 'setattr()' is forbidden." },
  ];

  private static forbiddenJS = [
    { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, reason: "Process execution via 'child_process' is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, reason: "File system access via 'fs' is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, reason: "Network socket access via 'net' is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, reason: "Network access via 'http' is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, reason: "Network access via 'https' is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]os['"]\s*\)/, reason: "Access to system 'os' module is strictly forbidden." },
    { pattern: /\brequire\s*\(\s*['"]process['"]\s*\)/, reason: "Access to system 'process' module is strictly forbidden." },
    { pattern: /\bimport\s+.*\s+from\s+['"]fs['"]/, reason: "File system access via 'fs' is strictly forbidden." },
    { pattern: /\bimport\s+.*\s+from\s+['"]child_process['"]/, reason: "Process execution via 'child_process' is strictly forbidden." },
    { pattern: /\bprocess\.env\b/, reason: "Access to environment variables via 'process.env' is strictly forbidden." },
    { pattern: /\bprocess\.exit\b/, reason: "Process termination via 'process.exit' is strictly forbidden." },
    { pattern: /\bprocess\.mainModule\b/, reason: "Module reflection via 'process.mainModule' is forbidden." },
    { pattern: /\beval\s*\(/, reason: "Dynamic code execution via 'eval()' is strictly forbidden." },
    { pattern: /\bFunction\s*\(/, reason: "Dynamic function construction via 'Function()' is strictly forbidden." },
  ];

  private static forbiddenCpp = [
    { pattern: /#include\s*<fstream>/, reason: "File stream access via '<fstream>' is strictly forbidden." },
    { pattern: /#include\s*<cstdlib>/, reason: "System utility header '<cstdlib>' is restricted." },
    { pattern: /#include\s*<unistd\.h>/, reason: "POSIX system calls via '<unistd.h>' are strictly forbidden." },
    { pattern: /#include\s*<sys\//, reason: "Low-level OS system headers under '<sys/*>' are strictly forbidden." },
    { pattern: /\bsystem\s*\(/, reason: "Shell command execution via 'system()' is strictly forbidden." },
    { pattern: /\bpopen\s*\(/, reason: "Process pipe creation via 'popen()' is strictly forbidden." },
    { pattern: /\bfork\s*\(/, reason: "Process cloning via 'fork()' is strictly forbidden." },
    { pattern: /\bremove\s*\(/, reason: "File system deletion via 'remove()' is strictly forbidden." },
    { pattern: /\brename\s*\(/, reason: "File renaming via 'rename()' is strictly forbidden." },
  ];

  private static forbiddenJava = [
    { pattern: /\bjava\.io\.File\b/, reason: "File system access via 'java.io.File' is strictly forbidden." },
    { pattern: /\bProcessBuilder\b/, reason: "Process creation via 'ProcessBuilder' is strictly forbidden." },
    { pattern: /\bRuntime\.getRuntime\s*\(\s*\)/, reason: "System runtime access via 'Runtime.getRuntime()' is strictly forbidden." },
    { pattern: /\bSystem\.exit\b/, reason: "Sandbox termination via 'System.exit' is strictly forbidden." },
    { pattern: /\bjava\.net\b/, reason: "Network access via 'java.net' is strictly forbidden." },
    { pattern: /\bjava\.lang\.reflect\b/, reason: "Reflection access via 'java.lang.reflect' is forbidden." },
  ];

  public static validateCode(code: string, language: string): SecurityCheckResult {
    if (!code) return { isSafe: true };
    const langLower = language.toLowerCase();

    // Strip comments to prevent false positive triggers inside comments
    const codeWithoutComments = this.stripComments(code, langLower);

    let rules: Array<{ pattern: RegExp; reason: string }> = [];

    if (langLower === 'python') {
      rules = this.forbiddenPython;
    } else if (langLower === 'javascript' || langLower === 'typescript') {
      rules = this.forbiddenJS;
    } else if (langLower === 'cpp' || langLower === 'c') {
      rules = this.forbiddenCpp;
    } else if (langLower === 'java') {
      rules = this.forbiddenJava;
    }

    for (const rule of rules) {
      if (rule.pattern.test(codeWithoutComments)) {
        return {
          isSafe: false,
          violationReason: rule.reason,
          blockedPattern: rule.pattern.toString(),
        };
      }
    }

    return { isSafe: true };
  }

  private static stripComments(code: string, language: string): string {
    if (language === 'python') {
      return code
        .replace(/#.*$/gm, '')
        .replace(/'''[\s\S]*?'''/g, '')
        .replace(/"""[\s\S]*?"""/g, '');
    } else {
      return code
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
    }
  }
}
