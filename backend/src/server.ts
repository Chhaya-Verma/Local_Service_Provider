import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import routes from "./routes";
import User from "./models/User";

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Create admin user if it doesn't exist
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE;

    // Check if admin credentials are set
    if (!adminEmail || !adminPassword || !adminPhone) {
      console.warn("⚠️  Admin credentials not set in .env file. Skipping admin creation.");
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const admin = new User({
        name: "Admin",
        email: adminEmail,
        password: adminPassword,
        phone: adminPhone,
        userType: "admin",
        isVerified: true,
      });
      await admin.save();
      console.log("✅ Admin user created successfully!");
      console.log("📧 Email:", adminEmail);
      console.log("🔐 Note: Password is hashed and stored securely");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

createAdminUser();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api", routes);

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Local Service Platform API Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
