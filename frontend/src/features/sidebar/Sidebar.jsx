import React, { useState, useEffect } from "react";
import InviteForm from "../invites/InviteForm";
import InviteList from "../invites/InviteList";
import FriendList from "../invites/FriendList";
import ServerInviteList from "../servers/ServerInviteList";
import CreateServerModal from "../servers/CreateServerModal";
import ServerSection from "../servers/ServerSection";
import ChannelSection from "../channels/ChannelSection";
import { useServers } from "../servers/useServers";
import "./Sidebar.css";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState("servers");
  const [showCreateServer, setShowCreateServer] = useState(false);

  const { activeServer, loadServers } = useServers();

  useEffect(() => {
    if (activeTab === "servers") {
      loadServers();
    }
  }, [activeTab, loadServers]);

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
          <ServerSection onOpenCreateServer={() => setShowCreateServer(true)} />
          {activeServer && <ChannelSection />}
        </>
      ) : (
        <div className="friends-tab">
          <InviteForm />
          <InviteList />
          <ServerInviteList />
          <FriendList />
        </div>
      )}

      {showCreateServer && (
        <CreateServerModal onClose={() => setShowCreateServer(false)} />
      )}
    </div>
  );
}
