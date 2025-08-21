import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IndianRupee } from "lucide-react";
import { z } from "zod";
import { 
  Plus, Upload, FileText, Package, 
  Building2, AlertCircle, Search, CheckCircle2,
  XCircle, Loader2, Trash2, Save, RefreshCw,
  Eye, ShoppingCart, Calculator, Zap, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { SearchableItemInput } from "./searchable-item-input";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { PfMst, Statuses, StatusItem } from "@shared/schema";

const poFormSchema = z.object({
  company: z.enum(["JIVO MART", "JIVO WELLNESS"], {
    errorMap: () => ({ message: "Please select a company" })
  }),
  platform: z.string().min(1, "Platform selection is required"),
  vendor_po_no: z.string()
    .min(3, "PO number must be at least 3 characters")
    .max(50, "PO number cannot exceed 50 characters")
    .regex(/^[A-Z0-9\-_]+$/i, "PO number can only contain letters, numbers, hyphens, and underscores")
    .refine((value) => {
      // Discourage filename-like patterns
      const filenamePatterns = /\.(csv|xlsx|xls|txt|pdf)$|^(test|demo|sample|temp)[\w_]*$/i;
      return !filenamePatterns.test(value);
    }, "PO number should not look like a filename. Use professional format like 'PO-YYYYMMDD-XXXX'"),
  distributor: z.string().optional(),
  area: z.string().optional(),
  region: z.string().min(1, "Region selection is required"),
  state: z.string().min(1, "State selection is required"),
  city: z.string().min(1, "City selection is required"),
  dispatch_from: z.string().optional(),
  warehouse: z.string().optional(),
  po_date: z.string().min(1, "PO date is required")
    .refine((date) => {
      const poDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return poDate >= today;
    }, "PO date cannot be in the past"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  appointment_date: z.string().optional(),
  status: z.string().default("OPEN"),
  comments: z.string().max(1000, "Comments cannot exceed 1000 characters").optional(),
  attachment: z.any().optional()
}).superRefine((data, ctx) => {
  // Validate expiry date (now mandatory)
  if (data.expiry_date && data.po_date) {
    const expiryDate = new Date(data.expiry_date);
    const poDate = new Date(data.po_date);
    if (expiryDate < poDate) {
      ctx.addIssue({
        code: "custom",
        message: "Expiry date must be on or after PO date",
        path: ["expiry_date"]
      });
    }
  }
  
  // Validate appointment date
  if (data.appointment_date && data.po_date) {
    const appointmentDate = new Date(data.appointment_date);
    const poDate = new Date(data.po_date);
    if (appointmentDate < poDate) {
      ctx.addIssue({
        code: "custom",
        message: "Appointment date cannot be before PO date",
        path: ["appointment_date"]
      });
    }
  }
});

type POFormData = z.infer<typeof poFormSchema>;

interface LineItem {
  tempId: string;
  item_name: string;
  platform_code?: string;
  sap_code?: string;
  uom?: string;
  quantity: number;
  boxes?: number;
  unit_size_ltrs?: number;
  loose_qty?: number;
  basic_amount: number;
  tax_percent: number;
  landing_amount?: number;
  total_amount: number;
  total_ltrs?: number;
  status?: string;
  // Invoice fields - only shown when status requires them
  invoice_date?: string;
  invoice_litre?: number;
  invoice_amount?: number;
  invoice_qty?: number;
  // Dispatch and delivery fields
  dispatched_date?: string;
  delivery_date?: string;
  isValid?: boolean;
  errors?: string[];
}

interface FormState {
  isSubmitting: boolean;
  isGeneratingPO: boolean;
  isResetting: boolean;
  isInitialPopulation: boolean;
  lastSubmissionTime?: number;
}

interface ModernPOFormProps {
  onSuccess?: () => void;
  editMode?: boolean;
  editPoId?: string;
  editData?: any;
}

export function ModernPOForm({ onSuccess, editMode = false, editPoId }: ModernPOFormProps = {}) {
  const [selectedCompany, setSelectedCompany] = useState<"JIVO MART" | "JIVO WELLNESS">("JIVO MART");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previousPlatformId, setPreviousPlatformId] = useState<string>("");
  const [formState, setFormState] = useState<FormState>({ 
    isSubmitting: false, 
    isGeneratingPO: false, 
    isResetting: false,
    isInitialPopulation: false
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keyboard navigation handler - temporarily disabled to fix initialization order
  // Will be re-added after all functions are defined
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<POFormData>({
    resolver: zodResolver(poFormSchema),
    defaultValues: {
      company: "JIVO MART",
      status: "OPEN",
      po_date: new Date().toISOString().split('T')[0],
    },
    mode: "onChange"
  });

  // Watch form values (must be after form is created)
  const selectedPlatformId = form.watch("platform");

  // Fetch platforms
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  // Fetch distributors
  // Note: distributors now handled by allDistributors query below

  // Dynamic dropdown queries (using original tables)
  const { data: states = [], isLoading: statesLoading, error: statesError, isSuccess: statesSuccess } = useQuery<{ id: number; statename: string }[]>({
    queryKey: ["/api/states"],
    staleTime: 0,
    refetchOnMount: true
  });

  // Manual refetch function for testing (if needed)

  // Debug logging
  console.log("States React Query status:", {
    data: states,
    length: states.length,
    isLoading: statesLoading,
    error: statesError,
    isSuccess: statesSuccess
  });

  // Alert for debugging
  if (statesSuccess && states.length > 0) {
    console.log("✅ States loaded successfully:", states.map(s => s.statename).join(', '));
  } else if (statesLoading) {
    console.log("⏳ Loading states...");
  } else if (statesError) {
    console.log("❌ Error loading states:", statesError);
  } else {
    console.log("❓ States array is empty but no error or loading state");
  }

  const selectedStateId = useMemo(() => {
    const selectedStateName = form.watch("state");
    return states.find(state => state.statename === selectedStateName)?.id;
  }, [states, form.watch("state")]);

  const { data: districts = [] } = useQuery<{ id: number; district: string; state_id: number }[]>({
    queryKey: [`/api/districts/${selectedStateId}`],
    enabled: !!selectedStateId
  });

  const { data: allDistributors = [] } = useQuery<{ id: number; distributor_name: string }[]>({
    queryKey: ["/api/distributors"]
  });

  const { data: poStatuses = [] } = useQuery<Statuses[]>({
    queryKey: ["/api/statuses"]
  });

  const { data: itemStatuses = [] } = useQuery<StatusItem[]>({
    queryKey: ["/api/status-items"]
  });

  // Fetch PO data for edit mode
  const { data: editPO, isLoading: editQueryLoading, error: editQueryError } = useQuery<any>({
    queryKey: [`/api/pos/${editPoId}`],
    enabled: editMode && !!editPoId,
    retry: 1,
    retryDelay: 1000
  });

  // Populate form with edit data - memoized to prevent unnecessary re-renders
  const populatedData = useMemo(() => {
    if (!editMode || !editPO) return null;
    
    console.log("📝 EditPO data received:", editPO);
    console.log("🏙️ City value from API:", editPO.city);
    console.log("🗺️ State value from API:", editPO.state);
    
    return {
      formData: {
        company: editPO.company || "JIVO MART",
        platform: editPO.platform?.id?.toString() || "",
        vendor_po_no: editPO.po_number || "",
        distributor: editPO.serving_distributor || "",
        area: editPO.area || "",
        region: editPO.region || "",
        // Only populate state and city if they have actual values (not null/empty)
        state: editPO.state && editPO.state.trim() !== '' ? editPO.state : "",
        city: editPO.city && editPO.city.trim() !== '' ? editPO.city : "",
        dispatch_from: editPO.dispatch_from || "",
        warehouse: editPO.ware_house || "",
        po_date: editPO.order_date ? new Date(editPO.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiry_date: editPO.expiry_date ? new Date(editPO.expiry_date).toISOString().split('T')[0] : "",
        appointment_date: editPO.appointment_date ? new Date(editPO.appointment_date).toISOString().split('T')[0] : "",
        status: editPO.status || "OPEN",
        comments: editPO.comments || ""
      },
      lineItems: editPO.orderItems && editPO.orderItems.length > 0 
        ? editPO.orderItems.map((item: any, index: number) => ({
            tempId: `existing-${index}`,
            item_name: item.item_name || "",
            platform_code: item.platform_code || item.sap_code || "",
            sap_code: item.sap_code || "",
            uom: item.uom || "PCS",
            quantity: item.quantity || 1,
            basic_amount: parseFloat(item.basic_rate || "0"),
            tax_percent: parseFloat(item.gst_rate || "0"),
            landing_amount: parseFloat(item.landing_rate || "0"),
            total_amount: parseFloat(item.landing_rate || "0") * (item.quantity || 1),
            boxes: item.boxes || null,
            unit_size_ltrs: item.unit_size_ltrs || null,
            loose_qty: item.loose_qty || null,
            total_ltrs: item.total_ltrs || null,
            // Invoice fields for editing
            invoice_date: item.invoice_date || "",
            invoice_litre: parseFloat(item.invoice_litre || "0"),
            invoice_amount: parseFloat(item.invoice_amount || "0"),
            invoice_qty: parseFloat(item.invoice_qty || "0"),
            // Dispatch and delivery fields for editing
            dispatched_date: item.dispatch_date || "",
            delivery_date: item.delivery_date || "",
            hsn_code: item.hsn_code || "",
            status: item.status || "PENDING",
            isValid: true,
            errors: []
          }))
        : []
    };
  }, [editMode, editPO]);

  // Apply the populated data only once when it changes
  useEffect(() => {
    if (populatedData) {
      console.log("🔄 Resetting form with data:", populatedData.formData);
      console.log("🏙️ City value being set:", populatedData.formData.city);
      setFormState(prev => ({ ...prev, isInitialPopulation: true }));
      form.reset(populatedData.formData);
      if (populatedData.lineItems.length > 0) {
        setLineItems(populatedData.lineItems);
      }
      // Reset flag after a longer delay to ensure all watchers have completed
      setTimeout(() => {
        // Ensure city value is preserved after all watchers have fired
        if (populatedData.formData.city) {
          form.setValue("city", populatedData.formData.city);
        }
        setFormState(prev => ({ ...prev, isInitialPopulation: false }));
        console.log("🔍 City value after form reset:", form.getValues("city"));
      }, 500);
    }
  }, [populatedData, form]);

  // Utility functions
  const generatePONumber = useCallback(async (platformId: string) => {
    setFormState(prev => ({ ...prev, isGeneratingPO: true }));
    try {
      const platform = platforms.find(p => p.id.toString() === platformId);
      if (!platform) return;
      
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const platformCode = platform.pf_name.substring(0, 3).toUpperCase().replace(/\s/g, '');
      // Generate a more professional sequence number
      const sequenceNum = String(Math.floor(Math.random() * 9000) + 1000);
      const generatedPO = `${platformCode}-${year}${month}${day}-${sequenceNum}`;
      
      form.setValue("vendor_po_no", generatedPO, { 
        shouldValidate: true, 
        shouldDirty: true 
      });
      
      toast({
        title: "PO Number Generated",
        description: `Auto-generated PO: ${generatedPO}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate PO number. Please enter manually.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setFormState(prev => ({ ...prev, isGeneratingPO: false }));
    }
  }, [platforms, form, toast]);


  const validateLineItem = useCallback((item: LineItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!item.item_name?.trim()) {
      errors.push("Item name is required");
    }
    
    if (!item.quantity || item.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    
    if (!item.basic_amount || item.basic_amount <= 0) {
      errors.push("Basic amount must be greater than 0");
    }
    
    if (item.tax_percent < 0 || item.tax_percent > 100) {
      errors.push("Tax percent must be between 0 and 100");
    }
    
    // Note: Status-based validation is only enforced during form submission to avoid
    // runtime errors when user is in the middle of changing status and filling fields
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [editMode]);


  // All items now come from HANA SQL Server via stored procedure


  // Form reset functionality
  const handleFormReset = useCallback((skipConfirmation = false) => {
    if (!skipConfirmation && (form.formState.isDirty || lineItems.length > 0)) {
      setShowResetConfirmDialog(true);
      return;
    }
    
    setFormState(prev => ({ ...prev, isResetting: true }));
    
    // Reset form with animation
    setTimeout(() => {
      form.reset({
        company: selectedCompany,
        status: "OPEN",
        po_date: new Date().toISOString().split('T')[0],
      });
      setLineItems([]);
      setAttachedFile(null);
      setPreviousPlatformId("");
      setFormProgress(0);
      
      toast({
        title: "Form Reset",
        description: "All fields have been cleared and reset to defaults",
        duration: 2000,
      });
      
      setFormState(prev => ({ ...prev, isResetting: false }));
      setShowResetConfirmDialog(false);
    }, 300);
  }, [form, selectedCompany, lineItems.length, toast]);

  // Progress calculation effect - temporarily disabled to isolate runtime error
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     try {
  //       calculateFormProgress();
  //     } catch (error) {
  //       console.error("Error in progress calculation:", error);
  //     }
  //   }, 100); // Small delay to debounce rapid changes

  //   return () => clearTimeout(timeoutId);
  // }, [form.watch(), lineItems, calculateFormProgress]);

  // Auto-select distributor and clear items when platform changes
  useEffect(() => {
    // Clear all line items only when platform actually changes (not on initial load or same platform)
    if (selectedPlatformId && previousPlatformId && selectedPlatformId !== previousPlatformId && lineItems.length > 0) {
      setLineItems([]);
      toast({
        title: "Items Cleared",
        description: (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-1 text-yellow-600" />
            All items removed due to platform change
          </div>
        ),
        duration: 3000,
      });
    }
    
    // Update previous platform ID
    if (selectedPlatformId) {
      setPreviousPlatformId(selectedPlatformId);
    }
    
    // When Amazon (ID: 6) is selected, automatically select RK WORLD
    if (selectedPlatformId === "6" || String(selectedPlatformId) === "6") {
      const currentDistributor = form.getValues("distributor");
      // Only set if not already set to avoid infinite loops and unnecessary toasts
      if (currentDistributor !== "RK WORLD") {
        form.setValue("distributor", "RK WORLD", { shouldValidate: true, shouldDirty: true });
        toast({
          title: "Distributor Auto-Selected",
          description: (
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-1 text-blue-600" />
              RK WORLD selected for Amazon orders
            </div>
          ),
          duration: 3000,
        });
      }
    }
  }, [selectedPlatformId, form, toast, lineItems.length, previousPlatformId]);

  // Handle item selection from HANA SQL Server stored procedure
  const handleItemSelect = (tempId: string, itemName: string, hanaItem?: any) => {
    const updates: Partial<LineItem> = { item_name: itemName };
    
    if (hanaItem) {
      // Auto-populate from HANA stored procedure data
      updates.platform_code = hanaItem.ItemCode || "";
      updates.sap_code = hanaItem.ItemCode || "";
      updates.uom = hanaItem.InvntryUom || hanaItem.UOM || hanaItem.UnitOfMeasure || "PCS";
      updates.unit_size_ltrs = parseFloat(hanaItem.SalPackUn?.toString() || hanaItem.UnitSize?.toString() || "1");
      updates.tax_percent = parseFloat(hanaItem.U_Tax_Rate?.toString() || hanaItem.TaxRate?.toString() || "0");
      updates.boxes = hanaItem.CasePack || 1;
      
      // For basic amount, we don't have this in the stored procedure response
      // so we'll keep it as 0 for now and let user enter it manually
      updates.basic_amount = hanaItem.BasicRate || 0;
      
      // Calculate derived values based on HANA data
      if (updates.basic_amount && updates.tax_percent) {
        const basicAmount = updates.basic_amount;
        const taxPercent = updates.tax_percent;
        const taxAmount = basicAmount * (taxPercent / 100);
        updates.landing_amount = basicAmount + taxAmount; // Per unit landing amount
        // Total amount will be calculated in updateLineItem when quantity is known
      }
      
      // Calculate total litres if we have unit size
      if (updates.unit_size_ltrs && updates.boxes) {
        updates.total_ltrs = updates.unit_size_ltrs * updates.boxes;
      }
    }
    
    updateLineItem(tempId, updates);
  };

  const createPOMutation = useMutation({
    mutationFn: async (data: any) => {
      // Prevent double submissions
      const now = Date.now();
      if (formState.lastSubmissionTime && (now - formState.lastSubmissionTime) < 2000) {
        throw new Error("Please wait before submitting again");
      }
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: true, 
        lastSubmissionTime: now 
      }));
      
      try {
        if (editMode && editPoId) {
          // Update existing PO
          const response = await apiRequest('PUT', `/api/pos/${editPoId}`, data);
          return response;
        } else {
          // Create new PO
          const response = await apiRequest('POST', '/api/pos', data);
          return response;
        }
      } catch (error) {
        setFormState(prev => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    },
    onSuccess: () => {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      
      toast({
        title: editMode ? "Purchase Order Updated Successfully!" : "Purchase Order Created Successfully!",
        description: (
          <div className="space-y-1">
            <div className="flex items-center text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              PO has been {editMode ? "updated" : "saved"} to the system
            </div>
            <div className="text-sm text-gray-600">
              {lineItems.length} items • Total: ₹{orderSummary.grandTotal}
            </div>
          </div>
        ),
        duration: 5000,
      });
      
      // Invalidate queries to refresh the PO list
      // Use Promise.all to ensure all invalidations complete before navigation
      const invalidationPromises = [
        queryClient.invalidateQueries({ queryKey: ["/api/pos"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/blinkit-pos"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/zepto-pos"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/city-mall-pos"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/flipkart-grocery-pos"] })
      ];
      
      // In edit mode, also invalidate the specific PO query
      if (editMode && editPoId) {
        invalidationPromises.push(
          queryClient.invalidateQueries({ queryKey: [`/api/pos/${editPoId}`] })
        );
      }
      
      Promise.all(invalidationPromises).then(() => {
        // In create mode, reset form. In edit mode, just navigate away
        if (!editMode) {
          handleFormReset(true);
        }
        
        // Call the onSuccess callback if provided to navigate back to list
        // Increased delay to ensure data is refreshed
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }
      });
    },
    onError: (error: any) => {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create purchase order";
      
      toast({
        title: editMode ? "Failed to Update Purchase Order" : "Failed to Create Purchase Order",
        description: (
          <div className="space-y-2">
            <div className="flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-1" />
              {errorMessage}
            </div>
            <div className="text-sm text-gray-600">
              Please check your connection and try again. If the problem persists, contact support.
            </div>
          </div>
        ),
        variant: "destructive",
        duration: 6000,
      });
    },
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && (error?.code === 'NETWORK_ERROR' || error?.status >= 500)) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  // Region options (keeping static for now, can be made dynamic later)
  const regionOptions = ["NORTH", "SOUTH", "WEST", "EAST", "CENTRAL"];

  // Watch form values for cascading updates
  const selectedState = form.watch("state");  

  // Cascading location logic - clear dependent fields when parent changes (but not during initial population)
  useEffect(() => {
    if (selectedState && !formState.isInitialPopulation && !editMode) {
      // Clear city when state changes (district-based cities) - but not in edit mode
      form.setValue("city", "");
      // Note: area is now a text field, no need to clear it
    }
  }, [selectedState, form, formState.isInitialPopulation, editMode]);

  // Get available options based on dynamic data
  const getAvailableStates = () => {
    const stateOptions = states.map(state => state.statename);
    console.log("getAvailableStates called, returning:", stateOptions);
    return stateOptions;
  };
  const getAvailableCities = () => districts.map(district => district.district);
  const getAvailableDistributors = () => allDistributors.map(distributor => distributor.distributor_name);

  const dispatchOptions = ["MAYAPURI", "BHAKHAPUR", "DASNA", "GHAZIABAD"];
  const warehouseOptions = ["WAREHOUSE 1", "WAREHOUSE 2", "WAREHOUSE 3", "CENTRAL WAREHOUSE"];

  const addLineItem = useCallback(() => {
    if (!selectedPlatformId) {
      toast({
        title: "Platform Required",
        description: "Please select a platform before adding items",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const newItem: LineItem = {
      tempId: `item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      item_name: "",
      platform_code: "",
      sap_code: "",
      uom: "PCS",
      quantity: 1,
      boxes: 0,
      unit_size_ltrs: 0,
      loose_qty: 0,
      basic_amount: 0,
      tax_percent: 0,
      landing_amount: 0,
      total_amount: 0,
      total_ltrs: 0,
      status: "PENDING",
      isValid: false,
      errors: ["Item name is required", "Basic amount must be greater than 0"]
    };
    
    setLineItems(prev => {
      const updated = [...prev, newItem];
      toast({
        title: "Item Added",
        description: (
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-1 text-green-600" />
            Item #{updated.length} added to purchase order
          </div>
        ),
        duration: 2000,
      });
      return updated;
    });
  }, [selectedPlatformId, toast]);

  const removeLineItem = useCallback((tempId: string) => {
    setLineItems(prev => {
      const itemIndex = prev.findIndex(item => item.tempId === tempId);
      if (itemIndex === -1) return prev;
      
      const updated = prev.filter(item => item.tempId !== tempId);
      
      toast({
        title: "Item Removed",
        description: (
          <div className="flex items-center">
            <Trash2 className="h-4 w-4 mr-1 text-red-600" />
            Item #{itemIndex + 1} removed from order
          </div>
        ),
        duration: 2000,
      });
      
      return updated;
    });
  }, [toast]);

  const updateLineItem = useCallback((tempId: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const updated = { ...item, ...updates };
        
        // Only recalculate amounts for non-status updates
        if (('quantity' in updates || 'basic_amount' in updates || 'tax_percent' in updates) && !('status' in updates)) {
          const basicAmount = Math.max(0, updated.basic_amount || 0);
          const quantity = Math.max(0, updated.quantity || 0);
          const taxPercent = Math.max(0, Math.min(100, updated.tax_percent || 0));
          
          const taxAmountPerUnit = basicAmount * (taxPercent / 100);
          updated.landing_amount = basicAmount + taxAmountPerUnit;
          updated.total_amount = updated.landing_amount * quantity;
        }
        
        // Calculate total litres if boxes and unit_size_ltrs are provided
        if (('boxes' in updates || 'unit_size_ltrs' in updates) && !('status' in updates)) {
          const boxes = Math.max(0, updated.boxes || 0);
          const unitSizeLtrs = Math.max(0, updated.unit_size_ltrs || 0);
          updated.total_ltrs = boxes * unitSizeLtrs;
        }
        
        updated.isValid = true;
        updated.errors = [];
        
        return updated;
      }
      return item;
    }));
  }, []);

  const orderSummary = useMemo(() => {
    // Calculate total basic amount (basic amount × quantity for each item)
    const totalBasic = lineItems.reduce((sum, item) => {
      const basicAmount = item.basic_amount || 0;
      const quantity = item.quantity || 0;
      return sum + (basicAmount * quantity);
    }, 0);
    
    // Calculate total tax amount (tax amount × quantity for each item)
    const totalTax = lineItems.reduce((sum, item) => {
      const basicAmount = item.basic_amount || 0;
      const quantity = item.quantity || 0;
      const taxPercent = item.tax_percent || 0;
      const taxAmountPerUnit = basicAmount * (taxPercent / 100);
      return sum + (taxAmountPerUnit * quantity);
    }, 0);
    
    const grandTotal = totalBasic + totalTax;
    
    return {
      totalBasic: totalBasic.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  }, [lineItems]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      toast({
        title: "File attached",
        description: `${file.name} has been attached to the PO`
      });
    }
  };

  const validateFormSubmission = useCallback((_data: POFormData) => {
    const errors: string[] = [];
    
    if (lineItems.length === 0) {
      errors.push("Please add at least one item to the purchase order");
    }

    const validItems = lineItems.filter(item => {
      const validation = validateLineItem(item);
      return validation.isValid;
    });

    if (validItems.length === 0 && lineItems.length > 0) {
      errors.push("Please complete at least one valid order item");
    }
    
    const invalidItems = lineItems.filter(item => !validateLineItem(item).isValid);
    if (invalidItems.length > 0) {
      errors.push(`${invalidItems.length} item${invalidItems.length === 1 ? '' : 's'} ${invalidItems.length === 1 ? 'has' : 'have'} validation errors`);
    }

    // Status-based validation for edit mode (only enforced during submission)
    if (editMode) {
      lineItems.forEach((item, index) => {
        if (item.status) {
          const status = item.status.toUpperCase();
          const itemLabel = `Item ${index + 1} (${item.item_name})`;
          
          // INVOICED status: requires all 4 invoice fields
          if (status === "INVOICED") {
            if (!item.invoice_date) {
              errors.push(`${itemLabel}: Invoice date is required when status is INVOICED`);
            }
            if (!item.invoice_qty || item.invoice_qty <= 0) {
              errors.push(`${itemLabel}: Invoice quantity is required when status is INVOICED`);
            }
            if (!item.invoice_litre || item.invoice_litre <= 0) {
              errors.push(`${itemLabel}: Invoice litre is required when status is INVOICED`);
            }
            if (!item.invoice_amount || item.invoice_amount <= 0) {
              errors.push(`${itemLabel}: Invoice amount is required when status is INVOICED`);
            }
          }
          
          // DISPATCHED status: requires all 4 invoice fields + dispatch date
          else if (status === "DISPATCHED") {
            if (!item.invoice_date) {
              errors.push(`${itemLabel}: Invoice date is required when status is DISPATCHED`);
            }
            if (!item.invoice_qty || item.invoice_qty <= 0) {
              errors.push(`${itemLabel}: Invoice quantity is required when status is DISPATCHED`);
            }
            if (!item.invoice_litre || item.invoice_litre <= 0) {
              errors.push(`${itemLabel}: Invoice litre is required when status is DISPATCHED`);
            }
            if (!item.invoice_amount || item.invoice_amount <= 0) {
              errors.push(`${itemLabel}: Invoice amount is required when status is DISPATCHED`);
            }
            if (!item.dispatched_date) {
              errors.push(`${itemLabel}: Dispatch date is required when status is DISPATCHED`);
            }
          }
          
          // DELIVERED status: requires all 4 invoice fields + dispatch date + delivered date
          else if (status === "DELIVERED") {
            if (!item.invoice_date) {
              errors.push(`${itemLabel}: Invoice date is required when status is DELIVERED`);
            }
            if (!item.invoice_qty || item.invoice_qty <= 0) {
              errors.push(`${itemLabel}: Invoice quantity is required when status is DELIVERED`);
            }
            if (!item.invoice_litre || item.invoice_litre <= 0) {
              errors.push(`${itemLabel}: Invoice litre is required when status is DELIVERED`);
            }
            if (!item.invoice_amount || item.invoice_amount <= 0) {
              errors.push(`${itemLabel}: Invoice amount is required when status is DELIVERED`);
            }
            if (!item.dispatched_date) {
              errors.push(`${itemLabel}: Dispatch date is required when status is DELIVERED`);
            }
            if (!item.delivery_date) {
              errors.push(`${itemLabel}: Delivery date is required when status is DELIVERED`);
            }
          }
        }
      });
    }
    
    return { isValid: errors.length === 0, errors, validItems };
  }, [lineItems, validateLineItem, editMode]);

  const handleSubmissionAttempt = useCallback((data: POFormData) => {
    const validation = validateFormSubmission(data);
    
    if (!validation.isValid) {
      toast({
        title: "Form Validation Failed",
        description: (
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="flex items-center text-red-600">
                <XCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            ))}
          </div>
        ),
        variant: "destructive",
        duration: 6000,
      });
      return;
    }
    
    setShowConfirmDialog(true);
  }, [validateFormSubmission, toast]);

  const onSubmit = useCallback((data: POFormData) => {
    const validation = validateFormSubmission(data);
    
    if (!validation.isValid) {
      return;
    }

    const formData = new FormData();
    if (attachedFile) {
      formData.append('attachment', attachedFile);
    }

    // Get state_id and district_id from selected names
    const selectedStateRecord = states.find(state => state.statename === data.state);
    const selectedDistrictRecord = districts.find(district => district.district === data.city);
    
    console.log("🔍 Debug PO submission:");
    console.log("Selected state:", data.state);
    console.log("Found state record:", selectedStateRecord);
    console.log("Selected city:", data.city);
    console.log("Found district record:", selectedDistrictRecord);
    console.log("Available states:", states.length);
    console.log("Available districts:", districts.length);

    // Structure data according to new PO Master API schema
    const masterData = {
      po_number: data.vendor_po_no,
      company: selectedCompany,
      platform_id: parseInt(data.platform),
      serving_distributor: data.distributor === "none" ? undefined : data.distributor,
      po_date: data.po_date,
      expiry_date: data.expiry_date || undefined,
      appointment_date: data.appointment_date || undefined,
      region: data.region,
      state: data.state,
      city: data.city,
      area: data.area,
      state_id: selectedStateRecord?.id || null,
      district_id: selectedDistrictRecord?.id || null,
      dispatch_from: data.dispatch_from,
      warehouse: data.warehouse,
      status: data.status || "OPEN",
      comments: data.comments,
      attachment: attachedFile?.name
    };

    console.log("📤 Sending masterData:", masterData);

    const linesData = validation.validItems.map(item => ({
      item_name: item.item_name,
      platform_code: item.platform_code || null,
      sap_code: item.sap_code || null,
      uom: item.uom || "PCS",
      quantity: item.quantity,
      boxes: item.boxes || null,
      unit_size_ltrs: item.unit_size_ltrs || null,
      loose_qty: item.loose_qty || null,
      basic_amount: item.basic_amount.toString(),
      tax_percent: item.tax_percent.toString(),
      landing_amount: (item.landing_amount || 0).toString(),
      total_amount: item.total_amount.toString(),
      total_ltrs: item.total_ltrs?.toString() || null,
      // Invoice fields - only included when status is INVOICED
      invoice_date: item.invoice_date || null,
      invoice_litre: item.invoice_litre?.toString() || null,
      invoice_amount: item.invoice_amount?.toString() || null,
      invoice_qty: item.invoice_qty?.toString() || null,
      // Dispatch and delivery fields
      dispatched_date: item.dispatched_date || null,
      delivery_date: item.delivery_date || null,
      hsn_code: null,
      status: item.status || "PENDING"
    }));

    setShowConfirmDialog(false);
    createPOMutation.mutate({
      master: masterData,
      lines: linesData
    });
  }, [validateFormSubmission, attachedFile, selectedCompany, createPOMutation]);

  // Keyboard shortcuts handler (added after all dependencies are defined)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !formState.isSubmitting) {
        e.preventDefault();
        if (selectedPlatformId && lineItems.length > 0) {
          onSubmit(form.getValues());
        }
      }
      
      // Escape to close dialogs
      if (e.key === 'Escape') {
        setShowConfirmDialog(false);
        setShowResetConfirmDialog(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formState.isSubmitting, selectedPlatformId, lineItems.length, onSubmit, form, setShowConfirmDialog, setShowResetConfirmDialog]);

  // Show skeleton loading while data is being fetched in edit mode
  if (editMode && editQueryLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <Card className="shadow-lg border border-blue-100">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            </CardHeader>
          </Card>

          {/* Company Selection Skeleton */}
          <Card className="shadow-lg border border-blue-100">
            <CardHeader className="pb-4">
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields Skeleton */}
          <Card className="shadow-lg border border-blue-100">
            <CardHeader className="pb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Line Items Skeleton */}
          <Card className="shadow-lg border border-blue-100">
            <CardHeader className="pb-4">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-gray-600 font-medium">Loading purchase order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if failed to load PO data
  if (editMode && editQueryError) {
    console.log("❌ Edit query error:", editQueryError, "for PO ID:", editPoId);
    
    // If this is likely from a recent upload (PO was created but can't be found for editing),
    // redirect back to list with a success message instead of showing error
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (onSuccess) {
          console.log("🔄 Auto-redirecting to list due to edit load failure");
          onSuccess();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }, [onSuccess]);
    
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <Card className="shadow-lg border border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center py-8">
              <div className="bg-red-100 p-4 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Failed to Load Purchase Order
                </h3>
                <p className="text-gray-600 mb-4">
                  Could not find the purchase order with ID: {editPoId}
                </p>
                <p className="text-sm text-gray-500">
                  The purchase order may still be processing or there may be a temporary issue. Please try refreshing the page or go back to the list.
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={() => window.location.href = "/platform-po"}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View All POs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
      {/* Enhanced Header with Progress */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 transition-all duration-300 hover:shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                E-commerce Purchase Orders
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage platform purchase orders with ease
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
            {/* Form Progress */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Form Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={formProgress} className="w-20 h-2" />
                <span className="text-sm font-semibold text-blue-600 min-w-[3rem]">
                  {Math.round(formProgress)}%
                </span>
              </div>
            </div>
            {/* Company Badge */}
            <div className="flex flex-col items-center space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Company</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-semibold px-3 py-1">
                {selectedCompany}
              </Badge>
            </div>
            {/* Enhanced Status Indicators */}
            <div className="flex items-center space-x-3">
              {formState.isSubmitting && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 animate-pulse">
                    {editMode ? "Updating PO..." : "Creating PO..."}
                  </span>
                </div>
              )}
              {formState.isResetting && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
                  <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm font-medium text-purple-700 animate-pulse">
                    Resetting form...
                  </span>
                </div>
              )}
              {formState.isGeneratingPO && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                  <span className="text-sm font-medium text-green-700 animate-pulse">
                    Generating PO...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Company Selection */}
      <Card className="shadow-lg border-blue-100 transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg border-b">
          <div className="flex items-center space-x-3">
            <Building2 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">
              Company Selection
            </CardTitle>
            {!formState.isResetting && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormReset()}
                className="ml-auto text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                title="Reset form"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant={selectedCompany === "JIVO MART" ? "default" : "outline"}
              onClick={() => {
                setSelectedCompany("JIVO MART");
                form.setValue("company", "JIVO MART");
              }}
              disabled={formState.isSubmitting || formState.isResetting}
              className={cn(
                "h-12 font-semibold transition-all duration-300 transform hover:scale-105",
                selectedCompany === "JIVO MART" 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" 
                  : "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
              )}
            >
              <Package className="h-4 w-4 mr-2" />
              JIVO MART
            </Button>
            <Button
              type="button"
              variant={selectedCompany === "JIVO WELLNESS" ? "default" : "outline"}
              onClick={() => {
                setSelectedCompany("JIVO WELLNESS");
                form.setValue("company", "JIVO WELLNESS");
              }}
              disabled={formState.isSubmitting || formState.isResetting}
              className={cn(
                "h-12 font-semibold transition-all duration-300 transform hover:scale-105",
                selectedCompany === "JIVO WELLNESS" 
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg" 
                  : "hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
              )}
            >
              <Package className="h-4 w-4 mr-2" />
              JIVO WELLNESS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Purchase Order Management */}
      <Card className="shadow-xl border-blue-100 transition-all duration-300 hover:shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-b border-blue-200">
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-gray-800">Purchase Order Management</span>
              {lineItems.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {lineItems.length} item{lineItems.length === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedPlatformId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generatePONumber(selectedPlatformId)}
                  disabled={formState.isGeneratingPO || formState.isSubmitting}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 transition-all duration-200"
                >
                  {formState.isGeneratingPO ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Zap className="h-4 w-4 mr-1" />
                  )}
                  Auto-generate PO
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          {/* Keyboard Shortcuts Helper */}
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Keyboard Shortcuts</span>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs shadow-sm">Ctrl+Enter</kbd>
                  <span className="ml-1">Submit</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs shadow-sm">Ctrl+G</kbd>
                  <span className="ml-1">Generate PO</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs shadow-sm">Ctrl+I</kbd>
                  <span className="ml-1">Add Item</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-white border rounded text-xs shadow-sm">Ctrl+R</kbd>
                  <span className="ml-1">Reset</span>
                </div>
              </div>
            </div>
          </div>
          
          <form 
            ref={formRef} 
            onSubmit={form.handleSubmit(handleSubmissionAttempt)} 
            className="space-y-8"
            role="form"
            aria-label="Purchase Order Form"
            noValidate
          >
            {/* Enhanced Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Row 1 */}
              <div className="space-y-3 relative">
                <Label htmlFor="platform" className="text-sm font-semibold text-gray-800 flex items-center">
                  <Package className="h-4 w-4 mr-1 text-blue-600" />
                  PLATFORM *
                </Label>
                <Controller
                  name="platform"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={formState.isSubmitting || formState.isResetting}
                      >
                        <SelectTrigger className={cn(
                          "h-12 bg-white border-2 transition-all duration-200 text-base",
                          fieldState.error 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200" 
                            : "border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200",
                          field.value && !fieldState.error && "border-green-300 bg-green-50/30"
                        )}>
                          <SelectValue placeholder="Select your e-commerce platform" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {platforms.map((platform) => (
                            <SelectItem 
                              key={platform.id} 
                              value={platform.id.toString()}
                              className="py-3 px-4 hover:bg-blue-50"
                            >
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">{platform.pf_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <p 
                          id="platform-error" 
                          className="mt-1 text-sm text-red-600 flex items-center" 
                          role="alert"
                          aria-live="polite"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-3 relative">
                <Label htmlFor="vendor_po_no" className="text-sm font-semibold text-gray-800 flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-blue-600" />
                  VENDOR PO NUMBER *
                </Label>
                <Controller
                  name="vendor_po_no"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        id="vendor_po_no"
                        placeholder={selectedPlatformId ? "e.g., BLI-20250821-1234 or use auto-generate" : "Select platform first"}
                        className={cn(
                          "h-12 transition-all duration-200 text-base pl-4 pr-12 border-2",
                          !selectedPlatformId 
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500" 
                            : fieldState.error 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30" 
                            : field.value && !fieldState.error
                            ? "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50/30"
                            : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-400"
                        )}
                        disabled={!selectedPlatformId || formState.isSubmitting || formState.isResetting}
                        aria-label="Enter vendor purchase order number"
                        aria-describedby={fieldState.error ? "po-number-error" : "po-number-hint"}
                      />
                      {field.value && !fieldState.error && (
                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                      )}
                      {fieldState.error && (
                        <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-600" />
                      )}
                      <p id="po-number-hint" className="mt-1 text-xs text-gray-500">
                        {selectedPlatformId ? 'Use the auto-generate button or enter manually' : 'Select a platform first'}
                      </p>
                      {fieldState.error && (
                        <p 
                          id="po-number-error" 
                          className="mt-1 text-sm text-red-600 flex items-center" 
                          role="alert"
                          aria-live="polite"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distributor" className="text-xs font-medium text-gray-700">
                  DISTRIBUTOR
                </Label>
                <Select
                  value={form.watch("distributor")}
                  onValueChange={(value) => form.setValue("distributor", value)}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={selectedPlatformId ? "SELECT DISTRIBUTOR" : "SELECT PLATFORM FIRST"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Distributor --</SelectItem>
                    {getAvailableDistributors().map((distributorName: string) => (
                      <SelectItem key={distributorName} value={distributorName}>
                        {distributorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 */}
              <div className="space-y-2">
                <Label htmlFor="area" className="text-xs font-medium text-gray-700">
                  AREA
                </Label>
                <Input
                  id="area"
                  {...form.register("area")}
                  placeholder={!selectedPlatformId ? "SELECT PLATFORM FIRST" : "Enter area name"}
                  className="h-10"
                  disabled={!selectedPlatformId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-xs font-medium text-gray-700">
                  REGION *
                </Label>
                <Select
                  value={form.watch("region")}
                  onValueChange={(value) => form.setValue("region", value)}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={selectedPlatformId ? "SELECT REGION" : "SELECT PLATFORM FIRST"} />
                  </SelectTrigger>
                  <SelectContent>
                    {regionOptions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-xs font-medium text-gray-700">
                  STATE *
                </Label>
                <Select
                  value={form.watch("state")}
                  onValueChange={(value) => form.setValue("state", value)}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={!selectedPlatformId ? "SELECT PLATFORM FIRST" : "SELECT STATE"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStates().map((state: string) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3 */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-medium text-gray-700">
                  CITY *
                </Label>
                <Select
                  value={form.watch("city")}
                  onValueChange={(value) => form.setValue("city", value)}
                  disabled={!selectedState || !selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={!selectedPlatformId ? "SELECT PLATFORM FIRST" : selectedState ? "SELECT CITY" : "SELECT STATE FIRST"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Show current city value even if districts haven't loaded yet */}
                    {form.watch("city") && !getAvailableCities().includes(form.watch("city")) && (
                      <SelectItem key={form.watch("city")} value={form.watch("city")}>
                        {form.watch("city")}
                      </SelectItem>
                    )}
                    {getAvailableCities().map((city: string) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispatch_from" className="text-xs font-medium text-gray-700">
                  DISPATCH FROM
                </Label>
                <Select
                  value={form.watch("dispatch_from")}
                  onValueChange={(value) => form.setValue("dispatch_from", value)}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={selectedPlatformId ? "SELECT DISPATCH LOCATION" : "SELECT PLATFORM FIRST"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse" className="text-xs font-medium text-gray-700">
                  WAREHOUSE
                </Label>
                <Select
                  value={form.watch("warehouse")}
                  onValueChange={(value) => form.setValue("warehouse", value)}
                  disabled={!selectedPlatformId}
                >
                  <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                    <SelectValue placeholder={selectedPlatformId ? "SELECT WAREHOUSE" : "SELECT PLATFORM FIRST"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseOptions.map((warehouse) => (
                      <SelectItem key={warehouse} value={warehouse}>
                        {warehouse}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 4 */}
              <div className="space-y-2">
                <Label htmlFor="po_date" className="text-xs font-medium text-gray-700">
                  PO DATE *
                </Label>
                <Input
                  id="po_date"
                  type="date"
                  {...form.register("po_date")}
                  className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100 cursor-not-allowed")}
                  disabled={!selectedPlatformId}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date" className="text-xs font-medium text-gray-700">
                  EXPIRY DATE *
                </Label>
                <Controller
                  name="expiry_date"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        id="expiry_date"
                        type="date"
                        placeholder="DD/MM/YYYY"
                        {...field}
                        className={cn(
                          "h-10",
                          !selectedPlatformId 
                            ? "bg-gray-100 cursor-not-allowed text-gray-500" 
                            : fieldState.error 
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30" 
                            : field.value && !fieldState.error
                            ? "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50/30"
                            : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-400"
                        )}
                        disabled={!selectedPlatformId}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-sm text-red-600 flex items-center" role="alert" aria-live="polite">
                          <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_date" className="text-xs font-medium text-gray-700">
                  APPOINTMENT DATE
                </Label>
                <Input
                  id="appointment_date"
                  type="date"
                  placeholder="DD/MM/YYYY"
                  {...form.register("appointment_date")}
                  className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100 cursor-not-allowed")}
                  disabled={!selectedPlatformId}
                />
              </div>

              {/* Status - Show as read-only in edit mode */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs font-medium text-gray-700">
                  STATUS
                </Label>
                {editMode ? (
                  <Input
                    value={form.watch("status")}
                    readOnly
                    className="h-10 bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                    title="Status cannot be changed manually - it updates automatically based on item status"
                  />
                ) : (
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value)}
                    disabled={!selectedPlatformId}
                  >
                    <SelectTrigger className={cn("h-10", selectedPlatformId ? "bg-white" : "bg-gray-100")}>
                      <SelectValue placeholder={selectedPlatformId ? "SELECT STATUS" : "SELECT PLATFORM FIRST"} />
                    </SelectTrigger>
                    <SelectContent>
                      {poStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.status_name}>
                          {status.status_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Enhanced Purchase Order Items Section */}
            <div className="border-2 border-blue-100 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Purchase Order Items
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      {lineItems.length > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {lineItems.length} item{lineItems.length === 1 ? '' : 's'}
                        </Badge>
                      )}
                      {lineItems.some(item => item.isValid === false) && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          {lineItems.filter(item => item.isValid === false).length} invalid
                        </Badge>
                      )}
                      {lineItems.length > 0 && (
                        <span className="text-sm text-gray-600">
                          Total: ₹{orderSummary.grandTotal}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addLineItem}
                  variant={selectedPlatformId ? "default" : "outline"}
                  size="lg"
                  className={cn(
                    "transition-all duration-300 transform hover:scale-105 font-semibold",
                    selectedPlatformId 
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white" 
                      : "text-gray-400 border-gray-300 opacity-50 cursor-not-allowed bg-gray-100"
                  )}
                  disabled={!selectedPlatformId || formState.isSubmitting || formState.isResetting}
                  title={!selectedPlatformId ? "Please select a platform first" : "Add new item to purchase order"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    No Items Added Yet
                  </h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {selectedPlatformId 
                      ? "Click \"Add New Item\" to start building your purchase order with items from the selected platform."
                      : "Please select a platform first, then add items to create your purchase order."
                    }
                  </p>
                  {selectedPlatformId && (
                    <Button
                      type="button"
                      onClick={addLineItem}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {lineItems.map((item, index) => {
                    const isValid = item.isValid !== false;
                    const itemErrors = item.errors || [];
                    
                    return (
                      <div 
                        key={item.tempId} 
                        className={cn(
                          "relative bg-white rounded-2xl border-2 shadow-sm p-8 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-top-2",
                          isValid 
                            ? "border-green-300 hover:border-green-400 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20" 
                            : "border-red-300 hover:border-red-400 bg-gradient-to-br from-red-50/30 via-white to-pink-50/20"
                        )}
                      >
                        {/* Enhanced Item Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200/60 space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "flex items-center space-x-3 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm border",
                              isValid 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200" 
                                : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200"
                            )}>
                              {isValid ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span>Item #{index + 1}</span>
                            </div>
                            {item.item_name && (
                              <Badge variant="outline" className="max-w-xs truncate bg-blue-50/70 text-blue-800 border-blue-200 font-semibold">
                                {item.item_name}
                              </Badge>
                            )}
                            {!isValid && itemErrors.length > 0 && (
                              <Badge variant="destructive" className="font-semibold shadow-sm">
                                {itemErrors.length} error{itemErrors.length === 1 ? '' : 's'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              onClick={() => removeLineItem(item.tempId)}
                              variant="destructive"
                              size="sm"
                              disabled={formState.isSubmitting || formState.isResetting}
                              className="bg-red-500 hover:bg-red-600 transition-all duration-300 transform hover:scale-105 font-semibold"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        
                        {/* Error Messages */}
                        {!isValid && itemErrors.length > 0 && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-2">Please fix these issues:</p>
                            <ul className="space-y-1">
                              {itemErrors.map((error, errorIndex) => (
                                <li key={errorIndex} className="flex items-center text-sm text-red-700">
                                  <AlertCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Enhanced Item Name - Full Width */}
                        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl border-l-4 border-blue-500">
                          <Label className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center mb-4">
                            <Search className="h-4 w-4 mr-2 text-blue-600" />
                            ITEM NAME *
                          </Label>
                          <SearchableItemInput
                            value={item.item_name}
                            onChange={(itemName, hanaItem) => handleItemSelect(item.tempId, itemName, hanaItem)}
                            placeholder="Search and select item from database..."
                            className={cn(
                              "h-14 bg-white border-2 text-base transition-all duration-300 rounded-xl shadow-sm",
                              !item.item_name 
                                ? "border-gray-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100/50 hover:border-blue-400" 
                                : "border-green-400 focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-100/50 bg-green-50/50"
                            )}
                          />
                        </div>

                      {/* 4-Column Grid - Enhanced Spacing */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                        {/* Row 1 - Auto-filled Fields */}
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            PLATFORM CODE
                          </Label>
                          <Input
                            value={item.platform_code || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-mono rounded-lg"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-gray-500" />
                            SAP CODE
                          </Label>
                          <Input
                            value={item.sap_code || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-mono rounded-lg"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            UOM
                          </Label>
                          <Input
                            value={item.uom || "PCS"}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-semibold rounded-lg text-center"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="relative space-y-3">
                          <Label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center">
                            <Calculator className="h-4 w-4 mr-1 text-blue-600" />
                            QUANTITY *
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ""}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseInt(e.target.value) || 0;
                                updateLineItem(item.tempId, { quantity: Math.max(1, value) });
                              }}
                              className={cn(
                                "h-12 bg-white border-2 transition-all duration-200 text-base pl-4 pr-12 rounded-lg shadow-sm",
                                !item.quantity || item.quantity <= 0
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30"
                                  : "border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                              )}
                              placeholder="Enter quantity"
                              disabled={formState.isSubmitting || formState.isResetting}
                              required
                            />
                            {item.quantity > 0 ? (
                              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>

                        {/* Row 2 - Measurement Fields */}
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            BOXES
                          </Label>
                          <Input
                            type="number"
                            value={item.boxes || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-semibold rounded-lg text-center"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            UNIT SIZE (LTRS)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_size_ltrs || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-semibold rounded-lg text-center"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            LOOSE QTY
                          </Label>
                          <Input
                            type="number"
                            value={item.loose_qty || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-semibold rounded-lg text-center"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="relative space-y-3">
                          <Label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1 text-blue-600" />
                            BASIC AMOUNT *
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.basic_amount || ""}
                              onChange={(e) => {
                                const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                updateLineItem(item.tempId, { basic_amount: Math.max(0.01, value) });
                              }}
                              className={cn(
                                "h-12 bg-white border-2 transition-all duration-200 text-base pl-8 pr-12 rounded-lg shadow-sm",
                                !item.basic_amount || item.basic_amount <= 0
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30"
                                  : "border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                              )}
                              placeholder="0.00"
                              disabled={formState.isSubmitting || formState.isResetting}
                              required
                            />
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                            {item.basic_amount > 0 ? (
                              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                            ITEM STATUS
                          </Label>
                          <Select
                            value={item.status || "PENDING"}
                            onValueChange={(value) => {
                              updateLineItem(item.tempId, { status: value });
                            }}
                            disabled={formState.isSubmitting || formState.isResetting}
                          >
                            <SelectTrigger className="h-12 mt-2 bg-white border-2 border-gray-300 hover:border-gray-400 focus:border-blue-500">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {(itemStatuses || []).map((status) => (
                                <SelectItem key={status.id} value={status.status_name}>
                                  {status.status_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                            TAX (%)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.tax_percent}
                            readOnly
                            className="h-12 mt-2 bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                            title="This field is auto-filled from item selection"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                            LANDING AMOUNT
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.landing_amount?.toFixed(2) || "0.00"}
                            readOnly
                            className="h-12 mt-2 bg-gray-100 border-gray-200 text-gray-600"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                            TOTAL AMOUNT
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.total_amount?.toFixed(2) || "0.00"}
                            readOnly
                            className="h-12 mt-2 bg-gray-100 border-gray-200 text-gray-600"
                          />
                        </div>
                      </div>

                      {/* Row 4 - Total Liters */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                            TOTAL LTRS
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.total_ltrs?.toFixed(2) || "0.00"}
                            readOnly
                            className="h-12 mt-2 bg-gray-100 border-gray-200 text-gray-600"
                          />
                        </div>
                      </div>

                      {/* Dynamic Fields Based on Item Status */}
                      {(() => {
                        const currentStatusInfo = (itemStatuses || []).find(s => s?.status_name === item?.status);
                        const showInvoiceFields = currentStatusInfo?.requires_invoice_fields || false;
                        const showDispatchFields = currentStatusInfo?.requires_dispatch_date || false;
                        const showDeliveryFields = currentStatusInfo?.requires_delivery_date || false;
                        
                        if (!showInvoiceFields && !showDispatchFields && !showDeliveryFields) {
                          return null;
                        }
                        
                        return (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-4 flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {showInvoiceFields && showDispatchFields && showDeliveryFields && "INVOICE & DELIVERY DETAILS"}
                            {showInvoiceFields && showDispatchFields && !showDeliveryFields && "INVOICE & DISPATCH DETAILS"}
                            {showInvoiceFields && !showDispatchFields && "INVOICE DETAILS"}
                            {showDispatchFields && !showInvoiceFields && showDeliveryFields && "DISPATCH & DELIVERY DETAILS"}
                            {showDispatchFields && !showInvoiceFields && !showDeliveryFields && "DISPATCH DETAILS"}
                            {showDeliveryFields && !showInvoiceFields && !showDispatchFields && "DELIVERY DETAILS"}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                INVOICE DATE
                              </Label>
                              <Input
                                type="date"
                                value={item.invoice_date || ""}
                                onChange={(e) => updateLineItem(item.tempId, { invoice_date: e.target.value })}
                                className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500"
                                disabled={formState.isSubmitting || formState.isResetting}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                INVOICE QTY
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.invoice_qty || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                  updateLineItem(item.tempId, { invoice_qty: Math.max(0, value) });
                                }}
                                className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500"
                                placeholder="0.00"
                                disabled={formState.isSubmitting || formState.isResetting}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                INVOICE LITRE
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.invoice_litre || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                  updateLineItem(item.tempId, { invoice_litre: Math.max(0, value) });
                                }}
                                className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500"
                                placeholder="0.00"
                                disabled={formState.isSubmitting || formState.isResetting}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                INVOICE AMOUNT
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.invoice_amount || ""}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                                    updateLineItem(item.tempId, { invoice_amount: Math.max(0, value) });
                                  }}
                                  className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500 pl-8"
                                  placeholder="0.00"
                                  disabled={formState.isSubmitting || formState.isResetting}
                                />
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                              </div>
                            </div>
                            
                            {/* Dispatch Date Field - shown when status is DISPATCHED or DELIVERED */}
                            {(showDispatchFields || showDeliveryFields) && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                  DISPATCH DATE
                                </Label>
                                <Input
                                  type="date"
                                  value={item.dispatched_date || ""}
                                  onChange={(e) => updateLineItem(item.tempId, { dispatched_date: e.target.value })}
                                  className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500"
                                  disabled={formState.isSubmitting || formState.isResetting}
                                />
                              </div>
                            )}
                            
                            {/* Delivery Date Field - shown only when status is DELIVERED */}
                            {showDeliveryFields && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                  DELIVERY DATE
                                </Label>
                                <Input
                                  type="date"
                                  value={item.delivery_date || ""}
                                  onChange={(e) => updateLineItem(item.tempId, { delivery_date: e.target.value })}
                                  className="h-12 mt-2 bg-white border-yellow-300 focus:border-yellow-500"
                                  disabled={formState.isSubmitting || formState.isResetting}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attachments & Comments */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">ATTACHMENTS & COMMENTS</h3>
                  <div className={cn("border-2 border-dashed rounded-lg p-6 text-center", selectedPlatformId ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-gray-100")}>
                    <input
                      type="file"
                      id="attachment"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                      disabled={!selectedPlatformId}
                    />
                    <label
                      htmlFor="attachment"
                      className={cn("flex flex-col items-center", selectedPlatformId ? "cursor-pointer" : "cursor-not-allowed opacity-50")}
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">{selectedPlatformId ? "Click to Attach PO Document" : "Select Platform First"}</p>
                      {attachedFile && (
                        <p className="text-xs text-green-600 mt-2">
                          Attached: {attachedFile.name}
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="comments" className="text-xs font-medium text-gray-700">
                    COMMENTS
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder={selectedPlatformId ? "ENTER ANY ADDITIONAL COMMENTS, SPECIAL INSTRUCTIONS, OR NOTES ABOUT THIS PURCHASE ORDER..." : "SELECT PLATFORM FIRST"}
                    {...form.register("comments")}
                    className={cn("h-32 mt-2 resize-none", selectedPlatformId ? "bg-white" : "bg-gray-100 cursor-not-allowed")}
                    disabled={!selectedPlatformId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 1000 characters. Comments will be saved with timestamp.
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">ORDER SUMMARY</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Total Basic Amount:</span>
                    <span className="font-semibold text-lg">₹{orderSummary.totalBasic}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Total Tax:</span>
                      <span className="font-semibold text-lg">₹{orderSummary.totalTax}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-900 font-semibold">Grand Total:</span>
                      <span className="font-bold text-xl text-blue-600">₹{orderSummary.grandTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Section */}
            <Separator className="my-8" />
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">₹{orderSummary.grandTotal}</p>
                  <p className="text-sm text-gray-600">Total Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{lineItems.length}</p>
                  <p className="text-sm text-gray-600">Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{lineItems.filter(item => item.isValid !== false).length}</p>
                  <p className="text-sm text-gray-600">Valid</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFormReset()}
                  disabled={formState.isSubmitting || formState.isResetting || (!form.formState.isDirty && lineItems.length === 0)}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
                >
                  {formState.isResetting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Reset Form
                </Button>
                
                <Button
                  type="submit"
                  size="lg"
                  className={cn(
                    "min-w-[200px] font-bold py-3 px-6 transition-all duration-300 transform text-base",
                    selectedPlatformId && !formState.isSubmitting && lineItems.length > 0
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:scale-105 shadow-lg hover:shadow-xl" 
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                  disabled={formState.isSubmitting || !selectedPlatformId || lineItems.length === 0}
                >
                  {formState.isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      <span className="animate-pulse">
                        {editMode ? "Updating Order..." : "Creating Order..."}
                      </span>
                    </div>
                  ) : !selectedPlatformId ? (
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Select Platform First
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Add Items First
                    </div>
                  ) : lineItems.length === 0 ? (
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-2" />
                      Add Items First
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      {editMode ? "Update Purchase Order" : "Create Purchase Order"}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog for Form Submission */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-xl">
              <ShoppingCart className="h-6 w-6 mr-2 text-blue-600" />
              Confirm Purchase Order Creation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Please review your purchase order details before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium ml-2">
                    {platforms.find(p => p.id.toString() === selectedPlatformId)?.pf_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">PO Number:</span>
                  <span className="font-medium ml-2">{form.getValues('vendor_po_no')}</span>
                </div>
                <div>
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium ml-2">{selectedCompany}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium ml-2">{lineItems.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Basic Amount:</span>
                  <span className="font-medium ml-2">₹{orderSummary.totalBasic}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tax Amount:</span>
                  <span className="font-medium ml-2">₹{orderSummary.totalTax}</span>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-gray-800 font-semibold">Grand Total:</span>
                  <span className="font-bold text-lg ml-2 text-blue-600">₹{orderSummary.grandTotal}</span>
                </div>
              </div>
            </div>
            
            {/* Item List */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Items ({lineItems.length})</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {lineItems.slice(0, 5).map((item) => (
                  <div key={item.tempId} className="bg-white border rounded-lg p-3 text-sm">
                    <div className="font-medium text-gray-800 truncate">{item.item_name}</div>
                    <div className="text-gray-600 mt-1">
                      Qty: {item.quantity} | Rate: ₹{item.basic_amount} | Total: ₹{item.total_amount.toFixed(2)}
                    </div>
                  </div>
                ))}
                {lineItems.length > 5 && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    ... and {lineItems.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={formState.isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => form.handleSubmit(onSubmit)()}
              disabled={formState.isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 min-w-[150px]"
            >
              {formState.isSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="animate-pulse">
                    {editMode ? "Updating..." : "Creating..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editMode ? "Confirm & Update" : "Confirm & Create"}
                </div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2 text-orange-600" />
              Reset Form
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the form? All entered data and items will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleFormReset(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}