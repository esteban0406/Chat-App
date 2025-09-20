// src/features/voice/useVoiceChannel.js
import { useEffect, useRef } from "react";
import socket from "../../services/socket";

export default function useVoiceChannel(channelId) {
  const peerConnections = useRef({});
  const localStream = useRef(null);

  useEffect(() => {
    if (!channelId) return;

    const joinVoice = async () => {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      socket.emit("joinVoice", channelId);
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("candidate", handleCandidate);
    };

    joinVoice();

    return () => {
      socket.emit("leaveVoice", channelId);
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      socket.off("offer");
      socket.off("answer");
      socket.off("candidate");
    };
  }, [channelId]);

  const handleOffer = async ({ from, offer }) => {
    const pc = new RTCPeerConnection();
    peerConnections.current[from] = pc;

    localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));

    pc.ontrack = (event) => {
      const audio = document.createElement("audio");
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      document.body.appendChild(audio);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", { to: from, answer });
  };

  const handleAnswer = async ({ from, answer }) => {
    await peerConnections.current[from]?.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleCandidate = async ({ from, candidate }) => {
    try {
      await peerConnections.current[from]?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("Error adding ICE candidate", e);
    }
  };
}
