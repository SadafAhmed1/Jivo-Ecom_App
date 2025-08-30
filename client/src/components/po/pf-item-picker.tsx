import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronDown, Loader2, X, AlertCircle, Package, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface PFItem {
  ItemName: string;
  ItemCode: string;
  pf_id: number;
  sap_id: string;
  actual_itemcode?: string;
  taxrate?: number;
}

interface PFItemPickerProps {
  value: string;
  onChange: (value: string, pfItem?: PFItem) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PFItemPicker({ 
  value, 
  onChange, 
  placeholder = "Search platform items...",
  className,
  disabled = false,
  required = false
}: PFItemPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use custom debounce hook for smoother search
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Fetch PF items for search dropdown
  const { data: pfItemsResponse, isLoading: pfLoading, error, refetch } = useQuery({
    queryKey: ['pf-items', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        const response = await fetch(`/api/pf-items?search=${encodeURIComponent(debouncedSearchQuery)}`, {
          credentials: "include",
          signal: controller.signal,
          headers: {
            'Cache-Control': 'max-age=60', // Cache for 1 minute
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment.');
          }
          if (response.status === 404) {
            throw new Error('Search service not available.');
          }
          throw new Error(`Search failed (${response.status}): ${response.statusText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 50) : []; // Limit results for performance
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Search timed out. Please try again.');
        }
        throw error;
      }
    },
    enabled: debouncedSearchQuery.length >= 2 && !isSelecting && open,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    gcTime: 5 * 60 * 1000,  // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Retry up to 2 times for network errors, but not for 4xx client errors
      if (failureCount < 2 && !error.message.includes('4')) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000)
  });

  const pfItems = useMemo(() => 
    Array.isArray(pfItemsResponse) ? pfItemsResponse : [], 
    [pfItemsResponse]
  );

  // Improved function to highlight matching terms with better performance
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return text;
    
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded font-medium">$1</mark>');
    });
    
    return highlightedText;
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectPFItem = useCallback(async (selectedItem: PFItem) => {
    if (isSelecting) return;
    
    setIsSelecting(true);
    setInputValue(selectedItem.ItemName);
    setSelectedIndex(-1);
    setOpen(false);
    
    // Call onChange with the selected item details
    onChange(selectedItem.ItemName, selectedItem);
    
    setTimeout(() => setIsSelecting(false), 100);
  }, [onChange, isSelecting]);

  const handleInputChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    setSearchQuery(newValue);
    setSelectedIndex(-1);
    setOpen(newValue.length >= 2);
    onChange(newValue);
  }, [onChange]);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setSearchQuery("");
    setSelectedIndex(-1);
    setOpen(false);
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // Improved keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' && inputValue.length >= 2) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < pfItems.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : pfItems.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < pfItems.length) {
          handleSelectPFItem(pfItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < pfItems.length) {
          e.preventDefault();
          handleSelectPFItem(pfItems[selectedIndex]);
        } else {
          setOpen(false);
        }
        break;
    }
  }, [open, selectedIndex, pfItems, handleSelectPFItem, inputValue]);

  const handleClickOutside = useCallback(() => {
    setOpen(false);
    setSelectedIndex(-1);
  }, []);

  const statusText = useMemo(() => {
    if (pfLoading) return "Searching platform items...";
    if (error) return "Search error";
    if (pfItems.length > 0) return `${pfItems.length} platform item${pfItems.length === 1 ? '' : 's'} found`;
    if (searchQuery.length >= 2) return "No platform items found";
    return "Type to search platform items";
  }, [pfLoading, error, pfItems.length, searchQuery.length]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={handleClickOutside}>
        <PopoverTrigger asChild>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <Package className={cn(
                "h-4 w-4 transition-colors",
                disabled ? "text-gray-300" : "text-gray-400"
              )} />
            </div>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "pl-10 pr-20 transition-all duration-200",
                open && "ring-2 ring-blue-500 ring-opacity-50",
                error && "border-red-300 focus:border-red-500 focus:ring-red-500",
                required && !inputValue && "border-orange-300",
                className
              )}
              onFocus={() => {
                if (!disabled && inputValue.length >= 2) {
                  setOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              autoComplete="off"
              spellCheck="false"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-required={required}
            />
            <div className="absolute right-0 top-0 h-full flex items-center pr-3 gap-1">
              {inputValue && !disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={clearSearch}
                  tabIndex={-1}
                >
                  <X className="h-3 w-3 text-gray-500" />
                </Button>
              )}
              {isSelecting || pfLoading ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Search className={cn(
                  "h-4 w-4 transition-colors",
                  open ? "text-blue-500" : "text-gray-400"
                )} />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[550px] p-0 shadow-lg border border-gray-200" 
          align="start"
          sideOffset={4}
        >
          <div 
            ref={dropdownRef}
            className="max-h-96 overflow-y-auto overscroll-contain"
            role="listbox"
          >
            {/* Enhanced Search Status */}
            <div className="sticky top-0 p-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">
                    {statusText}
                  </span>
                  {pfItems.length >= 50 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      Showing first 50 results
                    </span>
                  )}
                </div>
                {searchQuery.length >= 2 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Zap className="h-3 w-3" />
                    <span>↑↓ navigate • ⏎ select • esc close</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {pfLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Searching platform items...</span>
                  <div className="text-xs text-gray-400 mt-1">Please wait...</div>
                </div>
              </div>
            )}

            {/* Enhanced Error State */}
            {error && (
              <div className="p-6 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-center mb-3">
                    <div className="bg-red-100 rounded-full p-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="text-sm font-medium text-red-800 mb-1">Search Error</div>
                  <p className="text-sm text-red-700 mb-4 leading-relaxed">
                    {error.message?.includes('ENETUNREACH') || error.message?.includes('connect') ? 
                      'Database connection failed. Please check your network connection or contact your administrator.' :
                      error.message || 'Failed to search platform items. Please try again.'
                    }
                  </p>
                  <Button
                    onClick={() => refetch()}
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    <Loader2 className="h-3 w-3 mr-1" />
                    Retry Search
                  </Button>
                </div>
              </div>
            )}

            {/* No Results */}
            {!pfLoading && !error && pfItems.length === 0 && searchQuery.length >= 2 && (
              <div className="p-8 text-center text-gray-500">
                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">No platform items found</div>
                <div className="text-xs text-gray-500 mb-4">
                  Try adjusting your search term or check the spelling
                </div>
                <div className="text-xs text-gray-400">
                  Searched for: <span className="font-mono bg-gray-100 px-2 py-1 rounded">"{searchQuery}"</span>
                </div>
              </div>
            )}

            {/* Search Results */}
            {pfItems.length > 0 && (
              <div className="py-1">
                {pfItems.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const isCurrentValue = inputValue === item.ItemName;
                  
                  return (
                    <div
                      key={`${item.ItemCode}-${index}`}
                      data-index={index}
                      className={cn(
                        "px-4 py-3 cursor-pointer border-l-3 transition-all duration-150 group",
                        isSelected 
                          ? "bg-blue-50 border-l-blue-500 text-blue-900 shadow-sm" 
                          : isCurrentValue 
                          ? "bg-green-50 border-l-green-500 text-green-900"
                          : "border-l-transparent hover:bg-gray-50 hover:border-l-gray-300"
                      )}
                      onClick={() => handleSelectPFItem(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div 
                            className={cn(
                              "font-medium truncate text-sm leading-5 transition-colors",
                              isSelected ? "text-blue-700" : "text-gray-900"
                            )}
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(item.ItemName, debouncedSearchQuery)
                            }}
                          />
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Code:</span>
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                {item.ItemCode}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">SAP:</span>
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                                {item.sap_id}
                              </span>
                            </span>
                            {item.taxrate && (
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Tax:</span>
                                <span className="text-green-600 font-medium">{item.taxrate}%</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-3">
                          {isCurrentValue && (
                            <div className="bg-green-100 rounded-full p-1">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                          )}
                          {isSelected && !isCurrentValue && (
                            <ChevronDown className="h-4 w-4 text-blue-600 rotate-[-90deg] transition-transform group-hover:rotate-[-85deg]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enhanced Instruction Footer */}
            {pfItems.length > 0 && (
              <div className="sticky bottom-0 px-3 py-2 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>↑↓ Navigate</span>
                    <span>⏎ Select</span>
                    <span>⎋ Close</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Fast search</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}