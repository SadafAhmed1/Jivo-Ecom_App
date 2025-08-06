import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, AlertCircle, CheckCircle, Package, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ZeptoParsedData {
  header: {
    po_number: string;
    status: string;
    total_quantity: number;
    total_cost_value: string;
    total_tax_amount: string;
    total_amount: string;
    unique_brands: string[];
    created_by: string;
    uploaded_by: string;
  };
  lines: Array<{
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
  }>;
}

export default function ZeptoPoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ZeptoParsedData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPOMutation = useMutation({
    mutationFn: async (data: ZeptoParsedData) => {
      return await apiRequest("/api/zepto-pos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Zepto PO imported successfully!",
      });
      
      // Reset form
      setParsedData(null);
      setFile(null);
      setParseError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["/api/zepto-pos"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import PO",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
      setParseError(null);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setIsLoading(true);
    setParseError(null);

    try {
      const text = await file.text();
      
      const response = await fetch("/api/parse-zepto-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvContent: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse CSV");
      }

      const data = await response.json();
      setParsedData(data);
      
      toast({
        title: "Success",
        description: "CSV file parsed successfully!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to parse CSV file";
      setParseError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importPO = async () => {
    if (!parsedData) return;

    createPOMutation.mutate(parsedData);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Import Zepto PO</h1>
              <p className="text-muted-foreground">
                Upload and import Zepto purchase orders from CSV files
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Select a Zepto PO CSV file to upload and import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            
            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={parseFile}
                disabled={!file || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Parse CSV
              </Button>
              
              {parsedData && (
                <Button 
                  onClick={importPO}
                  disabled={createPOMutation.isPending}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  {createPOMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Import PO
                </Button>
              )}
            </div>
            
            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Parsed Data Preview */}
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Parsed Data Preview
              </CardTitle>
              <CardDescription>
                Review the imported data before saving to database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">PO Number</Label>
                  <p className="text-lg font-semibold">{parsedData.header.po_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Quantity</Label>
                  <p className="text-lg">{parsedData.header.total_quantity.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-lg font-semibold">₹{Number(parsedData.header.total_amount).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="secondary">{parsedData.header.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Number of Line Items</Label>
                  <p className="text-lg">{parsedData.lines.length}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Unique Brands</Label>
                  <p className="text-lg">{parsedData.header.unique_brands.length}</p>
                </div>
              </div>

              {/* Brands */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Brands</Label>
                <div className="flex flex-wrap gap-2">
                  {parsedData.header.unique_brands.map((brand, index) => (
                    <Badge key={index} variant="outline">{brand}</Badge>
                  ))}
                </div>
              </div>

              {/* Line Items Preview */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Line Items Preview (showing first 10 items)
                </Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-muted font-medium text-sm">
                    <div>SKU</div>
                    <div>Brand</div>
                    <div>Quantity</div>
                    <div>Cost Price</div>
                    <div>MRP</div>
                    <div>Total</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {parsedData.lines.slice(0, 10).map((line, index) => (
                      <div key={index} className="grid grid-cols-6 gap-4 p-3 border-t text-sm">
                        <div className="truncate" title={line.sku}>{line.sku}</div>
                        <div>{line.brand || '-'}</div>
                        <div className="text-right">{line.po_qty.toLocaleString()}</div>
                        <div className="text-right">₹{Number(line.cost_price).toFixed(2)}</div>
                        <div className="text-right">₹{Number(line.mrp).toFixed(2)}</div>
                        <div className="text-right font-medium">₹{Number(line.total_value).toFixed(2)}</div>
                      </div>
                    ))}
                    {parsedData.lines.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t">
                        And {parsedData.lines.length - 10} more items...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Import Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium mb-1">Supported Format:</p>
              <p>• Zepto purchase order CSV format (PO_Items format)</p>
              <p>• File must contain line-item data with PO number, SKU details, and pricing</p>
            </div>
            <div>
              <p className="font-medium mb-1">Required Fields:</p>
              <p>• PO No., SKU, Brand, quantities, and pricing information</p>
              <p>• Cost Price, CGST, SGST, IGST, CESS, MRP, Total Value</p>
            </div>
            <div>
              <p className="font-medium mb-1">Import Process:</p>
              <p>1. Select and upload your CSV file</p>
              <p>2. Review the parsed data for accuracy</p>
              <p>3. Click Import PO to save to the database</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}