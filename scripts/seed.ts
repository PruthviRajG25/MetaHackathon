import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = "mongodb://pro:BcgekP8NmwIQ1dQu@ac-zlcha5q-shard-00-00.cquck9v.mongodb.net:27017,ac-zlcha5q-shard-00-01.cquck9v.mongodb.net:27017,ac-zlcha5q-shard-00-02.cquck9v.mongodb.net:27017/repeatless?ssl=true&replicaSet=atlas-1euset-shard-0&authSource=admin&appName=Cluster0";

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;
    if (!db) throw new Error("No DB handle");

    const usersColl = db.collection("users");
    const householdsColl = db.collection("households");
    const membersColl = db.collection("householdmembers");
    const inventoryColl = db.collection("inventoryitems");

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("DemoSecure123!", salt);

    const email = "demo@repeatless.ai";
    const user = await usersColl.findOne({ email });

    let userId: any;
    let householdId: any;

    if (!user) {
      const userRes = await usersColl.insertOne({
        name: "Pro Hacker",
        email,
        passwordHash,
        emailVerified: true,
        preferences: {
          currency: "USD",
          lowStockAlerts: true,
          autoRestockThresholdDays: 3,
          householdSize: 2,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = userRes.insertedId;
      console.log("Created demo user with ID:", userId);

      const houseRes = await householdsColl.insertOne({
        name: "Pro's Household",
        ownerId: userId,
        inviteCode: "PRO2026",
        settings: {
          defaultRestockDays: 3,
          defaultHouseholdSize: 2,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      householdId = houseRes.insertedId;

      await usersColl.updateOne({ _id: userId }, { $set: { householdId } });

      await membersColl.insertOne({
        householdId,
        userId,
        role: "owner",
        joinedAt: new Date(),
      });
    } else {
      userId = user._id;
      householdId = user.householdId;
      await usersColl.updateOne({ _id: userId }, { $set: { passwordHash } });
      console.log("Updated password for existing demo user:", userId);
    }

    // Seed inventory items if empty
    const count = await inventoryColl.countDocuments({ householdId });
    if (count === 0) {
      console.log("Seeding initial inventory items...");
      await inventoryColl.insertMany([
        {
          userId,
          householdId,
          name: "Whole Milk",
          brand: "Organic Valley",
          category: "Dairy",
          quantity: 1,
          unit: "litres",
          packageSize: "1 litre",
          minThreshold: 2,
          lastPurchasedDate: new Date(),
          purchasePrice: 4.89,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          householdId,
          name: "Basmati Rice",
          brand: "Royal",
          category: "Grains & Rice",
          quantity: 4,
          unit: "kg",
          packageSize: "5 kg",
          minThreshold: 2,
          lastPurchasedDate: new Date(Date.now() - 5 * 86400000),
          purchasePrice: 14.50,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          householdId,
          name: "Extra Virgin Olive Oil",
          brand: "Bertolli",
          category: "Cooking Essentials",
          quantity: 0.5,
          unit: "bottle",
          packageSize: "750 ml",
          minThreshold: 1,
          lastPurchasedDate: new Date(Date.now() - 10 * 86400000),
          purchasePrice: 12.99,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          householdId,
          name: "Organic Eggs",
          brand: "Vital Farms",
          category: "Dairy",
          quantity: 12,
          unit: "eggs",
          packageSize: "12 pack",
          minThreshold: 6,
          lastPurchasedDate: new Date(),
          purchasePrice: 5.49,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId,
          householdId,
          name: "Ground Coffee",
          brand: "Lavazza",
          category: "Beverages",
          quantity: 0,
          unit: "bag",
          packageSize: "250 g",
          minThreshold: 1,
          lastPurchasedDate: new Date(Date.now() - 14 * 86400000),
          purchasePrice: 8.99,
          source: "manual",
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]);
      console.log("Seeded 5 initial inventory items!");
    } else {
      console.log(`Inventory already has ${count} items.`);
    }

    console.log("SEEDING_COMPLETE_SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error("SEED_ERROR:", err);
    process.exit(1);
  }
}

seed();
