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
  ShoppingCart,
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

interface ParsedSecondarySalesData {
  header?: any;
  lines?: any[];
  totalItems?: number;
  totalQuantity?: number;
  totalAmount?: string;
  detectedBusinessUnit?: string;
}

const PLATFORMS = [
  {
    id: "amazon",
    name: "Amazon",
    description: "Upload Amazon secondary sales data",
    icon: ShoppingCart,
  },
  // Future platforms can be added here
  // {
  //   id: "flipkart",
  //   name: "Flipkart",
  //   description: "Upload Flipkart secondary sales data",
  //   icon: ShoppingCart,
  // },
];

const BUSINESS_UNITS = [
  {
    id: "jivo-wellness",
    name: "Jivo Wellness",
    description: "Jivo Wellness products sales data",
  },
  {
    id: "jivo-mart",
    name: "Jivo Mart", 
    description: "Jivo Mart products sales data",
  },
  {
    id: "marketplace",
    name: "MarketPlace",
    description: "MarketPlace products sales data",
  },
];

export default function SecondarySales() {
  const [currentStep, setCurrentStep] = useState<
    "platform" | "business-unit" | "upload" | "preview"
  >("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSecondarySalesData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);
  const selectedBusinessUnitData = BUSINESS_UNITS.find((bu) => bu.id === selectedBusinessUnit);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);

      const response = await fetch("/api/secondary-sales/preview", {
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
        title: "File parsed successfully",
        description: `Found ${data.totalItems || 0} items`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to parse file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file || !selectedPlatform || !selectedBusinessUnit) {
        throw new Error("Missing required data");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);

      const response = await fetch(`/api/secondary-sales/import/${selectedPlatform}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import data");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Data imported successfully",
        description: `Imported ${data.totalItems || 0} items for ${selectedPlatformData?.name}`,
      });
      
      // Reset form
      setCurrentStep("platform");
      setSelectedPlatform("");
      setSelectedBusinessUnit("");
      setFile(null);
      setParsedData(null);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/secondary-sales/${selectedPlatform}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to import data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    await previewMutation.mutateAsync(uploadedFile);
  };

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
      handleFileUpload(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "business-unit":
        setCurrentStep("platform");
        setSelectedPlatform("");
        break;
      case "upload":
        setCurrentStep("business-unit");
        setSelectedBusinessUnit("");
        break;
      case "preview":
        setCurrentStep("upload");
        setFile(null);
        setParsedData(null);
        break;
    }
  };

  const goToPlatformSelection = () => {
    setCurrentStep("platform");
    setSelectedPlatform("");
    setSelectedBusinessUnit("");
    setFile(null);
    setParsedData(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Secondary Sales</h1>
          <p className="text-muted-foreground">
            Upload and manage secondary sales data from various platforms
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === "platform" ? "text-blue-600" : currentStep === "business-unit" || currentStep === "upload" || currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "platform" ? "bg-blue-100 text-blue-600" : currentStep === "business-unit" || currentStep === "upload" || currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                1
              </div>
              <span className="text-sm font-medium">Platform</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === "business-unit" ? "text-blue-600" : currentStep === "upload" || currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "business-unit" ? "bg-blue-100 text-blue-600" : currentStep === "upload" || currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                2
              </div>
              <span className="text-sm font-medium">Business Unit</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "upload" ? "bg-blue-100 text-blue-600" : currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                3
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${currentStep === "preview" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "preview" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}>
                4
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
          </div>
        </div>

        {/* Step 1: Platform Selection */}
        {currentStep === "platform" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Platform</CardTitle>
              <CardDescription>
                Choose the platform for which you want to upload secondary sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedPlatform === platform.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <platform.icon className="w-8 h-8 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{platform.name}</h3>
                        <p className="text-sm text-gray-600">{platform.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedPlatform && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setCurrentStep("business-unit")}
                    className="flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Business Unit Selection */}
        {currentStep === "business-unit" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Business Unit</CardTitle>
              <CardDescription>
                Choose the business unit for {selectedPlatformData?.name} secondary sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {BUSINESS_UNITS.map((businessUnit) => (
                  <div
                    key={businessUnit.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedBusinessUnit === businessUnit.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedBusinessUnit(businessUnit.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="w-8 h-8 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{businessUnit.name}</h3>
                        <p className="text-sm text-gray-600">{businessUnit.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                
                {selectedBusinessUnit && (
                  <Button
                    onClick={() => setCurrentStep("upload")}
                    className="flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: File Upload */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload {selectedPlatformData?.name} secondary sales data for {selectedBusinessUnitData?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your file here</p>
                  <p className="text-gray-600">
                    or click to browse for CSV, Excel, or XML files
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.xml"
                  onChange={handleInputChange}
                  className="hidden"
                  id="file-upload"
                />
                <Label
                  htmlFor="file-upload"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Browse Files
                </Label>
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Preview Data */}
        {currentStep === "preview" && parsedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Preview Data</span>
              </CardTitle>
              <CardDescription>
                Review the parsed data before importing to {selectedPlatformData?.name} - {selectedBusinessUnitData?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {parsedData.totalItems || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Items</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {parsedData.totalQuantity || 0}
                  </div>
                  <div className="text-sm text-green-600">Total Quantity</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{parsedData.totalAmount || "0.00"}
                  </div>
                  <div className="text-sm text-purple-600">Total Amount</div>
                </div>
              </div>

              {/* Preview Table */}
              {parsedData.lines && parsedData.lines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>SKU/Product Code</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.lines.slice(0, 10).map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {line.product_name || line.itemName || "N/A"}
                          </TableCell>
                          <TableCell>
                            {line.product_number || line.sku || line.productCode || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            {line.quantity || "0"}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{line.line_total || line.amount || "0.00"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {parsedData.lines.length > 10 && (
                    <div className="p-4 bg-gray-50 text-center text-sm text-gray-600">
                      Showing 10 of {parsedData.lines.length} items
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={goToPlatformSelection}
                  >
                    Start Over
                  </Button>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    {importMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Import Data</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading States */}
        {previewMutation.isPending && (
          <Card className="mt-4">
            <CardContent className="py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Parsing file...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}