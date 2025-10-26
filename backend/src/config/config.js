import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const NODE_ENV = process.env.NODE_ENV || "development";

export const corsConfig = {
  origin: [
    "http://localhost:5173", // dev
    "https://chatapp-frontend-020n.onrender.com", // producción
  ],
  credentials: true,
};
