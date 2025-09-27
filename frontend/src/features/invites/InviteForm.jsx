import React, { useState } from "react";
import { sendFriendInvite } from "./invite.service";
import { searchUser } from "../user/user.service";
import "./invites.css";


export default function InviteForm() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    try {
      const res = await searchUser(username);
      setResult(res.data);
      setStatus("");
    } catch (err) {
      setStatus("Usuario no encontrado");
    }
  };

  const handleInvite = async () => {
    try {
      await sendFriendInvite({ to: result._id }); // ✅ solo enviamos el destinatario
      setStatus("Invitación enviada ✅");
    } catch (err) {
      setStatus("Error al enviar invitación ❌");
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
