import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Database, RefreshCw, Download, CheckCircle } from "lucide-react";

interface SapItem {
  id: number;
  itemcode: string;
  itemname: string;
  type?: string;
  itemgroup?: string;
  brand?: string;
  uom?: string;
  last_synced?: string;
  created_at: string;
}

interface SyncResponse {
  success: boolean;
  message: string;
  count: number;
}

export default function SapSync() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch SAP items from API table
  const { data: sapItems = [], isLoading } = useQuery<SapItem[]>({
    queryKey: ['/api/sap-items-api'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      return await apiRequest('/api/sap-items-api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Sync completed successfully",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sap-items-api'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync SAP items",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const latestSync = sapItems.length > 0 
    ? new Date(Math.max(...sapItems.map(item => new Date(item.last_synced || item.created_at).getTime())))
    : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SAP Item Master Sync</h1>
          <p className="text-gray-600 mt-2">
            Synchronize item master data from SAP B1 Hanna ERP system
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2"
        >
          {syncMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncMutation.isPending ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : sapItems.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">In SAP API table</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSync ? formatDate(latestSync.toISOString()).split(',')[0] : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestSync ? formatDate(latestSync.toISOString()).split(',')[1] : 'No sync performed yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <Badge variant={syncMutation.isPending ? "secondary" : "default"}>
              {syncMutation.isPending ? "Running" : "Ready"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncMutation.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Idle"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncMutation.isPending ? "Fetching from SQL Server..." : "Click sync to update"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SAP Items</CardTitle>
              <CardDescription>
                Latest items synchronized from SAP B1 Hanna ERP
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : `View All (${sapItems.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading SAP items...</span>
            </div>
          ) : sapItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No SAP items found</p>
              <p className="text-sm">Click "Sync Now" to fetch items from SAP B1 Hanna</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sapItems.slice(0, isExpanded ? sapItems.length : 10).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.itemcode}</span>
                      {item.brand && (
                        <Badge variant="outline" className="text-xs">
                          {item.brand}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{item.itemname}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {item.type && <span>Type: {item.type}</span>}
                      {item.itemgroup && <span>Group: {item.itemgroup}</span>}
                      {item.uom && <span>UOM: {item.uom}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Synced: {formatDate(item.last_synced || item.created_at)}</p>
                  </div>
                </div>
              ))}
              
              {!isExpanded && sapItems.length > 10 && (
                <div className="text-center py-4">
                  <Button variant="outline" onClick={() => setIsExpanded(true)}>
                    Show {sapItems.length - 10} more items
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}