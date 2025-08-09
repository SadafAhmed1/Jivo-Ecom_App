import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, Calendar, Hash, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import type { CityMallPoHeader, CityMallPoLines } from "@shared/schema";

interface CityMallPoWithLines extends CityMallPoHeader {
  poLines: CityMallPoLines[];
}

export default function CityMallPOs() {
  const { data: cityMallPos = [], isLoading, error } = useQuery<CityMallPoWithLines[]>({
    queryKey: ["/api/city-mall-pos"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="text-green-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Mall Purchase Orders</h1>
            <p className="text-gray-600">Loading purchase orders...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Package className="text-red-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Mall Purchase Orders</h1>
            <p className="text-red-600">Error loading purchase orders</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'default';
      case 'closed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="text-green-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Mall Purchase Orders</h1>
            <p className="text-gray-600">Manage and track City Mall purchase orders</p>
          </div>
        </div>
        
        <Link href="/unified-po-upload">
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Upload New PO
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {cityMallPos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Total POs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{cityMallPos.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Total Items</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {cityMallPos.reduce((sum, po) => sum + (po.total_quantity || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(cityMallPos.reduce((sum, po) => sum + Number(po.total_amount || 0), 0))}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Avg. PO Value</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(cityMallPos.reduce((sum, po) => sum + Number(po.total_amount || 0), 0) / cityMallPos.length)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PO List */}
      {cityMallPos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders Found</h3>
            <p className="text-gray-600 mb-4">Upload a CSV file to get started with City Mall purchase orders.</p>
            <Link href="/unified-po-upload">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Upload First PO
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cityMallPos.map((po) => (
            <Card key={po.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{po.po_number}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(po.created_at || '')}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(po.status || '')}>
                    {po.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Items:</span>
                    <p className="font-semibold">{(po.total_quantity || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>
                    <p className="font-semibold">{formatCurrency(po.total_amount || 0)}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">HSN Codes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {po.unique_hsn_codes?.slice(0, 3).map((hsn, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {hsn}
                      </Badge>
                    ))}
                    {(po.unique_hsn_codes?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(po.unique_hsn_codes?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/city-mall-pos/${po.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}