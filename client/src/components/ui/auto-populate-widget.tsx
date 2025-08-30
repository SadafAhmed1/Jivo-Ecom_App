import React, { useState } from 'react';
import { Search, Database, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutoPopulate } from '@/hooks/use-auto-populate';

interface AutoPopulateWidgetProps {
  uploadType: 'secondary-sales' | 'inventory' | 'po';
  onDataPopulated: (data: any, source: string) => void;
  className?: string;
  platforms?: string[];
  placeholder?: string;
  searchLabel?: string;
}

export function AutoPopulateWidget({
  uploadType,
  onDataPopulated,
  className = '',
  platforms = [],
  placeholder,
  searchLabel,
}: AutoPopulateWidgetProps) {
  const [identifier, setIdentifier] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const { isLoading, error, data, source, message, autoPopulate, clearData } = useAutoPopulate();

  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    switch (uploadType) {
      case 'secondary-sales':
        return 'Enter order ID, SKU, or item name...';
      case 'inventory':
        return 'Enter SKU, product name, or listing ID...';
      case 'po':
        return 'Enter PO number, series, or item code...';
      default:
        return 'Enter search term...';
    }
  };

  const getSearchLabel = () => {
    if (searchLabel) return searchLabel;
    
    switch (uploadType) {
      case 'secondary-sales':
        return 'Search Secondary Sales';
      case 'inventory':
        return 'Search Inventory';
      case 'po':
        return 'Search Purchase Orders';
      default:
        return 'Search Records';
    }
  };

  const handleSearch = async () => {
    if (!identifier.trim()) return;
    await autoPopulate(uploadType, identifier, selectedPlatform === 'all' ? undefined : selectedPlatform);
  };

  const handleUseData = () => {
    if (data && source) {
      onDataPopulated(data, source);
      setIdentifier('');
      clearData();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const formatUploadType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className={`border-2 border-dashed border-blue-300 bg-blue-50/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Auto-Populate from Master Data</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Search and populate from existing {formatUploadType(uploadType)} records in the database
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">{getSearchLabel()}</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholderText()}
                  className="pl-10 h-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {platforms.length > 0 && (
              <div className="w-32">
                <Label className="text-sm font-medium text-gray-700">Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="mt-1 h-10">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Platform</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading || !identifier.trim()}
            className="w-full h-10"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Master Data
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && source && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Source: {source}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleUseData}
                    size="sm"
                    className="h-8"
                  >
                    Use This Data
                  </Button>
                  <Button
                    onClick={clearData}
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Preview of data */}
              <div className="mt-3 p-2 bg-white rounded border text-xs text-gray-600">
                <div className="font-medium mb-1">Preview:</div>
                <div className="space-y-1">
                  {Object.entries(data).slice(0, 5).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium">{key}:</span>
                      <span className="truncate">{String(value).slice(0, 50)}...</span>
                    </div>
                  ))}
                  {Object.keys(data).length > 5 && (
                    <div className="text-gray-500 italic">
                      ... and {Object.keys(data).length - 5} more fields
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!data && !error && !isLoading && identifier && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Enter a search term and click "Search Master Data" to find existing records.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default AutoPopulateWidget;