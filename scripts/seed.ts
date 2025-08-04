import { seedTestData } from "../server/seed-data";

async function run() {
  console.log("Seeding test data...");
  const result = await seedTestData();
  if (result.success) {
    console.log("✅ Test data seeded successfully!");
  } else {
    console.error("❌ Failed to seed test data:", result.error);
  }
  process.exit(result.success ? 0 : 1);
}

run().catch(console.error);