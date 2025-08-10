import { useState } from "react";
import { Plus, List, BarChart3, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DistributorPOForm } from "./distributor-po-form";
import { DistributorPOListView } from "./distributor-po-list-view";
import { DistributorOrderItemsListView } from "./distributor-order-items-list-view";
import { NewDistributorPODropdown } from "./new-distributor-po-dropdown";

export function DistributorPOTabs() {
  const [activeTab, setActiveTab] = useState("list");
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="border-b border-blue-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Distributor Purchase Orders
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create and manage purchase orders for distributors
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <NewDistributorPODropdown 
                onCreatePO={() => {
                  setShowCreateForm(true);
                }}
              />
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-300">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content with Tabs */}
      <Card className="shadow-lg border-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!showCreateForm && (
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <TabsList className="grid w-full grid-cols-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md rounded-xl">
                <TabsTrigger 
                  value="list" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <List className="h-4 w-4" />
                  <span>View POs</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="order-items" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Order Items</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
          )}

          <CardContent className="p-0">
            {!showCreateForm && (
              <>
                <TabsContent value="list" className="mt-0">
                  <div className="p-6">
                    <DistributorPOListView />
                  </div>
                </TabsContent>

                <TabsContent value="order-items" className="mt-0">
                  <div className="p-6">
                    <DistributorOrderItemsListView />
                  </div>
                </TabsContent>
              </>
            )}

            {showCreateForm && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Distributor Purchase Order</h3>
                  </div>
                </div>
                <DistributorPOForm />
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}