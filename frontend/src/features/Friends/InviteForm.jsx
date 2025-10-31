import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendFriendInvite } from "./friend.service";
import { searchUser } from "../user/user.service";
import { fetchFriends } from "./friendsSlice";

export default function InviteForm() {
  const [username, setUsername] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const dispatch = useDispatch();
  const { items: friends } = useSelector((state) => state.friends);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!friends || friends.length === 0) {
      dispatch(fetchFriends());
    }
  }, [dispatch, friends?.length]);

  const friendIdSet = new Set(
    (friends || []).map((friend) => friend.id || friend._id).filter(Boolean)
  );
  const friendEmailSet = new Set(
    (friends || []).map((friend) => friend.email?.toLowerCase()).filter(Boolean)
  );

  const handleSearch = async () => {
    const query = username.trim();
    if (!query) {
      setStatus("Ingresa un nombre de usuario");
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const users = await searchUser(query);

      const filtered = users.filter((user) => {
        const id = user.id || user._id;
        const email = user.email?.toLowerCase();
        if (currentUser) {
          const currentId = currentUser.id || currentUser._id;
          const currentEmail = currentUser.email?.toLowerCase();
          if (id && currentId && id === currentId) return false;
          if (email && currentEmail && email === currentEmail) return false;
        }
        if (id && friendIdSet.has(id)) return false;
        if (email && friendEmailSet.has(email)) return false;
        return true;
      });

      if (filtered.length === 0) {
        setStatus("No se encontraron usuarios disponibles ❌");
      } else {
        setStatus("");
      }

      setResults(filtered);
    } catch (err) {
      setResults([]);
      if (err.response?.status === 404) {
        setStatus("Usuario no encontrado ❌");
      } else if (err.response?.data?.message) {
        setStatus(`${err.response.data.message} ❌`);
      } else {
        setStatus("Error en la búsqueda ❌");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (user) => {
    if (!user) return;

    const userId = user.id || user._id;
    if (!userId) return;

    setSendingId(userId);
    try {
      await sendFriendInvite({ to: userId });
      setStatus(`Invitación enviada a ${user.username} ✅`);
      setResults((prev) =>
        prev.filter((item) => (item.id || item._id) !== userId)
      );
    } catch (err) {
      console.error(err);
      setStatus("Error al enviar invitación ❌");
    } finally {
      setSendingId(null);
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded disabled:opacity-60"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((user) => (
            <li
              key={user.id || user._id}
              className="bg-gray-700 p-3 rounded flex items-center justify-between"
            >
              <span className="truncate">
                {user.username} <span className="text-sm text-gray-400">({user.email})</span>
              </span>
              <button
                onClick={() => handleInvite(user)}
                disabled={sendingId === (user.id || user._id)}
                className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm disabled:opacity-60"
              >
                {sendingId === (user.id || user._id) ? "Enviando..." : "Enviar invitación"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {status && <p className="text-sm text-gray-300 mt-2">{status}</p>}
    </div>
  );
}
