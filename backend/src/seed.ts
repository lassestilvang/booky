import db from "./db";
import bcrypt from "bcrypt";

async function seed() {
  try {
    // Create or update a test user
    const hashedPassword = await bcrypt.hash("Password123!", 10);
    await db.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash",
      ["test@example.com", hashedPassword, "Test User"]
    );

    console.log("Seed data inserted/updated successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await db.end();
  }
}

seed();
