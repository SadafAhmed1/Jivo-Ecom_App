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
  ShoppingCart, Calculator, ArrowLeft, MessageSquare
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
import { Progress } from "@/components/ui/progress";
import type { PfMst, StatusItem } from "@shared/schema";

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
  dispatch_from: z.string().optional(),
  area: z.string().optional(),
  region: z.string().min(1, "Region selection is required"),
  state: z.string().min(1, "State selection is required"),
  city: z.string().min(1, "City selection is required"),
  po_date: z.string().min(1, "PO date is required")
    .refine((date) => {
      const poDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return poDate >= today;
    }, "PO date cannot be in the past"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  appointment_date: z.string().optional(),
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

  // Global error handler for uncaught errors in this component
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("❌ Uncaught error in ModernPOForm:", event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("❌ Unhandled promise rejection in ModernPOForm:", event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previousPlatformId, setPreviousPlatformId] = useState<string>("");
  const [formState, setFormState] = useState<FormState>({ 
    isSubmitting: false, 
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

  // Watch form values for cascading updates
  const selectedRegion = form.watch("region");
  const selectedState = form.watch("state");
  const selectedDistributor = form.watch("distributor");

  // Dynamic dropdown queries for cascading region → state → city
  const { data: regions = [] } = useQuery<{ id: number; region_name: string }[]>({
    queryKey: ["/api/regions"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Find selected region ID
  const selectedRegionId = useMemo(() => {
    return regions.find(region => region.region_name === selectedRegion)?.id;
  }, [regions, selectedRegion]);

  // Get states based on selected region ID
  const { data: regionStates = [] } = useQuery<{ id: number; state_name: string; region_id: number }[]>({
    queryKey: [`/api/states/by-region/${selectedRegionId || 0}`],
    enabled: Boolean(selectedRegionId),
    staleTime: 5 * 60 * 1000,
  });

  // Legacy queries (keeping for backward compatibility)
  const { data: states = [], isLoading: statesLoading, error: statesError, isSuccess: statesSuccess } = useQuery<{ id: number; statename: string }[]>({
    queryKey: ["/api/states"],
    staleTime: 0,
    refetchOnMount: true
  });

  // Get districts/cities based on selected state (unified logic)
  const selectedStateId = useMemo(() => {
    // First try the new cascading dropdown data
    const fromNewAPI = regionStates.find(state => state.state_name === selectedState)?.id;
    if (fromNewAPI) return fromNewAPI;
    
    // Fallback to legacy state data
    return states && Array.isArray(states) ? states.find(state => state && state.statename === selectedState)?.id : undefined;
  }, [regionStates, selectedState, states]);

  const { data: stateCities = [] } = useQuery<{ id: number; district_name: string; state_id: number }[]>({
    queryKey: [`/api/districts/by-state/${selectedStateId || 0}`],
    enabled: Boolean(selectedStateId),
    staleTime: 5 * 60 * 1000,
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

  // selectedStateId is now defined above with unified logic

  const { data: districts = [] } = useQuery<{ id: number; district: string; state_id: number }[]>({
    queryKey: [`/api/districts/${selectedStateId || 0}`],
    enabled: true, // Always enabled to maintain consistent hook calls
    staleTime: selectedStateId ? 0 : Infinity, // Only fetch if state is actually selected
    refetchOnWindowFocus: false
  });

  const { data: allDistributors = [] } = useQuery<{ id: number; distributor_name: string }[]>({
    queryKey: ["/api/distributors"]
  });

  const { data: dispatchLocations = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/dispatch-locations"]
  });


  const { data: itemStatuses = [] } = useQuery<StatusItem[]>({
    queryKey: ["/api/status-items"]
  });

  // Fetch PO data for edit mode - only enabled when actually in edit mode
  const { data: editPO, isLoading: editQueryLoading, error: editQueryError, refetch: refetchEditPO } = useQuery<any>({
    queryKey: [`/api/pos/${editPoId || 'new'}`],
    enabled: Boolean(editMode && editPoId && !isNaN(parseInt(String(editPoId)))), // Only enabled when in edit mode with valid numeric ID
    retry: 2, // Increased retry attempts
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Progressive retry delay
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0,
    gcTime: 0 // Don't cache this data
  });
  
  // Enhanced error logging for edit queries
  React.useEffect(() => {
    if (editMode && editPoId) {
      console.log("🔧 Edit mode activated:", {
        editMode,
        editPoId,
        isLoading: editQueryLoading,
        hasError: !!editQueryError,
        hasData: !!editPO,
        errorMessage: editQueryError?.message,
        dataKeys: editPO ? Object.keys(editPO) : null
      });
    }
    
    if (editQueryError) {
      console.error("❌ Failed to fetch PO for editing:", {
        error: editQueryError,
        message: editQueryError?.message,
        stack: editQueryError?.stack,
        editPoId,
        queryKey: `/api/pos/${editPoId || 'new'}`
      });
    }
    
    if (editPO && editMode) {
      console.log("✅ Edit data loaded successfully:", {
        poId: editPO.id,
        poNumber: editPO.po_number || editPO.vendor_po_number,
        platform: editPO.platform,
        orderItemsCount: editPO.orderItems?.length || 0,
        keys: Object.keys(editPO)
      });
    }
  }, [editQueryError, editPO, editMode, editPoId, editQueryLoading]);

  // Populate form with edit data - memoized to prevent unnecessary re-renders
  const populatedData = useMemo(() => {
    try {
      if (!editMode || !editPoId || !editPO) return null;
      
      // Type guard for editPO
      const po = editPO as any;
    
    console.log("📝 EditPO data received:", po);
    console.log("🔑 EditPO keys:", Object.keys(po));
    console.log("🏙️ City value from API:", po.city);
    console.log("🗺️ State value from API:", po.state);
    console.log("📦 Order items from API (order_items):", po.order_items);
    console.log("📦 Order items from API (orderItems):", po.orderItems);
    console.log("📊 Order items array check:", Array.isArray(po.orderItems), "Length:", po.orderItems?.length);
    if (po.order_items && po.order_items.length > 0) {
      console.log("🏷️ First item from order_items:", po.order_items[0]);
    }
    if (po.orderItems && po.orderItems.length > 0) {
      console.log("🏷️ First item from orderItems:", po.orderItems[0]);
    } else {
      console.log("⚠️ No order items found in editPO.orderItems");
    }
    
      return {
      formData: {
        company: po.company || "JIVO MART",
        platform: po.platform?.id?.toString() || "",
        vendor_po_no: po.po_number || "",
        distributor: po.serving_distributor || "",
        dispatch_from: po.dispatch_from || "",
        area: po.area || "",
        region: po.region || "",
        // Only populate state and city if they have actual values (not null/empty)
        state: po.state && po.state.trim() !== '' ? po.state : "",
        city: po.city && po.city.trim() !== '' ? po.city : "",
        po_date: po.order_date ? new Date(po.order_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiry_date: po.expiry_date ? new Date(po.expiry_date).toISOString().split('T')[0] : "",
        appointment_date: po.appointment_date ? new Date(po.appointment_date).toISOString().split('T')[0] : "",
        comments: po.comments || ""
      },
      lineItems: po.orderItems && po.orderItems.length > 0 
        ? po.orderItems.map((item: any, index: number) => ({
            tempId: `existing-${index}`,
            item_name: item.item_name || "",
            // If platform_code or sap_code are numeric IDs, reset them to be populated properly
            platform_code: (typeof item.platform_code === 'number' || !isNaN(Number(item.platform_code))) ? "" : (item.platform_code || ""),
            sap_code: (typeof item.sap_code === 'number' || !isNaN(Number(item.sap_code))) ? "" : (item.sap_code || ""),
            uom: item.uom || "PCS",
            quantity: item.quantity || 1,
            basic_amount: parseFloat(item.basic_rate || "0"),
            tax_percent: (() => {
              // Use the corrected tax_percent from API (which handles decimal vs percentage conversion)
              let taxPercent = 0;
              
              // Priority: tax_percent from API (properly converted) > gst_rate (fallback)
              if (item.tax_percent !== undefined && item.tax_percent !== null) {
                taxPercent = parseFloat(item.tax_percent.toString());
                console.log('📝 Edit Mode - Using corrected tax_percent from API:', taxPercent + '% for item', item.item_name);
              } else if (item.gst_rate) {
                taxPercent = parseFloat(item.gst_rate);
                console.log('📝 Edit Mode - Fallback to gst_rate:', taxPercent + '% for item', item.item_name);
              }
              
              return taxPercent;
            })(),
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
    } catch (error) {
      console.error("❌ Error processing edit PO data:", error);
      return null;
    }
  }, [editMode, editPO]);

  // Apply the populated data only once when it changes
  useEffect(() => {
    try {
      if (populatedData) {
        console.log("🔄 Resetting form with data:", populatedData.formData);
        console.log("🏙️ City value being set:", populatedData.formData.city);
        setFormState(prev => ({ ...prev, isInitialPopulation: true }));
        
        // Safely reset form with error handling
        try {
          form.reset(populatedData.formData);
        } catch (formResetError) {
          console.error("❌ Error resetting form:", formResetError);
          toast({
            title: "Form Reset Error",
            description: "There was an issue loading the form data. Please try refreshing the page.",
            variant: "destructive"
          });
          return;
        }
        
        if (populatedData.lineItems && populatedData.lineItems.length > 0) {
          setLineItems(populatedData.lineItems);
        }
        
        // Reset flag after a longer delay to ensure all watchers have completed
        setTimeout(() => {
          try {
            // Ensure city value is preserved after all watchers have fired
            if (populatedData.formData.city) {
              form.setValue("city", populatedData.formData.city);
            }
            setFormState(prev => ({ ...prev, isInitialPopulation: false }));
            console.log("🔍 City value after form reset:", form.getValues("city"));
          } catch (setValueError) {
            console.error("❌ Error setting city value:", setValueError);
          }
        }, 500);
      }
    } catch (error) {
      console.error("❌ Critical error in populated data useEffect:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load PO data for editing. Please refresh and try again.",
        variant: "destructive"
      });
    }
  }, [populatedData, form, toast]);

  // Effect to auto-populate missing codes for existing items after form loads
  useEffect(() => {
    try {
      if (editMode && populatedData && populatedData.lineItems && populatedData.lineItems.length > 0) {
        // Small delay to ensure form is fully populated
        const timer = setTimeout(() => {
          try {
            autoPopulateMissingCodes(populatedData.lineItems);
          } catch (autoPopulateError) {
            console.error("❌ Error auto-populating missing codes:", autoPopulateError);
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("❌ Error in auto-populate effect:", error);
    }
  }, [editMode, populatedData]);

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
    // Clear all line items when platform actually changes (not on initial load or same platform)
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
    
    // Auto-select RK WORLD distributor when Amazon platform is selected
    if (selectedPlatformId === "6" || String(selectedPlatformId) === "6") {
      const currentDistributor = form.getValues("distributor");
      // Only set if not already set to avoid infinite loops and unnecessary toasts
      if (currentDistributor !== "RK WORLD") {
        form.setValue("distributor", "RK WORLD", { shouldValidate: true, shouldDirty: true });
        toast({
          title: "Distributor Auto-Selected",
          description: "RK WORLD selected for Amazon orders",
          duration: 3000,
        });
      }
    } else {
      // For non-Amazon platforms, clear the distributor to allow manual selection
      const currentDistributor = form.getValues("distributor");
      if (currentDistributor === "RK WORLD" && previousPlatformId === "6") {
        form.setValue("distributor", "");
      }
    }
    
    // Update previous platform ID
    if (selectedPlatformId) {
      setPreviousPlatformId(selectedPlatformId);
    }
    
  }, [selectedPlatformId, form, toast, lineItems.length, previousPlatformId]);

  // Auto-populate missing codes for existing items
  const autoPopulateMissingCodes = async (items: LineItem[]) => {
    for (const item of items) {
      if (item.item_name && (!item.platform_code || !item.sap_code)) {
        try {
          const response = await fetch(`/api/pf-items?search=${encodeURIComponent(item.item_name)}`);
          if (response.ok) {
            const pfItems = await response.json();
            const exactMatch = pfItems && Array.isArray(pfItems) ? pfItems.find((pfItem: any) => {
              // More robust null and type checks
              if (!pfItem || !pfItem.ItemName || !item.item_name) return false;
              if (typeof pfItem.ItemName !== 'string' || typeof item.item_name !== 'string') return false;
              if (pfItem.ItemName.trim() === '' || item.item_name.trim() === '') return false;
              
              try {
                return pfItem.ItemName.toLowerCase() === item.item_name.toLowerCase();
              } catch (error) {
                console.error('Error in toLowerCase comparison:', error, { pfItem: pfItem.ItemName, itemName: item.item_name });
                return false;
              }
            }) : undefined;
            if (exactMatch) {
              const updates: Partial<LineItem> = {};
              if (!item.platform_code) updates.platform_code = exactMatch.ItemCode || "";
              if (!item.sap_code) updates.sap_code = exactMatch.actual_itemcode || exactMatch.sap_id || "";
              // Always update tax_percent from the matched item's database value
              let correctTaxRate = parseFloat(exactMatch.taxrate || exactMatch.u_tax_rate || "0");
              
              // Apply corrections for known incorrect tax rates
              if (exactMatch.ItemName && typeof exactMatch.ItemName === 'string' && exactMatch.ItemName.trim() !== '') {
                try {
                  if (exactMatch.ItemName.toLowerCase().includes('mustard') && correctTaxRate < 1) {
                    correctTaxRate = 5; // Correct GST rate for edible oils
                    console.log('🔧 Fixed tax rate for mustard oil from', exactMatch.taxrate, 'to', correctTaxRate);
                  } else if (exactMatch.ItemName.toLowerCase().includes('oil') && correctTaxRate < 1) {
                    correctTaxRate = 5; // Correct GST rate for edible oils
                    console.log('🔧 Fixed tax rate for oil product from', exactMatch.taxrate, 'to', correctTaxRate);
                  }
                } catch (error) {
                  console.error('Error in tax rate correction:', error, { ItemName: exactMatch.ItemName });
                }
              }
              
              updates.tax_percent = correctTaxRate;
              
              updateLineItem(item.tempId, updates);
              console.log('🔧 Auto-populated codes for:', item.item_name, updates);
            }
          }
        } catch (error) {
          console.error('Failed to auto-populate codes for:', item.item_name, error);
        }
      }
    }
  };

  // Handle item selection from PF Items - simplified without additional data
  const handleItemSelect = (tempId: string, itemName: string, pfItem?: any) => {
    const updates: Partial<LineItem> = { item_name: itemName };
    
    if (pfItem) {
      console.log('🔍 DEBUGGING pfItem data:', JSON.stringify(pfItem, null, 2));
      
      // Auto-populate basic fields from PF Item data
      // Use pf_itemcode for platform code (platform-specific code)  
      updates.platform_code = pfItem.ItemCode || pfItem.pf_itemcode || "";
      // Use actual_itemcode from items table for SAP code (the real item master code)
      updates.sap_code = pfItem.actual_itemcode || pfItem.sap_id || "";
      updates.uom = "PCS"; // Default UOM since we don't have this data
      updates.unit_size_ltrs = 1; // Default unit size
      // Fix tax rate for specific items with incorrect rates
      let correctTaxRate = parseFloat(pfItem.taxrate || "0");
      
      // Apply corrections for known incorrect tax rates
      if (pfItem.ItemName && typeof pfItem.ItemName === 'string' && pfItem.ItemName.trim() !== '') {
        try {
          if (pfItem.ItemName.toLowerCase().includes('mustard') && correctTaxRate < 1) {
            correctTaxRate = 5; // Correct GST rate for edible oils
            console.log('🔧 Fixed tax rate for mustard oil from', pfItem.taxrate, 'to', correctTaxRate);
          } else if (pfItem.ItemName.toLowerCase().includes('oil') && correctTaxRate < 1) {
            correctTaxRate = 5; // Correct GST rate for edible oils
            console.log('🔧 Fixed tax rate for oil product from', pfItem.taxrate, 'to', correctTaxRate);
          }
        } catch (error) {
          console.error('Error in tax rate correction:', error, { ItemName: pfItem.ItemName });
        }
      }
      
      updates.tax_percent = correctTaxRate; // Use corrected tax rate
      updates.boxes = 1; // Default boxes
      updates.basic_amount = 0; // User needs to enter manually
      
      console.log('📝 Item selected:', itemName);
      console.log('📝 Platform Code (ItemCode):', pfItem.ItemCode);
      console.log('📝 Platform Code (pf_itemcode):', pfItem.pf_itemcode);
      console.log('📝 SAP Code (actual_itemcode):', pfItem.actual_itemcode);
      console.log('📝 SAP ID:', pfItem.sap_id);
      console.log('📝 Tax Rate:', pfItem.taxrate);
      console.log('📝 Final updates:', updates);
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
            <div className="flex items-center text-orange-600">
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

  // Region options - now using dynamic data
  const getAvailableRegions = () => {
    return regions.length > 0 ? regions.map(r => r.region_name) : ["NORTH INDIA", "SOUTH INDIA", "WEST INDIA", "EAST INDIA", "CENTRAL INDIA"];
  };

  // selectedState is already defined above  

  // Cascading location logic - clear dependent fields when parent changes (but not during initial population)
  useEffect(() => {
    if (selectedRegion && !formState.isInitialPopulation && !editMode) {
      // Clear state and city when region changes
      form.setValue("state", "");
      form.setValue("city", "");
    }
  }, [selectedRegion, form, formState.isInitialPopulation, editMode]);

  useEffect(() => {
    if (selectedState && !formState.isInitialPopulation && !editMode) {
      // Clear city when state changes (district-based cities) - but not in edit mode
      form.setValue("city", "");
      // Note: area is now a text field, no need to clear it
    }
  }, [selectedState, form, formState.isInitialPopulation, editMode]);

  // Distributor-Dispatch From locking logic
  useEffect(() => {
    if (selectedDistributor && selectedDistributor !== "none") {
      // Clear dispatch_from when distributor is selected
      const currentDispatchFrom = form.getValues("dispatch_from");
      if (currentDispatchFrom && currentDispatchFrom !== "none") {
        form.setValue("dispatch_from", "none");
      }
    }
  }, [selectedDistributor, form]);

  // Get available options based on dynamic data
  const getAvailableStates = () => {
    // Use cascading states if region is selected, otherwise fall back to all states
    if (selectedRegion && regionStates.length > 0) {
      const cascadingStateOptions = regionStates.map(state => state.state_name);
      console.log("getAvailableStates (cascading):", cascadingStateOptions);
      return cascadingStateOptions;
    }
    
    // Fallback to legacy all states
    const allStateOptions = states.map(state => state.statename);
    console.log("getAvailableStates (legacy):", allStateOptions);
    return allStateOptions;
  };
  
  const getAvailableCities = () => {
    // Use cascading cities if available, otherwise fall back to districts
    if (stateCities.length > 0) {
      const cascadingCityOptions = stateCities.map(city => city.district_name);
      console.log("getAvailableCities (cascading):", cascadingCityOptions);
      return cascadingCityOptions;
    }
    
    // Fallback to legacy districts
    const legacyCityOptions = districts.map(district => district.district);
    console.log("getAvailableCities (legacy):", legacyCityOptions);
    return legacyCityOptions;
  };


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
            <Trash2 className="h-4 w-4 mr-1 text-orange-600" />
            Item #{itemIndex + 1} removed from order
          </div>
        ),
        duration: 2000,
      });
      
      return updated;
    });
  }, [toast]);

  const updateLineItem = useCallback((tempId: string, updates: Partial<LineItem>) => {
    try {
      setLineItems(prev => prev.map(item => {
        if (item.tempId === tempId) {
          const updated = { ...item, ...updates };
        
        // Only recalculate amounts for non-status updates
        if (('quantity' in updates || 'basic_amount' in updates || 'tax_percent' in updates) && !('status' in updates)) {
          const basicAmount = Math.max(0, updated.basic_amount || 0);
          const quantity = Math.max(0, updated.quantity || 0);
          // Keep exact tax_percent value as user selected, don't modify it
          const taxPercent = updated.tax_percent || 0;
          
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
    } catch (error) {
      console.error('Error updating line item:', error);
    }
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

    const validItems = lineItems && Array.isArray(lineItems) ? lineItems.filter(item => {
      const validation = validateLineItem(item);
      return validation.isValid;
    }) : [];

    if (validItems.length === 0 && lineItems && lineItems.length > 0) {
      errors.push("Please complete at least one valid order item");
    }
    
    const invalidItems = lineItems && Array.isArray(lineItems) ? lineItems.filter(item => !validateLineItem(item).isValid) : [];
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
              <div key={index} className="flex items-center text-orange-600">
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

    // Get state_id and district_id from selected names (with safety checks)
    const selectedStateRecord = states && Array.isArray(states) ? states.find(state => state && state.statename === data.state) : undefined;
    const selectedDistrictRecord = districts && Array.isArray(districts) ? districts.find(district => district && district.district === data.city) : undefined;
    
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
      dispatch_from: data.dispatch_from === "none" ? undefined : data.dispatch_from,
      po_date: data.po_date,
      expiry_date: data.expiry_date || undefined,
      appointment_date: data.appointment_date || undefined,
      region: data.region,
      state: data.state,
      city: data.city,
      area: data.area,
      state_id: selectedStateRecord?.id || null,
      district_id: selectedDistrictRecord?.id || null,
      status: "OPEN",
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
      tax_percent: (() => {
        console.log('🚀 Sending tax_percent to server - Original value:', item.tax_percent, 'String value:', item.tax_percent.toString());
        return item.tax_percent.toString();
      })(),
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


  // Handle redirect when edit query fails (must be outside conditional to follow hooks rules)
  React.useEffect(() => {
    if (editMode && editQueryError) {
      console.log("❌ Edit query error:", editQueryError, "for PO ID:", editPoId);
      
      // If this is likely from a recent upload (PO was created but can't be found for editing),
      // redirect back to list with a success message instead of showing error
      const timer = setTimeout(() => {
        if (onSuccess) {
          console.log("🔄 Auto-redirecting to list due to edit load failure");
          onSuccess();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [editMode, editQueryError, editPoId, onSuccess]);

  // Conditional rendering logic (moved after all hooks to fix hooks rule violation)
  const showLoadingSkeleton = editMode && editQueryLoading;
  const showErrorState = editMode && editQueryError;

  if (showLoadingSkeleton) {
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

  if (showErrorState) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
        <Card className="shadow-lg border border-orange-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center py-8">
              <div className="bg-orange-100 p-4 rounded-full">
                <XCircle className="h-12 w-12 text-orange-600" />
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
                {editQueryError && (
                  <details className="mt-4 text-left">
                    <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                      Show technical details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                      <div>Error: {editQueryError.message}</div>
                      <div>Query: /api/pos/{editPoId}</div>
                      <div>Status: {(editQueryError as any)?.status || 'Unknown'}</div>
                    </div>
                  </details>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => refetchEditPO()}
                  className="text-orange-600 hover:text-orange-800 border-orange-300 hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
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
                className="ml-auto text-gray-500 hover:text-orange-600 hover:bg-gray-100 transition-all duration-200"
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          
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
                            ? "border-orange-300 focus:border-orange-400 focus:ring-orange-100" 
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
                          className="mt-1 text-sm text-orange-600 flex items-center" 
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
                        placeholder={selectedPlatformId ? "e.g., BLI-20250821-1234" : "Select platform first"}
                        className={cn(
                          "h-12 transition-all duration-200 text-base pl-4 pr-12 border-2",
                          !selectedPlatformId 
                            ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500" 
                            : fieldState.error 
                            ? "border-orange-300 focus:border-orange-400 focus:ring-orange-100 bg-orange-50/30" 
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
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
                      )}
                      <p id="po-number-hint" className="mt-1 text-xs text-gray-500">
                        {selectedPlatformId ? 'Enter PO number manually' : 'Select a platform first'}
                      </p>
                      {fieldState.error && (
                        <p 
                          id="po-number-error" 
                          className="mt-1 text-sm text-orange-600 flex items-center" 
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
                    {allDistributors.map((distributor) => (
                      <SelectItem key={distributor.id} value={distributor.distributor_name}>
                        {distributor.distributor_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dispatch From Field - Locked when distributor is selected */}
              <div className="space-y-2">
                <Label htmlFor="dispatch_from" className="text-xs font-medium text-gray-700 flex items-center">
                  DISPATCH FROM
                  {selectedDistributor && selectedDistributor !== "none" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Locked - Distributor Selected
                    </span>
                  )}
                </Label>
                <Select
                  value={form.watch("dispatch_from")}
                  onValueChange={(value) => form.setValue("dispatch_from", value)}
                  disabled={!selectedPlatformId || Boolean(selectedDistributor && selectedDistributor !== "none")}
                >
                  <SelectTrigger className={cn(
                    "h-10", 
                    !selectedPlatformId || (selectedDistributor && selectedDistributor !== "none")
                      ? "bg-gray-100 cursor-not-allowed" 
                      : "bg-white"
                  )}>
                    <SelectValue placeholder={
                      !selectedPlatformId 
                        ? "SELECT PLATFORM FIRST" 
                        : (selectedDistributor && selectedDistributor !== "none")
                        ? "LOCKED - REMOVE DISTRIBUTOR TO EDIT"
                        : "SELECT DISPATCH FROM"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Dispatch Location --</SelectItem>
                    {dispatchLocations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDistributor && selectedDistributor !== "none" && (
                  <p className="text-xs text-amber-600 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Dispatch From is locked when a distributor is selected. Remove distributor to edit.
                  </p>
                )}
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
                    {getAvailableRegions().map((region: string) => (
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
                            ? "border-orange-300 focus:border-orange-400 focus:ring-orange-100 bg-orange-50/30" 
                            : field.value && !fieldState.error
                            ? "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50/30"
                            : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-blue-400"
                        )}
                        disabled={!selectedPlatformId}
                      />
                      {fieldState.error && (
                        <p className="mt-1 text-sm text-orange-600 flex items-center" role="alert" aria-live="polite">
                          <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Appointment Date - Only show in edit mode */}
              {editMode && (
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
              )}

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
                      {lineItems && Array.isArray(lineItems) && lineItems.some(item => item.isValid === false) && (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700">
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
                    
                    return (
                      <div 
                        key={item.tempId} 
                        className={cn(
                          "relative bg-white rounded-2xl border-2 shadow-sm p-8 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-top-2",
                          isValid 
                            ? "border-green-300 hover:border-green-400 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20" 
                            : "border-orange-300 hover:border-orange-400 bg-gradient-to-br from-orange-50/30 via-white to-yellow-50/20"
                        )}
                      >
                        {/* Enhanced Item Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-gray-200/60 space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "flex items-center space-x-3 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm border",
                              isValid 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200" 
                                : "bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-200"
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
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              onClick={() => removeLineItem(item.tempId)}
                              variant="destructive"
                              size="sm"
                              disabled={formState.isSubmitting || formState.isResetting}
                              className="bg-gray-500 hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 font-semibold"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        

                        {/* Enhanced Item Name - Full Width */}
                        <div className="mb-8 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 rounded-xl border-l-4 border-blue-500">
                          <Label className="text-sm font-medium text-gray-700 flex items-center mb-4">
                            <Search className="h-4 w-4 mr-2 text-blue-600" />
                            Item Name *
                          </Label>
                          <SearchableItemInput
                            value={item.item_name}
                            onChange={(itemName, hanaItem) => handleItemSelect(item.tempId, itemName, hanaItem)}
                            placeholder="Type item name or code (e.g. 'rice' or 'FG0000216')"
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
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            Platform Code
                          </Label>
                          <Input
                            value={item.platform_code || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-lg cursor-not-allowed"
                            placeholder="Auto-filled from item selection"
                            title="This field is auto-filled when you select an item"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-gray-500" />
                            SAP Code
                          </Label>
                          <Input
                            value={item.sap_code || ""}
                            readOnly
                            className="h-11 bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-lg cursor-not-allowed"
                            placeholder="Auto-filled from item selection"
                            title="This field is auto-filled when you select an item"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            Unit of Measure
                          </Label>
                          <Input
                            value={item.uom || "PCS"}
                            readOnly
                            className="h-11 bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed text-sm font-semibold rounded-lg text-center"
                            title="Auto-filled from item selection"
                          />
                        </div>
                        <div className="relative space-y-3">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Calculator className="h-4 w-4 mr-1 text-blue-600" />
                            Quantity *
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
                                  ? "border-orange-300 focus:border-orange-400 focus:ring-orange-100 bg-orange-50/30"
                                  : "border-blue-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                              )}
                              placeholder="Enter quantity"
                              disabled={formState.isSubmitting || formState.isResetting}
                              required
                            />
                            {item.quantity > 0 ? (
                              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
                            )}
                          </div>
                        </div>

                        {/* Row 2 - Measurement Fields */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            Boxes
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
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            Unit Size (Litres)
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
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <Package className="h-3 w-3 mr-1 text-gray-500" />
                            Loose Quantity
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
                          <Label className="text-sm font-medium text-gray-700 flex items-center">
                            <IndianRupee className="h-4 w-4 mr-1 text-blue-600" />
                            Basic Amount *
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
                                  ? "border-orange-300 focus:border-orange-400 focus:ring-orange-100 bg-orange-50/30"
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
                              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
                            )}
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                            ITEM STATUS
                          </Label>
                          {/* Custom select styled to match other Radix UI selects */}
                          <div className="relative">
                            <select
                              value={item.status || "PENDING"}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (item?.tempId) {
                                  setLineItems(prev => prev.map(lineItem => 
                                    lineItem.tempId === item.tempId 
                                      ? { ...lineItem, status: value || "PENDING" }
                                      : lineItem
                                  ));
                                }
                              }}
                              disabled={formState.isSubmitting || formState.isResetting}
                              className={cn("flex h-10 mt-2 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer")}
                              style={{ 
                                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundPosition: 'right 0.75rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '16px 12px',
                                paddingRight: '2.5rem'
                              }}
                            >
                              <option value="">Select status</option>
                              {itemStatuses && itemStatuses.length > 0 ? (
                                itemStatuses.filter(status => status && status.status_name).map((status) => (
                                  <option key={status.id || status.status_name} value={status.status_name}>
                                    {status.status_name}
                                  </option>
                                ))
                              ) : (
                                // Fallback status options if API fails
                                <>
                                  <option value="PENDING">PENDING</option>
                                  <option value="INVOICED">INVOICED</option>
                                  <option value="DISPATCHED">DISPATCHED</option>
                                  <option value="DELIVERED">DELIVERED</option>
                                  <option value="STOCK_ISSUE">STOCK ISSUE</option>
                                  <option value="PRICE_DIFF">PRICE DIFF</option>
                                  <option value="MOV_ISSUE">MOV ISSUE</option>
                                  <option value="CANCELLED">CANCELLED</option>
                                  <option value="EXPIRED">EXPIRED</option>
                                  <option value="HOLD">HOLD</option>
                                  <option value="CN">CN</option>
                                  <option value="RTV">RTV</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                            <span className="text-green-600 mr-1">💰</span>
                            TAX (%)
                            {item.tax_percent > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                                {item.tax_percent}% Applied
                              </span>
                            )}
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.tax_percent}
                              readOnly
                              className={`h-12 mt-2 border-2 font-semibold ${
                                item.tax_percent > 0 
                                  ? 'bg-green-50 border-green-300 text-green-700' 
                                  : 'bg-gray-100 border-gray-200 text-gray-600'
                              } cursor-not-allowed`}
                              title="This field is auto-filled from item selection"
                            />
                            {item.tax_percent > 0 && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-600">
                                <span className="text-lg">✓</span>
                              </div>
                            )}
                          </div>
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
                        const currentStatusInfo = itemStatuses && itemStatuses.length > 0 
                          ? itemStatuses.find(s => s && s.status_name && s.status_name === item?.status)
                          : null;
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Attachments & Comments */}
              <div className="space-y-6">
                {/* Attachments */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    Attachments
                  </h3>
                  <div className={cn("border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200", selectedPlatformId ? "border-blue-300 bg-blue-50/30 hover:bg-blue-50/50" : "border-gray-200 bg-gray-50")}>
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
                      <Upload className={cn("h-12 w-12 mb-3", selectedPlatformId ? "text-blue-500" : "text-gray-400")} />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {selectedPlatformId ? "Click to Attach PO Document" : "Select Platform First"}
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, XLS files supported</p>
                      {attachedFile && (
                        <div className="mt-4 px-4 py-2 bg-green-100 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ {attachedFile.name}
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Comments */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                    Comments
                  </h3>
                  <Textarea
                    id="comments"
                    placeholder={selectedPlatformId ? "Enter any additional comments, special instructions, or notes about this purchase order..." : "Select platform first"}
                    {...form.register("comments")}
                    className={cn("h-32 resize-none border-gray-300 rounded-lg", selectedPlatformId ? "bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-gray-100 cursor-not-allowed")}
                    disabled={!selectedPlatformId}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum 1000 characters
                  </p>
                </div>
              </div>
              {/* Order Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Order Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-600 font-medium">Total Basic Amount:</span>
                    <span className="font-semibold text-lg text-gray-900">₹{orderSummary.totalBasic}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Total Tax:</span>
                    <span className="font-semibold text-lg text-gray-900">₹{orderSummary.totalTax}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t-2 border-blue-100 bg-blue-50/50 rounded-lg px-4 -mx-2">
                    <span className="text-blue-900 font-semibold text-lg">Grand Total:</span>
                    <span className="font-bold text-2xl text-blue-600">₹{orderSummary.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Enhanced Action Section */}
            <div className="border-t border-gray-200 bg-gray-50/50 rounded-b-xl -mx-6 -mb-6 px-6 py-6 mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-6">
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">₹{orderSummary.grandTotal}</p>
                    <p className="text-xs text-gray-500 font-medium">Total Value</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-2xl font-bold text-green-600">{lineItems.length}</p>
                    <p className="text-xs text-gray-500 font-medium">{lineItems.length === 1 ? 'Item' : 'Items'}</p>
                  </div>
                </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFormReset()}
                  disabled={formState.isSubmitting || formState.isResetting || (!form.formState.isDirty && lineItems.length === 0)}
                  className="px-6 py-3 border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 font-medium"
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
              className="bg-gray-600 hover:bg-gray-700"
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