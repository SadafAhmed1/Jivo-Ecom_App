import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface HanaItemDetail {
  ItemCode: string;
  ItemName: string;
  ItmsGrpNam?: string;
  U_TYPE?: string;
  U_Variety?: string;
  U_Sub_Group?: string;
  U_Brand?: string;
  InvntryUom?: string;
  SalPackUn?: number;
  U_IsLitre?: string;
  U_Tax_Rate?: string;
  // Legacy fields for backward compatibility
  ItemGroup?: string;
  SubGroup?: string;
  Brand?: string;
  UnitOfMeasure?: string;
  UOM?: string;
  TaxRate?: number;
  UnitSize?: number;
  IsLitre?: boolean;
  CasePack?: number;
  BasicRate?: number;
  LandingRate?: number;
  MRP?: number;
  [key: string]: any;
}

export function useItemDetails(itemName?: string) {
  return useQuery<HanaItemDetail[]>({
    queryKey: ["/api/item-details", itemName],
    queryFn: async () => {
      if (!itemName || itemName.trim().length < 3) {
        return [];
      }
      
      const response = await fetch(`/api/item-details?itemName=${encodeURIComponent(itemName)}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!itemName && itemName.trim().length >= 3,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}