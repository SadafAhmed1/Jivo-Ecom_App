import { PlatformPOTabs } from "@/components/po/platform-po-tabs";

export default function PlatformPO() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <PlatformPOTabs />
      </main>
    </div>
  );
}
