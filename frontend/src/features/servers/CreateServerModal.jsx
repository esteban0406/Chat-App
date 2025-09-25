import React, { useState } from "react";
import { useServers } from "./useServers";
import "./InviteFriendsModal.css";

export default function CreateServerModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { createServer } = useServers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createServer({ name, description }).unwrap();
      onClose(); // cerramos modal si todo bien
    } catch (err) {
      console.error("Error creando servidor:", err);
      alert("No se pudo crear el servidor ❌");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Crear Servidor</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del servidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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
