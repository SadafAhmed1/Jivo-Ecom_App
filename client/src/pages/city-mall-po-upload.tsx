import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertCircle, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { CityMallPoHeader, CityMallPoLines } from "@shared/schema";

interface ParsedCityMallPO {
  header: CityMallPoHeader;
  lines: CityMallPoLines[];
}

export default function CityMallPoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCityMallPO | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const parseFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/parse-city-mall-csv', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse CSV');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setParsedData(data);
      toast({
        title: "File parsed successfully",
        description: `Found ${data.lines.length} line items`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to parse file",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const savePoMutation = useMutation({
    mutationFn: async (data: ParsedCityMallPO) => {
      return await apiRequest('/api/city-mall-pos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "City Mall PO saved successfully",
        description: "Purchase order has been imported to the system",
      });
      // Reset form
      setFile(null);
      setParsedData(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to save PO",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
    }
  };

  const handleParseFile = () => {
    if (!file) return;
    parseFileMutation.mutate(file);
  };

  const handleSavePO = () => {
    if (!parsedData) return;
    savePoMutation.mutate(parsedData);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Package className="text-green-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">City Mall PO Upload</h1>
          <p className="text-gray-600">Import City Mall purchase orders from CSV files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload size={20} />
              <span>Upload CSV File</span>
            </CardTitle>
            <CardDescription>
              Select a City Mall CSV file to import purchase order data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>

            {file && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  File selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleParseFile}
              disabled={!file || parseFileMutation.isPending}
              className="w-full"
            >
              {parseFileMutation.isPending ? (
                "Parsing..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Parse CSV File
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>File Preview</CardTitle>
            <CardDescription>
              Review the parsed data before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!parsedData ? (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>Upload a CSV file to see preview</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                    <p className="font-semibold">{parsedData.header.po_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant="outline">{parsedData.header.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Items</Label>
                    <p className="font-semibold">{parsedData.header.total_quantity}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                    <p className="font-semibold">₹{Number(parsedData.header.total_amount).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Line Items</Label>
                  <p className="text-sm text-gray-500">{parsedData.lines.length} items found</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">HSN Codes</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedData.header.unique_hsn_codes?.map((hsn, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {hsn}
                      </Badge>
                    ))}

                  </div>
                </div>

                <Button 
                  onClick={handleSavePO}
                  disabled={savePoMutation.isPending}
                  className="w-full"
                >
                  {savePoMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Purchase Order
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {parseFileMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {parseFileMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}