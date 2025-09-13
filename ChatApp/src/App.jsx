//import { useState } from "react";
import "./App.css";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ServerSidebar from "./components/ServerSidebar";

function App() {
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
