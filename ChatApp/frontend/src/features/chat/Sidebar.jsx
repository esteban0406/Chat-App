import React, { useEffect, useState } from "react";
import { getServers, getChannels } from "../../services/api";

export default function Sidebar({ onSelectChannel }) {
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);

  // 🔹 Cargar servidores cuando se monta
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await getServers();
        setServers(res.data);
      } catch (err) {
        console.error("Error cargando servers:", err);
      }
    };
    fetchServers();
  }, []);

  // 🔹 Cargar canales cuando cambia de server
  useEffect(() => {
    if (!activeServer) return;
    const fetchChannels = async () => {
      try {
        const res = await getChannels(activeServer._id);
        setChannels(res.data);
      } catch (err) {
        console.error("Error cargando canales:", err);
      }
    };
    fetchChannels();
  }, [activeServer]);

  const handleChannelClick = (channel) => {
    setActiveChannel(channel);
    onSelectChannel(channel._id); // avisamos al ChatRoom
  };

  return (
    <div>
      <h2>Servers</h2>
      <ul className="user-list">
        {servers.map((server) => (
          <li
            key={server._id}
            onClick={() => setActiveServer(server)}
            style={{
              backgroundColor: activeServer?._id === server._id ? "#3a3f45" : "transparent",
              cursor: "pointer",
            }}
          >
            {server.name}
          </li>
        ))}
      </ul>

      {activeServer && (
        <>
          <h2>Channels</h2>
          <ul className="user-list">
            {channels.map((ch) => (
              <li
                key={ch._id}
                onClick={() => handleChannelClick(ch)}
                style={{
                  backgroundColor: activeChannel?._id === ch._id ? "#40444b" : "transparent",
                  cursor: "pointer",
                }}
              >
                #{ch.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
