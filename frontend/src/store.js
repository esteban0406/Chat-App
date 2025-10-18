import { configureStore } from "@reduxjs/toolkit";
import messagesReducer from "./features/messages/messagesSlice";
import authReducer from "./features/auth/authSlice";
import invitesReducer from "./features/servers/serverInvites/serverInvitesSlice.js";
import serverReducer from "./features/servers/serverSlice";
import channelReducer from "./features/channels/channelSlice";
import friendsReducer from "./features/invites/friendsSlice";
import friendInvitesReducer from "./features/invites/friendInvitesSlice";
import voiceReducer from "./features/voice/voiceSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    invites: invitesReducer,
    servers: serverReducer,
    friends: friendsReducer,
    friendInvites: friendInvitesReducer,
    channels: channelReducer,
    voice: voiceReducer,
  },
});

export default store;
