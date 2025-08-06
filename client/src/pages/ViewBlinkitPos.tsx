import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Package, Calendar, DollarSign, Hash } from "lucide-react";
import { useState } from "react";
import type { BlinkitPoHeader, BlinkitPoLines } from "@shared/schema";

type BlinkitPoWithLines = BlinkitPoHeader & { poLines: BlinkitPoLines[] };

export default function ViewBlinkitPos() {
  const [selectedPo, setSelectedPo] = useState<BlinkitPoWithLines | null>(null);

  const { data: pos, isLoading } = useQuery<BlinkitPoWithLines[]>({
    queryKey: ["/api/blinkit-pos"],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined) return '₹0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (selectedPo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Blinkit Purchase Order Details</h1>
            <p className="text-muted-foreground">PO Number: {selectedPo.po_number}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedPo(null)}>
            ← Back to List
          </Button>
        </div>

        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Purchase Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={getStatusColor(selectedPo.status)}>{selectedPo.status}</Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{selectedPo.total_items}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{selectedPo.total_quantity}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Basic Cost</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatCurrency(selectedPo.total_basic_cost)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Tax Amount</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{formatCurrency(selectedPo.total_tax_amount)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Net Amount</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-green-600">{formatCurrency(selectedPo.net_amount)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Cart Discount</p>
                <span className="font-semibold">{formatCurrency(selectedPo.cart_discount)}</span>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(selectedPo.created_at)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <span>{selectedPo.created_by}</span>
              </div>
            </div>
            
            {selectedPo.unique_hsn_codes && selectedPo.unique_hsn_codes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">HSN Codes</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPo.unique_hsn_codes.map((hsn, index) => (
                    <Badge key={index} variant="outline">{hsn}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items ({selectedPo.poLines.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>UPC</TableHead>
                    <TableHead>Grammage</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Basic Cost</TableHead>
                    <TableHead className="text-right">CGST%</TableHead>
                    <TableHead className="text-right">SGST%</TableHead>
                    <TableHead className="text-right">IGST%</TableHead>
                    <TableHead className="text-right">Tax Amount</TableHead>
                    <TableHead className="text-right">Landing Rate</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPo.poLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.line_number}</TableCell>
                      <TableCell className="font-mono text-sm">{line.item_code}</TableCell>
                      <TableCell className="max-w-xs truncate" title={line.product_description || ''}>
                        {line.product_description || 'N/A'}
                      </TableCell>
                      <TableCell>{line.hsn_code || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm">{line.product_upc || 'N/A'}</TableCell>
                      <TableCell>{line.grammage || 'N/A'}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.basic_cost_price)}</TableCell>
                      <TableCell className="text-right">{line.cgst_percent || '0'}%</TableCell>
                      <TableCell className="text-right">{line.sgst_percent || '0'}%</TableCell>
                      <TableCell className="text-right">{line.igst_percent || '0'}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.tax_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.landing_rate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.mrp)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(line.total_amount)}</TableCell>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Blinkit Purchase Orders</h1>
        <p className="text-muted-foreground mt-2">
          View and manage Blinkit purchase orders uploaded from Excel files
        </p>
      </div>

      {!pos || pos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Blinkit POs Found</p>
            <p className="text-muted-foreground text-center">
              Upload Excel files from Blinkit to see purchase orders here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pos.map((po) => (
            <Card key={po.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{po.po_number}</h3>
                      <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{po.total_items} items</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        <span>{po.total_quantity} qty</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(po.net_amount)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(po.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPo(po)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}