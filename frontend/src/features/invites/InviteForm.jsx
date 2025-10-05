import React, { useState } from "react";
import { sendFriendInvite } from "./friend.service";
import { searchUser } from "../user/user.service";
import "./InviteForm.css";

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
    <div className="invite-form">
      <h3>Buscar usuario</h3>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Nombre de usuario"
      />
      <button onClick={handleSearch}>Buscar</button>

      {result && (
        <div className="user-result">
          <p>Encontrado: {result.username}</p>
          <button onClick={handleInvite}>Enviar invitación</button>
        </div>
      )}

      {status && <p>{status}</p>}
    </div>
  );
}
