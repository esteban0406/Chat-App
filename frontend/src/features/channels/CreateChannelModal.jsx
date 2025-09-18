import React, { useState } from "react";
import { createChannel } from "../../services/api";
import "./CreateChannelModal.css"

export default function CreateChannelModal({ serverId, onClose, onChannelCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createChannel({ name, type, serverId });
      onChannelCreated(res.data);
      onClose();
    } catch (err) {
      console.error("Error creando canal:", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Crear Canal</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del canal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="text">Texto</option>
            <option value="voice">Voz</option>
          </select>
          <div className="modal-actions">
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
