import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

export const PORT = process.env.PORT || 4000;
export const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI:", MONGODB_URI);
export const NODE_ENV = process.env.NODE_ENV || "development";

export const corsConfig = {
  origin: [
    "http://localhost:5173",
    "https://chatapp-frontend-020n.onrender.com",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

