import React, { useState } from "react";
import { createServer } from "../../services/api";
import "./InviteFriendsModal.css";


export default function CreateServerModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del servidor es obligatorio");
      return;
    }
    try {
      setLoading(true);
      await createServer({ name }); // 👈 solo mandamos el nombre
      setLoading(false);
      onClose();
      if (onCreated) onCreated();
    } catch (err) {
      setError("Error al crear servidor");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Crear nuevo servidor</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del servidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </button>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
