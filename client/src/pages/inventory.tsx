import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  RotateCcw, 
  Calendar,
  FileText,
  Upload,
  Eye,
  Database,
  Package,
  TrendingUp,
  Boxes,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Step = "period-type" | "date-range" | "upload" | "preview";

interface ParsedInventoryData {
  platform: string;
  businessUnit: string;
  periodType: 'daily' | 'range';
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems: number;
  items: any[];
  summary: {
    totalProducts: number;
    totalSellableInventory: number;
    totalUnsellableInventory: number;
    totalIntransit: number;
    totalOrders: number;
  };
}

export default function InventoryPage() {
  const [currentStep, setCurrentStep] = useState<Step>("period-type");
  const [selectedPeriodType, setSelectedPeriodType] = useState<'daily' | 'range' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInventoryData | null>(null);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", "jiomart");
      formData.append("businessUnit", "jm");
      formData.append("periodType", selectedPeriodType || "daily");
      
      if (selectedPeriodType === "daily") {
        formData.append("reportDate", selectedDate);
      } else {
        formData.append("periodStart", selectedStartDate);
        formData.append("periodEnd", selectedEndDate);
      }

      const response = await fetch("/api/inventory/preview", {
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
      console.log("Preview success, data received:", data);
      setParsedData(data);
      setCurrentStep("preview");
    },
    onError: (error) => {
      console.error("Preview error:", error);
      alert(`Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!parsedData) throw new Error("No data to import");

      return apiRequest("POST", "/api/inventory/import/jiomart", {
        data: parsedData,
        attachment_path: uploadedFile?.name || ""
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      alert("✅ Inventory data imported successfully!");
      goToPeriodSelection();
    },
    onError: (error: any) => {
      alert(`❌ Import failed: ${error.message}`);
    }
  });

  const handleFileUpload = async (file: File) => {
    console.log("Uploading file:", file.name);
    console.log("Selected period type:", selectedPeriodType);
    console.log("Selected date:", selectedDate);
    console.log("Selected start date:", selectedStartDate);
    console.log("Selected end date:", selectedEndDate);
    setUploadedFile(file);
    try {
      await previewMutation.mutateAsync(file);
    } catch (error) {
      console.error("File upload error:", error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const goBack = () => {
    if (currentStep === "date-range") {
      setCurrentStep("period-type");
    } else if (currentStep === "upload") {
      setCurrentStep("date-range");
    } else if (currentStep === "preview") {
      setCurrentStep("upload");
      setParsedData(null);
    }
  };

  const goToPeriodSelection = () => {
    setCurrentStep("period-type");
    setSelectedPeriodType(null);
    setSelectedDate("");
    setSelectedStartDate("");
    setSelectedEndDate("");
    setUploadedFile(null);
    setParsedData(null);
  };

  const handlePeriodTypeSelection = (type: 'daily' | 'range') => {
    setSelectedPeriodType(type);
    setCurrentStep("date-range");
  };

  const handleDateRangeNext = () => {
    if (selectedPeriodType === "daily" && selectedDate) {
      setCurrentStep("upload");
    } else if (selectedPeriodType === "range" && selectedStartDate && selectedEndDate) {
      setCurrentStep("upload");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Upload and manage Jio Mart inventory data with daily and range reporting
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg border">
          {/* Step 1: Period Type */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "period-type" ? "text-blue-600" : ["date-range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "period-type" ? "bg-blue-100 text-blue-600" : ["date-range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium">Period Type</span>
            </div>
          </div>

          {/* Step 2: Date Range */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "date-range" ? "text-blue-600" : ["upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "date-range" ? "bg-blue-100 text-blue-600" : ["upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium">Date Range</span>
            </div>
          </div>

          {/* Step 3: Upload */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "upload" ? "bg-blue-100 text-blue-600" : currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium">Upload</span>
            </div>
          </div>

          {/* Step 4: Preview */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "preview" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "preview" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}>
                4
              </div>
              <span className="text-xs sm:text-sm font-medium">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Period Type Selection */}
      {currentStep === "period-type" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Select Report Period Type</span>
            </CardTitle>
            <CardDescription>
              Choose whether you want to upload daily or date range inventory data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${selectedPeriodType === "daily" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                onClick={() => handlePeriodTypeSelection("daily")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">Daily Report</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Single day inventory data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${selectedPeriodType === "range" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                onClick={() => handlePeriodTypeSelection("range")}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">Date Range Report</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Multiple days inventory data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date Range Selection */}
      {currentStep === "date-range" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{selectedPeriodType === "daily" ? "Select Date" : "Select Date Range"}</span>
            </CardTitle>
            <CardDescription>
              {selectedPeriodType === "daily" 
                ? "Choose the date for your inventory report" 
                : "Choose the start and end dates for your inventory report"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPeriodType === "daily" ? (
              <div>
                <Label htmlFor="report-date" className="text-sm font-medium">Report Date</Label>
                <input
                  type="date"
                  id="report-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-medium">Start Date</Label>
                  <input
                    type="date"
                    id="start-date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm font-medium">End Date</Label>
                  <input
                    type="date"
                    id="end-date"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <Button
                variant="outline"
                onClick={goBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>

              <Button
                onClick={handleDateRangeNext}
                disabled={
                  (selectedPeriodType === "daily" && !selectedDate) ||
                  (selectedPeriodType === "range" && (!selectedStartDate || !selectedEndDate))
                }
                className="flex items-center space-x-2"
              >
                <span>Next</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: File Upload */}
      {currentStep === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Inventory File</span>
            </CardTitle>
            <CardDescription>
              Upload your Jio Mart inventory CSV file for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center hover:border-gray-400 transition-colors">
              <div className="space-y-4">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    Click to upload or drag and drop your inventory CSV file
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: CSV
                  </p>
                </div>
              </div>

              <input
                type="file"
                accept=".csv"
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
        <div className="space-y-4 sm:space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Eye className="w-5 h-5" />
                <span>Preview Inventory Data</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Review the inventory data before importing to Jio Mart - Jivo Mart
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Inventory Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {parsedData.summary?.totalProducts || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600">Total Products</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-green-600">
                    {parsedData.summary?.totalSellableInventory || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-green-600">Sellable Inventory</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-red-600">
                    {parsedData.summary?.totalUnsellableInventory || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-red-600">Unsellable Inventory</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-yellow-600">
                    {parsedData.summary?.totalIntransit || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-yellow-600">In Transit</div>
                </div>
                
                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    {parsedData.summary?.totalOrders || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600">Total Orders</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Import Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Business Unit:</span>
                  <div className="font-medium text-sm sm:text-base">{parsedData.businessUnit}</div>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Period Type:</span>
                  <div className="font-medium text-sm sm:text-base">{parsedData.periodType}</div>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600">Period:</span>
                  <div className="font-medium text-sm sm:text-base">
                    {parsedData.periodType === 'daily' 
                      ? new Date(parsedData.reportDate || '').toLocaleDateString()
                      : `${new Date(parsedData.periodStart || '').toLocaleDateString()} - ${new Date(parsedData.periodEnd || '').toLocaleDateString()}`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview Table Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Data Preview</CardTitle>
              <CardDescription className="text-sm">First {parsedData.items?.length || 0} records from your file</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {parsedData.items && Array.isArray(parsedData.items) && parsedData.items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="max-h-48 sm:max-h-60 overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
                      <Table>
                        <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                          <TableRow>
                            <TableHead className="min-w-[100px] px-4 py-3 font-semibold">SKU ID</TableHead>
                            <TableHead className="min-w-[200px] px-4 py-3 font-semibold">Title</TableHead>
                            <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Category</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-3 font-semibold">Status</TableHead>
                            <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Sellable</TableHead>
                            <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Unsellable</TableHead>
                            <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">In Transit</TableHead>
                            <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Orders</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.items.slice(0, 10).map((item, index) => (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="px-4 py-3">
                                <div className="truncate max-w-[100px]" title={item.sku_id}>
                                  {item.sku_id}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="truncate max-w-[200px]" title={item.title}>
                                  {item.title}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="truncate max-w-[120px]" title={item.category}>
                                  {item.category}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  item.product_status === 'Active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.product_status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-4 py-3">
                                {parseInt(item.total_sellable_inv || '0').toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right px-4 py-3">
                                {parseInt(item.total_unsellable_inv || '0').toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right px-4 py-3">
                                {parseInt(item.mtd_fwd_intransit || '0').toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right px-4 py-3">
                                {parseInt(item.mtd_order_count || '0').toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-600 border-t">
                    Showing first 10 of {parsedData.items.length} items • Scroll to view more
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-600">No data available to display</p>
                </div>
              )}

              {/* Import Button */}
              <div className="sticky bottom-0 bg-white border-t-2 border-green-200 mt-4 mb-4 p-4 rounded-lg shadow-lg">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      📦 Ready to Import Inventory
                    </h3>
                    <p className="text-sm text-gray-700 mb-4 font-medium">
                      Import {parsedData.totalItems || 0} inventory items into Jio Mart - Jivo Mart database
                    </p>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending || !parsedData.items?.length}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-5 text-xl min-w-[250px] shadow-xl border-2 border-green-700"
                      size="lg"
                    >
                      {importMutation.isPending ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Database className="w-7 h-7 mr-3" />
                          Import to Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white border-t pt-4 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={goBack}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={goToPeriodSelection}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Over</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading States */}
      {previewMutation.isPending && (
        <Card className="mt-4">
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Parsing inventory file...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}