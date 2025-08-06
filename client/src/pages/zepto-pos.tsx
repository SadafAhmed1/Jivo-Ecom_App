import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Search, Package, Calendar, MapPin, Truck, Eye } from "lucide-react";

interface ZeptoPoHeader {
  id: number;
  po_number: string;
  status: string;
  total_quantity: number;
  total_cost_value: string;
  total_tax_amount: string;
  total_amount: string;
  unique_brands: string[];
  created_by: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  poLines: Array<{
    id: number;
    po_header_id: number;
    line_number: number;
    po_number: string;
    sku: string;
    brand: string;
    sku_id: string;
    sap_id: string;
    hsn_code: string;
    ean_no: string;
    po_qty: number;
    asn_qty: number;
    grn_qty: number;
    remaining_qty: number;
    cost_price: string;
    cgst: string;
    sgst: string;
    igst: string;
    cess: string;
    mrp: string;
    total_value: string;
    status: string;
    created_by: string;
    created_at: string;
  }>;
}

export default function ZeptoPOs() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pos = [], isLoading } = useQuery<ZeptoPoHeader[]>({
    queryKey: ["/api/zepto-pos"],
  });

  const filteredPOs = pos.filter((po) =>
    po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.unique_brands.some(brand => brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    po.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Open': 'bg-green-100 text-green-800 border-green-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
      <Badge 
        variant="outline" 
        className={statusColors[status as keyof typeof statusColors] || 'bg-blue-100 text-blue-800 border-blue-200'}
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Zepto POs</h1>
              <p className="text-muted-foreground">
                View and manage imported Zepto purchase orders
              </p>
            </div>
            <Link href="/zepto-upload">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Import New PO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by PO number, brand, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PO List */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
              <CardDescription>
                {isLoading ? "Loading purchase orders..." : "Click on any PO to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredPOs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No purchase orders found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "No POs match your search criteria." : "Import your first Zepto PO to get started."}
                  </p>
                  {!searchQuery && (
                    <Link href="/zepto-upload">
                      <Button className="mt-4">
                        <Package className="mr-2 h-4 w-4" />
                        Import New PO
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Brands</TableHead>
                        <TableHead>Total Quantity</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Line Items</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPOs.map((po) => (
                        <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium">{po.po_number}</div>
                            <div className="text-sm text-muted-foreground">
                              Created by: {po.created_by || 'System'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(po.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {po.unique_brands.slice(0, 3).map((brand, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {brand}
                                </Badge>
                              ))}
                              {po.unique_brands.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{po.unique_brands.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{po.total_quantity.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{Number(po.total_amount).toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">
                              Tax: ₹{Number(po.total_tax_amount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{po.poLines.length} items</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {new Date(po.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(po.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/zepto-pos/${po.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}