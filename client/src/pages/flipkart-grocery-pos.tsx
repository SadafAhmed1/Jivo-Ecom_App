import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Eye, 
  Search, 
  Package, 
  Calendar,
  User,
  DollarSign
} from "lucide-react";
import { Link } from "wouter";

export default function FlipkartGroceryPOs() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pos, isLoading } = useQuery({
    queryKey: ['/api/flipkart-grocery-pos'],
  });

  const filteredPOs = pos?.filter((po: any) => 
    po.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            <div>
              <h1 className="text-3xl font-bold">Flipkart Grocery POs</h1>
              <p className="text-muted-foreground">
                View and manage imported Flipkart grocery purchase orders
              </p>
            </div>
            <Link href="/flipkart-grocery-upload">
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
                placeholder="Search by PO number, supplier, or category..."
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
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No purchase orders</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery ? "No POs match your search criteria." : "Get started by importing a Flipkart grocery PO."}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Link href="/flipkart-grocery-upload">
                    <Button>
                      <Package className="mr-2 h-4 w-4" />
                      Import First PO
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po: any) => (
                    <TableRow key={po.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {po.po_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{po.supplier_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {po.supplier_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{po.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(po.order_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">₹{parseFloat(po.total_amount || '0').toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(po.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{po.created_by}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(po.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/flipkart-grocery-po/${po.id}`}>
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