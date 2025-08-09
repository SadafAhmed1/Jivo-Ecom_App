import { callSpGetItemDetails, type ItemDetail } from './sqlServerService';
import { db } from './db';
import { sapItemMst } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class ItemSyncService {
  
  // Sync items from SQL Server stored procedure to local database
  async syncItemsFromSqlServer(): Promise<{ synced: number, errors: string[] }> {
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      console.log('Starting sync from SQL Server SP_GET_ITEM_DETAILS...');
      const sqlServerItems = await callSpGetItemDetails();
      
      console.log(`Retrieved ${sqlServerItems.length} items from SQL Server`);

      for (const sqlItem of sqlServerItems) {
        try {
          await this.upsertSqlServerItem(sqlItem);
          syncedCount++;
        } catch (error) {
          const errorMsg = `Failed to sync item ${sqlItem.ItemCode}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Sync completed: ${syncedCount} items synced, ${errors.length} errors`);
      return { synced: syncedCount, errors };

    } catch (error) {
      const errorMsg = `Failed to sync items from SQL Server: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      return { synced: syncedCount, errors };
    }
  }

  // Upsert a single item from SQL Server data
  private async upsertSqlServerItem(sqlItem: ItemDetail): Promise<void> {
    const itemData = {
      itemcode: sqlItem.ItemCode,
      itemname: sqlItem.ItemName,
      itmsgrpnam: sqlItem.ItmsGrpNam,
      u_type: sqlItem.U_TYPE,
      variety: sqlItem.Variety,
      subgroup: sqlItem.SubGroup,
      u_brand: sqlItem.U_Brand,
      uom: sqlItem.Uom,
      unitsize: sqlItem.UnitSize.toString(),
      u_is_litre: sqlItem.U_IsLitre,
      u_tax_rate: sqlItem.U_Tax_Rate.toString(),
      updated_at: new Date(),
      last_synced: new Date()
    };

    // Check if item exists
    const existingItem = await db
      .select()
      .from(sapItemMst)
      .where(eq(sapItemMst.itemcode, sqlItem.ItemCode))
      .limit(1);

    if (existingItem.length > 0) {
      // Update existing item
      await db
        .update(sapItemMst)
        .set(itemData)
        .where(eq(sapItemMst.itemcode, sqlItem.ItemCode));
    } else {
      // Insert new item
      await db
        .insert(sapItemMst)
        .values({
          ...itemData,
          created_at: new Date()
        });
    }
  }

  // Get all items from local database
  async getAllItems() {
    return await db.select().from(sapItemMst).orderBy(sapItemMst.itemcode);
  }

  // Get item by code
  async getItemByCode(itemCode: string) {
    const result = await db
      .select()
      .from(sapItemMst)
      .where(eq(sapItemMst.itemcode, itemCode))
      .limit(1);
    
    return result[0] || null;
  }

  // Search items by name or code
  async searchItems(searchTerm: string, limit: number = 50) {
    return await db
      .select()
      .from(sapItemMst)
      .where(
        // Using SQL LIKE for better search capability
        sql`${sapItemMst.itemcode} ILIKE ${'%' + searchTerm + '%'} OR ${sapItemMst.itemname} ILIKE ${'%' + searchTerm + '%'}`
      )
      .limit(limit)
      .orderBy(sapItemMst.itemcode);
  }

  // Trigger automatic sync when new item is detected (like a trigger)
  async triggerSyncIfNeeded(): Promise<boolean> {
    try {
      // Check if we need to sync based on some criteria
      // For example, sync once per hour or when manually triggered
      const lastSyncTime = await this.getLastSyncTime();
      const hoursSinceLastSync = lastSyncTime ? 
        (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60) : 999;

      // Auto-sync if more than 1 hour since last sync
      if (hoursSinceLastSync > 1) {
        console.log('Auto-triggering item sync...');
        const result = await this.syncItemsFromSqlServer();
        return result.synced > 0;
      }

      return false;
    } catch (error) {
      console.error('Error in trigger sync:', error);
      return false;
    }
  }

  // Get the last sync timestamp
  private async getLastSyncTime(): Promise<Date | null> {
    const result = await db
      .select({ last_synced: sapItemMst.last_synced })
      .from(sapItemMst)
      .orderBy(sql`${sapItemMst.last_synced} DESC NULLS LAST`)
      .limit(1);

    return result[0]?.last_synced || null;
  }
}

// Import sql for search functionality
import { sql } from 'drizzle-orm';

// Export singleton instance
export const itemSyncService = new ItemSyncService();