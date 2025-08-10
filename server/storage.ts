import { 
  type User, 
  type InsertUser,
  type PfMst,
  type InsertPfMst,
  type SapItemMst,
  type InsertSapItemMst,
  type SapItemMstApi,
  type InsertSapItemMstApi,
  type PfItemMst,
  type InsertPfItemMst,
  type PfPo,
  type InsertPfPo,
  type PfOrderItems,
  type InsertPfOrderItems,
  type FlipkartGroceryPoHeader,
  type InsertFlipkartGroceryPoHeader,
  type FlipkartGroceryPoLines,
  type InsertFlipkartGroceryPoLines,
  type ZeptoPoHeader,
  type InsertZeptoPoHeader,
  type ZeptoPoLines,
  type InsertZeptoPoLines,
  type CityMallPoHeader,
  type InsertCityMallPoHeader,
  type CityMallPoLines,
  type InsertCityMallPoLines,
  type BlinkitPoHeader,
  type InsertBlinkitPoHeader,
  type BlinkitPoLines,
  type InsertBlinkitPoLines,
  type SwiggyPo,
  type SwiggyPoLine,
  type InsertSwiggyPo,
  type InsertSwiggyPoLine,
  type BigbasketPoHeader,
  type BigbasketPoLines,
  type InsertBigbasketPoHeader,
  type InsertBigbasketPoLines,
  type DistributorMst,
  type InsertDistributorMst,
  type DistributorPo,
  type InsertDistributorPo,
  type DistributorOrderItems,
  type InsertDistributorOrderItems,
  users,
  pfMst,
  sapItemMst,
  sapItemMstApi,
  pfItemMst,
  pfPo,
  pfOrderItems,
  flipkartGroceryPoHeader,
  flipkartGroceryPoLines,
  zeptoPoHeader,
  zeptoPoLines,
  cityMallPoHeader,
  cityMallPoLines,
  blinkitPoHeader,
  blinkitPoLines,
  swiggyPos,
  swiggyPoLines,
  bigbasketPoHeader,
  bigbasketPoLines,
  distributorMst,
  distributorPo,
  distributorOrderItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Platform methods
  getAllPlatforms(): Promise<PfMst[]>;
  createPlatform(platform: InsertPfMst): Promise<PfMst>;
  
  // SAP Item methods
  getAllSapItems(): Promise<SapItemMst[]>;
  createSapItem(item: InsertSapItemMst): Promise<SapItemMst>;
  
  // SAP Item API methods
  getAllSapItemsApi(): Promise<SapItemMstApi[]>;
  createSapItemApi(item: InsertSapItemMstApi): Promise<SapItemMstApi>;
  syncSapItemsFromApi(items: InsertSapItemMstApi[]): Promise<number>;
  
  // Platform Item methods
  getPlatformItems(platformId?: number, search?: string): Promise<(PfItemMst & { sapItem: SapItemMst; platform: PfMst })[]>;
  createPlatformItem(item: InsertPfItemMst): Promise<PfItemMst>;
  
  // PO methods
  getAllPos(): Promise<(Omit<PfPo, 'platform'> & { platform: PfMst; orderItems: PfOrderItems[] })[]>;
  getPoById(id: number): Promise<(Omit<PfPo, 'platform'> & { platform: PfMst; orderItems: PfOrderItems[] }) | undefined>;
  createPo(po: InsertPfPo, items: InsertPfOrderItems[]): Promise<PfPo>;
  updatePo(id: number, po: Partial<InsertPfPo>, items?: InsertPfOrderItems[]): Promise<PfPo>;
  deletePo(id: number): Promise<void>;
  
  // Order Items methods
  getAllOrderItems(): Promise<(PfOrderItems & { po_number: string; platform_name: string; order_date: Date; expiry_date: Date | null; platform: PfMst })[]>;
  updateOrderItemStatus(id: number, status: string): Promise<PfOrderItems>;

  // Flipkart Grocery PO methods
  getAllFlipkartGroceryPos(): Promise<(FlipkartGroceryPoHeader & { poLines: FlipkartGroceryPoLines[] })[]>;
  getFlipkartGroceryPoById(id: number): Promise<(FlipkartGroceryPoHeader & { poLines: FlipkartGroceryPoLines[] }) | undefined>;
  getFlipkartGroceryPoByNumber(poNumber: string): Promise<FlipkartGroceryPoHeader | undefined>;
  createFlipkartGroceryPo(header: InsertFlipkartGroceryPoHeader, lines: InsertFlipkartGroceryPoLines[]): Promise<FlipkartGroceryPoHeader>;
  updateFlipkartGroceryPo(id: number, header: Partial<InsertFlipkartGroceryPoHeader>, lines?: InsertFlipkartGroceryPoLines[]): Promise<FlipkartGroceryPoHeader>;
  deleteFlipkartGroceryPo(id: number): Promise<void>;

  // Zepto PO methods
  getAllZeptoPos(): Promise<(ZeptoPoHeader & { poLines: ZeptoPoLines[] })[]>;
  getZeptoPOById(id: number): Promise<(ZeptoPoHeader & { poLines: ZeptoPoLines[] }) | undefined>;
  getZeptoPoByNumber(poNumber: string): Promise<ZeptoPoHeader | undefined>;
  createZeptoPo(header: InsertZeptoPoHeader, lines: InsertZeptoPoLines[]): Promise<ZeptoPoHeader>;
  updateZeptoPo(id: number, header: Partial<InsertZeptoPoHeader>, lines?: InsertZeptoPoLines[]): Promise<ZeptoPoHeader>;
  deleteZeptoPo(id: number): Promise<void>;

  // City Mall PO methods
  getAllCityMallPos(): Promise<(CityMallPoHeader & { poLines: CityMallPoLines[] })[]>;
  getCityMallPoById(id: number): Promise<(CityMallPoHeader & { poLines: CityMallPoLines[] }) | undefined>;
  getCityMallPoByNumber(poNumber: string): Promise<CityMallPoHeader | undefined>;
  createCityMallPo(header: InsertCityMallPoHeader, lines: InsertCityMallPoLines[]): Promise<CityMallPoHeader>;
  updateCityMallPo(id: number, header: Partial<InsertCityMallPoHeader>, lines?: InsertCityMallPoLines[]): Promise<CityMallPoHeader>;
  deleteCityMallPo(id: number): Promise<void>;

  // Blinkit PO methods
  getAllBlinkitPos(): Promise<(BlinkitPoHeader & { poLines: BlinkitPoLines[] })[]>;
  getBlinkitPoById(id: number): Promise<(BlinkitPoHeader & { poLines: BlinkitPoLines[] }) | undefined>;
  getBlinkitPoByNumber(poNumber: string): Promise<BlinkitPoHeader | undefined>;
  createBlinkitPo(header: InsertBlinkitPoHeader, lines: InsertBlinkitPoLines[]): Promise<BlinkitPoHeader>;
  updateBlinkitPo(id: number, header: Partial<InsertBlinkitPoHeader>, lines?: InsertBlinkitPoLines[]): Promise<BlinkitPoHeader>;
  deleteBlinkitPo(id: number): Promise<void>;

  // Swiggy PO methods
  getAllSwiggyPos(): Promise<(SwiggyPo & { poLines: SwiggyPoLine[] })[]>;
  getSwiggyPoById(id: number): Promise<(SwiggyPo & { poLines: SwiggyPoLine[] }) | undefined>;
  getSwiggyPoByNumber(poNumber: string): Promise<SwiggyPo | undefined>;
  createSwiggyPo(po: InsertSwiggyPo, lines: InsertSwiggyPoLine[]): Promise<SwiggyPo>;
  updateSwiggyPo(id: number, po: Partial<InsertSwiggyPo>): Promise<SwiggyPo | undefined>;
  deleteSwiggyPo(id: number): Promise<void>;

  // Distributor methods
  getAllDistributors(): Promise<DistributorMst[]>;
  getDistributorById(id: number): Promise<DistributorMst | undefined>;
  createDistributor(distributor: InsertDistributorMst): Promise<DistributorMst>;
  updateDistributor(id: number, distributor: Partial<InsertDistributorMst>): Promise<DistributorMst>;
  deleteDistributor(id: number): Promise<void>;

  // Distributor PO methods
  getAllDistributorPos(): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] })[]>;
  getDistributorPoById(id: number): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] }) | undefined>;
  createDistributorPo(po: InsertDistributorPo, items: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  updateDistributorPo(id: number, po: Partial<InsertDistributorPo>, items?: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  deleteDistributorPo(id: number): Promise<void>;

  // Distributor Order Items methods
  getAllDistributorOrderItems(): Promise<(DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods (legacy)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Platform methods
  async getAllPlatforms(): Promise<PfMst[]> {
    return await db.select().from(pfMst);
  }

  async createPlatform(platform: InsertPfMst): Promise<PfMst> {
    const [result] = await db.insert(pfMst).values(platform).returning();
    return result;
  }

  // SAP Item methods
  async getAllSapItems(): Promise<SapItemMst[]> {
    return await db.select().from(sapItemMst);
  }

  async createSapItem(item: InsertSapItemMst): Promise<SapItemMst> {
    const [result] = await db.insert(sapItemMst).values(item).returning();
    return result;
  }

  // SAP Item API methods
  async getAllSapItemsApi(): Promise<SapItemMstApi[]> {
    return await db.select().from(sapItemMstApi);
  }

  async createSapItemApi(item: InsertSapItemMstApi): Promise<SapItemMstApi> {
    const [result] = await db.insert(sapItemMstApi).values(item).returning();
    return result;
  }

  async syncSapItemsFromApi(items: InsertSapItemMstApi[]): Promise<number> {
    if (items.length === 0) return 0;
    
    // Clear existing data and insert new data
    await db.delete(sapItemMstApi);
    await db.insert(sapItemMstApi).values(items);
    
    return items.length;
  }

  // Platform Item methods
  async getPlatformItems(platformId?: number, search?: string): Promise<(PfItemMst & { sapItem: SapItemMst; platform: PfMst })[]> {
    let query = db
      .select({
        id: pfItemMst.id,
        pf_itemcode: pfItemMst.pf_itemcode,
        pf_itemname: pfItemMst.pf_itemname,
        pf_id: pfItemMst.pf_id,
        sap_id: pfItemMst.sap_id,
        sapItem: sapItemMst,
        platform: pfMst
      })
      .from(pfItemMst)
      .leftJoin(sapItemMst, eq(pfItemMst.sap_id, sapItemMst.id))
      .leftJoin(pfMst, eq(pfItemMst.pf_id, pfMst.id));

    const conditions = [];
    
    if (platformId) {
      conditions.push(eq(pfItemMst.pf_id, platformId));
    }
    
    if (search) {
      conditions.push(ilike(pfItemMst.pf_itemname, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const results = await query;
    return results.map(row => ({
      id: row.id,
      pf_itemcode: row.pf_itemcode,
      pf_itemname: row.pf_itemname,
      pf_id: row.pf_id,
      sap_id: row.sap_id,
      sapItem: row.sapItem!,
      platform: row.platform!
    }));
  }

  async createPlatformItem(item: InsertPfItemMst): Promise<PfItemMst> {
    const [result] = await db.insert(pfItemMst).values(item).returning();
    return result;
  }

  // PO methods
  async getAllPos(): Promise<(Omit<PfPo, 'platform'> & { platform: PfMst; orderItems: PfOrderItems[] })[]> {
    // Get regular POs from pf_po table
    const regularPos = await db
      .select({
        po: pfPo,
        platform: pfMst
      })
      .from(pfPo)
      .leftJoin(pfMst, eq(pfPo.platform, pfMst.id))
      .orderBy(desc(pfPo.created_at));

    const result = [];
    
    // Process regular POs
    for (const { po, platform } of regularPos) {
      const orderItems = await db
        .select()
        .from(pfOrderItems)
        .where(eq(pfOrderItems.po_id, po.id));
      
      const { platform: platformId, ...poWithoutPlatform } = po;
      result.push({
        ...poWithoutPlatform,
        platform: platform!,
        orderItems
      });
    }

    // Sort results by created_at descending  
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }

  async getPoById(id: number): Promise<(Omit<PfPo, 'platform'> & { platform: PfMst; orderItems: PfOrderItems[] }) | undefined> {
    const [result] = await db
      .select({
        po: pfPo,
        platform: pfMst
      })
      .from(pfPo)
      .leftJoin(pfMst, eq(pfPo.platform, pfMst.id))
      .where(eq(pfPo.id, id));

    if (!result) return undefined;

    const orderItems = await db
      .select()
      .from(pfOrderItems)
      .where(eq(pfOrderItems.po_id, id));

    const { platform: platformId, ...poWithoutPlatform } = result.po;
    return {
      ...poWithoutPlatform,
      platform: result.platform!,
      orderItems
    };
  }

  async createPo(po: InsertPfPo, items: InsertPfOrderItems[]): Promise<PfPo> {
    return await db.transaction(async (tx) => {
      const [createdPo] = await tx.insert(pfPo).values(po).returning();
      
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_id: createdPo.id
        }));
        await tx.insert(pfOrderItems).values(itemsWithPoId);
      }
      
      return createdPo;
    });
  }

  async updatePo(id: number, po: Partial<InsertPfPo>, items?: InsertPfOrderItems[]): Promise<PfPo> {
    return await db.transaction(async (tx) => {
      const [updatedPo] = await tx
        .update(pfPo)
        .set({ ...po, updated_at: new Date() })
        .where(eq(pfPo.id, id))
        .returning();

      if (items) {
        // Delete existing items
        await tx.delete(pfOrderItems).where(eq(pfOrderItems.po_id, id));
        
        // Insert new items
        if (items.length > 0) {
          const itemsWithPoId = items.map(item => ({
            ...item,
            po_id: id
          }));
          await tx.insert(pfOrderItems).values(itemsWithPoId);
        }
      }

      return updatedPo;
    });
  }

  async deletePo(id: number): Promise<void> {
    await db.delete(pfPo).where(eq(pfPo.id, id));
  }

  async getAllOrderItems(): Promise<(PfOrderItems & { po_number: string; platform_name: string; order_date: Date; expiry_date: Date | null; platform: PfMst })[]> {
    const results = await db
      .select({
        // Order item fields
        id: pfOrderItems.id,
        po_id: pfOrderItems.po_id,
        item_name: pfOrderItems.item_name,
        quantity: pfOrderItems.quantity,
        basic_rate: pfOrderItems.basic_rate,
        gst_rate: pfOrderItems.gst_rate,
        landing_rate: pfOrderItems.landing_rate,
        status: pfOrderItems.status,
        sap_code: pfOrderItems.sap_code,
        category: pfOrderItems.category,
        subcategory: pfOrderItems.subcategory,
        total_litres: pfOrderItems.total_litres,
        hsn_code: pfOrderItems.hsn_code,
        // PO fields
        po_number: pfPo.po_number,
        order_date: pfPo.order_date,
        expiry_date: pfPo.expiry_date,
        // Platform fields  
        platform_name: pfMst.pf_name,
        platform: pfMst
      })
      .from(pfOrderItems)
      .innerJoin(pfPo, eq(pfOrderItems.po_id, pfPo.id))
      .innerJoin(pfMst, eq(pfPo.platform, pfMst.id))
      .orderBy(desc(pfPo.created_at));

    return results.map(result => ({
      id: result.id,
      po_id: result.po_id,
      item_name: result.item_name,
      quantity: result.quantity,
      basic_rate: result.basic_rate,
      gst_rate: result.gst_rate,
      landing_rate: result.landing_rate,
      status: result.status,
      sap_code: result.sap_code,
      category: result.category,
      subcategory: result.subcategory,
      total_litres: result.total_litres,
      hsn_code: result.hsn_code,
      po_number: result.po_number,
      platform_name: result.platform_name,
      order_date: result.order_date,
      expiry_date: result.expiry_date,
      platform: result.platform
    }));
  }

  async updateOrderItemStatus(id: number, status: string): Promise<PfOrderItems> {
    const [updatedItem] = await db
      .update(pfOrderItems)
      .set({ status })
      .where(eq(pfOrderItems.id, id))
      .returning();
    
    if (!updatedItem) {
      throw new Error('Order item not found');
    }
    
    return updatedItem;
  }

  // Flipkart Grocery PO methods
  async getAllFlipkartGroceryPos(): Promise<(FlipkartGroceryPoHeader & { poLines: FlipkartGroceryPoLines[] })[]> {
    const headers = await db.select().from(flipkartGroceryPoHeader).orderBy(desc(flipkartGroceryPoHeader.created_at));
    
    const result = [];
    for (const header of headers) {
      const lines = await db.select().from(flipkartGroceryPoLines)
        .where(eq(flipkartGroceryPoLines.header_id, header.id))
        .orderBy(flipkartGroceryPoLines.line_number);
      
      result.push({
        ...header,
        poLines: lines
      });
    }
    
    return result;
  }

  async getFlipkartGroceryPoById(id: number): Promise<(FlipkartGroceryPoHeader & { poLines: FlipkartGroceryPoLines[] }) | undefined> {
    const [header] = await db.select().from(flipkartGroceryPoHeader).where(eq(flipkartGroceryPoHeader.id, id));
    
    if (!header) {
      return undefined;
    }
    
    const lines = await db.select().from(flipkartGroceryPoLines)
      .where(eq(flipkartGroceryPoLines.header_id, id))
      .orderBy(flipkartGroceryPoLines.line_number);
    
    return {
      ...header,
      poLines: lines
    };
  }

  async getFlipkartGroceryPoByNumber(poNumber: string): Promise<FlipkartGroceryPoHeader | undefined> {
    const [header] = await db.select().from(flipkartGroceryPoHeader).where(eq(flipkartGroceryPoHeader.po_number, poNumber));
    return header || undefined;
  }

  async createFlipkartGroceryPo(header: InsertFlipkartGroceryPoHeader, lines: InsertFlipkartGroceryPoLines[]): Promise<FlipkartGroceryPoHeader> {
    return await db.transaction(async (tx) => {
      const [createdHeader] = await tx.insert(flipkartGroceryPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          header_id: createdHeader.id
        }));
        await tx.insert(flipkartGroceryPoLines).values(linesWithHeaderId);
      }
      
      return createdHeader;
    });
  }

  async updateFlipkartGroceryPo(id: number, header: Partial<InsertFlipkartGroceryPoHeader>, lines?: InsertFlipkartGroceryPoLines[]): Promise<FlipkartGroceryPoHeader> {
    return await db.transaction(async (tx) => {
      const [updatedHeader] = await tx.update(flipkartGroceryPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(flipkartGroceryPoHeader.id, id))
        .returning();

      if (lines) {
        // Delete existing lines
        await tx.delete(flipkartGroceryPoLines).where(eq(flipkartGroceryPoLines.header_id, id));
        
        // Insert new lines
        if (lines.length > 0) {
          const linesWithHeaderId = lines.map(line => ({
            ...line,
            header_id: id
          }));
          await tx.insert(flipkartGroceryPoLines).values(linesWithHeaderId);
        }
      }

      return updatedHeader;
    });
  }

  async deleteFlipkartGroceryPo(id: number): Promise<void> {
    await db.delete(flipkartGroceryPoHeader).where(eq(flipkartGroceryPoHeader.id, id));
  }

  async getFlipkartGroceryPoLines(poHeaderId: number): Promise<FlipkartGroceryPoLines[]> {
    return await db.select().from(flipkartGroceryPoLines).where(eq(flipkartGroceryPoLines.header_id, poHeaderId));
  }

  // Zepto PO methods
  async getAllZeptoPos(): Promise<(ZeptoPoHeader & { poLines: ZeptoPoLines[] })[]> {
    const headers = await db.select().from(zeptoPoHeader).orderBy(desc(zeptoPoHeader.created_at));
    
    const result = [];
    for (const header of headers) {
      const lines = await db.select().from(zeptoPoLines)
        .where(eq(zeptoPoLines.po_header_id, header.id))
        .orderBy(zeptoPoLines.line_number);
      
      result.push({
        ...header,
        poLines: lines
      });
    }
    
    return result;
  }

  async getZeptoPOById(id: number): Promise<(ZeptoPoHeader & { poLines: ZeptoPoLines[] }) | undefined> {
    const [header] = await db.select().from(zeptoPoHeader).where(eq(zeptoPoHeader.id, id));
    if (!header) return undefined;

    const lines = await db.select().from(zeptoPoLines)
      .where(eq(zeptoPoLines.po_header_id, header.id))
      .orderBy(zeptoPoLines.line_number);

    return {
      ...header,
      poLines: lines
    };
  }

  async getZeptoPoByNumber(poNumber: string): Promise<ZeptoPoHeader | undefined> {
    const [header] = await db.select().from(zeptoPoHeader).where(eq(zeptoPoHeader.po_number, poNumber));
    return header || undefined;
  }

  async createZeptoPo(header: InsertZeptoPoHeader, lines: InsertZeptoPoLines[]): Promise<ZeptoPoHeader> {
    return await db.transaction(async (tx) => {
      // Insert header
      const [createdHeader] = await tx.insert(zeptoPoHeader).values(header).returning();
      
      // Insert lines with header reference
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        
        await tx.insert(zeptoPoLines).values(linesWithHeaderId);
      }
      
      return createdHeader;
    });
  }

  async updateZeptoPo(id: number, header: Partial<InsertZeptoPoHeader>, lines?: InsertZeptoPoLines[]): Promise<ZeptoPoHeader> {
    return await db.transaction(async (tx) => {
      // Update header
      const [updatedHeader] = await tx
        .update(zeptoPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(zeptoPoHeader.id, id))
        .returning();

      // Update lines if provided
      if (lines) {
        // Delete existing lines
        await tx.delete(zeptoPoLines).where(eq(zeptoPoLines.po_header_id, id));
        
        // Insert new lines
        if (lines.length > 0) {
          const linesWithHeaderId = lines.map(line => ({
            ...line,
            po_header_id: id
          }));
          
          await tx.insert(zeptoPoLines).values(linesWithHeaderId);
        }
      }

      return updatedHeader;
    });
  }

  async deleteZeptoPo(id: number): Promise<void> {
    await db.delete(zeptoPoHeader).where(eq(zeptoPoHeader.id, id));
  }

  // City Mall PO methods
  async getAllCityMallPos(): Promise<(CityMallPoHeader & { poLines: CityMallPoLines[] })[]> {
    const pos = await db.select().from(cityMallPoHeader).orderBy(desc(cityMallPoHeader.created_at));
    
    const posWithLines = await Promise.all(
      pos.map(async (po) => {
        const lines = await db.select().from(cityMallPoLines).where(eq(cityMallPoLines.po_header_id, po.id));
        return { ...po, poLines: lines };
      })
    );
    
    return posWithLines;
  }

  async getCityMallPoById(id: number): Promise<(CityMallPoHeader & { poLines: CityMallPoLines[] }) | undefined> {
    const [po] = await db.select().from(cityMallPoHeader).where(eq(cityMallPoHeader.id, id));
    if (!po) return undefined;
    
    const lines = await db.select().from(cityMallPoLines).where(eq(cityMallPoLines.po_header_id, id));
    return { ...po, poLines: lines };
  }

  async createCityMallPo(header: InsertCityMallPoHeader, lines: InsertCityMallPoLines[]): Promise<CityMallPoHeader> {
    return await db.transaction(async (tx) => {
      const [createdHeader] = await tx.insert(cityMallPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        await tx.insert(cityMallPoLines).values(linesWithHeaderId);
      }
      
      return createdHeader;
    });
  }

  async updateCityMallPo(id: number, header: Partial<InsertCityMallPoHeader>, lines?: InsertCityMallPoLines[]): Promise<CityMallPoHeader> {
    return await db.transaction(async (tx) => {
      const [updatedHeader] = await tx
        .update(cityMallPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(cityMallPoHeader.id, id))
        .returning();
      
      if (lines) {
        await tx.delete(cityMallPoLines).where(eq(cityMallPoLines.po_header_id, id));
        if (lines.length > 0) {
          const linesWithHeaderId = lines.map(line => ({
            ...line,
            po_header_id: id
          }));
          await tx.insert(cityMallPoLines).values(linesWithHeaderId);
        }
      }
      
      return updatedHeader;
    });
  }

  async deleteCityMallPo(id: number): Promise<void> {
    await db.delete(cityMallPoHeader).where(eq(cityMallPoHeader.id, id));
  }

  async getCityMallPoByNumber(poNumber: string): Promise<CityMallPoHeader | undefined> {
    const [header] = await db.select().from(cityMallPoHeader).where(eq(cityMallPoHeader.po_number, poNumber));
    return header || undefined;
  }

  // Blinkit PO methods
  async getAllBlinkitPos(): Promise<(BlinkitPoHeader & { poLines: BlinkitPoLines[] })[]> {
    const pos = await db.select().from(blinkitPoHeader).orderBy(desc(blinkitPoHeader.created_at));
    
    const posWithLines = await Promise.all(
      pos.map(async (po) => {
        const lines = await db.select().from(blinkitPoLines).where(eq(blinkitPoLines.po_header_id, po.id));
        return { ...po, poLines: lines };
      })
    );
    
    return posWithLines;
  }

  async getBlinkitPoById(id: number): Promise<(BlinkitPoHeader & { poLines: BlinkitPoLines[] }) | undefined> {
    const [po] = await db.select().from(blinkitPoHeader).where(eq(blinkitPoHeader.id, id));
    if (!po) return undefined;
    
    const lines = await db.select().from(blinkitPoLines).where(eq(blinkitPoLines.po_header_id, id));
    return { ...po, poLines: lines };
  }

  async createBlinkitPo(header: InsertBlinkitPoHeader, lines: InsertBlinkitPoLines[]): Promise<BlinkitPoHeader> {
    return await db.transaction(async (tx) => {
      const [createdHeader] = await tx.insert(blinkitPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        await tx.insert(blinkitPoLines).values(linesWithHeaderId);
      }
      
      return createdHeader;
    });
  }

  async updateBlinkitPo(id: number, header: Partial<InsertBlinkitPoHeader>, lines?: InsertBlinkitPoLines[]): Promise<BlinkitPoHeader> {
    return await db.transaction(async (tx) => {
      const [updatedHeader] = await tx
        .update(blinkitPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(blinkitPoHeader.id, id))
        .returning();
      
      if (lines) {
        await tx.delete(blinkitPoLines).where(eq(blinkitPoLines.po_header_id, id));
        if (lines.length > 0) {
          const linesWithHeaderId = lines.map(line => ({
            ...line,
            po_header_id: id
          }));
          await tx.insert(blinkitPoLines).values(linesWithHeaderId);
        }
      }
      
      return updatedHeader;
    });
  }

  async deleteBlinkitPo(id: number): Promise<void> {
    await db.delete(blinkitPoHeader).where(eq(blinkitPoHeader.id, id));
  }

  async getBlinkitPoByNumber(poNumber: string): Promise<BlinkitPoHeader | undefined> {
    const [header] = await db.select().from(blinkitPoHeader).where(eq(blinkitPoHeader.po_number, poNumber));
    return header || undefined;
  }

  // Swiggy PO methods
  async getAllSwiggyPos(): Promise<(SwiggyPo & { poLines: SwiggyPoLine[] })[]> {
    const pos = await db
      .select()
      .from(swiggyPos)
      .orderBy(desc(swiggyPos.created_at));

    return await Promise.all(
      pos.map(async (po) => {
        const lines = await db
          .select()
          .from(swiggyPoLines)
          .where(eq(swiggyPoLines.po_id, po.id))
          .orderBy(swiggyPoLines.line_number);
        return { ...po, poLines: lines };
      })
    );
  }

  async getSwiggyPoById(id: number): Promise<(SwiggyPo & { poLines: SwiggyPoLine[] }) | undefined> {
    const [po] = await db
      .select()
      .from(swiggyPos)
      .where(eq(swiggyPos.id, id));

    if (!po) return undefined;

    const lines = await db
      .select()
      .from(swiggyPoLines)
      .where(eq(swiggyPoLines.po_id, po.id))
      .orderBy(swiggyPoLines.line_number);

    return { ...po, poLines: lines };
  }

  async getSwiggyPoByNumber(poNumber: string): Promise<SwiggyPo | undefined> {
    const [po] = await db
      .select()
      .from(swiggyPos)
      .where(eq(swiggyPos.po_number, poNumber));

    return po || undefined;
  }

  async createSwiggyPo(po: InsertSwiggyPo, lines: InsertSwiggyPoLine[]): Promise<SwiggyPo> {
    return await db.transaction(async (tx) => {
      const [createdPo] = await tx.insert(swiggyPos).values(po).returning();
      
      if (lines.length > 0) {
        const linesWithPoId = lines.map(line => ({ ...line, po_id: createdPo.id }));
        await tx.insert(swiggyPoLines).values(linesWithPoId);
      }
      
      return createdPo;
    });
  }

  async updateSwiggyPo(id: number, po: Partial<InsertSwiggyPo>): Promise<SwiggyPo | undefined> {
    const [updated] = await db
      .update(swiggyPos)
      .set({ ...po, updated_at: new Date() })
      .where(eq(swiggyPos.id, id))
      .returning();
    return updated;
  }

  async deleteSwiggyPo(id: number): Promise<void> {
    await db.delete(swiggyPos).where(eq(swiggyPos.id, id));
  }

  // Distributor methods
  async getAllDistributors(): Promise<DistributorMst[]> {
    return await db.select().from(distributorMst).where(eq(distributorMst.status, 'Active')).orderBy(distributorMst.distributor_name);
  }

  async getDistributorById(id: number): Promise<DistributorMst | undefined> {
    const [distributor] = await db.select().from(distributorMst).where(eq(distributorMst.id, id));
    return distributor || undefined;
  }

  async createDistributor(distributor: InsertDistributorMst): Promise<DistributorMst> {
    const [result] = await db.insert(distributorMst).values(distributor).returning();
    return result;
  }

  async updateDistributor(id: number, distributor: Partial<InsertDistributorMst>): Promise<DistributorMst> {
    const [result] = await db
      .update(distributorMst)
      .set({ ...distributor, updated_at: new Date() })
      .where(eq(distributorMst.id, id))
      .returning();
    return result;
  }

  async deleteDistributor(id: number): Promise<void> {
    await db.delete(distributorMst).where(eq(distributorMst.id, id));
  }

  // Distributor PO methods
  async getAllDistributorPos(): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] })[]> {
    const pos = await db.select().from(distributorPo).orderBy(desc(distributorPo.created_at));
    
    const result = [];
    for (const po of pos) {
      // Get distributor details
      const [distributor] = await db.select().from(distributorMst).where(eq(distributorMst.id, po.distributor_id));
      
      // Get order items
      const orderItems = await db.select().from(distributorOrderItems).where(eq(distributorOrderItems.po_id, po.id));
      
      result.push({
        ...po,
        distributor: distributor!,
        orderItems
      });
    }
    
    return result;
  }

  async getDistributorPoById(id: number): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] }) | undefined> {
    const [po] = await db.select().from(distributorPo).where(eq(distributorPo.id, id));
    
    if (!po) {
      return undefined;
    }

    // Get distributor details
    const [distributor] = await db.select().from(distributorMst).where(eq(distributorMst.id, po.distributor_id));
    
    // Get order items
    const orderItems = await db.select().from(distributorOrderItems).where(eq(distributorOrderItems.po_id, po.id));
    
    return {
      ...po,
      distributor: distributor!,
      orderItems
    };
  }

  async createDistributorPo(po: InsertDistributorPo, items: InsertDistributorOrderItems[]): Promise<DistributorPo> {
    return await db.transaction(async (tx) => {
      // Create PO header
      const [createdPo] = await tx.insert(distributorPo).values(po).returning();
      
      // Create PO items
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_id: createdPo.id
        }));
        await tx.insert(distributorOrderItems).values(itemsWithPoId);
      }
      
      return createdPo;
    });
  }

  async updateDistributorPo(id: number, po: Partial<InsertDistributorPo>, items?: InsertDistributorOrderItems[]): Promise<DistributorPo> {
    return await db.transaction(async (tx) => {
      // Update PO header
      const [updatedPo] = await tx
        .update(distributorPo)
        .set({ ...po, updated_at: new Date() })
        .where(eq(distributorPo.id, id))
        .returning();

      // If items are provided, update them
      if (items && items.length > 0) {
        // Delete existing items
        await tx.delete(distributorOrderItems).where(eq(distributorOrderItems.po_id, id));
        
        // Insert new items
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_id: id
        }));
        await tx.insert(distributorOrderItems).values(itemsWithPoId);
      }

      return updatedPo;
    });
  }

  async deleteDistributorPo(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete order items first
      await tx.delete(distributorOrderItems).where(eq(distributorOrderItems.po_id, id));
      // Delete PO header
      await tx.delete(distributorPo).where(eq(distributorPo.id, id));
    });
  }

  // Distributor Order Items methods
  async getAllDistributorOrderItems(): Promise<(DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[]> {
    const items = await db.select({
      id: distributorOrderItems.id,
      po_id: distributorOrderItems.po_id,
      item_name: distributorOrderItems.item_name,
      quantity: distributorOrderItems.quantity,
      sap_code: distributorOrderItems.sap_code,
      category: distributorOrderItems.category,
      subcategory: distributorOrderItems.subcategory,
      basic_rate: distributorOrderItems.basic_rate,
      gst_rate: distributorOrderItems.gst_rate,
      landing_rate: distributorOrderItems.landing_rate,
      total_litres: distributorOrderItems.total_litres,
      status: distributorOrderItems.status,
      hsn_code: distributorOrderItems.hsn_code,
      po_number: distributorPo.po_number,
      distributor_name: distributorMst.distributor_name,
      order_date: distributorPo.order_date,
      expiry_date: distributorPo.expiry_date,
      distributor: distributorMst
    })
    .from(distributorOrderItems)
    .leftJoin(distributorPo, eq(distributorOrderItems.po_id, distributorPo.id))
    .leftJoin(distributorMst, eq(distributorPo.distributor_id, distributorMst.id))
    .orderBy(desc(distributorPo.created_at));
    
    // Type assertion to fix the return type mismatch
    return items as (DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[];
  }

  // BigBasket PO methods
  async getAllBigbasketPos(): Promise<BigbasketPoHeader[]> {
    return await db.select().from(bigbasketPoHeader).orderBy(desc(bigbasketPoHeader.created_at));
  }

  async getBigbasketPoById(id: number): Promise<BigbasketPoHeader | undefined> {
    const [po] = await db.select().from(bigbasketPoHeader).where(eq(bigbasketPoHeader.id, id));
    return po || undefined;
  }

  async createBigbasketPo(po: InsertBigbasketPoHeader, lines: InsertBigbasketPoLines[]): Promise<BigbasketPoHeader> {
    return await db.transaction(async (tx) => {
      const [createdPo] = await tx.insert(bigbasketPoHeader).values(po).returning();
      
      if (lines.length > 0) {
        const linesWithPoId = lines.map(line => ({ ...line, po_id: createdPo.id }));
        await tx.insert(bigbasketPoLines).values(linesWithPoId);
      }
      
      return createdPo;
    });
  }

  async updateBigbasketPo(id: number, po: Partial<InsertBigbasketPoHeader>): Promise<BigbasketPoHeader | undefined> {
    const [updated] = await db
      .update(bigbasketPoHeader)
      .set({ ...po, updated_at: new Date() })
      .where(eq(bigbasketPoHeader.id, id))
      .returning();
    return updated;
  }

  async deleteBigbasketPo(id: number): Promise<void> {
    await db.delete(bigbasketPoHeader).where(eq(bigbasketPoHeader.id, id));
  }
}

export const storage = new DatabaseStorage();
