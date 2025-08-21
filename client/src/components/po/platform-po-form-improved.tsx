import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { 
  Plus, Check, CalendarDays, Package, MapPin, Building2, User, FileText, 
  Warehouse, Truck, Save, AlertCircle, CheckCircle2, Clock, Info, X,
  ChevronRight, ChevronDown, Upload, Loader2, Search, Hash, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineItemRow } from "./line-item-row";
import { SeedButton } from "@/components/seed-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PfMst, DistributorMst, InsertPfOrderItems } from "@shared/schema";

const poFormSchema = z.object({
  company: z.string().min(1, "Company selection is required"),
  po_number: z.string().min(1, "PO number is required"),
  platform: z.number().refine(val => val > 0, "Platform selection is required"),
  status: z.string().min(1, "Status is required"),
  order_date: z.string().min(1, "Order date is required"),
  expiry_date: z.string().optional(),
  appointment_date: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  serving_distributor: z.string().optional(),
  dispatch_from: z.string().optional(),
  warehouse: z.string().optional(),
  attachment: z.string().optional()
});

type POFormData = z.infer<typeof poFormSchema>;

interface LineItem extends InsertPfOrderItems {
  tempId: string;
}

const companyOptions = [
  { value: "Jivo Mart", label: "Jivo Mart", icon: "🏢" },
  { value: "Jivo Wellness", label: "Jivo Wellness", icon: "💚" }
];

const statusOptions = [
  { value: "Open", label: "Open", color: "bg-green-500" },
  { value: "Closed", label: "Closed", color: "bg-gray-500" },
  { value: "Cancelled", label: "Cancelled", color: "bg-red-500" },
  { value: "Expired", label: "Expired", color: "bg-orange-500" },
  { value: "Duplicate", label: "Duplicate", color: "bg-yellow-500" }
];

const dispatchFromOptions = [
  { value: "MAYAPURI", label: "MAYAPURI", code: "MYP" },
  { value: "BHAKHAPUR", label: "BHAKHAPUR", code: "BKP" }
];

