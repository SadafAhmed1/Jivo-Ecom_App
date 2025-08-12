import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  AlertTriangle,
  Menu,
  CheckCircle2,
  XCircle
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
    // Jio Mart specific fields
    totalSellableInventory?: number;
    totalUnsellableInventory?: number;
    totalIntransit?: number;
    totalOrders?: number;
    // Blinkit specific fields
    totalStockOnHand?: number;
    totalAvailableQuantity?: number;
    totalReservedQuantity?: number;
    totalDamagedQuantity?: number;
    totalExpiredQuantity?: number;
    // Amazon specific fields
    totalUnitsAvailable?: number;
    totalInboundQuantity?: number;
    totalUnfulfillableQuantity?: number;
    totalValue?: number;
    // Swiggy specific fields
    totalWarehouseQty?: number;
    totalOpenPoQty?: number;
    totalPotentialGmvLoss?: number;
    uniqueFacilities?: number;
    uniqueCities?: number;
    // FlipKart specific fields
    totalLiveOnWebsite?: number;
    totalSales7D?: number;
    totalSales30D?: number;
    totalB2bScheduled?: number;
    uniqueWarehouses?: number;
    // Zepto specific fields
    totalRecords?: number;
    totalUnits?: number;
    uniqueCities?: number;
    uniqueSKUs?: number;
  };
}

const PLATFORMS = [
  {
    id: "jiomart",
    name: "Jio Mart",
    description: "Upload Jio Mart inventory data",
    icon: Package,
  },
  {
    id: "blinkit",
    name: "Blinkit",
    description: "Upload Blinkit inventory data",
    icon: Package,
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Upload Amazon inventory data (XLSX/CSV)",
    icon: Package,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    description: "Upload Swiggy inventory data",
    icon: Package,
  },
  {
    id: "flipkart",
    name: "FlipKart",
    description: "Upload FlipKart inventory data (CSV)",
    icon: Package,
  },
  {
    id: "zepto",
    name: "Zepto",
    description: "Upload Zepto inventory data (CSV)",
    icon: Package,
  },
];

