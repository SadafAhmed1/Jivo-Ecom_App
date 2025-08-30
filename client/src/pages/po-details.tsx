import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Edit, Trash2, Download, Mail, Phone, Calendar, MapPin, Package, DollarSign, Clock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PfPo, PfMst, PfOrderItems } from "@shared/schema";

interface POWithDetails extends Omit<PfPo, 'platform'> {
  platform: PfMst;
  orderItems: PfOrderItems[];
}

export default function PODetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const poId = params.id;

  const { data: po, isLoading, error } = useQuery<POWithDetails>({
    queryKey: [`/api/pos/${poId}`],
    enabled: !!poId
  });

  const handleEdit = () => {
    setLocation(`/po-edit/${poId}`);
  };

  const handleDelete = async () => {
    if (!po) return;
    
    if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
      try {
        console.log("✅ Starting PO deletion from details page...");
        await apiRequest('DELETE', `/api/pos/${poId}`);
        
        // Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["/api/pos"] }),
          queryClient.invalidateQueries({ queryKey: ["/api/order-items"] }),
          queryClient.invalidateQueries({ queryKey: [`/api/pos/${poId}`] })
        ]);
        
        console.log("🔄 Cache invalidated after deletion");
        
        toast({
          title: "Success",
          description: "Purchase order deleted successfully"
        });
        setLocation("/platform-po");
      } catch (error) {
        console.error("❌ PO deletion failed:", error);
        toast({
          title: "Error",
          description: "Failed to delete purchase order",
          variant: "destructive"
        });
      }
    }
  };

  const handleDownload = () => {
    if (!po) return;
    
    // Generate and download PO as PDF or CSV
    toast({
      title: "Download Started",
      description: `Downloading PO ${po.po_number}`
    });
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Purchase Order Not Found</h2>
            <p className="text-gray-600 mb-4">The requested purchase order could not be found.</p>
            <Button onClick={() => setLocation("/platform-po")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchase Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { totalQuantity, totalValue } = calculatePOTotals(po.orderItems);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-blue-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/platform-po")}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {po.po_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {po.platform.pf_name} • Created {format(new Date(po.order_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <Badge 
              variant={getStatusBadgeVariant(po.status)}
              className="px-3 py-1 text-sm font-semibold"
            >
              {po.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* PO Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Purchase Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-semibold">{format(new Date(po.order_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-semibold">
                        {po.expiry_date ? format(new Date(po.expiry_date), 'MMM dd, yyyy') : 'Not set'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-semibold">{po.city}, {po.state}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Distributor</p>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-semibold">{po.serving_distributor || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Items</span>
                    <span className="font-semibold">{po.orderItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Quantity</span>
                    <span className="font-semibold">{totalQuantity}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-medium">Total Value</span>
                    <span className="text-lg font-bold text-primary">₹{totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({po.orderItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {po.orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No items in this purchase order</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium text-sm">
                      <div className="col-span-4">Item Name</div>
                      <div className="col-span-2 text-center">Quantity</div>
                      <div className="col-span-2 text-center">Landing Rate</div>
                      <div className="col-span-2 text-center">Total</div>
                      <div className="col-span-2 text-center">Status</div>
                    </div>
                    
                    {/* Items */}
                    {po.orderItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="col-span-4">
                          <p className="font-medium">{item.item_name}</p>
                          {item.hsn_code && (
                            <p className="text-sm text-gray-500">HSN: {item.hsn_code}</p>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="font-semibold">{item.quantity}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="font-semibold">₹{parseFloat(item.landing_rate).toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="font-semibold">₹{(parseFloat(item.landing_rate) * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}