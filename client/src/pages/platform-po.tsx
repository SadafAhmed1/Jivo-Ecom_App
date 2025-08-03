import { Bell, Search } from "lucide-react";
import { PlatformPOForm } from "@/components/po/platform-po-form";

export default function PlatformPO() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Platform Purchase Order</h2>
            <p className="text-gray-600 mt-1">Create and manage purchase orders for e-commerce platforms</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search POs..." 
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        <PlatformPOForm />
      </main>
    </div>
  );
}
