import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Terminal as TerminalIcon, 
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  status: 'success' | 'error';
  executionTime?: number;
}

export default function Terminal() {
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Auto-focus terminal input
  useEffect(() => {
    if (terminalInputRef.current) {
      terminalInputRef.current.focus();
    }
  }, []);

  // Scroll to bottom when new commands are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Execute terminal commands
  const executeCommand = useMutation({
    mutationFn: async (command: string) => {
      const response = await apiRequest(`/api/terminal/execute`, {
        method: 'POST',
        body: { command }
      });
      return response;
    },
    onSuccess: (data, command) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command,
        output: data.output || '',
        timestamp: new Date().toISOString(),
        status: data.exitCode === 0 ? 'success' : 'error',
        executionTime: data.executionTime
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');
    },
    onError: (error: any, command) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command,
        output: error.message || 'Command failed',
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');
    }
  });

  // Claude Code query mutation
  const claudeCodeQuery = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest(`/api/claude-code/query`, {
        method: 'POST',
        body: { prompt }
      });
      return response;
    },
    onSuccess: (data, prompt) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: `claude ${prompt}`,
        output: data.response || 'No response from Claude',
        timestamp: new Date().toISOString(),
        status: 'success'
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');
    },
    onError: (error: any, prompt) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: `claude ${prompt}`,
        output: error.message || 'Claude query failed',
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');
    }
  });

  const handleTerminalSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      e.preventDefault();
      
      if (currentCommand.startsWith('claude ')) {
        const prompt = currentCommand.slice(7).trim();
        if (prompt) {
          claudeCodeQuery.mutate(prompt);
        }
      } else {
        executeCommand.mutate(currentCommand.trim());
      }
    }
  }, [currentCommand, executeCommand, claudeCodeQuery]);

  const clearTerminal = () => {
    setCommandHistory([]);
  };

  // Fullscreen terminal view
  if (isFullscreen) {
    return (
      <div className="h-screen bg-white text-black flex flex-col">
        {/* Terminal Header */}
        <div className="h-10 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Terminal</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="h-6 w-6 p-0 text-gray-600 hover:text-black"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto" ref={terminalRef}>
          {commandHistory.length === 0 && (
            <div className="text-gray-600 mb-4">
              <div>Welcome to Terminal</div>
              <div className="text-xs mt-1">Type commands or use 'claude [prompt]' for AI assistance</div>
            </div>
          )}
          
          {commandHistory.map((cmd) => (
            <div key={cmd.id} className="mb-3">
              <div className="flex items-center gap-2 text-black">
                <span>$</span>
                <span>{cmd.command}</span>
              </div>
              <pre className="text-gray-700 text-xs whitespace-pre-wrap mt-1 pl-3">
                {cmd.output}
              </pre>
            </div>
          ))}
          
          {(executeCommand.isPending || claudeCodeQuery.isPending) && (
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
              <span className="text-sm">Executing...</span>
            </div>
          )}

          {/* Terminal Input Line */}
          <div className="flex items-center gap-2">
            <span className="text-black">$</span>
            <input
              ref={terminalInputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleTerminalSubmit}
              placeholder="Type command here..."
              className="flex-1 bg-transparent text-black border-none outline-none placeholder-gray-400 font-mono text-sm"
              disabled={executeCommand.isPending || claudeCodeQuery.isPending}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  // Regular terminal view (also clean and simple)
  return (
    <div className="h-screen bg-white text-black flex flex-col">
      {/* Clean Terminal Header */}
      <div className="h-10 bg-gray-100 border-b border-gray-300 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(true)}
          className="h-6 w-6 p-0 text-gray-600 hover:text-black"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>

      {/* Clean Terminal Content */}
      <div className="flex-1 p-4 font-mono text-sm overflow-y-auto" ref={terminalRef}>
        {commandHistory.length === 0 && (
          <div className="text-gray-600 mb-4">
            <div>Welcome to Terminal</div>
            <div className="text-xs mt-1">Type commands or use 'claude [prompt]' for AI assistance</div>
          </div>
        )}
        
        {commandHistory.map((cmd) => (
          <div key={cmd.id} className="mb-3">
            <div className="flex items-center gap-2 text-black">
              <span>$</span>
              <span>{cmd.command}</span>
            </div>
            <pre className="text-gray-700 text-xs whitespace-pre-wrap mt-1 pl-3">
              {cmd.output}
            </pre>
          </div>
        ))}
        
        {(executeCommand.isPending || claudeCodeQuery.isPending) && (
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
            <span className="text-sm">Executing...</span>
          </div>
        )}

        {/* Terminal Input Line */}
        <div className="flex items-center gap-2">
          <span className="text-black">$</span>
          <input
            ref={terminalInputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleTerminalSubmit}
            placeholder="Type command here..."
            className="flex-1 bg-transparent text-black border-none outline-none placeholder-gray-400 font-mono text-sm"
            disabled={executeCommand.isPending || claudeCodeQuery.isPending}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}