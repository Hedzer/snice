import { controller, respond } from 'snice';
import type { TerminalCommandRequest, TerminalCommandResponse } from '/packages/components/src/terminal/snice-terminal.types';

@controller('demo-terminal-controller')
export class DemoTerminalController {
  element!: HTMLElement;
  async attach(element: HTMLElement) { this.element = element; }
  async detach(_element: HTMLElement) {}

  @respond('terminal-command')
  async handleCommand(request: TerminalCommandRequest): Promise<TerminalCommandResponse> {
    const { command, args, cwd } = request;
    if (command === 'help') return { output: 'Available commands: help echo clear history pwd date whoami ls cat uname', exitCode: 0 };
    if (command === 'echo') return { output: args.join(' '), exitCode: 0 };
    if (command === 'clear') return { output: '\x1B[CLEAR]', exitCode: 0 };
    if (command === 'history') return { output: request.history?.map((entry, i) => `${i + 1}  ${entry}`).join('\n') || 'No commands in history', exitCode: 0 };
    if (command === 'pwd') return { output: cwd || '~', exitCode: 0 };
    if (command === 'date') return { output: new Date().toString(), exitCode: 0 };
    if (command === 'whoami') return { output: 'demo-user', exitCode: 0 };
    if (command === 'ls') return { output: 'demo.txt  projects  README.md  src', exitCode: 0 };
    if (command === 'cat') return args.length ? { output: `Contents of ${args[0]}:\nThis is a demo file.`, exitCode: 0 } : { error: 'cat: missing file operand', exitCode: 1 };
    if (command === 'uname') return { output: args[0] === '-a' ? 'Snice Terminal v1.0.0 (Demo System)' : 'Snice', exitCode: 0 };
    return { error: `Command not found: ${command}`, exitCode: 127 };
  }
}
