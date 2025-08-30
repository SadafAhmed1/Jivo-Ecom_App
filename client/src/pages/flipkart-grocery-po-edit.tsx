import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FlipkartItemPicker } from "@/components/po/flipkart-item-picker";

interface FlipkartGroceryPOHeader {
  id?: number;
  po_number: string;
  supplier_name: string;
  supplier_address: string;
  supplier_contact: string;
  supplier_email: string;
  supplier_gstin: string;
  billed_to_address: string;
  billed_to_gstin: string;
  shipped_to_address: string;
  shipped_to_gstin: string;
  nature_of_supply: string;
  nature_of_transaction: string;
  po_expiry_date: string;
  category: string;
  order_date: string;
  mode_of_payment: string;
  contract_ref_id: string;
  contract_version: string;
  credit_term: string;
  distributor: string;
  area: string;
  city: string;
  region: string;
  state: string;
  dispatch_from: string;
  total_quantity: number;
  total_taxable_value: number;
  total_tax_amount: number;
  total_amount: number;
  status: string;
}

interface FlipkartGroceryPOLine {
  id?: number;
  line_number: number;
  hsn_code: string;
  fsn_isbn: string;
  quantity: number;
  pending_quantity: number;
  uom: string;
  title: string;
  brand: string;
  type: string;
  ean: string;
  vertical: string;
  required_by_date: string;
  supplier_mrp: number;
  supplier_price: number;
  taxable_value: number;
  igst_rate: number;
  igst_amount_per_unit: number;
  sgst_rate: number;
  sgst_amount_per_unit: number;
  cgst_rate: number;
  cgst_amount_per_unit: number;
  cess_rate: number;
  cess_amount_per_unit: number;
  tax_amount: number;
  total_amount: number;
  status: string;
}

