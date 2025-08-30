import { 
  type User, 
  type InsertUser,
  type UpdateUser,
  type LogMaster,
  type InsertLogMaster,
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
  logMaster,
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
  zeptoAttachments,
  zeptoComments,
  flipkartAttachments,
  flipkartComments,
  blinkitAttachments,
  blinkitComments,
  swiggyAttachments,
  swiggyComments,
  bigbasketAttachments,
  bigbasketComments,
  zomatoAttachments,
  zomatoComments,
  dealshareAttachments,
  dealshareComments,
  citymallAttachments,
  citymallComments,
  platformPoAttachments,
  platformPoComments,
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
  regions,
  states,
  districts,
  distributors,
  type Regions,
  type InsertRegions,
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
  items,
  
  // RBAC tables and types
  roles,
  permissions,
  rolePermissions,
  userSessions,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type RolePermission,
  type InsertRolePermission,
  type UserSession,
  type InsertUserSession
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, gte, lte, sql, inArray, isNotNull } from "drizzle-orm";

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
  createPFItem(data: { pf_id: number; pf_itemcode: string; pf_itemname: string; sap_id: string }): Promise<any>;
  checkPFItemDuplicates(data: { pf_id: number; pf_itemcode: string; pf_itemname: string }): Promise<{ codeExists: boolean; nameExists: boolean; }>;
  searchPFItems(searchTerm: string): Promise<any[]>;
  getUniqueDispatchLocations(): Promise<string[]>;
  
  // Generic PO Master and Lines methods
  getAllPoMasters(): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[] })[]>;
  getPoMasterById(id: number): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[]; state?: any; district?: any; distributor?: any }) | undefined>;
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
  getFlipkartGroceryPoLines(poHeaderId: number): Promise<FlipkartGroceryPoLines[]>;

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
  getDistributorByName(name: string): Promise<DistributorMst | undefined>;
  createDistributor(distributor: InsertDistributorMst): Promise<DistributorMst>;
  updateDistributor(id: number, distributor: Partial<InsertDistributorMst>): Promise<DistributorMst>;
  deleteDistributor(id: number): Promise<void>;

  // State and District methods for dynamic dropdowns (using original tables)
  getAllStates(): Promise<States[]>;
  getDistrictsByStateId(stateId: number): Promise<Districts[]>;
  getAllDistributorsFromOriginalTable(): Promise<Distributors[]>;
  
  // Three-level cascading dropdown methods (regions → states → districts)
  getAllRegions(): Promise<{ id: number; region_name: string }[]>;
  getStatesByRegion(regionId: number): Promise<{ id: number; state_name: string; region_id: number }[]>;
  getDistrictsByStateIdFromMaster(stateId: number): Promise<{ id: number; district_name: string; state_id: number }[]>;

  // Distributor PO methods
  getAllDistributorPos(): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] })[]>;
  getDistributorPoById(id: number): Promise<(Omit<DistributorPo, 'distributor_id'> & { distributor: DistributorMst; orderItems: DistributorOrderItems[] }) | undefined>;
  createDistributorPo(po: InsertDistributorPo, items: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  updateDistributorPo(id: number, po: Partial<InsertDistributorPo>, items?: InsertDistributorOrderItems[]): Promise<DistributorPo>;
  deleteDistributorPo(id: number): Promise<void>;

  // Distributor Order Items methods
  getAllDistributorOrderItems(): Promise<(DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[]>;
  updateDistributorOrderItemStatus(itemId: number, status: string): Promise<void>;

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

  // Logging methods
  createLog(logData: InsertLogMaster): Promise<LogMaster>;
  logEdit(params: {
    username: string;
    action: string;
    tableName: string;
    recordId: number;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void>;
  
  // RBAC methods
  // Role management
  getAllRoles(): Promise<Role[]>;
  getRoleById(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;
  
  // Permission management
  getAllPermissions(): Promise<Permission[]>;
  getPermissionsByCategory(category: string): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission>;
  deletePermission(id: number): Promise<void>;
  
  // Role-Permission management
  getRolePermissions(roleId: number): Promise<RolePermission[]>;
  assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<void>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  
  // User management with roles
  getAllUsers(): Promise<User[]>;
  assignRoleToUser(userId: number, roleId: number): Promise<User>;
  getUserWithRole(userId: number): Promise<(User & { role?: Role }) | undefined>;
  getUsersByRole(roleId: number): Promise<User[]>;
  
  // Session management
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionToken: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  sessionStore: session.Store;
}

import connectPgSimple from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  // Helper method to map status ID to status name
  private mapStatusIdToName(statusId: number): string {
    const statusMap: Record<number, string> = {
      1: 'OPEN',
      2: 'PENDING',
      3: 'IN_PROGRESS', 
      4: 'COMPLETED',
      5: 'CLOSED',
      6: 'CANCELLED'
    };
    return statusMap[statusId] || 'OPEN';
  }
  
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
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
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
    
    // Fetch POs from po_master table with platform information
    const posWithPlatforms = await db
      .select({
        po: poMaster,
        platform: pfMst
      })
      .from(poMaster)
      .leftJoin(pfMst, eq(poMaster.platform_id, pfMst.id))
      .orderBy(desc(poMaster.create_on));

    // Process POs from po_master table
    for (const poWithPlatform of posWithPlatforms) {
      const po = poWithPlatform.po;
      const platform = poWithPlatform.platform;
      
      console.log(`🔍 Processing PO ${po.id} - ${po.vendor_po_number} with state_id: ${po.state_id}, district_id: ${po.district_id}`);
      
      // Special debug for SWIGGY221
      if (po.vendor_po_number && po.vendor_po_number.includes('SWIGGY221')) {
        console.log(`🎯 SWIGGY221 DEBUG:`, {
          id: po.id,
          vendor_po_number: po.vendor_po_number,
          state_id: po.state_id,
          district_id: po.district_id,
          region: po.region,
          area: po.area,
          po_date: po.po_date
        });
      }
      
      // Get associated po_lines data with product information
      const linesWithProducts = await db
        .select({
          line: poLines,
          product: pfItemMst
        })
        .from(poLines)
        .leftJoin(pfItemMst, eq(poLines.platform_product_code_id, pfItemMst.id))
        .where(eq(poLines.po_id, po.id))
        .orderBy(poLines.id);
      
      console.log(`📊 Found ${linesWithProducts.length} line items for PO ${po.id}`);
      
      // Get state information if available
      let stateName = '';
      if (po.state_id) {
        try {
          const stateResult = await db.select().from(states).where(eq(states.id, po.state_id)).limit(1);
          stateName = stateResult[0]?.statename || '';
          console.log(`🗺️ State for PO ${po.id}: ${stateName}`);
        } catch (error) {
          console.log(`⚠️ Could not fetch state for ID ${po.state_id}:`, error);
        }
      }
      
      // Get district information if available
      let districtName = '';
      if (po.district_id) {
        try {
          const districtResult = await db.select().from(districts).where(eq(districts.id, po.district_id)).limit(1);
          districtName = districtResult[0]?.district || '';
          console.log(`🏜️ District for PO ${po.id}: ${districtName}`);
        } catch (error) {
          console.log(`⚠️ Could not fetch district for ID ${po.district_id}:`, error);
        }
      }
      
      // Get distributor information if available (using same table as edit view)
      let distributorName = 'Unknown';
      if (po.distributor_id) {
        try {
          const distributorResult = await db.select().from(distributorMst).where(eq(distributorMst.id, po.distributor_id)).limit(1);
          distributorName = distributorResult[0]?.distributor_name || 'Unknown';
          console.log(`🏪 Distributor for PO ${po.id}: ${distributorName}`);
        } catch (error) {
          console.log(`⚠️ Could not fetch distributor for ID ${po.distributor_id}:`, error);
        }
      }
      
      // Map status from status_id (if exists) or default to 'Open'
      let poStatus = 'Open'; // Default status for new POs
      if (po.status_id !== null && po.status_id !== undefined) {
        // Map status_id to status text if needed
        switch(po.status_id) {
          case 1: poStatus = 'Open'; break;
          case 2: poStatus = 'Closed'; break;
          case 3: poStatus = 'Cancelled'; break;
          case 4: poStatus = 'Expired'; break;
          default: poStatus = 'Open';
        }
      }
      
      // Convert po_master format to expected frontend format
      const convertedPo = {
        id: po.id,
        po_number: po.vendor_po_number || 'UNKNOWN',
        platform: platform || { id: 1, pf_name: 'Unknown Platform' },
        serving_distributor: distributorName, // Use actual distributor name
        order_date: po.po_date ? new Date(po.po_date) : new Date(),
        expiry_date: po.expiry_date ? new Date(po.expiry_date) : null,
        appointment_date: po.appointment_date ? new Date(po.appointment_date) : null,
        city: districtName, // Use district as city
        state: stateName, // Use actual state name from state_id
        status: poStatus, // Use mapped status
        attachment: null, // Not available in current schema
        created_at: po.create_on ? new Date(po.create_on) : new Date(),
        updated_at: po.updated_on ? new Date(po.updated_on) : new Date(),
        region: po.region || '', // Use region from po_master
        area: po.area || '', // Use area from po_master
        orderItems: linesWithProducts.length > 0 ? linesWithProducts.map((lineWithProduct: any) => {
          const line = lineWithProduct.line;
          const product = lineWithProduct.product;
          
          return {
            id: line.id,
            po_id: po.id,
            item_name: product?.pf_itemname || `Product ID: ${line.platform_product_code_id}`, // Use actual product name
            quantity: parseFloat(line.quantity || '0'),
            sap_code: product?.pf_itemcode || null, // Use platform item code as SAP code
            category: null, // Not available in current schema
            subcategory: null, // Not available in current schema
            basic_rate: String(line.basic_amount || '0'),
            gst_rate: String(line.tax || '0'),
            landing_rate: String(line.landing_amount || line.total_amount || '0'),
            total_litres: line.total_liter || null,
            status: line.status ? String(line.status) : 'Pending', // Convert status to string
            hsn_code: null, // Not available in current schema
            platform_code: product?.pf_itemcode || null, // Use platform item code
            uom: line.uom || 'PCS',
            boxes: line.boxes || null,
            invoice_date: line.invoice_date ? String(line.invoice_date) : null,
            invoice_litre: line.invoice_litre ? String(line.invoice_litre) : null,
            invoice_amount: line.invoice_amount ? String(line.invoice_amount) : null,
            invoice_qty: line.invoice_qty ? String(line.invoice_qty) : null
          };
        }) : [
          // If no lines exist, create a placeholder item to show PO exists
          {
            id: 0,
            po_id: po.id,
            item_name: `Items for PO ${po.vendor_po_number}`,
            quantity: 1,
            sap_code: null,
            category: null,
            subcategory: null,
            basic_rate: '0.00',
            gst_rate: '0.00',
            landing_rate: '0.00',
            total_litres: null,
            status: 'Pending',
            hsn_code: null,
            platform_code: null,
            uom: "PCS",
            boxes: null,
            invoice_date: null,
            invoice_litre: null,
            invoice_amount: null,
            invoice_qty: null
          }
        ],
        state_id: po.state_id,
        district_id: po.district_id
      };
      
      console.log(`✅ PO ${po.id} final data:`, {
        id: convertedPo.id,
        po_number: convertedPo.po_number,
        city: convertedPo.city,
        state: convertedPo.state,
        region: convertedPo.region,
        area: convertedPo.area,
        orderItemsCount: convertedPo.orderItems.length,
        firstItemValue: convertedPo.orderItems[0]?.landing_rate || 'No items'
      });
      
      result.push(convertedPo);
    }

    // Sort results by created_at descending (most recent uploads first)
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    console.log(`📊 getAllPos: Returning ${result.length} POs from po_master table`);

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
    // Skip master_po_header table check since table doesn't exist
    console.log(`🚫 Skipping master_po_header lookup for PO ${id} - table does not exist`);

    // PRIORITY 2: Check po_master table (manual POs)
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
    console.log(`🗑️ Storage: Starting deletion for PO ID ${id}`);
    
    // Check if the PO exists in pf_po table first
    const existingPo = await db.select().from(pfPo).where(eq(pfPo.id, id));
    if (existingPo.length === 0) {
      console.log(`⚠️ Storage: PO with ID ${id} not found in pf_po table`);
      
      // Also check if it might exist in other PO tables (Flipkart, Zepto, etc.)
      console.log(`🔍 Storage: Checking if PO ID ${id} exists in other PO tables...`);
      
      // If PO doesn't exist anywhere, it might have been already deleted
      // Instead of throwing an error, we'll treat this as already deleted
      console.log(`ℹ️ Storage: PO ID ${id} already deleted or never existed - treating as successful deletion`);
      return;
    }
    
    console.log(`📝 Storage: Found PO to delete: ${existingPo[0].po_number}`);
    
    await db.transaction(async (tx) => {
      console.log(`🗑️ Storage: Deleting order items for PO ID ${id} from pf_order_items table`);
      const deletedItems = await tx.delete(pfOrderItems).where(eq(pfOrderItems.po_id, id));
      console.log(`✅ Storage: Deleted order items for PO ID ${id}`);
      
      console.log(`🗑️ Storage: Deleting PO record for ID ${id} from pf_po table`);
      const deletedPo = await tx.delete(pfPo).where(eq(pfPo.id, id));
      console.log(`✅ Storage: Deleted PO record for ID ${id}`);
    });
    
    // Verify deletion was successful
    const verifyDeletion = await db.select().from(pfPo).where(eq(pfPo.id, id));
    if (verifyDeletion.length > 0) {
      console.error(`❌ Storage: DELETION FAILED - PO ID ${id} still exists in database!`);
      throw new Error(`Failed to delete PO with ID ${id} - still exists in database`);
    }
    
    console.log(`✅ Storage: VERIFIED - PO ID ${id} successfully deleted from database`);
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
      // Add missing required fields for PfOrderItems
      invoice_date: null,
      invoice_litre: null,
      invoice_amount: null,
      invoice_qty: null,
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
  
  async getPoMasterById(id: number): Promise<(PoMaster & { platform: PfMst; poLines: PoLines[]; state?: any; district?: any; distributor?: any }) | undefined> {
    const master = await db.select().from(poMaster).where(eq(poMaster.id, id)).limit(1);
    if (!master[0]) return undefined;
    
    // Get platform information
    const platform = await db.select().from(pfMst).where(eq(pfMst.id, master[0].platform_id)).limit(1);
    
    // Get state information
    let state = null;
    if (master[0].state_id) {
      const stateResult = await db.select().from(states).where(eq(states.id, master[0].state_id)).limit(1);
      state = stateResult[0];
    }
    
    // Get district information
    let district = null;
    if (master[0].district_id) {
      const districtResult = await db.select().from(districts).where(eq(districts.id, master[0].district_id)).limit(1);
      district = districtResult[0];
    }
    
    // Get distributor information
    let distributor = null;
    if (master[0].distributor_id) {
      const distributorResult = await db.select().from(distributorMst).where(eq(distributorMst.id, master[0].distributor_id)).limit(1);
      distributor = distributorResult[0];
    }
    
    // Get associated po lines with product and tax rate information
    const linesWithProducts = await db
      .select({
        line: poLines,
        product: pfItemMst,
        sapItem: {
          itemcode: items.itemcode,
          itemname: items.itemname,
          taxrate: items.taxrate  // Explicitly select the tax rate field (maps to u_tax_rate column)
        }
      })
      .from(poLines)
      .leftJoin(pfItemMst, eq(poLines.platform_product_code_id, pfItemMst.id))
      .leftJoin(items, eq(pfItemMst.sap_id, items.itemcode))
      .where(eq(poLines.po_id, id))
      .orderBy(poLines.id);
      
    // Transform lines to include product information
    const lines = linesWithProducts.map((lineWithProduct: any) => {
      const line = lineWithProduct.line;
      const product = lineWithProduct.product;
      
      return {
        ...line,
        // Add product information if available
        item_name: product?.pf_itemname || line.remark || `Product ID: ${line.platform_product_code_id}`,
        platform_code: product?.pf_itemcode || line.platform_product_code_id,
        sap_id: product?.sap_id || null,
        // Add original tax rate from items table
        original_tax_rate: lineWithProduct.sapItem?.taxrate || null
      };
    });
    
    return {
      ...master[0],
      platform: platform[0],
      poLines: lines,
      state,
      district,
      distributor
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
    console.log(`🗑️ Storage: Starting po_master deletion for PO ID ${id}`);
    
    // First check if the PO exists in po_master table
    const existingPo = await db.select().from(poMaster).where(eq(poMaster.id, id));
    if (existingPo.length === 0) {
      console.log(`⚠️ Storage: PO with ID ${id} not found in po_master table`);
      console.log(`ℹ️ Storage: PO ID ${id} already deleted or never existed - treating as successful deletion`);
      return;
    }
    
    console.log(`📝 Storage: Found PO in po_master to delete: ${existingPo[0].vendor_po_number}`);
    
    await db.transaction(async (tx) => {
      console.log(`🗑️ Storage: Deleting po lines for PO ID ${id} from po_lines table`);
      const deletedLines = await tx.delete(poLines).where(eq(poLines.po_id, id));
      console.log(`✅ Storage: Deleted po lines for PO ID ${id}`);
      
      console.log(`🗑️ Storage: Deleting PO record for ID ${id} from po_master table`);
      const deletedPo = await tx.delete(poMaster).where(eq(poMaster.id, id));
      console.log(`✅ Storage: Deleted PO record from po_master for ID ${id}`);
    });
    
    // Verify deletion was successful
    const verifyDeletion = await db.select().from(poMaster).where(eq(poMaster.id, id));
    if (verifyDeletion.length > 0) {
      console.error(`❌ Storage: DELETION FAILED - PO ID ${id} still exists in po_master table!`);
      throw new Error(`Failed to delete PO with ID ${id} - still exists in po_master table`);
    }
    
    console.log(`✅ Storage: VERIFIED - PO ID ${id} successfully deleted from po_master table`);
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

  private async insertIntoPoMasterAndLines(
    tx: any,
    platformName: string,
    platformHeader: any,
    platformLines: any[]
  ): Promise<void> {
    console.log(`🚫 Skipping master_po_header insertion for ${platformName} PO ${platformHeader.po_number || 'Unknown'}`);
    console.log(`   Reason: master_po_header table does not exist and insertion is disabled`);
    console.log(`   Platform: ${platformName}, Lines: ${platformLines.length}`);
    return;
  }

  async createFlipkartGroceryPo(header: InsertFlipkartGroceryPoHeader, lines: InsertFlipkartGroceryPoLines[]): Promise<FlipkartGroceryPoHeader> {
    return await db.transaction(async (tx) => {
      // Insert into platform-specific tables
      const [createdHeader] = await tx.insert(flipkartGroceryPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          header_id: createdHeader.id
        }));
        await tx.insert(flipkartGroceryPoLines).values(linesWithHeaderId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'FlipkartGrocery', createdHeader, linesWithHeaderId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'FlipkartGrocery', createdHeader, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(flipkartGroceryPoLines).where(eq(flipkartGroceryPoLines.header_id, id));
      
      // Then delete the PO header
      await tx.delete(flipkartGroceryPoHeader).where(eq(flipkartGroceryPoHeader.id, id));
    });
  }

  async getFlipkartGroceryPoLines(poHeaderId: number): Promise<FlipkartGroceryPoLines[]> {
    return await db.select().from(flipkartGroceryPoLines)
      .where(eq(flipkartGroceryPoLines.header_id, poHeaderId))
      .orderBy(flipkartGroceryPoLines.line_number);
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
    console.log('📋 Creating Zepto PO:', header.po_number, 'with', lines.length, 'lines');
    return await db.transaction(async (tx) => {
      // Insert into platform-specific tables
      const [createdHeader] = await tx.insert(zeptoPoHeader).values(header).returning();
      console.log('✅ Created zepto_po_header ID:', createdHeader.id);
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        await tx.insert(zeptoPoLines).values(linesWithHeaderId);
        
        // Also insert into consolidated po_master and po_lines tables
        console.log('📊 Inserting into po_master and po_lines tables...');
        await this.insertIntoPoMasterAndLines(tx, 'Zepto', createdHeader, linesWithHeaderId);
        console.log('✅ Successfully inserted into ALL tables!');
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'Zepto', createdHeader, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(zeptoPoLines).where(eq(zeptoPoLines.po_header_id, id));
      
      // Then delete the PO header
      await tx.delete(zeptoPoHeader).where(eq(zeptoPoHeader.id, id));
    });
  }

  async getZeptoPoLines(poHeaderId: number): Promise<ZeptoPoLines[]> {
    return await db.select().from(zeptoPoLines)
      .where(eq(zeptoPoLines.po_header_id, poHeaderId))
      .orderBy(zeptoPoLines.line_number);
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
      // Insert into platform-specific tables
      const [createdHeader] = await tx.insert(cityMallPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        await tx.insert(cityMallPoLines).values(linesWithHeaderId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'CityMall', createdHeader, linesWithHeaderId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'CityMall', createdHeader, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(cityMallPoLines).where(eq(cityMallPoLines.po_header_id, id));
      
      // Then delete the PO header
      await tx.delete(cityMallPoHeader).where(eq(cityMallPoHeader.id, id));
    });
  }

  async getCityMallPoByNumber(poNumber: string): Promise<CityMallPoHeader | undefined> {
    const [header] = await db.select().from(cityMallPoHeader).where(eq(cityMallPoHeader.po_number, poNumber));
    return header || undefined;
  }

  async getCityMallPoLines(poHeaderId: number): Promise<CityMallPoLines[]> {
    return await db.select().from(cityMallPoLines)
      .where(eq(cityMallPoLines.po_header_id, poHeaderId))
      .orderBy(cityMallPoLines.line_number);
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
      // Insert into platform-specific tables
      const [createdHeader] = await tx.insert(blinkitPoHeader).values(header).returning();
      
      if (lines.length > 0) {
        const linesWithHeaderId = lines.map(line => ({
          ...line,
          po_header_id: createdHeader.id
        }));
        await tx.insert(blinkitPoLines).values(linesWithHeaderId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'Blinkit', createdHeader, linesWithHeaderId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'Blinkit', createdHeader, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(blinkitPoLines).where(eq(blinkitPoLines.po_header_id, id));
      
      // Then delete the PO header
      await tx.delete(blinkitPoHeader).where(eq(blinkitPoHeader.id, id));
    });
  }

  async getBlinkitPoByNumber(poNumber: string): Promise<BlinkitPoHeader | undefined> {
    const [header] = await db.select().from(blinkitPoHeader).where(eq(blinkitPoHeader.po_number, poNumber));
    return header || undefined;
  }

  async getBlinkitPoLines(poHeaderId: number): Promise<BlinkitPoLines[]> {
    return await db.select().from(blinkitPoLines)
      .where(eq(blinkitPoLines.po_header_id, poHeaderId))
      .orderBy(blinkitPoLines.line_number);
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
      // Insert into platform-specific tables
      const [createdPo] = await tx.insert(swiggyPos).values(po).returning();
      
      if (lines.length > 0) {
        const linesWithPoId = lines.map(line => ({ ...line, po_id: createdPo.id }));
        await tx.insert(swiggyPoLines).values(linesWithPoId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'Swiggy', createdPo, linesWithPoId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'Swiggy', createdPo, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(swiggyPoLines).where(eq(swiggyPoLines.po_id, id));
      
      // Then delete the PO header
      await tx.delete(swiggyPos).where(eq(swiggyPos.id, id));
    });
  }

  async getSwiggyPoLines(poId: number): Promise<SwiggyPoLine[]> {
    return await db.select().from(swiggyPoLines)
      .where(eq(swiggyPoLines.po_id, poId))
      .orderBy(swiggyPoLines.line_number);
  }

  // Distributor methods
  async getAllDistributors(): Promise<DistributorMst[]> {
    return await db.select().from(distributorMst).where(eq(distributorMst.status, 'Active')).orderBy(distributorMst.distributor_name);
  }

  async getDistributorById(id: number): Promise<DistributorMst | undefined> {
    const [distributor] = await db.select().from(distributorMst).where(eq(distributorMst.id, id));
    return distributor || undefined;
  }

  async getDistributorByName(name: string): Promise<DistributorMst | undefined> {
    const [distributor] = await db.select().from(distributorMst)
      .where(and(
        eq(distributorMst.distributor_name, name),
        eq(distributorMst.status, 'Active')
      ));
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

  // Three-level cascading: regions → states → districts
  async getAllRegions(): Promise<{ id: number; region_name: string }[]> {
    console.log('🌍 Storage: Fetching all regions');
    
    try {
      // Try to get from regions table first
      const result = await db.select().from(regions).where(eq(regions.status, 'Active')).orderBy(regions.region_name);
      console.log(`🌍 Storage: Found ${result.length} regions from table:`, result.map(r => r.region_name));
      return result;
    } catch (error) {
      console.log('🌍 Storage: Regions table not found, using hardcoded regions');
      // Fallback to hardcoded regions if table doesn't exist
      return [
        { id: 1, region_name: 'NORTH INDIA' },
        { id: 2, region_name: 'SOUTH INDIA' },
        { id: 3, region_name: 'WEST INDIA' },
        { id: 4, region_name: 'EAST INDIA' },
        { id: 5, region_name: 'CENTRAL INDIA' }
      ];
    }
  }

  async getStatesByRegion(regionId: number): Promise<{ id: number; state_name: string; region_id: number }[]> {
    console.log(`🏛️ Storage: Fetching states for region ID: ${regionId}`);
    
    // Define region-state mapping since region_id might not exist in states table
    const regionStateMapping: Record<number, string[]> = {
      1: ['DELHI', 'HARYANA', 'PUNJAB', 'HIMACHAL PRADESH', 'UTTAR PRADESH', 'UTTARAKHAND', 'JAMMU AND KASHMIR', 'LADAKH', 'CHANDIGARH'], // NORTH INDIA
      2: ['KARNATAKA', 'TAMIL NADU', 'KERALA', 'ANDHRA PRADESH', 'TELANGANA', 'PUDUCHERRY'], // SOUTH INDIA  
      3: ['MAHARASHTRA', 'GUJARAT', 'RAJASTHAN', 'GOA', 'THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU'], // WEST INDIA
      4: ['WEST BENGAL', 'ODISHA', 'BIHAR', 'JHARKHAND', 'ASSAM', 'MEGHALAYA', 'MANIPUR', 'MIZORAM', 'NAGALAND', 'TRIPURA', 'ARUNACHAL PRADESH', 'SIKKIM'], // EAST INDIA
      5: ['MADHYA PRADESH', 'CHHATTISGARH'] // CENTRAL INDIA
    };
    
    const regionNames = ['', 'NORTH INDIA', 'SOUTH INDIA', 'WEST INDIA', 'EAST INDIA', 'CENTRAL INDIA'];
    const regionName = regionNames[regionId] || 'UNKNOWN';
    
    console.log(`🏛️ Storage: Mapping states for region: ${regionName}`);
    
    const stateNamesForRegion = regionStateMapping[regionId] || [];
    
    if (stateNamesForRegion.length === 0) {
      console.log(`❌ Storage: No states mapped for region ID ${regionId}`);
      return [];
    }
    
    try {
      // Try to filter by region_id first if it exists
      const resultByRegionId = await db.select().from(states).where(eq(states.region_id, regionId)).orderBy(states.statename);
      
      if (resultByRegionId.length > 0) {
        console.log(`🏛️ Storage: Found ${resultByRegionId.length} states using region_id for ${regionName}`);
        return resultByRegionId.map(state => ({
          id: state.id,
          state_name: state.statename,
          region_id: regionId
        }));
      }
    } catch (error) {
      console.log('🏛️ Storage: region_id column not found, using name-based filtering');
    }
    
    // Fallback to name-based filtering
    const allStates = await db.select().from(states).orderBy(states.statename);
    const filteredStates = allStates.filter(state => 
      stateNamesForRegion.some(regionStateName => 
        state.statename.toUpperCase().includes(regionStateName.toUpperCase()) ||
        regionStateName.toUpperCase().includes(state.statename.toUpperCase())
      )
    );
    
    console.log(`🏛️ Storage: Found ${filteredStates.length} states for region ${regionName} using name mapping:`, 
      filteredStates.map(s => s.statename));
    
    return filteredStates.map(state => ({
      id: state.id,
      state_name: state.statename,
      region_id: regionId
    }));
  }

  async getDistrictsByStateIdFromMaster(stateId: number): Promise<{ id: number; district_name: string; state_id: number }[]> {
    console.log(`🏘️ Storage: Fetching districts for state ID: ${stateId}`);
    
    // First verify the state exists
    const state = await db.select().from(states).where(eq(states.id, stateId)).limit(1);
    if (state.length === 0) {
      console.log(`❌ Storage: State ID ${stateId} not found`);
      return [];
    }
    
    console.log(`🏘️ Storage: State found: ${state[0].statename}`);
    
    // Get districts for this state
    const result = await db.select().from(districts).where(eq(districts.state_id, stateId)).orderBy(districts.district);
    
    console.log(`🏘️ Storage: Found ${result.length} districts for state ${state[0].statename}:`, 
      result.map(d => d.district));
    
    return result.map(district => ({
      id: district.id,
      district_name: district.district,
      state_id: district.state_id
    }));
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
    try {
      // First try to get items using the drizzle query
      const itemsData = await db.select().from(items);
      console.log(`📊 getAllItems: Found ${itemsData.length} items in PostgreSQL items table`);
      return itemsData;
    } catch (error) {
      console.error("Error fetching items from database:", error);
      // If drizzle query fails, try raw SQL as fallback
      try {
        const result = await db.execute(sql`
          SELECT * FROM items 
          ORDER BY itemname
          LIMIT 1000
        `);
        console.log(`📊 getAllItems (raw SQL): Found ${result.rows.length} items`);
        return result.rows;
      } catch (sqlError) {
        console.error("Raw SQL query also failed:", sqlError);
        return [];
      }
    }
  }

  async searchItems(query: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT id, itemcode, itemname, itemgroup, type, variety, 
             subgroup, brand, uom, taxrate, unitsize, is_litre, 
             case_pack, basic_rate, landing_rate, mrp, supplier_price
      FROM items 
      WHERE itemname ILIKE ${`%${query}%`}
         OR itemcode ILIKE ${`%${query}%`}
         OR brand ILIKE ${`%${query}%`}
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

  async createPFItem(data: { pf_id: number; pf_itemcode: string; pf_itemname: string; sap_id: string }): Promise<any> {
    try {
      console.log(`🔍 Storage: Checking for duplicate PF item - Platform: ${data.pf_id}, Code: ${data.pf_itemcode}`);
      
      // STRICT VALIDATION: Check for duplicates by pf_id + pf_itemcode combination
      const existingByCode = await db
        .select()
        .from(pfItemMst)
        .where(and(
          eq(pfItemMst.pf_id, data.pf_id),
          eq(pfItemMst.pf_itemcode, data.pf_itemcode.trim())
        ));
      
      if (existingByCode.length > 0) {
        console.log(`❌ Storage: BLOCKED - PF item code '${data.pf_itemcode}' already exists for platform ${data.pf_id}`);
        console.log(`❌ Storage: Existing item details:`, existingByCode[0]);
        throw new Error(`❌ DUPLICATE NOT ALLOWED: PF item code '${data.pf_itemcode}' already exists for this platform. Each item code must be unique within a platform.`);
      }
      
      // STRICT VALIDATION: Check for duplicate pf_itemname within the same platform
      const existingByName = await db
        .select()
        .from(pfItemMst)
        .where(and(
          eq(pfItemMst.pf_id, data.pf_id),
          eq(pfItemMst.pf_itemname, data.pf_itemname.trim())
        ));
      
      if (existingByName.length > 0) {
        console.log(`❌ Storage: BLOCKED - PF item name '${data.pf_itemname}' already exists for platform ${data.pf_id}`);
        console.log(`❌ Storage: Existing item details:`, existingByName[0]);
        throw new Error(`❌ DUPLICATE NOT ALLOWED: PF item name '${data.pf_itemname}' already exists for this platform. Each item name must be unique within a platform.`);
      }
      
      // EXTRA CHECK: Ensure exact combination doesn't exist
      const existingCombination = await db
        .select()
        .from(pfItemMst)
        .where(and(
          eq(pfItemMst.pf_id, data.pf_id),
          eq(pfItemMst.pf_itemcode, data.pf_itemcode.trim()),
          eq(pfItemMst.pf_itemname, data.pf_itemname.trim())
        ));
      
      if (existingCombination.length > 0) {
        console.log(`❌ Storage: BLOCKED - Exact combination already exists for platform ${data.pf_id}`);
        throw new Error(`❌ DUPLICATE NOT ALLOWED: This exact PF item already exists. Both the code and name must be unique.`);
      }
      
      console.log(`✅ Storage: No duplicates found, proceeding with PF item creation`);
      
      // Insert into pf_item_mst table
      const [newItem] = await db
        .insert(pfItemMst)
        .values({
          pf_id: data.pf_id,
          pf_itemcode: data.pf_itemcode,
          pf_itemname: data.pf_itemname,
          sap_id: data.sap_id
        })
        .returning();
      
      console.log(`✅ Storage: Successfully created PF item with ID: ${newItem.id}`);
      return newItem;
    } catch (error) {
      console.error("Error creating PF item:", error);
      
      // Handle database constraint violations
      if (error instanceof Error) {
        // Check for our new unique constraint violations from database
        if (error.message.includes('pf_item_unique_code_per_platform')) {
          throw new Error(`🚫 DATABASE BLOCKED: PF item code '${data.pf_itemcode}' already exists for this platform. No duplicate item codes allowed within the same platform.`);
        }
        if (error.message.includes('pf_item_unique_name_per_platform')) {
          throw new Error(`🚫 DATABASE BLOCKED: PF item name '${data.pf_itemname}' already exists for this platform. No duplicate item names allowed within the same platform.`);
        }
        // Check for old constraint names too (if they exist)
        if (error.message.includes('pf_item_mst_pf_id_itemcode_unique')) {
          throw new Error(`🚫 DATABASE BLOCKED: PF item code '${data.pf_itemcode}' already exists for this platform. No duplicates allowed.`);
        }
        if (error.message.includes('pf_item_mst_pf_id_itemname_unique')) {
          throw new Error(`🚫 DATABASE BLOCKED: PF item name '${data.pf_itemname}' already exists for this platform. No duplicates allowed.`);
        }
        // Re-throw with original message if it's already a user-friendly error
        if (error.message.includes('already exists') || error.message.includes('DUPLICATE NOT ALLOWED') || error.message.includes('DATABASE BLOCKED')) {
          throw error;
        }
      }
      
      throw new Error("Failed to create PF item");
    }
  }

  async checkPFItemDuplicates(data: { pf_id: number; pf_itemcode: string; pf_itemname: string }): Promise<{ codeExists: boolean; nameExists: boolean; }> {
    try {
      console.log(`🔍 Storage: Checking duplicates for Platform: ${data.pf_id}, Code: '${data.pf_itemcode}', Name: '${data.pf_itemname}'`);
      
      let codeExists = false;
      let nameExists = false;
      
      // Check for duplicate pf_itemcode
      if (data.pf_itemcode && data.pf_itemcode.trim()) {
        const existingByCode = await db
          .select()
          .from(pfItemMst)
          .where(and(
            eq(pfItemMst.pf_id, data.pf_id),
            eq(pfItemMst.pf_itemcode, data.pf_itemcode.trim())
          ));
        
        codeExists = existingByCode.length > 0;
        if (codeExists) {
          console.log(`⚠️ Storage: Item code '${data.pf_itemcode}' already exists for platform ${data.pf_id}`);
        }
      }
      
      // Check for duplicate pf_itemname
      if (data.pf_itemname && data.pf_itemname.trim()) {
        const existingByName = await db
          .select()
          .from(pfItemMst)
          .where(and(
            eq(pfItemMst.pf_id, data.pf_id),
            eq(pfItemMst.pf_itemname, data.pf_itemname.trim())
          ));
        
        nameExists = existingByName.length > 0;
        if (nameExists) {
          console.log(`⚠️ Storage: Item name '${data.pf_itemname}' already exists for platform ${data.pf_id}`);
        }
      }
      
      console.log(`✅ Storage: Duplicate check complete - Code exists: ${codeExists}, Name exists: ${nameExists}`);
      
      return { codeExists, nameExists };
    } catch (error) {
      console.error("Error checking PF item duplicates:", error);
      throw new Error("Failed to check for duplicates");
    }
  }

  async searchPFItems(searchTerm: string): Promise<any[]> {
    try {
      console.log('🔍 SearchPFItems - Starting search for:', searchTerm);
      
      // Query pf_item_mst and join with items table to get tax rate
      const result = await db
        .select({
          id: pfItemMst.id,
          pf_itemcode: pfItemMst.pf_itemcode,
          pf_itemname: pfItemMst.pf_itemname,
          pf_id: pfItemMst.pf_id,
          sap_id: pfItemMst.sap_id,
          actual_itemcode: items.itemcode, // Get actual item code from items table
          taxrate: items.taxrate // Get tax rate from items table (field name is 'taxrate' mapped to column 'u_tax_rate')
        })
        .from(pfItemMst)
        .leftJoin(items, eq(pfItemMst.sap_id, items.itemcode))
        .where(
          or(
            ilike(pfItemMst.pf_itemname, `%${searchTerm}%`),
            ilike(pfItemMst.pf_itemcode, `%${searchTerm}%`)
          )
        )
        .limit(50); // Limit results for performance
      
      console.log('🔍 SearchPFItems - Found', result.length, 'items');
      if (result.length > 0) {
        console.log('🔍 Sample item data:', JSON.stringify(result[0], null, 2));
      }
      
      return result;
    } catch (error) {
      console.error("Error searching PF items:", error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  async getUniqueDispatchLocations(): Promise<string[]> {
    try {
      console.log('🔍 Getting unique dispatch locations from po_master');
      
      // Get unique dispatch_from values from poMaster table where dispatch_from is not null/empty
      const result = await db
        .selectDistinct({ dispatch_from: poMaster.dispatch_from })
        .from(poMaster)
        .where(and(
          sql`${poMaster.dispatch_from} IS NOT NULL`,
          sql`trim(${poMaster.dispatch_from}) != ''`
        ))
        .orderBy(poMaster.dispatch_from);
      
      const locations = result
        .map(row => row.dispatch_from)
        .filter((location): location is string => location !== null && location.trim() !== '');
      
      console.log('🔍 Found unique dispatch locations:', locations);
      return locations;
    } catch (error) {
      console.error("Error getting unique dispatch locations:", error);
      return [];
    }
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
          taxrate: hanaItem.U_Tax_Rate ? hanaItem.U_Tax_Rate.toString() : (hanaItem.TaxRate ? hanaItem.TaxRate.toString() : null),
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
    console.log('📋 Fetching distributor order items from po_master and po_lines (simplified version)...');
    
    try {
      // First, try to get just the po_lines data with minimal joins
      console.log('🔍 Testing po_lines table access...');
      const lines = await db
        .select({
          id: poLines.id,
          po_id: poLines.po_id,
          quantity: poLines.quantity,
          basic_amount: poLines.basic_amount,
          tax: poLines.tax,
          landing_amount: poLines.landing_amount,
          total_amount: poLines.total_amount,
          status: poLines.status,
          platform_product_code_id: poLines.platform_product_code_id
        })
        .from(poLines)
        .orderBy(desc(poLines.id))
        .limit(50); // Very small limit first
        
      console.log(`📊 Found ${lines.length} po_lines records`);
      
      if (lines.length === 0) {
        console.log('❌ No po_lines found, returning empty array');
        return [];
      }

      // Get corresponding PO data for just these lines
      const poIds = Array.from(new Set(lines.map(line => line.po_id)));
      console.log(`🔍 Getting PO data for ${poIds.length} unique PO IDs...`);
      
      const pos = await db
        .select()
        .from(poMaster)
        .where(inArray(poMaster.id, poIds));
        
      console.log(`📊 Found ${pos.length} po_master records`);
      
      // Get distributor data
      const distributorIds = Array.from(new Set(pos.map(po => po.distributor_id).filter(id => id != null)));
      console.log(`🔍 Getting distributor data for ${distributorIds.length} distributor IDs...`);
      
      const distributorsData = distributorIds.length > 0 ? await db
        .select()
        .from(distributorMst)
        .where(inArray(distributorMst.id, distributorIds)) : [];
      
      console.log(`📊 Found ${distributorsData.length} distributor records`);

      // Create maps for quick lookup
      const poMap = new Map();
      pos.forEach(po => poMap.set(po.id, po));
      
      const distributorMap = new Map();
      distributorsData.forEach(dist => distributorMap.set(dist.id, dist));

      // Transform data to match expected distributor order items format
      const transformedItems = lines
        .filter(line => line.po_id && poMap.has(line.po_id))
        .map(line => {
          const po = poMap.get(line.po_id);
          const distributor = po.distributor_id ? distributorMap.get(po.distributor_id) : null;
          const distributorName = distributor ? distributor.distributor_name : 'Unknown';
          
          // Map status properly - status is stored as integer in po_lines table
          // Default status should be 'Open' for new POs
          let statusText = 'Open';  // Changed default from 'Pending' to 'Open'
          if (line.status !== null && line.status !== undefined) {
            // Status is stored as integer in po_lines table
            const statusNum = typeof line.status === 'string' ? parseInt(line.status) : line.status;
            switch(statusNum) {
              case 0: statusText = 'Open'; break;
              case 1: statusText = 'Confirmed'; break;
              case 2: statusText = 'Shipped'; break;
              case 3: statusText = 'Delivered'; break;
              case 4: statusText = 'Cancelled'; break;
              default: statusText = 'Open';  // Default to 'Open' instead of 'Pending'
            }
          }
          
          return {
            id: line.id,
            po_id: line.po_id,
            item_name: `Product ID: ${line.platform_product_code_id}`,
            quantity: parseFloat(line.quantity || '0'),
            sap_code: null,
            category: null,
            subcategory: null,
            basic_rate: String(line.basic_amount || '0'),
            gst_rate: String(line.tax || '0'),
            landing_rate: String(line.landing_amount || line.total_amount || '0'),
            total_litres: null,
            status: statusText,
            hsn_code: null,
            po_number: po.vendor_po_number || 'UNKNOWN',
            distributor_name: distributorName,
            order_date: po.po_date ? new Date(po.po_date) : new Date(),
            expiry_date: po.expiry_date ? new Date(po.expiry_date) : null,
            distributor: {
              id: distributor?.id || 0,
              distributor_name: distributorName,
              distributor_code: null,
              contact_person: null,
              phone: null,
              email: null,
              address: po.region || 'Unknown',
              city: po.area || null,
              state: null,
              region: po.region || 'Unknown',
              status: 'Active',
              created_at: new Date(),
              updated_at: new Date()
            } as DistributorMst
          };
        });

      console.log(`✅ Transformed ${transformedItems.length} distributor order items from po_master/po_lines`);
      
      return transformedItems as (DistributorOrderItems & { po_number: string; distributor_name: string; order_date: Date; expiry_date: Date | null; distributor: DistributorMst })[];
      
    } catch (error) {
      console.error('❌ Error in getAllDistributorOrderItems:', error);
      // Return empty array instead of throwing to prevent API crashes
      return [];
    }
  }

  async updateDistributorOrderItemStatus(itemId: number, status: string): Promise<void> {
    console.log(`🔄 Updating distributor order item ${itemId} status to: ${status}`);
    
    // Convert status text to integer for po_lines table
    let statusNum = 0;
    switch(status.toUpperCase()) {
      case 'OPEN': statusNum = 0; break;
      case 'PENDING': statusNum = 0; break;  // Map PENDING to 0 (Open)
      case 'CONFIRMED': statusNum = 1; break;
      case 'SHIPPED': statusNum = 2; break;
      case 'DELIVERED': statusNum = 3; break;
      case 'CANCELLED': statusNum = 4; break;
      default: statusNum = 0;
    }
    
    // Update the po_lines table instead of distributor_order_items
    const result = await db
      .update(poLines)
      .set({ status: statusNum })
      .where(eq(poLines.id, itemId));
    console.log(`✅ Updated po_lines item ${itemId} status to ${statusNum} (${status}):`, result);
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
      // Insert into platform-specific tables
      const [createdPo] = await tx.insert(bigbasketPoHeader).values(po).returning();
      
      if (lines.length > 0) {
        const linesWithPoId = lines.map(line => ({ ...line, po_id: createdPo.id }));
        await tx.insert(bigbasketPoLines).values(linesWithPoId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'BigBasket', createdPo, linesWithPoId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'BigBasket', createdPo, []);
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
    await db.transaction(async (tx) => {
      // First delete all related po lines
      await tx.delete(bigbasketPoLines).where(eq(bigbasketPoLines.po_id, id));
      
      // Then delete the PO header
      await tx.delete(bigbasketPoHeader).where(eq(bigbasketPoHeader.id, id));
    });
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
      // Insert into platform-specific tables
      const [createdPo] = await tx.insert(zomatoPoHeader).values(header).returning();
      
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: createdPo.id
        }));
        await tx.insert(zomatoPoItems).values(itemsWithPoId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'Zomato', createdPo, itemsWithPoId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'Zomato', createdPo, []);
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
      // Insert into platform-specific tables
      const [createdPo] = await tx.insert(dealsharePoHeader).values(header).returning();
      
      if (items.length > 0) {
        const itemsWithPoId = items.map(item => ({
          ...item,
          po_header_id: createdPo.id
        }));
        await tx.insert(dealsharePoItems).values(itemsWithPoId);
        
        // Also insert into consolidated po_master and po_lines tables
        await this.insertIntoPoMasterAndLines(tx, 'Dealshare', createdPo, itemsWithPoId);
      } else {
        // Insert header only into po_master
        await this.insertIntoPoMasterAndLines(tx, 'Dealshare', createdPo, []);
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
    const conditions = [];
    if (platform) conditions.push(eq(secondarySalesHeader.platform, platform));
    if (businessUnit) conditions.push(eq(secondarySalesHeader.business_unit, businessUnit));
    
    const sales = conditions.length > 0 
      ? await db.select().from(secondarySalesHeader).where(and(...conditions)).orderBy(desc(secondarySalesHeader.created_at))
      : await db.select().from(secondarySalesHeader).orderBy(desc(secondarySalesHeader.created_at));
    
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

  async createInventoryBlinkitJmRange(items: any[]): Promise<any[]> {
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

  // Logging methods implementation
  async createLog(logData: InsertLogMaster): Promise<LogMaster> {
    const [newLog] = await db.insert(logMaster).values(logData).returning();
    return newLog;
  }

  async logEdit(params: {
    username: string;
    action: string;
    tableName: string;
    recordId: number;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }): Promise<void> {
    console.log(`📝 Logging ${params.action} on ${params.tableName} record ${params.recordId} by ${params.username}`);
    
    const logData: InsertLogMaster = {
      username: params.username,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      field_name: params.fieldName || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      session_id: params.sessionId || null,
      timestamp: new Date()
    };

    try {
      await this.createLog(logData);
      console.log(`✅ Log entry created successfully for ${params.action} on ${params.tableName}`);
    } catch (error) {
      console.error(`❌ Failed to create log entry:`, error);
      // Don't throw error - logging failure shouldn't break the main operation
    }
  }

  // Helper method to map item status string to status ID
  private mapItemStatusToId(status?: string): number {
    if (!status) return 1; // Default to PENDING
    
    const statusMap: Record<string, number> = {
      'PENDING': 1,
      'INVOICED': 2,
      'DISPATCHED': 3,
      'DELIVERED': 4,
      'STOCK_ISSUE': 5,
      'PRICE_DIFF': 6,
      'MOV_ISSUE': 7,
      'CANCELLED': 8,
      'EXPIRED': 9
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
        status_id: 1, // Default status ID for "OPEN" (1 = Open, 2 = Closed, etc.)
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
          
          // Map status name to status ID using helper method
          const statusId = this.mapItemStatusToId(line.status);
          console.log(`🔍 Mapping status "${line.status}" to ID: ${statusId}`);

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
            status: statusId, // Use mapped status ID
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

  // Attachment and Comment functions for all platforms
  
  async addAttachment(platform: string, poId: number, attachmentData: any) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoAttachments,
      'flipkart': flipkartAttachments,
      'blinkit': blinkitAttachments,
      'swiggy': swiggyAttachments,
      'bigbasket': bigbasketAttachments,
      'zomato': zomatoAttachments,
      'dealshare': dealshareAttachments,
      'citymall': citymallAttachments,
      'platform': platformPoAttachments,
      'pf': platformPoAttachments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const attachments = await db.insert(table).values({
      poId,
      ...attachmentData
    }).returning() as any[];
    
    return attachments[0];
  }

  async getAttachments(platform: string, poId: number) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoAttachments,
      'flipkart': flipkartAttachments,
      'blinkit': blinkitAttachments,
      'swiggy': swiggyAttachments,
      'bigbasket': bigbasketAttachments,
      'zomato': zomatoAttachments,
      'dealshare': dealshareAttachments,
      'citymall': citymallAttachments,
      'platform': platformPoAttachments,
      'pf': platformPoAttachments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return await db.select().from(table).where(eq(table.poId, poId));
  }

  async deleteAttachment(platform: string, id: number) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoAttachments,
      'flipkart': flipkartAttachments,
      'blinkit': blinkitAttachments,
      'swiggy': swiggyAttachments,
      'bigbasket': bigbasketAttachments,
      'zomato': zomatoAttachments,
      'dealshare': dealshareAttachments,
      'citymall': citymallAttachments,
      'platform': platformPoAttachments,
      'pf': platformPoAttachments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // First get the attachment to delete the file
    const [attachment] = await db.select().from(table).where(eq(table.id, id));
    
    if (attachment && attachment.filePath) {
      // Delete the physical file
      const fs = await import('fs').then(m => m.promises);
      try {
        await fs.unlink(attachment.filePath);
      } catch (error) {
        console.warn(`Could not delete file: ${attachment.filePath}`, error);
      }
    }

    await db.delete(table).where(eq(table.id, id));
  }

  async addComment(platform: string, poId: number, commentData: any) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoComments,
      'flipkart': flipkartComments,
      'blinkit': blinkitComments,
      'swiggy': swiggyComments,
      'bigbasket': bigbasketComments,
      'zomato': zomatoComments,
      'dealshare': dealshareComments,
      'citymall': citymallComments,
      'platform': platformPoComments,
      'pf': platformPoComments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const comments = await db.insert(table).values({
      poId,
      ...commentData
    }).returning() as any[];
    
    return comments[0];
  }

  async getComments(platform: string, poId: number) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoComments,
      'flipkart': flipkartComments,
      'blinkit': blinkitComments,
      'swiggy': swiggyComments,
      'bigbasket': bigbasketComments,
      'zomato': zomatoComments,
      'dealshare': dealshareComments,
      'citymall': citymallComments,
      'platform': platformPoComments,
      'pf': platformPoComments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    return await db.select().from(table).where(eq(table.poId, poId)).orderBy(table.createdAt);
  }

  async deleteComment(platform: string, id: number) {
    const tableMap: Record<string, any> = {
      'zepto': zeptoComments,
      'flipkart': flipkartComments,
      'blinkit': blinkitComments,
      'swiggy': swiggyComments,
      'bigbasket': bigbasketComments,
      'zomato': zomatoComments,
      'dealshare': dealshareComments,
      'citymall': citymallComments,
      'platform': platformPoComments,
      'pf': platformPoComments
    };

    const table = tableMap[platform.toLowerCase()];
    if (!table) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    await db.delete(table).where(eq(table.id, id));
  }

  // RBAC Methods Implementation
  
  // Role management
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.role_name);
  }

  async getRoleById(id: number): Promise<Role | undefined> {
    const result = await db.select().from(roles).where(eq(roles.id, id));
    return result[0];
  }

  async createRole(role: InsertRole): Promise<Role> {
    const result = await db.insert(roles).values(role).returning();
    return result[0];
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    const result = await db.update(roles)
      .set({ ...role, updated_at: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return result[0];
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Permission management
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions).orderBy(permissions.category, permissions.permission_name);
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return await db.select().from(permissions).where(eq(permissions.category, category));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const result = await db.insert(permissions).values(permission).returning();
    return result[0];
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission> {
    const result = await db.update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    return result[0];
  }

  async deletePermission(id: number): Promise<void> {
    await db.delete(permissions).where(eq(permissions.id, id));
  }

  // Role-Permission management
  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    return await db.select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role_id, roleId));
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const result = await db.insert(rolePermissions)
      .values({ role_id: roleId, permission_id: permissionId })
      .returning();
    return result[0];
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.role_id, roleId),
        eq(rolePermissions.permission_id, permissionId)
      ));
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user[0] || !user[0].role_id) {
      return [];
    }

    return await db.select()
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permission_id))
      .where(eq(rolePermissions.role_id, user[0].role_id))
      .then(results => results.map(result => result.permissions));
  }

  // User management with roles
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<User> {
    const result = await db.update(users)
      .set({ role_id: roleId, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserWithRole(userId: number): Promise<(User & { role?: Role }) | undefined> {
    const result = await db.select()
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, userId));
    
    if (!result[0]) return undefined;
    
    return {
      ...result[0].users,
      role: result[0].roles || undefined
    };
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role_id, roleId));
  }

  // Session management
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const result = await db.insert(userSessions).values(session).returning();
    return result[0];
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const result = await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.session_token, sessionToken),
        gte(userSessions.expires_at, new Date())
      ));
    return result[0];
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.session_token, sessionToken));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db.delete(userSessions).where(lte(userSessions.expires_at, new Date()));
  }

}

export const storage = new DatabaseStorage();
