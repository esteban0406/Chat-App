import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const NODE_ENV = process.env.NODE_ENV || "development";

export const corsConfig = {
  origin: [
    "http://localhost:5173", // dev
    "https://your-frontend.onrender.com", // production frontend
  ],
  credentials: true,
};

