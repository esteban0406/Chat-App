import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";

import registerChatHandlers from "./sockets/chat.socket.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend
    methods: ["GET", "POST"],
  },
});

const MONGODB_URI = process.env.MONGODB_URI;

console.log("connecting to", MONGODB_URI);

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar DB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

// Rutas simples
app.get("/", (req, res) => res.send("API funcionando 🚀"));

// Sockets
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);
  registerChatHandlers(io, socket);
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
