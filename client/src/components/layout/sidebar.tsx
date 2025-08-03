import { Link, useLocation } from "wouter";
import { 
  ChartLine, 
  ShoppingCart, 
  Truck, 
  Upload, 
  Package, 
  Store, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    subItems: [
      { name: "Create PO", href: "/platform-po" },
      { name: "View POs", href: "/platform-po/list" }
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
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.subItems && item.subItems.some(sub => location === sub.href));
            
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
              <div key={item.name}>
                {item.subItems ? (
                  <div className={cn(
                    "rounded-lg",
                    isActive && "bg-blue-50 border border-blue-200"
                  )}>
                    <Link href={item.href}>
                      <a className={cn(
                        "flex items-center space-x-3 px-4 py-3 font-medium transition-colors duration-200",
                        isActive ? "text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                      )}>
                        <item.icon size={20} />
                        <span>{item.name}</span>
                      </a>
                    </Link>
                    {isActive && (
                      <div className="pl-12 pb-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link key={subItem.name} href={subItem.href}>
                            <a className="block px-2 py-1 text-sm text-blue-700 hover:bg-blue-100 rounded">
                              {subItem.name}
                            </a>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={item.href}>
                    <a className={cn(
                      "flex items-center space-x-3 px-4 py-3 font-medium rounded-lg transition-colors duration-200",
                      isActive ? "text-primary bg-blue-50" : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                    )}>
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </a>
                  </Link>
                )}
              </div>
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
