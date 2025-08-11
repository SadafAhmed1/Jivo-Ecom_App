import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight,
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

type Step = "platform" | "business-unit" | "period-type" | "range" | "upload" | "preview";

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

const PLATFORMS = [
  {
    id: "jiomart",
    name: "Jio Mart",
    description: "Upload Jio Mart inventory data",
    icon: Package,
  },
];

const BUSINESS_UNITS = [
  {
    id: "jm",
    name: "Jivo Mart", 
    description: "Jivo Mart products inventory data",
  },
];

const PERIOD_TYPES = [
  {
    id: "daily",
    name: "Daily Report",
    description: "Upload daily inventory report",
    icon: Calendar,
  },
  {
    id: "range",
    name: "Date Range Report",
    description: "Upload inventory report for a specific date range",
    icon: Calendar,
  },
];

export default function InventoryPage() {
  const [currentStep, setCurrentStep] = useState<Step>("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [selectedPeriodType, setSelectedPeriodType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedInventoryData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);
  const selectedBusinessUnitData = BUSINESS_UNITS.find((bu) => bu.id === selectedBusinessUnit);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);
      formData.append("periodType", selectedPeriodType);
      
      if (selectedPeriodType === "range") {
        formData.append("periodStart", dateRange.startDate);
        formData.append("periodEnd", dateRange.endDate);
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
      formData.append("periodType", selectedPeriodType);
      
      if (selectedPeriodType === "date-range") {
        formData.append("startDate", dateRange.startDate);
        formData.append("endDate", dateRange.endDate);
      }

      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import data");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Success",
        description: "Inventory data imported successfully!",
      });
      resetToStart();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (file: File) => {
    setFile(file);
    await previewMutation.mutateAsync(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "business-unit":
        setCurrentStep("platform");
        break;
      case "period-type":
        setCurrentStep("business-unit");
        break;
      case "range":
        setCurrentStep("period-type");
        break;
      case "upload":
        setCurrentStep("range");
        break;
      case "preview":
        setCurrentStep("upload");
        setParsedData(null);
        break;
    }
  };

  const resetToStart = () => {
    setCurrentStep("platform");
    setSelectedPlatform("");
    setSelectedBusinessUnit("");
    setSelectedPeriodType("");
    setDateRange({ startDate: "", endDate: "" });
    setFile(null);
    setParsedData(null);
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setCurrentStep("business-unit");
  };

  const handleBusinessUnitSelect = (businessUnitId: string) => {
    setSelectedBusinessUnit(businessUnitId);
    setCurrentStep("period-type");
  };

  const handlePeriodTypeSelect = (periodTypeId: string) => {
    setSelectedPeriodType(periodTypeId);
    setCurrentStep("range");
  };

  const handleDateRangeNext = () => {
    if (selectedPeriodType === "daily" || (selectedPeriodType === "range" && dateRange.startDate && dateRange.endDate)) {
      setCurrentStep("upload");
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Upload and manage inventory data with step-by-step workflow
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between space-y-2 sm:space-y-0 bg-white p-4 rounded-lg border">
          {/* Step 1: Platform */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "platform" ? "text-blue-600" : ["business-unit", "period-type", "range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "platform" ? "bg-blue-100 text-blue-600" : ["business-unit", "period-type", "range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                1
              </div>
              <span className="text-sm font-medium">Platform</span>
            </div>
          </div>

          {/* Step 2: Business Unit */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "business-unit" ? "text-blue-600" : ["period-type", "range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "business-unit" ? "bg-blue-100 text-blue-600" : ["period-type", "range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                2
              </div>
              <span className="text-sm font-medium">Business Unit</span>
            </div>
          </div>

          {/* Step 3: Period Type */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "period-type" ? "text-blue-600" : ["range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "period-type" ? "bg-blue-100 text-blue-600" : ["range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                3
              </div>
              <span className="text-sm font-medium">Period Type</span>
            </div>
          </div>

          {/* Step 4: Date Range */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "range" ? "text-blue-600" : ["upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "range" ? "bg-blue-100 text-blue-600" : ["upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                4
              </div>
              <span className="text-sm font-medium">Date Range</span>
            </div>
          </div>

          {/* Step 5: Upload */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "upload" ? "bg-blue-100 text-blue-600" : currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                5
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
          </div>

          {/* Step 6: Preview */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 ${currentStep === "preview" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "preview" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}>
                6
              </div>
              <span className="text-sm font-medium">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Platform Selection */}
      {currentStep === "platform" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Select Platform</span>
            </CardTitle>
            <CardDescription>
              Choose the platform for inventory data upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {PLATFORMS.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <Card
                    key={platform.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPlatform === platform.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => handlePlatformSelect(platform.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{platform.name}</h3>
                          <p className="text-sm text-gray-600">{platform.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Business Unit Selection */}
      {currentStep === "business-unit" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Select Business Unit</span>
            </CardTitle>
            <CardDescription>
              Selected Platform: {selectedPlatformData?.name} - Choose your business unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {BUSINESS_UNITS.map((unit) => (
                <Card
                  key={unit.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBusinessUnit === unit.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => handleBusinessUnitSelect(unit.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{unit.name}</h3>
                        <p className="text-sm text-gray-600">{unit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Period Type Selection */}
      {currentStep === "period-type" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Select Period Type</span>
            </CardTitle>
            <CardDescription>
              Selected: {selectedPlatformData?.name} - {selectedBusinessUnitData?.name} - Choose reporting period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {PERIOD_TYPES.map((periodType) => {
                const IconComponent = periodType.icon;
                return (
                  <Card
                    key={periodType.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPeriodType === periodType.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => handlePeriodTypeSelect(periodType.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{periodType.name}</h3>
                          <p className="text-sm text-gray-600">{periodType.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Date Range Selection */}
      {currentStep === "range" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Set Date Range</span>
            </CardTitle>
            <CardDescription>
              {selectedPlatformData?.name} - {selectedBusinessUnitData?.name} - {PERIOD_TYPES.find(p => p.id === selectedPeriodType)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPeriodType === "daily" ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Daily reports are ready for upload without date specification.</p>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button onClick={handleDateRangeNext} className="flex items-center space-x-2">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </Button>
                  <Button 
                    onClick={handleDateRangeNext}
                    disabled={!dateRange.startDate || !dateRange.endDate}
                    className="flex items-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 5: File Upload */}
      {currentStep === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload File</span>
            </CardTitle>
            <CardDescription>
              Upload your inventory file for {selectedPlatformData?.name} - {selectedBusinessUnitData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Choose file to upload</p>
                  <p className="text-sm text-gray-600">CSV files supported</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={previewMutation.isPending}
                    />
                    <Button disabled={previewMutation.isPending}>
                      {previewMutation.isPending ? "Processing..." : "Browse Files"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button variant="outline" onClick={resetToStart} className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Over</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: Preview Data */}
      {currentStep === "preview" && parsedData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Preview Inventory Data</span>
              </CardTitle>
              <CardDescription>
                Review the inventory data before importing to {selectedPlatformData?.name} - {selectedBusinessUnitData?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{parsedData.totalItems || 0}</div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalSellableInventory || 0}</div>
                  <div className="text-sm text-green-600">Sellable Inventory</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{parsedData.summary?.totalUnsellableInventory || 0}</div>
                  <div className="text-sm text-red-600">Unsellable Inventory</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{parsedData.summary?.totalIntransit || 0}</div>
                  <div className="text-sm text-yellow-600">In Transit</div>
                </div>
              </div>

              {parsedData.items && parsedData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU ID</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Sellable</TableHead>
                          <TableHead className="text-right">Unsellable</TableHead>
                          <TableHead className="text-right">In Transit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.items.slice(0, 10).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{item.sku_id}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.title}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.product_status === 'Active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.product_status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{parseInt(item.total_sellable_inv || '0').toLocaleString()}</TableCell>
                            <TableCell className="text-right">{parseInt(item.total_unsellable_inv || '0').toLocaleString()}</TableCell>
                            <TableCell className="text-right">{parseInt(item.mtd_fwd_intransit || '0').toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedData.items.length > 10 && (
                    <div className="p-3 bg-gray-50 text-center text-sm text-gray-600 border-t">
                      Showing first 10 of {parsedData.items.length} items
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={goBack} className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetToStart} className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4" />
                    <span>Start Over</span>
                  </Button>
                  <Button
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    {importMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4" />
                        <span>Import Data</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}