import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  Database,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ParsedPOData {
  header: any;
  lines: any[];
  totalItems?: number;
  totalQuantity?: number;
  totalAmount?: string;
}

export default function FlipkartGroceryPOUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPOData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/po/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to preview file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setParsedData(data);
      setShowPreview(true);
      toast({
        title: "File previewed successfully",
        description: `Found ${data.totalItems} items`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: { header: any; lines: any[] }) => {
      const response = await fetch("/api/po/import/flipkart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import PO");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "PO imported successfully",
        description: `PO ${data.po_number} has been created`,
      });
      setFile(null);
      setParsedData(null);
      setShowPreview(false);
      queryClient.invalidateQueries({
        queryKey: ["/api/flipkart-grocery-pos"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const isValidFile =
      validTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith(".csv") ||
      selectedFile.name.endsWith(".xls") ||
      selectedFile.name.endsWith(".xlsx");

    if (isValidFile) {
      setFile(selectedFile);
      setParsedData(null);
      setShowPreview(false);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to preview",
        variant: "destructive",
      });
      return;
    }

    previewMutation.mutate(file);
  };

  const handleImport = () => {
    if (!parsedData) {
      toast({
        title: "No data to import",
        description: "Please preview the file first",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({
      header: parsedData.header,
      lines: parsedData.lines,
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flipkart Grocery PO Upload</h1>
            <p className="text-gray-600">
              Upload, review, and import Flipkart grocery purchase orders
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Flipkart Grocery PO File
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files containing Flipkart grocery purchase
                order data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    {file
                      ? "File Selected"
                      : "Drop your Flipkart CSV/Excel file here"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or{" "}
                    <Label
                      htmlFor="file-upload"
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      browse to choose a file
                    </Label>
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports .csv, .xls, and .xlsx files
                  </p>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">{file.name}</p>
                    <p className="text-sm text-green-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setParsedData(null);
                      setShowPreview(false);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handlePreview}
                  disabled={!file || previewMutation.isPending}
                  className="flex-1"
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMutation.isPending
                    ? "Analyzing..."
                    : "Preview & Review"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {showPreview && parsedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  File Preview & Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      PO Number
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {parsedData.header?.po_number || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Total Items
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {parsedData.totalItems || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Total Quantity
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {parsedData.totalQuantity || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-yellow-900">
                      ₹{parsedData.totalAmount || "0"}
                    </p>
                  </div>
                </div>

                {/* PO Header Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium">PO Header Information</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>PO Number:</strong>{" "}
                        {parsedData.header?.po_number || "N/A"}
                      </div>
                      <div>
                        <strong>PO Date:</strong>{" "}
                        {parsedData.header?.po_date || "N/A"}
                      </div>
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant="outline">
                          {parsedData.header?.status || "Open"}
                        </Badge>
                      </div>
                      <div>
                        <strong>Vendor:</strong> Flipkart Grocery
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Line Items Preview
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.lines.map((line, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {line.item_code || "N/A"}
                            </TableCell>
                            <TableCell>
                              {line.item_name ||
                                line.product_description ||
                                "N/A"}
                            </TableCell>
                            <TableCell>{line.quantity || "N/A"}</TableCell>
                            <TableCell>
                              ₹
                              {line.unit_price ||
                                line.basic_cost_price ||
                                "N/A"}
                            </TableCell>
                            <TableCell>
                              ₹{line.total_amount || line.line_total || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                </div>

                {/* Import Action */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="flex-1"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    {importMutation.isPending
                      ? "Importing..."
                      : "Import to Database"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Upload File</h4>
                    <p className="text-gray-600">
                      Upload your Flipkart grocery CSV or Excel file
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Preview & Review</h4>
                    <p className="text-gray-600">
                      Review the parsed data to ensure accuracy
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Import to Database</h4>
                    <p className="text-gray-600">
                      Import the validated data into the system
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-sm">
                        <strong>Note:</strong> Please ensure your CSV file
                        follows the standard Flipkart grocery format. Review all
                        data before importing to maintain data integrity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
