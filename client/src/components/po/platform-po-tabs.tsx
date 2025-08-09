import { useState } from "react";
import { Plus, List, BarChart3, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformPOForm } from "./platform-po-form";
import { POListView } from "./po-list-view";
import { OrderItemsListView } from "./order-items-list-view";
import { NewPODropdown } from "./new-po-dropdown";
import { UnifiedUploadComponent } from "./unified-upload-component";

export function PlatformPOTabs() {
  const [activeTab, setActiveTab] = useState("list");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="border-b border-blue-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Platform Purchase Orders
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create, manage, and track purchase orders for e-commerce platforms
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <NewPODropdown 
                onCreatePO={() => {
                  setShowCreateForm(true);
                  setShowUploadModal(false);
                }}
                onUploadPO={() => {
                  setShowUploadModal(true);
                  setShowCreateForm(false);
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
          {!showUploadModal && !showCreateForm && (
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
                  value="analytics" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Order Items</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>
          )}

          <CardContent className="p-0">
            {!showUploadModal && !showCreateForm && (
              <>
                <TabsContent value="list" className="mt-0">
                  <div className="p-6">
                    <POListView />
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <div className="p-6">
                    <OrderItemsListView />
                  </div>
                </TabsContent>
              </>
            )}

            {showUploadModal && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadModal(false)}
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Upload Purchase Order</h3>
                  </div>
                </div>
                <UnifiedUploadComponent 
                  onComplete={() => {
                    setShowUploadModal(false);
                    setActiveTab("list");
                  }}
                />
              </div>
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
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Purchase Order</h3>
                  </div>
                </div>
                <PlatformPOForm />
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}