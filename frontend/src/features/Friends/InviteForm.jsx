import React, { useState } from "react";
import { sendFriendInvite } from "./friend.service";
import { searchUser } from "../user/user.service";

export default function InviteForm() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    try {
      const res = await searchUser(username);
      setResult(res);
      setStatus("");
    } catch (err) {
      setResult(null);
      if (err.response?.status === 404) {
        setStatus("Usuario no encontrado ❌");
      } else {
        setStatus("Error en la búsqueda ❌");
      }
    }
  };

  const handleInvite = async () => {
    try {
      await sendFriendInvite({ to: result._id });
      setStatus("Invitación enviada ✅");
    } catch (err) {
      setStatus("Error al enviar invitación ❌", console.error(err));
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-md shadow-md w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3">Buscar usuario</h3>
      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de usuario"
          className="flex-1 p-2 rounded bg-gray-700 text-white outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded"
        >
          Buscar
        </button>
      </div>

      {result && (
        <div className="bg-gray-700 p-3 rounded flex items-center justify-between">
          <span>Encontrado: {result.username}</span>
          <button
            onClick={handleInvite}
            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
          >
            Enviar invitación
          </button>
        </div>
      )}

      {status && <p className="text-sm text-gray-300 mt-2">{status}</p>}
    </div>
  );
}
