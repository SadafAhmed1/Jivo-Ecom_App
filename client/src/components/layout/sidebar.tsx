import { Link, useLocation } from "wouter";
import { 
  ChartLine, 
  ShoppingCart, 
  Truck, 
  Upload, 
  Package, 
  Store, 
  User,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: ChartLine,
    active: true
  },
  {
    name: "Platform PO",
    href: "/platform-po",
    icon: ShoppingCart,
    active: true,
    description: "Create & manage platform orders"
  },
  {
    type: "group",
    name: "Upload PO",
    icon: Upload,
    active: true,
    children: [
      {
        name: "Flipkart Grocery",
        href: "/flipkart-grocery-upload",
        description: "Import Flipkart grocery POs"
      },
      {
        name: "Zepto",
        href: "/zepto-upload",
        description: "Import Zepto POs"
      },
      {
        name: "City Mall",
        href: "/city-mall-upload",
        description: "Import City Mall POs"
      },
      {
        name: "Blinkit",
        href: "/blinkit-upload",
        description: "Import Blinkit POs"
      },
      {
        name: "Swiggy",
        href: "/swiggy-upload",
        description: "Import Swiggy POs"
      }
    ]
  },
  {
    name: "Distributor PO",
    href: "/distributor-po",
    icon: Truck,
    active: false,
    comingSoon: true
  },
  {
    name: "Secondary Sales",
    href: "/secondary-sales",
    icon: Upload,
    active: false,
    comingSoon: true
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    active: false,
    comingSoon: true
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [uploadPoOpen, setUploadPoOpen] = useState(false);

  const isUploadActive = location.includes('-upload');

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Store className="text-white text-lg" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">PO Manager</h1>
            <p className="text-sm text-gray-600">E-Commerce Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navigation.map((item) => {
            if (item.type === "group") {
              return (
                <Collapsible
                  key={item.name}
                  open={uploadPoOpen || isUploadActive}
                  onOpenChange={setUploadPoOpen}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className={cn(
                      "flex items-center justify-between px-4 py-3 font-medium rounded-lg transition-colors duration-200 group cursor-pointer w-full",
                      isUploadActive ? "text-primary bg-blue-50 border border-blue-200" : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                    )}>
                      <div className="flex items-center space-x-3">
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </div>
                      {uploadPoOpen || isUploadActive ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {item.children?.map((child) => {
                      const isChildActive = location === child.href;
                      return (
                        <Link key={child.name} href={child.href || '#'}>
                          <div className={cn(
                            "ml-8 px-4 py-2 text-sm rounded-lg transition-colors duration-200 cursor-pointer",
                            isChildActive ? "text-primary bg-blue-50 border border-blue-200 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                          )}>
                            <div className="flex items-center justify-between">
                              <span>{child.name}</span>
                              {child.description && (
                                <span className="text-xs text-gray-400">{child.description}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            const isActive = location === item.href;
            
            if (item.comingSoon) {
              return (
                <div key={item.name} className="opacity-50">
                  <div className="flex items-center justify-between px-4 py-3 text-gray-400 cursor-not-allowed">
                    <div className="flex items-center space-x-3">
                      <item.icon size={20} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">Soon</span>
                  </div>
                </div>
              );
            }

            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center justify-between px-4 py-3 font-medium rounded-lg transition-colors duration-200 group cursor-pointer",
                  isActive ? "text-primary bg-blue-50 border border-blue-200" : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                )}>
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </div>
                  {'description' in item && (
                    <span className="text-xs text-gray-400 group-hover:text-gray-600 max-w-24 truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600" size={16} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">System Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
