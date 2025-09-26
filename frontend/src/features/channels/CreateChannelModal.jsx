import React, { useState } from "react";
import { useChannels } from "./useChannels";
import "./CreateChannelModal.css";

export default function CreateChannelModal({ serverId, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  const { createChannel } = useChannels();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 👇 Aquí está la clave: pasamos un objeto PLANO { name, type, serverId }
      await createChannel({ name, type, serverId }).unwrap();
      onClose();
    } catch (err) {
      console.error("Error creando canal:", err);
      alert("No se pudo crear el canal ❌");
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
