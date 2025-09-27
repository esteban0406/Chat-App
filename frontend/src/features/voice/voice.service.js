import { API, request } from "../../services/api";

export const startVoiceCall = (channelId) =>
  request(API.post(`/voice/${channelId}/start`));

export const endVoiceCall = (channelId) =>
  request(API.post(`/voice/${channelId}/end`));
