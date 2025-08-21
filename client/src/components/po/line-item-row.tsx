import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { sqlService, sqlQueryKeys } from "@/services/sql-service";
import type { PfItemMst, SapItemMst, PfMst, InsertPfOrderItems } from "@shared/schema";

interface LineItem extends InsertPfOrderItems {
  tempId: string;
  platform_code?: string;
}

interface LineItemRowProps {
  item: LineItem;
  platformId?: number;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
}

interface HanaItem {
  ItemCode: string;
  ItemName: string;
  ItemGroup?: string;
  ItmsGrpNam?: string;
  SubGroup?: string;
  U_Sub_Group?: string;
  Brand?: string;
  U_Brand?: string;
  UOM?: string;
  InvntryUom?: string;
  TaxRate?: number;
  U_Tax_Rate?: string;
  UnitSize?: string;
  SalPackUn?: number;
  CasePack?: number;
  U_TYPE?: string;
  U_Variety?: string;
  U_IsLitre?: string;
}

interface PlatformItemWithDetails extends PfItemMst {
  sapItem: SapItemMst;
  platform: PfMst;
}

const itemStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Invoiced", label: "Invoiced" },
  { value: "Dispatched", label: "Dispatched" },
  { value: "Delivered", label: "Delivered" },
  { value: "Stock Issue", label: "Stock Issue" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Expired", label: "Expired" },
  { value: "Price Difference", label: "Price Difference" },
  { value: "MOV Issue", label: "MOV Issue" },
  { value: "Hold", label: "Hold" },
  { value: "CN", label: "CN" },
  { value: "RTV", label: "RTV" },
  { value: "Case Pack Issue", label: "Case Pack Issue" }
];

