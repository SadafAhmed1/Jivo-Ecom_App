import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ItemMaster, InsertItemMaster } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertItemMasterSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, Edit, Trash } from "lucide-react";

export default function ItemManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<ItemMaster | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for items with search
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["/api/items", searchTerm],
    queryFn: () => api.items.getAll(searchTerm || undefined),
  });

  // Create form
  const createForm = useForm<InsertItemMaster>({
    resolver: zodResolver(insertItemMasterSchema),
    defaultValues: {
      itemCode: "",
      itemName: "",
      itmsGrpNam: "",
      uType: "",
      variety: "",
      subGroup: "",
      uBrand: "",
      uom: "",
      unitSize: "",
      uIsLitre: "",
      uTaxRate: "",
    },
  });

  // Edit form
  const editForm = useForm<InsertItemMaster>({
    resolver: zodResolver(insertItemMasterSchema),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: InsertItemMaster) => api.items.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Success", description: "Item created successfully" });
      setShowCreateDialog(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create item",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertItemMaster> }) => 
      api.items.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Success", description: "Item updated successfully" });
      setShowEditDialog(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update item",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.items.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Success", description: "Item deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete item",
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (item: ItemMaster) => {
    setEditingItem(item);
    editForm.reset({
      itemCode: item.itemCode,
      itemName: item.itemName,
      itmsGrpNam: item.itmsGrpNam || "",
      uType: item.uType || "",
      variety: item.variety || "",
      subGroup: item.subGroup || "",
      uBrand: item.uBrand || "",
      uom: item.uom || "",
      unitSize: item.unitSize?.toString() || "",
      uIsLitre: item.uIsLitre || "",
      uTaxRate: item.uTaxRate?.toString() || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMutation.mutate(id);
    }
  };

  const onCreateSubmit = (data: InsertItemMaster) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertItemMaster) => {
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, data });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Item Management</span>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to the master inventory.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="itemCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Code</FormLabel>
                          <FormControl>
                            <Input placeholder="FG0000087" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="COLD PRESS 5 LTR + 500 MLS EXTRA LIGHT OLIVE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="itmsGrpNam"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Group</FormLabel>
                            <FormControl>
                              <Input placeholder="5 PCS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="uType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <Input placeholder="FINISHED" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="variety"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variety</FormLabel>
                            <FormControl>
                              <Input placeholder="LEGACY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="subGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sub Group</FormLabel>
                            <FormControl>
                              <Input placeholder="CANOLA COLD PRESS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="uBrand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <Input placeholder="JIVO" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="uom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UOM</FormLabel>
                            <FormControl>
                              <Input placeholder="PCS" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={createForm.control}
                        name="unitSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Size</FormLabel>
                            <FormControl>
                              <Input placeholder="5.000000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="uIsLitre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Is Litre</FormLabel>
                            <FormControl>
                              <Input placeholder="Y" maxLength={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createForm.control}
                        name="uTaxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Rate</FormLabel>
                            <FormControl>
                              <Input placeholder="5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Item
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage your item master database with full CRUD operations
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search items by code, name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Items Table */}
          {error ? (
            <div className="text-center text-red-600 py-4">
              Error loading items: {error.message}
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Unit Size</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No items found. {searchTerm && "Try a different search term or"} Add your first item to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.itemCode}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.itemName}</TableCell>
                        <TableCell>{item.uBrand || "-"}</TableCell>
                        <TableCell>{item.uom || "-"}</TableCell>
                        <TableCell>{item.unitSize || "-"}</TableCell>
                        <TableCell>{item.uTaxRate || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item information.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="uBrand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="uom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UOM</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="unitSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Size</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="uTaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Rate</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Item
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}