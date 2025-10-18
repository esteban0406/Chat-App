// src/services/voiceUI.js
export function addAudioEl(userId, mediaStreamTrack) {
  let audioEl = document.getElementById(`audio-${userId}`);
  if (!audioEl) {
    audioEl = document.createElement("audio");
    audioEl.id = `audio-${userId}`;
    document.body.appendChild(audioEl);
  }
  audioEl.srcObject = new MediaStream([mediaStreamTrack]);
  audioEl.autoplay = true;
  audioEl.play().catch((err) =>
    console.warn("⚠️ Error al reproducir audio remoto:", err)
  );
}

export function removeAudioEl(userId) {
  const audioEl = document.getElementById(`audio-${userId}`);
  if (audioEl) audioEl.remove();
}
