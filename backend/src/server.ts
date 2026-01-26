import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import routes from "./routes";

dotenv.config();

const app = express();

// Connect DB
connectDB();

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
