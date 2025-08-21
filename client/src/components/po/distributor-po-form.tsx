import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { DistributorMst } from "@shared/schema";

const formSchema = z.object({
  po_number: z.string().min(1, "PO number is required"),
  distributor_id: z.string().min(1, "Distributor is required"),
  serving_distributor: z.string().optional(),
  order_date: z.date({ required_error: "Order date is required" }),
  expiry_date: z.date().optional(),
  appointment_date: z.date().optional(),
  region: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  status: z.string().default("Open")
});

type FormData = z.infer<typeof formSchema>;

interface OrderItem {
  item_name: string;
  sap_code: string;
  quantity: number;
  basic_rate: string;
  gst_rate: string;
  landing_rate: string;
  category?: string;
  subcategory?: string;
  total_litres?: string;
  hsn_code?: string;
}

export function DistributorPOForm() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { item_name: "", sap_code: "", quantity: 1, basic_rate: "", gst_rate: "", landing_rate: "" }
  ]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      po_number: "",
      distributor_id: "",
      order_date: new Date(),
      status: "Open"
    }
  });

  // Fetch distributors
  const { data: distributors = [] } = useQuery<DistributorMst[]>({
    queryKey: ["/api/distributors"]
  });

  // All items now come from HANA SQL Server via stored procedure

  const createPOMutation = useMutation({
    mutationFn: async (data: { header: FormData & { distributor_id: number }; items: OrderItem[] }) => {
      return await apiRequest('POST', '/api/distributor-pos', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Distributor purchase order created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/distributor-pos"] });
      
      // Navigate to the platform PO list page after successful creation
      setLocation("/platform-po");
      
      form.reset();
      setOrderItems([{ item_name: "", sap_code: "", quantity: 1, basic_rate: "", gst_rate: "", landing_rate: "" }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive"
      });
    }
  });

  const addOrderItem = () => {
    setOrderItems([...orderItems, { 
      item_name: "", sap_code: "", quantity: 1, basic_rate: "", gst_rate: "", landing_rate: "" 
    }]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrderItems(updatedItems);
  };

  const calculateLandingRate = (basicRate: string, gstRate: string) => {
    const basic = parseFloat(basicRate) || 0;
    const gst = parseFloat(gstRate) || 0;
    const landingRate = basic + (basic * gst / 100);
    return landingRate.toFixed(2);
  };

  const onSubmit = (data: FormData) => {
    const validItems = orderItems.filter(item => 
      item.item_name.trim() && item.quantity > 0 && item.basic_rate && item.gst_rate
    );

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid order item",
        variant: "destructive"
      });
      return;
    }

    const header = {
      ...data,
      distributor_id: parseInt(data.distributor_id)
    } as FormData & { distributor_id: number };
    
    createPOMutation.mutate({
      header,
      items: validItems.map(item => ({
        ...item,
        landing_rate: calculateLandingRate(item.basic_rate, item.gst_rate)
      }))
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* PO Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_number">PO Number *</Label>
              <Input
                id="po_number"
                placeholder="Enter PO number"
                {...form.register("po_number")}
              />
              {form.formState.errors.po_number && (
                <p className="text-sm text-red-600">{form.formState.errors.po_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributor_id">Distributor *</Label>
              <Select
                value={form.watch("distributor_id")}
                onValueChange={(value) => form.setValue("distributor_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select distributor" />
                </SelectTrigger>
                <SelectContent>
                  {distributors.map((distributor) => (
                    <SelectItem key={distributor.id} value={distributor.id.toString()}>
                      {distributor.distributor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.distributor_id && (
                <p className="text-sm text-red-600">{form.formState.errors.distributor_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serving_distributor">Serving Distributor</Label>
              <Input
                id="serving_distributor"
                placeholder="Enter serving distributor (optional)"
                {...form.register("serving_distributor")}
              />
            </div>

            <div className="space-y-2">
              <Label>Order Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("order_date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("order_date") ? format(form.watch("order_date")!, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("order_date")}
                    onSelect={(date) => form.setValue("order_date", date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.watch("expiry_date") && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("expiry_date") ? format(form.watch("expiry_date")!, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch("expiry_date")}
                    onSelect={(date) => form.setValue("expiry_date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                placeholder="Enter region"
                {...form.register("region")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Enter state"
                {...form.register("state")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Enter city"
                {...form.register("city")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                placeholder="Enter area"
                {...form.register("area")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`item_name_${index}`}>Item Name *</Label>
                  <Input
                    id={`item_name_${index}`}
                    value={item.item_name}
                    onChange={(e) => updateOrderItem(index, "item_name", e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`sap_code_${index}`}>SAP Code</Label>
                  <Input
                    id={`sap_code_${index}`}
                    value={item.sap_code}
                    onChange={(e) => updateOrderItem(index, "sap_code", e.target.value)}
                    placeholder="Enter SAP code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quantity_${index}`}>Quantity *</Label>
                  <Input
                    id={`quantity_${index}`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`basic_rate_${index}`}>Basic Rate *</Label>
                  <Input
                    id={`basic_rate_${index}`}
                    type="number"
                    step="0.01"
                    value={item.basic_rate}
                    onChange={(e) => {
                      updateOrderItem(index, "basic_rate", e.target.value);
                      updateOrderItem(index, "landing_rate", calculateLandingRate(e.target.value, item.gst_rate));
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`gst_rate_${index}`}>GST Rate (%) *</Label>
                  <Input
                    id={`gst_rate_${index}`}
                    type="number"
                    step="0.01"
                    value={item.gst_rate}
                    onChange={(e) => {
                      updateOrderItem(index, "gst_rate", e.target.value);
                      updateOrderItem(index, "landing_rate", calculateLandingRate(item.basic_rate, e.target.value));
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Landing Rate</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={item.landing_rate}
                      readOnly
                      className="bg-gray-50"
                      placeholder="Auto-calculated"
                    />
                    {orderItems.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor={`hsn_code_${index}`}>HSN Code</Label>
                  <Input
                    id={`hsn_code_${index}`}
                    value={item.hsn_code || ""}
                    onChange={(e) => updateOrderItem(index, "hsn_code", e.target.value)}
                    placeholder="Enter HSN code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`category_${index}`}>Category</Label>
                  <Input
                    id={`category_${index}`}
                    value={item.category || ""}
                    onChange={(e) => updateOrderItem(index, "category", e.target.value)}
                    placeholder="Enter category"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subcategory_${index}`}>Subcategory</Label>
                  <Input
                    id={`subcategory_${index}`}
                    value={item.subcategory || ""}
                    onChange={(e) => updateOrderItem(index, "subcategory", e.target.value)}
                    placeholder="Enter subcategory"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`total_litres_${index}`}>Total Litres</Label>
                  <Input
                    id={`total_litres_${index}`}
                    type="number"
                    step="0.001"
                    value={item.total_litres || ""}
                    onChange={(e) => updateOrderItem(index, "total_litres", e.target.value)}
                    placeholder="0.000"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={createPOMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {createPOMutation.isPending ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}