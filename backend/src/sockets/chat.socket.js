import Message from "../models/Message.js";

export default function registerChatHandlers(io, socket) {
  // Recibir mensaje
  socket.on("message", async (data) => {
    console.log("Mensaje recibido:", data);

    // Guardar en BD
    const msg = new Message(data);
    await msg.save();

    // Emitir a todos los clientes
    io.emit("message", msg);
  });

  // Usuario se desconecta
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
}
