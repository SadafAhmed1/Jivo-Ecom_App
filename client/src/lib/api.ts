import { apiRequest } from "./queryClient";
import type { 
  PfMst, 
  InsertPfMst, 
  PfPo, 
  InsertPfPo, 
  PfOrderItems, 
  InsertPfOrderItems,
  ItemMaster,
  InsertItemMaster
} from "@shared/schema";

export const api = {
  // Platform APIs
  platforms: {
    getAll: async (): Promise<PfMst[]> => {
      const response = await apiRequest("GET", "/api/platforms");
      return response.json();
    },
    create: async (platform: InsertPfMst): Promise<PfMst> => {
      const response = await apiRequest("POST", "/api/platforms", platform);
      return response.json();
    }
  },

  // PO APIs
  pos: {
    getAll: async (): Promise<(PfPo & { platform: PfMst; orderItems: PfOrderItems[] })[]> => {
      const response = await apiRequest("GET", "/api/pos");
      return response.json();
    },
    getById: async (id: number): Promise<PfPo & { platform: PfMst; orderItems: PfOrderItems[] }> => {
      const response = await apiRequest("GET", `/api/pos/${id}`);
      return response.json();
    },
    create: async (data: { po: InsertPfPo; items: InsertPfOrderItems[] }): Promise<PfPo> => {
      const response = await apiRequest("POST", "/api/pos", data);
      return response.json();
    },
    update: async (id: number, data: { po: Partial<InsertPfPo>; items?: InsertPfOrderItems[] }): Promise<PfPo> => {
      const response = await apiRequest("PUT", `/api/pos/${id}`, data);
      return response.json();
    },
    delete: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/pos/${id}`);
    }
  },

  // Platform Items APIs
  platformItems: {
    search: async (platformId?: number, search?: string) => {
      const params = new URLSearchParams();
      if (platformId) params.append("platformId", platformId.toString());
      if (search) params.append("search", search);
      
      const response = await apiRequest("GET", `/api/platform-items?${params.toString()}`);
      return response.json();
    }
  },

  sql: {
    getItemDetails: async () => {
      const response = await apiRequest("GET", "/api/sql/item-details");
      return response.json();
    }
  },

  // Item Management APIs
  items: {
    getAll: async (search?: string): Promise<ItemMaster[]> => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await apiRequest("GET", `/api/items${params}`);
      return response.json();
    },
    getById: async (id: number): Promise<ItemMaster> => {
      const response = await apiRequest("GET", `/api/items/${id}`);
      return response.json();
    },
    create: async (item: InsertItemMaster): Promise<ItemMaster> => {
      const response = await apiRequest("POST", "/api/items", item);
      return response.json();
    },
    update: async (id: number, item: Partial<InsertItemMaster>): Promise<ItemMaster> => {
      const response = await apiRequest("PUT", `/api/items/${id}`, item);
      return response.json();
    },
    delete: async (id: number): Promise<void> => {
      await apiRequest("DELETE", `/api/items/${id}`);
    }
  }
};
