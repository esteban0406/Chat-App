import { useDispatch, useSelector } from "react-redux";
import { joinVoiceChannel, leaveVoiceChannel, setMic } from "./voiceClient";
import {
  joinVoice,
  leaveVoice,
  toggleMute,
  selectVoiceState,
} from "./voiceSlice";

export default function VoiceControls({ channel, user }) {
  const dispatch = useDispatch();
  const { connected, channelId, muted } = useSelector(selectVoiceState);

  const handleJoin = async () => {
    try {
      await joinVoiceChannel(channel._id, user.username);
      dispatch(joinVoice({ channelId: channel._id }));
    } catch (err) {
      console.error("❌ Error uniéndose al canal de voz:", err);
    }
  };

  const handleLeave = () => {
    leaveVoiceChannel();
    dispatch(leaveVoice());
  };

  const handleToggleMute = async () => {
    const nextMuted = !muted;
    try {
      await setMic(!nextMuted);
      dispatch(toggleMute());
    } catch (err) {
      console.error("❌ Error cambiando estado del micrófono:", err);
    }
  };

  return (
    <div className="p-4 flex items-center gap-2">
      {!connected || channelId !== channel._id ? (
        <button
          onClick={handleJoin}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-500"
        >
          🎙️ Unirse a voz
        </button>
      ) : (
        <>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
          >
            ❌ Salir
          </button>
          <button
            onClick={handleToggleMute}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            {muted ? "🎤 Desmutear" : "🔇 Mutear"}
          </button>
        </>
      )}
    </div>
  );
}
