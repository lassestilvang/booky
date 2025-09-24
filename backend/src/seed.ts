import db from "./db";
// Note: Add bcrypt to dependencies: npm install bcrypt @types/bcrypt
// import bcrypt from "bcrypt";

async function seed() {
  try {
    // Create a test user
    // const hashedPassword = await bcrypt.hash("password123", 10);
    const hashedPassword = "password123"; // Plain for demo, use bcrypt in production
    await db.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
      ["test@example.com", hashedPassword, "Test User"]
    );

    // Create a test collection
    const userResult = await db.query("SELECT id FROM users WHERE email = $1", [
      "test@example.com",
    ]);
    const userId = userResult.rows[0].id;

    await db.query(
      "INSERT INTO collections (owner_id, title, is_public) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [userId, "My Bookmarks", true]
    );

    console.log("Seed data inserted successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    await db.end();
  }
}

seed();
