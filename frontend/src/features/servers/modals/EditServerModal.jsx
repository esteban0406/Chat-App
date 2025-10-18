import React from "react";
import { useServers } from "../useServers";

export default function EditServerModal({ onClose, onSave }) {
  const { activeServer, removeMemberById } = useServers();

  const handleRemoveParticipant = async (memberId) => {
    try {
      await removeMemberById(activeServer._id, memberId);
      onSave?.(); 
    } catch (err) {
      console.error("Error al eliminar participante", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">
          Editar miembros de {activeServer?.name}
        </h3>
        <ul className="space-y-2 mb-4">
          {activeServer?.members.map((m) => (
            <li
              key={m._id}
              className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded"
            >
              <span>{m.username}</span>
              <button
                onClick={() => handleRemoveParticipant(m._id)}
                className="text-red-400 hover:text-red-600"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded w-full"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
