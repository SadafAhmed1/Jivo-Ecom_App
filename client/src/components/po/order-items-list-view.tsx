import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, isBefore, isEqual } from "date-fns";
import { Search, Filter, Download, RefreshCw, X, Calendar, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import type { PfMst, PfOrderItems } from "@shared/schema";

interface OrderItemWithDetails extends PfOrderItems {
  po_number: string;
  platform_name: string;
  order_date: Date;
  expiry_date: Date | null;
  platform: PfMst;
}

export function OrderItemsListView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [expiryDateFrom, setExpiryDateFrom] = useState("");
  const [expiryDateTo, setExpiryDateTo] = useState("");
  
  const { data: orderItems = [], isLoading, refetch } = useQuery<OrderItemWithDetails[]>({
    queryKey: ["/api/order-items"]
  });

  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: number, status: string }) => {
      return await apiRequest(`/api/order-items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-items"] });
      toast({
        title: "Status Updated",
        description: "Order item status has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update order item status",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = (itemId: number, newStatus: string) => {
    updateStatusMutation.mutate({ itemId, status: newStatus });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Order items list has been refreshed"
    });
  };

  const handleExport = () => {
    const exportData = filteredOrderItems.map(item => ({
      'PO Number': item.po_number,
      'Platform': item.platform_name,
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
      'Expiry Date': item.expiry_date ? format(new Date(item.expiry_date), 'yyyy-MM-dd') : 'Not set'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    worksheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Items');
    
    const filename = `order-items-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast({
      title: "Export Complete",
      description: `${filteredOrderItems.length} order items exported to Excel`
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setOrderDateFrom("");
    setOrderDateTo("");
    setExpiryDateFrom("");
    setExpiryDateTo("");
    setShowFilter(false);
  };

  // Filter order items based on search term and filters
  const filteredOrderItems = orderItems.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sap_code && item.sap_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.hsn_code && item.hsn_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || (item.status || 'pending').toLowerCase() === statusFilter.toLowerCase();
    const matchesPlatform = platformFilter === "all" || item.platform.id.toString() === platformFilter;
    
    // Date filters
    const itemOrderDate = new Date(item.order_date);
    const matchesOrderDateFrom = orderDateFrom === "" || isAfter(itemOrderDate, new Date(orderDateFrom)) || isEqual(itemOrderDate, new Date(orderDateFrom));
    const matchesOrderDateTo = orderDateTo === "" || isBefore(itemOrderDate, new Date(orderDateTo)) || isEqual(itemOrderDate, new Date(orderDateTo));
    
    let matchesExpiryDateFrom = true;
    let matchesExpiryDateTo = true;
    if (item.expiry_date) {
      const itemExpiryDate = new Date(item.expiry_date);
      matchesExpiryDateFrom = expiryDateFrom === "" || isAfter(itemExpiryDate, new Date(expiryDateFrom)) || isEqual(itemExpiryDate, new Date(expiryDateFrom));
      matchesExpiryDateTo = expiryDateTo === "" || isBefore(itemExpiryDate, new Date(expiryDateTo)) || isEqual(itemExpiryDate, new Date(expiryDateTo));
    } else {
      matchesExpiryDateFrom = expiryDateFrom === "";
      matchesExpiryDateTo = expiryDateTo === "";
    }
    
    return matchesSearch && matchesStatus && matchesPlatform && 
           matchesOrderDateFrom && matchesOrderDateTo && 
           matchesExpiryDateFrom && matchesExpiryDateTo;
  });

  // Calculate totals
  const totalItems = filteredOrderItems.length;
  const totalQuantity = filteredOrderItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = filteredOrderItems.reduce((sum, item) => 
    sum + (parseFloat(item.landing_rate || '0') * item.quantity), 0
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'default';
      case 'invoiced': return 'secondary';
      case 'dispatched': return 'secondary';
      case 'delivered': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'destructive';
      case 'price difference': return 'outline';
      case 'mov issue': return 'outline';
      case 'stock issue': return 'outline';
      case 'hold': return 'outline';
      case 'cn': return 'outline';
      case 'rtv': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading order items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Search order items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-600"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {(statusFilter !== "all" || platformFilter !== "all" || 
                orderDateFrom !== "" || orderDateTo !== "" || 
                expiryDateFrom !== "" || expiryDateTo !== "") && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredOrderItems.length} of {orderItems.length} items
            </span>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={filteredOrderItems.length === 0}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilter(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Status and Platform Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="price difference">Price Difference</SelectItem>
                        <SelectItem value="mov issue">MOV Issue</SelectItem>
                        <SelectItem value="stock issue">Stock Issue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                        <SelectItem value="cn">CN</SelectItem>
                        <SelectItem value="rtv">RTV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Platform
                    </Label>
                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id.toString()}>
                            {platform.pf_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Date Filters</h4>
                  </div>
                  
                  {/* Order Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Order Date From
                      </Label>
                      <Input
                        type="date"
                        value={orderDateFrom}
                        onChange={(e) => setOrderDateFrom(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Order Date To
                      </Label>
                      <Input
                        type="date"
                        value={orderDateTo}
                        onChange={(e) => setOrderDateTo(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Expiry Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date From
                      </Label>
                      <Input
                        type="date"
                        value={expiryDateFrom}
                        onChange={(e) => setExpiryDateFrom(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expiry Date To
                      </Label>
                      <Input
                        type="date"
                        value={expiryDateTo}
                        onChange={(e) => setExpiryDateTo(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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

      {/* Order Items Cards */}
      {orderItems.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Order Items Found</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
              No order items have been created yet. Create purchase orders to see items here.
            </p>
          </CardContent>
        </Card>
      ) : filteredOrderItems.length === 0 ? (
        <Card className="shadow-lg border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-orange-500 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Matching Order Items</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
              No order items match your current search and filter criteria.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrderItems.map((item) => (
            <Card key={item.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{item.item_name}</CardTitle>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                        {item.po_number} • {item.platform_name}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center space-x-2 px-3 py-1"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Badge 
                            variant={getStatusBadgeVariant(item.status || 'pending')}
                            className="text-xs font-semibold border-none bg-transparent p-0"
                          >
                            {item.status || 'Pending'}
                          </Badge>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Pending')}
                          className="cursor-pointer"
                        >
                          <Badge variant="default" className="text-xs mr-2">Pending</Badge>
                          Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Invoiced')}
                          className="cursor-pointer"
                        >
                          <Badge variant="secondary" className="text-xs mr-2">Invoiced</Badge>
                          Invoiced
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Dispatched')}
                          className="cursor-pointer"
                        >
                          <Badge variant="secondary" className="text-xs mr-2">Dispatched</Badge>
                          Dispatched
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Delivered')}
                          className="cursor-pointer"
                        >
                          <Badge variant="secondary" className="text-xs mr-2">Delivered</Badge>
                          Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Price Difference')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">Price Difference</Badge>
                          Price Difference
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'MOV Issue')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">MOV Issue</Badge>
                          MOV Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Stock Issue')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">Stock Issue</Badge>
                          Stock Issue
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Cancelled')}
                          className="cursor-pointer"
                        >
                          <Badge variant="destructive" className="text-xs mr-2">Cancelled</Badge>
                          Cancelled
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Expired')}
                          className="cursor-pointer"
                        >
                          <Badge variant="destructive" className="text-xs mr-2">Expired</Badge>
                          Expired
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'Hold')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">Hold</Badge>
                          Hold
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'CN')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">CN</Badge>
                          CN
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusUpdate(item.id, 'RTV')}
                          className="cursor-pointer"
                        >
                          <Badge variant="outline" className="text-xs mr-2">RTV</Badge>
                          RTV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ₹{(parseFloat(item.landing_rate || '0') * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Item Total</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Landing Rate</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{parseFloat(item.landing_rate || '0').toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">SAP Code</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.sap_code || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">HSN Code</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.hsn_code || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Additional Details Row */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Order: {format(new Date(item.order_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {item.expiry_date && (
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Expires: {format(new Date(item.expiry_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm">
                      {item.basic_rate && (
                        <span className="text-gray-600 dark:text-gray-400">
                          Basic: ₹{parseFloat(item.basic_rate).toFixed(2)}
                        </span>
                      )}
                      {item.gst_rate && (
                        <span className="text-gray-600 dark:text-gray-400">
                          GST: {parseFloat(item.gst_rate).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}