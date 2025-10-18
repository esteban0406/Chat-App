// src/features/voice/voiceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  channelId: null,
  muted: false,
  participants: [], // lista de usuarios conectados (opcional)
};

const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    joinVoice: (state, action) => {
      state.connected = true;
      state.channelId = action.payload.channelId;
      state.muted = false;
    },
    leaveVoice: (state) => {
      state.connected = false;
      state.channelId = null;
      state.muted = false;
      state.participants = [];
    },
    toggleMute: (state) => {
      state.muted = !state.muted;
    },
    setParticipants: (state, action) => {
      state.participants = action.payload;
    },
  },
});

export const { joinVoice, leaveVoice, toggleMute, setParticipants } = voiceSlice.actions;
export default voiceSlice.reducer;

// Selectors
export const selectVoiceState = (state) => state.voice;
export const selectVoiceConnected = (state) => state.voice.connected;
export const selectVoiceChannel = (state) => state.voice.channelId;
export const selectVoiceMuted = (state) => state.voice.muted;
export const selectVoiceParticipants = (state) => state.voice.participants;
