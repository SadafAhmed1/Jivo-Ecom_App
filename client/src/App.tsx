import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import PlatformPO from "@/pages/platform-po";
import PODetails from "@/pages/po-details";
import POEdit from "@/pages/po-edit";
import FlipkartGroceryPOUpload from "@/pages/flipkart-grocery-po-upload";
import FlipkartGroceryPOs from "@/pages/flipkart-grocery-pos";
import FlipkartGroceryPODetails from "@/pages/flipkart-grocery-po-details";
import ZeptoPoUpload from "@/pages/zepto-po-upload";
import ZeptoPOs from "@/pages/zepto-pos";
import ZeptoPoDetails from "@/pages/zepto-po-details";
import ZeptoPoEdit from "@/pages/zepto-po-edit";
// Legacy route - redirected to unified upload
// import CityMallPoUpload from "@/pages/city-mall-po-upload";
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

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/platform-po" component={PlatformPO} />
          <Route path="/po-details/:id" component={PODetails} />
          <Route path="/po-edit/:id" component={POEdit} />
          <Route path="/flipkart-grocery-upload" component={FlipkartGroceryPOUpload} />
          <Route path="/flipkart-grocery-pos" component={FlipkartGroceryPOs} />
          <Route path="/flipkart-grocery-po/:id" component={FlipkartGroceryPODetails} />
          <Route path="/zepto-upload" component={ZeptoPoUpload} />
          <Route path="/zepto-pos" component={ZeptoPOs} />
          <Route path="/zepto-pos/:id" component={ZeptoPoDetails} />
          <Route path="/zepto-pos/edit/:id">
            {(params) => <ZeptoPoEdit poId={params.id} />}
          </Route>
          <Route path="/city-mall-upload">
            {() => {
              // Redirect legacy city-mall-upload to unified upload
              window.location.href = "/unified-po-upload";
              return null;
            }}
          </Route>
          <Route path="/city-mall-pos" component={CityMallPOs} />
          <Route path="/city-mall-pos/:id" component={CityMallPoDetails} />
          <Route path="/blinkit-upload" component={UploadBlinkitPo} />
          <Route path="/blinkit-pos" component={ViewBlinkitPos} />
          <Route path="/swiggy-upload" component={SwiggyUpload} />
          <Route path="/unified-po-upload" component={UnifiedPoUpload} />
          <Route path="/sap-sync" component={SapSync} />
          <Route path="/distributor-po" component={DistributorPO} />
          <Route path="/secondary-sales" component={SecondarySales} />
          <Route path="/inventory" component={Inventory} />
          <Route path="/sql-query" component={SqlQuery} />

          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