export function LineItemRow({ item, platformId, onUpdate, onRemove }: LineItemRowProps) {
  const [searchTerm, setSearchTerm] = useState(item.item_name || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce the search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch item names for search dropdown
  const { data: itemNamesResponse, isLoading } = useQuery({
    queryKey: ['item-names', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        return [];
      }
      
      // Use the item-names API to get list of item names
      const response = await fetch(`/api/item-names?search=${encodeURIComponent(debouncedSearchTerm)}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error('Failed to fetch item names:', response.status);
        return [];
      }
      
      const data = await response.json();
      return data || [];
    },
    enabled: debouncedSearchTerm.length > 1 && isSearching
  });

  const itemNames = Array.isArray(itemNamesResponse) ? itemNamesResponse : [];

  // Handle clicking outside of dropdown
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

  // Calculate landing rate when basic rate or GST rate changes
  useEffect(() => {
    const basicRate = parseFloat(item.basic_rate || "0");
    const gstRate = parseFloat(item.gst_rate || "0");
    const landingRate = basicRate + (basicRate * gstRate / 100);
    
    if (landingRate !== parseFloat(item.landing_rate || "0")) {
      onUpdate({ landing_rate: landingRate.toFixed(2) });
    }
  }, [item.basic_rate, item.gst_rate, item.landing_rate, onUpdate]);

  const handleItemSelect = async (itemName: string) => {
    // Fetch full item details when an item is selected
    try {
      const response = await fetch(`/api/item-details?itemName=${encodeURIComponent(itemName)}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const itemDetails = await response.json();
        if (itemDetails && itemDetails.length > 0) {
          const selectedItem = itemDetails[0];
          
          // Update all fields with fetched data
          onUpdate({
            item_name: itemName,
            sap_code: selectedItem.ItemCode || "",
            category: selectedItem.ItmsGrpNam || selectedItem.ItemGroup || "",
            subcategory: selectedItem.U_Sub_Group || selectedItem.SubGroup || "",
            gst_rate: selectedItem.U_Tax_Rate || selectedItem.TaxRate?.toString() || "0",
            // Don't update basic_rate - let user enter it
            // basic_rate: selectedItem.BasicRate?.toString() || "0",
          });
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
    
    setSearchTerm(itemName);
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

  const itemIndex = parseInt(item.tempId.split('-')[1]) || 1;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header with Item Number and Remove Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
          Item #{itemIndex}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
        >
          Remove
        </Button>
      </div>

      {/* Item Name Search - Full Width */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          ITEM NAME *
        </label>
        <div className="relative w-full">
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="SEARCH ITEM..."
              onFocus={() => {
                if (searchTerm.length > 0) {
                  setIsSearching(true);
                  setShowDropdown(true);
                }
              }}
              className="w-full pr-10 text-sm border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-300 rounded-lg bg-white h-12"
            />
            {isSearching && (
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 animate-pulse" />
            )}
          </div>
          
          {showDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
            >
              {platformId && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                  <div className="text-xs font-medium text-blue-600">
                    Platform-specific catalog (Platform ID: {platformId})
                  </div>
                </div>
              )}
              {!platformId && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-600">
                    Searching all items from HANA database
                  </div>
                </div>
              )}
              {isLoading ? (
                <div className="px-6 py-4 text-center text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-sm font-medium">Searching HANA items...</p>
                </div>
              ) : itemNames && itemNames.length > 0 ? (
                itemNames.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    className="px-6 py-4 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-all duration-200"
                    onClick={() => handleItemSelect(item.ItemName)}
                  >
                    <div className="font-semibold text-slate-900 text-sm">{item.ItemName}</div>
                  </div>
                ))
              ) : debouncedSearchTerm.length > 1 ? (
                <div className="px-6 py-8 text-center text-slate-500">
                  <div className="text-sm">No items found for "<span className="font-medium text-slate-700">{debouncedSearchTerm}</span>"</div>
                  <div className="text-xs mt-1 text-slate-400">
                    {platformId ? `Platform-specific catalog (ID: ${platformId})` : 'All items'} • HANA DB
                  </div>
                </div>
              ) : debouncedSearchTerm.length === 1 ? (
                <div className="px-6 py-4 text-center text-slate-400">
                  <div className="text-sm">Type at least 2 characters to search</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Platform Code, SAP Code, UOM, Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            PLATFORM CODE
          </label>
          <Input 
            value={item.platform_code || ""} 
            readOnly 
            className="w-full bg-slate-50 text-sm border-2 border-slate-200 h-12 rounded-lg cursor-not-allowed"
            title="This field is auto-filled"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            SAP CODE
          </label>
          <Input 
            value={item.sap_code || ""} 
            readOnly 
            className="w-full bg-slate-50 text-sm border-2 border-slate-200 h-12 rounded-lg cursor-not-allowed"
            title="This field is auto-filled from item selection"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            UOM
          </label>
          <Input 
            value={item.category || ""} 
            readOnly 
            className="w-full bg-slate-50 text-sm border-2 border-slate-200 h-12 rounded-lg cursor-not-allowed"
            title="This field is auto-filled from item selection"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            QUANTITY *
          </label>
          <Input
            type="number"
            min="1"
            value={item.quantity || ""}
            onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
            placeholder="Enter quantity"
            className="w-full text-sm border-2 border-blue-300 hover:border-blue-400 focus:border-blue-500 h-12 rounded-lg transition-all duration-300 bg-blue-50"
            required
          />
        </div>
      </div>

      {/* Row 2: Boxes, Unit Size, Loose Qty, Basic Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            BOXES
          </label>
          <Input 
            type="number"
            value=""
            placeholder="0"
            className="w-full text-sm border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 h-12 rounded-lg transition-all duration-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            UNIT SIZE (LTRS)
          </label>
          <Input 
            type="number"
            value=""
            placeholder="0"
            className="w-full text-sm border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 h-12 rounded-lg transition-all duration-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            LOOSE QTY
          </label>
          <Input 
            type="number"
            value=""
            placeholder="0"
            className="w-full text-sm border-2 border-slate-200 hover:border-blue-400 focus:border-blue-500 h-12 rounded-lg transition-all duration-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            BASIC AMOUNT *
          </label>
          <Input
            type="number"
            step="0.01"
            value={item.basic_rate || ""}
            onChange={(e) => handleInputChange("basic_rate", e.target.value)}
            placeholder="Enter basic amount"
            className="w-full text-sm border-2 border-blue-300 hover:border-blue-400 focus:border-blue-500 h-12 rounded-lg transition-all duration-300 bg-blue-50"
            required
          />
        </div>
      </div>

      {/* Row 3: Tax, Landing Amount, Total Amount, Total Ltrs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            TAX (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={item.gst_rate || ""}
            readOnly
            placeholder="0"
            className="w-full text-sm border-2 border-slate-200 bg-slate-50 h-12 rounded-lg cursor-not-allowed"
            title="This field is auto-filled from item selection"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            LANDING AMOUNT
          </label>
          <Input
            type="number"
            step="0.01"
            value={item.landing_rate || ""}
            readOnly
            className="w-full bg-green-50 text-sm font-semibold text-green-700 border-2 border-green-200 h-12 rounded-lg cursor-not-allowed"
            title="Automatically calculated: Basic Amount + (Basic Amount × Tax%)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            TOTAL AMOUNT
          </label>
          <Input 
            type="number"
            value={(parseFloat(item.landing_rate || "0") * (item.quantity || 0)).toFixed(2)}
            readOnly
            className="w-full bg-slate-50 text-sm border-2 border-slate-200 h-12 rounded-lg cursor-not-allowed font-semibold"
            title="Total = Quantity × Landing Amount"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            TOTAL LTRS
          </label>
          <Input 
            type="number"
            value=""
            readOnly
            className="w-full bg-slate-50 text-sm border-2 border-slate-200 h-12 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
