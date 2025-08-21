import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { sqlService, sqlQueryKeys } from "@/services/sql-service";
import { 
  Database, 
  Server, 
  Search, 
  Activity, 
  Table,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive
} from "lucide-react";

/**
 * SQL Server Demo Component
 * Test and demonstrate SQL Server connectivity and operations
 */
export function SqlDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("connection");
  const [searchTerm, setSearchTerm] = useState("");
  const [customQuery, setCustomQuery] = useState("SELECT TOP 10 * FROM ItemMaster");
  const [selectedTable, setSelectedTable] = useState("");

  // Health check query
  const { 
    data: healthData, 
    isLoading: healthLoading, 
    refetch: refetchHealth 
  } = useQuery({
    queryKey: sqlQueryKeys.health(),
    queryFn: () => sqlService.healthCheck(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Status query
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: sqlQueryKeys.status(),
    queryFn: () => sqlService.getStatus(),
  });

  // Performance stats query
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: sqlQueryKeys.performance(),
    queryFn: () => sqlService.getPerformanceStats(),
  });

  // Item details query
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: sqlQueryKeys.items(),
    queryFn: () => sqlService.getItemDetails(),
    enabled: false, // Only fetch when explicitly requested
  });

  // Search items mutation
  const searchItemsMutation = useMutation({
    mutationFn: (search: string) => sqlService.searchItems({ search, limit: 50 }),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Search completed",
          description: `Found ${result.data?.length || 0} items`,
        });
      } else {
        toast({
          title: "Search failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
  });

  // Custom query mutation
  const customQueryMutation = useMutation({
    mutationFn: (query: string) => sqlService.executeQuery({ query }),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Query executed",
          description: `Retrieved ${result.data?.length || 0} records`,
        });
      } else {
        toast({
          title: "Query failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
  });

  // Table info query
  const { data: tableInfoData, isLoading: tableInfoLoading } = useQuery({
    queryKey: sqlQueryKeys.tableInfo(selectedTable),
    queryFn: () => sqlService.getTableInfo(selectedTable),
    enabled: !!selectedTable,
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      searchItemsMutation.mutate(searchTerm.trim());
    }
  };

  const handleCustomQuery = () => {
    if (customQuery.trim()) {
      customQueryMutation.mutate(customQuery.trim());
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SQL Server Connection Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test and monitor SQL Server connectivity (103.89.44.240)
          </p>
        </div>
        <Button onClick={() => refetchHealth()}>
          <Activity className="mr-2 h-4 w-4" />
          Refresh Connection
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="query">Custom Query</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="text-center py-4">Testing connection...</div>
                ) : healthData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthData.success)}
                        {getStatusBadge(healthData.success)}
                      </div>
                    </div>
                    
                    {healthData.data && (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Server:</span>
                            <div className="font-medium">{healthData.data.server}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Database:</span>
                            <div className="font-medium">{healthData.data.database}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">User:</span>
                            <div className="font-medium">{healthData.data.user}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Response Time:</span>
                            <div className="font-medium">{healthData.data.responseTime}ms</div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {healthData.error && (
                      <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                        {healthData.error}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-red-500">Failed to check connection</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="text-center py-4">Loading performance data...</div>
                ) : performanceData?.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Active Connections:</span>
                        <div className="font-medium">{performanceData.data?.ActiveConnections || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">User Sessions:</span>
                        <div className="font-medium">{performanceData.data?.UserSessions || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Reads:</span>
                        <div className="font-medium">{performanceData.data?.TotalReads || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Writes:</span>
                        <div className="font-medium">{performanceData.data?.TotalWrites || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-red-500">
                    {performanceData?.error || "Failed to load performance data"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                SAP Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: sqlQueryKeys.items() })}
                disabled={itemsLoading}
                className="w-full"
              >
                {itemsLoading ? "Loading Items..." : "Fetch Item Details"}
              </Button>
              
              {itemsData && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Found {itemsData.data?.length || 0} items 
                    {itemsData.metadata?.executionTime && ` in ${itemsData.metadata.executionTime}ms`}
                  </div>
                  
                  {itemsData.data && itemsData.data.length > 0 && (
                    <div className="max-h-64 overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(itemsData.data[0]).map((key) => (
                              <th key={key} className="text-left p-2 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {itemsData.data.slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              {Object.values(item).map((value, i) => (
                                <td key={i} className="p-2 border-b">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search items by name, code, or group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={searchItemsMutation.isPending || !searchTerm.trim()}
                >
                  {searchItemsMutation.isPending ? "Searching..." : "Search"}
                </Button>
              </div>

              {searchItemsMutation.data && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Search results: {searchItemsMutation.data.data?.length || 0} items
                    {searchItemsMutation.data.metadata?.executionTime && 
                      ` (${searchItemsMutation.data.metadata.executionTime}ms)`}
                  </div>
                  
                  {searchItemsMutation.data.data && searchItemsMutation.data.data.length > 0 && (
                    <div className="max-h-64 overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(searchItemsMutation.data.data[0]).map((key) => (
                              <th key={key} className="text-left p-2 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {searchItemsMutation.data.data.map((item, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              {Object.values(item).map((value, i) => (
                                <td key={i} className="p-2 border-b">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Custom SQL Query
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SQL Query (SELECT only)</label>
                <Textarea
                  placeholder="SELECT * FROM TableName WHERE..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleCustomQuery}
                disabled={customQueryMutation.isPending || !customQuery.trim()}
                className="w-full"
              >
                {customQueryMutation.isPending ? "Executing..." : "Execute Query"}
              </Button>

              {customQueryMutation.data && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Query result: {customQueryMutation.data.data?.length || 0} rows
                    {customQueryMutation.data.metadata?.executionTime && 
                      ` (${customQueryMutation.data.metadata.executionTime}ms)`}
                  </div>
                  
                  {customQueryMutation.data.data && customQueryMutation.data.data.length > 0 && (
                    <div className="max-h-64 overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(customQueryMutation.data.data[0]).map((key) => (
                              <th key={key} className="text-left p-2 border-b">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {customQueryMutation.data.data.slice(0, 20).map((row, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2 border-b">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Database Schema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Table name (optional)"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                />
                <Button 
                  onClick={() => queryClient.invalidateQueries({ 
                    queryKey: sqlQueryKeys.tableInfo(selectedTable) 
                  })}
                  disabled={tableInfoLoading}
                >
                  {tableInfoLoading ? "Loading..." : "Get Schema"}
                </Button>
              </div>

              {tableInfoData && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Schema info: {tableInfoData.data?.length || 0} columns
                  </div>
                  
                  {tableInfoData.data && tableInfoData.data.length > 0 && (
                    <div className="max-h-64 overflow-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2 border-b">Table</th>
                            <th className="text-left p-2 border-b">Column</th>
                            <th className="text-left p-2 border-b">Type</th>
                            <th className="text-left p-2 border-b">Nullable</th>
                            <th className="text-left p-2 border-b">Length</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableInfoData.data.map((col, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="p-2 border-b">{col.TABLE_NAME}</td>
                              <td className="p-2 border-b">{col.COLUMN_NAME}</td>
                              <td className="p-2 border-b">{col.DATA_TYPE}</td>
                              <td className="p-2 border-b">{col.IS_NULLABLE}</td>
                              <td className="p-2 border-b">{col.CHARACTER_MAXIMUM_LENGTH || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}