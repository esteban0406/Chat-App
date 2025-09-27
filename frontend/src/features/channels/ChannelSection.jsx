import React, { useEffect, useState } from "react";
import { useChannels } from "./useChannels";
import CreateChannelModal from "../channels/CreateChannelModal";
import InviteFriendsModal from "../servers/InviteFriendsModal";
import "./ChannelSection.css";

export default function ChannelSection({ onSelectChannel }) {
  const {
    channels,
    activeChannel,
    activeServer,
    loading,
    loadChannels,
    deleteChannelById,
    setActive,
  } = useChannels();

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);

  // ✅ Cargar canales cuando cambia el servidor activo
  useEffect(() => {
    if (activeServer) {
      loadChannels(activeServer._id);
    }
  }, [activeServer, loadChannels]);

  if (loading) return <p>Cargando canales...</p>;

  const handleChannelClick = (channel) => {
    setActive(channel);
  };

  const handleDeleteChannel = async () => {
    if (!activeChannel) return alert("Selecciona un canal para eliminar");
    if (
      window.confirm(
        `¿Seguro que deseas eliminar el canal #${activeChannel.name}?`
      )
    ) {
      try {
        await deleteChannelById(activeChannel._id).unwrap();
        onSelectChannel(null);
      } catch {
        alert("No se pudo eliminar el canal ❌");
      }
    }
  };

  return (
    <>
      <h2 style={{ display: "flex", justifyContent: "space-between" }}>
        Channels
        <div>
          <button onClick={() => setShowCreateChannel(true)}>➕</button>
          <button onClick={handleDeleteChannel}>➖</button>
        </div>
      </h2>

      <ul className="user-list">
        {channels.map((ch) => (
          <li
            key={ch._id}
            onClick={() => handleChannelClick(ch)}
            className={`channel-item ${
              activeChannel?._id === ch._id ? "active" : ""
            }`}
          >
            #{ch.name}
          </li>
        ))}
      </ul>

      <button
        style={{ marginTop: "10px" }}
        onClick={() => setShowInviteFriends(true)}
      >
        Invitar amigos
      </button>

      {showCreateChannel && (
        <CreateChannelModal
          serverId={activeServer._id}
          onClose={() => setShowCreateChannel(false)}
        />
      )}

      {showInviteFriends && (
        <InviteFriendsModal
          server={activeServer}
          onClose={() => setShowInviteFriends(false)}
        />
      )}
    </>
  );
}
