import React, { useState } from "react";
import { createChannel } from "../../services/api";

export default function CreateChannelModal({ serverId, onClose, onChannelCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text"); // "text" o "voice"

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createChannel({ name, type, serverId });
      onChannelCreated(res.data); // notifica al padre
      onClose();
    } catch (err) {
      console.error("Error creando canal:", err);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Crear canal</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del canal"
            required
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="text">Texto</option>
            <option value="voice">Voz</option>
          </select>
          <div className="actions">
            <button type="submit">Crear</button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
