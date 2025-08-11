import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal as TerminalIcon, 
  Send, 
  FileText, 
  Folder, 
  Database, 
  Code, 
  Play,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  status: 'success' | 'error';
  executionTime?: number;
}

interface FileTreeItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileTreeItem[];
}

export default function Terminal() {
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState('.');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Execute terminal command
  const executeCommand = useMutation({
    mutationFn: async (command: string) => {
      const startTime = Date.now();
      const response = await fetch('/api/terminal/execute', {
        method: 'POST',
        body: JSON.stringify({ command, cwd: currentDirectory }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Command execution failed');
      }
      
      const data = await response.json();
      return { ...data, executionTime: Date.now() - startTime };
    },
    onSuccess: (data, variables) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: variables,
        output: data.output,
        timestamp: new Date().toISOString(),
        status: data.exitCode === 0 ? 'success' : 'error',
        executionTime: data.executionTime
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentDirectory(data.cwd);
      setCurrentCommand('');
    },
    onError: (error: any, variables) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: variables,
        output: error instanceof Error ? error.message : 'Command execution failed',
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setCommandHistory(prev => [...prev, newCommand]);
      setCurrentCommand('');
    }
  });

  // Get file tree
  const fileTreeQuery = useQuery({
    queryKey: ['/api/terminal/files', currentDirectory],
    queryFn: async () => {
      const response = await fetch('/api/terminal/files', {
        method: 'POST',
        body: JSON.stringify({ path: currentDirectory }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch file tree');
      return response.json() as Promise<FileTreeItem[]>;
    }
  });

  // Get database tables
  const tablesQuery = useQuery({
    queryKey: ['/api/sql-query/tables'],
    queryFn: async () => {
      const response = await fetch('/api/sql-query/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      return response.json() as Promise<string[]>;
    }
  });

  // Read file content
  const readFile = useMutation({
    mutationFn: async (filePath: string) => {
      const response = await fetch('/api/terminal/read-file', {
        method: 'POST',
        body: JSON.stringify({ filePath }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to read file');
      }
      return response.json();
    },
    onSuccess: (data, filePath) => {
      setSelectedFile(filePath);
      setFileContent(data.content);
    }
  });

  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentCommand.trim()) {
        executeCommand.mutate(currentCommand.trim());
      }
    }
  };

  const clearTerminal = () => {
    setCommandHistory([]);
  };

  const quickCommands = [
    { label: 'List Files', command: 'ls -la' },
    { label: 'Current Directory', command: 'pwd' },
    { label: 'Package Info', command: 'cat package.json' },
    { label: 'Find TypeScript Files', command: 'find . -name "*.ts"' },
    { label: 'Find React Components', command: 'find . -name "*.tsx"' },
    { label: 'Check Git Status', command: 'git status' },
    { label: 'Database Tables', command: 'echo "Use SQL Query module for database operations"' },
  ];

  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} className="space-y-1">
        <div
          className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-gray-100 ${
            selectedFile === item.path ? 'bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (item.type === 'file') {
              readFile.mutate(item.path);
            } else {
              // Handle directory click - could expand/collapse
            }
          }}
        >
          {item.type === 'directory' ? (
            <Folder size={16} className="text-blue-600" />
          ) : (
            <FileText size={16} className="text-gray-600" />
          )}
          <span className="text-sm">{item.name}</span>
          {item.size && (
            <span className="text-xs text-gray-500 ml-auto">
              {(item.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        {item.children && renderFileTree(item.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      <div className="flex items-center gap-2 mb-6">
        <TerminalIcon size={24} className="text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Terminal & IDE</h1>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Panel - File Explorer & Database */}
        <div className="col-span-3 space-y-4">
          <Tabs defaultValue="files" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="mt-4 h-[calc(100%-48px)]">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Folder size={16} />
                    File Explorer
                  </CardTitle>
                  <div className="text-xs text-gray-500 font-mono">
                    {currentDirectory}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="p-3">
                      {fileTreeQuery.isLoading ? (
                        <div className="text-sm text-gray-500">Loading files...</div>
                      ) : fileTreeQuery.data ? (
                        renderFileTree(fileTreeQuery.data)
                      ) : (
                        <div className="text-sm text-gray-500">Failed to load files</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="mt-4 h-[calc(100%-48px)]">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database size={16} />
                    Database Tables
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="p-3 space-y-2">
                      {tablesQuery.isLoading ? (
                        <div className="text-sm text-gray-500">Loading tables...</div>
                      ) : tablesQuery.data ? (
                        tablesQuery.data.map((table) => (
                          <div
                            key={table}
                            className="p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-sm font-mono"
                            onClick={() => setCurrentCommand(`cat shared/schema.ts | grep -A 5 "${table}"`)}
                          >
                            {table}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Failed to load tables</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Panel - Terminal */}
        <div className="col-span-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TerminalIcon size={20} />
                  Terminal
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileTreeQuery.refetch()}
                  >
                    <RefreshCw size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearTerminal}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Command History */}
              <ScrollArea className="flex-1 p-4" ref={terminalRef}>
                <div className="space-y-3 font-mono text-sm">
                  {commandHistory.length === 0 && (
                    <div className="text-gray-500">
                      <p>Welcome to the Terminal IDE!</p>
                      <p className="mt-2">You can run any command here. Try:</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <code>ls -la</code> - List files</li>
                        <li>• <code>cat package.json</code> - View package info</li>
                        <li>• <code>find . -name "*.ts"</code> - Find TypeScript files</li>
                        <li>• <code>npx claude-dev</code> - Run Claude Code (if installed)</li>
                      </ul>
                    </div>
                  )}
                  
                  {commandHistory.map((cmd) => (
                    <div key={cmd.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">$</span>
                        <span className="flex-1">{cmd.command}</span>
                        <Badge
                          variant={cmd.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {cmd.status}
                        </Badge>
                        {cmd.executionTime && (
                          <span className="text-xs text-gray-500">
                            {cmd.executionTime}ms
                          </span>
                        )}
                      </div>
                      <pre className="bg-gray-50 p-3 rounded text-xs whitespace-pre-wrap overflow-x-auto">
                        {cmd.output}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Command Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-blue-600">
                    {currentDirectory}$
                  </span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter command... (Press Enter to execute, Shift+Enter for new line)"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleTerminalSubmit}
                    className="font-mono text-sm resize-none"
                    rows={1}
                  />
                  <Button
                    onClick={() => currentCommand.trim() && executeCommand.mutate(currentCommand.trim())}
                    disabled={!currentCommand.trim() || executeCommand.isPending}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - File Content & Quick Actions */}
        <div className="col-span-3 space-y-4">
          {/* Quick Commands */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play size={16} />
                Quick Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickCommands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start text-xs"
                  onClick={() => setCurrentCommand(cmd.command)}
                >
                  {cmd.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* File Content Viewer */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code size={16} />
                File Content
              </CardTitle>
              {selectedFile && (
                <div className="text-xs text-gray-500 break-all">
                  {selectedFile}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {selectedFile ? (
                  <pre className="p-4 text-xs whitespace-pre-wrap font-mono">
                    {readFile.isPending ? 'Loading...' : fileContent}
                  </pre>
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    Click on a file to view its content
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}