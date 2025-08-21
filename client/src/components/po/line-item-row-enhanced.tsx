import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Trash2, Search, Package, Barcode, Calculator, 
  TrendingUp, Info, ChevronDown, ChevronUp, 
  ShoppingCart, Tag, Percent, Hash, Box,
  Loader2, AlertCircle, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { sqlService, sqlQueryKeys } from "@/services/sql-service";
import { cn } from "@/lib/utils";
// import type { PfItemMst, SapItemMst, PfMst } from "@shared/schema";

interface LineItem {
  tempId: string;
  po_id?: number;
  item_name?: string;
  sap_code?: string;
  category?: string;
  subcategory?: string;
  sku_name?: string;
  sku_code?: string;
  unit_cost?: number;
  quantity?: number;
  amount?: number;
  gst?: number;
  gst_amount?: number;
  gst_rate?: string;
  basic_rate?: string;
  landing_rate?: string;
  hsn?: string;
  ean?: string;
  moq?: number;
  batch_number?: string;
  expiry?: string;
  mrp?: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  rack_number?: string;
  reason?: string;
  unit_size?: number;
  boxes?: number;
  total_ltrs?: number;
  uom?: string;
}

interface LineItemRowProps {
  item: LineItem;
  platformId?: number;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
  index: number;
}

interface HanaItem {
  ItemCode: string;
  ItemName: string;
  ItemGroup?: string;
  ItmsGrpNam?: string;
  SubGroup?: string;
  Brand?: string;
  U_Brand?: string;
  UOM?: string;
  TaxRate?: number;
  U_Tax_Rate?: string;
  UnitSize?: number;
  CasePack?: number;
  Variety?: string;
  U_TYPE?: string;
}

