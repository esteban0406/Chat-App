import React from "react";
import { useServers } from "./useServers";
import "./EditServerModal.css";

export default function EditServerModal({ onClose, onSave }) {
  const { activeServer, removeMemberById } = useServers();

  const handleRemoveParticipant = async (memberId) => {
    try {
      await removeMemberById(activeServer._id, memberId);
      onSave(); // refrescar lista
    } catch (err) {
      console.error("Error al eliminar participante", err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Editar miembros de {activeServer?.name}</h3>
        <ul className="modal-member-list">
          {activeServer?.members.map((m) => (
            <li key={m._id} className="modal-member-item">
              <span>{m.username}</span>
              <button
                className="modal-remove-btn"
                onClick={() => handleRemoveParticipant(m._id)}
              >
                ❌ Eliminar
              </button>
            </li>
          ))}
        </ul>
        <button className="modal-close-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
