import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, RotateCw, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ItemsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("/api/items/sync", { method: "POST" }),
    onMutate: () => {
      setSyncStatus('syncing');
    },
    onSuccess: (data) => {
      setSyncStatus('success');
      toast({
        title: "Sync Completed",
        description: `${data.synced} items synced from SQL Server`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: (error) => {
      setSyncStatus('error');
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto sync mutation
  const autoSyncMutation = useMutation({
    mutationFn: () => apiRequest("/api/items/auto-sync", { method: "POST" }),
    onSuccess: (data) => {
      if (data.syncTriggered) {
        setSyncStatus('success');
        toast({
          title: "Auto-sync Completed",
          description: "Items synchronized automatically",
        });
      } else {
        toast({
          title: "No Sync Needed",
          description: "Items are up to date",
        });
      }
    },
    onError: (error) => {
      setSyncStatus('error');
      toast({
        title: "Auto-sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RotateCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing items from SQL Server...';
      case 'success':
        return 'Items successfully synced';
      case 'error':
        return 'Sync failed - check connection';
      default:
        return 'Ready to sync item master data';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Master</h1>
          <p className="text-muted-foreground">
            SAP item master data synced from SQL Server SP_GET_ITEM_DETAILS
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => autoSyncMutation.mutate()}
            disabled={autoSyncMutation.isPending || syncMutation.isPending}
            variant="outline"
          >
            <Database className="w-4 h-4 mr-2" />
            {autoSyncMutation.isPending ? "Checking..." : "Auto Sync"}
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || autoSyncMutation.isPending}
          >
            <RotateCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? "Syncing..." : "Manual Sync"}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            SQL Server Connection
          </CardTitle>
          <CardDescription>
            Server: 103.89.44.240:5000 | Database: jsap | Stored Procedure: dbo.SP_GET_ITEM_DETAILS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={syncStatus === 'success' ? 'default' : syncStatus === 'error' ? 'destructive' : 'secondary'}>
                {getStatusText()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Last sync: {syncStatus === 'success' ? 'Just now' : 'Never'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Integration</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SQL Server</div>
            <p className="text-xs text-muted-foreground">
              Direct connection to SAP B1 Hanna ERP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Fields</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11</div>
            <p className="text-xs text-muted-foreground">
              ItemCode, ItemName, Group, Type, Brand, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Method</CardTitle>
            <RotateCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Automatic</div>
            <p className="text-xs text-muted-foreground">
              Trigger-like sync with manual override
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to set up item master synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium">Test SQL Server Connection</h4>
              <p className="text-sm text-muted-foreground">
                Click "Auto Sync" to verify connection to your SQL Server and test the stored procedure
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium">Initial Data Import</h4>
              <p className="text-sm text-muted-foreground">
                Use "Manual Sync" to perform the first complete import of item master data
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium">Automatic Updates</h4>
              <p className="text-sm text-muted-foreground">
                The system will automatically sync new changes from SAP using the trigger-like functionality
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Database Schema</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>• ItemCode (Primary Key)</div>
                <div>• ItemName (Product Name)</div>
                <div>• ItmsGrpNam (Item Group)</div>
                <div>• U_TYPE (Product Type)</div>
                <div>• Variety (Product Variety)</div>
                <div>• SubGroup (Sub Category)</div>
                <div>• U_Brand (Brand Name)</div>
                <div>• Uom (Unit of Measure)</div>
                <div>• UnitSize (Package Size)</div>
                <div>• U_IsLitre (Liquid Indicator)</div>
                <div>• U_Tax_Rate (Tax Percentage)</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sync Features</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>• Real-time data synchronization</div>
                <div>• Automatic change detection</div>
                <div>• Manual sync override capability</div>
                <div>• Connection status monitoring</div>
                <div>• Error handling and retry logic</div>
                <div>• PostgreSQL local storage</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}