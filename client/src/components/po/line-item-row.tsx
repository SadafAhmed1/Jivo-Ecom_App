import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Fetch platform items for search
  const { data: platformItems = [] } = useQuery<PlatformItemWithDetails[]>({
    queryKey: ["/api/platform-items", { platformId, search: searchTerm }],
    enabled: !!platformId && searchTerm.length > 0
  });

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
  };

  const handleInputChange = (field: keyof LineItem, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <tr>
      <td className="px-6 py-4">
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(e.target.value.length > 0);
              onUpdate({ item_name: e.target.value });
            }}
            placeholder="Search and select item..."
            onFocus={() => setShowDropdown(searchTerm.length > 0)}
          />
          {showDropdown && platformItems.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {platformItems.map((platformItem) => (
                <div
                  key={platformItem.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleItemSelect(platformItem)}
                >
                  <div className="font-medium">{platformItem.pf_itemname}</div>
                  <div className="text-sm text-gray-500">
                    SAP: {platformItem.sapItem.itemcode} | {platformItem.sapItem.itemgroup}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <Input 
          value={item.sap_code || ""} 
          readOnly 
          className="bg-gray-50"
        />
      </td>
      
      <td className="px-6 py-4">
        <Input
          value={item.category || ""}
          onChange={(e) => handleInputChange("category", e.target.value)}
          placeholder="Category"
        />
      </td>
      
      <td className="px-6 py-4">
        <Input
          type="number"
          value={item.quantity || ""}
          onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 0)}
          placeholder="Quantity"
        />
      </td>
      
      <td className="px-6 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.basic_rate || ""}
          onChange={(e) => handleInputChange("basic_rate", e.target.value)}
          placeholder="Basic Rate"
        />
      </td>
      
      <td className="px-6 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.gst_rate || ""}
          onChange={(e) => handleInputChange("gst_rate", e.target.value)}
          placeholder="GST Rate"
        />
      </td>
      
      <td className="px-6 py-4">
        <Input
          type="number"
          step="0.01"
          value={item.landing_rate || ""}
          readOnly
          className="bg-gray-50"
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Select
            value={item.status || "Pending"}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger className="w-32">
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
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </td>
    </tr>
  );
}
