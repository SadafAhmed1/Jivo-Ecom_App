import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import type { PfItemMst, SapItemMst, PfMst, InsertPfOrderItems } from "@shared/schema";

interface LineItem extends InsertPfOrderItems {
  tempId: string;
}

interface LineItemRowProps {
  item: LineItem;
  platformId?: number;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
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

  // Fetch platform items for search
  const { data: platformItems = [], isLoading } = useQuery<PlatformItemWithDetails[]>({
    queryKey: ["/api/platform-items", platformId, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platformId) params.append('platformId', platformId.toString());
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      
      const response = await fetch(`/api/platform-items?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch platform items');
      }
      return response.json();
    },
    enabled: !!platformId && debouncedSearchTerm.length > 0 && isSearching
  });

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

  const handleItemSelect = (selectedItem: PlatformItemWithDetails) => {
    onUpdate({
      item_name: selectedItem.pf_itemname,
      sap_code: selectedItem.sapItem.itemcode,
      category: selectedItem.sapItem.itemgroup || "",
      subcategory: selectedItem.sapItem.subgroup || "",
      gst_rate: selectedItem.sapItem.taxrate?.toString() || "0"
    });
    setSearchTerm(selectedItem.pf_itemname);
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

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      <td className="px-4 py-4">
        <div className="relative w-full">
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="Search and select item..."
              onFocus={() => {
                if (searchTerm.length > 0) {
                  setIsSearching(true);
                  setShowDropdown(true);
                }
              }}
              className="w-full pr-8 text-sm"
            />
            {isSearching && (
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
          </div>
          
          {showDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
            >
              {isLoading ? (
                <div className="px-4 py-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              ) : platformItems.length > 0 ? (
                platformItems.map((platformItem) => (
                  <div
                    key={platformItem.id}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    onClick={() => handleItemSelect(platformItem)}
                  >
                    <div className="font-medium text-gray-900">{platformItem.pf_itemname}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">SAP:</span> {platformItem.sapItem.itemcode} | 
                      <span className="ml-2">{platformItem.sapItem.itemgroup}</span>
                      {platformItem.sapItem.taxrate && (
                        <span className="ml-2 text-green-600">GST: {platformItem.sapItem.taxrate}%</span>
                      )}
                    </div>
                  </div>
                ))
              ) : debouncedSearchTerm.length > 0 ? (
                <div className="px-4 py-3 text-center text-gray-500">
                  No items found for "{debouncedSearchTerm}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </td>
      
      <td className="px-4 py-4">
        <Input 
          value={item.sap_code || ""} 
          readOnly 
          className="w-full bg-gray-50 text-sm font-mono"
        />
      </td>
      
      <td className="px-4 py-4">
        <Input
          value={item.category || ""}
          onChange={(e) => handleInputChange("category", e.target.value)}
          placeholder="Category"
          readOnly
          className="w-full bg-gray-50 text-sm"
        />
      </td>
      
      <td className="px-4 py-4">
        <Input
          type="number"
          min="1"
          value={item.quantity || ""}
          onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
          placeholder="Qty"
          className="w-full text-sm text-center"
        />
      </td>
      
      <td className="px-4 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.basic_rate || ""}
          onChange={(e) => handleInputChange("basic_rate", e.target.value)}
          placeholder="0.00"
          className="w-full text-sm text-right"
        />
      </td>
      
      <td className="px-4 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.gst_rate || ""}
          onChange={(e) => handleInputChange("gst_rate", e.target.value)}
          placeholder="18"
          className="w-full text-sm text-center"
        />
      </td>
      
      <td className="px-4 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.landing_rate || ""}
          readOnly
          className="w-full bg-gray-50 text-sm text-right font-medium text-green-600"
        />
      </td>
      
      <td className="px-4 py-4">
        <div className="flex items-center justify-center space-x-1">
          <Select
            value={item.status || "Pending"}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger className="w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 h-8 w-8"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
