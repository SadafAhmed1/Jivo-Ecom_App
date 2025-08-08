import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Database,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParsedPOData {
  header: any;
  lines: any[];
  totalItems?: number;
  totalQuantity?: number;
  totalAmount?: string;
}

const PLATFORMS = [
  {
    id: "flipkart",
    name: "Flipkart Grocery",
    endpoint: "/api/po/import/flipkart",
    queryKey: "/api/flipkart-grocery-pos",
  },
  {
    id: "zepto",
    name: "Zepto",
    endpoint: "/api/po/import/zepto",
    queryKey: "/api/zepto-pos",
  },
  {
    id: "citymall",
    name: "City Mall",
    endpoint: "/api/po/import/citymall",
    queryKey: "/api/city-mall-pos",
  },
  {
    id: "blinkit",
    name: "Blinkit",
    endpoint: "/api/po/import/blinkit",
    queryKey: "/api/blinkit-pos",
  },
  {
    id: "swiggy",
    name: "Swiggy Instamart",
    endpoint: "/api/po/import/swiggy",
    queryKey: "/api/swiggy-pos",
  },
];

export default function UnifiedPOUpload() {
  const [currentStep, setCurrentStep] = useState<
    "platform" | "upload" | "preview"
  >("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPOData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);

      const response = await fetch("/api/po/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setParsedData(data);
      setCurrentStep("preview");
      toast({
        title: "File previewed successfully",
        description: `Found ${data.totalItems} items`,
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
    mutationFn: async (data: { header?: any; lines?: any[]; poList?: any[] }) => {
      const response = await fetch(`/api/po/import/${selectedPlatform}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import PO");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Handle both single PO response and multi-PO response
      if (data.results && Array.isArray(data.results)) {
        // Multi-PO response (Blinkit)
        const successfulImports = data.results.filter((r: any) => r.status === 'success');
        const failedImports = data.results.filter((r: any) => r.status === 'failed');
        
        toast({
          title: "PO import completed",
          description: `Successfully imported ${successfulImports.length} of ${data.results.length} POs${failedImports.length > 0 ? `. ${failedImports.length} failed.` : ''}`,
        });
      } else {
        // Single PO response
        toast({
          title: "PO imported successfully",
          description: `PO ${data.po_number} has been created`,
        });
      }
      
      resetForm();
      queryClient.invalidateQueries({
        queryKey: [selectedPlatformData!.queryKey],
      });
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const isValidFile =
      validTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith(".csv") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.name.endsWith(".xlsx");

    if (isValidFile) {
      setFile(selectedFile);
      setParsedData(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setCurrentStep("upload");
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
    if (!parsedData) {
      toast({
        title: "No data to import",
        description: "Please preview the file first",
        variant: "destructive",
      });
      return;
    }

    // Handle Blinkit multi-PO structure
    if (parsedData.poList) {
      importMutation.mutate({
        poList: parsedData.poList,
      });
    } else {
      // Handle single PO structure for other platforms
      importMutation.mutate({
        header: parsedData.header,
        lines: parsedData.lines,
      });
    }
  };

  const resetForm = () => {
    setCurrentStep("platform");
    setSelectedPlatform("");
    setFile(null);
    setParsedData(null);
  };

  const goBack = () => {
    if (currentStep === "upload") {
      setCurrentStep("platform");
      setFile(null);
    } else if (currentStep === "preview") {
      setCurrentStep("upload");
      setParsedData(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Order Upload</h1>
            <p className="text-gray-600">
              Upload and import purchase orders from all platforms
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-2 ${currentStep === "platform" ? "text-blue-600" : currentStep === "upload" || currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "platform" ? "bg-blue-100 text-blue-600" : currentStep === "upload" || currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  1
                </div>
                <span className="font-medium">Select Platform</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              <div
                className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "upload" ? "bg-blue-100 text-blue-600" : currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                >
                  2
                </div>
                <span className="font-medium">Upload File</span>
              </div>

              <ArrowRight className="h-5 w-5 text-gray-400" />

              <div
                className={`flex items-center gap-2 ${currentStep === "preview" ? "text-blue-600" : "text-gray-400"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === "preview" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  3
                </div>
                <span className="font-medium">Preview & Import</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Platform Selection */}
        {currentStep === "platform" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Select Platform
              </CardTitle>
              <CardDescription>
                Choose the e-commerce platform for your purchase order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className="h-20 text-left justify-start p-4 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handlePlatformSelect(platform.id)}
                  >
                    <div>
                      <div className="font-medium text-base">
                        {platform.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Upload {platform.name} PO files
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: File Upload */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upload {selectedPlatformData?.name} PO File
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files containing{" "}
                {selectedPlatformData?.name} purchase order data
              </CardDescription>
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
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {file
                      ? "File Selected"
                      : `Drop your ${selectedPlatformData?.name} CSV/Excel file here`}
                  </p>
                  <p className="text-sm text-gray-500">
                    or{" "}
                    <Label
                      htmlFor="file-upload"
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
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
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handlePreview}
                  disabled={!file || previewMutation.isPending}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMutation.isPending
                    ? "Analyzing..."
                    : "Preview & Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview & Import */}
        {currentStep === "preview" && parsedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                File Preview & Review - {selectedPlatformData?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Blinkit Multi-PO Display */}
              {parsedData.poList ? (
                <div className="space-y-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">
                      Multiple POs Found: {parsedData.totalPOs} Purchase Orders
                    </h3>
                  </div>
                  
                  {parsedData.poList.map((po: any, poIndex: number) => (
                    <div key={poIndex} className="border rounded-lg p-6 bg-white shadow-sm">
                      <h4 className="text-lg font-semibold mb-4 text-blue-600">
                        PO #{poIndex + 1}: {po.header.po_number}
                      </h4>
                      
                      {/* Individual PO Summary */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Items</p>
                          <p className="text-lg font-bold text-green-900">{po.totalItems}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-purple-800">Quantity</p>
                          <p className="text-lg font-bold text-purple-900">{po.totalQuantity}</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800">Amount</p>
                          <p className="text-lg font-bold text-yellow-900">₹{po.totalAmount}</p>
                        </div>
                      </div>

                      {/* PO Lines Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item Code</TableHead>
                              <TableHead>Product Description</TableHead>
                              <TableHead>UOM</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Landing Rate</TableHead>
                              <TableHead>Total Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {po.lines.slice(0, 5).map((line: any, lineIndex: number) => (
                              <TableRow key={lineIndex}>
                                <TableCell className="font-medium">{line.item_code}</TableCell>
                                <TableCell>{line.product_description}</TableCell>
                                <TableCell>{line.grammage}</TableCell>
                                <TableCell>{line.quantity}</TableCell>
                                <TableCell>₹{line.landing_rate}</TableCell>
                                <TableCell>₹{line.total_amount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {po.lines.length > 5 && (
                          <p className="text-sm text-gray-500 mt-2">
                            ...and {po.lines.length - 5} more items
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Summary Information for single PO platforms */}
                  {selectedPlatform === "flipkart" ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      PO Number
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {parsedData.header?.po_number || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Total Items
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {parsedData.totalItems || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Total Quantity
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {parsedData.totalQuantity || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-yellow-900">
                      ₹{parsedData.totalAmount || "0"}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">
                      PO Date
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {parsedData.header?.order_date
                        ? new Date(
                            parsedData.header.order_date,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ) : selectedPlatform === "swiggy" ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      PO Number
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {parsedData.header?.po_number || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Total Items
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {parsedData.totalItems || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Total Quantity
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {parsedData.totalQuantity || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-yellow-900">
                      ₹{parsedData.header?.grand_total ? parseFloat(parsedData.header.grand_total).toFixed(2) : (parsedData.totalAmount || "0")}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-800">
                      PO Date
                    </p>
                    <p className="text-lg font-bold text-orange-900">
                      {parsedData.header?.po_date
                        ? new Date(
                            parsedData.header.po_date,
                          ).toLocaleDateString()
                        : "Not Available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      PO Number
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {parsedData.header?.po_number || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Total Items
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {parsedData.totalItems || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Total Quantity
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {parsedData.totalQuantity || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-yellow-900">
                      ₹{parsedData.totalAmount || "0"}
                    </p>
                  </div>
                </div>
              )}

              {/* PO Header Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">PO Header Information</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  {selectedPlatform === "flipkart" ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {/* <div><strong>PO Number:</strong> {parsedData.header?.po_number || "N/A"}</div>
                      <div><strong>PO Date:</strong> {parsedData.header?.order_date ? new Date(parsedData.header.order_date).toLocaleDateString() : "N/A"}</div>
                      <div><strong>Total Amount:</strong> ₹{parsedData.totalAmount || "0"}</div> */}
                      <div>
                        <strong>Order Date:</strong>{" "}
                        {parsedData.header?.order_date
                          ? new Date(
                              parsedData.header.order_date,
                            ).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant="outline">
                          {parsedData.header?.status || "Open"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Platform:</strong> {selectedPlatformData?.name}
                      </div>
                    </div>
                  ) : selectedPlatform === "swiggy" ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>PO Number:</strong>{" "}
                        {parsedData.header?.po_number || "N/A"}
                      </div>
                      <div>
                        <strong>PO Date:</strong>{" "}
                        {parsedData.header?.po_date
                          ? new Date(parsedData.header.po_date).toLocaleDateString()
                          : "Not Available"}
                      </div>
                      <div>
                        <strong>Vendor Name:</strong>{" "}
                        {parsedData.header?.vendor_name || "N/A"}
                      </div>
                      <div>
                        <strong>Payment Terms:</strong>{" "}
                        {parsedData.header?.payment_terms || "N/A"}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant="outline">
                          {parsedData.header?.status || "Open"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Platform:</strong> {selectedPlatformData?.name}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>PO Number:</strong>{" "}
                        {parsedData.header?.po_number || "N/A"}
                      </div>
                      <div>
                        <strong>PO Date:</strong>{" "}
                        {parsedData.header?.po_date ||
                          parsedData.header?.order_date ||
                          "N/A"}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant="outline">
                          {parsedData.header?.status || "Open"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Platform:</strong> {selectedPlatformData?.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Preview */}
              <div className="space-y-2">
                <h4 className="font-medium">
                  Line Items Preview (First 5 items)
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {selectedPlatform === "flipkart" ? (
                          <>
                            <TableHead>Item Name</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead>Pending Quantity</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead>Tax Amount</TableHead>
                            <TableHead>Total Amount</TableHead>
                          </>
                        ) : selectedPlatform === "swiggy" ? (
                          <>
                            <TableHead>Item Description</TableHead>
                            <TableHead>Item Code</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>MRP</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Taxable Value</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>Item Name</TableHead>
                            <TableHead>HSN Code</TableHead>
                            <TableHead>Pending Quantity</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>UOM</TableHead>
                            <TableHead>Tax Amount</TableHead>
                            <TableHead>Total Amount</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.lines.slice(0, 5).map((line, index) => (
                        <TableRow key={index}>
                          {selectedPlatform === "flipkart" ? (
                            <>
                              <TableCell className="font-medium">
                                {line.title || line.item_name || "N/A"}
                              </TableCell>
                              <TableCell>{line.hsn_code || "N/A"}</TableCell>
                              <TableCell>
                                {line.pending_quantity || "N/A"}
                              </TableCell>
                              <TableCell>{line.quantity || "N/A"}</TableCell>
                              <TableCell>{line.uom || "N/A"}</TableCell>
                              <TableCell>₹{line.tax_amount || "N/A"}</TableCell>
                              <TableCell>
                                ₹{line.total_amount || "N/A"}
                              </TableCell>
                            </>
                          ) : selectedPlatform === "swiggy" ? (
                            <>
                              <TableCell className="font-medium">
                                {line.item_description || line.item_name || "N/A"}
                              </TableCell>
                              <TableCell>{line.item_code || "N/A"}</TableCell>
                              <TableCell>{line.hsn_code || "Not Available"}</TableCell>
                              <TableCell>{line.quantity || "N/A"}</TableCell>
                              <TableCell>₹{line.mrp || "N/A"}</TableCell>
                              <TableCell>{line.unit_base_cost ? `₹${parseFloat(line.unit_base_cost).toFixed(2)}` : "Not Available"}</TableCell>
                              <TableCell>₹{line.taxable_value ? parseFloat(line.taxable_value).toFixed(2) : "N/A"}</TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-medium">
                                {line.title || line.item_name || "N/A"}
                              </TableCell>
                              <TableCell>{line.hsn_code || "N/A"}</TableCell>
                              <TableCell>
                                {line.pending_quantity || "N/A"}
                              </TableCell>
                              <TableCell>{line.quantity || "N/A"}</TableCell>
                              <TableCell>{line.uom || "N/A"}</TableCell>
                              <TableCell>₹{line.tax_amount || "N/A"}</TableCell>
                              <TableCell>
                                ₹{line.total_amount || "N/A"}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.lines && parsedData.lines.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    Showing 5 of {parsedData.lines.length} items
                  </p>
                )}
              </div>
                </>
              )}

              {/* Import Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button variant="outline" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="flex-1"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {importMutation.isPending
                    ? "Importing..."
                    : "Import to Database"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Select Platform</h4>
                  <p className="text-gray-600">
                    Choose the e-commerce platform (Flipkart, Zepto, City Mall,
                    Blinkit, or Swiggy)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Upload File</h4>
                  <p className="text-gray-600">
                    Upload your CSV or Excel file containing the purchase order
                    data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Preview & Import</h4>
                  <p className="text-gray-600">
                    Review the parsed data and import it into the database
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> Make sure your files follow the
                      standard format for each platform. Always review the
                      preview before importing to ensure data accuracy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
