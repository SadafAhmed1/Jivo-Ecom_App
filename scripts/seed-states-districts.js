import { db } from "../server/db.js";
import { statesMst, districtsMst } from "../shared/schema.js";

const states = [
  { state_name: "Delhi", state_code: "DL", region: "North" },
  { state_name: "Karnataka", state_code: "KA", region: "South" },
  { state_name: "Maharashtra", state_code: "MH", region: "West" },
  { state_name: "West Bengal", state_code: "WB", region: "East" },
  { state_name: "Madhya Pradesh", state_code: "MP", region: "Central" },
  { state_name: "Tamil Nadu", state_code: "TN", region: "South" },
  { state_name: "Gujarat", state_code: "GJ", region: "West" },
  { state_name: "Haryana", state_code: "HR", region: "North" },
  { state_name: "Punjab", state_code: "PB", region: "North" }
];

const districts = [
  // Delhi districts
  { district_name: "New Delhi", state_name: "Delhi" },
  { district_name: "Central Delhi", state_name: "Delhi" },
  { district_name: "South Delhi", state_name: "Delhi" },
  { district_name: "North Delhi", state_name: "Delhi" },
  { district_name: "East Delhi", state_name: "Delhi" },
  { district_name: "West Delhi", state_name: "Delhi" },

  // Karnataka districts
  { district_name: "Bangalore", state_name: "Karnataka" },
  { district_name: "Mysore", state_name: "Karnataka" },
  { district_name: "Hubli", state_name: "Karnataka" },
  { district_name: "Mangalore", state_name: "Karnataka" },
  { district_name: "Belgaum", state_name: "Karnataka" },

  // Maharashtra districts
  { district_name: "Mumbai", state_name: "Maharashtra" },
  { district_name: "Pune", state_name: "Maharashtra" },
  { district_name: "Nagpur", state_name: "Maharashtra" },
  { district_name: "Nashik", state_name: "Maharashtra" },
  { district_name: "Aurangabad", state_name: "Maharashtra" },

  // West Bengal districts
  { district_name: "Kolkata", state_name: "West Bengal" },
  { district_name: "Howrah", state_name: "West Bengal" },
  { district_name: "Durgapur", state_name: "West Bengal" },
  { district_name: "Siliguri", state_name: "West Bengal" },
  { district_name: "Asansol", state_name: "West Bengal" },

  // Madhya Pradesh districts
  { district_name: "Bhopal", state_name: "Madhya Pradesh" },
  { district_name: "Indore", state_name: "Madhya Pradesh" },
  { district_name: "Gwalior", state_name: "Madhya Pradesh" },
  { district_name: "Jabalpur", state_name: "Madhya Pradesh" },
  { district_name: "Ujjain", state_name: "Madhya Pradesh" }
];

async function seedStatesAndDistricts() {
  try {
    console.log("🌱 Seeding states and districts...");

    // Insert states
    console.log("📍 Inserting states...");
    const insertedStates = await db.insert(statesMst).values(states).returning();
    console.log(`✅ Inserted ${insertedStates.length} states`);

    // Create a mapping of state names to IDs
    const stateMap = {};
    insertedStates.forEach(state => {
      stateMap[state.state_name] = state.id;
    });

    // Add state_id to districts and insert
    const districtsWithStateId = districts.map(district => ({
      district_name: district.district_name,
      state_id: stateMap[district.state_name]
    }));

    console.log("🏘️ Inserting districts...");
    const insertedDistricts = await db.insert(districtsMst).values(districtsWithStateId).returning();
    console.log(`✅ Inserted ${insertedDistricts.length} districts`);

    console.log("🎉 Seeding completed successfully!");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    if (error.message.includes("duplicate key value")) {
      console.log("ℹ️ Data may already exist in the database");
    }
  } finally {
    process.exit(0);
  }
}

seedStatesAndDistricts();