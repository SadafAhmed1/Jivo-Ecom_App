import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, isEqual } from "date-fns";
import { Search, Filter, Download, RefreshCw, X, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  
  const { data: orderItems = [], isLoading, refetch } = useQuery<DistributorOrderItemWithDetails[]>({
    queryKey: ["/api/distributor-order-items"]
  });

  const { data: distributors = [] } = useQuery<DistributorMst[]>({
    queryKey: ["/api/distributors"]
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Distributor order items list has been refreshed"
    });
  };

  const handleExport = () => {
    const exportData = filteredOrderItems.map(item => ({
      'PO Number': item.po_number,
      'Distributor': item.distributor_name,
      'Item Name': item.item_name,
      'SAP Code': item.sap_code || 'N/A',
      'HSN Code': item.hsn_code || 'N/A',
      'Quantity': item.quantity,
      'Basic Rate': parseFloat(item.basic_rate || '0'),
      'GST Rate': parseFloat(item.gst_rate || '0'),
      'Landing Rate': parseFloat(item.landing_rate || '0'),
      'Item Total': parseFloat((parseFloat(item.landing_rate || '0') * item.quantity).toFixed(2)),
      'Status': item.status || 'Pending',
      'Order Date': format(new Date(item.order_date), 'yyyy-MM-dd'),
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

  const filteredOrderItems = orderItems.filter(item => {
    // Text search
    const matchesSearch = !searchTerm || 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.distributor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sap_code && item.sap_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    // Distributor filter
    const matchesDistributor = distributorFilter === "all" || 
      item.distributor.id.toString() === distributorFilter;

    // Date range filters
    const orderDate = new Date(item.order_date);
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
  });

  // Calculate totals
  const totalItems = filteredOrderItems.length;
  const totalQuantity = filteredOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredOrderItems.reduce((sum, item) => 
    sum + (parseFloat(item.landing_rate || '0') * item.quantity), 0
  );

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

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
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50/50">
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
                          <Badge variant={getStatusVariant(item.status || 'Pending')}>
                            {item.status || 'Pending'}
                          </Badge>
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