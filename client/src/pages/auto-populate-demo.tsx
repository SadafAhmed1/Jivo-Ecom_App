import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AutoPopulateWidget } from '@/components/ui/auto-populate-widget';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AutoPopulateDemo() {
  const [populatedData, setPopulatedData] = useState<{
    type: string;
    data: any;
    source: string;
  } | null>(null);

  const handleDataPopulated = (data: any, source: string, type: string) => {
    setPopulatedData({ type, data, source });
  };

  const clearData = () => {
    setPopulatedData(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Auto-Populate Demo</h1>
        <p className="text-gray-600">
          Demonstrate auto-population from master data tables
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Secondary Sales Auto-Populate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Secondary Sales</CardTitle>
            <CardDescription>
              Search from SC_* tables (Amazon, Zepto, Blinkit, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoPopulateWidget
              uploadType="secondary-sales"
              onDataPopulated={(data, source) => handleDataPopulated(data, source, 'secondary-sales')}
              platforms={['Amazon', 'Zepto', 'Blinkit', 'Swiggy', 'JioMart', 'BigBasket', 'Flipkart']}
              searchLabel="Search Sales Records"
              placeholder="Enter order ID, SKU, or item name..."
            />
          </CardContent>
        </Card>

        {/* Inventory Auto-Populate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory</CardTitle>
            <CardDescription>
              Search from INV_* tables (FlipKart, JioMart, Blinkit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoPopulateWidget
              uploadType="inventory"
              onDataPopulated={(data, source) => handleDataPopulated(data, source, 'inventory')}
              platforms={['FlipKart', 'JioMart', 'Blinkit']}
              searchLabel="Search Inventory"
              placeholder="Enter SKU, product name, or listing ID..."
            />
          </CardContent>
        </Card>

        {/* Purchase Orders Auto-Populate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Orders</CardTitle>
            <CardDescription>
              Search from po_master, po_lines, pf_po tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutoPopulateWidget
              uploadType="po"
              onDataPopulated={(data, source) => handleDataPopulated(data, source, 'po')}
              platforms={['Flipkart', 'Zepto', 'CityMall', 'Blinkit', 'Swiggy']}
              searchLabel="Search Purchase Orders"
              placeholder="Enter PO number, series, or item code..."
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Auto-Populated Data
            {populatedData && (
              <button
                onClick={clearData}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear Data
              </button>
            )}
          </CardTitle>
          <CardDescription>
            Data retrieved from master tables will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {populatedData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Type: {populatedData.type}</Badge>
                <Badge variant="outline">Source: {populatedData.source}</Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Data Preview:</h4>
                <pre className="text-xs text-gray-700 overflow-auto max-h-96">
                  {JSON.stringify(populatedData.data, null, 2)}
                </pre>
              </div>

              <div className="text-sm text-gray-600">
                <p>
                  <strong>Next Steps:</strong> This data can now be used to pre-populate 
                  edit forms, create new records with similar data, or validate against 
                  existing records during upload processes.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No data populated yet. Use the search widgets above to find and populate data.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Secondary Sales</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Searches SC_*_Daily and SC_*_Range tables</li>
                <li>• Looks for order_id, sku, item_name matches</li>
                <li>• Covers Amazon, Zepto, Blinkit, Swiggy, etc.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Inventory</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Searches INV_*_Daily and INV_*_Range tables</li>
                <li>• Looks for sku, product_name, listing_id matches</li>
                <li>• Covers FlipKart, JioMart, Blinkit inventory</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Purchase Orders</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Searches po_master, po_lines, pf_po tables</li>
                <li>• Looks for vendor_po_number, series, item_code</li>
                <li>• Covers both master PO and platform-specific POs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}