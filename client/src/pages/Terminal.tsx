import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

interface TerminalMessage {
  id: string;
  type: 'output' | 'error' | 'input';
  content: string;
}

export default function Terminal() {
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    connectTerminal();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const connectTerminal = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/terminal-ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'output' || message.type === 'error') {
            addMessage(message.type, message.data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  };

  const addMessage = (type: TerminalMessage['type'], content: string) => {
    const message: TerminalMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content
    };
    setMessages(prev => [...prev, message]);
  };

  const sendCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
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
    if (e.key === 'Enter' && currentInput.trim()) {
      sendCommand(currentInput.trim());
    }
  };

  if (isFullscreen) {
    return (
      <div className="h-screen bg-white text-black flex flex-col font-mono">
        <div className="h-10 flex items-center justify-end px-4 border-b">
          <button
            onClick={() => setIsFullscreen(false)}
            className="text-gray-500 hover:text-black"
          >
            <ChevronUp className="h-4 w-4 transform rotate-180" />
          </button>
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto" ref={terminalRef}>
            {messages.map((msg) => (
              <div key={msg.id} className="mb-1">
                <div className={
                  msg.type === 'input' ? "text-black" :
                  msg.type === 'error' ? "text-red-600" : "text-black"
                }>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center mt-4">
            <span className="mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-transparent outline-none"
              placeholder=""
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-black flex flex-col font-mono">
      <div className="h-10 flex items-center justify-between px-4 border-b">
        <span className="text-sm">Terminal</span>
        <button
          onClick={() => setIsFullscreen(true)}
          className="text-gray-500 hover:text-black"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto" ref={terminalRef}>
          {messages.map((msg) => (
            <div key={msg.id} className="mb-1">
              <div className={
                msg.type === 'input' ? "text-black" :
                msg.type === 'error' ? "text-red-600" : "text-black"
              }>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center mt-4">
          <span className="mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-transparent outline-none"
            placeholder=""
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}