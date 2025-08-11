import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Menu, X, Code, Folder, FolderOpen, FileText, 
  Terminal as TerminalIcon, Minimize2, Maximize2, 
  Trash2, Play, Square, RefreshCw 
} from "lucide-react";

interface TerminalMessage {
  id: string;
  type: 'output' | 'error' | 'input' | 'system';
  content: string;
  timestamp: Date;
}

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
}

interface OpenTab {
  id: string;
  name: string;
  path: string;
  content: string;
}

export default function EnhancedTerminal() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // File explorer state
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    connectTerminal();
    loadFileTree();
    
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
        addMessage('system', 'Connected to enhanced terminal with full system access');
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
        addMessage('system', 'Terminal connection closed');
      };

      ws.onerror = (error) => {
        setIsConnecting(false);
        addMessage('error', `WebSocket error: ${error}`);
      };
    } catch (error) {
      setIsConnecting(false);
      addMessage('error', `Failed to connect: ${error}`);
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
      addMessage('error', 'Terminal not connected. Click Reconnect.');
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

  const loadFileTree = async () => {
    try {
      const response = await fetch('/api/terminal/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '.' })
      });
      const data = await response.json();
      setFileTree(data);
    } catch (error) {
      console.error('Error loading file tree:', error);
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

  const openFile = async (filePath: string) => {
    try {
      const response = await fetch('/api/terminal/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath })
      });
      const data = await response.json();
      
      const tabId = filePath;
      const fileName = filePath.split('/').pop() || filePath;
      
      setOpenTabs(prev => {
        const existing = prev.find(tab => tab.id === tabId);
        if (existing) {
          return prev;
        }
        return [...prev, {
          id: tabId,
          name: fileName,
          path: filePath,
          content: data.content
        }];
      });
      
      setActiveTab(tabId);
    } catch (error) {
      console.error('Error opening file:', error);
    }
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
      case 'ts': case 'tsx': case 'js': case 'jsx':
        return <FileText size={16} className="text-blue-600" />;
      case 'json':
        return <FileText size={16} className="text-yellow-600" />;
      case 'css': case 'scss':
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
    setMessages([]);
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
              openFile(item.path);
            } else {
              toggleFolder(item.path);
            }
          }}
        >
          {getFileIcon(item.name, item.type)}
          <span className="ml-1 truncate">{item.name}</span>
        </div>
        {item.type === 'directory' && expandedFolders.has(item.path) && item.children && (
          renderFileTree(item.children, level + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code size={20} className="text-blue-600" />
            <h1 className="text-lg font-semibold">Enhanced Terminal IDE</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500" : "bg-red-500"
            )} />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {!isConnected && (
            <Button
              size="sm"
              onClick={connectTerminal}
              disabled={isConnecting}
              className="gap-2"
            >
              <RefreshCw size={14} className={isConnecting ? "animate-spin" : ""} />
              {isConnecting ? "Connecting..." : "Reconnect"}
            </Button>
          )}
          {!sidebarVisible && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSidebarVisible(true)}
            >
              <Menu size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 bg-white border-r flex flex-col">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-medium text-sm">File Explorer</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setSidebarVisible(false)}
              >
                <X size={14} />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {renderFileTree(fileTree)}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* File Tabs */}
          {openTabs.length > 0 && (
            <div className="bg-gray-100 border-b flex overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border-r cursor-pointer text-sm whitespace-nowrap",
                    activeTab === tab.id ? "bg-white border-b-2 border-blue-500" : "hover:bg-gray-200"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-gray-300"
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
                  <p className="text-lg font-medium">Enhanced Terminal IDE</p>
                  <p className="text-sm mt-2">
                    {sidebarVisible ? 
                      "Open a file from the explorer or use the terminal below" : 
                      "Click the menu button to show file explorer"
                    }
                  </p>
                  <p className="text-xs mt-4 text-gray-400">
                    Full system terminal access with WebSocket connection
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Terminal Panel */}
          <div 
            className="border-t bg-black text-white flex flex-col"
            style={{ height: terminalMinimized ? '32px' : `${terminalHeight}px` }}
          >
            <div className="flex items-center justify-between p-2 bg-gray-800 text-xs cursor-pointer" onClick={() => setTerminalMinimized(!terminalMinimized)}>
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} />
                <span>Enhanced Terminal</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-400" : "bg-red-400"
                )} />
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
              <>
                {/* Terminal Output */}
                <ScrollArea className="flex-1" ref={terminalRef}>
                  <div className="p-3 font-mono text-sm space-y-1">
                    {messages.length === 0 && (
                      <div className="text-green-400">
                        <div>Enhanced Terminal Ready!</div>
                        <div className="text-gray-400 mt-1 text-xs space-y-1">
                          <div>Full system access enabled - All commands available</div>
                          <div>Try: ls -la, pwd, git status, npm run dev, python --version</div>
                          <div>Network tools: curl, wget, ping</div>
                          <div>System info: ps aux, df -h, top</div>
                        </div>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div key={message.id} className={cn(
                        "whitespace-pre-wrap",
                        message.type === 'input' && "text-cyan-400",
                        message.type === 'error' && "text-red-400",
                        message.type === 'system' && "text-yellow-400",
                        message.type === 'output' && "text-gray-100"
                      )}>
                        {message.content}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Command Input */}
                <div className="border-t border-gray-700 p-2 flex items-center gap-2">
                  <span className="text-cyan-400 text-sm">$</span>
                  <Input
                    ref={inputRef}
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
                    placeholder={isConnected ? "Enter command..." : "Connect to terminal first"}
                    disabled={!isConnected}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white hover:bg-gray-600"
                    onClick={() => sendCommand(currentInput)}
                    disabled={!isConnected || !currentInput.trim()}
                  >
                    <Play size={12} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}