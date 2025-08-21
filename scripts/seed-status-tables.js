import { db } from '../server/db.ts';
import { statuses, statusItem } from '../shared/schema.ts';

async function seedStatusTables() {
  try {
    console.log('🌱 Seeding status tables...');

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
        console.log(`✅ Added PO status: ${status.status_name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⏭️  PO status already exists: ${status.status_name}`);
        } else {
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
        console.log(`✅ Added item status: ${status.status_name}`);
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`⏭️  Item status already exists: ${status.status_name}`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Status tables seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding status tables:', error);
    process.exit(1);
  }
}

seedStatusTables();