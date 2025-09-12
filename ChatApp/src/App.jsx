//import { useState } from "react";
import "./App.css";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";

function App() {

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <h2>Users</h2>
          <ul className="user-list">
            <li>User 1</li>
            <li>User 2</li>
          </ul>
        </aside>

        <main className="chat-section">
          <ChatMessages className="message-list"/>
          <ChatInput className="message-input"/>
        </main>
      </div>
    </>
  );
}

export default App;
