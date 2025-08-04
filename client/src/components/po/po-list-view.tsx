import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Eye, Edit, Trash2, Filter, Download, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PfMst, PfOrderItems } from "@shared/schema";

interface POWithDetails {
  id: number;
  po_number: string;
  status: string;
  order_date: Date;
  expiry_date: Date | null;
  city: string;
  state: string;
  serving_distributor: string | null;
  platform: PfMst;
  orderItems: PfOrderItems[];
}

export function POListView() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: pos = [], isLoading, refetch } = useQuery<POWithDetails[]>({
    queryKey: ["/api/pos"]
  });

  const deletePOMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/pos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive"
      });
    }
  });

  const handleView = (po: POWithDetails) => {
    setLocation(`/po-details/${po.id}`);
  };

  const handleEdit = (po: POWithDetails) => {
    setLocation(`/po-edit/${po.id}`);
  };

  const handleDelete = (po: POWithDetails) => {
    if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
      deletePOMutation.mutate(po.id);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'destructive';
      case 'duplicate': return 'outline';
      default: return 'default';
    }
  };

  const calculatePOTotals = (items: PfOrderItems[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => {
      return sum + (parseFloat(item.landing_rate) * item.quantity);
    }, 0);
    return { totalQuantity, totalValue };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search purchase orders..."
              className="pl-10 w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-600"
            />
          </div>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* PO Cards */}
      {pos.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Purchase Orders Found</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
              You haven't created any purchase orders yet. Switch to the "Create PO" tab to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pos.map((po) => {
            const { totalQuantity, totalValue } = calculatePOTotals(po.orderItems);
            
            return (
              <Card key={po.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{po.po_number}</CardTitle>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{po.platform.pf_name}</p>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(po.status)}
                        className="px-3 py-1 text-xs font-semibold"
                      >
                        {po.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleView(po)}
                        className="hover:bg-blue-50 border-blue-200"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(po)}
                        className="hover:bg-green-50 border-green-200"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(po)}
                        disabled={deletePOMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Order Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {format(new Date(po.order_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiry Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {po.expiry_date ? format(new Date(po.expiry_date), 'MMM dd, yyyy') : 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{po.city}, {po.state}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Distributor</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {po.serving_distributor || 'Not assigned'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Summary Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{po.orderItems.length} items</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Qty: {totalQuantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        ₹{totalValue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}