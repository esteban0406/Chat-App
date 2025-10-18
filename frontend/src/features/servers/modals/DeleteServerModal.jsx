import React from "react";
import { useServers } from "../useServers";
import { useNavigate } from "react-router-dom";

export default function DeleteServerModal({ server, onClose }) {
  const { deleteServerById } = useServers();
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      await deleteServerById(server._id);
      onClose();
      navigate("/me"); // 👈 redirige a "me" tras eliminar
    } catch (err) {
      console.error("Error eliminando servidor:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Eliminar servidor</h3>
        <p className="mb-4 text-gray-300">
          ¿Seguro que quieres eliminar el servidor{" "}
          <span className="font-semibold">{server.name}</span>?  
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
