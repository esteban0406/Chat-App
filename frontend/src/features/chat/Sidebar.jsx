import React, { useEffect, useState } from "react";
import { getServers, getChannels } from "../../services/api";
import InviteForm from "../invites/InviteForm";
import InviteList from "../invites/InviteList";
import FriendList from "../invites/FriendList";
import CreateServerModal from "../servers/CreateServerModal";
import InviteFriendsModal from "../servers/InviteFriendsModal";

export default function Sidebar({ onSelectChannel }) {
  const [activeTab, setActiveTab] = useState("servers");
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);

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
    onSelectChannel(channel._id);
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
          <h2>
            Servers{" "}
            <button onClick={() => setShowCreateServer(true)}>➕</button>
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
                {activeServer?._id === server._id && (
                  <button
                    className="invite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInviteFriends(true);
                    }}
                  >
                    ➕
                  </button>
                )}
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
                    className={`channel-item ${
                      activeChannel?._id === ch._id ? "active" : ""
                    }`}
                  >
                    #{ch.name}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <div className="friends-tab">
          <InviteForm />
          <InviteList />
          <FriendList />
        </div>
      )}

      {showCreateServer && (
        <CreateServerModal onClose={() => setShowCreateServer(false)} />
      )}

      {showInviteFriends && activeServer && (
        <InviteFriendsModal
          server={activeServer}
          onClose={() => setShowInviteFriends(false)}
        />
      )}
    </div>
  );
}
