import { controller, respond } from 'snice';
import type { TerminalCommandRequest, TerminalCommandResponse } from './snice-terminal.types';

@controller('demo-terminal-controller')
export class DemoTerminalController {
  element!: HTMLElement;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach(element: HTMLElement) {
    // Cleanup if needed
  }

  @respond('terminal-command')
  async handleCommand(request: TerminalCommandRequest): Promise<TerminalCommandResponse> {
    const { command, args, cwd } = request;

    switch (command) {
      case 'help':
        return {
          output: this.getHelpText(),
          exitCode: 0
        };

      case 'echo':
        return {
          output: args.join(' '),
          exitCode: 0
        };

      case 'clear':
        // Return a special response that tells terminal to clear itself
        return {
          output: '\x1B[CLEAR]', // Special marker for terminal to clear
          exitCode: 0
        };

      case 'history':
        if (request.history && request.history.length > 0) {
          return {
            output: request.history.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n'),
            exitCode: 0
          };
        }
        return {
          output: 'No commands in history',
          exitCode: 0
        };

      case 'pwd':
        return {
          output: cwd || '~',
          exitCode: 0
        };

      case 'date':
        return {
          output: new Date().toString(),
          exitCode: 0
        };

      case 'whoami':
        return {
          output: 'demo-user',
          exitCode: 0
        };

      case 'ls':
        return {
          output: this.getListing(args),
          exitCode: 0
        };

      case 'cat':
        if (args.length === 0) {
          return {
            error: 'cat: missing file operand',
            exitCode: 1
          };
        }
        return {
          output: `Contents of ${args[0]}:\nThis is a demo file.\nLine 2\nLine 3`,
          exitCode: 0
        };

      case 'uname':
        const flag = args[0];
        if (flag === '-a') {
          return {
            output: 'Snice Terminal v1.0.0 (Demo System)',
            exitCode: 0
          };
        }
        return {
          output: 'Snice',
          exitCode: 0
        };

      default:
        return {
          error: `Command not found: ${command}`,
          exitCode: 127
        };
    }
  }

  private getHelpText(): string {
    return `Available commands:
  help      - Show this help message
  echo      - Print arguments
  clear     - Clear terminal
  history   - Show command history
  pwd       - Print working directory
  date      - Show current date and time
  whoami    - Show current user
  ls        - List directory contents
  cat       - Display file contents
  uname     - Show system information`;
  }

  private getListing(args: string[]): string {
    const longFormat = args.includes('-l') || args.includes('-la');

    const files = [
      { name: 'demo.txt', size: '1.2K', date: 'Jan 15 14:30', isDir: false },
      { name: 'projects', size: '4.0K', date: 'Jan 14 09:15', isDir: true },
      { name: 'README.md', size: '856', date: 'Jan 10 11:22', isDir: false },
      { name: 'src', size: '4.0K', date: 'Jan 16 16:45', isDir: true },
    ];

    if (longFormat) {
      const lines = files.map(f => {
        const perms = f.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const type = f.isDir ? '<DIR>' : '     ';
        return `${perms}  1 user group ${f.size.padStart(6)} ${f.date} ${f.name}`;
      });
      return lines.join('\n');
    }

    return files.map(f => f.name).join('  ');
  }
}
