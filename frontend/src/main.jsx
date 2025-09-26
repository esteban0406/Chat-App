import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import messagesReducer from "./features/messages/messagesSlice.js";
import authReducer from "./features/auth/authSlice.js";
import invitesReducer from "./features/invites/invitesSlice.js";
import serverReducer from "./features/servers/serverSlice.js";
import channelReducer from "./features/channels/channelSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    invites: invitesReducer,
    servers: serverReducer,
    channels: channelReducer,
  },
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <App />
    </StrictMode>
  </Provider>
);
