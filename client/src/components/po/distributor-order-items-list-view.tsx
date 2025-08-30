import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isAfter, isBefore, isEqual } from "date-fns";
import { Search, Filter, Download, RefreshCw, X, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import type { DistributorMst, DistributorOrderItems } from "@shared/schema";

interface DistributorOrderItemWithDetails extends DistributorOrderItems {
  po_number: string;
  distributor_name: string;
  order_date: Date;

  expiry_date: Date | null;
  distributor: DistributorMst;
}

export function DistributorOrderItemsListView() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [distributorFilter, setDistributorFilter] = useState("all");
  
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [expiryDateFrom, setExpiryDateFrom] = useState("");
  const [expiryDateTo, setExpiryDateTo] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  const { data: orderItems = [], isLoading, refetch } = useQuery<DistributorOrderItemWithDetails[]>({
    queryKey: ["/api/distributor-order-items"]
  });

  // Debug logging
  console.log("🔍 DistributorOrderItems Debug:", {
    isLoading,
    itemsCount: orderItems.length,
    items: orderItems.slice(0, 2) // First 2 items for debugging
  });

  const { data: distributors = [] } = useQuery<DistributorMst[]>({
    queryKey: ["/api/distributors"]
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/distributor-order-items/${itemId}`, {
        status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributor-order-items"] });
      toast({
        title: "Status updated",
        description: "Item status has been updated successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update item status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (itemId: number, newStatus: string) => {
    updateStatusMutation.mutate({ itemId, status: newStatus });
  };

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      const response = await apiRequest('PATCH', '/api/distributor-order-items/bulk-approve', {
        itemIds
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/distributor-order-items"] });
      setSelectedItems(new Set());
      toast({
        title: "Approval Successful",
        description: `${selectedItems.size} items have been approved successfully`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve selected items",
        variant: "destructive"
      });
    }
  });

  const handleBulkApprove = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to approve",
        variant: "destructive"
      });
      return;
    }
    bulkApproveMutation.mutate(Array.from(selectedItems));
  };

  const handleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Filter items first before using in handlers
  const filteredOrderItems = orderItems.filter(item => {
    try {
      // Text search with safe property access
      const searchTermLower = searchTerm && typeof searchTerm === 'string' ? searchTerm.toLowerCase() : '';
      const matchesSearch = !searchTermLower || 
        (item.item_name && typeof item.item_name === 'string' && item.item_name.toLowerCase().includes(searchTermLower)) ||
        (item.po_number && typeof item.po_number === 'string' && item.po_number.toLowerCase().includes(searchTermLower)) ||
        (item.distributor_name && typeof item.distributor_name === 'string' && item.distributor_name.toLowerCase().includes(searchTermLower)) ||
        (item.sap_code && typeof item.sap_code === 'string' && item.sap_code.toLowerCase().includes(searchTermLower)) ||
        (item.category && typeof item.category === 'string' && item.category.toLowerCase().includes(searchTermLower));

      // Status filter with safe property access
      const matchesStatus = statusFilter === "all" || (item.status && item.status === statusFilter);

      // Distributor filter with safe property access
      const matchesDistributor = distributorFilter === "all" || 
        (item.distributor && item.distributor.id && item.distributor.id.toString() === distributorFilter);

      // Date range filters with safe property access
      const orderDate = item.order_date ? new Date(item.order_date) : new Date();
      const matchesOrderDateFrom = !orderDateFrom || 
        isAfter(orderDate, new Date(orderDateFrom)) || 
        isEqual(orderDate, new Date(orderDateFrom));
      const matchesOrderDateTo = !orderDateTo || 
        isBefore(orderDate, new Date(orderDateTo)) || 
        isEqual(orderDate, new Date(orderDateTo));

      let matchesExpiryDateFrom = true;
      let matchesExpiryDateTo = true;
      if (item.expiry_date) {
        const expiryDate = new Date(item.expiry_date);
        matchesExpiryDateFrom = !expiryDateFrom || 
          isAfter(expiryDate, new Date(expiryDateFrom)) || 
          isEqual(expiryDate, new Date(expiryDateFrom));
        matchesExpiryDateTo = !expiryDateTo || 
          isBefore(expiryDate, new Date(expiryDateTo)) || 
          isEqual(expiryDate, new Date(expiryDateTo));
      }

      return matchesSearch && matchesStatus && matchesDistributor && 
             matchesOrderDateFrom && matchesOrderDateTo && 
             matchesExpiryDateFrom && matchesExpiryDateTo;
    } catch (error) {
      console.error("❌ Error filtering distributor order item:", error, item);
      return false; // Exclude items that cause filtering errors
    }
  });

  const handleSelectAll = () => {
    if (selectedItems.size === filteredOrderItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredOrderItems.map(item => item.id)));
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Distributor order items list has been refreshed"
    });
  };

  const handleExport = () => {
    try {
      const exportData = filteredOrderItems.map(item => ({
        'PO Number': item.po_number || 'N/A',
        'Distributor': item.distributor_name || 'N/A',
        'Item Name': item.item_name || 'N/A',
        'SAP Code': item.sap_code || 'N/A',
        'HSN Code': item.hsn_code || 'N/A',
        'Quantity': item.quantity || 0,
        'Basic Rate': parseFloat(item.basic_rate || '0'),
        'GST Rate': parseFloat(item.gst_rate || '0'),
        'Landing Rate': parseFloat(item.landing_rate || '0'),
        'Item Total': parseFloat((parseFloat(item.landing_rate || '0') * (item.quantity || 0)).toFixed(2)),
        'Status': item.status || 'Pending',
        'Order Date': item.order_date ? format(new Date(item.order_date), 'yyyy-MM-dd') : 'N/A',
        'Expiry Date': item.expiry_date ? format(new Date(item.expiry_date), 'yyyy-MM-dd') : 'N/A',
        'Category': item.category || 'N/A',
        'Subcategory': item.subcategory || 'N/A',
        'Total Litres': parseFloat(item.total_litres || '0')
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Distributor Order Items");
      XLSX.writeFile(workbook, `distributor-order-items-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      
      toast({
        title: "Export Successful",
        description: "Distributor order items exported to Excel file"
      });
    } catch (error) {
      console.error("❌ Error exporting distributor order items:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export distributor order items to Excel",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDistributorFilter("all");
    setOrderDateFrom("");
    setOrderDateTo("");
    setExpiryDateFrom("");
    setExpiryDateTo("");
    setSearchTerm("");
  };

  // Calculate totals
  const totalItems = filteredOrderItems.length;
  const totalQuantity = filteredOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredOrderItems.reduce((sum, item) => 
    sum + (parseFloat(item.landing_rate || '0') * item.quantity), 0
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
              placeholder="Search items, PO number, distributor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedItems.size > 0 && (
            <Button 
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {bulkApproveMutation.isPending ? 'Approving...' : `APPROVE PO LINES (${selectedItems.size})`}
            </Button>
          )}
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

      {/* Filter Panel */}
      {showFilter && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Distributor</Label>
                <Select value={distributorFilter} onValueChange={setDistributorFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Distributors</SelectItem>
                    {distributors.map((distributor) => (
                      <SelectItem key={distributor.id} value={distributor.id.toString()}>
                        {distributor.distributor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order Date From</Label>
                <Input
                  type="date"
                  value={orderDateFrom}
                  onChange={(e) => setOrderDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Order Date To</Label>
                <Input
                  type="date"
                  value={orderDateTo}
                  onChange={(e) => setOrderDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date From</Label>
                <Input
                  type="date"
                  value={expiryDateFrom}
                  onChange={(e) => setExpiryDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date To</Label>
                <Input
                  type="date"
                  value={expiryDateTo}
                  onChange={(e) => setExpiryDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">{totalQuantity}</div>
                <p className="text-xs text-muted-foreground">Total Quantity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <div className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</div>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DEBUG: Status indicator */}
      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
        <p className="text-sm font-medium text-yellow-800">
          🔍 DEBUG: Items loaded: {orderItems.length} | Filtered: {filteredOrderItems.length} | Loading: {isLoading ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Order Items List */}
      {filteredOrderItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No order items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No distributor order items match your current search and filter criteria.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Distributor Order Items ({filteredOrderItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-4 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredOrderItems.length && filteredOrderItems.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">Item Details</th>
                    <th className="text-left p-4 font-medium">PO Number</th>
                    <th className="text-left p-4 font-medium">Distributor</th>
                    <th className="text-left p-4 font-medium">Quantity</th>
                    <th className="text-left p-4 font-medium">Rates</th>
                    <th className="text-left p-4 font-medium">Total</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Order Date</th>
                  </tr>
                </thead>
                
                <tbody>
                  {filteredOrderItems.map((item) => {
                    const itemTotal = parseFloat(item.landing_rate || '0') * item.quantity;
                    console.log("🎯 Rendering item:", { 
                      id: item.id, 
                      status: item.status, 
                      item_name: item.item_name,
                      item_name_type: typeof item.item_name,
                      po_number: item.po_number,
                      po_number_type: typeof item.po_number,
                      distributor_name: item.distributor_name,
                      distributor_name_type: typeof item.distributor_name,
                      sap_code: item.sap_code,
                      sap_code_type: typeof item.sap_code,
                      category: item.category,
                      category_type: typeof item.category
                    });
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{item.item_name}</div>
                          <div className="text-sm text-gray-500">
                            {item.sap_code && `SAP: ${item.sap_code}`}
                            {item.hsn_code && ` | HSN: ${item.hsn_code}`}
                          </div>
                          {item.category && (
                            <div className="text-sm text-gray-500">
                              {item.category}
                              {item.subcategory && ` > ${item.subcategory}`}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{item.po_number}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{item.distributor_name}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{item.quantity}</div>
                          {item.total_litres && parseFloat(item.total_litres) > 0 && (
                            <div className="text-sm text-gray-500">
                              {parseFloat(item.total_litres).toFixed(3)}L
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div>Basic: ₹{parseFloat(item.basic_rate || '0').toFixed(2)}</div>
                            <div>GST: {parseFloat(item.gst_rate || '0').toFixed(2)}%</div>
                            <div>Landing: ₹{parseFloat(item.landing_rate || '0').toFixed(2)}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">₹{itemTotal.toLocaleString('en-IN')}</div>
                        </td>
                        <td className="p-4">
                          <div className="relative">
                            <select
                              value={item.status || "PENDING"}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              disabled={updateStatusMutation.isPending}
                              className="w-full h-10 px-3 py-2 bg-white border-2 border-blue-300 rounded-md text-sm font-semibold shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 cursor-pointer hover:border-blue-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                minWidth: '140px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                backgroundColor: '#f8fafc',
                                color: item.status === 'CANCELLED' ? '#dc2626' : 
                                       item.status === 'DELIVERED' ? '#059669' :
                                       item.status === 'SHIPPED' ? '#0284c7' :
                                       item.status === 'CONFIRMED' ? '#7c3aed' : '#6b7280'
                              }}
                            >
                              <option value="PENDING">📋 Pending</option>
                              <option value="CONFIRMED">✅ Confirmed</option>
                              <option value="SHIPPED">🚚 Shipped</option>
                              <option value="DELIVERED">📦 Delivered</option>
                              <option value="CANCELLED">❌ Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">
                            {format(new Date(item.order_date), 'MMM dd, yyyy')}
                          </div>
                          {item.expiry_date && (
                            <div className="text-sm text-gray-500">
                              Exp: {format(new Date(item.expiry_date), 'MMM dd, yyyy')}
                            </div>
                          )}
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