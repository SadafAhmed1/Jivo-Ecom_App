import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Terminal as TerminalIcon, 
  FileText, 
  Folder, 
  FolderOpen,
  Database, 
  Code, 
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  RefreshCw,
  Plus,
  Menu,
  Minimize2,
  Maximize2,
  ChevronUp
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

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
  expanded?: boolean;
}

interface OpenTab {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
}

export default function Terminal() {
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [currentDirectory, setCurrentDirectory] = useState('.');
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['.']));
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [claudeCodeStatus, setClaudeCodeStatus] = useState<string>('Unknown');

  // Auto scroll to bottom of terminal and focus input
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Focus terminal input on mount and when terminal is restored
  useEffect(() => {
    if (terminalInputRef.current && !terminalMinimized) {
      terminalInputRef.current.focus();
    }
  }, [terminalMinimized]);

  // Auto-expand terminal when command is executed
  useEffect(() => {
    if (commandHistory.length > 0 && terminalMinimized) {
      setTerminalMinimized(false);
    }
  }, [commandHistory.length]);

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

  // Build nested file tree recursively
  const buildFileTree = useCallback(async (path: string): Promise<FileTreeItem[]> => {
    const response = await fetch('/api/terminal/files', {
      method: 'POST',
      body: JSON.stringify({ path }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to fetch file tree');
    const items = await response.json() as FileTreeItem[];
    
    // Add children for expanded directories
    const itemsWithChildren = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'directory' && expandedFolders.has(item.path)) {
          try {
            const children = await buildFileTree(item.path);
            return { ...item, children, expanded: true };
          } catch (e) {
            return { ...item, children: [], expanded: false };
          }
        }
        return item;
      })
    );
    
    return itemsWithChildren;
  }, [expandedFolders]);

  // Get file tree
  const fileTreeQuery = useQuery({
    queryKey: ['/api/terminal/files', currentDirectory, Array.from(expandedFolders)],
    queryFn: () => buildFileTree('.'),
    refetchOnWindowFocus: false
  });

  // Update local file tree when query succeeds
  useEffect(() => {
    if (fileTreeQuery.data) {
      setFileTree(fileTreeQuery.data);
    }
  }, [fileTreeQuery.data]);

  // Get database tables
  const tablesQuery = useQuery({
    queryKey: ['/api/sql-query/tables'],
    queryFn: async () => {
      const response = await fetch('/api/sql-query/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      return response.json() as Promise<string[]>;
    }
  });

  // Check Claude Code status
  const claudeCodeStatusQuery = useQuery({
    queryKey: ['/api/claude-code/status'],
    queryFn: async () => {
      const response = await fetch('/api/claude-code/status');
      if (!response.ok) throw new Error('Failed to check Claude Code status');
      const data = await response.json();
      return data.status;
    },
    refetchInterval: false
  });

  // Claude Code query mutation
  const claudeCodeQuery = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest('/api/claude-code/query', {
        method: 'POST',
        body: JSON.stringify({ 
          prompt,
          workingDirectory: currentDirectory,
          timeout: 30000 
        })
      });
      return response;
    },
    onSuccess: (data, prompt) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: `claude: ${prompt}`,
        output: data.success ? data.output : `Error: ${data.error}`,
        timestamp: new Date().toISOString(),
        status: data.success ? 'success' : 'error',
        executionTime: data.executionTime
      };
      setCommandHistory(prev => [...prev, newCommand]);
    },
    onError: (error: any, prompt) => {
      const newCommand: TerminalCommand = {
        id: Date.now().toString(),
        command: `claude: ${prompt}`,
        output: error instanceof Error ? error.message : 'Claude Code query failed',
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setCommandHistory(prev => [...prev, newCommand]);
    }
  });

  // Read file content and open in tab
  const openFile = useMutation({
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
      const fileName = filePath.split('/').pop() || 'Untitled';
      const existingTab = openTabs.find(tab => tab.path === filePath);
      
      if (existingTab) {
        setActiveTab(existingTab.id);
        return;
      }
      
      const newTab: OpenTab = {
        id: Date.now().toString(),
        name: fileName,
        path: filePath,
        content: data.content,
        isDirty: false
      };
      
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
    }
  });

  const handleTerminalSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentCommand.trim()) {
        const command = currentCommand.trim();
        
        // Check if it's a Claude Code command
        if (command.startsWith('claude ') || command.startsWith('claude-ai ')) {
          const prompt = command.replace(/^claude(-ai)?\s+/, '');
          if (prompt) {
            claudeCodeQuery.mutate(prompt);
            setCurrentCommand('');
            return;
          }
        }
        
        // Regular terminal command
        executeCommand.mutate(command);
      }
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const closeTab = (tabId: string) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
      setActiveTab(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  };

  const getFileIcon = (fileName: string, type: 'file' | 'directory') => {
    if (type === 'directory') {
      return expandedFolders.has(fileName) ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileText size={16} className="text-blue-600" />;
      case 'json':
        return <FileText size={16} className="text-yellow-600" />;
      case 'css':
      case 'scss':
        return <FileText size={16} className="text-purple-600" />;
      case 'html':
        return <FileText size={16} className="text-orange-600" />;
      case 'md':
        return <FileText size={16} className="text-gray-600" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const clearTerminal = () => {
    setCommandHistory([]);
    if (terminalMinimized) {
      setTerminalMinimized(false);
    }
    setTimeout(() => {
      if (terminalInputRef.current) {
        terminalInputRef.current.focus();
      }
    }, 100);
  };



  const renderFileTree = (items: FileTreeItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 select-none",
            activeTab && openTabs.find(tab => tab.id === activeTab)?.path === item.path && "bg-blue-100"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'file') {
              openFile.mutate(item.path);
            } else {
              toggleFolder(item.path);
            }
          }}
        >
          {item.type === 'directory' && (
            expandedFolders.has(item.path) ? 
              <ChevronDown size={14} className="text-gray-500" /> : 
              <ChevronRight size={14} className="text-gray-500" />
          )}
          {getFileIcon(item.name, item.type)}
          <span className="truncate flex-1">{item.name}</span>
          {item.size && item.type === 'file' && (
            <span className="text-xs text-gray-400 ml-auto">
              {item.size > 1024 ? `${(item.size / 1024).toFixed(1)}KB` : `${item.size}B`}
            </span>
          )}
        </div>
        {item.children && expandedFolders.has(item.path) && (
          <div>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Toggle Sidebar Button */}
      {!sidebarVisible && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            size="sm"
            variant="outline"
            className="bg-white shadow-md"
            onClick={() => setSidebarVisible(true)}
          >
            <Menu size={16} />
          </Button>
        </div>
      )}

      {/* Left Sidebar - File Explorer */}
      {sidebarVisible && (
        <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} />
            <span className="font-medium text-sm">Explorer</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="ml-auto p-1 h-6 w-6"
              onClick={() => {
                setExpandedFolders(new Set(['.']));
                queryClient.invalidateQueries({ queryKey: ['/api/terminal/files'] });
              }}
            >
              <RefreshCw size={12} />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6"
              onClick={() => setSidebarVisible(false)}
            >
              <X size={12} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="files" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 m-2 mb-0">
              <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
              <TabsTrigger value="database" className="text-xs">DB</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="flex-1 mt-2 overflow-hidden">
              <ScrollArea className="h-full">
                {fileTreeQuery.isLoading ? (
                  <div className="p-3 text-xs text-gray-500">Loading...</div>
                ) : fileTree.length > 0 ? (
                  <div className="pb-4">
                    {renderFileTree(fileTree)}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-500">No files found</div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="database" className="flex-1 mt-2 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2">
                  {tablesQuery.isLoading ? (
                    <div className="text-xs text-gray-500">Loading...</div>
                  ) : tablesQuery.data ? (
                    tablesQuery.data.map((table) => (
                      <div
                        key={table}
                        className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer rounded font-mono"
                        onClick={() => setCurrentCommand(`echo "Table: ${table}"`)}
                      >
                        <Database size={14} className="text-blue-600" />
                        <span className="truncate">{table}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">Failed to load</div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        {openTabs.length > 0 && (
          <div className="bg-gray-100 border-b flex items-center overflow-x-auto">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border-r text-sm cursor-pointer min-w-0",
                  activeTab === tab.id ? "bg-white border-t-2 border-t-blue-500" : "hover:bg-gray-200"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {getFileIcon(tab.name, 'file')}
                <span className="truncate max-w-32">{tab.name}</span>
                {tab.isDirty && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-0 h-4 w-4 ml-1 hover:bg-gray-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <X size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Editor/Content Panel */}
          <div className="flex-1 flex flex-col bg-white">
            {activeTab ? (
              <ScrollArea className="flex-1">
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {openTabs.find(tab => tab.id === activeTab)?.content || ''}
                </pre>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Welcome to Terminal IDE</p>
                  <p className="text-sm mt-2">
                    {sidebarVisible ? 
                      "Open a file from the explorer to start editing" : 
                      "Click the menu button to show file explorer"
                    }
                  </p>
                  <p className="text-xs mt-4 text-gray-400">
                    Use the terminal below for development commands and <code className="text-yellow-500">claude</code> AI assistant
                  </p>
                  {!sidebarVisible && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSidebarVisible(true)}
                    >
                      <Menu size={16} className="mr-2" />
                      Show Explorer
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Panel */}
        <div 
          className="border-t bg-black text-white flex flex-col"
          style={{ height: terminalMinimized ? '32px' : `${terminalHeight}px` }}
        >
          <div className="flex items-center justify-between p-2 bg-gray-800 text-xs cursor-pointer" onClick={() => setTerminalMinimized(!terminalMinimized)}>
            <div className="flex items-center gap-2">
              <TerminalIcon size={14} />
              <span>Terminal</span>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  clearTerminal();
                }}
              >
                <Trash2 size={12} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white hover:bg-gray-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setTerminalMinimized(!terminalMinimized);
                }}
              >
                {terminalMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </Button>
            </div>
          </div>
          
          {!terminalMinimized && (
            <ScrollArea className="flex-1" ref={terminalRef}>
              <div className="p-3 font-mono text-sm space-y-2">
                {commandHistory.length === 0 && (
                  <div className="text-green-400">
                    <div>Welcome to Terminal IDE!</div>
                    <div className="text-gray-400 mt-1 text-xs space-y-1">
                      <div>Basic commands: ls, pwd, cat package.json</div>
                      <div>Find files: find . -name "*.ts" -o -name "*.tsx"</div>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">Claude AI: claude [your prompt]</span>
                        <span className={cn(
                          "text-[10px] px-1 rounded",
                          claudeCodeStatusQuery.data?.includes('Authenticated') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        )}>
                          {claudeCodeStatusQuery.data?.split(' ')[0] || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-yellow-500 text-[10px]">Examples: claude "analyze this project" | claude "fix this bug"</div>
                      <div>Git status: git status, git log --oneline -10</div>
                    </div>
                  </div>
                )}
                
                {commandHistory.map((cmd) => (
                  <div key={cmd.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-green-400">
                      <span>{cmd.command.startsWith('claude:') ? '🤖' : '$'}</span>
                      <span className={cmd.command.startsWith('claude:') ? 'text-yellow-400' : ''}>{cmd.command}</span>
                      <Badge
                        variant={cmd.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs ml-auto"
                      >
                        {cmd.status}
                        {cmd.executionTime && ` (${cmd.executionTime}ms)`}
                      </Badge>
                    </div>
                    <pre className={cn(
                      "text-xs whitespace-pre-wrap pl-3",
                      cmd.command.startsWith('claude:') && cmd.status === 'success' 
                        ? "text-blue-200 bg-blue-900/20 p-2 rounded border-l-2 border-blue-400" 
                        : "text-gray-200"
                    )}>
                      {cmd.output}
                    </pre>
                  </div>
                ))}
                
                {/* Current input line */}
                <div className="flex items-center gap-2">
                  <span className="text-green-400">$</span>
                  <Input
                    ref={terminalInputRef}
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleTerminalSubmit}
                    className="flex-1 bg-transparent border-none text-white text-sm font-mono p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Type a command..."
                    disabled={executeCommand.isPending}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}