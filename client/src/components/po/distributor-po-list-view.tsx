import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Eye, Edit, Trash2, Plus, Filter, Download, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import type { DistributorPo, DistributorMst, DistributorOrderItems } from "@shared/schema";

interface DistributorPOWithDetails extends Omit<DistributorPo, 'distributor_id'> {
  distributor: DistributorMst;
  orderItems: DistributorOrderItems[];
}

export function DistributorPOListView() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pos = [], isLoading, refetch } = useQuery<DistributorPOWithDetails[]>({
    queryKey: ["/api/distributor-pos"]
  });

  const deletePOMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/distributor-pos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributor-pos"] });
      toast({
        title: "Success",
        description: "Distributor purchase order deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete distributor purchase order",
        variant: "destructive"
      });
    }
  });

  const handleView = (po: DistributorPOWithDetails) => {
    setLocation(`/distributor-po-details/${po.id}`);
  };

  const handleEdit = (po: DistributorPOWithDetails) => {
    setLocation(`/distributor-po-edit/${po.id}`);
  };

  const handleDelete = (po: DistributorPOWithDetails) => {
    if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
      deletePOMutation.mutate(po.id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Distributor purchase orders refreshed successfully"
    });
  };

  const handleExport = () => {
    // Prepare PO summary data
    const poSummaryData = filteredPOs.map(po => {
      const { totalQuantity, totalValue } = calculatePOTotals(po.orderItems);
      return {
        'PO Number': po.po_number,
        'Distributor': po.distributor.distributor_name,
        'Order Date': format(new Date(po.order_date), 'yyyy-MM-dd'),
        'Expiry Date': po.expiry_date ? format(new Date(po.expiry_date), 'yyyy-MM-dd') : '',
        'City': po.city || '',
        'State': po.state || '',
        'Status': po.status || '',
        'Total Items': po.orderItems.length,
        'Total Quantity': totalQuantity,
        'Total Value': totalValue.toFixed(2),
        'Created Date': format(new Date(po.created_at!), 'yyyy-MM-dd')
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(poSummaryData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Distributor PO Summary");

    // Export file
    XLSX.writeFile(workbook, `distributor-pos-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast({
      title: "Export Successful",
      description: "Distributor purchase orders exported to Excel file"
    });
  };

  const calculatePOTotals = (items: DistributorOrderItems[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => {
      return sum + (parseFloat(item.landing_rate) * item.quantity);
    }, 0);
    return { totalQuantity, totalValue };
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'destructive';
      default: return 'default';
    }
  };

  const filteredPOs = pos.filter(po =>
    po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.distributor.distributor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.city && po.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (po.state && po.state.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by PO number, distributor, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilter(!showFilter)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pos.length}</div>
            <p className="text-xs text-muted-foreground">Total POs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {pos.filter(po => po.status === 'Open').length}
            </div>
            <p className="text-xs text-muted-foreground">Open POs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {pos.filter(po => po.status === 'Closed').length}
            </div>
            <p className="text-xs text-muted-foreground">Closed POs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {pos.filter(po => po.status === 'Cancelled').length}
            </div>
            <p className="text-xs text-muted-foreground">Cancelled POs</p>
          </CardContent>
        </Card>
      </div>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No distributor purchase orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't created any distributor purchase orders yet. Create your first PO to get started.
              </p>
              <Link href="/distributor-po">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First PO
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Distributor Purchase Orders ({filteredPOs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-4 font-medium">PO Number</th>
                    <th className="text-left p-4 font-medium">Distributor</th>
                    <th className="text-left p-4 font-medium">Order Date</th>
                    <th className="text-left p-4 font-medium">Location</th>
                    <th className="text-left p-4 font-medium">Items</th>
                    <th className="text-left p-4 font-medium">Total Value</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po) => {
                    const { totalQuantity, totalValue } = calculatePOTotals(po.orderItems);
                    return (
                      <tr key={po.id} className="border-b hover:bg-gray-50/50">
                        <td className="p-4">
                          <div className="font-medium">{po.po_number}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(po.created_at!), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{po.distributor.distributor_name}</div>
                          <div className="text-sm text-gray-500">{po.distributor.distributor_code}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">
                            {format(new Date(po.order_date), 'MMM dd, yyyy')}
                          </div>
                          {po.expiry_date && (
                            <div className="text-sm text-gray-500">
                              Expires: {format(new Date(po.expiry_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{po.city || '-'}</div>
                          <div className="text-sm text-gray-500">{po.state || '-'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{po.orderItems.length} items</div>
                          <div className="text-sm text-gray-500">{totalQuantity} qty</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">₹{totalValue.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStatusBadgeVariant(po.status || 'Open')}>
                            {po.status || 'Open'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(po)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(po)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(po)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}