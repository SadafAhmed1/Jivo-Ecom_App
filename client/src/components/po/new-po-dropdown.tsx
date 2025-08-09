import { useState } from "react";
import { Plus, Upload, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewPODropdownProps {
  onCreatePO: () => void;
  onUploadPO: () => void;
}

export function NewPODropdown({ onCreatePO, onUploadPO }: NewPODropdownProps) {
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
          onClick={onUploadPO}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <div>
            <div className="font-medium">Upload PO</div>
            <div className="text-xs text-gray-500">Upload CSV/Excel files</div>
          </div>
        </DropdownMenuItem>
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