export default function FlipkartGroceryPOEdit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const poId = params.id;

  const [header, setHeader] = useState<FlipkartGroceryPOHeader>({
    po_number: "",
    supplier_name: "",
    supplier_address: "",
    supplier_contact: "",
    supplier_email: "",
    supplier_gstin: "",
    billed_to_address: "",
    billed_to_gstin: "",
    shipped_to_address: "",
    shipped_to_gstin: "",
    nature_of_supply: "Goods",
    nature_of_transaction: "Intra-State",
    po_expiry_date: "",
    category: "",
    order_date: "",
    mode_of_payment: "",
    contract_ref_id: "",
    contract_version: "",
    credit_term: "",
    distributor: "",
    area: "",
    city: "",
    region: "",
    state: "",
    dispatch_from: "",
    total_quantity: 0,
    total_taxable_value: 0,
    total_tax_amount: 0,
    total_amount: 0,
    status: "Open"
  });

  const [lines, setLines] = useState<FlipkartGroceryPOLine[]>([]);

  // Fetch existing PO data
  const { data: existingPO, isLoading: loadingPO } = useQuery({
    queryKey: [`/api/flipkart-grocery-pos/${poId}`],
    enabled: !!poId,
  });

  const { data: existingLines, isLoading: loadingLines } = useQuery<FlipkartGroceryPOLine[]>({
    queryKey: [`/api/flipkart-grocery-pos/${poId}/lines`],
    enabled: !!poId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingPO) {
      const poData = existingPO as any;
      
      // Check if location fields are empty and need to be auto-populated
      const needsAutoPopulation = !poData.distributor || !poData.area || !poData.city || !poData.region || !poData.state || !poData.dispatch_from;
      
      let locationData = {
        distributor: poData.distributor || "",
        area: poData.area || "",
        city: poData.city || "",
        region: poData.region || "",
        state: poData.state || "",
        dispatch_from: poData.dispatch_from || ""
      };

      // Auto-populate from supplier data if fields are missing
      if (needsAutoPopulation && poData.supplier_address) {
        const parseLocationFromAddress = (address: string) => {
          const locations = { area: "", city: "", state: "", region: "" };
          if (!address) return locations;

          const parts = address.split(/[,;\n]/).map(part => part.trim()).filter(Boolean);
          
          for (const part of parts) {
            const lowerPart = part.toLowerCase();
            
            // State patterns
            if (lowerPart.includes('maharashtra') || lowerPart.includes('mh')) locations.state = 'Maharashtra';
            else if (lowerPart.includes('karnataka') || lowerPart.includes('ka')) locations.state = 'Karnataka';
            else if (lowerPart.includes('tamil nadu') || lowerPart.includes('tn')) locations.state = 'Tamil Nadu';
            else if (lowerPart.includes('gujarat') || lowerPart.includes('gj')) locations.state = 'Gujarat';
            else if (lowerPart.includes('rajasthan') || lowerPart.includes('rj')) locations.state = 'Rajasthan';
            else if (lowerPart.includes('punjab') || lowerPart.includes('pb')) locations.state = 'Punjab';
            else if (lowerPart.includes('haryana') || lowerPart.includes('hr')) locations.state = 'Haryana';
            else if (lowerPart.includes('uttar pradesh') || lowerPart.includes('up')) locations.state = 'Uttar Pradesh';
            else if (lowerPart.includes('west bengal') || lowerPart.includes('wb')) locations.state = 'West Bengal';
            else if (lowerPart.includes('andhra pradesh') || lowerPart.includes('ap')) locations.state = 'Andhra Pradesh';
            else if (lowerPart.includes('telangana') || lowerPart.includes('ts')) locations.state = 'Telangana';
            else if (lowerPart.includes('kerala') || lowerPart.includes('kl')) locations.state = 'Kerala';
            else if (lowerPart.includes('odisha') || lowerPart.includes('or')) locations.state = 'Odisha';
            else if (lowerPart.includes('delhi') || lowerPart.includes('dl')) locations.state = 'Delhi';
            
            // City patterns
            if (lowerPart.includes('mumbai') || lowerPart.includes('bombay')) locations.city = 'Mumbai';
            else if (lowerPart.includes('bangalore') || lowerPart.includes('bengaluru')) locations.city = 'Bangalore';
            else if (lowerPart.includes('hyderabad')) locations.city = 'Hyderabad';
            else if (lowerPart.includes('chennai') || lowerPart.includes('madras')) locations.city = 'Chennai';
            else if (lowerPart.includes('kolkata') || lowerPart.includes('calcutta')) locations.city = 'Kolkata';
            else if (lowerPart.includes('pune')) locations.city = 'Pune';
            else if (lowerPart.includes('ahmedabad')) locations.city = 'Ahmedabad';
            else if (lowerPart.includes('jaipur')) locations.city = 'Jaipur';
            else if (lowerPart.includes('surat')) locations.city = 'Surat';
            else if (lowerPart.includes('lucknow')) locations.city = 'Lucknow';
            else if (lowerPart.includes('kanpur')) locations.city = 'Kanpur';
            else if (lowerPart.includes('nagpur')) locations.city = 'Nagpur';
            else if (lowerPart.includes('indore')) locations.city = 'Indore';
            else if (lowerPart.includes('bhopal')) locations.city = 'Bhopal';
            else if (lowerPart.includes('visakhapatnam') || lowerPart.includes('vizag')) locations.city = 'Visakhapatnam';
            else if (lowerPart.includes('patna')) locations.city = 'Patna';
            else if (lowerPart.includes('vadodara') || lowerPart.includes('baroda')) locations.city = 'Vadodara';
            else if (lowerPart.includes('ghaziabad')) locations.city = 'Ghaziabad';
            else if (lowerPart.includes('ludhiana')) locations.city = 'Ludhiana';
            else if (lowerPart.includes('agra')) locations.city = 'Agra';
            else if (lowerPart.includes('nashik')) locations.city = 'Nashik';
            else if (lowerPart.includes('faridabad')) locations.city = 'Faridabad';
            else if (lowerPart.includes('meerut')) locations.city = 'Meerut';
            else if (lowerPart.includes('rajkot')) locations.city = 'Rajkot';
            else if (lowerPart.includes('kalyan')) locations.city = 'Kalyan';
            else if (lowerPart.includes('vasai')) locations.city = 'Vasai';
            else if (lowerPart.includes('varanasi') || lowerPart.includes('benaras')) locations.city = 'Varanasi';
            else if (lowerPart.includes('srinagar')) locations.city = 'Srinagar';
            else if (lowerPart.includes('aurangabad')) locations.city = 'Aurangabad';
            else if (lowerPart.includes('dhanbad')) locations.city = 'Dhanbad';
            else if (lowerPart.includes('amritsar')) locations.city = 'Amritsar';
            else if (lowerPart.includes('navi mumbai')) locations.city = 'Navi Mumbai';
            else if (lowerPart.includes('allahabad') || lowerPart.includes('prayagraj')) locations.city = 'Prayagraj';
            else if (lowerPart.includes('ranchi')) locations.city = 'Ranchi';
            else if (lowerPart.includes('howrah')) locations.city = 'Howrah';
            else if (lowerPart.includes('coimbatore')) locations.city = 'Coimbatore';
            else if (lowerPart.includes('jabalpur')) locations.city = 'Jabalpur';
            else if (lowerPart.includes('gwalior')) locations.city = 'Gwalior';
            else if (lowerPart.includes('vijayawada')) locations.city = 'Vijayawada';
            else if (lowerPart.includes('jodhpur')) locations.city = 'Jodhpur';
            else if (lowerPart.includes('madurai')) locations.city = 'Madurai';
            else if (lowerPart.includes('raipur')) locations.city = 'Raipur';
            else if (lowerPart.includes('kota')) locations.city = 'Kota';
            else if (lowerPart.includes('chandigarh')) locations.city = 'Chandigarh';
            else if (lowerPart.includes('guwahati')) locations.city = 'Guwahati';
          }

          // Set region based on state
          if (locations.state) {
            const northStates = ['Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Rajasthan'];
            const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
            const westStates = ['Maharashtra', 'Gujarat'];
            const eastStates = ['West Bengal', 'Odisha'];
            
            if (northStates.includes(locations.state)) locations.region = 'North';
            else if (southStates.includes(locations.state)) locations.region = 'South';
            else if (westStates.includes(locations.state)) locations.region = 'West';
            else if (eastStates.includes(locations.state)) locations.region = 'East';
            else locations.region = 'Central';
          }

          if (!locations.area && parts.length > 0) {
            locations.area = parts[parts.length - 1];
          }

          return locations;
        };

        const parsedLocation = parseLocationFromAddress(poData.supplier_address);
        
        locationData = {
          distributor: locationData.distributor || poData.supplier_name || "",
          area: locationData.area || parsedLocation.area,
          city: locationData.city || parsedLocation.city,
          region: locationData.region || parsedLocation.region,
          state: locationData.state || parsedLocation.state,
          dispatch_from: locationData.dispatch_from || poData.shipped_to_address || ""
        };
      }
      
      setHeader({
        ...poData,
        ...locationData,
        order_date: poData.order_date ? new Date(poData.order_date).toISOString().split('T')[0] : "",
        po_expiry_date: poData.po_expiry_date ? new Date(poData.po_expiry_date).toISOString().split('T')[0] : ""
      });
    }
  }, [existingPO]);

  useEffect(() => {
    if (existingLines) {
      setLines(existingLines.map(line => ({
        ...line,
        required_by_date: line.required_by_date ? new Date(line.required_by_date).toISOString().split('T')[0] : ""
      })));
    }
  }, [existingLines]);

  const updateMutation = useMutation({
    mutationFn: async (data: { header: FlipkartGroceryPOHeader; lines: FlipkartGroceryPOLine[] }) => {
      const response = await fetch(`/api/flipkart-grocery-pos/${poId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update PO");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flipkart-grocery-pos"] });
      queryClient.invalidateQueries({ queryKey: [`/api/flipkart-grocery-pos/${poId}`] });
      toast({
        title: "Success",
        description: "Flipkart Grocery PO updated successfully",
      });
      setLocation("/flipkart-grocery-pos");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update Flipkart Grocery PO",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate totals
    const totalQuantity = lines.reduce((sum, line) => sum + (line.quantity || 0), 0);
    const totalTaxableValue = lines.reduce((sum, line) => sum + (line.taxable_value || 0), 0);
    const totalTaxAmount = lines.reduce((sum, line) => sum + (line.tax_amount || 0), 0);
    const totalAmount = lines.reduce((sum, line) => sum + (line.total_amount || 0), 0);

    const updatedHeader = {
      ...header,
      total_quantity: totalQuantity,
      total_taxable_value: totalTaxableValue,
      total_tax_amount: totalTaxAmount,
      total_amount: totalAmount
    };

    updateMutation.mutate({ header: updatedHeader, lines });
  };

  const handleHeaderChange = (field: keyof FlipkartGroceryPOHeader, value: any) => {
    setHeader(prev => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index: number, field: keyof FlipkartGroceryPOLine, value: any) => {
    setLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate line totals if relevant fields change
      if (['quantity', 'supplier_price', 'igst_rate', 'sgst_rate', 'cgst_rate', 'cess_rate'].includes(field)) {
        const line = updated[index];
        const quantity = line.quantity || 0;
        const basicAmount = line.supplier_price || 0; // Use supplier_price as basic amount
        
        // Calculate taxable value (Basic Amount × Quantity)
        line.taxable_value = quantity * basicAmount;
        
        // Calculate tax amounts per unit based on basic amount
        const igstAmount = (line.igst_rate || 0) * basicAmount / 100;
        const sgstAmount = (line.sgst_rate || 0) * basicAmount / 100;
        const cgstAmount = (line.cgst_rate || 0) * basicAmount / 100;
        const cessAmount = (line.cess_rate || 0) * basicAmount / 100;
        
        line.igst_amount_per_unit = igstAmount;
        line.sgst_amount_per_unit = sgstAmount;
        line.cgst_amount_per_unit = cgstAmount;
        line.cess_amount_per_unit = cessAmount;
        
        // Total tax amount = (Tax per unit × Quantity)
        line.tax_amount = quantity * (igstAmount + sgstAmount + cgstAmount + cessAmount);
        
        // Total Amount = Taxable Value + Tax Amount
        line.total_amount = line.taxable_value + line.tax_amount;
      }
      
      return updated;
    });
  };

  const addLine = () => {
    setLines(prev => [
      ...prev,
      {
        line_number: prev.length + 1,
        hsn_code: "",
        fsn_isbn: "",
        quantity: 0,
        pending_quantity: 0,
        uom: "pcs",
        title: "",
        brand: "",
        type: "",
        ean: "",
        vertical: "",
        required_by_date: "",
        supplier_mrp: 0,
        supplier_price: 0,
        taxable_value: 0,
        igst_rate: 0,
        igst_amount_per_unit: 0,
        sgst_rate: 0,
        sgst_amount_per_unit: 0,
        cgst_rate: 0,
        cgst_amount_per_unit: 0,
        cess_rate: 0,
        cess_amount_per_unit: 0,
        tax_amount: 0,
        total_amount: 0,
        status: "Pending"
      }
    ]);
  };

  const removeLine = (index: number) => {
    setLines(prev => prev.filter((_, i) => i !== index));
  };


  const handleItemFromPicker = (item: any, quantity: number) => {
    const supplierPrice = item.supplier_price || 0;
    const basicAmount = supplierPrice; // Use supplier_price as basic amount
    const taxRate = item.taxrate || 5; // Default 5% total tax rate
    const sgstRate = taxRate / 2; // Half of tax rate for SGST
    const cgstRate = taxRate / 2; // Half of tax rate for CGST
    
    const newLine: FlipkartGroceryPOLine = {
      line_number: lines.length + 1,
      hsn_code: "", // This would need to be set based on item data
      fsn_isbn: item.itemcode,
      quantity: quantity,
      pending_quantity: quantity,
      uom: item.uom || "pcs",
      title: item.itemname,
      brand: item.brand || "",
      type: item.type || "",
      ean: "",
      vertical: item.itemgroup || "",
      required_by_date: "",
      supplier_mrp: item.mrp || 0,
      supplier_price: supplierPrice, // This is our basic rate
      taxable_value: basicAmount * quantity, // Basic amount × quantity
      igst_rate: 0, // Usually 0 for intra-state
      igst_amount_per_unit: 0,
      sgst_rate: sgstRate,
      sgst_amount_per_unit: (basicAmount * sgstRate) / 100,
      cgst_rate: cgstRate,
      cgst_amount_per_unit: (basicAmount * cgstRate) / 100,
      cess_rate: 0,
      cess_amount_per_unit: 0,
      tax_amount: 0,
      total_amount: 0,
      status: "Pending"
    };

    // Calculate tax amount and total
    const sgstAmount = newLine.sgst_amount_per_unit * quantity;
    const cgstAmount = newLine.cgst_amount_per_unit * quantity;
    newLine.tax_amount = sgstAmount + cgstAmount;
    newLine.total_amount = newLine.taxable_value + newLine.tax_amount;

    setLines(prev => [...prev, newLine]);
  };

  if (loadingPO || loadingLines) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-green-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/flipkart-grocery-pos")}
              className="hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to POs
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Edit Flipkart Grocery PO
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Update purchase order details
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-b">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">PO Header Information</CardTitle>
                  <CardDescription>Basic purchase order details</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* PO Number */}
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input
                    value={header.po_number}
                    onChange={(e) => handleHeaderChange("po_number", e.target.value)}
                    required
                  />
                </div>

                {/* Supplier Name */}
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <Input
                    value={header.supplier_name}
                    onChange={(e) => handleHeaderChange("supplier_name", e.target.value)}
                    required
                  />
                </div>

                {/* Distributor */}
                <div className="space-y-2">
                  <Label>Distributor</Label>
                  <Input
                    value={header.distributor}
                    onChange={(e) => handleHeaderChange("distributor", e.target.value)}
                    placeholder="SELECT DISTRIBUTOR"
                  />
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    value={header.region}
                    onChange={(e) => handleHeaderChange("region", e.target.value)}
                    placeholder="SELECT REGION"
                  />
                </div>

                {/* State */}
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={header.state}
                    onChange={(e) => handleHeaderChange("state", e.target.value)}
                    placeholder="SELECT STATE"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={header.city}
                    onChange={(e) => handleHeaderChange("city", e.target.value)}
                    placeholder="SELECT STATE FIRST"
                  />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input
                    value={header.area}
                    onChange={(e) => handleHeaderChange("area", e.target.value)}
                    placeholder="DEFAULT"
                  />
                </div>

                {/* Dispatch From */}
                <div className="space-y-2">
                  <Label>Dispatch From</Label>
                  <Input
                    value={header.dispatch_from}
                    onChange={(e) => handleHeaderChange("dispatch_from", e.target.value)}
                    placeholder="SELECT DISPATCH LOCATION"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    value={header.category}
                    onChange={(e) => handleHeaderChange("category", e.target.value)}
                  />
                </div>

                {/* Order Date */}
                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={header.order_date}
                    onChange={(e) => handleHeaderChange("order_date", e.target.value)}
                    required
                  />
                </div>

                {/* PO Expiry Date */}
                <div className="space-y-2">
                  <Label>PO Expiry Date</Label>
                  <Input
                    type="date"
                    value={header.po_expiry_date}
                    onChange={(e) => handleHeaderChange("po_expiry_date", e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={header.status}
                    onValueChange={(value) => handleHeaderChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Contact */}
                <div className="space-y-2">
                  <Label>Supplier Contact</Label>
                  <Input
                    value={header.supplier_contact}
                    onChange={(e) => handleHeaderChange("supplier_contact", e.target.value)}
                  />
                </div>

                {/* Supplier Email */}
                <div className="space-y-2">
                  <Label>Supplier Email</Label>
                  <Input
                    type="email"
                    value={header.supplier_email}
                    onChange={(e) => handleHeaderChange("supplier_email", e.target.value)}
                  />
                </div>

                {/* Supplier GSTIN */}
                <div className="space-y-2">
                  <Label>Supplier GSTIN</Label>
                  <Input
                    value={header.supplier_gstin}
                    onChange={(e) => handleHeaderChange("supplier_gstin", e.target.value)}
                  />
                </div>

                {/* Mode of Payment */}
                <div className="space-y-2">
                  <Label>Mode of Payment</Label>
                  <Input
                    value={header.mode_of_payment}
                    onChange={(e) => handleHeaderChange("mode_of_payment", e.target.value)}
                  />
                </div>

                {/* Contract Ref ID */}
                <div className="space-y-2">
                  <Label>Contract Ref ID</Label>
                  <Input
                    value={header.contract_ref_id}
                    onChange={(e) => handleHeaderChange("contract_ref_id", e.target.value)}
                  />
                </div>

                {/* Credit Term */}
                <div className="space-y-2">
                  <Label>Credit Term</Label>
                  <Input
                    value={header.credit_term}
                    onChange={(e) => handleHeaderChange("credit_term", e.target.value)}
                  />
                </div>

                {/* Nature of Supply */}
                <div className="space-y-2">
                  <Label>Nature of Supply</Label>
                  <Select
                    value={header.nature_of_supply}
                    onValueChange={(value) => handleHeaderChange("nature_of_supply", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Goods">Goods</SelectItem>
                      <SelectItem value="Services">Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nature of Transaction */}
                <div className="space-y-2">
                  <Label>Nature of Transaction</Label>
                  <Select
                    value={header.nature_of_transaction}
                    onValueChange={(value) => handleHeaderChange("nature_of_transaction", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Intra-State">Intra-State</SelectItem>
                      <SelectItem value="Inter-State">Inter-State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Fields */}
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supplier Address */}
                <div className="space-y-2">
                  <Label>Supplier Address</Label>
                  <Textarea
                    value={header.supplier_address}
                    onChange={(e) => handleHeaderChange("supplier_address", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Billed To Address */}
                <div className="space-y-2">
                  <Label>Billed To Address</Label>
                  <Textarea
                    value={header.billed_to_address}
                    onChange={(e) => handleHeaderChange("billed_to_address", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Shipped To Address */}
                <div className="space-y-2">
                  <Label>Shipped To Address</Label>
                  <Textarea
                    value={header.shipped_to_address}
                    onChange={(e) => handleHeaderChange("shipped_to_address", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* GSTIN Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Billed To GSTIN</Label>
                    <Input
                      value={header.billed_to_gstin}
                      onChange={(e) => handleHeaderChange("billed_to_gstin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipped To GSTIN</Label>
                    <Input
                      value={header.shipped_to_gstin}
                      onChange={(e) => handleHeaderChange("shipped_to_gstin", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Picker */}
          <FlipkartItemPicker onItemSelect={handleItemFromPicker} />

          {/* Line Items */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Line Items</CardTitle>
                    <CardDescription>Product details</CardDescription>
                  </div>
                </div>
                <Button type="button" onClick={addLine} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>HSN Code</TableHead>
                      <TableHead>FSN/ISBN</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Basic Amount</TableHead>
                      <TableHead>Taxable Value</TableHead>
                      <TableHead>SGST %</TableHead>
                      <TableHead>CGST %</TableHead>
                      <TableHead>Tax Amount</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>{line.line_number}</TableCell>
                        <TableCell>
                          <Input
                            value={line.hsn_code}
                            onChange={(e) => handleLineChange(index, "hsn_code", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.fsn_isbn}
                            onChange={(e) => handleLineChange(index, "fsn_isbn", e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.title}
                            onChange={(e) => handleLineChange(index, "title", e.target.value)}
                            className="w-48"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.brand}
                            onChange={(e) => handleLineChange(index, "brand", e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, "quantity", parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.uom}
                            onChange={(e) => handleLineChange(index, "uom", e.target.value)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.supplier_price}
                            onChange={(e) => handleLineChange(index, "supplier_price", parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            ₹{line.taxable_value?.toFixed(2) || '0.00'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.sgst_rate}
                            onChange={(e) => handleLineChange(index, "sgst_rate", parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={line.cgst_rate}
                            onChange={(e) => handleLineChange(index, "cgst_rate", parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            ₹{line.tax_amount?.toFixed(2) || '0.00'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">
                            ₹{line.total_amount?.toFixed(2) || '0.00'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={line.status}
                            onValueChange={(value) => handleLineChange(index, "status", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Delivered">Delivered</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-6 flex justify-end">
                <div className="space-y-2 text-right">
                  <div className="text-sm text-gray-600">
                    Total Quantity: <span className="font-semibold">{lines.reduce((sum, line) => sum + (line.quantity || 0), 0)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Taxable: <span className="font-semibold">₹{lines.reduce((sum, line) => sum + (line.taxable_value || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Tax: <span className="font-semibold">₹{lines.reduce((sum, line) => sum + (line.tax_amount || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="text-lg font-bold">
                    Grand Total: ₹{lines.reduce((sum, line) => sum + (line.total_amount || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/flipkart-grocery-pos")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update PO
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}