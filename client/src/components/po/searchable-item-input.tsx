import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronDown, Loader2, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface HanaItemDetail {
  ItemCode: string;
  ItemName: string;
  ItmsGrpNam?: string;
  U_TYPE?: string;
  U_Variety?: string;
  U_Sub_Group?: string;
  U_Brand?: string;
  InvntryUom?: string;
  SalPackUn?: number;
  U_IsLitre?: string;
  U_Tax_Rate?: string;
  // Legacy fields for backward compatibility
  ItemGroup?: string;
  SubGroup?: string;
  Brand?: string;
  UnitOfMeasure?: string;
  UOM?: string;
  TaxRate?: number;
  UnitSize?: number;
  IsLitre?: boolean;
  CasePack?: number;
  BasicRate?: number;
  LandingRate?: number;
  MRP?: number;
  [key: string]: any;
}

interface SearchableItemInputProps {
  value: string;
  onChange: (value: string, hanaItem?: HanaItemDetail) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableItemInput({ 
  value, 
  onChange, 
  placeholder = "Search items...",
  className 
}: SearchableItemInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement[]>([]);

  // Use custom debounce hook for smoother search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch item names for search dropdown with better caching and error handling
  const { data: itemNamesResponse, isLoading: hanaLoading, error, refetch } = useQuery({
    queryKey: ['item-names', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`/api/item-names?search=${encodeURIComponent(debouncedSearchQuery)}`, {
          credentials: "include",
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment.');
          }
          throw new Error(`Search failed (${response.status}): ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Search timed out. Please try again.');
        }
        throw error;
      }
    },
    enabled: debouncedSearchQuery.length >= 2 && !isSelecting && open,
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors, but not for 4xx client errors
      if (failureCount < 2 && !error.message.includes('4')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000)
  });

  const hanaItems = Array.isArray(itemNamesResponse) ? itemNamesResponse : []; // Results already limited by backend

  // Function to highlight matching terms
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const words = query.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    words.forEach(word => {
      if (word.length > 1) {
        const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>');
      }
    });
    
    return highlightedText;
  };

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelectHanaItem = async (selectedItem: { ItemName: string }, index?: number) => {
    setIsSelecting(true);
    setInputValue(selectedItem.ItemName);
    setSelectedIndex(-1);
    setOpen(false);
    
    // Fetch full item details with loading state
    try {
      const response = await fetch(`/api/item-details?itemName=${encodeURIComponent(selectedItem.ItemName)}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const itemDetails = await response.json();
        if (itemDetails && itemDetails.length > 0) {
          const fullItem = itemDetails[0];
          onChange(selectedItem.ItemName, fullItem);
        } else {
          onChange(selectedItem.ItemName);
        }
      } else {
        console.warn('Failed to fetch item details:', response.status);
        onChange(selectedItem.ItemName);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
      onChange(selectedItem.ItemName);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSearchQuery(newValue);
    setSelectedIndex(-1);
    setOpen(newValue.length >= 2);
    onChange(newValue);
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchQuery("");
    setSelectedIndex(-1);
    setOpen(false);
    onChange("");
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < hanaItems.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < hanaItems.length) {
          handleSelectHanaItem(hanaItems[selectedIndex], selectedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn("pr-20", className)}
            onFocus={() => inputValue.length >= 2 && setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />
          <div className="absolute right-0 top-0 h-full flex items-center pr-2">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full mr-1"
                onClick={clearSearch}
              >
                <X className="h-3 w-3 text-gray-500" />
              </Button>
            )}
            {isSelecting || hanaLoading ? (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <div className="max-h-80 overflow-y-auto">
          {/* Search Status */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {hanaLoading ? "Searching..." : 
                 error ? "Search error" :
                 hanaItems.length > 0 ? `${hanaItems.length} item${hanaItems.length === 1 ? '' : 's'} found` :
                 searchQuery.length >= 2 ? "No items found" : "Type to search"}
              </span>
              {searchQuery.length >= 2 && (
                <span className="text-xs text-gray-400">
                  {searchQuery.length < 2 ? 'Min 2 chars' : '↑↓ navigate, ↵ select'}
                </span>
              )}
            </div>
          </div>

          {/* Loading State */}
          {hanaLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Searching database...</span>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">Search Error</span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  {error.message || 'Failed to search items. Please try again.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* No Results */}
          {!hanaLoading && !error && hanaItems.length === 0 && searchQuery.length >= 2 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-medium">No items found</div>
              <div className="text-xs mt-1">Try adjusting your search term</div>
            </div>
          )}

          {/* Search Results */}
          {hanaItems.length > 0 && (
            <div className="py-2">
              {hanaItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isCurrentValue = inputValue === item.ItemName;
                
                return (
                  <div
                    key={`item-${index}`}
                    ref={el => { if (el) optionsRef.current[index] = el; }}
                    className={cn(
                      "px-4 py-3 cursor-pointer border-l-2 transition-all duration-150",
                      isSelected 
                        ? "bg-blue-50 border-l-blue-500 text-blue-900" 
                        : isCurrentValue 
                        ? "bg-green-50 border-l-green-500 text-green-900"
                        : "border-l-transparent hover:bg-gray-50"
                    )}
                    onClick={() => handleSelectHanaItem(item, index)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div 
                          className={cn(
                            "font-medium truncate",
                            isSelected ? "text-blue-700" : "text-gray-900"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: highlightMatch(item.ItemName, debouncedSearchQuery)
                          }}
                        />
                      </div>
                      <div className="flex items-center ml-2">
                        {isCurrentValue && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {isSelected && !isCurrentValue && (
                          <ChevronDown className="h-4 w-4 text-blue-600 rotate-[-90deg]" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Instruction Footer */}
          {hanaItems.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-center">
              Use arrow keys to navigate • Enter to select • Esc to close
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}