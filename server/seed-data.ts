import { storage } from "./storage";
import type { InsertPfMst, InsertSapItemMst, InsertPfItemMst } from "@shared/schema";

export async function seedTestData() {
  try {
    // Get existing platforms
    const existingPlatforms = await storage.getAllPlatforms();
    
    // Find platforms we need
    const amazonPlatform = existingPlatforms.find(p => p.pf_name === "Amazon");
    const flipkartPlatform = existingPlatforms.find(p => p.pf_name === "Flipkart");
    const blinkitPlatform = existingPlatforms.find(p => p.pf_name === "Blinkit");
    
    if (!amazonPlatform || !flipkartPlatform || !blinkitPlatform) {
      console.error("Required platforms not found. Please ensure Amazon, Flipkart, and Blinkit platforms exist.");
      return { success: false, error: "Required platforms not found" };
    }
    
    const createdPlatforms = [amazonPlatform, flipkartPlatform, blinkitPlatform];

    // Create SAP items
    const sapItems: InsertSapItemMst[] = [
      { itemcode: "SAP001", itemname: "Laptop - Dell Inspiron 15", itemgroup: "Electronics", subgroup: "Computers", taxrate: 18 },
      { itemcode: "SAP002", itemname: "Mobile - Samsung Galaxy S21", itemgroup: "Electronics", subgroup: "Mobile Phones", taxrate: 18 },
      { itemcode: "SAP003", itemname: "Headphones - Sony WH-1000XM4", itemgroup: "Electronics", subgroup: "Audio", taxrate: 18 },
      { itemcode: "SAP004", itemname: "T-Shirt - Cotton Blue", itemgroup: "Apparel", subgroup: "Men's Clothing", taxrate: 5 },
      { itemcode: "SAP005", itemname: "Running Shoes - Nike Air Max", itemgroup: "Footwear", subgroup: "Sports Shoes", taxrate: 12 },
      { itemcode: "SAP006", itemname: "Coffee Maker - Nespresso", itemgroup: "Home Appliances", subgroup: "Kitchen", taxrate: 18 },
      { itemcode: "SAP007", itemname: "Yoga Mat - Premium", itemgroup: "Sports", subgroup: "Fitness", taxrate: 12 },
      { itemcode: "SAP008", itemname: "Book - Programming Guide", itemgroup: "Books", subgroup: "Technical", taxrate: 0 },
      { itemcode: "SAP009", itemname: "Watch - Casio Digital", itemgroup: "Accessories", subgroup: "Watches", taxrate: 18 },
      { itemcode: "SAP010", itemname: "Backpack - Travel 40L", itemgroup: "Bags", subgroup: "Travel", taxrate: 18 }
    ];

    const createdSapItems = [];
    for (const item of sapItems) {
      const created = await storage.createSapItem(item);
      createdSapItems.push(created);
    }

    // Create platform items (linking platforms to SAP items)
    const platformItems: InsertPfItemMst[] = [
      // Amazon items
      { pf_id: createdPlatforms[0].id, sap_id: createdSapItems[0].id, pf_itemcode: "AMZ-LAP-001", pf_itemname: "Dell Inspiron 15 Laptop (8GB RAM, 512GB SSD)" },
      { pf_id: createdPlatforms[0].id, sap_id: createdSapItems[1].id, pf_itemcode: "AMZ-MOB-001", pf_itemname: "Samsung Galaxy S21 5G (128GB, Phantom Gray)" },
      { pf_id: createdPlatforms[0].id, sap_id: createdSapItems[2].id, pf_itemcode: "AMZ-AUD-001", pf_itemname: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones" },
      { pf_id: createdPlatforms[0].id, sap_id: createdSapItems[5].id, pf_itemcode: "AMZ-APP-001", pf_itemname: "Nespresso Vertuo Coffee Machine" },
      
      // Flipkart items
      { pf_id: createdPlatforms[1].id, sap_id: createdSapItems[0].id, pf_itemcode: "FK-LAP-001", pf_itemname: "DELL Inspiron Core i5 11th Gen Laptop" },
      { pf_id: createdPlatforms[1].id, sap_id: createdSapItems[1].id, pf_itemcode: "FK-MOB-001", pf_itemname: "SAMSUNG Galaxy S21 5G (Phantom Gray, 128 GB)" },
      { pf_id: createdPlatforms[1].id, sap_id: createdSapItems[3].id, pf_itemcode: "FK-CLO-001", pf_itemname: "Men's Cotton T-Shirt (Blue, Size L)" },
      { pf_id: createdPlatforms[1].id, sap_id: createdSapItems[4].id, pf_itemcode: "FK-SHO-001", pf_itemname: "NIKE Air Max Running Shoes For Men" },
      
      // Blinkit items (was Myntra)
      { pf_id: createdPlatforms[2].id, sap_id: createdSapItems[6].id, pf_itemcode: "BLK-FOOD-001", pf_itemname: "Premium Yoga Mat - 6mm Thick" },
      { pf_id: createdPlatforms[2].id, sap_id: createdSapItems[7].id, pf_itemcode: "BLK-BOOK-001", pf_itemname: "Programming Guide - Learn Python" },
      { pf_id: createdPlatforms[2].id, sap_id: createdSapItems[3].id, pf_itemcode: "BLK-CLO-001", pf_itemname: "Men's Cotton T-Shirt - Blue XL" },
      { pf_id: createdPlatforms[2].id, sap_id: createdSapItems[4].id, pf_itemcode: "BLK-SHO-001", pf_itemname: "Nike Running Shoes - Size 10" }
    ];

    for (const item of platformItems) {
      await storage.createPlatformItem(item);
    }

    console.log("Test data seeded successfully!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding test data:", error);
    return { success: false, error };
  }
}