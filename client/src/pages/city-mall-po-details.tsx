import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, ArrowLeft, Calendar, Hash, DollarSign, TrendingUp, FileText } from "lucide-react";
import { Link } from "wouter";
import type { CityMallPoHeader, CityMallPoLines } from "@shared/schema";

interface CityMallPoWithLines extends CityMallPoHeader {
  poLines: CityMallPoLines[];
}

export default function CityMallPoDetails() {
  const [, params] = useRoute("/city-mall-pos/:id");
  const poId = params?.id ? parseInt(params.id) : undefined;

  const { data: po, isLoading, error } = useQuery<CityMallPoWithLines>({
    queryKey: ["/api/city-mall-pos", poId],
    enabled: !!poId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Package className="text-red-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Mall PO Details</h1>
            <p className="text-red-600">Purchase order not found</p>
          </div>
        </div>
        <Link href="/city-mall-pos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to POs
          </Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="text-green-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">City Mall PO: {po.po_number}</h1>
            <p className="text-gray-600">Purchase order details and line items</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant(po.status || '')}>
            {po.status}
          </Badge>
          <Link href="/city-mall-pos">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to POs
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">PO Number</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{po.po_number}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Total Items</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{(po.total_quantity || 0).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Total Value</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(po.total_amount || 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-gray-600">Created</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatDate(po.created_at || '')}</p>
          </CardContent>
        </Card>
      </div>

      {/* PO Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Purchase Order Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">PO Number</label>
                <p className="font-semibold">{po.po_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  <Badge variant={getStatusVariant(po.status || '')}>{po.status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Created By</label>
                <p className="font-semibold">{po.created_by || 'System'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Uploaded By</label>
                <p className="font-semibold">{po.uploaded_by || 'System'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Created Date</label>
                <p className="font-semibold">{formatDate(po.created_at || '')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="font-semibold">{formatDate(po.updated_at || '')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp size={20} />
              <span>Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Total Quantity</label>
              <p className="text-xl font-bold">{(po.total_quantity || 0).toLocaleString()}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Base Amount</label>
              <p className="text-lg font-semibold">{formatCurrency(po.total_base_amount || 0)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">IGST Amount</label>
              <p className="text-lg font-semibold">{formatCurrency(po.total_igst_amount || 0)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">CESS Amount</label>
              <p className="text-lg font-semibold">{formatCurrency(po.total_cess_amount || 0)}</p>
            </div>

            <div className="pt-2 border-t">
              <label className="text-sm font-medium text-gray-600">Total Amount</label>
              <p className="text-xl font-bold text-green-600">{formatCurrency(po.total_amount || 0)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Unique HSN Codes</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {po.unique_hsn_codes?.map((hsn, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {hsn}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package size={20} />
            <span>Line Items ({po.poLines?.length || 0})</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown of all items in this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Article ID</TableHead>
                  <TableHead>Article Name</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Base Amount</TableHead>
                  <TableHead className="text-right">IGST %</TableHead>
                  <TableHead className="text-right">IGST ₹</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.poLines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.line_number}</TableCell>
                    <TableCell className="font-mono text-sm">{line.article_id}</TableCell>
                    <TableCell className="max-w-xs truncate" title={line.article_name || ''}>
                      {line.article_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {line.hsn_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {(line.quantity || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.mrp || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.base_cost_price || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(line.base_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(line.igst_percent || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.igst_amount || 0)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(line.total_amount || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {line.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}