import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SearchableItemInput } from "@/components/po/searchable-item-input";

interface PFItemFormData {
  pf_id: string;
  pf_itemcode: string;
  pf_itemname: string;
  sap_id: string;
}

export default function PFItemCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PFItemFormData>({
    pf_id: "",
    pf_itemcode: "",
    pf_itemname: "",
    sap_id: ""
  });
  
  const [errors, setErrors] = useState<Partial<PFItemFormData>>({});
  
  // Fetch platforms
  const { data: platforms = [] } = useQuery<{ id: number; pf_name: string }[]>({
    queryKey: ["/api/platforms"]
  });
  
  // Function to check for duplicates
  const checkForDuplicates = async (pf_id: string, pf_itemcode: string, pf_itemname: string) => {
    if (!pf_id || (!pf_itemcode && !pf_itemname)) return;
    
    try {
      const response = await fetch(`/api/pf-items/check-duplicate?pf_id=${pf_id}&pf_itemcode=${encodeURIComponent(pf_itemcode || '')}&pf_itemname=${encodeURIComponent(pf_itemname || '')}`);
      const result = await response.json();
      
      const newErrors: Partial<PFItemFormData> = {};
      
      if (result.codeExists && pf_itemcode) {
        newErrors.pf_itemcode = `Item code '${pf_itemcode}' already exists for this platform`;
      }
      
      if (result.nameExists && pf_itemname) {
        newErrors.pf_itemname = `Item name '${pf_itemname}' already exists for this platform`;
      }
      
      setErrors(prev => ({
        ...prev,
        ...newErrors
      }));
    } catch (error) {
      console.error("Error checking for duplicates:", error);
    }
  };
  
  const createItemMutation = useMutation({
    mutationFn: async (data: PFItemFormData) => {
      const response = await fetch("/api/pf-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create item");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pf-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Success",
        description: "PF Item created successfully"
      });
      // Reset form
      setFormData({
        pf_id: "",
        pf_itemcode: "",
        pf_itemname: "",
        sap_id: ""
      });
      setErrors({});
    },
    onError: (error: Error) => {
      console.error("PF Item creation failed:", error);
      
      // Check if it's a duplicate error
      const isDuplicateError = error.message.includes('already exists') || error.message.includes('duplicate');
      
      toast({
        title: isDuplicateError ? "Duplicate Item" : "Error",
        description: error.message || "Failed to create PF Item",
        variant: "destructive"
      });
    }
  });
  
  const validateForm = (): boolean => {
    const newErrors: Partial<PFItemFormData> = {};
    
    if (!formData.pf_id.trim()) {
      newErrors.pf_id = "Platform is required";
    }
    
    if (!formData.pf_itemcode.trim()) {
      newErrors.pf_itemcode = "PF Item Code is required";
    }
    
    if (!formData.pf_itemname.trim()) {
      newErrors.pf_itemname = "PF Item Name is required";
    }
    
    if (!formData.sap_id.trim()) {
      newErrors.sap_id = "SAP Item Code is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || createItemMutation.isPending) {
      console.log("⚠️ Form submission already in progress, ignoring duplicate submission");
      return;
    }
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("📤 Submitting PF Item creation:", formData);
      await createItemMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInputChange = (field: keyof PFItemFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newValue
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Check for duplicates when user finishes typing (debounced)
    if (formData.pf_id && (field === 'pf_itemcode' || field === 'pf_itemname')) {
      const timeoutId = setTimeout(() => {
        const currentData = field === 'pf_itemcode' 
          ? { ...formData, pf_itemcode: newValue }
          : { ...formData, pf_itemname: newValue };
          
        if (currentData.pf_id && (currentData.pf_itemcode || currentData.pf_itemname)) {
          checkForDuplicates(currentData.pf_id, currentData.pf_itemcode, currentData.pf_itemname);
        }
      }, 800); // Wait 800ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-blue-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/inventory")}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                PF Item Creation
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Create a new platform item
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">New PF Item</CardTitle>
                <CardDescription>Fill in the details to create a new platform item</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Platform <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.pf_id}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, pf_id: value }));
                      if (errors.pf_id) {
                        setErrors(prev => ({ ...prev, pf_id: undefined }));
                      }
                      
                      // Check for duplicates when platform changes
                      if (value && (formData.pf_itemcode || formData.pf_itemname)) {
                        setTimeout(() => {
                          checkForDuplicates(value, formData.pf_itemcode, formData.pf_itemname);
                        }, 100);
                      }
                    }}
                    disabled={isSubmitting || createItemMutation.isPending}
                  >
                    <SelectTrigger className={`h-12 ${errors.pf_id ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id.toString()}>
                          {platform.pf_name}
                        </SelectItem>
                      ))}
                    </SelectContent>

                    
                  </Select>
                  {errors.pf_id && (
                    <p className="text-sm text-red-500">{errors.pf_id}</p>
                  )}
                </div>
                
                {/* PF Item Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="pf_itemcode" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    PF Item Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pf_itemcode"
                    type="text"
                    placeholder="Enter PF Item Code"
                    value={formData.pf_itemcode}
                    onChange={handleInputChange("pf_itemcode")}
                    className={`h-12 ${errors.pf_itemcode ? 'border-red-500' : ''}`}
                    disabled={isSubmitting || createItemMutation.isPending}
                  />
                  {errors.pf_itemcode && (
                    <p className="text-sm text-red-500">{errors.pf_itemcode}</p>
                  )}
                </div>
                
                {/* PF Item Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="pf_itemname" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    PF Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pf_itemname"
                    type="text"
                    placeholder="Enter PF Item Name"
                    value={formData.pf_itemname}
                    onChange={handleInputChange("pf_itemname")}
                    className={`h-12 ${errors.pf_itemname ? 'border-red-500' : ''}`}
                    disabled={isSubmitting || createItemMutation.isPending}
                  />
                  {errors.pf_itemname && (
                    <p className="text-sm text-red-500">{errors.pf_itemname}</p>
                  )}
                </div>
                
                {/* SAP Item Code Search Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    SAP Item Code <span className="text-red-500">*</span>
                  </Label>
                  <SearchableItemInput
                    value={formData.sap_id}
                    onChange={(value, pfItem) => {
                      // When a PF item is selected, update sap_id with the item code
                      setFormData(prev => ({ ...prev, sap_id: value }));
                      // Clear error for this field when user selects an item
                      if (errors.sap_id) {
                        setErrors(prev => ({ ...prev, sap_id: undefined }));
                      }
                    }}
                    placeholder="Search and select SAP item code..."
                    className={`h-12 ${errors.sap_id ? 'border-red-500' : ''}`}
                  />
                  {errors.sap_id && (
                    <p className="text-sm text-red-500">{errors.sap_id}</p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/inventory")}
                  disabled={isSubmitting || createItemMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createItemMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || createItemMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2" />
                      Creating Item...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Item
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );


}









