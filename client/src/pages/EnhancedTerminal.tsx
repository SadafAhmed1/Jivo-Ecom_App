import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Maximize2, Minimize2
} from "lucide-react";

interface TerminalMessage {
  id: string;
  type: 'output' | 'error' | 'input' | 'system';
  content: string;
  timestamp: Date;
}

export default function EnhancedTerminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    connectTerminal();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFullscreen]);

  const connectTerminal = () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/terminal-ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case 'output':
              addMessage('output', message.data);
              break;
            case 'error':
              addMessage('error', message.data);
              break;
            case 'connected':
              addMessage('system', message.message);
              break;
            case 'exit':
              addMessage('system', `Process exited with code: ${message.code}`);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };

      ws.onerror = () => {
        setIsConnecting(false);
      };
    } catch (error) {
      setIsConnecting(false);
    }
  };

  const addMessage = (type: TerminalMessage['type'], content: string) => {
    const message: TerminalMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const sendCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addMessage('error', 'Terminal not connected');
      return;
    }

    addMessage('input', `$ ${command}`);
    
    wsRef.current.send(JSON.stringify({
      type: 'command',
      data: command
    }));
    
    setCurrentInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        sendCommand(currentInput.trim());
      }
    }
  };

  const clearTerminal = () => {
    setMessages([]);
  };

  // Fullscreen terminal view
  if (isFullscreen) {
    return (
      <div className="h-screen bg-white text-black flex flex-col">
        {/* Minimal header with only fullscreen toggle */}
        <div className="h-8 flex items-center justify-end px-3 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="h-6 w-6 p-0 text-gray-600 hover:text-black"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Clean terminal content */}
        <div className="flex-1 flex flex-col p-3 font-mono text-sm overflow-hidden">
          {/* Terminal output */}
          <div className="flex-1 overflow-y-auto mb-3" ref={terminalRef}>
            {messages.map((msg) => (
              <div key={msg.id} className="mb-1">
                {msg.type === 'input' ? (
                  <div className="text-black font-medium">{msg.content}</div>
                ) : (
                  <div className={cn(
                    "whitespace-pre-wrap",
                    msg.type === 'error' ? "text-red-600" : 
                    msg.type === 'system' ? "text-blue-600" : "text-black"
                  )}>
                    {msg.content}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Integrated input line at bottom */}
          <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
            <span className="text-black">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type ANY command - FULL ACCESS (try: curl ifco.io)"
              className="flex-1 bg-transparent text-black border-none outline-none placeholder-gray-400 font-mono text-sm"
              disabled={!isConnected}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  // Regular terminal view 
  return (
    <div className="h-screen bg-white text-black flex flex-col">
      {/* Minimal header */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-gray-200">
        <div className="text-sm text-gray-600">Terminal</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="h-6 w-6 p-0 text-gray-600 hover:text-black"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Clean terminal content */}
      <div className="flex-1 flex flex-col p-3 font-mono text-sm overflow-hidden">
        {/* Terminal output */}
        <div className="flex-1 overflow-y-auto mb-3" ref={terminalRef}>
          {messages.map((msg) => (
            <div key={msg.id} className="mb-1">
              {msg.type === 'input' ? (
                <div className="text-black font-medium">{msg.content}</div>
              ) : (
                <div className={cn(
                  "whitespace-pre-wrap",
                  msg.type === 'error' ? "text-red-600" : 
                  msg.type === 'system' ? "text-blue-600" : "text-black"
                )}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Integrated input line at bottom */}
        <div className="flex items-center gap-2 border-t border-gray-200 pt-2">
          <span className="text-black">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type ANY command - FULL ACCESS (try: curl ifco.io)"
            className="flex-1 bg-transparent text-black border-none outline-none placeholder-gray-400 font-mono text-sm"
            disabled={!isConnected}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}