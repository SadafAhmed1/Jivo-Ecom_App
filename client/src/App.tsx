import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { NotificationProvider } from "@/components/ui/notification";

// Auth pages
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";

// Protected pages
import Dashboard from "@/pages/dashboard";
import PlatformPO from "@/pages/platform-po";
import PODetails from "@/pages/po-details";
import POEdit from "@/pages/po-edit";
import FlipkartGroceryPOUpload from "@/pages/flipkart-grocery-po-upload";
import FlipkartGroceryPOs from "@/pages/flipkart-grocery-pos";
import FlipkartGroceryPODetails from "@/pages/flipkart-grocery-po-details";
import FlipkartGroceryPOEdit from "@/pages/flipkart-grocery-po-edit";
import ZeptoPoUpload from "@/pages/zepto-po-upload";
import ZeptoPOs from "@/pages/zepto-pos";
import ZeptoPoDetails from "@/pages/zepto-po-details";
import ZeptoPoEdit from "@/pages/zepto-po-edit";
import CityMallPOs from "@/pages/city-mall-pos";
import CityMallPoDetails from "@/pages/city-mall-po-details";
import UploadBlinkitPo from "./pages/upload/UploadBlinkitPo";
import ViewBlinkitPos from "./pages/ViewBlinkitPos";
import SwiggyUpload from "./pages/SwiggyUpload";
import UnifiedPoUpload from "@/pages/unified-po-upload";
import SapSync from "@/pages/sap-sync";
import SqlQuery from "@/pages/SqlQuery";
import DistributorPO from "@/pages/distributor-po";
import SecondarySales from "@/pages/secondary-sales";
import Inventory from "@/pages/inventory";
import PFItemCreation from "@/pages/pf-item-creation";

import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes with responsive layout */}
      <ProtectedRoute path="/" component={() => (
        <ResponsiveLayout>
          <Dashboard />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
      
      <ProtectedRoute path="/platform-po" component={() => (
        <ResponsiveLayout>
          <PlatformPO />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/po-details/:id" component={() => (
        <ResponsiveLayout>
          <PODetails />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/po-edit/:id" component={() => (
        <ResponsiveLayout>
          <POEdit />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/flipkart-grocery-upload" component={() => (
        <ResponsiveLayout>
          <FlipkartGroceryPOUpload />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/flipkart-grocery-pos" component={() => (
        <ResponsiveLayout>
          <FlipkartGroceryPOs />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/flipkart-grocery-po/:id/edit" component={() => (
        <ResponsiveLayout>
          <FlipkartGroceryPOEdit />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/flipkart-grocery-po/:id" component={() => (
        <ResponsiveLayout>
          <FlipkartGroceryPODetails />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/zepto-upload" component={() => (
        <ResponsiveLayout>
          <ZeptoPoUpload />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/zepto-pos" component={() => (
        <ResponsiveLayout>
          <ZeptoPOs />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/zepto-pos/:id" component={() => (
        <ResponsiveLayout>
          <ZeptoPoDetails />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/zepto-pos/edit/:id" component={() => (
        <ResponsiveLayout>
          <Route path="/zepto-pos/edit/:id">
            {(params) => <ZeptoPoEdit poId={params.id} />}
          </Route>
        </ResponsiveLayout>
      )} />
      
      <Route path="/city-mall-upload">
        {() => {
          // Redirect legacy city-mall-upload to unified upload
          window.location.href = "/unified-po-upload";
          return null;
        }}
      </Route>
      
      <ProtectedRoute path="/city-mall-pos" component={() => (
        <ResponsiveLayout>
          <CityMallPOs />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/city-mall-pos/:id" component={() => (
        <ResponsiveLayout>
          <CityMallPoDetails />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/blinkit-upload" component={() => (
        <ResponsiveLayout>
          <UploadBlinkitPo />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/blinkit-pos" component={() => (
        <ResponsiveLayout>
          <ViewBlinkitPos />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/swiggy-upload" component={() => (
        <ResponsiveLayout>
          <SwiggyUpload />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/unified-po-upload" component={() => (
        <ResponsiveLayout>
          <UnifiedPoUpload />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/sap-sync" component={() => (
        <ResponsiveLayout>
          <SapSync />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/distributor-po" component={() => (
        <ResponsiveLayout>
          <DistributorPO />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/secondary-sales" component={() => (
        <ResponsiveLayout>
          <SecondarySales />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/inventory" component={() => (
        <ResponsiveLayout>
          <Inventory />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/pf-item-creation" component={() => (
        <ResponsiveLayout>
          <PFItemCreation />
        </ResponsiveLayout>
      )} />
      
      <ProtectedRoute path="/sql-query" component={() => (
        <ResponsiveLayout>
          <SqlQuery />
        </ResponsiveLayout>
      )} />

      <Route component={NotFound} />
    </Switch>
  );
}

const basePath = import.meta.env.PROD ? "/Jivo-Ecom_App" : "";

function App() {
  console.log("🚀 App component mounting...");
  console.log("🔧 Environment:", import.meta.env.MODE);
  console.log("🔧 Base path:", basePath);
  console.log("🔧 Is production:", import.meta.env.PROD);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Router base={basePath}>
                <Toaster />
                <AppRouter />
              </Router>
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