const regionStateData = {
  "North India": {
    icon: "🏔️",
    states: [
      { value: "Punjab", label: "Punjab" },
      { value: "Haryana", label: "Haryana" },
      { value: "Delhi", label: "Delhi" },
      { value: "Uttar Pradesh", label: "Uttar Pradesh" },
      { value: "Himachal Pradesh", label: "Himachal Pradesh" },
      { value: "Uttarakhand", label: "Uttarakhand" },
      { value: "Jammu & Kashmir", label: "Jammu & Kashmir" },
      { value: "Ladakh", label: "Ladakh" },
      { value: "Rajasthan", label: "Rajasthan" },
      { value: "Chandigarh", label: "Chandigarh" }
    ]
  },
  "South India": {
    icon: "🌴",
    states: [
      { value: "Karnataka", label: "Karnataka" },
      { value: "Tamil Nadu", label: "Tamil Nadu" },
      { value: "Kerala", label: "Kerala" },
      { value: "Andhra Pradesh", label: "Andhra Pradesh" },
      { value: "Telangana", label: "Telangana" },
      { value: "Puducherry", label: "Puducherry" },
      { value: "Lakshadweep", label: "Lakshadweep" }
    ]
  },
  "East India": {
    icon: "🌅",
    states: [
      { value: "West Bengal", label: "West Bengal" },
      { value: "Odisha", label: "Odisha" },
      { value: "Bihar", label: "Bihar" },
      { value: "Jharkhand", label: "Jharkhand" },
      { value: "Assam", label: "Assam" },
      { value: "Sikkim", label: "Sikkim" },
      { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
      { value: "Meghalaya", label: "Meghalaya" },
      { value: "Manipur", label: "Manipur" },
      { value: "Mizoram", label: "Mizoram" },
      { value: "Nagaland", label: "Nagaland" },
      { value: "Tripura", label: "Tripura" },
      { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands" }
    ]
  },
  "West India": {
    icon: "🏖️",
    states: [
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Gujarat", label: "Gujarat" },
      { value: "Goa", label: "Goa" },
      { value: "Dadra and Nagar Haveli", label: "Dadra and Nagar Haveli" },
      { value: "Daman and Diu", label: "Daman and Diu" }
    ]
  },
  "Central India": {
    icon: "🏛️",
    states: [
      { value: "Madhya Pradesh", label: "Madhya Pradesh" },
      { value: "Chhattisgarh", label: "Chhattisgarh" }
    ]
  }
};

export function PlatformPOFormImproved() {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    logistics: true,
    items: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      company: "",
      po_number: "",
      platform: 0,
      status: "Open",
      order_date: "",
      expiry_date: "",
      appointment_date: "",
      region: "",
      state: "",
      city: "",
      area: "",
      serving_distributor: "",
      dispatch_from: "",
      warehouse: "",
      attachment: ""
    }
  });

  const { data: platforms, isLoading: platformsLoading } = useQuery({
    queryKey: ["platforms"],
    queryFn: async () => {
      const response = await fetch("/api/platforms");
      const data = await response.json();
      return data as PfMst[];
    }
  });

  const { data: distributors, isLoading: distributorsLoading } = useQuery({
    queryKey: ["distributors"],
    queryFn: async () => {
      const response = await fetch("/api/distributors");
      const data = await response.json();
      return data as DistributorMst[];
    }
  });

  const selectedRegion = form.watch("region");
  const selectedState = form.watch("state");

  const stateOptions = useMemo(() => {
    if (!selectedRegion || !regionStateData[selectedRegion as keyof typeof regionStateData]) {
      return [];
    }
    return regionStateData[selectedRegion as keyof typeof regionStateData].states;
  }, [selectedRegion]);

  const filteredDistributors = useMemo(() => {
    if (!distributors) return [];
    
    return distributors.filter((dist: any) => {
      const matchesState = !selectedState || dist.state === selectedState;
      const matchesSearch = !searchTerm || 
        dist.distributor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dist.distributor_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesState && matchesSearch;
    });
  }, [distributors, selectedState, searchTerm]);

  useEffect(() => {
    const values = form.getValues();
    const filledFields = Object.values(values).filter(val => val !== "" && val !== 0).length;
    const totalFields = Object.keys(values).length;
    setFormProgress((filledFields / totalFields) * 100);
  }, [form.watch()]);

  const createPOMutation = useMutation({
    mutationFn: async (data: { poData: POFormData; lineItems: LineItem[] }) => {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/platform-po", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success! 🎉",
        description: "Purchase order created successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["platform-po"] });
      form.reset();
      setLineItems([]);
      setFormProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (data: POFormData) => {
    if (lineItems.length === 0) {
      toast({
        title: "No Line Items",
        description: "Please add at least one line item to the purchase order",
        variant: "destructive"
      });
      return;
    }
    createPOMutation.mutate({ poData: data, lineItems });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: Date.now().toString(),
      item_name: "",
      quantity: 0,
      sap_code: "",
      category: "",
      subcategory: "",
      basic_rate: "0",
      gst_rate: "0",
      landing_rate: "0",
      total_litres: "",
      status: "Pending",
      hsn_code: ""
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(lineItems.filter(item => item.tempId !== tempId));
    toast({
      title: "Item Removed",
      description: "Line item has been removed",
      variant: "default"
    });
  };

  const updateLineItem = (tempId: string, updates: Partial<LineItem>) => {
    setLineItems(lineItems.map(item => 
      item.tempId === tempId ? { ...item, ...updates } : item
    ));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("attachment", file.name);
      toast({
        title: "File Attached",
        description: `${file.name} has been attached`,
        variant: "default"
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create Platform Purchase Order
              </h1>
              <p className="text-gray-600 mt-2">Fill in the details below to create a new purchase order</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-500">Form Progress</span>
                <div className="flex items-center gap-2">
                  <Progress value={formProgress} />
                  <span className="text-sm font-medium">{Math.round(formProgress)}%</span>
                </div>
              </div>
              <SeedButton />
            </div>
          </div>
        </div>

        {(platformsLoading || distributorsLoading) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading data...</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Essential details about the purchase order</CardDescription>
                    </div>
                  </div>
                  {expandedSections.basic ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CardHeader>
              {expandedSections.basic && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Company
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select the company for this PO</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="hover:border-blue-400 transition-colors">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyOptions.map((company) => (
                              <SelectItem key={company.value} value={company.value}>
                                <div className="flex items-center gap-2">
                                  <span>{company.icon}</span>
                                  <span>{company.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="po_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          PO Number
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="Enter PO number"
                              className="pl-10 hover:border-blue-400 transition-colors"
                            />
                            <Hash className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Platform
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const newPlatformId = Number(value);
                            
                            // Clear all line items when platform changes
                            setLineItems([]);
                            
                            // Auto-select RK WORLD distributor for all platforms
                            form.setValue("serving_distributor", "RK WORLD");
                            toast({
                              title: "Auto-selected Distributor",
                              description: "RK WORLD has been automatically selected as the serving distributor.",
                            });
                            
                            // Update the platform field
                            field.onChange(newPlatformId);
                            
                            toast({
                              title: "Platform Changed",
                              description: "All line items have been cleared. Please add items for the new platform.",
                              variant: "default",
                            });
                          }} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="hover:border-blue-400 transition-colors">
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <div className="p-2">
                              <Input 
                                placeholder="Search platforms..." 
                                className="mb-2"
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            {platforms?.filter((p: any) => 
                              !searchTerm || p.pf_name?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((platform: any) => (
                              <SelectItem key={platform.id} value={platform.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{platform.pf_name}</span>
                                  <Badge variant="outline" className="ml-2">ID: {platform.id}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="hover:border-blue-400 transition-colors">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", status.color)} />
                                  <span>{status.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Order Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                            placeholder="Select order date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Expiry Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                            placeholder="Select expiry date"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional: When the PO expires</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            {/* Location Details Section */}
            <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('location')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Location Details</CardTitle>
                      <CardDescription>Delivery and regional information</CardDescription>
                    </div>
                  </div>
                  {expandedSections.location ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CardHeader>
              {expandedSections.location && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Region
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="hover:border-green-400 transition-colors">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(regionStateData).map(([region, data]) => (
                              <SelectItem key={region} value={region}>
                                <div className="flex items-center gap-2">
                                  <span>{data.icon}</span>
                                  <span>{region}</span>
                                  <Badge variant="outline" className="ml-2">{data.states.length} states</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          State
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                          <FormControl>
                            <SelectTrigger className="hover:border-green-400 transition-colors">
                              <SelectValue placeholder={selectedRegion ? "Select state" : "Select region first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stateOptions.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          City
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter city name"
                            className="hover:border-green-400 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Area
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter area (optional)"
                            className="hover:border-green-400 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional: Specific area or locality</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Appointment Date
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value ? new Date(field.value) : undefined}
                            onDateChange={(date: Date | undefined) => field.onChange(date?.toISOString())}
                            placeholder="Select appointment date"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional: Scheduled delivery date</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            {/* Logistics Section */}
            <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('logistics')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Logistics & Distribution</CardTitle>
                      <CardDescription>Warehouse and distributor information</CardDescription>
                    </div>
                  </div>
                  {expandedSections.logistics ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CardHeader>
              {expandedSections.logistics && (
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="serving_distributor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Serving Distributor
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="hover:border-purple-400 transition-colors">
                              <SelectValue placeholder="Select distributor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            <div className="sticky top-0 p-2 bg-white border-b">
                              <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                                <Input 
                                  placeholder="Search distributors..." 
                                  className="pl-9"
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>
                            {filteredDistributors.length > 0 ? (
                              filteredDistributors.map((dist: any) => (
                                <SelectItem key={dist.id} value={dist.id.toString()}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{dist.distributor_name}</span>
                                      {dist.distributor_code && <Badge variant="outline">{dist.distributor_code}</Badge>}
                                    </div>
                                    <span className="text-xs text-gray-500">{dist.city}, {dist.state}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                No distributors found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          {selectedState ? `Showing distributors in ${selectedState}` : "Select a state to filter distributors"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dispatch_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          Dispatch From
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="hover:border-purple-400 transition-colors">
                              <SelectValue placeholder="Select dispatch location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dispatchFromOptions.map((location) => (
                              <SelectItem key={location.value} value={location.value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{location.label}</span>
                                  <Badge variant="outline">{location.code}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warehouse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4" />
                          Warehouse
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter warehouse details"
                            className="hover:border-purple-400 transition-colors"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Optional: Specific warehouse information</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Attachment
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              {...field} 
                              placeholder="No file selected"
                              className="flex-1 hover:border-purple-400 transition-colors"
                              readOnly
                            />
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              onChange={handleFileChange}
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={handleFileUpload}
                              className="hover:bg-purple-50"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">Supported: PDF, DOC, DOCX, XLS, XLSX</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              )}
            </Card>

            {/* Line Items Section */}
            <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Line Items</CardTitle>
                      <CardDescription>Add products to the purchase order</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
                    </Badge>
                    <Button 
                      type="button" 
                      onClick={addLineItem}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {lineItems.length === 0 ? (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertTitle>No items added</AlertTitle>
                    <AlertDescription>
                      Click the "Add Item" button to start adding products to this purchase order.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <div key={item.tempId} className="relative">
                        <div className="absolute left-0 top-4 flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="ml-12">
                          <LineItemRow
                            item={item}
                            platformId={form.watch("platform")}
                            onUpdate={(updates) => updateLineItem(item.tempId, updates)}
                            onRemove={() => removeLineItem(item.tempId)}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="my-4" />
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Items</p>
                          <p className="text-2xl font-bold">{lineItems.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Quantity</p>
                          <p className="text-2xl font-bold">
                            {lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-green-600">
                            ₹{lineItems.reduce((sum, item) => sum + ((item.quantity || 0) * parseFloat(item.basic_rate || "0")), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  form.reset();
                  setLineItems([]);
                  toast({
                    title: "Form Reset",
                    description: "All fields have been cleared",
                    variant: "default"
                  });
                }}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Form
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const data = form.getValues();
                    localStorage.setItem('po-draft', JSON.stringify({ poData: data, lineItems }));
                    toast({
                      title: "Draft Saved",
                      description: "Your progress has been saved as a draft",
                      variant: "default"
                    });
                  }}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  <Save className="h-4 w-4 mr-2" />
              
                  Save Draft
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || lineItems.length === 0}
                  className="min-w-[150px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create PO
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </TooltipProvider>
  );
}