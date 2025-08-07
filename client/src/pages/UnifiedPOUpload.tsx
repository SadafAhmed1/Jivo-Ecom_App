import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, Eye, Database, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  uploadedAt: string;
  status: 'uploaded' | 'reviewed' | 'imported';
  vendor?: string;
  previewData?: any;
}

interface PreviewData {
  header: any;
  lines: any[];
  detectedVendor: string;
  totalItems: number;
  totalQuantity: number;
  totalAmount: string;
}

export default function UnifiedPOUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vendors = [
    { value: "flipkart", label: "Flipkart Grocery" },
    { value: "zepto", label: "Zepto" },
    { value: "citymall", label: "City Mall" },
    { value: "blinkit", label: "Blinkit" },
    { value: "swiggy", label: "Swiggy" }
  ];

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/po/preview', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to preview file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setShowPreview(true);
      if (data.detectedVendor) {
        setSelectedVendor(data.detectedVendor);
      }
      toast({
        title: "File previewed successfully",
        description: `Detected ${data.totalItems} items from ${data.detectedVendor || 'unknown vendor'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ vendor, previewData }: { vendor: string; previewData: PreviewData }) => {
      const response = await fetch(`/api/po/import/${vendor}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          header: previewData.header,
          lines: previewData.lines
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data imported successfully",
        description: `PO ${data.po_number} has been created`,
      });
      setFile(null);
      setPreviewData(null);
      setShowPreview(false);
      setSelectedVendor("");
      queryClient.invalidateQueries({ queryKey: ["/api/po"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    const isValidFile = validTypes.includes(selectedFile.type) || 
                       selectedFile.name.endsWith('.csv') || 
                       selectedFile.name.endsWith('.xls') || 
                       selectedFile.name.endsWith('.xlsx');

    if (isValidFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setShowPreview(false);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to preview",
        variant: "destructive",
      });
      return;
    }

    previewMutation.mutate(file);
  };

  const handleImport = () => {
    if (!previewData || !selectedVendor) {
      toast({
        title: "Missing information",
        description: "Please preview the file and select a vendor",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({ vendor: selectedVendor, previewData });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Order Upload</h1>
            <p className="text-gray-600">Upload, review, and import PO files from any vendor</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload PO File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {file ? "File Selected" : "Drop your CSV or Excel file here"}
                </p>
                <p className="text-sm text-gray-500">
                  or{" "}
                  <Label htmlFor="file-upload" className="text-blue-600 hover:underline cursor-pointer">
                    browse to choose a file
                  </Label>
                </p>
                <p className="text-xs text-gray-400">
                  Supports .csv, .xls, and .xlsx files
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">{file.name}</p>
                  <p className="text-sm text-green-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreviewData(null);
                    setShowPreview(false);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handlePreview}
                disabled={!file || previewMutation.isPending}
                className="flex-1"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMutation.isPending ? "Analyzing..." : "Preview & Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {showPreview && previewData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                File Preview & Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Detected Vendor</p>
                  <p className="text-lg font-bold text-blue-900">
                    {previewData.detectedVendor || "Unknown"}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Total Items</p>
                  <p className="text-lg font-bold text-green-900">{previewData.totalItems}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Total Quantity</p>
                  <p className="text-lg font-bold text-purple-900">{previewData.totalQuantity}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Total Amount</p>
                  <p className="text-lg font-bold text-yellow-900">₹{previewData.totalAmount}</p>
                </div>
              </div>

              {/* Vendor Selection */}
              <div className="space-y-2">
                <Label>Confirm Vendor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.value} value={vendor.value}>
                        {vendor.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PO Header Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">PO Header Information</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>PO Number:</strong> {previewData.header.po_number || "N/A"}</div>
                    <div><strong>PO Date:</strong> {previewData.header.po_date || "N/A"}</div>
                    <div><strong>Status:</strong> <Badge variant="outline">{previewData.header.status || "Open"}</Badge></div>
                  </div>
                </div>
              </div>

              {/* Line Items Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">Line Items Preview (First 5 items)</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.lines.slice(0, 5).map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{line.item_code || "N/A"}</TableCell>
                          <TableCell>{line.item_name || line.product_description || "N/A"}</TableCell>
                          <TableCell>{line.quantity || "N/A"}</TableCell>
                          <TableCell>₹{line.unit_price || line.basic_cost_price || "N/A"}</TableCell>
                          <TableCell>₹{line.total_amount || line.line_total || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.lines.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 5 of {previewData.lines.length} items
                  </p>
                )}
              </div>

              {/* Import Action */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={!selectedVendor || importMutation.isPending}
                  className="flex-1"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : "Import to Database"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h4 className="font-medium mb-1">Upload File</h4>
                  <p className="text-gray-600">Upload any CSV or Excel file containing PO data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h4 className="font-medium mb-1">Preview & Review</h4>
                  <p className="text-gray-600">System analyzes the file and shows a preview of the data</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h4 className="font-medium mb-1">Confirm & Import</h4>
                  <p className="text-gray-600">Verify the vendor and import the data into the database</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-800 text-sm">
                      <strong>Universal Format Support:</strong> The system automatically detects and parses different vendor file formats.
                      Review the data before importing to ensure accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}