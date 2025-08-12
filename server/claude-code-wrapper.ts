import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface ClaudeCodeResponse {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export class ClaudeCodeWrapper {
  private isConfigured: boolean = false;

  constructor() {
    this.checkConfiguration();
  }

  private async checkConfiguration(): Promise<void> {
    try {
      // Check if Claude Code is authenticated
      const { stdout, stderr } = await execAsync('claude config ls 2>/dev/null || echo "not_configured"');
      this.isConfigured = !stdout.includes('not_configured') && !stderr;
    } catch (error) {
      this.isConfigured = false;
    }
  }

  public async executeQuery(prompt: string, options: {
    workingDirectory?: string;
    timeout?: number;
    allowedTools?: string[];
    model?: string;
  } = {}): Promise<ClaudeCodeResponse> {
    const startTime = Date.now();

    try {
      // If not configured, return helpful setup instructions
      if (!this.isConfigured) {
        return {
          success: false,
          output: '',
          error: `Claude Code needs authentication. Please run these commands in the terminal:

1. First, try: claude config ls
2. If not authenticated, you need to set up authentication with your Claude subscription
3. Note: Interactive mode doesn't work in this environment, but we can use --print mode

Alternative: You can use Claude Code in non-interactive mode once authenticated.`,
          executionTime: Date.now() - startTime
        };
      }

      // Build the command
      const claudeArgs = [
        '--print',
        '--output-format', 'text',
        ...(options.model ? ['--model', options.model] : []),
        ...(options.allowedTools ? ['--allowedTools', ...options.allowedTools] : []),
        prompt
      ];

      // Execute Claude Code in non-interactive mode
      const result = await this.runClaudeCommand(claudeArgs, {
        cwd: options.workingDirectory || process.cwd(),
        timeout: options.timeout || 30000
      });

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.exitCode !== 0 ? result.stderr : undefined,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime
      };
    }
  }

  private runClaudeCommand(args: string[], options: {
    cwd: string;
    timeout: number;
  }): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve) => {
      const child = spawn('claude', args, {
        cwd: options.cwd,
        env: {
          ...process.env,
          // Disable interactive features
          CI: 'true',
          NO_COLOR: '1'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          child.kill('SIGTERM');
          resolve({
            stdout,
            stderr: stderr + '\nCommand timed out',
            exitCode: 124
          });
        }
      }, options.timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            stdout,
            stderr,
            exitCode: code || 0
          });
        }
      });

      child.on('error', (error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            stdout,
            stderr: stderr + error.message,
            exitCode: 1
          });
        }
      });
    });
  }

  public async getAuthStatus(): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync('claude config ls 2>&1');
      if (stderr.includes('Error') || stdout.includes('not found')) {
        return 'Not authenticated - run setup in terminal';
      }
      return 'Authenticated and ready';
    } catch (error) {
      return 'Unknown status - check terminal';
    }
  }

  public getSetupInstructions(): string {
    return `
To set up Claude Code with your subscription:

1. **Check current status:**
   claude config ls

2. **If not authenticated, you have these options:**
   
   Option A - Manual config (if you have auth token):
   claude config set -g auth.token "your-token-here"
   
   Option B - Try the print mode directly:
   claude --print "hello world"
   
3. **Once authenticated, you can use:**
   claude --print "your prompt here"
   claude --print --model sonnet "your prompt"
   claude --print --allowedTools "Bash,Edit" "your prompt"

Note: Interactive mode (claude without --print) doesn't work in this environment.
Use the --print flag for all commands.
`;
  }
}

export const claudeCodeWrapper = new ClaudeCodeWrapper();