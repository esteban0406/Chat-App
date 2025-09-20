import React, { useEffect, useState } from "react";
import {
  getServers,
  getChannels,
  deleteChannel,
  deleteServer,
} from "../../services/api";
import InviteForm from "../invites/InviteForm";
import InviteList from "../invites/InviteList";
import FriendList from "../invites/FriendList";
import CreateServerModal from "../servers/CreateServerModal";
import CreateChannelModal from "../channels/CreateChannelModal";
import InviteFriendsModal from "../servers/InviteFriendsModal";
import ServerInviteList from "../servers/ServerInviteList";
import "./Sidebar.css";

export default function Sidebar({ onSelectChannel }) {
  const [activeTab, setActiveTab] = useState("servers");
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false); // 👈 nuevo estado

  // 🔹 Cargar servidores
  useEffect(() => {
    if (activeTab !== "servers") return;
    const fetchServers = async () => {
      try {
        const res = await getServers();
        setServers(res.data);
      } catch (err) {
        console.error("Error cargando servers:", err);
      }
    };
    fetchServers();
  }, [activeTab]);

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
  }, [activeServer, onSelectChannel]);

  const handleChannelClick = (channel) => {
    setActiveChannel(channel);
    onSelectChannel(channel);
  };

  return (
    <div className="sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={activeTab === "servers" ? "active" : ""}
          onClick={() => setActiveTab("servers")}
        >
          Servers
        </button>
        <button
          className={activeTab === "friends" ? "active" : ""}
          onClick={() => setActiveTab("friends")}
        >
          Amigos
        </button>
      </div>

      {activeTab === "servers" ? (
        <>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            Servers
            <div>
              <button
                style={{ marginLeft: "10px", cursor: "pointer" }}
                onClick={() => setShowCreateServer(true)}
              >
                ➕
              </button>
              {activeServer && (
                <button
                  style={{ marginLeft: "5px", cursor: "pointer", color: "red" }}
                  onClick={async () => {
                    if (
                      window.confirm(
                        `¿Seguro que quieres eliminar ${activeServer.name}?`
                      )
                    ) {
                      try {
                        await deleteServer(activeServer._id);
                        setServers(
                          servers.filter((s) => s._id !== activeServer._id)
                        );
                        setActiveServer(null);
                        setChannels([]);
                      } catch (err) {
                        console.error("Error eliminando servidor:", err);
                        alert("No se pudo eliminar el servidor ❌");
                      }
                    }
                  }}
                >
                  ➖
                </button>
              )}
            </div>
          </h2>

          <ul className="user-list">
            {servers.map((server) => (
              <li
                key={server._id}
                onClick={() => setActiveServer(server)}
                className={`server-item ${
                  activeServer?._id === server._id ? "active" : ""
                }`}
              >
                {server.name}
              </li>
            ))}
          </ul>

          {activeServer && (
            <>
              {/* Sección Channels */}
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
                    style={{
                      marginLeft: "5px",
                      cursor: "pointer",
                      color: "red",
                    }}
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
                              channels.filter(
                                (ch) => ch._id !== activeChannel._id
                              )
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
          )}
        </>
      ) : (
        <div className="friends-tab">
          <InviteForm />
          <InviteList />
          <ServerInviteList />
          <FriendList />
        </div>
      )}

      {/* Modal Crear Servidor */}
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onServerCreated={(newServer) => setServers([...servers, newServer])}
        />
      )}
    </div>
  );
}
