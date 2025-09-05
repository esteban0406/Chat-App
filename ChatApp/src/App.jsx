//import { useState } from 'react'
import "./App.css";

function App() {
  return (
    <>
      <div class="app">
        <aside class="sidebar">
          <h2>Users</h2>
          <ul class="user-list">
            <li>User 1</li>
            <li>User 2</li>
          </ul>
        </aside>

        <main class="chat-section">
          <div class="message-list">
            <div class="message">User1: Hello!</div>
            <div class="message">User2: Hey there!</div>
          </div>
          <form class="message-input">
            <input type="text" placeholder="Type a message..." />
            <button type="submit">Send</button>
          </form>
        </main>
      </div>
    </>
  );
}

export default App;
