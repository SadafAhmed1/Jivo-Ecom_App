import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  ShoppingCart
} from "lucide-react";
import { Link } from "wouter";
import type { FlipkartGroceryPO, FlipkartGroceryPoLines } from "@/types";

export default function FlipkartGroceryPODetails() {
  const { id } = useParams();

  const { data: po, isLoading, error } = useQuery<FlipkartGroceryPO>({
    queryKey: [`/api/flipkart-grocery-pos/${id}`],
  });

  const { data: lines, isLoading: linesLoading } = useQuery<FlipkartGroceryPoLines[]>({
    queryKey: [`/api/flipkart-grocery-pos/${id}/lines`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">PO Not Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The requested purchase order could not be found.
              </p>
              <div className="mt-6">
                <Link href="/flipkart-grocery-pos">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to POs
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Open': 'default',
      'Closed': 'secondary',
      'Cancelled': 'destructive',
      'Pending': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/flipkart-grocery-pos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">PO #{po.po_number}</h1>
                <p className="text-muted-foreground">
                  Flipkart Grocery Purchase Order Details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(po.status)}
              <Badge variant="outline">{po.category}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* PO Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{po.total_quantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Taxable Value</p>
                <p className="text-2xl font-bold">₹{parseFloat(po.total_taxable_value || '0').toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tax Amount</p>
                <p className="text-2xl font-bold">₹{parseFloat(po.total_tax_amount || '0').toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold">₹{parseFloat(po.total_amount || '0').toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PO Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{po.supplier_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact</p>
              <p>{po.supplier_contact || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p>{po.supplier_email || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
              <p className="font-mono text-sm">{po.supplier_gstin || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm leading-relaxed">{po.supplier_address || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Order Date</p>
              <p className="font-medium">{new Date(po.order_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">PO Expiry</p>
              <p>{po.po_expiry_date ? new Date(po.po_expiry_date).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mode of Payment</p>
              <p>{po.mode_of_payment || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Credit Term</p>
              <p>{po.credit_term || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Ref ID</p>
              <p className="font-mono text-sm">{po.contract_ref_id || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm leading-relaxed">{po.billed_to_address || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
              <p className="font-mono text-sm">{po.billed_to_gstin || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm leading-relaxed">{po.shipped_to_address || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">GSTIN</p>
              <p className="font-mono text-sm">{po.shipped_to_gstin || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>
            {linesLoading ? "Loading line items..." : `${lines?.length || 0} items in this purchase order`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : lines && lines.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line: FlipkartGroceryPoLines) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{line.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {line.fsn_isbn ? `FSN: ${line.fsn_isbn}` : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{line.brand || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{line.hsn_code || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div>{line.quantity} {line.uom}</div>
                          <div className="text-xs text-muted-foreground">
                            Pending: {line.pending_quantity}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>₹{parseFloat(line.supplier_price || '0').toFixed(2)}</TableCell>
                      <TableCell>₹{parseFloat(line.tax_amount || '0').toFixed(2)}</TableCell>
                      <TableCell className="font-medium">₹{parseFloat(line.total_amount || '0').toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No line items found</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
}