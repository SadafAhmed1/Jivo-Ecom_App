import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  Download, 
  RefreshCw, 
  X, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PfMst, PfOrderItems } from "@shared/schema";

interface POWithDetails {
  id: number;
  po_number: string;
  status: string;
  order_date: Date;
  expiry_date: Date | null;
  city: string;
  state: string;
  serving_distributor: string | null;
  platform: PfMst;
  orderItems: PfOrderItems[];
}

interface PaginatedPOResponse {
  data: POWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

interface POStats {
  total: number;
  open: number;
  closed: number;
  cancelled: number;
}

export function EnhancedPOList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  
  const pageSize = 10;

  // Fetch PO statistics
  const { data: stats } = useQuery<POStats>({
    queryKey: ["/api/pos/stats"]
  });

  // Fetch paginated POs
  const { data: posResponse, isLoading, refetch } = useQuery<PaginatedPOResponse>({
    queryKey: ["/api/pos", currentPage, statusFilter, platformFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (platformFilter && platformFilter !== "all") {
        params.append("platform", platformFilter);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await apiRequest("GET", `/api/pos?${params.toString()}`);
      return response.json();
    }
  });

  // Fetch platforms for filter
  const { data: platforms = [] } = useQuery<PfMst[]>({
    queryKey: ["/api/platforms"]
  });

  const deletePOMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/pos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/stats"] });
      toast({
        title: "Success",
        description: "Purchase order deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive"
      });
    }
  });

  const handleView = (po: POWithDetails) => {
    setLocation(`/po-details/${po.id}`);
  };

  const handleEdit = (po: POWithDetails) => {
    setLocation(`/po-edit/${po.id}`);
  };

  const handleDelete = (po: POWithDetails) => {
    if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
      deletePOMutation.mutate(po.id);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Purchase orders refreshed successfully"
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleViewMore = () => {
    if (posResponse && currentPage < posResponse.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPlatformFilter("all");
    setCurrentPage(1);
    setShowFilter(false);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, platformFilter]);

  const pos = posResponse?.data || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return <Clock className="h-3 w-3" />;
      case 'closed': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total POs</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats?.total || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Open POs</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats?.open || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Closed POs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.closed || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Cancelled POs</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats?.cancelled || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main PO List Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Purchase Orders</span>
              <Badge variant="secondary" className="ml-2">
                {posResponse?.total || 0} total
              </Badge>
            </CardTitle>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search POs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilter(!showFilter)}
                className={showFilter ? "bg-blue-50 border-blue-300" : ""}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>

              {/* Refresh */}
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="platform-filter">Platform</Label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      {platforms.map(platform => (
                        <SelectItem key={platform.id} value={platform.pf_name}>
                          {platform.pf_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {pos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No purchase orders found</p>
              {(statusFilter !== "all" || platformFilter !== "all" || searchTerm) && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">PO Number</th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Platform</th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Order Date</th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Location</th>
                    <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">Items</th>
                    <th className="text-right p-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {po.po_number}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-medium">
                          {po.platform.pf_name}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(po.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(po.status)}
                          {po.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {format(new Date(po.order_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        {po.city}, {po.state}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {po.orderItems.length} items
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(po)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(po)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(po)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {posResponse && posResponse.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, posResponse.total)} of {posResponse.total} results
                </p>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {posResponse.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === posResponse.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* View More Button (for mobile/additional loading) */}
              {currentPage < posResponse.totalPages && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={handleViewMore}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "View More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}