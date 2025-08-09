import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Step = "platform" | "upload" | "preview";

interface Platform {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  queryKey: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "flipkart",
    name: "Flipkart Grocery",
    description: "Upload Flipkart Grocery PO files",
    endpoint: "/api/flipkart-grocery-pos",
    queryKey: "/api/flipkart-grocery-pos"
  },
  {
    id: "zepto",
    name: "Zepto",
    description: "Upload Zepto PO files",
    endpoint: "/api/zepto-pos",
    queryKey: "/api/zepto-pos"
  },
  {
    id: "citymall",
    name: "City Mall",
    description: "Upload City Mall PO files",
    endpoint: "/api/city-mall-pos",
    queryKey: "/api/city-mall-pos"
  },
  {
    id: "blinkit",
    name: "Blinkit",
    description: "Upload Blinkit PO files",
    endpoint: "/api/blinkit-pos",
    queryKey: "/api/blinkit-pos"
  },
  {
    id: "swiggy",
    name: "Swiggy Instamart",
    description: "Upload Swiggy PO files",
    endpoint: "/api/swiggy-pos",
    queryKey: "/api/swiggy-pos"
  }
];

interface UnifiedUploadComponentProps {
  onComplete?: () => void;
}

export function UnifiedUploadComponent({ onComplete }: UnifiedUploadComponentProps) {
  const [currentStep, setCurrentStep] = useState<Step>("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedPlatformData = PLATFORMS.find(p => p.id === selectedPlatform);

  const resetForm = () => {
    setCurrentStep("platform");
    setSelectedPlatform("");
    setFile(null);
    setParsedData(null);
    setDragActive(false);
  };

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
      onComplete?.();
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
    if (!parsedData) return;
    
    // Send the entire parsed data - backend will handle single vs multi-PO structure
    importMutation.mutate(parsedData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "platform":
        return (
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
        );

      case "upload":
        return (
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
                  accept=".csv,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handlePreview}
                      disabled={previewMutation.isPending}
                      className="flex-1"
                    >
                      {previewMutation.isPending ? "Processing..." : "Preview File"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("platform")}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "preview":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Preview & Import
              </CardTitle>
              <CardDescription>
                Review the parsed data before importing to database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {parsedData && (
                <div className="space-y-6">
                  {/* Handle Multi-PO Display (Blinkit) */}
                  {parsedData.poList && Array.isArray(parsedData.poList) ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Multiple POs Found</h3>
                        <Badge variant="secondary">
                          {parsedData.poList.length} POs detected
                        </Badge>
                      </div>
                      
                      {parsedData.poList.map((po: any, index: number) => (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                PO #{po.header?.po_number || `Unknown ${index + 1}`}
                              </CardTitle>
                              <Badge variant="outline">
                                {po.lines?.length || 0} items
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {po.header?.store_name && (
                                <div>
                                  <span className="font-medium text-gray-600">Store:</span>
                                  <p className="mt-1">{po.header.store_name}</p>
                                </div>
                              )}
                              {po.header?.order_date && (
                                <div>
                                  <span className="font-medium text-gray-600">Order Date:</span>
                                  <p className="mt-1">{po.header.order_date}</p>
                                </div>
                              )}
                              {po.header?.total_amount && (
                                <div>
                                  <span className="font-medium text-gray-600">Total Amount:</span>
                                  <p className="mt-1">₹{po.header.total_amount}</p>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-600">Items:</span>
                                <p className="mt-1">{po.lines?.length || 0} items</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    /* Handle Single PO Display */
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">PO Details</h3>
                      
                      {/* Header Information */}
                      {parsedData.header && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Header Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              {Object.entries(parsedData.header).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium text-gray-600 capitalize">
                                    {key.replace(/_/g, " ")}:
                                  </span>
                                  <p className="mt-1">{value as string}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {parsedData.totalItems || parsedData.lines?.length || 0}
                          </div>
                          <div className="text-sm text-blue-600">Total Items</div>
                        </div>
                        {parsedData.totalQuantity && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {parsedData.totalQuantity}
                            </div>
                            <div className="text-sm text-green-600">Total Quantity</div>
                          </div>
                        )}
                        {parsedData.totalAmount && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              ₹{parsedData.totalAmount}
                            </div>
                            <div className="text-sm text-purple-600">Total Amount</div>
                          </div>
                        )}
                      </div>

                      {/* Line Items Preview */}
                      {parsedData.lines && parsedData.lines.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Line Items Preview</CardTitle>
                            <CardDescription>
                              Showing first 5 items. Total: {parsedData.lines.length} items
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    {selectedPlatformData?.id === 'zepto' ? (
                                      <>
                                        <th className="text-left p-2 font-medium">SKU</th>
                                        <th className="text-left p-2 font-medium">Brand</th>
                                        <th className="text-left p-2 font-medium">SAP ID</th>
                                        <th className="text-left p-2 font-medium">HSN Code</th>
                                        <th className="text-left p-2 font-medium">PO Qty</th>
                                        <th className="text-left p-2 font-medium">Remaining</th>
                                        <th className="text-left p-2 font-medium">Cost Price</th>
                                        <th className="text-left p-2 font-medium">MRP</th>
                                        <th className="text-left p-2 font-medium">Total Value</th>
                                      </>
                                    ) : (
                                      <>
                                        <th className="text-left p-2 font-medium">Item</th>
                                        <th className="text-left p-2 font-medium">Code</th>
                                        <th className="text-left p-2 font-medium">Quantity</th>
                                        <th className="text-left p-2 font-medium">Price</th>
                                        <th className="text-left p-2 font-medium">Total</th>
                                      </>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsedData.lines.slice(0, 5).map((line: any, index: number) => (
                                    <tr key={index} className="border-b last:border-b-0">
                                      {selectedPlatformData?.id === 'zepto' ? (
                                        <>
                                          <td className="p-2">{line.sku || 'N/A'}</td>
                                          <td className="p-2">{line.brand || 'N/A'}</td>
                                          <td className="p-2">{line.sap_id || 'N/A'}</td>
                                          <td className="p-2">{line.hsn_code || 'N/A'}</td>
                                          <td className="p-2">{line.po_qty || 0}</td>
                                          <td className="p-2">{line.remaining_qty || 0}</td>
                                          <td className="p-2">₹{line.cost_price || '0.00'}</td>
                                          <td className="p-2">₹{line.mrp || '0.00'}</td>
                                          <td className="p-2">₹{line.total_value || '0.00'}</td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="p-2">{line.item_name || line.sku || 'N/A'}</td>
                                          <td className="p-2">{line.item_code || line.sku || 'N/A'}</td>
                                          <td className="p-2">{line.quantity || line.po_qty || 0}</td>
                                          <td className="p-2">₹{line.cost_price || line.mrp || '0.00'}</td>
                                          <td className="p-2">₹{line.total_value || line.total_amount || '0.00'}</td>
                                        </>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {parsedData.lines.length > 5 && (
                                <div className="text-center py-2 text-gray-500">
                                  ... and {parsedData.lines.length - 5} more items
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button
                      onClick={handleImport}
                      disabled={importMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {importMutation.isPending ? "Importing..." : "Import to Database"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep("upload")}
                      disabled={importMutation.isPending}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
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

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}