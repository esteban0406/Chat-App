import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServers } from "../useServers";

export default function CreateServerModal({ onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { createServer, setActive } = useServers();
  const navigate = useNavigate();

  const toId = (entity, fallbackIds = []) => {
    if (!entity) {
      return fallbackIds.find(Boolean) || null;
    }
    if (typeof entity === "string") return entity;
    const id =
      entity.id ??
      entity._id ??
      (typeof entity.toString === "function" ? entity.toString() : null);
    if (id) return id;
    if (Array.isArray(fallbackIds)) {
      return fallbackIds.find(Boolean) || null;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createServer({ name, description }).unwrap();
      const server = result?.server ?? result ?? null;
      const defaultChannel = result?.defaultChannel ?? null;

      if (server) {
        setActive(server);
        const serverId = toId(server);
        const fallbackChannelCandidates = Array.isArray(server?.channels)
          ? server.channels.map((channel) => toId(channel))
          : [];
        const channelId = toId(defaultChannel, fallbackChannelCandidates);

        if (serverId && channelId) {
          navigate(`/servers/${serverId}/channels/${channelId}`);
        } else if (serverId) {
          navigate(`/servers/${serverId}`);
        }
      }
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
