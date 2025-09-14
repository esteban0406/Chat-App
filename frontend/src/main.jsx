import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//import "./index.css";
import App from "./App.jsx";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import messagesReducer from "./features/messages/messagesSlice.js";
import authReducer from "./features/auth/authSlice.js";
import invitesReducer from "./features/invites/invitesSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    invites: invitesReducer,
  },
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <App />
    </StrictMode>
  </Provider>
);
