import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Save, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineItemRow } from "./line-item-row";
import type { PfMst, InsertPfOrderItems } from "@shared/schema";

const poFormSchema = z.object({
  po_number: z.string().min(1, "PO number is required"),
  platform: z.number().min(1, "Platform selection is required"),
  status: z.string().min(1, "Status is required"),
  order_date: z.string().min(1, "Order date is required"),
  expiry_date: z.string().optional(),
  appointment_date: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  serving_distributor: z.string().optional(),
  attachment: z.string().optional()
});

type POFormData = z.infer<typeof poFormSchema>;

interface LineItem extends InsertPfOrderItems {
  tempId: string;
}

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Expired", label: "Expired" },
  { value: "Duplicate", label: "Duplicate" }
];

const regionOptions = [
  { value: "North India", label: "North India" },
  { value: "South India", label: "South India" },
  { value: "East India", label: "East India" },
  { value: "West India", label: "West India" }
];

const stateOptions = [
  { value: "Punjab", label: "Punjab" },
  { value: "Delhi", label: "Delhi" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "West Bengal", label: "West Bengal" }
];

const cityOptions = [
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "New Delhi", label: "New Delhi" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Kolkata", label: "Kolkata" }
];

export function PlatformPOForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const form = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      status: "Open",
      order_date: new Date().toISOString().split('T')[0]
    }
  });

  // Fetch platforms
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Create PO mutation
  const createPoMutation = useMutation({
    mutationFn: async (data: { po: POFormData; items: InsertPfOrderItems[] }) => {
      const response = await apiRequest("POST", "/api/pos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully!"
      });
      form.reset();
      setLineItems([]);
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive"
      });
    }
  });

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: `temp-${Date.now()}`,
      po_id: 0, // Temporary value, will be set by backend
      item_name: "",
      quantity: 0,
      sap_code: "",
      category: "",
      subcategory: "",
      basic_rate: "0",
      gst_rate: "0",
      landing_rate: "0",
      status: "Pending"
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (tempId: string, updates: Partial<LineItem>) => {
    setLineItems(items => 
      items.map(item => 
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(items => items.filter(item => item.tempId !== tempId));
  };

  const calculateTotals = () => {
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = lineItems.reduce((sum, item) => {
      const landingRate = parseFloat(item.landing_rate || "0");
      const quantity = item.quantity || 0;
      return sum + (landingRate * quantity);
    }, 0);

    return { totalQuantity, totalValue };
  };

  const onSubmit = (data: POFormData) => {
    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive"
      });
      return;
    }

    const items: InsertPfOrderItems[] = lineItems.map(({ tempId, ...item }) => ({
      ...item,
      po_id: 0 // Will be set by the backend
    }));

    createPoMutation.mutate({ po: data, items });
  };

  const { totalQuantity, totalValue } = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Form Header */}
      <Card className="mb-6">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create New Purchase Order</h3>
            <div className="flex items-center space-x-3">
              <Button variant="outline" type="button">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button variant="secondary" type="button">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                type="submit" 
                form="po-form"
                disabled={createPoMutation.isPending}
              >
                <Check className="mr-2 h-4 w-4" />
                Create PO
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form id="po-form" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="po_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PO Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter PO number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id.toString()}>
                              {platform.pf_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="appointment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stateOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select City" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter area/locality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serving_distributor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serving Distributor</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter distributor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Line Items Section */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            <Button type="button" onClick={addLineItem} className="bg-secondary hover:bg-green-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SAP Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Landing Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.map((item) => (
                <LineItemRow
                  key={item.tempId}
                  item={item}
                  platformId={form.watch("platform")}
                  onUpdate={(updates) => updateLineItem(item.tempId, updates)}
                  onRemove={() => removeLineItem(item.tempId)}
                />
              ))}
              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No items added yet. Click "Add Item" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        {lineItems.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {lineItems.length} item(s) • Total Quantity: {totalQuantity}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                Total Value: ₹{totalValue.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" type="button">
          Cancel
        </Button>
        <Button variant="secondary" type="button">
          Save as Draft
        </Button>
        <Button 
          type="submit" 
          form="po-form"
          disabled={createPoMutation.isPending}
          className="px-8 font-medium"
        >
          Create Purchase Order
        </Button>
      </div>
    </div>
  );
}
