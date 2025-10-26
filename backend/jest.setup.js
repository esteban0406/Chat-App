import dotenv from "dotenv";

// Fuerza NODE_ENV=test
process.env.NODE_ENV = "test";

// Carga el archivo .env.test
dotenv.config({ path: ".env.test" });
