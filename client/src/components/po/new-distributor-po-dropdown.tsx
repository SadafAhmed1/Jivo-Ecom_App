import { useState } from "react";
import { Plus, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewDistributorPODropdownProps {
  onCreatePO: () => void;
}

export function NewDistributorPODropdown({ onCreatePO }: NewDistributorPODropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          New PO
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={onCreatePO}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <div>
            <div className="font-medium">Create PO</div>
            <div className="text-xs text-gray-500">Manual PO creation</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}