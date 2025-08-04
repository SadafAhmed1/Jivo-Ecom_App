import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, Save, Trash2, Plus, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PfPo, PfMst, PfOrderItems } from "@shared/schema";

interface POWithDetails extends Omit<PfPo, 'platform'> {
  platform: PfMst;
  orderItems: PfOrderItems[];
}

interface OrderItem {
  id?: number;
  item_name: string;
  quantity: number;
  landing_rate: string;
  hsn_code?: string;
}

export default function POEdit() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const poId = params.id;

  // Form state
  const [formData, setFormData] = useState({
    po_number: "",
    platform_id: "",
    status: "",
    order_date: "",
    expiry_date: "",
    city: "",
    state: "",
    serving_distributor: ""
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Fetch PO data
  const { data: po, isLoading: poLoading } = useQuery<POWithDetails>({
    queryKey: [`/api/pos/${poId}`],
    enabled: !!poId
  });

  // Fetch platforms for dropdown
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Initialize form with PO data
  useEffect(() => {
    if (po) {
      setFormData({
        po_number: po.po_number,
        platform_id: po.platform.id.toString(),
        status: po.status || "",
        order_date: format(new Date(po.order_date), 'yyyy-MM-dd'),
        expiry_date: po.expiry_date ? format(new Date(po.expiry_date), 'yyyy-MM-dd') : "",
        city: po.city || "",
        state: po.state || "",
        serving_distributor: po.serving_distributor || ""
      });
      setOrderItems(po.orderItems.map(item => ({
        id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        landing_rate: item.landing_rate,
        hsn_code: item.sap_code || ""
      })));
    }
  }, [po]);

  // Update PO mutation
  const updatePOMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/pos/${poId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/pos/${poId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
      toast({
        title: "Success",
        description: "Purchase order updated successfully"
      });
      setLocation(`/po-details/${poId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update purchase order",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.po_number || !formData.platform_id || !formData.order_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one order item",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      platform_id: parseInt(formData.platform_id),
      expiry_date: formData.expiry_date || null,
      orderItems: orderItems.filter(item => item.item_name && item.quantity > 0)
    };

    updatePOMutation.mutate(submitData);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      item_name: "",
      quantity: 1,
      landing_rate: "0",
      hsn_code: ""
    }]);
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updated = orderItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + (parseFloat(item.landing_rate) * item.quantity);
    }, 0);
  };

  if (poLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!po) {
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-green-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/po-details/${poId}`)}
              className="hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Edit Purchase Order
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Modify details for {po.po_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/po-details/${poId}`)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updatePOMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {updatePOMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="po_number">PO Number *</Label>
                    <Input
                      id="po_number"
                      value={formData.po_number}
                      onChange={(e) => setFormData({...formData, po_number: e.target.value})}
                      placeholder="Enter PO number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform *</Label>
                    <Select 
                      value={formData.platform_id} 
                      onValueChange={(value) => setFormData({...formData, platform_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id.toString()}>
                            {platform.pf_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="duplicate">Duplicate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serving_distributor">Serving Distributor</Label>
                    <Input
                      id="serving_distributor"
                      value={formData.serving_distributor}
                      onChange={(e) => setFormData({...formData, serving_distributor: e.target.value})}
                      placeholder="Enter distributor name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates and Location */}
            <Card>
              <CardHeader>
                <CardTitle>Dates & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_date">Order Date *</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      placeholder="Enter state"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Items ({orderItems.length})</CardTitle>
                <Button type="button" onClick={addOrderItem} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items added yet. Click "Add Item" to get started.</p>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium text-sm">
                        <div className="col-span-4">Item Name</div>
                        <div className="col-span-2">Quantity</div>
                        <div className="col-span-2">Rate (₹)</div>
                        <div className="col-span-2">HSN Code</div>
                        <div className="col-span-1">Total</div>
                        <div className="col-span-1">Action</div>
                      </div>
                      
                      {/* Items */}
                      {orderItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="col-span-4">
                            <Input
                              value={item.item_name}
                              onChange={(e) => updateOrderItem(index, 'item_name', e.target.value)}
                              placeholder="Item name"
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.landing_rate}
                              onChange={(e) => updateOrderItem(index, 'landing_rate', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={item.hsn_code}
                              onChange={(e) => updateOrderItem(index, 'hsn_code', e.target.value)}
                              placeholder="HSN code"
                              className="w-full"
                            />
                          </div>
                          <div className="col-span-1 flex items-center">
                            <span className="text-sm font-medium">
                              ₹{(parseFloat(item.landing_rate) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-1 flex items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total */}
                      <Separator />
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="text-xl font-bold text-primary">₹{calculateTotal().toFixed(2)}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}