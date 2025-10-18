import React, { useState } from "react";
import { useServers } from "../useServers";

export default function CreateServerModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { createServer } = useServers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createServer({ name, description }).unwrap();
      onClose();
    } catch (err) {
      console.error("Error creando servidor:", err);
      alert("No se pudo crear el servidor ❌");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">Crear Servidor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del servidor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
