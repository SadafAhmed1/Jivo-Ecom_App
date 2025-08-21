import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Plus, Check, CalendarDays, Package, MapPin, Building2, User, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LineItemRow } from "./line-item-row";
import { SeedButton } from "@/components/seed-button";
import { FloatingInput } from "@/components/ui/floating-input";
import type { PfMst, DistributorMst, InsertPfOrderItems } from "@shared/schema";

const poFormSchema = z.object({
  po_number: z.string().min(1, "PO number is required"),
  platform: z.number().min(1, "Platform selection is required"),
  status: z.string().min(1, "Status is required"),
  order_date: z.string().min(1, "Order date is required"),
  expiry_date: z.string().optional(),
  appointment_date: z.string().optional(),
  region: z.string().min(1, "Region is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  serving_distributor: z.string().optional(),
  attachment: z.string().optional()
});

type POFormData = z.infer<typeof poFormSchema>;

interface LineItem extends InsertPfOrderItems {
  tempId: string;
  po_id?: number;
}

const statusOptions = [
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Expired", label: "Expired" },
  { value: "Duplicate", label: "Duplicate" }
];

const regionStateData = {
  "North India": {
    states: [
      { value: "Punjab", label: "Punjab" },
      { value: "Haryana", label: "Haryana" },
      { value: "Delhi", label: "Delhi" },
      { value: "Uttar Pradesh", label: "Uttar Pradesh" },
      { value: "Himachal Pradesh", label: "Himachal Pradesh" },
      { value: "Uttarakhand", label: "Uttarakhand" },
      { value: "Jammu & Kashmir", label: "Jammu & Kashmir" },
      { value: "Rajasthan", label: "Rajasthan" }
    ]
  },
  "South India": {
    states: [
      { value: "Karnataka", label: "Karnataka" },
      { value: "Tamil Nadu", label: "Tamil Nadu" },
      { value: "Kerala", label: "Kerala" },
      { value: "Andhra Pradesh", label: "Andhra Pradesh" },
      { value: "Telangana", label: "Telangana" }
    ]
  },
  "East India": {
    states: [
      { value: "West Bengal", label: "West Bengal" },
      { value: "Odisha", label: "Odisha" },
      { value: "Bihar", label: "Bihar" },
      { value: "Jharkhand", label: "Jharkhand" },
      { value: "Assam", label: "Assam" },
      { value: "Sikkim", label: "Sikkim" },
      { value: "Arunachal Pradesh", label: "Arunachal Pradesh" }
    ]
  },
  "West India": {
    states: [
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Gujarat", label: "Gujarat" },
      { value: "Goa", label: "Goa" },
      { value: "Madhya Pradesh", label: "Madhya Pradesh" },
      { value: "Chhattisgarh", label: "Chhattisgarh" }
    ]
  }
};

const stateCityData: Record<string, { value: string; label: string }[]> = {
  "Punjab": [
    { value: "Chandigarh", label: "Chandigarh" },
    { value: "Ludhiana", label: "Ludhiana" },
    { value: "Amritsar", label: "Amritsar" },
    { value: "Jalandhar", label: "Jalandhar" },
    { value: "Patiala", label: "Patiala" },
    { value: "Bathinda", label: "Bathinda" }
  ],
  "Haryana": [
    { value: "Gurugram", label: "Gurugram" },
    { value: "Faridabad", label: "Faridabad" },
    { value: "Ambala", label: "Ambala" },
    { value: "Hisar", label: "Hisar" },
    { value: "Rohtak", label: "Rohtak" }
  ],
  "Delhi": [
    { value: "New Delhi", label: "New Delhi" },
    { value: "North Delhi", label: "North Delhi" },
    { value: "South Delhi", label: "South Delhi" },
    { value: "East Delhi", label: "East Delhi" },
    { value: "West Delhi", label: "West Delhi" },
    { value: "Central Delhi", label: "Central Delhi" }
  ],
  "Karnataka": [
    { value: "Bangalore", label: "Bangalore" },
    { value: "Mysore", label: "Mysore" },
    { value: "Hubli", label: "Hubli" },
    { value: "Mangalore", label: "Mangalore" },
    { value: "Belgaum", label: "Belgaum" }
  ],
  "Maharashtra": [
    { value: "Mumbai", label: "Mumbai" },
    { value: "Pune", label: "Pune" },
    { value: "Nagpur", label: "Nagpur" },
    { value: "Nashik", label: "Nashik" },
    { value: "Thane", label: "Thane" },
    { value: "Aurangabad", label: "Aurangabad" }
  ],
  "West Bengal": [
    { value: "Kolkata", label: "Kolkata" },
    { value: "Howrah", label: "Howrah" },
    { value: "Durgapur", label: "Durgapur" },
    { value: "Siliguri", label: "Siliguri" },
    { value: "Asansol", label: "Asansol" }
  ],
  "Tamil Nadu": [
    { value: "Chennai", label: "Chennai" },
    { value: "Coimbatore", label: "Coimbatore" },
    { value: "Madurai", label: "Madurai" },
    { value: "Trichy", label: "Trichy" },
    { value: "Salem", label: "Salem" }
  ],
  "Gujarat": [
    { value: "Ahmedabad", label: "Ahmedabad" },
    { value: "Surat", label: "Surat" },
    { value: "Vadodara", label: "Vadodara" },
    { value: "Rajkot", label: "Rajkot" },
    { value: "Gandhinagar", label: "Gandhinagar" }
  ],
  "Uttar Pradesh": [
    { value: "Lucknow", label: "Lucknow" },
    { value: "Kanpur", label: "Kanpur" },
    { value: "Ghaziabad", label: "Ghaziabad" },
    { value: "Agra", label: "Agra" },
    { value: "Varanasi", label: "Varanasi" },
    { value: "Allahabad", label: "Allahabad" },
    { value: "Noida", label: "Noida" }
  ],
  "Rajasthan": [
    { value: "Jaipur", label: "Jaipur" },
    { value: "Jodhpur", label: "Jodhpur" },
    { value: "Udaipur", label: "Udaipur" },
    { value: "Kota", label: "Kota" },
    { value: "Ajmer", label: "Ajmer" }
  ],
  "Kerala": [
    { value: "Kochi", label: "Kochi" },
    { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
    { value: "Kozhikode", label: "Kozhikode" },
    { value: "Thrissur", label: "Thrissur" },
    { value: "Kannur", label: "Kannur" }
  ],
  "Andhra Pradesh": [
    { value: "Visakhapatnam", label: "Visakhapatnam" },
    { value: "Vijayawada", label: "Vijayawada" },
    { value: "Guntur", label: "Guntur" },
    { value: "Tirupati", label: "Tirupati" },
    { value: "Nellore", label: "Nellore" }
  ],
  "Telangana": [
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Warangal", label: "Warangal" },
    { value: "Nizamabad", label: "Nizamabad" },
    { value: "Karimnagar", label: "Karimnagar" },
    { value: "Khammam", label: "Khammam" }
  ],
  "Madhya Pradesh": [
    { value: "Bhopal", label: "Bhopal" },
    { value: "Indore", label: "Indore" },
    { value: "Jabalpur", label: "Jabalpur" },
    { value: "Gwalior", label: "Gwalior" },
    { value: "Ujjain", label: "Ujjain" }
  ],
  "Bihar": [
    { value: "Patna", label: "Patna" },
    { value: "Gaya", label: "Gaya" },
    { value: "Bhagalpur", label: "Bhagalpur" },
    { value: "Muzaffarpur", label: "Muzaffarpur" },
    { value: "Darbhanga", label: "Darbhanga" }
  ],
  "Odisha": [
    { value: "Bhubaneswar", label: "Bhubaneswar" },
    { value: "Cuttack", label: "Cuttack" },
    { value: "Rourkela", label: "Rourkela" },
    { value: "Puri", label: "Puri" },
    { value: "Berhampur", label: "Berhampur" }
  ],
  "Assam": [
    { value: "Guwahati", label: "Guwahati" },
    { value: "Silchar", label: "Silchar" },
    { value: "Dibrugarh", label: "Dibrugarh" },
    { value: "Jorhat", label: "Jorhat" },
    { value: "Tezpur", label: "Tezpur" }
  ],
  "Jharkhand": [
    { value: "Ranchi", label: "Ranchi" },
    { value: "Jamshedpur", label: "Jamshedpur" },
    { value: "Dhanbad", label: "Dhanbad" },
    { value: "Bokaro", label: "Bokaro" },
    { value: "Deoghar", label: "Deoghar" }
  ],
  "Chhattisgarh": [
    { value: "Raipur", label: "Raipur" },
    { value: "Bhilai", label: "Bhilai" },
    { value: "Bilaspur", label: "Bilaspur" },
    { value: "Durg", label: "Durg" },
    { value: "Korba", label: "Korba" }
  ],
  "Goa": [
    { value: "Panaji", label: "Panaji" },
    { value: "Margao", label: "Margao" },
    { value: "Vasco da Gama", label: "Vasco da Gama" },
    { value: "Mapusa", label: "Mapusa" },
    { value: "Ponda", label: "Ponda" }
  ],
  "Himachal Pradesh": [
    { value: "Shimla", label: "Shimla" },
    { value: "Manali", label: "Manali" },
    { value: "Dharamshala", label: "Dharamshala" },
    { value: "Solan", label: "Solan" },
    { value: "Kullu", label: "Kullu" }
  ],
  "Uttarakhand": [
    { value: "Dehradun", label: "Dehradun" },
    { value: "Haridwar", label: "Haridwar" },
    { value: "Rishikesh", label: "Rishikesh" },
    { value: "Nainital", label: "Nainital" },
    { value: "Haldwani", label: "Haldwani" }
  ],
  "Jammu & Kashmir": [
    { value: "Srinagar", label: "Srinagar" },
    { value: "Jammu", label: "Jammu" },
    { value: "Anantnag", label: "Anantnag" },
    { value: "Baramulla", label: "Baramulla" },
    { value: "Kathua", label: "Kathua" }
  ],
  "Sikkim": [
    { value: "Gangtok", label: "Gangtok" },
    { value: "Namchi", label: "Namchi" },
    { value: "Pelling", label: "Pelling" },
    { value: "Ravangla", label: "Ravangla" },
    { value: "Mangan", label: "Mangan" }
  ],
  "Arunachal Pradesh": [
    { value: "Itanagar", label: "Itanagar" },
    { value: "Tawang", label: "Tawang" },
    { value: "Ziro", label: "Ziro" },
    { value: "Pasighat", label: "Pasighat" },
    { value: "Bomdila", label: "Bomdila" }
  ]
};

const regionOptions = Object.keys(regionStateData).map(region => ({
  value: region,
  label: region
}));

export function PlatformPOForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [availableStates, setAvailableStates] = useState<{ value: string; label: string }[]>([]);
  const [availableCities, setAvailableCities] = useState<{ value: string; label: string }[]>([]);
  const [filteredDistributors, setFilteredDistributors] = useState<DistributorMst[]>([]);

  const form = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      po_number: "",
      platform: 0,
      status: "Open",
      order_date: new Date().toISOString().split('T')[0],
      expiry_date: "",
      appointment_date: "",
      region: "",
      state: "",
      city: "",
      area: "",
      serving_distributor: "none",
      attachment: ""
    }
  });

  // Fetch platforms
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Fetch distributors
  const { data: distributors = [] } = useQuery<DistributorMst[]>({
    queryKey: ["/api/distributors"]
  });

  // Get current platform selection
  const selectedPlatform = form.watch("platform");
  const selectedRegion = form.watch("region");
  const selectedState = form.watch("state");

  // Effect to update states when region changes
  useEffect(() => {
    if (selectedRegion && regionStateData[selectedRegion as keyof typeof regionStateData]) {
      setAvailableStates(regionStateData[selectedRegion as keyof typeof regionStateData].states);
      // Reset state and city when region changes
      form.setValue("state", "");
      form.setValue("city", "");
      setAvailableCities([]);
    } else {
      setAvailableStates([]);
      setAvailableCities([]);
    }
  }, [selectedRegion, form]);

  // Effect to update cities when state changes
  useEffect(() => {
    if (selectedState && stateCityData[selectedState]) {
      setAvailableCities(stateCityData[selectedState]);
      // Reset city when state changes
      form.setValue("city", "");
    } else {
      setAvailableCities([]);
    }
  }, [selectedState, form]);

  // Effect to filter distributors based on platform (Amazon -> RK only)
  useEffect(() => {
    const platform = platforms.find(p => p.id === selectedPlatform);
    
    if (platform?.pf_name?.toLowerCase().includes('amazon')) {
      // For Amazon, only show RK distributor
      const rkDistributor = distributors.filter(d => 
        d.distributor_name.toLowerCase().includes('rk') || 
        d.distributor_name.toLowerCase() === 'rk'
      );
      setFilteredDistributors(rkDistributor);
      
      // Auto-select RK if it's the only option
      if (rkDistributor.length === 1) {
        form.setValue("serving_distributor", rkDistributor[0].distributor_name);
      }
    } else {
      // For other platforms, show all distributors except RK
      const otherDistributors = distributors.filter(d => 
        !d.distributor_name.toLowerCase().includes('rk') && 
        d.distributor_name.toLowerCase() !== 'rk'
      );
      setFilteredDistributors(otherDistributors);
    }
  }, [selectedPlatform, platforms, distributors, form]);

  // Effect to reset form when platform changes
  useEffect(() => {
    if (selectedPlatform) {
      // Reset all form fields except platform when platform changes
      const currentPlatform = form.getValues("platform");
      form.reset({
        po_number: "",
        platform: currentPlatform,
        status: "Open",
        order_date: new Date().toISOString().split('T')[0],
        expiry_date: "",
        appointment_date: "",
        region: "",
        state: "",
        city: "",
        area: "",
        serving_distributor: "none",
        attachment: ""
      });
      
      // Also clear line items
      setLineItems([]);
    }
  }, [selectedPlatform]);

  // Create PO mutation
  const createPoMutation = useMutation({
    mutationFn: async (data: { po: POFormData; items: InsertPfOrderItems[] }) => {
      const response = await apiRequest("POST", "/api/pos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase order created successfully!"
      });
      form.reset();
      setLineItems([]);
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive"
      });
    }
  });

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: `temp-${Date.now()}`,
      po_id: 0, // Temporary value, will be set by backend
      item_name: "",
      quantity: 0,
      sap_code: "",
      category: "",
      subcategory: "",
      basic_rate: "0",
      gst_rate: "0",
      landing_rate: "0",
      status: "Pending"
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (tempId: string, updates: Partial<LineItem>) => {
    setLineItems(items => 
      items.map(item => 
        item.tempId === tempId ? { ...item, ...updates } : item
      )
    );
  };

  const removeLineItem = (tempId: string) => {
    setLineItems(items => items.filter(item => item.tempId !== tempId));
  };

  const calculateTotals = () => {
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = lineItems.reduce((sum, item) => {
      const landingRate = parseFloat(item.landing_rate || "0");
      const quantity = item.quantity || 0;
      return sum + (landingRate * quantity);
    }, 0);

    return { totalQuantity, totalValue };
  };

  const onSubmit = (data: POFormData) => {
    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive"
      });
      return;
    }

    const items: InsertPfOrderItems[] = lineItems.map(({ tempId, ...item }) => ({
      ...item,
      po_id: 0 // Will be set by the backend
    }));

    // Convert "none" back to undefined for database storage
    const processedData = {
      ...data,
      serving_distributor: data.serving_distributor === "none" ? undefined : data.serving_distributor
    };

    createPoMutation.mutate({ po: processedData, items });
  };

  const { totalQuantity, totalValue } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Create Purchase Order
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Fill in the details below to create a new purchase order
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  form.reset();
                  setLineItems([]);
                }}
                className="border-slate-300 hover:bg-slate-50"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                form="po-form"
                disabled={createPoMutation.isPending || lineItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {createPoMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="relative p-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <Form {...form}>
            <form id="po-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              {/* Basic Information Section */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4 pb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Basic Information
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Core purchase order details</p>
                  </div>
                  <div className="h-px bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 flex-1"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="po_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PO Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter PO number"
                            className="h-12 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Platform *
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                              <SelectValue placeholder="Select Platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg shadow-xl border-0 bg-white/95 backdrop-blur-md">
                            {platforms.map((platform) => (
                              <SelectItem 
                                key={platform.id} 
                                value={platform.id.toString()}
                                className="hover:bg-blue-50 focus:bg-blue-50 transition-colors"
                              >
                                {platform.pf_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Status *
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-green-400 focus:border-green-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg shadow-xl border-0 bg-white/95 backdrop-blur-md">
                            {statusOptions.map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="hover:bg-green-50 focus:bg-green-50 transition-colors"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Date Section */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 pb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Important Dates
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Set key timeline milestones</p>
                    </div>
                    <div className="h-px bg-gradient-to-r from-green-200 via-emerald-200 to-teal-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <FormField
                      control={form.control}
                      name="order_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Order Date *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DatePicker
                                date={field.value ? new Date(field.value) : undefined}
                                onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                placeholder="Select order date"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Expiry Date
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                              placeholder="Select expiry date"
                            />
                          </FormControl>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Appointment Date
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              date={field.value ? new Date(field.value) : undefined}
                              onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                              placeholder="Select appointment date"
                            />
                          </FormControl>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Location Section */}
                <div className="space-y-8">
                  <div className="flex items-center space-x-4 pb-4">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Location Details
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Delivery and regional information</p>
                    </div>
                    <div className="h-px bg-gradient-to-r from-orange-200 via-red-200 to-pink-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Region *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-orange-400 focus:border-orange-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                                <SelectValue placeholder="Select Region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-slate-200 dark:border-slate-700">
                              {regionOptions.map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            State *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-orange-400 focus:border-orange-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                                <SelectValue placeholder="Select State" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-slate-200 dark:border-slate-700">
                              {availableStates.length === 0 ? (
                                <SelectItem value="_" disabled>
                                  Please select a region first
                                </SelectItem>
                              ) : (
                                availableStates.map((option) => (
                                  <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            City *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-orange-400 focus:border-orange-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                                <SelectValue placeholder="Select City" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-slate-200 dark:border-slate-700">
                              {availableCities.length === 0 ? (
                                <SelectItem value="_" disabled>
                                  Please select a state first
                                </SelectItem>
                              ) : (
                                availableCities.map((option) => (
                                  <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="hover:bg-orange-50 focus:bg-orange-50 transition-colors"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Area
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter area/locality"
                              className="h-12 border-2 border-slate-200 hover:border-orange-400 focus:border-orange-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serving_distributor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Distributor
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-2 border-slate-200 hover:border-purple-400 focus:border-purple-500 transition-all duration-300 rounded-lg bg-white/50 backdrop-blur-sm">
                                <SelectValue placeholder="Select Distributor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="border-slate-200 dark:border-slate-700">
                              <SelectItem 
                                value="none"
                                className="hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                              >
                                -- No Distributor --
                              </SelectItem>
                              {filteredDistributors.map((distributor) => (
                                <SelectItem 
                                  key={distributor.id} 
                                  value={distributor.distributor_name}
                                  className="hover:bg-purple-50 focus:bg-purple-50 transition-colors"
                                >
                                  {distributor.distributor_name}
                                  {platforms.find(p => p.id === selectedPlatform)?.pf_name?.toLowerCase().includes('amazon') && 
                                   distributor.distributor_name.toLowerCase().includes('rk') && (
                                    <span className="ml-2 text-xs text-purple-600">(Amazon Default)</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs mt-1" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </div>

      {/* Enhanced Line Items Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-slate-700/50 shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-teal-400/10 to-transparent rounded-full blur-3xl"></div>
        
        <CardHeader className="relative border-b border-emerald-100/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Order Items
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Add and manage your purchase order items
                </p>
              </div>
            </div>
            <Button 
              type="button" 
              onClick={addLineItem} 
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Item
            </Button>
          </div>
        </CardHeader>

        {/* Enhanced Items Table */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[1400px]">
              <colgroup>
                <col className="w-96" />
                <col className="w-32" />
                <col className="w-36" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-36" />
              </colgroup>
              <thead className="bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 border-b-2 border-emerald-200/50 dark:border-slate-700 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-6 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Item Details
                    </div>
                  </th>
                  <th className="px-6 py-6 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">SAP Code</th>
                  <th className="px-6 py-6 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-6 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-6 text-right text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Basic Rate</th>
                  <th className="px-6 py-6 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">GST Rate</th>
                  <th className="px-6 py-6 text-right text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Landing Rate</th>
                  <th className="px-6 py-6 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/60 dark:bg-slate-950/60 divide-y divide-emerald-100/50 dark:divide-slate-800/50 backdrop-blur-sm">
                {lineItems.map((item) => (
                  <LineItemRow
                    key={item.tempId}
                    item={item}
                    platformId={form.watch("platform")}
                    onUpdate={(updates) => updateLineItem(item.tempId, updates)}
                    onRemove={() => removeLineItem(item.tempId)}
                  />
                ))}
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900/50 dark:to-teal-800/50 rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <Plus className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="space-y-3 text-center">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ready to add items?</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">Click "Add Item" above to start building your purchase order with products and quantities</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Summary Section */}
        {lineItems.length > 0 && (
          <div className="relative px-10 py-8 border-t-2 border-emerald-200/50 dark:border-slate-700/50 bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 dark:from-slate-800/80 dark:via-slate-900/80 dark:to-slate-800/80 backdrop-blur-md">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-3 px-4 py-3 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-md border border-emerald-100/50">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Items</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{lineItems.length}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 px-4 py-3 bg-white/80 dark:bg-slate-800/80 rounded-xl shadow-md border border-blue-100/50">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Qty</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalQuantity}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl shadow-lg border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Value:</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 sm:justify-end bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
        <Button 
          variant="outline"
          type="button"
          size="lg"
          className="w-full sm:w-auto px-10 py-4 font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800 transition-all duration-300 rounded-xl"
          onClick={() => {
            form.reset();
            setLineItems([]);
          }}
        >
          Reset Form
        </Button>
        <Button 
          type="submit" 
          form="po-form"
          disabled={createPoMutation.isPending || lineItems.length === 0}
          size="lg"
          className="w-full sm:w-auto px-10 py-4 font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl"
        >
          {createPoMutation.isPending ? (
            <>
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Create Purchase Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
