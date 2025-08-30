import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface PFItemDetail {
  ItemName: string;
  ItemCode: string;
  pf_id: number;
  sap_id: string;
  actual_itemcode?: string;
  taxrate?: number;
}

interface SearchableItemInputProps {
  value: string;
  onChange: (value: string, pfItem?: PFItemDetail) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableItemInput({ 
  value, 
  onChange, 
  placeholder = "Type item name or code to search...",
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

  // Fetch PF item names for search dropdown with better caching and error handling
  const { data: itemNamesResponse, isLoading: pfLoading, error, refetch } = useQuery({
    queryKey: ['pf-items', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        return [];
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const response = await fetch(`/api/pf-items?search=${encodeURIComponent(debouncedSearchQuery)}`, {
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

  const pfItems = Array.isArray(itemNamesResponse) ? itemNamesResponse : []; // Results already limited by backend

  // Function to format SAP code to shorter format (SL000005 instead of SL0000153)
  const formatSapCode = (sapCode: string) => {
    if (!sapCode) return sapCode;
    
    // Match pattern like "SL0000153" and convert to "SL000005" format
    const match = sapCode.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const prefix = match[1]; // "SL"
      const number = parseInt(match[2]); // 153
      // Format to 6 digits total: 2 letter prefix + 6 digits = SL000005
      const shortNumber = number.toString().slice(-6).padStart(6, '0');
      return `${prefix}${shortNumber}`;
    }
    
    return sapCode; // Return original if doesn't match expected pattern
  };

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

  const handleSelectPFItem = async (selectedItem: PFItemDetail) => {
    setIsSelecting(true);
    setInputValue(selectedItem.ItemName); // Show pf_itemname in input
    setSelectedIndex(-1);
    setOpen(false);
    
    // Send pf_itemname as first parameter and selectedItem as second parameter
    onChange(selectedItem.ItemName, selectedItem);
    setIsSelecting(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setSearchQuery(newValue);
    setSelectedIndex(-1);
    setOpen(newValue.length >= 1);
    onChange(newValue);
  };


  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < pfItems.length - 1 ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
        break;
    }
  };

  return (
    <div className="relative">
      {/* Simple Input Field */}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pr-10", className)}
        onFocus={() => setOpen(inputValue.length >= 1)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />
      
      {/* Icons */}
      <div className="absolute right-0 top-0 h-full flex items-center pr-3">
        {isSelecting || pfLoading ? (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Suggestions below input */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Search Status */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {pfLoading ? "Searching platform items..." : 
                 error ? "Search error" :
                 pfItems.length > 0 ? `${pfItems.length} platform item${pfItems.length === 1 ? '' : 's'} found` :
                 searchQuery.length >= 2 ? "No items found" : "Start typing to search items"}
              </span>
              {searchQuery.length >= 2 && (
                <span className="text-xs text-gray-400">
                  {searchQuery.length < 2 ? 'Min 2 chars' : '↑↓ navigate, ↵ select'}
                </span>
              )}
            </div>
          </div>

          {/* Loading State */}
          {pfLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Searching platform items...</span>
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
                  {error.message || 'Failed to search platform items. Please try again.'}
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
          {!pfLoading && !error && pfItems.length === 0 && searchQuery.length >= 2 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-medium">No items found</div>
              <div className="text-xs mt-1">Try different search terms</div>
            </div>
          )}

          {/* Search Results */}
          {pfItems.length > 0 && (
            <div className="py-2">
              {pfItems.map((item, index) => {
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
                    onClick={() => handleSelectPFItem(item)}
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
                        <div className="text-xs text-gray-500 mt-1">
                          <div>Code: {highlightMatch(item.ItemCode, debouncedSearchQuery)} | SAP: {formatSapCode(item.sap_id)}</div>
                        </div>
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
          {pfItems.length > 0 && (
            <div className="p-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-center">
              Use arrow keys to navigate • Enter to select • Esc to close
            </div>
          )}
        </div>
      )}
    </div>
  );
}