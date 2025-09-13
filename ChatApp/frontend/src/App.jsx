//import { useState } from "react";
import "./App.css";
import React, { useEffect } from "react";
import ChatMessages from "./features/messages/ChatMessages";
import ChatInput from "./features/chat/ChatInput";
import ServerSidebar from "./features/chat/Sidebar";
import socket from "./services/socket";

import { useDispatch } from "react-redux";
import { addMessage } from "./reducers/addMessageReducer";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on("message", (msg) => {
      dispatch(addMessage(msg));
    });

    // cleanup al desmontar
    return () => {
      socket.off("message");
    };
  }, [dispatch]);

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <ServerSidebar />
        </aside>

        <main className="chat-section">
          <ChatMessages className="message-list" />
          <ChatInput className="message-input" />
        </main>
      </div>
    </>
  );
}

export default App;
