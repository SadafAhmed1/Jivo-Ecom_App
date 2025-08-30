import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernPOForm } from "@/components/po/modern-po-form";
import { ErrorBoundary } from "@/components/error-boundary";

export default function POEdit() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const poId = params.id;

  // Validate PO ID
  if (!poId || isNaN(parseInt(poId))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid PO ID</h2>
          <p className="text-gray-600 mb-4">The purchase order ID provided is not valid.</p>
          <Button onClick={() => setLocation("/platform-po")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to POs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-green-100 dark:border-gray-700 px-6 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/platform-po")}
              className="hover:bg-green-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to POs
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Edit Purchase Order
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Update purchase order details and line items
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        <ErrorBoundary onError={(error, errorInfo) => {
          console.error("PO Edit Form Error:", error, errorInfo);
        }}>
          <ModernPOForm 
            editMode={true}
            editPoId={poId}
            onSuccess={() => setLocation("/platform-po")}
          />
        </ErrorBoundary>
      </main>
    </div>
  );
}