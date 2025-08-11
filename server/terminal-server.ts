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
    console.log('REAL TERMINAL WebSocket connection established - UNRESTRICTED ACCESS');
    
    // REAL TERMINAL WITH FULL SYSTEM ACCESS - NO SANDBOXING
    const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';
    const shellArgs = process.platform === 'win32' ? ['-NoProfile', '-Command', '-'] : ['--login', '-i']; // Interactive login shell
    
    // UNRESTRICTED TERMINAL - FULL SYSTEM AND NETWORK ACCESS
    const terminalProcess = spawn(shell, shellArgs, {
      cwd: process.cwd(),
      env: {
        ...process.env, // Inherit ALL environment variables
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        SHELL: shell,
        HOME: os.homedir(),
        USER: process.env.USER || process.env.USERNAME || os.userInfo().username,
        // Keep original PATH - no restrictions
        PATH: process.env.PATH,
        // Network access (inherit existing proxy settings)
        HTTP_PROXY: process.env.HTTP_PROXY || '',
        HTTPS_PROXY: process.env.HTTPS_PROXY || '',
        NO_PROXY: process.env.NO_PROXY || '',
        // Project context
        PROJECT_ROOT: process.cwd(),
        DATABASE_URL: process.env.DATABASE_URL || '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      // Enable full system access
      uid: process.getuid && process.getuid(),
      gid: process.getgid && process.getgid(),
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
            // Execute commands with FULL SYSTEM ACCESS - NO RESTRICTIONS
            console.log(`UNRESTRICTED TERMINAL: Executing: ${data}`);
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

    // Send welcome message with REAL system info
    const welcomeMsg = `
╭─────── REAL TERMINAL - UNRESTRICTED ACCESS ───────╮
│ Platform: ${process.platform} | Shell: ${shell}
│ User: ${os.userInfo().username} | Home: ${os.homedir()}
│ Working Dir: ${process.cwd()}
│ PID: ${process.pid} | UID: ${process.getuid && process.getuid()}
│ FULL SYSTEM ACCESS - NO SANDBOXING
╰─────────────────────────────────────────────────────╯

🌐 NETWORK ACCESS AVAILABLE:
• curl ifconfig.me (get public IP)
• wget google.com (download files)  
• ping 8.8.8.8 (test connectivity)
• ssh user@server (remote connections)
• git clone <repo> (clone repositories)

🔧 DEVELOPMENT TOOLS:
• npm install (install packages)
• npm run dev (start development server)
• git push/pull (version control)
• docker ps (container management)
• python, node, php (interpreters)

💻 SYSTEM COMMANDS:
• sudo apt install (install system packages)
• ps aux | grep process (process management)
• top, htop (system monitoring)
• df -h, free -h (disk/memory usage)
• systemctl status (service management)

📁 FILE SYSTEM ACCESS:
• ls -la, cd, mkdir, rm -rf (file operations)
• nano, vim, emacs (text editors)
• chmod, chown (permissions)
• find, grep, awk (search/text processing)

Type ANY command - you have COMPLETE system access!
Real shell ready...
`;

    ws.send(JSON.stringify({
      type: 'connected',
      message: welcomeMsg
    }));
  });

  return wss;
}