const BUSINESS_UNITS = [
  {
    id: "jm",
    name: "Jivo Mart", 
    description: "Jivo Mart products inventory data",
  },
  {
    id: "jw",
    name: "Jivo Wellness", 
    description: "Jivo Wellness products inventory data",
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
  const [fileHash, setFileHash] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate file hash for duplicate detection
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const selectedPlatformData = PLATFORMS.find((p) => p.id === selectedPlatform);
  const selectedBusinessUnitData = BUSINESS_UNITS.find((bu) => bu.id === selectedBusinessUnit);

  // Filter business units based on selected platform
  const getAvailableBusinessUnits = () => {
    if (selectedPlatform === "amazon") {
      return BUSINESS_UNITS; // Amazon supports both JM and JW
    } else {
      return BUSINESS_UNITS.filter(unit => unit.id === "jm"); // Other platforms only support JM
    }
  };

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(10);
      
      // Generate file hash for duplicate detection
      const hash = await generateFileHash(file);
      setFileHash(hash);
      setUploadProgress(30);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);
      formData.append("periodType", selectedPeriodType);
      formData.append("fileHash", hash);
      
      if (selectedPeriodType === "range") {
        formData.append("periodStart", dateRange.startDate);
        formData.append("periodEnd", dateRange.endDate);
      }

      setUploadProgress(60);

      const response = await fetch("/api/inventory/preview", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const error = await response.json();
        
        // Throw an error object with response details for better error handling
        const errorObj = new Error(error.error || "Failed to preview file");
        (errorObj as any).response = { status: response.status, data: error };
        throw errorObj;
      }

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      setParsedData(data);
      setCurrentStep("preview");
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "File parsed successfully",
        description: `Found ${data.totalItems || 0} items`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Handle duplicate file detection with detailed error message
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        toast({
          title: errorData.error || "Duplicate File Detected",
          description: errorData.message || "This file has already been uploaded for this configuration.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Failed to parse file",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
      }
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file || !selectedPlatform || !selectedBusinessUnit) {
        throw new Error("Missing required data");
      }

      setIsUploading(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("platform", selectedPlatform);
      formData.append("businessUnit", selectedBusinessUnit);
      formData.append("periodType", selectedPeriodType);
      formData.append("fileHash", fileHash);
      
      if (selectedPeriodType === "range") {
        formData.append("startDate", dateRange.startDate);
        formData.append("endDate", dateRange.endDate);
      }

      setUploadProgress(50);

      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const error = await response.json();
        
        // Throw an error object with response details for better error handling
        const errorObj = new Error(error.error || "Failed to import data");
        (errorObj as any).response = { status: response.status, data: error };
        throw errorObj;
      }

      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Data imported successfully",
        description: `Imported ${data.importedCount || 0} items to ${data.targetTable}`,
        duration: 4000,
      });
      resetToStart();
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      
      // Handle duplicate file detection with detailed error message
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        toast({
          title: errorData.error || "Duplicate File Detected",
          description: errorData.message || "This file has already been uploaded for this configuration.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
      }
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

  // Mobile sidebar navigation content
  const SidebarContent = () => (
    <div className="p-4 h-full bg-gray-50">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <p className="text-sm text-gray-600">Inventory workflow steps</p>
      </div>
      
      {/* Progress in sidebar */}
      <div className="space-y-4">
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "platform" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</div>
          <span className="font-medium">Platform</span>
          {selectedPlatform && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "business-unit" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</div>
          <span className="font-medium">Business Unit</span>
          {selectedBusinessUnit && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "period-type" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">3</div>
          <span className="font-medium">Period Type</span>
          {selectedPeriodType && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "range" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">4</div>
          <span className="font-medium">Date Range</span>
          {(selectedPeriodType === "daily" || (dateRange.startDate && dateRange.endDate)) && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "upload" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">5</div>
          <span className="font-medium">Upload</span>
          {file && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
        
        <div className={`flex items-center space-x-3 p-3 rounded-lg ${currentStep === "preview" ? "bg-blue-100 text-blue-700" : "bg-white"}`}>
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">6</div>
          <span className="font-medium">Preview</span>
          {parsedData && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
      </div>
      
      {/* Upload progress */}
      {isUploading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Uploading...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-blue-700 mt-1">{uploadProgress}% complete</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      {/* Mobile header with hamburger menu */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Upload and manage inventory data with step-by-step workflow
          </p>
        </div>
        
        {/* Mobile menu button */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Inventory Workflow</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Progress Steps - Hidden on mobile, shown on desktop */}
      {!isMobile && (
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
      )}

      {/* Mobile progress indicator */}
      {isMobile && (
        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {currentStep === "platform" ? "1" : currentStep === "business-unit" ? "2" : currentStep === "period-type" ? "3" : currentStep === "range" ? "4" : currentStep === "upload" ? "5" : "6"}
                </div>
                <span className="text-sm font-medium capitalize">{currentStep.replace("-", " ")}</span>
              </div>
              {isUploading && (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-600">{uploadProgress}%</span>
                </div>
              )}
            </div>
            {isUploading && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}

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
              {getAvailableBusinessUnits().map((unit) => (
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
                  <p className="text-sm text-gray-600">
                    {selectedPlatform === 'amazon' ? 'CSV and XLSX files supported' : 'CSV files supported'}
                  </p>
                  <div className="relative">
                    <input
                      type="file"
                      accept={selectedPlatform === 'amazon' ? '.csv,.xlsx' : '.csv'}
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
        <div className="flex flex-col h-[calc(100vh-250px)]">
          {/* Summary Cards - Fixed at top */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>Preview Inventory Data</span>
              </CardTitle>
              <CardDescription>
                Review the inventory data before importing to {selectedPlatformData?.name} - {selectedBusinessUnitData?.name}
                <br />
                <span className="font-medium text-blue-600">
                  Target Table: INV_{
                    selectedPlatform === 'jiomart' ? 'JioMart' : 
                    selectedPlatform === 'amazon' ? 'Amazon' : 'Blinkit'
                  }_{selectedBusinessUnit.toUpperCase()}_{selectedPeriodType === 'daily' ? 'Daily' : 'Range'}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{parsedData.totalItems || 0}</div>
                  <div className="text-sm text-blue-600">Total Records</div>
                </div>
                {selectedPlatform === 'jiomart' ? (
                  <>
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
                  </>
                ) : selectedPlatform === 'amazon' ? (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalUnitsAvailable || 0}</div>
                      <div className="text-sm text-green-600">Total Units Received</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.summary?.totalInboundQuantity || 0}</div>
                      <div className="text-sm text-blue-600">Open PO Quantity</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">₹{(parsedData.summary?.totalValue || 0).toLocaleString()}</div>
                      <div className="text-sm text-purple-600">Net Received Value</div>
                    </div>
                  </>
                ) : selectedPlatform === 'swiggy' ? (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalWarehouseQty || 0}</div>
                      <div className="text-sm text-green-600">Warehouse Qty</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.summary?.totalOpenPoQty || 0}</div>
                      <div className="text-sm text-blue-600">Open PO Qty</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">₹{(parsedData.summary?.totalPotentialGmvLoss || 0).toLocaleString()}</div>
                      <div className="text-sm text-red-600">Potential Loss</div>
                    </div>
                  </>
                ) : selectedPlatform === 'flipkart' ? (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalLiveOnWebsite || 0}</div>
                      <div className="text-sm text-green-600">Live on Website</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.summary?.totalSales7D || 0}</div>
                      <div className="text-sm text-blue-600">7 Days Sales</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{parsedData.summary?.totalB2bScheduled || 0}</div>
                      <div className="text-sm text-purple-600">B2B Scheduled</div>
                    </div>
                  </>
                ) : selectedPlatform === 'zepto' ? (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalUnits || 0}</div>
                      <div className="text-sm text-green-600">Total Units</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.summary?.uniqueCities || 0}</div>
                      <div className="text-sm text-blue-600">Cities</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{parsedData.summary?.uniqueSKUs || 0}</div>
                      <div className="text-sm text-purple-600">Unique SKUs</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{parsedData.summary?.totalStockOnHand || 0}</div>
                      <div className="text-sm text-green-600">Stock on Hand</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{parsedData.summary?.totalAvailableQuantity || 0}</div>
                      <div className="text-sm text-blue-600">Available</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{(parsedData.summary?.totalDamagedQuantity || 0) + (parsedData.summary?.totalExpiredQuantity || 0)}</div>
                      <div className="text-sm text-red-600">Damaged + Expired</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Table - Scrollable */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg">Inventory Data Preview</CardTitle>
              <CardDescription>
                All {parsedData.items?.length || 0} inventory records from your file
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              {parsedData.items && parsedData.items.length > 0 && (
                <div className="h-full border rounded-lg overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10 border-b">
                        <TableRow>
                          {selectedPlatform === 'jiomart' && <TableHead className="w-32 border-r">RFC ID</TableHead>}
                          <TableHead className="w-40 border-r">
                            {selectedPlatform === 'amazon' ? 'ASIN' : 
                             selectedPlatform === 'swiggy' ? 'SKU Code' : 
                             selectedPlatform === 'flipkart' ? 'SKU' : 
                             selectedPlatform === 'zepto' ? 'SKU Code' : 'SKU ID'}
                          </TableHead>
                          <TableHead className="min-w-[250px] border-r">
                            {selectedPlatform === 'jiomart' ? 'Title' : 
                             selectedPlatform === 'amazon' ? 'Product Title' : 
                             selectedPlatform === 'swiggy' ? 'SKU Description' : 
                             selectedPlatform === 'flipkart' ? 'Product Title' : 
                             selectedPlatform === 'zepto' ? 'SKU Name' : 'Product Name'}
                          </TableHead>
                          <TableHead className="w-32 border-r">
                            {selectedPlatform === 'amazon' ? 'Brand' : 
                             selectedPlatform === 'swiggy' ? 'Storage Type' : 
                             selectedPlatform === 'flipkart' ? 'Brand' : 
                             selectedPlatform === 'zepto' ? 'City' : 'Category'}
                          </TableHead>
                          {selectedPlatform === 'blinkit' && <TableHead className="w-32 border-r">Brand</TableHead>}
                          {selectedPlatform === 'amazon' && <TableHead className="w-32 border-r">Condition</TableHead>}
                          {selectedPlatform === 'swiggy' && <TableHead className="w-32 border-r">L1 Category</TableHead>}
                          {selectedPlatform === 'swiggy' && <TableHead className="w-32 border-r">L2 Category</TableHead>}
                          {selectedPlatform === 'swiggy' && <TableHead className="w-32 border-r">City</TableHead>}
                          {selectedPlatform === 'swiggy' && <TableHead className="w-32 border-r">Facility</TableHead>}
                          {selectedPlatform === 'flipkart' && <TableHead className="w-32 border-r">Warehouse</TableHead>}
                          {selectedPlatform === 'zepto' && <TableHead className="w-32 border-r">Brand</TableHead>}
                          {selectedPlatform === 'zepto' && <TableHead className="w-32 border-r">Category</TableHead>}
                          {selectedPlatform === 'zepto' && <TableHead className="w-32 border-r">EAN</TableHead>}
                          <TableHead className="w-24 border-r">
                            {selectedPlatform === 'jiomart' ? 'Status' : 
                             selectedPlatform === 'amazon' ? 'Units Available' : 
                             selectedPlatform === 'swiggy' ? 'Days on Hand' : 
                             selectedPlatform === 'flipkart' ? 'Price' : 
                             selectedPlatform === 'zepto' ? 'Units' : 'Size'}
                          </TableHead>
                          {selectedPlatform === 'jiomart' ? (
                            <>
                              <TableHead className="text-right w-24 border-r">Sellable</TableHead>
                              <TableHead className="text-right w-24 border-r">Unsellable</TableHead>
                              <TableHead className="text-right w-24 border-r">In Transit</TableHead>
                              <TableHead className="text-right w-24">Orders</TableHead>
                            </>
                          ) : selectedPlatform === 'amazon' ? (
                            <>
                              <TableHead className="text-right w-24 border-r">Open PO Qty</TableHead>
                              <TableHead className="text-right w-24 border-r">Lead Time (days)</TableHead>
                              <TableHead className="text-right w-24 border-r">Unsellable Units</TableHead>
                              <TableHead className="text-right w-24">Net Received Value</TableHead>
                            </>
                          ) : selectedPlatform === 'swiggy' ? (
                            <>
                              <TableHead className="text-right w-24 border-r">Warehouse Qty</TableHead>
                              <TableHead className="text-right w-24 border-r">Open PO Qty</TableHead>
                              <TableHead className="text-right w-24 border-r">Potential Loss</TableHead>
                              <TableHead className="text-right w-24">Business Category</TableHead>
                            </>
                          ) : selectedPlatform === 'flipkart' ? (
                            <>
                              <TableHead className="text-right w-24 border-r">Live on Website</TableHead>
                              <TableHead className="text-right w-24 border-r">7D Sales</TableHead>
                              <TableHead className="text-right w-24 border-r">30D Sales</TableHead>
                              <TableHead className="text-right w-24">B2B Scheduled</TableHead>
                            </>
                          ) : selectedPlatform === 'zepto' ? (
                            <>
                              <TableHead className="text-right w-24 border-r">MRP (₹)</TableHead>
                              <TableHead className="text-right w-24 border-r">Selling Price</TableHead>
                              <TableHead className="text-right w-24 border-r">Pack Size</TableHead>
                              <TableHead className="text-right w-24">Report Date</TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="text-right w-24 border-r">Stock</TableHead>
                              <TableHead className="text-right w-24 border-r">Available</TableHead>
                              <TableHead className="text-right w-24 border-r">Reserved</TableHead>
                              <TableHead className="text-right w-24">Damaged</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.items.map((item, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            {selectedPlatform === 'jiomart' && (
                              <TableCell className="font-mono text-xs border-r">{item.rfc_id}</TableCell>
                            )}
                            <TableCell className="font-mono text-xs border-r">
                              {selectedPlatform === 'amazon' ? item.asin : 
                               selectedPlatform === 'swiggy' ? item.sku_code : 
                               selectedPlatform === 'flipkart' ? item.sku : 
                               selectedPlatform === 'zepto' ? item.skuCode : (item.sku_id || item.fnsku)}
                            </TableCell>
                            <TableCell className="border-r" title={
                              selectedPlatform === 'jiomart' ? item.title : 
                              selectedPlatform === 'amazon' ? item.product_name : 
                              selectedPlatform === 'swiggy' ? item.sku_description : 
                              selectedPlatform === 'flipkart' ? item.title : 
                              selectedPlatform === 'zepto' ? item.skuName : item.product_name
                            }>
                              <div className="max-w-[250px] truncate text-sm">
                                {selectedPlatform === 'jiomart' ? item.title : 
                                 selectedPlatform === 'amazon' ? item.product_name : 
                                 selectedPlatform === 'swiggy' ? item.sku_description : 
                                 selectedPlatform === 'flipkart' ? item.title : 
                                 selectedPlatform === 'zepto' ? item.skuName : item.product_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm border-r">
                              {selectedPlatform === 'amazon' ? item.brand : 
                               selectedPlatform === 'swiggy' ? item.storage_type : 
                               selectedPlatform === 'flipkart' ? item.brand : 
                               selectedPlatform === 'zepto' ? item.city : item.category}
                            </TableCell>
                            {selectedPlatform === 'blinkit' && (
                              <TableCell className="text-sm border-r">{item.brand}</TableCell>
                            )}
                            {selectedPlatform === 'amazon' && (
                              <TableCell className="text-sm border-r">{item.condition}</TableCell>
                            )}
                            {selectedPlatform === 'swiggy' && (
                              <TableCell className="text-sm border-r">{item.l1_category}</TableCell>
                            )}
                            {selectedPlatform === 'swiggy' && (
                              <TableCell className="text-sm border-r">{item.l2_category}</TableCell>
                            )}
                            {selectedPlatform === 'swiggy' && (
                              <TableCell className="text-sm border-r">{item.city}</TableCell>
                            )}
                            {selectedPlatform === 'swiggy' && (
                              <TableCell className="text-sm border-r">{item.facility_name}</TableCell>
                            )}
                            {selectedPlatform === 'flipkart' && (
                              <TableCell className="text-sm border-r">{item.warehouseId}</TableCell>
                            )}
                            {selectedPlatform === 'zepto' && (
                              <TableCell className="text-sm border-r">{item.brand}</TableCell>
                            )}
                            {selectedPlatform === 'zepto' && (
                              <TableCell className="text-sm border-r">{item.category}</TableCell>
                            )}
                            {selectedPlatform === 'zepto' && (
                              <TableCell className="text-sm border-r">{item.ean}</TableCell>
                            )}
                            <TableCell className="border-r">
                              {selectedPlatform === 'jiomart' ? (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  item.product_status === 'Active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.product_status}
                                </span>
                              ) : selectedPlatform === 'amazon' ? (
                                <span className="text-sm font-mono">{parseInt(item.units_available || '0').toLocaleString()}</span>
                              ) : selectedPlatform === 'swiggy' ? (
                                <span className="text-sm">{item.days_on_hand || 0}</span>
                              ) : selectedPlatform === 'flipkart' ? (
                                <span className="text-sm">₹{parseInt(item.flipkartSellingPrice || '0').toLocaleString()}</span>
                              ) : selectedPlatform === 'zepto' ? (
                                <span className="text-sm font-mono">{item.units || 0}</span>
                              ) : (
                                <span className="text-sm">{item.size}</span>
                              )}
                            </TableCell>
                            {selectedPlatform === 'jiomart' ? (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.total_sellable_inv || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.total_unsellable_inv || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.mtd_fwd_intransit || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {parseInt(item.mtd_order_count || '0').toLocaleString()}
                                </TableCell>
                              </>
                            ) : selectedPlatform === 'amazon' ? (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.inbound_quantity || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseFloat(item.last_updated_at || '0').toFixed(1)}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.unfulfillable_quantity || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {item.total_value ? `₹${parseFloat(item.total_value).toLocaleString()}` : '₹0'}
                                </TableCell>
                              </>
                            ) : selectedPlatform === 'swiggy' ? (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.warehouse_qty_available || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.open_po_quantity || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  ₹{parseFloat(item.potential_gmv_loss || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.business_category}
                                </TableCell>
                              </>
                            ) : selectedPlatform === 'flipkart' ? (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.liveOnWebsite || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.sales7D || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.sales30D || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {parseInt(item.b2bScheduled || '0').toLocaleString()}
                                </TableCell>
                              </>
                            ) : selectedPlatform === 'zepto' ? (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  ₹{parseFloat(item.mrp || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  ₹{parseFloat(item.sellingPrice || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {item.packSize || '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {item.reportDate ? format(new Date(item.reportDate), 'MMM dd') : '-'}
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.stock_on_hand || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.available_quantity || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm border-r">
                                  {parseInt(item.reserved_quantity || '0').toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {parseInt(item.damaged_quantity || '0').toLocaleString()}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t-2 bg-white flex-shrink-0 sticky bottom-0">
            <Button variant="outline" onClick={goBack} className="flex items-center space-x-2" size="lg">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={resetToStart} className="flex items-center space-x-2" size="lg">
                <RotateCcw className="w-4 h-4" />
                <span>Start Over</span>
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || !parsedData.items?.length}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2 px-8 py-3 text-lg font-semibold shadow-lg"
                size="lg"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    <span>Import to Database</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}