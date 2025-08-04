import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, Search, Eye, Edit, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PfPo, PfMst, PfOrderItems } from "@shared/schema";

interface POWithDetails extends PfPo {
  platform: PfMst;
  orderItems: PfOrderItems[];
}

export default function POList() {
  const { data: pos = [], isLoading } = useQuery<POWithDetails[]>({
    queryKey: ["/api/pos"]
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'expired': return 'destructive';
      case 'duplicate': return 'outline';
      default: return 'default';
    }
  };

  const calculatePOTotals = (items: PfOrderItems[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => {
      return sum + (parseFloat(item.landing_rate) * item.quantity);
    }, 0);
    return { totalQuantity, totalValue };
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-blue-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Purchase Orders
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">View and manage all platform purchase orders</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search POs..." 
                className="w-64 pl-12 pr-4 py-3 border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-md focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-200 outline-none"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            {/* Create New PO */}
            <Link href="/platform-po">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg px-6 py-3 text-white font-medium rounded-xl">
                <Plus className="mr-2 h-5 w-5" />
                Create New PO
              </Button>
            </Link>
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {pos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders Found</h3>
                <p className="text-gray-600 text-center mb-4">
                  You haven't created any purchase orders yet. Create your first PO to get started.
                </p>
                <Link href="/platform-po">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First PO
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pos.map((po) => {
                const { totalQuantity, totalValue } = calculatePOTotals(po.orderItems);
                
                return (
                  <Card key={po.id} className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{po.po_number}</CardTitle>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{po.platform.pf_name}</p>
                          </div>
                          <Badge 
                            variant={getStatusBadgeVariant(po.status)}
                            className="px-3 py-1 text-xs font-semibold"
                          >
                            {po.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 border-blue-200">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-green-50 border-green-200">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order Date</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(po.order_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Expiry Date</p>
                          <p className="text-sm text-gray-600">
                            {po.expiry_date ? format(new Date(po.expiry_date), 'MMM dd, yyyy') : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-600">{po.city}, {po.state}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Distributor</p>
                          <p className="text-sm text-gray-600">
                            {po.serving_distributor || 'Not assigned'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Items</p>
                          <p className="text-lg font-semibold text-primary">{po.orderItems.length}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Quantity</p>
                          <p className="text-lg font-semibold text-primary">{totalQuantity}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Total Value</p>
                          <p className="text-lg font-semibold text-primary">₹{totalValue.toFixed(2)}</p>
                        </div>
                      </div>

                      {po.orderItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-2">Items Preview</p>
                          <div className="space-y-1">
                            {po.orderItems.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.item_name}</span>
                                <span className="text-gray-900">Qty: {item.quantity}</span>
                              </div>
                            ))}
                            {po.orderItems.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{po.orderItems.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}