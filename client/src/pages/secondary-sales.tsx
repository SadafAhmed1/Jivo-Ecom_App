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
  Calendar,
  RotateCcw,
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
  platform?: string;
  businessUnit?: string;
  periodType?: string;
  reportDate?: string;
  periodStart?: string;
  periodEnd?: string;
  totalItems?: number;
  summary?: {
    // Amazon fields
    totalOrderedRevenue?: number;
    totalOrderedUnits?: number;
    totalShippedRevenue?: number;
    totalShippedUnits?: number;
    totalCustomerReturns?: number;
    // Common fields for new platforms
    totalRecords?: number;
    totalSalesValue?: number;
    uniqueProducts?: number;
    dateRange?: string;
  };
  items?: any[];
}

const PLATFORMS = [
  {
    id: "amazon",
    name: "Amazon",
    description: "Upload Amazon secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "zepto",
    name: "Zepto",
    description: "Upload Zepto secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "blinkit",
    name: "Blinkit",
    description: "Upload Blinkit secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    description: "Upload Swiggy secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "jiomartsale",
    name: "Jio Mart Sale",
    description: "Upload Jio Mart Sale secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "jiomartcancel",
    name: "Jio Mart Cancel",
    description: "Upload Jio Mart Cancel secondary sales data",
    icon: ShoppingCart,
  },
  {
    id: "bigbasket",
    name: "BigBasket",
    description: "Upload BigBasket secondary sales data",
    icon: ShoppingCart,
  },
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

const PERIOD_TYPES = [
  {
    id: "daily",
    name: "Daily Report",
    description: "Upload daily sales report",
    icon: Calendar,
  },
  {
    id: "date-range",
    name: "Date Range Report",
    description: "Upload sales report for a specific date range",
    icon: Calendar,
  },
];

export default function SecondarySales() {
  const [currentStep, setCurrentStep] = useState<
    "platform" | "business-unit" | "period-type" | "date-range" | "upload" | "preview"
  >("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>("");
  const [selectedPeriodType, setSelectedPeriodType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSecondarySalesData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);
  const selectedBusinessUnitData = BUSINESS_UNITS.find((bu) => bu.id === selectedBusinessUnit);

  // Filter business units based on platform requirements
  const getAvailableBusinessUnits = () => {
    if (selectedPlatform === "amazon") {
      return BUSINESS_UNITS.filter(bu => bu.id === "jivo-wellness" || bu.id === "jivo-mart");
    }
    // New platforms only support Jivo Mart
    if (["zepto", "blinkit", "swiggy", "jiomartsale", "jiomartcancel", "bigbasket"].includes(selectedPlatform)) {
      return BUSINESS_UNITS.filter(bu => bu.id === "jivo-mart");
    }
    return BUSINESS_UNITS;
  };

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);
      formData.append("periodType", selectedPeriodType);
      if (selectedPeriodType === "date-range") {
        formData.append("startDate", dateRange.startDate);
        formData.append("endDate", dateRange.endDate);
      }

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
      formData.append("periodType", selectedPeriodType);
      if (selectedPeriodType === "date-range") {
        formData.append("startDate", dateRange.startDate);
        formData.append("endDate", dateRange.endDate);
      }

      const response = await fetch(`/api/secondary-sales/import/${selectedPlatform}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          // Handle duplicate file error specifically
          throw new Error(`Duplicate File: ${error.message || "This file has already been imported into the database."}`);
        }
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
      setSelectedPeriodType("");
      setDateRange({ startDate: "", endDate: "" });
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
      case "period-type":
        setCurrentStep("business-unit");
        setSelectedBusinessUnit("");
        break;
      case "date-range":
        setCurrentStep("period-type");
        setSelectedPeriodType("");
        break;
      case "upload":
        if (selectedPeriodType === "date-range") {
          setCurrentStep("date-range");
        } else {
          setCurrentStep("period-type");
        }
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
    setSelectedPeriodType("");
    setDateRange({ startDate: "", endDate: "" });
    setFile(null);
    setParsedData(null);
  };

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 max-h-screen overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Secondary Sales</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload and manage secondary sales data from various platforms
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap overflow-x-auto pb-2">
            {/* Step 1: Platform */}
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "platform" ? "text-blue-600" : ["business-unit", "period-type", "date-range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "platform" ? "bg-blue-100 text-blue-600" : ["business-unit", "period-type", "date-range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Platform</span>
            </div>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            
            {/* Step 2: Business Unit */}
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "business-unit" ? "text-blue-600" : ["period-type", "date-range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "business-unit" ? "bg-blue-100 text-blue-600" : ["period-type", "date-range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Business</span>
            </div>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            
            {/* Step 3: Period Type */}
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "period-type" ? "text-blue-600" : ["date-range", "upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "period-type" ? "bg-blue-100 text-blue-600" : ["date-range", "upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                3
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Period</span>
            </div>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            
            {/* Step 4: Date Range (conditional) */}
            {selectedPeriodType === "date-range" && (
              <>
                <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "date-range" ? "text-blue-600" : ["upload", "preview"].includes(currentStep) ? "text-green-600" : "text-gray-400"}`}>
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "date-range" ? "bg-blue-100 text-blue-600" : ["upload", "preview"].includes(currentStep) ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                    4
                  </div>
                  <span className="text-xs sm:text-sm font-medium hidden xs:inline">Dates</span>
                </div>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              </>
            )}
            
            {/* Step Upload */}
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "upload" ? "text-blue-600" : currentStep === "preview" ? "text-green-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "upload" ? "bg-blue-100 text-blue-600" : currentStep === "preview" ? "bg-green-100 text-green-600" : "bg-gray-100"}`}>
                {selectedPeriodType === "date-range" ? "5" : "4"}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Upload</span>
            </div>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            
            {/* Step Preview */}
            <div className={`flex items-center space-x-1 sm:space-x-2 ${currentStep === "preview" ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${currentStep === "preview" ? "bg-blue-100 text-blue-600" : "bg-gray-100"}`}>
                {selectedPeriodType === "date-range" ? "6" : "5"}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden xs:inline">Preview</span>
            </div>
          </div>
        </div>

        {/* Step 1: Platform Selection */}
        {currentStep === "platform" && (
          <Card className="max-h-[70vh] overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
            <CardHeader>
              <CardTitle>Select Platform</CardTitle>
              <CardDescription>
                Choose the platform for which you want to upload secondary sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-md ${
                      selectedPlatform === platform.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      setSelectedPlatform(platform.id);
                      setCurrentStep("business-unit");
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
                      <platform.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm sm:text-base truncate">{platform.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{platform.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              

            </CardContent>
          </Card>
        )}

        {/* Step 2: Business Unit Selection */}
        {currentStep === "business-unit" && (
          <Card className="max-h-[70vh] overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
            <CardHeader>
              <CardTitle>Select Business Unit</CardTitle>
              <CardDescription>
                Choose the business unit for {selectedPlatformData?.name} secondary sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {getAvailableBusinessUnits()
                  .map((businessUnit) => (
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
                    onClick={() => setCurrentStep("period-type")}
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

        {/* Step 3: Period Type Selection */}
        {currentStep === "period-type" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Period Type</CardTitle>
              <CardDescription>
                Choose whether you want to upload daily data or data for a specific date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedPeriodType === "daily"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedPeriodType("daily")}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-gray-600" />
                    <div>
                      <h3 className="font-medium">Daily Upload</h3>
                      <p className="text-sm text-gray-600">Upload data for today or a single day</p>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedPeriodType === "date-range"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedPeriodType("date-range")}
                >
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-8 h-8 text-gray-600" />
                    <div>
                      <h3 className="font-medium">Date Range Upload</h3>
                      <p className="text-sm text-gray-600">Upload data for a specific date range</p>
                    </div>
                  </div>
                </div>
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
                
                {selectedPeriodType && (
                  <Button
                    onClick={() => {
                      if (selectedPeriodType === "daily") {
                        setCurrentStep("upload");
                      } else {
                        setCurrentStep("date-range");
                      }
                    }}
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

        {/* Step 4: Date Range Selection (conditional) */}
        {currentStep === "date-range" && (
          <Card>
            <CardHeader>
              <CardTitle>Select Date Range</CardTitle>
              <CardDescription>
                Choose the start and end dates for your {selectedPlatformData?.name} data upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              {dateRange.startDate && dateRange.endDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Range:</strong> {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
                  </p>
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
                
                {dateRange.startDate && dateRange.endDate && (
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

        {/* Step File Upload */}
        {currentStep === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload {selectedPlatformData?.name} secondary sales data for {selectedBusinessUnitData?.name}
                {selectedPeriodType === "daily" && " (Daily data)"}
                {selectedPeriodType === "date-range" && dateRange.startDate && dateRange.endDate && 
                  ` (${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()})`}
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
          <div className="space-y-4 sm:space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Eye className="w-5 h-5" />
                  <span>Preview Data</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Review the parsed data before importing to {selectedPlatformData?.name} - {selectedBusinessUnitData?.name}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Summary Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {parsedData.totalItems || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-600">Total Items</div>
                  </div>
                
                  {/* Platform-specific summary cards */}
                  {parsedData.platform === "amazon" && (
                    <>
                      <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {parsedData.summary?.totalOrderedUnits || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600">Ordered Units</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-purple-600">
                          ₹{parsedData.summary?.totalOrderedRevenue?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-xs sm:text-sm text-purple-600">Ordered Revenue</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-orange-600">
                          ₹{parsedData.summary?.totalShippedRevenue?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600">Shipped Revenue</div>
                      </div>
                    </>
                  )}
                  
                  {/* New platforms summary cards */}
                  {["zepto", "blinkit", "swiggy", "jiomartsale", "jiomartcancel", "bigbasket"].includes(parsedData.platform || "") && (
                    <>
                      <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {parsedData.summary?.totalRecords || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-green-600">Total Records</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-purple-600">
                          ₹{parsedData.summary?.totalSalesValue?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-xs sm:text-sm text-purple-600">Total Sales Value</div>
                      </div>
                      <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-orange-600">
                          {parsedData.summary?.uniqueProducts || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-orange-600">Unique Products</div>
                      </div>
                    </>
                  )}

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
                            {/* Amazon table headers */}
                            {parsedData.platform === "amazon" && (
                              <>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">ASIN</TableHead>
                                <TableHead className="min-w-[250px] px-4 py-3 font-semibold">Product Title</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Brand</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Ordered Units</TableHead>
                                <TableHead className="text-right min-w-[120px] px-4 py-3 font-semibold">Ordered Revenue</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Shipped Units</TableHead>
                                <TableHead className="text-right min-w-[120px] px-4 py-3 font-semibold">Shipped Revenue</TableHead>
                              </>
                            )}
                            
                            {/* Zepto table headers */}
                            {parsedData.platform === "zepto" && (
                              <>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">SKU Name</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Category</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">Brand</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">City</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Units Sold</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">GMV</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">ASP</TableHead>
                              </>
                            )}
                            
                            {/* Blinkit table headers */}
                            {parsedData.platform === "blinkit" && (
                              <>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">Item Name</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Category</TableHead>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">Manufacturer</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">City</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Qty Sold</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Total Value</TableHead>
                              </>
                            )}
                            
                            {/* Swiggy table headers */}
                            {parsedData.platform === "swiggy" && (
                              <>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">Brand</TableHead>
                                <TableHead className="min-w-[200px] px-4 py-3 font-semibold">Product Name</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">City</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Area</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Category</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Units</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">GMV</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Base MRP</TableHead>
                              </>
                            )}

                            {/* Jio Mart Sale table headers */}
                            {parsedData.platform === "jiomartsale" && (
                              <>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">Shipment Number</TableHead>
                                <TableHead className="min-w-[200px] px-4 py-3 font-semibold">Product Title</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">SKU</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Shipment Status</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Qty</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">MRP</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Item Total</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Payment Method</TableHead>
                              </>
                            )}

                            {/* Jio Mart Cancel table headers */}
                            {parsedData.platform === "jiomartcancel" && (
                              <>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">Shipment Number</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">EAN</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">SKU</TableHead>
                                <TableHead className="min-w-[200px] px-4 py-3 font-semibold">Product</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Status</TableHead>
                                <TableHead className="min-w-[150px] px-4 py-3 font-semibold">Reason</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Quantity</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Amount</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Payment Method</TableHead>
                              </>
                            )}

                            {/* BigBasket table headers */}
                            {parsedData.platform === "bigbasket" && (
                              <>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Brand</TableHead>
                                <TableHead className="min-w-[200px] px-4 py-3 font-semibold">SKU Description</TableHead>
                                <TableHead className="min-w-[120px] px-4 py-3 font-semibold">Category</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">City</TableHead>
                                <TableHead className="min-w-[100px] px-4 py-3 font-semibold">SKU Weight</TableHead>
                                <TableHead className="text-right min-w-[80px] px-4 py-3 font-semibold">Quantity</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Total MRP</TableHead>
                                <TableHead className="text-right min-w-[100px] px-4 py-3 font-semibold">Total Sales</TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.items.map((item: any, index: number) => (
                            <TableRow key={index} className="hover:bg-gray-50 border-b">
                              {/* Amazon table rows */}
                              {parsedData.platform === "amazon" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.asin || "N/A"}>
                                      {item.asin || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[250px]" title={item.product_title || "N/A"}>
                                      {item.product_title || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.brand || "N/A"}>
                                      {item.brand || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.ordered_units || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.ordered_revenue || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.shipped_units || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.shipped_revenue || "0").toFixed(2)}
                                  </TableCell>
                                </>
                              )}
                              
                              {/* Zepto table rows */}
                              {parsedData.platform === "zepto" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.sku_name || "N/A"}>
                                      {item.sku_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.sku_category || "N/A"}>
                                      {item.sku_category || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.brand_name || "N/A"}>
                                      {item.brand_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.city || "N/A"}>
                                      {item.city || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.sales_qty_units || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.gmv || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{(item.sales_qty_units && parseFloat(item.gmv || "0") && item.sales_qty_units > 0 
                                      ? (parseFloat(item.gmv || "0") / item.sales_qty_units).toFixed(2) 
                                      : parseFloat(item.mrp || "0").toFixed(2))}
                                  </TableCell>
                                </>
                              )}
                              
                              {/* Blinkit table rows */}
                              {parsedData.platform === "blinkit" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.item_name || "N/A"}>
                                      {item.item_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.category || "N/A"}>
                                      {item.category || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.manufacturer_name || "N/A"}>
                                      {item.manufacturer_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.city_name || "N/A"}>
                                      {item.city_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.qty_sold || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.mrp || "0").toFixed(2)}
                                  </TableCell>
                                </>
                              )}
                              
                              {/* Swiggy table rows */}
                              {parsedData.platform === "swiggy" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.brand || "N/A"}>
                                      {item.brand || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[200px]" title={item.product_name || "N/A"}>
                                      {item.product_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.city || "N/A"}>
                                      {item.city || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.area_name || "N/A"}>
                                      {item.area_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.l1_category || "N/A"}>
                                      {item.l1_category || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.units_sold || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.gmv || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.base_mrp || "0").toFixed(2)}
                                  </TableCell>
                                </>
                              )}

                              {/* Jio Mart Sale table rows */}
                              {parsedData.platform === "jiomartsale" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.shipment_number || "N/A"}>
                                      {item.shipment_number || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[200px]" title={item.product_title || "N/A"}>
                                      {item.product_title || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.sku || "N/A"}>
                                      {item.sku || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.shipment_status || "N/A"}>
                                      {item.shipment_status || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.qty || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.mrp || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.item_total || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.payment_method_used || "N/A"}>
                                      {item.payment_method_used || "N/A"}
                                    </div>
                                  </TableCell>
                                </>
                              )}

                              {/* Jio Mart Cancel table rows */}
                              {parsedData.platform === "jiomartcancel" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.shipment_number || "N/A"}>
                                      {item.shipment_number || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.ean || "N/A"}>
                                      {item.ean || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.sku || "N/A"}>
                                      {item.sku || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[200px]" title={item.product || "N/A"}>
                                      {item.product || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.status || "N/A"}>
                                      {item.status || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[150px]" title={item.reason || "N/A"}>
                                      {item.reason || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.quantity || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.amount || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.payment_method || "N/A"}>
                                      {item.payment_method || "N/A"}
                                    </div>
                                  </TableCell>
                                </>
                              )}

                              {/* BigBasket table rows */}
                              {parsedData.platform === "bigbasket" && (
                                <>
                                  <TableCell className="font-medium px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.brand_name || "N/A"}>
                                      {item.brand_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[200px]" title={item.sku_description || "N/A"}>
                                      {item.sku_description || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[120px]" title={item.leaf_slug || "N/A"}>
                                      {item.leaf_slug || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.source_city_name || "N/A"}>
                                      {item.source_city_name || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-4 py-3">
                                    <div className="truncate max-w-[100px]" title={item.sku_weight || "N/A"}>
                                      {item.sku_weight || "N/A"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    {item.total_quantity || 0}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.total_mrp || "0").toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-right px-4 py-3">
                                    ₹{parseFloat(item.total_sales || "0").toFixed(2)}
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 text-center text-sm text-gray-600 border-t">
                    Showing all {parsedData.items.length} items • Scroll vertically and horizontally to view more
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-600">No data available to display</p>
                </div>
              )}

              {/* Import Button - Always Visible */}
              <div className="sticky bottom-0 bg-white border-t-2 border-green-200 mt-4 mb-4 p-4 rounded-lg shadow-lg">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      🗄️ Ready to Import Data
                    </h3>
                    <p className="text-sm text-gray-700 mb-4 font-medium">
                      Import {parsedData.totalItems || 0} items into {selectedPlatformData?.name} - {selectedBusinessUnitData?.name} database
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

              {/* Action Buttons - Navigation */}
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
                    onClick={goToPlatformSelection}
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
                <span>Parsing file...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}