import { 
  type User, 
  type InsertUser,
  type UpdateUser,
  type PfMst,
  type InsertPfMst,
  type SapItemMst,
  type InsertSapItemMst,
  type SapItemMstApi,
  type InsertSapItemMstApi,
  type Items,
  type InsertItems,
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
  type ZomatoPoHeader,
  type ZomatoPoItems,
  type InsertZomatoPoHeader,
  type InsertZomatoPoItems,
  type DealsharePoHeader,
  type DealsharePoItems,
  type InsertDealsharePoHeader,
  type InsertDealsharePoItems,
  type SecondarySalesHeader,
  type SecondarySalesItems,
  type InsertSecondarySalesHeader,
  type InsertSecondarySalesItems,
  type ScAmJwDaily,
  type InsertScAmJwDaily,
  type ScAmJwRange,
  type InsertScAmJwRange,
  type ScAmJmDaily,
  type InsertScAmJmDaily,
  type ScAmJmRange,
  type InsertScAmJmRange,
  type ZeptoSecondarySalesItem,
  type InsertZeptoSecondarySalesItem,
  type ZeptoSecondarySalesRangeItem,
  type InsertZeptoSecondarySalesRangeItem,
  type BlinkitSecondarySalesItem,
  type InsertBlinkitSecondarySalesItem,
  type BlinkitSecondarySalesRangeItem,
  type InsertBlinkitSecondarySalesRangeItem,
  type SwiggySecondarySalesItem,
  type InsertSwiggySecondarySalesItem,
  type SwiggySecondarySalesRangeItem,
  type InsertSwiggySecondarySalesRangeItem,
  type JioMartSaleSecondarySalesItem,
  type InsertJioMartSaleSecondarySalesItem,
  type JioMartSaleSecondarySalesRangeItem,
  type InsertJioMartSaleSecondarySalesRangeItem,
  type JioMartCancelSecondarySalesItem,
  type InsertJioMartCancelSecondarySalesItem,
  type JioMartCancelSecondarySalesRangeItem,
  type InsertJioMartCancelSecondarySalesRangeItem,
  type BigBasketSecondarySalesItem,
  type InsertBigBasketSecondarySalesItem,
  type BigBasketSecondarySalesRangeItem,
  type InsertBigBasketSecondarySalesRangeItem,

  type JioMartInventoryItem,
  type InsertJioMartInventoryItem,
  type JioMartInventoryRangeItem,
  type InsertJioMartInventoryRangeItem,
  type BlinkitInventoryItem,
  type InsertBlinkitInventoryItem,
  type SwiggyInventoryItem,
  type InsertSwiggyInventoryItem,
  type SwiggyInventoryRange,
  type InsertSwiggyInventoryRange,
  type FlipkartInventoryDaily,
  type InsertFlipkartInventoryDaily,
  type FlipkartInventoryRange,
  type InsertFlipkartInventoryRange,
  type ZeptoInventoryDaily,
  type InsertZeptoInventoryDaily,
  type ZeptoInventoryRange,
  type InsertZeptoInventoryRange,
  type BigBasketInventoryDaily,
  type InsertBigBasketInventoryDaily,
  type BigBasketInventoryRange,
  type InsertBigBasketInventoryRange,

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
  zomatoPoHeader,
  zomatoPoItems,
  dealsharePoHeader,
  dealsharePoItems,
  secondarySalesHeader,
  secondarySalesItems,
  scAmJwDaily,
  scAmJwRange,
  scAmJmDaily,
  scAmJmRange,
  scZeptoJmDaily,
  scZeptoJmRange,
  scBlinkitJmDaily,
  scBlinkitJmRange,
  scSwiggyJmDaily,
  scSwiggyJmRange,
  scJioMartSaleJmDaily,
  scJioMartSaleJmRange,
  scJioMartCancelJmDaily,
  scJioMartCancelJmRange,
  scBigBasketJmDaily,
  scBigBasketJmRange,

  invJioMartJmDaily,
  invJioMartJmRange,
  invBlinkitJmDaily,
  invBlinkitJmRange,
  invAmazonJmDaily,
  invAmazonJmRange,
  invAmazonJwDaily,
  invAmazonJwRange,
  invSwiggyJmDaily,
  invSwiggyJmRange,
  invFlipkartJmDaily,
  invFlipkartJmRange,
  invZeptoJmDaily,
  invZeptoJmRange,
  invBigBasketJmDaily,
  invBigBasketJmRange,

  distributorMst,
  distributorPo,
  distributorOrderItems,
  
  poMaster,
  poLines,
  type PoMaster,
  type InsertPoMaster,
  type PoLines,
  type InsertPoLines,
  
  statesMst,
  districtsMst,
  states,
  districts,
  distributors,
  type StatesMst,
  type InsertStatesMst,
  type DistrictsMst,
  type InsertDistrictsMst,
  type States,
  type Districts,
  type Distributors,
  
  // Status tables
  statuses,
  statusItem,
  type Statuses,
  type StatusItem,
  
  // Items table
  items
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Enhanced user methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: UpdateUser): Promise<User>;
  updateLastLogin(id: number): Promise<void>;
  changePassword(id: number, hashedPassword: string): Promise<void>;
  
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
  getRawPoData(id: number): Promise<any>; // DEBUG: Get raw database data
  createPo(po: InsertPfPo, items: InsertPfOrderItems[]): Promise<PfPo>;
  updatePo(id: number, po: Partial<InsertPfPo>, items?: InsertPfOrderItems[]): Promise<PfPo>;
  deletePo(id: number): Promise<void>;
  
  // Order Items methods
  getAllOrderItems(): Promise<(PfOrderItems & { po_number: string; platform_name: string; order_date: Date; expiry_date: Date | null; platform: PfMst })[]>;
  updateOrderItemStatus(id: number, status: string): Promise<PfOrderItems>;
  
  // Status methods
  getAllStatuses(): Promise<Statuses[]>;
  getAllStatusItems(): Promise<StatusItem[]>;
  
  // Items methods
  getAllItems(): Promise<any[]>;
  searchItems(query: string): Promise<any[]>;
  getItemByCode(itemcode: string): Promise<any | undefined>;
  getItemByName(itemname: string): Promise<any | undefined>;
  createItem(item: InsertItems): Promise<Items>;
  updateItem(itemcode: string, item: Partial<InsertItems>): Promise<Items>;
  syncItemsFromHana(hanaItems: any[]): Promise<number>;
  
  // Generic PO Master and Lines methods
  getAllPoMasters(): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[] })[]>;
  getPoMasterById(id: number): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[] }) | undefined>;
  getPoMasterByNumber(poNumber: string): Promise<PoMaster | undefined>;
  createPoMaster(master: InsertPoMaster, lines: InsertPoLines[]): Promise<PoMaster>;
  updatePoMaster(id: number, master: Partial<InsertPoMaster>, lines?: InsertPoLines[]): Promise<PoMaster>;
  deletePoMaster(id: number): Promise<void>;

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

  // State and District methods for dynamic dropdowns (using original tables)
  getAllStates(): Promise<States[]>;
  getDistrictsByStateId(stateId: number): Promise<Districts[]>;
  getAllDistributors(): Promise<Distributors[]>;

  // Distributor PO methods
  getAllDistributorPos(): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] })[]>;
  getDistributorPoById(id: number): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] }) | undefined>;
  createDistributorPo(po: InsertDistributorPo, items: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  updateDistributorPo(id: number, po: Partial<InsertDistributorPo>, items?: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  deleteDistributorPo(id: number): Promise<void>;

  // Distributor Order Items methods
  getAllDistributorOrderItems(): Promise<(DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[]>;

  // BigBasket PO methods
  getAllBigbasketPos(): Promise<(BigbasketPoHeader & { poLines: BigbasketPoLines[] })[]>;
  getBigbasketPoById(id: number): Promise<(BigbasketPoHeader & { poLines: BigbasketPoLines[] }) | undefined>;
  getBigbasketPoByNumber(poNumber: string): Promise<BigbasketPoHeader | undefined>;
  createBigbasketPo(header: InsertBigbasketPoHeader, lines: InsertBigbasketPoLines[]): Promise<BigbasketPoHeader>;
  updateBigbasketPo(id: number, header: Partial<InsertBigbasketPoHeader>, lines?: InsertBigbasketPoLines[]): Promise<BigbasketPoHeader>;
  deleteBigbasketPo(id: number): Promise<void>;

  // Zomato PO methods
  getAllZomatoPos(): Promise<(ZomatoPoHeader & { poItems: ZomatoPoItems[] })[]>;
  getZomatoPoById(id: number): Promise<(ZomatoPoHeader & { poItems: ZomatoPoItems[] }) | undefined>;
  getZomatoPoByNumber(poNumber: string): Promise<ZomatoPoHeader | undefined>;
  createZomatoPo(header: InsertZomatoPoHeader, items: InsertZomatoPoItems[]): Promise<ZomatoPoHeader>;
  updateZomatoPo(id: number, header: Partial<InsertZomatoPoHeader>, items?: InsertZomatoPoItems[]): Promise<ZomatoPoHeader>;
  deleteZomatoPo(id: number): Promise<void>;

  // Secondary Sales methods
  getAllSecondarySales(platform?: string, businessUnit?: string): Promise<(SecondarySalesHeader & { salesItems: SecondarySalesItems[] })[]>;
  getSecondarySalesById(id: number): Promise<(SecondarySalesHeader & { salesItems: SecondarySalesItems[] }) | undefined>;
  createSecondarySales(header: InsertSecondarySalesHeader, items: InsertSecondarySalesItems[]): Promise<SecondarySalesHeader>;
  updateSecondarySales(id: number, header: Partial<InsertSecondarySalesHeader>, items?: InsertSecondarySalesItems[]): Promise<SecondarySalesHeader>;
  deleteSecondarySales(id: number): Promise<void>;

  // Specific Secondary Sales table methods
  createScAmJwDaily(items: InsertScAmJwDaily[]): Promise<ScAmJwDaily[]>;
  createScAmJwRange(items: InsertScAmJwRange[]): Promise<ScAmJwRange[]>;
  createScAmJmDaily(items: InsertScAmJmDaily[]): Promise<ScAmJmDaily[]>;
  createScAmJmRange(items: InsertScAmJmRange[]): Promise<ScAmJmRange[]>;
  
  // New secondary sales platforms
  createScZeptoJmDaily(items: InsertZeptoSecondarySalesItem[]): Promise<ZeptoSecondarySalesItem[]>;
  createScZeptoJmRange(items: InsertZeptoSecondarySalesRangeItem[]): Promise<ZeptoSecondarySalesRangeItem[]>;
  createScBlinkitJmDaily(items: InsertBlinkitSecondarySalesItem[]): Promise<BlinkitSecondarySalesItem[]>;
  createScBlinkitJmRange(items: InsertBlinkitSecondarySalesRangeItem[]): Promise<BlinkitSecondarySalesRangeItem[]>;
  createScSwiggyJmDaily(items: InsertSwiggySecondarySalesItem[]): Promise<SwiggySecondarySalesItem[]>;
  createScSwiggyJmRange(items: InsertSwiggySecondarySalesRangeItem[]): Promise<SwiggySecondarySalesRangeItem[]>;
  createScJioMartSaleJmDaily(items: InsertJioMartSaleSecondarySalesItem[]): Promise<JioMartSaleSecondarySalesItem[]>;
  createScJioMartSaleJmRange(items: InsertJioMartSaleSecondarySalesRangeItem[]): Promise<JioMartSaleSecondarySalesRangeItem[]>;
  createScJioMartCancelJmDaily(items: InsertJioMartCancelSecondarySalesItem[]): Promise<JioMartCancelSecondarySalesItem[]>;
  createScJioMartCancelJmRange(items: InsertJioMartCancelSecondarySalesRangeItem[]): Promise<JioMartCancelSecondarySalesRangeItem[]>;
  createScBigBasketJmDaily(items: InsertBigBasketSecondarySalesItem[]): Promise<BigBasketSecondarySalesItem[]>;
  createScBigBasketJmRange(items: InsertBigBasketSecondarySalesRangeItem[]): Promise<BigBasketSecondarySalesRangeItem[]>;
  getScAmJwDaily(dateStart?: string, dateEnd?: string): Promise<ScAmJwDaily[]>;
  getScAmJwRange(dateStart?: string, dateEnd?: string): Promise<ScAmJwRange[]>;
  getScAmJmDaily(dateStart?: string, dateEnd?: string): Promise<ScAmJmDaily[]>;
  getScAmJmRange(dateStart?: string, dateEnd?: string): Promise<ScAmJmRange[]>;

  // Inventory Management methods
  getAllInventory(platform?: string, businessUnit?: string): Promise<any[]>;
  getInventoryById(id: number): Promise<any>;
  createInventoryJioMartJmDaily(items: InsertJioMartInventoryItem[]): Promise<JioMartInventoryItem[]>;
  createInventoryJioMartJmRange(items: InsertJioMartInventoryRangeItem[]): Promise<JioMartInventoryRangeItem[]>;
  updateInventory(id: number, header: any, items: any): Promise<any>;
  deleteInventory(id: number): Promise<void>;

  
  sessionStore: session.SessionStore;
}

import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pool as any,
      createTableIfMissing: true,
    });
  }
  // Enhanced user methods with session store
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ last_login: new Date() })
      .where(eq(users.id, id));
  }

  async changePassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        password: hashedPassword, 
        password_changed_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(users.id, id));
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
    const result = [];
    
    // Get regular POs from pf_po table
    const regularPos = await db
      .select({
        po: pfPo,
        platform: pfMst
      })
      .from(pfPo)
      .leftJoin(pfMst, eq(pfPo.platform, pfMst.id))
      .orderBy(desc(pfPo.created_at));

    // Process regular POs from pf_po table
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

    // Also fetch POs from po_master table and convert them to the same format
    const masterPos = await db
      .select({
        master: poMaster,
        platform: pfMst,
        distributor: distributorMst
      })
      .from(poMaster)
      .leftJoin(pfMst, eq(poMaster.platform_id, pfMst.id))
      .leftJoin(distributorMst, eq(poMaster.distributor_id, distributorMst.id))
      .orderBy(desc(poMaster.create_on));

    // Process POs from po_master table
    for (const { master, platform, distributor } of masterPos) {
      const lines = await db
        .select({
          line: poLines,
          platformItem: pfItemMst
        })
        .from(poLines)
        .leftJoin(pfItemMst, eq(poLines.platform_product_code_id, pfItemMst.id))
        .where(eq(poLines.po_id, master.id));
      
      // Convert po_master format to pf_po format for compatibility
      const convertedPo = {
        id: master.id,
        po_number: master.vendor_po_number,
        platform: platform!,
        serving_distributor: distributor?.distributor_name || null,
        order_date: master.po_date,
        expiry_date: master.expiry_date,
        appointment_date: master.appointment_date,
        city: master.area || '',
        state: master.region || '',
        status: master.status_id === 1 ? 'Open' : master.status_id === 2 ? 'Closed' : 'Cancelled',
        attachment: null,
        created_at: master.create_on,
        updated_at: master.updated_on,
        region: master.region || '',
        area: master.area || '',
        orderItems: lines.length > 0 ? lines.map(({ line, platformItem }) => ({
          id: line.id,
          po_id: master.id,
          item_name: platformItem?.pf_itemname || `Product ID: ${line.platform_product_code_id}`,
          quantity: parseInt(line.quantity || '0'),
          sap_code: platformItem?.pf_itemcode || null,
          category: null,
          subcategory: null,
          basic_rate: line.basic_amount?.toString() || '0',
          gst_rate: line.tax?.toString() || '0',
          landing_rate: line.landing_amount?.toString() || '0',
          total_litres: line.total_liter?.toString() || null,
          status: line.status ? 'Completed' : 'Pending',
          hsn_code: null
        })) : [
          // If no lines exist, create a placeholder item to show PO exists
          {
            id: 0,
            po_id: master.id,
            item_name: `Items for PO ${master.vendor_po_number}`,
            quantity: 1,
            sap_code: null,
            category: null,
            subcategory: null,
            basic_rate: '0.00',
            gst_rate: '0.00',
            landing_rate: '0.00',
            total_litres: null,
            status: 'Pending',
            hsn_code: null
          }
        ]
      };
      
      result.push(convertedPo);
    }

    // TODO: Add platform-specific table fetching here if needed
    // For now, focus on getting unified po_master table working properly

    // Sort results by created_at descending  
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return result;
  }

  // DEBUG: Get raw database data to understand structure  
  async getRawPoData(id: number): Promise<any> {
    // Get raw data from po_master table
    const [masterResult] = await db
      .select()
      .from(poMaster)
      .where(eq(poMaster.id, id))
      .limit(1);

    if (!masterResult) return null;

    // Get raw data from po_lines table
    const linesResult = await db
      .select()
      .from(poLines)
      .where(eq(poLines.po_id, id));

    return {
      po_master: masterResult,
      po_lines: linesResult,
      summary: {
        total_fields_in_po_master: Object.keys(masterResult).length,
        po_master_fields: Object.keys(masterResult),
        total_lines: linesResult.length,
        po_lines_sample_fields: linesResult.length > 0 ? Object.keys(linesResult[0]) : []
      }
    };
  }

  async getPoById(id: number): Promise<(Omit<PfPo, 'platform'> & { platform: PfMst; orderItems: PfOrderItems[] }) | undefined> {
    // First try to find in po_master table (new structure)
    const masterPoResult = await db
      .select({
        master: poMaster,
        platform: pfMst,
        distributor: distributors,
        state: states,
        district: districts
      })
      .from(poMaster)
      .leftJoin(pfMst, eq(poMaster.platform_id, pfMst.id))
      .leftJoin(distributors, eq(poMaster.distributor_id, distributors.id))
      .leftJoin(states, eq(poMaster.state_id, states.id))
      .leftJoin(districts, eq(poMaster.district_id, districts.id))
      .where(eq(poMaster.id, id))
      .limit(1);

    if (masterPoResult.length > 0) {
      const { master, platform, distributor, state, district } = masterPoResult[0];
      if (!platform) return undefined;

      // Get the line items for this PO
      const lines = await db
        .select({
          line: poLines,
          platformItem: pfItemMst
        })
        .from(poLines)
        .leftJoin(pfItemMst, eq(poLines.platform_product_code_id, pfItemMst.id))
        .where(eq(poLines.po_id, master.id));

      // Convert po_master format to pf_po format for compatibility
      const convertedPo = {
        id: master.id,
        po_number: master.vendor_po_number,
        company: "JIVO MART", // Default company name
        company_id: master.company_id, // Include company ID for editing
        platform: platform,
        serving_distributor: distributor?.name || null,
        distributor_id: master.distributor_id, // Include distributor ID for editing
        series: master.series, // Include series for editing (e.g., "PO")
        po_date: master.po_date,
        delivery_date: master.delivery_date, // Include delivery date for editing
        expiry_date: master.expiry_date,
        appointment_date: master.appointment_date,
        region: master.region,
        state: state?.statename || null,
        state_id: master.state_id, // Include state ID for editing
        city: district?.district || null,
        district_id: master.district_id, // Include district ID for editing
        area: master.area,
        dispatch_from: master.dispatch_from,
        ware_house: master.ware_house,
        warehouse: master.ware_house,
        status: master.status_id === 1 ? "OPEN" : master.status_id === 2 ? "INVOICED" : "OPEN", // Map status_id to status string
        status_id: master.status_id, // Include status ID for editing
        created_by: master.created_by, // Include created_by for editing
        comments: null, // Not stored in po_master currently
        created_at: master.create_on,
        updated_at: master.updated_on,
        order_date: master.po_date,
        orderItems: lines.length > 0 ? lines.map(({ line, platformItem }) => ({
          id: line.id,
          po_id: line.po_id,
          item_name: platformItem?.pf_itemname || `Product ID: ${line.platform_product_code_id}`,
          quantity: parseInt(line.quantity || '0'),
          sap_code: platformItem?.pf_itemcode || '',
          platform_code: platformItem?.pf_itemcode || '',
          uom: line.uom || 'PCS',
          basic_rate: line.basic_amount || '0.00',
          gst_rate: line.tax || '0.00',
          landing_rate: line.landing_amount || '0.00',
          boxes: line.boxes,
          unit_size_ltrs: parseFloat(line.total_liter || '0'),
          loose_qty: null,
          total_ltrs: parseFloat(line.total_liter || '0'),
          hsn_code: null,
          status: 'Pending',
          // Invoice fields from po_lines
          invoice_date: line.invoice_date,
          invoice_litre: line.invoice_litre ? parseFloat(line.invoice_litre) : null,
          invoice_amount: line.invoice_amount ? parseFloat(line.invoice_amount) : null,
          invoice_qty: line.invoice_qty ? parseFloat(line.invoice_qty) : null
        })) : []
      };

      return convertedPo as any;
    }

    // Fallback to original pf_po table lookup
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

  // Generic PO Master and Lines methods
  async getAllPoMasters(): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[] })[]> {
    const masters = await db.select().from(poMaster).orderBy(desc(poMaster.create_on));
    
    const result = [];
    for (const master of masters) {
      // Get platform information
      const platform = await db.select().from(pfMst).where(eq(pfMst.id, master.platform_id)).limit(1);
      
      // Get associated po lines
      const lines = await db.select().from(poLines).where(eq(poLines.po_id, master.id));
      
      result.push({
        ...master,
        platform: platform[0],
        poLines: lines
      });
    }
    
    return result;
  }
  
  async getPoMasterById(id: number): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[] }) | undefined> {
    const master = await db.select().from(poMaster).where(eq(poMaster.id, id)).limit(1);
    if (!master[0]) return undefined;
    
    // Get platform information
    const platform = await db.select().from(pfMst).where(eq(pfMst.id, master[0].platform_id)).limit(1);
    
    // Get associated po lines
    const lines = await db.select().from(poLines).where(eq(poLines.po_id, id));
    
    return {
      ...master[0],
      platform: platform[0],
      poLines: lines
    };
  }
  
  async getPoMasterByNumber(poNumber: string): Promise<PoMaster | undefined> {
    const masters = await db.select().from(poMaster).where(eq(poMaster.vendor_po_number, poNumber)).limit(1);
    return masters[0];
  }
  
  async createPoMaster(master: InsertPoMaster, lines: InsertPoLines[]): Promise<PoMaster> {
    return await db.transaction(async (tx) => {
      const [createdMaster] = await tx.insert(poMaster).values(master).returning();
      
      if (lines.length > 0) {
        const linesWithMasterId = lines.map((line) => ({
          ...line,
          po_id: createdMaster.id
        }));
        await tx.insert(poLines).values(linesWithMasterId);
      }
      
      return createdMaster;
    });
  }
  
  async updatePoMaster(id: number, master: Partial<InsertPoMaster>, lines?: InsertPoLines[]): Promise<PoMaster> {
    return await db.transaction(async (tx) => {
      const [updatedMaster] = await tx
        .update(poMaster)
        .set({ ...master, updated_on: new Date() })
        .where(eq(poMaster.id, id))
        .returning();
      
      if (!updatedMaster) {
        throw new Error('PO Master not found');
      }
      
      if (lines) {
        // Delete existing lines
        await tx.delete(poLines).where(eq(poLines.po_id, id));
        
        // Insert new lines
        if (lines.length > 0) {
          const linesWithMasterId = lines.map((line) => ({
            ...line,
            po_id: id
          }));
          await tx.insert(poLines).values(linesWithMasterId);
        }
      }
      
      return updatedMaster;
    });
  }
  
  async deletePoMaster(id: number): Promise<void> {
    await db.delete(poMaster).where(eq(poMaster.id, id));
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

  // State and District methods for dynamic dropdowns (using original tables)
  async getAllStates(): Promise<States[]> {
    return await db.select().from(states).orderBy(states.statename);
  }

  async getDistrictsByStateId(stateId: number): Promise<Districts[]> {
    return await db.select().from(districts).where(eq(districts.state_id, stateId)).orderBy(districts.district);
  }

  async getAllDistributorsFromOriginalTable(): Promise<Distributors[]> {
    return await db.select().from(distributors).orderBy(distributors.name);
  }

  // Status methods
  async getAllStatuses(): Promise<Statuses[]> {
    return await db.select().from(statuses).where(eq(statuses.is_active, true)).orderBy(statuses.status_name);
  }

  async getAllStatusItems(): Promise<StatusItem[]> {
    return await db.select().from(statusItem).where(eq(statusItem.is_active, true)).orderBy(statusItem.status_name);
  }

  // Items methods - using raw SQL to match actual table structure
  async getAllItems(): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT itemcode, itemname, itmsgrpnam, u_type, u_variety, 
             u_sub_group, u_brand, invntryuom, salpackun, u_islitre, u_tax_rate
      FROM items 
      ORDER BY itemname
    `);
    return result.rows;
  }

  async searchItems(query: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT itemcode, itemname, itmsgrpnam, u_type, u_variety, 
             u_sub_group, u_brand, invntryuom, salpackun, u_islitre, u_tax_rate
      FROM items 
      WHERE itemname ILIKE ${`%${query}%`}
      ORDER BY itemname
      LIMIT 100
    `);
    return result.rows;
  }

  async getItemByCode(itemcode: string): Promise<any | undefined> {
    const result = await db.execute(sql`
      SELECT itemcode, itemname, itmsgrpnam, u_type, u_variety, 
             u_sub_group, u_brand, invntryuom, salpackun, u_islitre, u_tax_rate
      FROM items 
      WHERE itemcode = ${itemcode}
      LIMIT 1
    `);
    return result.rows[0];
  }

  async getItemByName(itemname: string): Promise<any | undefined> {
    const result = await db.execute(sql`
      SELECT itemcode, itemname, itmsgrpnam, u_type, u_variety, 
             u_sub_group, u_brand, invntryuom, salpackun, u_islitre, u_tax_rate
      FROM items 
      WHERE itemname ILIKE ${itemname}
      LIMIT 1
    `);
    return result.rows[0];
  }

  async createItem(item: InsertItems): Promise<Items> {
    const result = await db.insert(items).values(item).returning();
    return result[0];
  }

  async updateItem(itemcode: string, item: Partial<InsertItems>): Promise<Items> {
    const result = await db.update(items)
      .set({ ...item, updated_at: new Date() })
      .where(eq(items.itemcode, itemcode))
      .returning();
    return result[0];
  }

  async syncItemsFromHana(hanaItems: any[]): Promise<number> {
    let syncedCount = 0;
    
    for (const hanaItem of hanaItems) {
      try {
        // Map HANA fields to our items table structure
        const itemData: InsertItems = {
          itemcode: hanaItem.ItemCode || '',
          itemname: hanaItem.ItemName || '',
          itemgroup: hanaItem.ItmsGrpNam || hanaItem.ItemGroup || null,
          type: hanaItem.U_TYPE || null,
          variety: hanaItem.U_Variety || null,
          subgroup: hanaItem.U_Sub_Group || hanaItem.SubGroup || null,
          brand: hanaItem.U_Brand || hanaItem.Brand || null,
          uom: hanaItem.InvntryUom || hanaItem.UOM || hanaItem.UnitOfMeasure || null,
          taxrate: hanaItem.U_Tax_Rate ? parseFloat(hanaItem.U_Tax_Rate) : (hanaItem.TaxRate ? parseFloat(hanaItem.TaxRate.toString()) : null),
          unitsize: hanaItem.U_IsLitre || hanaItem.UnitSize?.toString() || null,
          is_litre: hanaItem.U_IsLitre === 'Y' || hanaItem.IsLitre === true || false,
          case_pack: hanaItem.SalPackUn || hanaItem.CasePack || null,
          basic_rate: hanaItem.BasicRate ? hanaItem.BasicRate.toString() : null,
          landing_rate: hanaItem.LandingRate ? hanaItem.LandingRate.toString() : null,
          mrp: hanaItem.MRP ? hanaItem.MRP.toString() : null,
          last_synced: new Date()
        };

        // Check if item already exists
        const existingItem = await this.getItemByCode(itemData.itemcode);
        
        if (existingItem) {
          // Update existing item
          await this.updateItem(itemData.itemcode, itemData);
        } else {
          // Create new item
          await this.createItem(itemData);
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing item ${hanaItem.ItemCode}:`, error);
      }
    }
    
    return syncedCount;
  }

  async seedStatusTables(): Promise<void> {
    try {
      // Seed PO statuses
      const poStatusData = [
        { status_name: 'OPEN', description: 'Purchase order is open and active', is_active: true },
        { status_name: 'CLOSED', description: 'Purchase order is closed/completed', is_active: true },
        { status_name: 'CANCELLED', description: 'Purchase order has been cancelled', is_active: true },
        { status_name: 'EXPIRED', description: 'Purchase order has expired', is_active: true },
        { status_name: 'DUPLICATE', description: 'Purchase order is marked as duplicate', is_active: true },
        { status_name: 'INVOICED', description: 'Purchase order has been invoiced', is_active: true }
      ];

      for (const status of poStatusData) {
        try {
          await db.insert(statuses).values(status);
        } catch (error: any) {
          if (error.code !== '23505') { // Ignore unique constraint violations
            throw error;
          }
        }
      }

      // Seed item statuses
      const itemStatusData = [
        { 
          status_name: 'PENDING', 
          description: 'Item is pending processing', 
          requires_invoice_fields: false, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'DISPATCHED', 
          description: 'Item has been dispatched', 
          requires_invoice_fields: false, 
          requires_dispatch_date: true, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'DELIVERED', 
          description: 'Item has been delivered', 
          requires_invoice_fields: false, 
          requires_dispatch_date: true, 
          requires_delivery_date: true, 
          is_active: true 
        },
        { 
          status_name: 'INVOICED', 
          description: 'Item has been invoiced', 
          requires_invoice_fields: true, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'CANCELLED', 
          description: 'Item has been cancelled', 
          requires_invoice_fields: false, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'STOCK_ISSUE', 
          description: 'Item has stock issues', 
          requires_invoice_fields: false, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'RECEIVED', 
          description: 'Item has been received', 
          requires_invoice_fields: false, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        },
        { 
          status_name: 'PARTIAL', 
          description: 'Item partially fulfilled', 
          requires_invoice_fields: false, 
          requires_dispatch_date: false, 
          requires_delivery_date: false, 
          is_active: true 
        }
      ];

      for (const status of itemStatusData) {
        try {
          await db.insert(statusItem).values(status);
        } catch (error: any) {
          if (error.code !== '23505') { // Ignore unique constraint violations
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Error seeding status tables:', error);
      throw error;
    }
  }

  async createStatusTables(): Promise<void> {
    try {
      // Create statuses table with raw SQL
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS statuses (
          id SERIAL PRIMARY KEY,
          status_name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create status_item table with raw SQL
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS status_item (
          id SERIAL PRIMARY KEY,
          status_name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          requires_invoice_fields BOOLEAN DEFAULT FALSE,
          requires_dispatch_date BOOLEAN DEFAULT FALSE,
          requires_delivery_date BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Seed the data
      await this.seedStatusTables();
    } catch (error) {
      console.error('Error creating status tables:', error);
      throw error;
    }
  }

  async checkTableStructure(): Promise<any> {
    try {
      // Check if statuses table exists and its structure
      const statusesInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'statuses' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      // Check if status_item table exists and its structure  
      const statusItemInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'status_item' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      // Check if status_items table exists (plural form)
      const statusItemsInfo = await db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'status_items' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);

      return {
        statuses: {
          exists: statusesInfo.rows.length > 0,
          columns: statusesInfo.rows
        },
        status_item: {
          exists: statusItemInfo.rows.length > 0,
          columns: statusItemInfo.rows
        },
        status_items: {
          exists: statusItemsInfo.rows.length > 0,
          columns: statusItemsInfo.rows
        }
      };
    } catch (error) {
      console.error('Error checking table structure:', error);
      throw error;
    }
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
  async getAllBigbasketPos(): Promise<(BigbasketPoHeader & { poLines: BigbasketPoLines[] })[]> {
    const pos = await db.select().from(bigbasketPoHeader).orderBy(desc(bigbasketPoHeader.created_at));
    
    const result = [];
    for (const po of pos) {
      const poLines = await db.select().from(bigbasketPoLines).where(eq(bigbasketPoLines.po_id, po.id));
      result.push({
        ...po,
        poLines
      });
    }
    
    return result;
  }

  async getBigbasketPoById(id: number): Promise<(BigbasketPoHeader & { poLines: BigbasketPoLines[] }) | undefined> {
    const [po] = await db.select().from(bigbasketPoHeader).where(eq(bigbasketPoHeader.id, id));
    if (!po) return undefined;
    
    const poLines = await db.select().from(bigbasketPoLines).where(eq(bigbasketPoLines.po_id, po.id));
    
    return {
      ...po,
      poLines
    };
  }

  async getBigbasketPoByNumber(poNumber: string): Promise<BigbasketPoHeader | undefined> {
    const [po] = await db.select().from(bigbasketPoHeader).where(eq(bigbasketPoHeader.po_number, poNumber));
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

  async updateBigbasketPo(id: number, header: Partial<InsertBigbasketPoHeader>, lines?: InsertBigbasketPoLines[]): Promise<BigbasketPoHeader> {
    return await db.transaction(async (tx) => {
      // Update header
      const [updated] = await tx
        .update(bigbasketPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(bigbasketPoHeader.id, id))
        .returning();
      
      // If lines are provided, replace all existing lines
      if (lines && lines.length > 0) {
        // Delete existing lines
        await tx.delete(bigbasketPoLines).where(eq(bigbasketPoLines.po_id, id));
        
        // Insert new lines
        const linesWithPoId = lines.map(line => ({ ...line, po_id: id }));
        await tx.insert(bigbasketPoLines).values(linesWithPoId);
      }
      
      return updated;
    });
  }

  async deleteBigbasketPo(id: number): Promise<void> {
    await db.delete(bigbasketPoHeader).where(eq(bigbasketPoHeader.id, id));
  }

  // Zomato PO methods
  async getAllZomatoPos(): Promise<(ZomatoPoHeader & { poItems: ZomatoPoItems[] })[]> {
    const pos = await db.select().from(zomatoPoHeader).orderBy(desc(zomatoPoHeader.created_at));
    
    const result = [];
    for (const po of pos) {
      const poItems = await db.select().from(zomatoPoItems).where(eq(zomatoPoItems.po_header_id, po.id));
      result.push({
        ...po,
        poItems
      });
    }
    
    return result;
  }

  async getZomatoPoById(id: number): Promise<(ZomatoPoHeader & { poItems: ZomatoPoItems[] }) | undefined> {
    const [po] = await db.select().from(zomatoPoHeader).where(eq(zomatoPoHeader.id, id));
    
    if (!po) {
      return undefined;
    }

    const poItems = await db.select().from(zomatoPoItems).where(eq(zomatoPoItems.po_header_id, po.id));
    
    return {
      ...po,
      poItems
    };
  }

  async getZomatoPoByNumber(poNumber: string): Promise<ZomatoPoHeader | undefined> {
    const [po] = await db.select().from(zomatoPoHeader).where(eq(zomatoPoHeader.po_number, poNumber));
    return po || undefined;
  }

  async createZomatoPo(header: InsertZomatoPoHeader, items: InsertZomatoPoItems[]): Promise<ZomatoPoHeader> {
    return await db.transaction(async (tx) => {
      const [createdPo] = await tx.insert(zomatoPoHeader).values(header).returning();
      
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: createdPo.id
        }));
        await tx.insert(zomatoPoItems).values(itemsWithPoId);
      }
      
      return createdPo;
    });
  }

  async updateZomatoPo(id: number, header: Partial<InsertZomatoPoHeader>, items?: InsertZomatoPoItems[]): Promise<ZomatoPoHeader> {
    return await db.transaction(async (tx) => {
      const [updatedPo] = await tx
        .update(zomatoPoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(zomatoPoHeader.id, id))
        .returning();

      if (items && items.length > 0) {
        await tx.delete(zomatoPoItems).where(eq(zomatoPoItems.po_header_id, id));
        
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: id
        }));
        await tx.insert(zomatoPoItems).values(itemsWithPoId);
      }

      return updatedPo;
    });
  }

  async deleteZomatoPo(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(zomatoPoItems).where(eq(zomatoPoItems.po_header_id, id));
      await tx.delete(zomatoPoHeader).where(eq(zomatoPoHeader.id, id));
    });
  }

  // Dealshare PO methods
  async getAllDealsharePos(): Promise<(DealsharePoHeader & { poItems: DealsharePoItems[] })[]> {
    const pos = await db.select().from(dealsharePoHeader).orderBy(desc(dealsharePoHeader.created_at));
    
    const result = [];
    for (const po of pos) {
      const poItems = await db.select().from(dealsharePoItems).where(eq(dealsharePoItems.po_header_id, po.id));
      result.push({
        ...po,
        poItems
      });
    }
    
    return result;
  }

  async getDealsharePoById(id: number): Promise<(DealsharePoHeader & { poItems: DealsharePoItems[] }) | undefined> {
    const [po] = await db.select().from(dealsharePoHeader).where(eq(dealsharePoHeader.id, id));
    
    if (!po) {
      return undefined;
    }

    const poItems = await db.select().from(dealsharePoItems).where(eq(dealsharePoItems.po_header_id, po.id));
    
    return {
      ...po,
      poItems
    };
  }

  async getDealsharePoByNumber(poNumber: string): Promise<DealsharePoHeader | undefined> {
    const [po] = await db.select().from(dealsharePoHeader).where(eq(dealsharePoHeader.po_number, poNumber));
    return po || undefined;
  }

  async createDealsharePo(header: InsertDealsharePoHeader, items: InsertDealsharePoItems[]): Promise<DealsharePoHeader> {
    return await db.transaction(async (tx) => {
      const [createdPo] = await tx.insert(dealsharePoHeader).values(header).returning();
      
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: createdPo.id
        }));
        await tx.insert(dealsharePoItems).values(itemsWithPoId);
      }
      
      return createdPo;
    });
  }

  async updateDealsharePo(id: number, header: Partial<InsertDealsharePoHeader>, items?: InsertDealsharePoItems[]): Promise<DealsharePoHeader> {
    return await db.transaction(async (tx) => {
      const [updatedPo] = await tx
        .update(dealsharePoHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(dealsharePoHeader.id, id))
        .returning();

      if (items && items.length > 0) {
        await tx.delete(dealsharePoItems).where(eq(dealsharePoItems.po_header_id, id));
        
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: id
        }));
        await tx.insert(dealsharePoItems).values(itemsWithPoId);
      }

      return updatedPo;
    });
  }

  async deleteDealsharePo(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(dealsharePoItems).where(eq(dealsharePoItems.po_header_id, id));
      await tx.delete(dealsharePoHeader).where(eq(dealsharePoHeader.id, id));
    });
  }

  // Secondary Sales methods
  async getAllSecondarySales(platform?: string, businessUnit?: string): Promise<(SecondarySalesHeader & { salesItems: SecondarySalesItems[] })[]> {
    let query = db.select().from(secondarySalesHeader);
    
    if (platform || businessUnit) {
      const conditions = [];
      if (platform) conditions.push(eq(secondarySalesHeader.platform, platform));
      if (businessUnit) conditions.push(eq(secondarySalesHeader.business_unit, businessUnit));
      query = query.where(and(...conditions));
    }
    
    const sales = await query.orderBy(desc(secondarySalesHeader.created_at));
    
    const result = [];
    for (const sale of sales) {
      const salesItems = await db.select().from(secondarySalesItems).where(eq(secondarySalesItems.header_id, sale.id));
      result.push({
        ...sale,
        salesItems
      });
    }
    
    return result;
  }

  async getSecondarySalesById(id: number): Promise<(SecondarySalesHeader & { salesItems: SecondarySalesItems[] }) | undefined> {
    const [sale] = await db.select().from(secondarySalesHeader).where(eq(secondarySalesHeader.id, id));
    
    if (!sale) {
      return undefined;
    }

    const salesItems = await db.select().from(secondarySalesItems).where(eq(secondarySalesItems.header_id, sale.id));
    
    return {
      ...sale,
      salesItems
    };
  }

  async createSecondarySales(header: InsertSecondarySalesHeader, items: InsertSecondarySalesItems[]): Promise<SecondarySalesHeader> {
    return await db.transaction(async (tx) => {
      const [createdSale] = await tx.insert(secondarySalesHeader).values(header).returning();
      
      if (items.length > 0) {
        const itemsWithHeaderId = items.map(item => ({
          ...item,
          header_id: createdSale.id
        }));
        await tx.insert(secondarySalesItems).values(itemsWithHeaderId);
      }
      
      return createdSale;
    });
  }

  async updateSecondarySales(id: number, header: Partial<InsertSecondarySalesHeader>, items?: InsertSecondarySalesItems[]): Promise<SecondarySalesHeader> {
    return await db.transaction(async (tx) => {
      const [updatedSale] = await tx
        .update(secondarySalesHeader)
        .set({ ...header, updated_at: new Date() })
        .where(eq(secondarySalesHeader.id, id))
        .returning();

      if (items && items.length > 0) {
        await tx.delete(secondarySalesItems).where(eq(secondarySalesItems.header_id, id));
        
        const itemsWithHeaderId = items.map(item => ({
          ...item,
          header_id: id
        }));
        await tx.insert(secondarySalesItems).values(itemsWithHeaderId);
      }

      return updatedSale;
    });
  }

  async deleteSecondarySales(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(secondarySalesItems).where(eq(secondarySalesItems.header_id, id));
      await tx.delete(secondarySalesHeader).where(eq(secondarySalesHeader.id, id));
    });
  }

  // Specific Secondary Sales table methods
  async createScAmJwDaily(items: InsertScAmJwDaily[]): Promise<ScAmJwDaily[]> {
    return await db.insert(scAmJwDaily).values(items).returning();
  }

  async createScAmJwRange(items: InsertScAmJwRange[]): Promise<ScAmJwRange[]> {
    return await db.insert(scAmJwRange).values(items).returning();
  }

  async createScAmJmDaily(items: InsertScAmJmDaily[]): Promise<ScAmJmDaily[]> {
    return await db.insert(scAmJmDaily).values(items).returning();
  }

  async createScAmJmRange(items: InsertScAmJmRange[]): Promise<ScAmJmRange[]> {
    return await db.insert(scAmJmRange).values(items).returning();
  }

  async getScAmJwDaily(dateStart?: string, dateEnd?: string): Promise<ScAmJwDaily[]> {
    if (dateStart && dateEnd) {
      return await db.select().from(scAmJwDaily)
        .where(
          and(
            gte(scAmJwDaily.report_date, new Date(dateStart)),
            lte(scAmJwDaily.report_date, new Date(dateEnd))
          )
        )
        .orderBy(desc(scAmJwDaily.report_date));
    } else if (dateStart) {
      return await db.select().from(scAmJwDaily)
        .where(eq(scAmJwDaily.report_date, new Date(dateStart)))
        .orderBy(desc(scAmJwDaily.report_date));
    }
    
    return await db.select().from(scAmJwDaily).orderBy(desc(scAmJwDaily.report_date));
  }

  async getScAmJwRange(dateStart?: string, dateEnd?: string): Promise<ScAmJwRange[]> {
    if (dateStart && dateEnd) {
      return await db.select().from(scAmJwRange)
        .where(
          and(
            gte(scAmJwRange.period_start, new Date(dateStart)),
            lte(scAmJwRange.period_end, new Date(dateEnd))
          )
        )
        .orderBy(desc(scAmJwRange.period_start));
    }
    
    return await db.select().from(scAmJwRange).orderBy(desc(scAmJwRange.period_start));
  }

  async getScAmJmDaily(dateStart?: string, dateEnd?: string): Promise<ScAmJmDaily[]> {
    if (dateStart && dateEnd) {
      return await db.select().from(scAmJmDaily)
        .where(
          and(
            gte(scAmJmDaily.report_date, new Date(dateStart)),
            lte(scAmJmDaily.report_date, new Date(dateEnd))
          )
        )
        .orderBy(desc(scAmJmDaily.report_date));
    } else if (dateStart) {
      return await db.select().from(scAmJmDaily)
        .where(eq(scAmJmDaily.report_date, new Date(dateStart)))
        .orderBy(desc(scAmJmDaily.report_date));
    }
    
    return await db.select().from(scAmJmDaily).orderBy(desc(scAmJmDaily.report_date));
  }

  async getScAmJmRange(dateStart?: string, dateEnd?: string): Promise<ScAmJmRange[]> {
    if (dateStart && dateEnd) {
      return await db.select().from(scAmJmRange)
        .where(
          and(
            gte(scAmJmRange.period_start, new Date(dateStart)),
            lte(scAmJmRange.period_end, new Date(dateEnd))
          )
        )
        .orderBy(desc(scAmJmRange.period_start));
    }
    
    return await db.select().from(scAmJmRange).orderBy(desc(scAmJmRange.period_start));
  }

  // New secondary sales platform methods
  async createScZeptoJmDaily(items: InsertZeptoSecondarySalesItem[]): Promise<ZeptoSecondarySalesItem[]> {
    return await db.insert(scZeptoJmDaily).values(items).returning();
  }

  async createScZeptoJmRange(items: InsertZeptoSecondarySalesRangeItem[]): Promise<ZeptoSecondarySalesRangeItem[]> {
    return await db.insert(scZeptoJmRange).values(items).returning();
  }

  async createScBlinkitJmDaily(items: InsertBlinkitSecondarySalesItem[]): Promise<BlinkitSecondarySalesItem[]> {
    return await db.insert(scBlinkitJmDaily).values(items).returning();
  }

  async createScBlinkitJmRange(items: InsertBlinkitSecondarySalesRangeItem[]): Promise<BlinkitSecondarySalesRangeItem[]> {
    return await db.insert(scBlinkitJmRange).values(items).returning();
  }

  async createScSwiggyJmDaily(items: InsertSwiggySecondarySalesItem[]): Promise<SwiggySecondarySalesItem[]> {
    return await db.insert(scSwiggyJmDaily).values(items).returning();
  }

  async createScSwiggyJmRange(items: InsertSwiggySecondarySalesRangeItem[]): Promise<SwiggySecondarySalesRangeItem[]> {
    return await db.insert(scSwiggyJmRange).values(items).returning();
  }

  async createScJioMartSaleJmDaily(items: InsertJioMartSaleSecondarySalesItem[]): Promise<JioMartSaleSecondarySalesItem[]> {
    return await db.insert(scJioMartSaleJmDaily).values(items).returning();
  }

  async createScJioMartSaleJmRange(items: InsertJioMartSaleSecondarySalesRangeItem[]): Promise<JioMartSaleSecondarySalesRangeItem[]> {
    return await db.insert(scJioMartSaleJmRange).values(items).returning();
  }

  async createScJioMartCancelJmDaily(items: InsertJioMartCancelSecondarySalesItem[]): Promise<JioMartCancelSecondarySalesItem[]> {
    return await db.insert(scJioMartCancelJmDaily).values(items).returning();
  }

  async createScJioMartCancelJmRange(items: InsertJioMartCancelSecondarySalesRangeItem[]): Promise<JioMartCancelSecondarySalesRangeItem[]> {
    return await db.insert(scJioMartCancelJmRange).values(items).returning();
  }

  async createScBigBasketJmDaily(items: InsertBigBasketSecondarySalesItem[]): Promise<BigBasketSecondarySalesItem[]> {
    return await db.insert(scBigBasketJmDaily).values(items).returning();
  }

  async createScBigBasketJmRange(items: InsertBigBasketSecondarySalesRangeItem[]): Promise<BigBasketSecondarySalesRangeItem[]> {
    return await db.insert(scBigBasketJmRange).values(items).returning();
  }

  // Inventory Management methods
  async getAllInventory(platform?: string, businessUnit?: string): Promise<any[]> {
    // For now, return an empty array since we only support Jio Mart
    // This can be expanded when more platforms are added
    return [];
  }

  async getInventoryById(id: number): Promise<any> {
    // Check both daily and range tables for Jio Mart inventory
    const dailyResult = await db.select().from(invJioMartJmDaily).where(eq(invJioMartJmDaily.id, id));
    if (dailyResult.length > 0) {
      return { ...dailyResult[0], type: 'daily' };
    }

    const rangeResult = await db.select().from(invJioMartJmRange).where(eq(invJioMartJmRange.id, id));
    if (rangeResult.length > 0) {
      return { ...rangeResult[0], type: 'range' };
    }

    return undefined;
  }

  async createInventoryJioMartJmDaily(items: InsertJioMartInventoryItem[]): Promise<JioMartInventoryItem[]> {
    return await db.insert(invJioMartJmDaily).values(items).returning();
  }

  async createInventoryJioMartJmRange(items: InsertJioMartInventoryRangeItem[]): Promise<JioMartInventoryRangeItem[]> {
    return await db.insert(invJioMartJmRange).values(items).returning();
  }

  async createInventoryBlinkitJmDaily(items: InsertBlinkitInventoryItem[]): Promise<BlinkitInventoryItem[]> {
    return await db.insert(invBlinkitJmDaily).values(items).returning();
  }

  async createInventoryBlinkitJmRange(items: InsertBlinkitInventoryItem[]): Promise<BlinkitInventoryItem[]> {
    return await db.insert(invBlinkitJmRange).values(items).returning();
  }

  // Amazon Inventory methods
  async createInventoryAmazonJmDaily(items: any[]): Promise<any[]> {
    return await db.insert(invAmazonJmDaily).values(items).returning();
  }

  async createInventoryAmazonJmRange(items: any[]): Promise<any[]> {
    return await db.insert(invAmazonJmRange).values(items).returning();
  }

  async createInventoryAmazonJwDaily(items: any[]): Promise<any[]> {
    return await db.insert(invAmazonJwDaily).values(items).returning();
  }

  async createInventoryAmazonJwRange(items: any[]): Promise<any[]> {
    return await db.insert(invAmazonJwRange).values(items).returning();
  }

  // Swiggy Inventory JM Daily
  async createInventorySwiggyJmDaily(items: any[]): Promise<SwiggyInventoryItem[]> {
    return await db.insert(invSwiggyJmDaily).values(items).returning();
  }

  // Swiggy Inventory JM Range
  async createInventorySwiggyJmRange(items: any[]): Promise<SwiggyInventoryRange[]> {
    return await db.insert(invSwiggyJmRange).values(items).returning();
  }

  // FlipKart Inventory JM Daily
  async createInventoryFlipkartJmDaily(items: InsertFlipkartInventoryDaily[]): Promise<FlipkartInventoryDaily[]> {
    return await db.insert(invFlipkartJmDaily).values(items).returning();
  }

  // FlipKart Inventory JM Range  
  async createInventoryFlipkartJmRange(items: InsertFlipkartInventoryRange[]): Promise<FlipkartInventoryRange[]> {
    return await db.insert(invFlipkartJmRange).values(items).returning();
  }

  // Zepto Inventory JM Daily
  async createInventoryZeptoJmDaily(items: InsertZeptoInventoryDaily[]): Promise<ZeptoInventoryDaily[]> {
    return await db.insert(invZeptoJmDaily).values(items).returning();
  }

  // Zepto Inventory JM Range  
  async createInventoryZeptoJmRange(items: InsertZeptoInventoryRange[]): Promise<ZeptoInventoryRange[]> {
    return await db.insert(invZeptoJmRange).values(items).returning();
  }

  // BigBasket Inventory JM Daily
  async createInventoryBigBasketJmDaily(items: InsertBigBasketInventoryDaily[]): Promise<BigBasketInventoryDaily[]> {
    return await db.insert(invBigBasketJmDaily).values(items).returning();
  }

  // BigBasket Inventory JM Range  
  async createInventoryBigBasketJmRange(items: InsertBigBasketInventoryRange[]): Promise<BigBasketInventoryRange[]> {
    return await db.insert(invBigBasketJmRange).values(items).returning();
  }

  async updateInventory(id: number, header: any, items: any): Promise<any> {
    // This would need to be implemented based on specific requirements
    // For now, return a placeholder
    throw new Error("Inventory update not yet implemented");
  }

  async deleteInventory(id: number): Promise<void> {
    // Try to delete from both tables
    await db.delete(invJioMartJmDaily).where(eq(invJioMartJmDaily.id, id));
    await db.delete(invJioMartJmRange).where(eq(invJioMartJmRange.id, id));
  }

  // Helper method to map item status string to status ID
  private mapItemStatusToId(status?: string): number {
    if (!status) return 1; // Default to PENDING
    
    const statusMap: Record<string, number> = {
      'PENDING': 1,
      'INVOICED': 2,
      'DISPATCHED': 3,
      'DELIVERED': 4
    };
    
    return statusMap[status.toUpperCase()] || 1;
  }

  // Method to update PO in existing po_master and po_lines tables
  async updatePoInExistingTables(poId: number, masterData: any, linesData: any[]): Promise<any> {
    return await db.transaction(async (tx) => {
      // Build update object with only provided fields
      const updateData: any = {
        updated_on: new Date()
      };
      
      if (masterData.platform_id !== undefined) updateData.platform_id = masterData.platform_id;
      if (masterData.po_number) updateData.vendor_po_number = masterData.po_number;
      
      // Handle distributor mapping - convert name to ID if serving_distributor is provided
      if (masterData.serving_distributor !== undefined) {
        if (masterData.serving_distributor) {
          try {
            const distributor = await tx
              .select({ id: distributorMst.id })
              .from(distributorMst)
              .where(eq(distributorMst.distributor_name, masterData.serving_distributor))
              .limit(1);
            
            if (distributor.length > 0) {
              updateData.distributor_id = distributor[0].id;
              console.log(`🔍 UPDATE: Found distributor ID ${distributor[0].id} for name "${masterData.serving_distributor}"`);
            } else {
              console.log(`⚠️ UPDATE WARNING: Distributor "${masterData.serving_distributor}" not found, keeping existing distributor`);
            }
          } catch (error) {
            console.error("Error looking up distributor during update:", error);
          }
        } else {
          // If serving_distributor is explicitly null/empty, set to default
          updateData.distributor_id = 1;
        }
      } else if (masterData.distributor_id !== undefined) {
        updateData.distributor_id = masterData.distributor_id;
      }
      if (masterData.po_date) updateData.po_date = new Date(masterData.po_date);
      // Handle status mapping - accept both status string and status_id
      if (masterData.status_id !== undefined) {
        updateData.status_id = masterData.status_id;
      } else if (masterData.status) {
        // Map status strings to status_id
        updateData.status_id = masterData.status === "INVOICED" ? 2 : 1;
      }
      if (masterData.region) updateData.region = masterData.region;
      if (masterData.area) updateData.area = masterData.area;
      if (masterData.state_id !== undefined) updateData.state_id = masterData.state_id;
      if (masterData.district_id !== undefined) updateData.district_id = masterData.district_id;
      if (masterData.dispatch_from !== undefined) updateData.dispatch_from = masterData.dispatch_from;
      if (masterData.warehouse !== undefined) updateData.ware_house = masterData.warehouse;
      if (masterData.appointment_date !== undefined) {
        updateData.appointment_date = masterData.appointment_date ? new Date(masterData.appointment_date) : null;
      }
      if (masterData.expiry_date !== undefined) {
        updateData.expiry_date = masterData.expiry_date ? new Date(masterData.expiry_date) : null;
      }
      
      // Update po_master table
      const [updatedMaster] = await tx
        .update(poMaster)
        .set(updateData)
        .where(eq(poMaster.id, poId))
        .returning();
      
      // Delete existing po_lines for this PO
      await tx.delete(poLines).where(eq(poLines.po_id, poId));
      
      // Insert updated lines
      if (linesData.length > 0) {
        const mappedLines = [];
        
        for (const line of linesData) {
          let platformProductCodeId = 1; // Default fallback
          
          // Try to find the platform item by platform_code or sap_code
          if (line.platform_code || line.sap_code) {
            const platformItem = await tx
              .select({ id: pfItemMst.id })
              .from(pfItemMst)
              .where(
                line.platform_code 
                  ? eq(pfItemMst.pf_itemcode, line.platform_code)
                  : eq(pfItemMst.pf_itemcode, line.sap_code)
              )
              .limit(1);
            
            if (platformItem.length > 0) {
              platformProductCodeId = platformItem[0].id;
            }
          }
          
          mappedLines.push({
            po_id: updatedMaster.id,
            platform_product_code_id: platformProductCodeId,
            quantity: line.quantity.toString(),
            basic_amount: line.basic_amount.toString(),
            tax: line.tax_percent ? (parseFloat(line.basic_amount.toString()) * parseFloat(line.tax_percent.toString()) / 100).toString() : "0",
            landing_amount: line.landing_amount ? line.landing_amount.toString() : null,
            total_amount: line.total_amount.toString(),
            uom: line.uom || null,
            total_liter: line.total_ltrs ? line.total_ltrs.toString() : null,
            boxes: line.boxes ? Math.floor(parseFloat(line.boxes.toString())) : null,
            // Invoice fields
            invoice_date: line.invoice_date || null,
            invoice_litre: line.invoice_litre ? line.invoice_litre.toString() : null,
            invoice_amount: line.invoice_amount ? line.invoice_amount.toString() : null,
            invoice_qty: line.invoice_qty ? line.invoice_qty.toString() : null,
            remark: `${line.item_name} - Platform Code: ${line.platform_code} - SAP Code: ${line.sap_code} - Tax Rate: ${line.tax_percent || 0}%`,
            status: this.mapItemStatusToId(line.status),
            delete: false,
            deleted: false
          });
        }
        
        console.log("🔍 DEBUG mappedLines before insert:", JSON.stringify(mappedLines, null, 2));
        
        // Log tax rate preservation for each line
        mappedLines.forEach((line, index) => {
          console.log(`✅ Tax rate preserved for line ${index + 1}: included in remark, calculated tax = ${line.tax}`);
        });
        
        await tx.insert(poLines).values(mappedLines);
        
        // Check if all items are delivered and auto-close PO if needed
        const allItemsDelivered = linesData.every(line => {
          const status = line.status || "PENDING";
          return status.toUpperCase() === "DELIVERED";
        });
        
        console.log(`🔍 DEBUG: Checking automatic PO closure - All items delivered: ${allItemsDelivered}`);
        
        if (allItemsDelivered && linesData.length > 0) {
          console.log("✅ All items are delivered, automatically closing PO");
          // Update PO status to CLOSED (assuming status_id 5 is "CLOSED")
          const [autoClosedMaster] = await tx
            .update(poMaster)
            .set({ 
              status_id: 5, // CLOSED status
              updated_on: new Date() 
            })
            .where(eq(poMaster.id, poId))
            .returning();
          
          return autoClosedMaster;
        }
      }
      
      return updatedMaster;
    });
  }

  // Method to create PO in existing po_master and po_lines tables
  async createPoInExistingTables(masterData: any, linesData: any[]): Promise<any> {
    console.log("🔍 DEBUG createPoInExistingTables - masterData received:", masterData);
    console.log("🔍 DEBUG state_id:", masterData.state_id, "district_id:", masterData.district_id);
    
    return await db.transaction(async (tx) => {
      // Find distributor ID by name if serving_distributor is provided
      let distributorId = 1; // Default distributor ID
      if (masterData.serving_distributor) {
        try {
          const distributor = await tx
            .select({ id: distributors.id })
            .from(distributors)
            .where(eq(distributors.name, masterData.serving_distributor))
            .limit(1);
          
          if (distributor.length > 0) {
            distributorId = distributor[0].id;
            console.log(`🔍 DEBUG: Found distributor ID ${distributorId} for name "${masterData.serving_distributor}"`);
          } else {
            // Check if distributor exists in distributor_mst and create it in distributors table
            console.log(`⚠️ WARNING: Distributor "${masterData.serving_distributor}" not found in distributors table`);
            
            const distributorMstEntry = await tx
              .select({ id: distributorMst.id, name: distributorMst.distributor_name })
              .from(distributorMst)
              .where(eq(distributorMst.distributor_name, masterData.serving_distributor))
              .limit(1);
            
            if (distributorMstEntry.length > 0) {
              console.log(`🔍 DEBUG: Found distributor in distributor_mst with ID ${distributorMstEntry[0].id}, creating in distributors table`);
              
              // Create the distributor in distributors table with the same ID
              const [createdDistributor] = await tx
                .insert(distributors)
                .values({
                  id: distributorMstEntry[0].id,
                  name: distributorMstEntry[0].name
                })
                .returning();
              
              distributorId = createdDistributor.id;
              console.log(`✅ Created distributor "${masterData.serving_distributor}" in distributors table with ID ${distributorId}`);
            } else {
              console.log(`⚠️ WARNING: Distributor "${masterData.serving_distributor}" not found in either table, using default ID 1`);
            }
          }
        } catch (error) {
          console.error("Error looking up distributor:", error);
        }
      }

      // Insert into existing po_master table with mapping
      const insertValues = {
        platform_id: masterData.platform_id,
        vendor_po_number: masterData.po_number,
        distributor_id: distributorId,
        series: "PO", // Default series
        company_id: 6, // Jivo Mart company ID  
        po_date: new Date(masterData.po_date),
        status_id: 1, // Default status ID for "OPEN"
        region: masterData.region,
        area: masterData.area,
        state_id: masterData.state_id || null,
        district_id: masterData.district_id || null,
        dispatch_from: masterData.dispatch_from || null,
        ware_house: masterData.warehouse || null,
        appointment_date: masterData.appointment_date ? new Date(masterData.appointment_date) : null,
        expiry_date: masterData.expiry_date ? new Date(masterData.expiry_date) : null,
        created_by: null // Temporary fix: set to null to avoid foreign key constraint error
      };
      
      console.log("🔍 DEBUG insertValues:", insertValues);
      console.log("🔍 DEBUG specifically - state_id:", insertValues.state_id, "district_id:", insertValues.district_id);
      
      const [createdMaster] = await tx.insert(poMaster).values(insertValues).returning();
      
      // Insert lines into existing po_lines table with proper item mapping
      if (linesData.length > 0) {
        const mappedLines = [];
        
        for (const line of linesData) {
          let platformProductCodeId = 1; // Default fallback
          
          // Debug: Log the entire line object
          console.log(`🔍 DEBUG: Processing line item:`, JSON.stringify(line, null, 2));
          console.log(`🔍 DEBUG: line.platform_code = "${line.platform_code}", line.sap_code = "${line.sap_code}"`);
          
          // Try to find the platform item by platform_code or sap_code
          if (line.platform_code || line.sap_code) {
            const searchCode = line.platform_code || line.sap_code;
            const platformItem = await tx
              .select({ id: pfItemMst.id })
              .from(pfItemMst)
              .where(eq(pfItemMst.pf_itemcode, searchCode))
              .limit(1);
            
            if (platformItem.length > 0) {
              platformProductCodeId = platformItem[0].id;
            } else {
              // Item not found in pf_item_mst, create a new entry
              console.log(`🔍 Item not found in pf_item_mst for code: ${searchCode}, creating new entry`);
              
              // Store full itemcode string directly in sap_id column
              let sapId = null;
              console.log(`🔍 DEBUG: About to process sap_code: "${line.sap_code}" (type: ${typeof line.sap_code})`);
              if (line.sap_code) {
                // Store the full itemcode string directly
                sapId = line.sap_code;
                console.log(`✅ Using full itemcode as sap_id: "${sapId}"`);
              } else {
                console.log(`⚠️ No sap_code provided, using default SAP ID: "DEFAULT"`);
                sapId = "DEFAULT"; // Default fallback SAP ID
              }
              
              console.log(`🔍 DEBUG: Final sapId (full itemcode): "${sapId}"`);
              
              // Create new entry in pf_item_mst
              const newPfItem = {
                pf_itemcode: line.platform_code || line.sap_code || `ITEM_${Date.now()}`,
                pf_itemname: line.item_name,
                pf_id: masterData.platform_id, // Platform ID from master data
                sap_id: sapId // This now contains the integer representation of the itemcode
              };
              
              console.log(`🚀 Creating new pf_item_mst entry:`, JSON.stringify(newPfItem, null, 2));
              console.log(`🔍 DEBUG: Original itemcode "${line.sap_code}" stored as sap_id: ${sapId} (type: ${typeof sapId})`);
              
              try {
                const [createdPfItem] = await tx
                  .insert(pfItemMst)
                  .values(newPfItem)
                  .returning({ id: pfItemMst.id });
                
                platformProductCodeId = createdPfItem.id;
                console.log(`✅ Created new pf_item_mst entry with ID: ${platformProductCodeId}`);
                
                // Verify the insertion
                const verification = await tx
                  .select()
                  .from(pfItemMst)
                  .where(eq(pfItemMst.id, platformProductCodeId))
                  .limit(1);
                console.log(`🔍 VERIFICATION: pf_item_mst record:`, JSON.stringify(verification[0], null, 2));
                console.log(`✅ SUCCESS: Full itemcode "${line.sap_code}" is now stored as sap_id = "${verification[0]?.sap_id}"`);
              } catch (pfItemError) {
                console.error(`❌ Error creating pf_item_mst entry:`, pfItemError);
                throw pfItemError; // Re-throw to see the full error
              }
            }
          }
          
          mappedLines.push({
            po_id: createdMaster.id,
            platform_product_code_id: platformProductCodeId,
            quantity: line.quantity.toString(),
            basic_amount: line.basic_amount.toString(),
            tax: line.tax_percent ? (parseFloat(line.basic_amount.toString()) * parseFloat(line.tax_percent.toString()) / 100).toString() : "0",
            landing_amount: line.landing_amount ? line.landing_amount.toString() : null,
            total_amount: line.total_amount.toString(),
            uom: line.uom || null,
            total_liter: line.total_ltrs ? line.total_ltrs.toString() : null,
            boxes: line.boxes ? Math.floor(parseFloat(line.boxes.toString())) : null,
            // Invoice fields
            invoice_date: line.invoice_date || null,
            invoice_litre: line.invoice_litre ? line.invoice_litre.toString() : null,
            invoice_amount: line.invoice_amount ? line.invoice_amount.toString() : null,
            invoice_qty: line.invoice_qty ? line.invoice_qty.toString() : null,
            remark: `${line.item_name} - Platform Code: ${line.platform_code} - SAP Code: ${line.sap_code} - Tax Rate: ${line.tax_percent || 0}%`,
            status: 1, // Default status ID for pending
            delete: false,
            deleted: false
          });
        }
        
        console.log("🔍 DEBUG mappedLines before insert:", JSON.stringify(mappedLines, null, 2));
        
        // Log tax rate preservation for each line
        mappedLines.forEach((line, index) => {
          console.log(`✅ Tax rate preserved for line ${index + 1}: included in remark, calculated tax = ${line.tax}`);
        });
        
        await tx.insert(poLines).values(mappedLines);
      }
      
      return createdMaster;
    });
  }

}

export const storage = new DatabaseStorage();
