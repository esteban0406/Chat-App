import { useState } from "react";
import { useChannels } from "./useChannels";

export default function EditChannelModal({ channel, onClose }) {
  const [name, setName] = useState(channel?.name || "");
  const { updateChannelById } = useChannels();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      await updateChannelById({ channelId: channel._id, name: trimmedName }).unwrap();
      onClose();
    } catch (err) {
      console.error("Error actualizando canal:", err);
      alert("No se pudo actualizar el canal ❌");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-xl font-bold mb-4">Editar canal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nuevo nombre del canal"
            className="w-full px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 transition"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
