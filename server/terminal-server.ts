import { WebSocketServer, WebSocket } from 'ws';
import { spawn, ChildProcess } from 'child_process';
import { Server } from 'http';
import os from 'os';
import path from 'path';

export function setupTerminalWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/terminal-ws' 
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Terminal WebSocket connection established');
    
    // Enhanced terminal session with full system access
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const shellArgs = process.platform === 'win32' ? [] : ['-i']; // Interactive shell
    
    // Set up enhanced environment with full access
    const terminalProcess = spawn(shell, shellArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        SHELL: shell,
        HOME: os.homedir(),
        USER: process.env.USER || 'user',
        PATH: process.env.PATH || '',
        // Add project-specific paths
        PROJECT_ROOT: process.cwd(),
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    // Send terminal output to WebSocket
    terminalProcess.stdout?.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString()
        }));
      }
    });

    terminalProcess.stderr?.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: data.toString()
        }));
      }
    });

    // Handle terminal exit
    terminalProcess.on('exit', (code) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'exit',
          code: code || 0
        }));
      }
    });

    // Handle WebSocket messages (user input)
    ws.on('message', (message) => {
      try {
        const { type, data } = JSON.parse(message.toString());
        
        switch (type) {
          case 'input':
            terminalProcess.stdin?.write(data);
            break;
          case 'command':
            // Execute commands with enhanced capabilities
            terminalProcess.stdin?.write(`${data}\n`);
            break;
          default:
            console.warn('Unknown terminal message type:', type);
        }
      } catch (error) {
        console.error('Error processing terminal message:', error);
      }
    });

    // Handle WebSocket close
    ws.on('close', () => {
      console.log('Terminal WebSocket connection closed');
      terminalProcess.kill('SIGTERM');
    });

    // Handle terminal errors
    terminalProcess.on('error', (error) => {
      console.error('Terminal process error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: `Terminal Error: ${error.message}`
        }));
      }
    });

    // Send welcome message with system info
    const welcomeMsg = `
╭─ Enhanced Terminal Connected ─╮
│ Platform: ${process.platform}     
│ Shell: ${shell}
│ CWD: ${process.cwd()}
│ Full system access enabled
╰─────────────────────────────────╯

Type 'help' or try these commands:
• ls -la (list files)
• pwd (current directory)  
• ps aux (running processes)
• df -h (disk usage)
• git status (git commands)
• npm run dev (run scripts)
• curl, wget (network tools)
• python, node (interpreters)

Ready for commands...
`;

    ws.send(JSON.stringify({
      type: 'connected',
      message: welcomeMsg
    }));
  });

  return wss;
}