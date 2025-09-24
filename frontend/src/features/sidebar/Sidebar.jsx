import React, { useState } from "react";
import InviteForm from "../invites/InviteForm";
import InviteList from "../invites/InviteList";
import FriendList from "../invites/FriendList";
import ServerInviteList from "../servers/ServerInviteList";
import CreateServerModal from "../servers/CreateServerModal";
import ServerSection from "../servers/ServerSection";
import ChannelSection from "../channels/ChannelSection";
import { useServers } from "../../hooks/useServers";
import { useChannels } from "../../hooks/useChannels";
import "./Sidebar.css";

export default function Sidebar({ onSelectChannel }) {
  const [activeTab, setActiveTab] = useState("servers");
  const [showCreateServer, setShowCreateServer] = useState(false);

  const {
    servers,
    setServers,
    activeServer,
    setActiveServer,
    removeServer,
  } = useServers(activeTab);

  const {
    channels,
    setChannels,
    activeChannel,
    setActiveChannel,
    removeChannel,
  } = useChannels(activeServer, onSelectChannel);

  return (
    <div className="sidebar-content">
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
          {/* Sección de servidores */}
          <ServerSection
            servers={servers}
            setServers={setServers}
            activeServer={activeServer}
            setActiveServer={setActiveServer}
            removeServer={removeServer}
            setChannels={setChannels}
            setActiveChannel={setActiveChannel}
            onOpenCreateServer={() => setShowCreateServer(true)}
          />

          {/* Sección de canales */}
          {activeServer && (
            <ChannelSection
              channels={channels}
              setChannels={setChannels}
              activeServer={activeServer}
              activeChannel={activeChannel}
              setActiveChannel={setActiveChannel}
              removeChannel={removeChannel}
              onSelectChannel={onSelectChannel}
            />
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
