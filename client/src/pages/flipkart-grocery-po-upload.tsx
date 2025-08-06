import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ParsedPOData {
  header: any;
  lines: any[];
}

export default function FlipkartGroceryPOUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPOData | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPOMutation = useMutation({
    mutationFn: async (data: { header: any; lines: any[] }) => {
      return await apiRequest('/api/flipkart-grocery-pos', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Flipkart grocery PO imported successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/flipkart-grocery-pos'] });
      setFile(null);
      setParsedData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import PO",
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setParsedData(null);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadedBy', 'system'); // You can change this to actual user

      const response = await fetch('/api/parse-flipkart-csv', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const data = await response.json();
      setParsedData(data);
      
      toast({
        title: "File Parsed",
        description: `Found ${data.lines.length} items in the PO`
      });
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the CSV file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
              <h1 className="text-3xl font-bold">Import Flipkart Grocery PO</h1>
              <p className="text-muted-foreground">
                Upload and import Flipkart grocery purchase orders from CSV files
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
              Select a Flipkart grocery PO CSV file to upload and import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
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
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? "Parsing..." : "Parse File"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview Parsed Data
              </CardTitle>
              <CardDescription>
                Review the parsed data before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">PO Header Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">PO Number</Label>
                    <p className="font-medium">{parsedData.header.po_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Supplier</Label>
                    <p className="font-medium">{parsedData.header.supplier_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                    <p className="font-medium">{parsedData.header.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Order Date</Label>
                    <p className="font-medium">
                      {new Date(parsedData.header.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Total Amount</Label>
                    <p className="font-medium">₹{parsedData.header.total_amount}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Total Items</Label>
                    <p className="font-medium">{parsedData.lines.length}</p>
                  </div>
                </div>
              </div>

              {/* Line Items Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Line Items ({parsedData.lines.length})</h3>
                <div className="border rounded-lg">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-muted text-sm font-medium">
                    <div>Item</div>
                    <div>Brand</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Tax</div>
                    <div>Total</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {parsedData.lines.slice(0, 10).map((line, index) => (
                      <div key={index} className="grid grid-cols-6 gap-4 p-3 border-t text-sm">
                        <div className="truncate" title={line.title}>{line.title}</div>
                        <div>{line.brand || '-'}</div>
                        <div>{line.quantity} {line.uom}</div>
                        <div>₹{line.supplier_price}</div>
                        <div>₹{line.tax_amount}</div>
                        <div>₹{line.total_amount}</div>
                      </div>
                    ))}
                    {parsedData.lines.length > 10 && (
                      <div className="p-3 border-t text-center text-sm text-muted-foreground">
                        ... and {parsedData.lines.length - 10} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={importPO}
                  disabled={createPOMutation.isPending}
                  size="lg"
                  className="min-w-32"
                >
                  {createPOMutation.isPending ? "Importing..." : "Import PO"}
                </Button>
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
              <p>• Flipkart grocery purchase order CSV format</p>
              <p>• File must contain header information and line items</p>
            </div>
            <div>
              <p className="font-medium mb-1">Required Fields:</p>
              <p>• PO Number, Supplier Name, Order Date</p>
              <p>• Line items with item details, quantities, and pricing</p>
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