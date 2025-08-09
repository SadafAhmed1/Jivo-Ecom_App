import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ArrowLeft, Save, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ZeptoPoHeader {
  id: number;
  po_number: string;
  status: string;
  total_quantity: number;
  total_cost_value: number;
  total_tax_amount: number;
  total_amount: number;
  unique_brands: string[];
  created_by: string;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

interface ZeptoPoLine {
  id: number;
  po_header_id: number;
  line_number: number;
  po_number: string;
  sku: string;
  brand: string;
  sku_id: string;
  sap_id: string;
  hsn_code: string;
  ean_no: string;
  po_qty: number;
  asn_qty: number;
  grn_qty: number;
  remaining_qty: number;
  cost_price: string;
  cgst: string;
  sgst: string;
  igst: string;
  cess: string;
  mrp: string;
  total_value: string;
  status: string;
  created_by: string;
  created_at: Date;
}

interface ZeptoPoWithLines extends ZeptoPoHeader {
  poLines: ZeptoPoLine[];
}

const zeptoHeaderSchema = z.object({
  po_number: z.string().min(1, "PO number is required"),
  status: z.string().min(1, "Status is required"),
  total_quantity: z.coerce.number().min(0, "Total quantity must be non-negative"),
  total_cost_value: z.coerce.number().min(0, "Total cost value must be non-negative"),
  total_tax_amount: z.coerce.number().min(0, "Total tax amount must be non-negative"),
  total_amount: z.coerce.number().min(0, "Total amount must be non-negative"),
  unique_brands: z.array(z.string()).default([]),
});

const zeptoLineSchema = z.object({
  line_number: z.coerce.number().min(1, "Line number is required"),
  sku: z.string().min(1, "SKU is required"),
  brand: z.string().min(1, "Brand is required"),
  sku_id: z.string().optional(),
  sap_id: z.string().optional(),
  hsn_code: z.string().optional(),
  ean_no: z.string().optional(),
  po_qty: z.coerce.number().min(0, "PO quantity must be non-negative"),
  asn_qty: z.coerce.number().min(0, "ASN quantity must be non-negative"),
  grn_qty: z.coerce.number().min(0, "GRN quantity must be non-negative"),
  remaining_qty: z.coerce.number().min(0, "Remaining quantity must be non-negative"),
  cost_price: z.string().min(1, "Cost price is required"),
  cgst: z.string().optional(),
  sgst: z.string().optional(),
  igst: z.string().optional(),
  cess: z.string().optional(),
  mrp: z.string().min(1, "MRP is required"),
  total_value: z.string().min(1, "Total value is required"),
  status: z.string().min(1, "Status is required"),
});

type ZeptoHeaderFormData = z.infer<typeof zeptoHeaderSchema>;
type ZeptoLineFormData = z.infer<typeof zeptoLineSchema>;

interface ZeptoPoEditProps {
  poId: string;
}

function ZeptoPoEdit({ poId }: ZeptoPoEditProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<ZeptoLineFormData[]>([]);

  const { data: zeptoPo, isLoading } = useQuery<ZeptoPoWithLines>({
    queryKey: [`/api/zepto-pos/${poId}`],
    enabled: !!poId,
  });

  const form = useForm<ZeptoHeaderFormData>({
    resolver: zodResolver(zeptoHeaderSchema),
    defaultValues: {
      po_number: "",
      status: "Open",
      total_quantity: 0,
      total_cost_value: 0,
      total_tax_amount: 0,
      total_amount: 0,
      unique_brands: [],
    },
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (zeptoPo) {
      form.reset({
        po_number: zeptoPo.po_number,
        status: zeptoPo.status,
        total_quantity: zeptoPo.total_quantity,
        total_cost_value: zeptoPo.total_cost_value,
        total_tax_amount: zeptoPo.total_tax_amount,
        total_amount: zeptoPo.total_amount,
        unique_brands: zeptoPo.unique_brands || [],
      });

      setLines(zeptoPo.poLines.map(line => ({
        line_number: line.line_number,
        sku: line.sku,
        brand: line.brand,
        sku_id: line.sku_id || "",
        sap_id: line.sap_id || "",
        hsn_code: line.hsn_code || "",
        ean_no: line.ean_no || "",
        po_qty: line.po_qty,
        asn_qty: line.asn_qty,
        grn_qty: line.grn_qty,
        remaining_qty: line.remaining_qty,
        cost_price: line.cost_price,
        cgst: line.cgst || "",
        sgst: line.sgst || "",
        igst: line.igst || "",
        cess: line.cess || "",
        mrp: line.mrp,
        total_value: line.total_value,
        status: line.status,
      })));
    }
  }, [zeptoPo, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: { header: ZeptoHeaderFormData; lines: ZeptoLineFormData[] }) => {
      return apiRequest("PUT", `/api/zepto-pos/${poId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zepto-pos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
      toast({
        title: "Success",
        description: "Zepto PO updated successfully",
      });
      setLocation("/platform-po");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update PO",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/zepto-pos/${poId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/zepto-pos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
      toast({
        title: "Success",
        description: "Zepto PO deleted successfully",
      });
      setLocation("/platform-po");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete PO",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (headerData: ZeptoHeaderFormData) => {
    // Calculate totals from lines
    const totalQuantity = lines.reduce((sum, line) => sum + line.po_qty, 0);
    const totalCostValue = lines.reduce((sum, line) => sum + parseFloat(line.cost_price || "0") * line.po_qty, 0);
    const totalTaxAmount = lines.reduce((sum, line) => {
      const cgst = parseFloat(line.cgst || "0");
      const sgst = parseFloat(line.sgst || "0");
      const igst = parseFloat(line.igst || "0");
      const cess = parseFloat(line.cess || "0");
      return sum + (cgst + sgst + igst + cess) * line.po_qty;
    }, 0);
    const totalAmount = lines.reduce((sum, line) => sum + parseFloat(line.total_value || "0"), 0);

    const updatedHeaderData = {
      ...headerData,
      total_quantity: totalQuantity,
      total_cost_value: totalCostValue,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount,
      unique_brands: Array.from(new Set(lines.map(line => line.brand))),
    };

    updateMutation.mutate({
      header: updatedHeaderData,
      lines: lines,
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete PO ${zeptoPo?.po_number}? This action cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const addLine = () => {
    const newLine: ZeptoLineFormData = {
      line_number: lines.length + 1,
      sku: "",
      brand: "",
      sku_id: "",
      sap_id: "",
      hsn_code: "",
      ean_no: "",
      po_qty: 0,
      asn_qty: 0,
      grn_qty: 0,
      remaining_qty: 0,
      cost_price: "0.00",
      cgst: "0.00",
      sgst: "0.00",
      igst: "0.00",
      cess: "0.00",
      mrp: "0.00",
      total_value: "0.00",
      status: "Pending",
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    const updatedLines = lines.filter((_, i) => i !== index);
    // Renumber the lines
    const renumberedLines = updatedLines.map((line, i) => ({
      ...line,
      line_number: i + 1,
    }));
    setLines(renumberedLines);
  };

  const updateLine = (index: number, field: keyof ZeptoLineFormData, value: string | number) => {
    const updatedLines = [...lines];
    updatedLines[index] = { ...updatedLines[index], [field]: value };
    setLines(updatedLines);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!zeptoPo) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-2xl font-bold mb-4">PO Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested Zepto PO could not be found.</p>
        <Button onClick={() => setLocation("/platform-po")}>Back to PO List</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/platform-po")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to PO List</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Zepto PO</h1>
            <p className="text-muted-foreground">Modify PO {zeptoPo.po_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={zeptoPo.status === "Open" ? "default" : "secondary"}>
            {zeptoPo.status}
          </Badge>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete PO</span>
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PO Header Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="po_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-sm">
                <Label>Created Date</Label>
                <p className="mt-1 text-muted-foreground">
                  {format(new Date(zeptoPo.created_at), "PPP")}
                </p>
              </div>
              <div className="text-sm">
                <Label>Updated Date</Label>
                <p className="mt-1 text-muted-foreground">
                  {format(new Date(zeptoPo.updated_at), "PPP")}
                </p>
              </div>
              <div className="text-sm">
                <Label>Created By</Label>
                <p className="mt-1 text-muted-foreground">{zeptoPo.created_by}</p>
              </div>
              <div className="text-sm">
                <Label>Uploaded By</Label>
                <p className="mt-1 text-muted-foreground">{zeptoPo.uploaded_by}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Line Items ({lines.length})
                <Button
                  type="button"
                  onClick={addLine}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Line</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Line {line.line_number}</h4>
                      <Button
                        type="button"
                        onClick={() => removeLine(index)}
                        variant="destructive"
                        size="sm"
                        className="flex items-center space-x-2"
                      >
                        <Minus className="h-4 w-4" />
                        <span>Remove</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label>SKU</Label>
                        <Input
                          value={line.sku}
                          onChange={(e) => updateLine(index, "sku", e.target.value)}
                          placeholder="Enter SKU"
                        />
                      </div>
                      <div>
                        <Label>Brand</Label>
                        <Input
                          value={line.brand}
                          onChange={(e) => updateLine(index, "brand", e.target.value)}
                          placeholder="Enter brand"
                        />
                      </div>
                      <div>
                        <Label>SAP ID</Label>
                        <Input
                          value={line.sap_id}
                          onChange={(e) => updateLine(index, "sap_id", e.target.value)}
                          placeholder="Enter SAP ID"
                        />
                      </div>
                      <div>
                        <Label>HSN Code</Label>
                        <Input
                          value={line.hsn_code}
                          onChange={(e) => updateLine(index, "hsn_code", e.target.value)}
                          placeholder="Enter HSN code"
                        />
                      </div>
                      <div>
                        <Label>PO Quantity</Label>
                        <Input
                          type="number"
                          value={line.po_qty}
                          onChange={(e) => updateLine(index, "po_qty", parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Cost Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.cost_price}
                          onChange={(e) => updateLine(index, "cost_price", e.target.value)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>MRP</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.mrp}
                          onChange={(e) => updateLine(index, "mrp", e.target.value)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Total Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.total_value}
                          onChange={(e) => updateLine(index, "total_value", e.target.value)}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Input
                          value={line.status}
                          onChange={(e) => updateLine(index, "status", e.target.value)}
                          placeholder="Enter status"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/platform-po")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ZeptoPoEdit;