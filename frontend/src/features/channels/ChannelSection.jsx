import React, { useEffect, useState } from "react";
import { getChannels, deleteChannel } from "../../services/api";
import CreateChannelModal from "../channels/CreateChannelModal";
import InviteFriendsModal from "../servers/InviteFriendsModal";

export default function ChannelSection({
  channels,
  setChannels,
  activeServer,
  activeChannel,
  setActiveChannel,
  onSelectChannel,
}) {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);

  // 🔹 Cargar canales
  useEffect(() => {
    if (!activeServer) return;
    const fetchChannels = async () => {
      try {
        const res = await getChannels(activeServer._id);
        setChannels(res.data);

        if (res.data.length > 0) {
          setActiveChannel(res.data[0]);
          onSelectChannel(res.data[0]._id);
        }
      } catch (err) {
        console.error("Error cargando canales:", err);
      }
    };
    fetchChannels();
  }, [activeServer, setChannels, setActiveChannel, onSelectChannel]);

  const handleChannelClick = (channel) => {
    setActiveChannel(channel);
    onSelectChannel(channel);
  };

  return (
    <>
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Channels
        <div>
          <button
            style={{ marginLeft: "10px", cursor: "pointer" }}
            onClick={() => setShowCreateChannel(true)}
          >
            ➕
          </button>
          <button
            style={{ marginLeft: "5px", cursor: "pointer", color: "red" }}
            onClick={async () => {
              if (activeChannel) {
                if (
                  window.confirm(
                    `¿Seguro que deseas eliminar el canal #${activeChannel.name}?`
                  )
                ) {
                  try {
                    await deleteChannel(activeChannel._id);
                    setChannels(
                      channels.filter((ch) => ch._id !== activeChannel._id)
                    );
                    setActiveChannel(null);
                    onSelectChannel(null);
                  } catch (err) {
                    console.error("Error eliminando canal:", err);
                  }
                }
              } else {
                alert("Selecciona un canal para eliminar");
              }
            }}
          >
            ➖
          </button>
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

      {/* Botón para invitar amigos */}
      <button
        style={{
          marginTop: "10px",
          padding: "6px",
          width: "100%",
          background: "#7289da",
          border: "none",
          color: "white",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => setShowInviteFriends(true)}
      >
        Invitar amigos
      </button>

      {/* Modal Crear Canal */}
      {showCreateChannel && (
        <CreateChannelModal
          serverId={activeServer._id}
          onClose={() => setShowCreateChannel(false)}
          onChannelCreated={(newChannel) =>
            setChannels([...channels, newChannel])
          }
        />
      )}

      {/* Modal Invitar Amigos */}
      {showInviteFriends && (
        <InviteFriendsModal
          server={activeServer}
          onClose={() => setShowInviteFriends(false)}
        />
      )}
    </>
  );
}
