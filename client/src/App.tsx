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
