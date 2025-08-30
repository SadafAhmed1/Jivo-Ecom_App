import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronDown, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface FlipkartItem {
  id: number;
  itemcode: string;
  itemname: string;
  itemgroup?: string;
  type?: string;
  variety?: string;
  subgroup?: string;
  brand?: string;
  uom?: string;
  taxrate?: number;
  unitsize?: string;
  basic_rate?: number;
  landing_rate?: number;
  mrp?: number;
  supplier_price?: number; // New field for // supplier price
  is_litre?: boolean;
  case_pack?: number;
}

interface FlipkartItemPickerProps {
  onItemSelect: (item: FlipkartItem, quantity: number) => void;
  placeholder?: string;
  className?: string;
}

export function FlipkartItemPicker({ 
  onItemSelect, 
  placeholder = "Search items for Flipkart Grocery...",
  className 
}: FlipkartItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FlipkartItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // Use debounce for smoother search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch items from the items master with supplier_price
  const { data: items = [], isLoading } = useQuery<FlipkartItem[]>({
    queryKey: ['flipkart-items', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      
      const response = await fetch(`/api/items?search=${encodeURIComponent(debouncedSearchQuery)}&platform=flipkart`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      return response.json();
    },
    enabled: debouncedSearchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleItemSelect = (item: FlipkartItem) => {
    setSelectedItem(item);
    setOpen(false);
    setSearchQuery(item.itemname);
  };

  const handleAddItem = () => {
    if (selectedItem && quantity > 0) {
      onItemSelect(selectedItem, quantity);
      // Reset selection
      setSelectedItem(null);
      setQuantity(1);
      setSearchQuery("");
    }
  };

  const formatCurrency = (amount?: number) => {
    return amount ? `₹${amount.toFixed(2)}` : 'N/A';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add Item from Master
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label>Search Items</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between", className)}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  {selectedItem ? selectedItem.itemname : placeholder}
                </div>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search items..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoading ? "Searching..." : "No items found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.itemcode}
                        onSelect={() => handleItemSelect(item)}
                        className="flex flex-col items-start gap-2 p-3"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p className="font-medium">{item.itemname}</p>
                              <p className="text-sm text-muted-foreground">
                                Code: {item.itemcode} | {item.brand} | {item.uom}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              {formatCurrency(item.supplier_price)}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              MRP: {formatCurrency(item.mrp)}
                            </p>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold">Selected Item Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Item Name:</span>
                  <p className="font-medium">{selectedItem.itemname}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Code:</span>
                  <p className="font-medium">{selectedItem.itemcode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <p className="font-medium">{selectedItem.brand || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">UOM:</span>
                  <p className="font-medium">{selectedItem.uom || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Supplier Price:</span>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedItem.supplier_price)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">MRP:</span>
                  <p className="font-medium">{formatCurrency(selectedItem.mrp)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tax Rate:</span>
                  <p className="font-medium">{selectedItem.taxrate}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{selectedItem.type || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Quantity Selection */}
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label>Basic Amount (Total)</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                    <span className="font-semibold text-lg text-green-600">
                      {formatCurrency((selectedItem.supplier_price || 0) * quantity)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({formatCurrency(selectedItem.supplier_price)} × {quantity})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Add Button */}
              <Button 
                onClick={handleAddItem} 
                className="w-full"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add {quantity} x {selectedItem.itemname}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}