export function LineItemRowEnhanced({ item, platformId = 0, onUpdate, onRemove, index = 0 }: LineItemRowProps) {
  const [searchTerm, setSearchTerm] = useState(item.item_name || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HanaItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch items from stored procedure
  const { data: hanaItemsResponse, isLoading } = useQuery({
    queryKey: sqlQueryKeys.searchHanaItems(debouncedSearchTerm, 50, platformId),
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        return { success: false, data: [], error: "Search term too short" };
      }
      return sqlService.searchHanaItems({ 
        search: debouncedSearchTerm, 
        limit: 50,
        platformId: platformId 
      });
    },
    enabled: debouncedSearchTerm.length > 1 && isSearching && !!platformId
  });

  const hanaItems = hanaItemsResponse?.success ? hanaItemsResponse.data : [];

  // Calculate derived values
  useEffect(() => {
    const quantity = parseFloat(item.quantity?.toString() || "0");
    const basicRate = parseFloat(item.basic_rate || "0");
    const gstRate = parseFloat(item.gst_rate || "0");
    const unitSize = parseFloat(item.unit_size?.toString() || "0");
    const boxes = parseFloat(item.boxes?.toString() || "0");
    
    // Calculate landing rate (basic + GST)
    const landingRate = basicRate + (basicRate * gstRate / 100);
    
    // Calculate total amount
    const totalAmount = quantity * landingRate;
    
    // Calculate total liters
    const totalLtrs = quantity * unitSize;
    
    // Update if changed
    if (landingRate !== parseFloat(item.landing_rate || "0")) {
      onUpdate({ landing_rate: landingRate.toFixed(2) });
    }
    
    if (totalAmount !== (item.amount || 0)) {
      onUpdate({ amount: totalAmount });
    }
    
    if (totalLtrs !== parseFloat(item.total_ltrs?.toString() || "0")) {
      onUpdate({ total_ltrs: totalLtrs });
    }
  }, [item.basic_rate, item.gst_rate, item.quantity, item.unit_size]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemSelect = (selectedItem: HanaItem) => {
    const itemGroup = selectedItem.ItemGroup || selectedItem.ItmsGrpNam || "";
    const brand = selectedItem.Brand || selectedItem.U_Brand || "";
    const taxRate = selectedItem.TaxRate || parseFloat(selectedItem.U_Tax_Rate || "0");
    
    onUpdate({
      item_name: selectedItem.ItemName,
      sap_code: selectedItem.ItemCode,
      category: itemGroup,
      subcategory: selectedItem.SubGroup || "",
      gst_rate: taxRate.toString(),
      unit_size: selectedItem.UnitSize || 1
    });
    
    setSelectedItem(selectedItem);
    setSearchTerm(selectedItem.ItemName);
    setShowDropdown(false);
    setIsSearching(false);
  };

  const handleInputChange = (field: keyof LineItem, value: string | number) => {
    onUpdate({ [field]: value });
  };

  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value);
    onUpdate({ item_name: value });
    setIsSearching(true);
    setShowDropdown(value.length > 0);
  };

  const getStatusColor = () => {
    if (!item.item_name) return "bg-gray-100 border-gray-300";
    if (!item.quantity || !item.basic_rate) return "bg-yellow-50 border-yellow-300";
    return "bg-green-50 border-green-300";
  };

  const getCompletionStatus = () => {
    const requiredFields = [item.item_name, item.quantity, item.basic_rate];
    const filledFields = requiredFields.filter(field => field).length;
    return (filledFields / requiredFields.length) * 100;
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        getStatusColor(),
        "hover:shadow-lg border-2"
      )}>
        {/* Progress Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${getCompletionStatus()}%` }}
          />
        </div>

        {/* Header Section */}
        <div className="p-4 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                {getCompletionStatus() === 100 && (
                  <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {item.item_name || "Select an item"}
                </h3>
                {item.sap_code && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Barcode className="h-3 w-3 mr-1" />
                      {item.sap_code}
                    </Badge>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hover:bg-blue-100"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExpanded ? "Show less" : "Show more details"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove item</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="p-4 space-y-4">
          {/* Item Search Section */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="h-4 w-4" />
              Search & Select Item
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Type to search items..."
                onFocus={() => {
                  if (searchTerm.length > 0) {
                    setIsSearching(true);
                    setShowDropdown(true);
                  }
                }}
                className={cn(
                  "pr-10 text-sm border-2 transition-all duration-300",
                  "hover:border-blue-400 focus:border-blue-500",
                  "h-11 bg-white"
                )}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : isSearching ? (
                  <Search className="h-4 w-4 text-blue-500 animate-pulse" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Search Dropdown */}
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
              >
                {platformId && (
                  <div className="sticky top-0 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-700">
                        Platform-specific catalog
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Platform ID: {platformId}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="px-6 py-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-3 text-sm font-medium text-gray-600">
                      Fetching items from HANA database...
                    </p>
                  </div>
                ) : hanaItems && hanaItems.length > 0 ? (
                  <div className="py-2">
                    {hanaItems.map((hanaItem: HanaItem, idx: number) => (
                      <div
                        key={`${hanaItem.ItemCode}-${idx}`}
                        className={cn(
                          "px-4 py-3 cursor-pointer transition-all duration-200",
                          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50",
                          "border-b border-gray-100 last:border-b-0"
                        )}
                        onClick={() => handleItemSelect(hanaItem)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {hanaItem.ItemName}
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                <Hash className="h-3 w-3 mr-1" />
                                {hanaItem.ItemCode}
                              </Badge>
                              {(hanaItem.ItemGroup || hanaItem.ItmsGrpNam) && (
                                <Badge variant="secondary" className="text-xs">
                                  {hanaItem.ItemGroup || hanaItem.ItmsGrpNam}
                                </Badge>
                              )}
                              {(hanaItem.TaxRate || hanaItem.U_Tax_Rate) && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <Percent className="h-3 w-3 mr-1" />
                                  GST: {hanaItem.TaxRate || hanaItem.U_Tax_Rate}%
                                </Badge>
                              )}
                              {(hanaItem.Brand || hanaItem.U_Brand) && (
                                <Badge className="bg-purple-100 text-purple-700 text-xs">
                                  {hanaItem.Brand || hanaItem.U_Brand}
                                </Badge>
                              )}
                              {hanaItem.U_TYPE && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  {hanaItem.U_TYPE}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {hanaItem.UnitSize && (
                            <div className="ml-4 text-right">
                              <div className="text-xs text-gray-500">Size</div>
                              <div className="font-medium text-gray-900">
                                {hanaItem.UnitSize} {hanaItem.UOM || 'L'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : debouncedSearchTerm.length > 1 ? (
                  <div className="px-6 py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">
                      No items found for "{debouncedSearchTerm}"
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try searching with different keywords
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <Info className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Type at least 2 characters to search
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Fields Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Quantity */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                <ShoppingCart className="h-3 w-3" />
                Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                value={item.quantity || ""}
                onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
                placeholder="Enter qty"
                className="h-10 text-sm font-medium border-2 hover:border-blue-400 focus:border-blue-500"
              />
            </div>

            {/* Basic Rate */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                <Calculator className="h-3 w-3" />
                Basic Rate <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={item.basic_rate || ""}
                onChange={(e) => handleInputChange("basic_rate", e.target.value)}
                placeholder="₹0.00"
                className="h-10 text-sm font-medium border-2 hover:border-green-400 focus:border-green-500"
              />
            </div>

            {/* GST Rate */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                <Percent className="h-3 w-3" />
                GST %
              </label>
              <Input
                type="number"
                step="0.01"
                value={item.gst_rate || ""}
                onChange={(e) => handleInputChange("gst_rate", e.target.value)}
                placeholder="18"
                className="h-10 text-sm border-2 hover:border-purple-400 focus:border-purple-500"
              />
            </div>

            {/* Landing Rate */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                <TrendingUp className="h-3 w-3" />
                Landing Rate
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={item.landing_rate || ""}
                  readOnly
                  className="h-10 text-sm font-bold bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-300 pl-8"
                />
                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-green-600 font-bold">
                  ₹
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* UOM */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    UOM
                  </label>
                  <Input
                    value={item.uom || "PCS"}
                    onChange={(e) => handleInputChange("uom", e.target.value)}
                    className="h-9 text-sm bg-gray-50"
                  />
                </div>

                {/* Boxes */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                    <Box className="h-3 w-3" />
                    Boxes
                  </label>
                  <Input
                    type="number"
                    value={item.boxes || ""}
                    onChange={(e) => handleInputChange("boxes", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Unit Size */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Unit Size (L)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_size || ""}
                    onChange={(e) => handleInputChange("unit_size", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Total Amount
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={item.amount?.toFixed(2) || "0.00"}
                      readOnly
                      className="h-9 text-sm font-bold bg-blue-50 text-blue-700 border-blue-300 pl-8"
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-600 font-bold">
                      ₹
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    HSN Code
                  </label>
                  <Input
                    value={item.hsn || ""}
                    onChange={(e) => handleInputChange("hsn", e.target.value)}
                    placeholder="HSN"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    MRP
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.mrp || ""}
                    onChange={(e) => handleInputChange("mrp", parseFloat(e.target.value) || 0)}
                    placeholder="₹0.00"
                    className="h-9 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Discount %
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.discount || ""}
                    onChange={(e) => handleInputChange("discount", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Summary Bar */}
          {item.item_name && item.quantity && item.basic_rate && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Summary:</span>
                  <Badge variant="outline">
                    Qty: {item.quantity} {item.uom || 'PCS'}
                  </Badge>
                  <Badge variant="outline">
                    Rate: ₹{item.basic_rate}
                  </Badge>
                  {item.gst_rate && (
                    <Badge variant="outline">
                      GST: {item.gst_rate}%
                    </Badge>
                  )}
                </div>
                <div className="font-bold text-lg text-blue-700">
                  Total: ₹{item.amount?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}