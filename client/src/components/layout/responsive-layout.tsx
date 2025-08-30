import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  ChartLine, 
  ShoppingCart, 
  Truck, 
  Upload, 
  Package, 
  Store, 
  User,
  Database,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "./mobile-header";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  active: boolean;
  description?: string;
  comingSoon?: boolean;
};

const navigation: NavigationItem[] = [
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
    description: "Create, upload & manage platform orders"
  },
  {
    name: "Distributor PO",
    href: "/distributor-po",
    icon: Truck,
    active: true,
    description: "Create & manage distributor purchase orders"
  },
  {
    name: "Secondary Sales",
    href: "/secondary-sales",
    icon: Upload,
    active: true,
    description: "Upload & manage secondary sales data from platforms"
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Package,
    active: true,
    description: "Upload & manage inventory data from platforms"
  },
  {
    name: "Create PF Item",
    href: "/pf-item-creation",
    icon: Plus,
    active: true,
    description: "Create new platform items"
  },
  {
    name: "SAP Sync",
    href: "/sap-sync", 
    icon: Database,
    active: true,
    description: "Sync item master data from SAP B1 Hanna ERP"
  },
  {
    name: "SQL Query",
    href: "/sql-query",
    icon: Database,
    active: true,
    description: "Execute custom SQL queries and explore data"
  }
];

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white shadow-lg border-r border-gray-200">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Store className="text-white text-lg" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Jivo E-Com</h1>
              </div>
            </div>
          </div>
          
          {/* Navigation Section */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" style={{scrollbarWidth: 'thin'}}>
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.name} to={item.href}>
                  <div className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive ? "text-primary bg-blue-50 border border-blue-200 font-medium shadow-sm" : "text-gray-700 hover:bg-gray-50 hover:text-primary",
                    !item.active && "opacity-50 pointer-events-none"
                  )}>
                    <Icon size={20} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        {item.comingSoon && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Coming Soon</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
          
          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || user?.username || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.department || "Department"} • {user?.role || "user"}
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="text-white" size={18} />
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Jivo E-Com</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closeMobileMenu}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.name} to={item.href} onClick={closeMobileMenu}>
                  <div className={cn(
                    "flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200",
                    isActive ? "text-primary bg-blue-50 border border-blue-200 font-medium shadow-sm" : "text-gray-700 hover:bg-gray-50 hover:text-primary active:bg-gray-100",
                    !item.active && "opacity-50 pointer-events-none"
                  )}>
                    <Icon size={22} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        {item.comingSoon && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">Coming Soon</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Section */}
          <div className="p-4 border-t border-gray-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.full_name || user?.username || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.department || "Department"} • {user?.role || "user"}
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={() => {
                    navigate("/profile");
                    closeMobileMenu();
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => {
                    logoutMutation.mutate();
                    closeMobileMenu();
                  }}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={toggleMobileMenu} />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}