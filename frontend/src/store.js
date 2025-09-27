
import { configureStore } from "@reduxjs/toolkit";
import messagesReducer from "./features/messages/messagesSlice";
import authReducer from "./features/auth/authSlice";
import invitesReducer from "./features/invites/friendsSlice";
import serverReducer from "./features/servers/serverSlice";
import channelReducer from "./features/channels/channelSlice";
import friendsReducer from "./features/invites/friendsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    invites: invitesReducer,
    servers: serverReducer,
    friends: friendsReducer,
    channels: channelReducer,
  },
});

export default store;
