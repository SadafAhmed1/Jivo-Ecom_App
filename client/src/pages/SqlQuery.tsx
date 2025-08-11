import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Download, Database, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  status: 'success' | 'error';
  rowCount?: number;
  executionTime?: number;
}

const sampleQueries = [
  {
    title: "Total Sales by Platform",
    query: `SELECT 
  'Amazon' as platform,
  COUNT(*) as total_orders,
  SUM(total_sales_value) as total_revenue
FROM "SC_Amazon_JW_Daily"
UNION ALL
SELECT 
  'Flipkart' as platform,
  COUNT(*) as total_orders, 
  SUM(total_sales_value) as total_revenue
FROM "SC_FlipKart_JM_2Month"
ORDER BY total_revenue DESC;`
  },
  {
    title: "Top Products by Sales Quantity",
    query: `SELECT 
  product_name,
  SUM(total_sales_qty) as total_quantity,
  SUM(total_sales_value) as total_value
FROM "SC_FlipKart_JM_2Month"
WHERE product_name IS NOT NULL AND product_name != ''
GROUP BY product_name
ORDER BY total_quantity DESC
LIMIT 10;`
  },
  {
    title: "Monthly Sales Trend",
    query: `SELECT 
  DATE_TRUNC('month', report_date) as month,
  COUNT(*) as orders,
  SUM(total_sales_value) as revenue
FROM "SC_Amazon_JW_Daily"
WHERE report_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', report_date)
ORDER BY month DESC;`
  },
  {
    title: "Inventory Status by Platform",
    query: `SELECT 
  'Jio Mart' as platform,
  COUNT(*) as total_items,
  SUM(CAST(available_qty AS NUMERIC)) as total_available
FROM "INV_JioMart_JM_Daily"
UNION ALL
SELECT 
  'Blinkit' as platform,
  COUNT(*) as total_items,
  SUM(CAST(available_qty AS NUMERIC)) as total_available  
FROM "INV_Blinkit_JM_Daily"
ORDER BY total_available DESC;`
  }
];

export default function SqlQuery() {
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const queryClient = useQueryClient();

  const executeQueryMutation = useMutation({
    mutationFn: async (sqlQuery: string) => {
      const response = await fetch('/api/sql-query/execute', {
        method: 'POST',
        body: JSON.stringify({ query: sqlQuery }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Query execution failed');
      }
      
      return response.json() as Promise<QueryResult>;
    },
    onSuccess: (data, variables) => {
      const newEntry: QueryHistory = {
        id: Date.now().toString(),
        query: variables,
        timestamp: new Date().toISOString(),
        status: 'success',
        rowCount: data.rowCount,
        executionTime: data.executionTime
      };
      setQueryHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    },
    onError: (error: any, variables) => {
      const newEntry: QueryHistory = {
        id: Date.now().toString(),
        query: variables,
        timestamp: new Date().toISOString(),
        status: 'error'
      };
      setQueryHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    }
  });

  const tablesQuery = useQuery({
    queryKey: ['/api/sql-query/tables'],
    queryFn: async () => {
      const response = await fetch('/api/sql-query/tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      return response.json() as Promise<string[]>;
    }
  });

  const handleExecuteQuery = () => {
    if (!query.trim()) return;
    executeQueryMutation.mutate(query.trim());
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const downloadResults = () => {
    if (!executeQueryMutation.data) return;
    
    const { columns, rows } = executeQueryMutation.data;
    const csvContent = [
      columns.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SQL Query Runner</h1>
          <p className="text-gray-600 mt-1">Execute custom SQL queries against your database</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Database size={16} />
          Development Database
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play size={20} />
                Query Editor
              </CardTitle>
              <CardDescription>
                Write and execute SQL queries. Only SELECT statements are allowed for security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="SELECT * FROM your_table LIMIT 10;"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleExecuteQuery}
                    disabled={!query.trim() || executeQueryMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Play size={16} />
                    {executeQueryMutation.isPending ? 'Executing...' : 'Execute Query'}
                  </Button>
                  {executeQueryMutation.data && (
                    <Button
                      variant="outline"
                      onClick={downloadResults}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download CSV
                    </Button>
                  )}
                </div>
                {executeQueryMutation.data && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {executeQueryMutation.data.executionTime}ms
                    </span>
                    <span>{executeQueryMutation.data.rowCount} rows</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {executeQueryMutation.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {(executeQueryMutation.error as any)?.message || 'Query execution failed'}
              </AlertDescription>
            </Alert>
          )}

          {executeQueryMutation.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  Query Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {executeQueryMutation.data.columns.map((column) => (
                          <TableHead key={column} className="font-semibold">
                            {column}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executeQueryMutation.data.rows.map((row, index) => (
                        <TableRow key={index}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="font-mono text-sm">
                              {cell === null ? (
                                <span className="text-gray-400 italic">null</span>
                              ) : (
                                String(cell)
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Tabs defaultValue="tables" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Database Tables</CardTitle>
                  <CardDescription>Available tables in your database</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] w-full">
                    <div className="pr-4">
                      {tablesQuery.isLoading ? (
                        <div className="text-sm text-gray-500">Loading tables...</div>
                      ) : tablesQuery.data ? (
                        <div className="space-y-2">
                          {tablesQuery.data.map((table) => (
                            <div
                              key={table}
                              className="p-3 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border"
                              onClick={() => setQuery(`SELECT * FROM "${table}" LIMIT 10;`)}
                            >
                              <span className="font-mono text-sm break-all">{table}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Failed to load tables</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="samples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sample Queries</CardTitle>
                  <CardDescription>Common reporting queries</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] w-full">
                    <div className="pr-4 space-y-3">
                      {sampleQueries.map((sample, index) => (
                        <div
                          key={index}
                          className="p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSampleQuery(sample.query)}
                        >
                          <h4 className="font-medium text-sm text-gray-900">{sample.title}</h4>
                          <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                            {sample.query.split('\n')[0]}...
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full">
                  <div className="pr-4 space-y-2">
                    {queryHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setQuery(item.query)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={item.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-600 break-all">
                          {item.query.replace(/\s+/g, ' ')}
                        </p>
                        {item.rowCount !== undefined && (
                          <p className="text-xs text-gray-500 mt-2">
                            {item.rowCount} rows, {item.executionTime}ms
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}