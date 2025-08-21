import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { masterAgentService, masterAgentKeys, type POCreationRequest } from "@/services/master-agent";
import { Activity, Database, Server, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";

/**
 * Master Agent Demo Component
 * Demonstrates the capabilities of the backend Master Agent
 */
export function MasterAgentDemo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeDemo, setActiveDemo] = useState<string>("health");

  // Health check query
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: masterAgentKeys.health(),
    queryFn: () => masterAgentService.healthCheck(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Platforms query with company filter
  const { data: platformsData, isLoading: platformsLoading } = useQuery({
    queryKey: masterAgentKeys.platforms(),
    queryFn: () => masterAgentService.getPlatforms(),
  });

  // Analytics query
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: masterAgentKeys.analytics(),
    queryFn: () => masterAgentService.getOrderAnalytics(),
  });

  // PO Creation mutation
  const createPOMutation = useMutation({
    mutationFn: (request: POCreationRequest) => masterAgentService.createPurchaseOrder(request),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Purchase order created successfully",
        });
        // Invalidate analytics to refresh
        queryClient.invalidateQueries({ queryKey: masterAgentKeys.analytics() });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create purchase order",
          variant: "destructive",
        });
      }
    },
  });

  // PO Validation mutation
  const validatePOMutation = useMutation({
    mutationFn: (request: POCreationRequest) => masterAgentService.validatePO(request),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Validation Success",
          description: result.message || "PO data is valid",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: result.error || "PO data is invalid",
          variant: "destructive",
        });
      }
    },
  });

  // Sample PO data for testing
  const samplePORequest: POCreationRequest = {
    po: {
      company: "Jivo Mart",
      po_number: `DEMO-${Date.now()}`,
      platform: 1,
      status: "Open",
      order_date: new Date().toISOString().split('T')[0],
      region: "North",
      state: "Delhi",
      city: "New Delhi",
      serving_distributor: "RK WORLD",
    },
    items: [
      {
        item_name: "Demo Product 1",
        quantity: 10,
        basic_rate: "100.00",
        gst_rate: "18.00",
        category: "Electronics",
      },
      {
        item_name: "Demo Product 2",
        quantity: 5,
        basic_rate: "200.00",
        gst_rate: "12.00",
        category: "Apparel",
      },
    ],
  };

  const handleTestPOCreation = () => {
    createPOMutation.mutate(samplePORequest);
  };

  const handleTestPOValidation = () => {
    validatePOMutation.mutate(samplePORequest);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "Healthy" : "Unhealthy"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Master Agent Demo</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive backend operations and analytics
          </p>
        </div>
        <Button onClick={() => refetchHealth()}>
          <Activity className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="health">Health Check</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="text-center py-4">Loading health status...</div>
              ) : healthData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(healthData.success)}
                      {getStatusBadge(healthData.success)}
                    </div>
                  </div>
                  
                  {healthData.data?.checks && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <div className="font-medium">Database</div>
                        {getStatusBadge(healthData.data.checks.database)}
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Server className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <div className="font-medium">Storage</div>
                        {getStatusBadge(healthData.data.checks.storage)}
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <div className="font-medium">Business Rules</div>
                        {getStatusBadge(healthData.data.checks.businessRules)}
                      </div>
                    </div>
                  )}
                  
                  {healthData.data?.timestamp && (
                    <div className="text-sm text-muted-foreground">
                      Last checked: {new Date(healthData.data.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-red-500">Failed to load health status</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              {platformsLoading ? (
                <div className="text-center py-4">Loading platforms...</div>
              ) : platformsData?.success ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground mb-4">
                    Total platforms: {platformsData.metadata?.totalPlatforms || 0}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {platformsData.data?.map((platform: any) => (
                      <Badge key={platform.id} variant="outline" className="justify-center p-2">
                        {platform.pf_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-red-500">
                  {platformsData?.error || "Failed to load platforms"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-4">Loading analytics...</div>
              ) : analyticsData?.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsData.data?.totalOrders || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{analyticsData.data?.totalValue?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.keys(analyticsData.data?.ordersByPlatform || {}).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Platforms</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {Object.keys(analyticsData.data?.ordersByStatus || {}).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Status Types</div>
                    </div>
                  </div>

                  {analyticsData.data?.ordersByStatus && (
                    <div>
                      <h3 className="font-medium mb-2">Orders by Status</h3>
                      <div className="space-y-1">
                        {Object.entries(analyticsData.data.ordersByStatus).map(([status, count]) => (
                          <div key={status} className="flex justify-between">
                            <span>{status}</span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-red-500">
                  {analyticsData?.error || "Failed to load analytics"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>PO Validation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Test PO validation without creating an order
                </p>
                <Button 
                  onClick={handleTestPOValidation}
                  disabled={validatePOMutation.isPending}
                  className="w-full"
                >
                  {validatePOMutation.isPending ? "Validating..." : "Validate Sample PO"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PO Creation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create a sample purchase order using the Master Agent
                </p>
                <Button 
                  onClick={handleTestPOCreation}
                  disabled={createPOMutation.isPending}
                  className="w-full"
                >
                  {createPOMutation.isPending ? "Creating..." : "Create Sample PO"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample PO Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(samplePORequest, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}