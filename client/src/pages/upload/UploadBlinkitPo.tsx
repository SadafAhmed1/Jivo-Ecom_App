import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function UploadBlinkitPo() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && !selectedFile.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/blinkit-po/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/blinkit-pos'] });
      
      toast({
        title: "Upload Successful",
        description: `Blinkit PO uploaded with ${result.totalItems} items`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadResult(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Blinkit Purchase Order</h1>
        <p className="text-muted-foreground mt-2">
          Upload Excel files from Blinkit with purchase order data including detailed tax breakdown
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Select Blinkit Excel File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground">
              Accepts Excel files (.xlsx, .xls) with Blinkit purchase order format
            </p>
          </div>

          {file && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
            
            {file && (
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Upload Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>PO Number:</strong> {uploadResult.po?.po_number}</p>
              <p><strong>Total Items:</strong> {uploadResult.totalItems}</p>
              <p><strong>Total Quantity:</strong> {uploadResult.po?.total_quantity}</p>
              <p><strong>Net Amount:</strong> ₹{uploadResult.po?.net_amount}</p>
              <p><strong>Status:</strong> {uploadResult.po?.status}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Blinkit File Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Required columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li># (Line Number)</li>
              <li>Item Code</li>
              <li>HSN Code</li>
              <li>Product UPC</li>
              <li>Product Description</li>
              <li>Grammage</li>
              <li>Basic Cost Price</li>
              <li>CGST%, SGST%, IGST%, CESS%, Additional CES</li>
              <li>Tax Amount, Landing Rate, Quantity, MRP, Margin%</li>
              <li>Total Amount</li>
            </ul>
            <p className="mt-4">
              <strong>Summary data</strong> should be included at the bottom with Total Quantity, Total Items, Net amount, and Cart Discount.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}