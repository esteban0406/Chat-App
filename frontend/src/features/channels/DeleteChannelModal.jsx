import { useChannels } from "./useChannels";
import { useState } from "react";

export default function DeleteChannelModal({ channel, onClose }) {
  const { deleteChannelById } = useChannels();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteChannelById(channel._id).unwrap();
      onClose();
    } catch (err) {
      console.error("Error eliminando canal:", err);
      alert("No se pudo eliminar el canal ❌");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-bold mb-4">Eliminar canal</h3>
        <p className="mb-4 text-gray-300">
          ¿Seguro que quieres eliminar el canal
          {" "}
          <span className="font-semibold">#{channel.name}</span>? Esta acción
          no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
