import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Database, RotateCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SapItem {
  id: number;
  itemcode: string;
  itemname: string;
  itmsgrpnam: string;
  u_type: string;
  variety: string;
  subgroup: string;
  u_brand: string;
  uom: string;
  unitsize: string;
  u_is_litre: string;
  u_tax_rate: string;
  created_at: string;
  updated_at: string;
  last_synced: string;
}

export default function ItemsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch items with search
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["/api/items", searchTerm],
    queryParams: searchTerm ? { search: searchTerm, limit: "100" } : undefined,
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: () => apiRequest("/api/items/sync", { method: "POST" }),
    onSuccess: (data) => {
      toast({
        title: "Sync Completed",
        description: `${data.synced} items synced from SQL Server`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: (error) => {
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
        toast({
          title: "Auto-sync Completed",
          description: "Items synchronized automatically",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      } else {
        toast({
          title: "No Sync Needed",
          description: "Items are up to date",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Auto-sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading items: {error.message}</p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/items"] })}
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            disabled={autoSyncMutation.isPending}
            variant="outline"
          >
            <Database className="w-4 h-4 mr-2" />
            {autoSyncMutation.isPending ? "Checking..." : "Auto Sync"}
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            {syncMutation.isPending ? "Syncing..." : "Manual Sync"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map((item: SapItem) => item.u_brand).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Item Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map((item: SapItem) => item.itmsgrpnam).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {items.length > 0 && items[0]?.last_synced 
                ? formatDate(items[0].last_synced)
                : "Never"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Items</CardTitle>
          <CardDescription>
            Search by item code or item name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => handleSearch("")}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            {searchTerm ? `Search results for "${searchTerm}"` : "All items from SAP item master"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No items found matching your search" : "No items available"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Unit Size</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Is Litre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: SapItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.itemcode}</TableCell>
                      <TableCell className="max-w-xs truncate" title={item.itemname}>
                        {item.itemname}
                      </TableCell>
                      <TableCell>
                        {item.u_brand && (
                          <Badge variant="secondary">{item.u_brand}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.itmsgrpnam}</TableCell>
                      <TableCell>{item.u_type}</TableCell>
                      <TableCell>{item.uom}</TableCell>
                      <TableCell>{item.unitsize}</TableCell>
                      <TableCell>{item.u_tax_rate}%</TableCell>
                      <TableCell>
                        <Badge variant={item.u_is_litre === "Y" ? "default" : "outline"}>
                          {item.u_is_litre === "Y" ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}