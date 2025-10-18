import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VoiceControls from "../voice/VoiceControls";
import {
  selectActiveChannel,
  setActiveChannel,
  selectChannelsByServer,
} from "../channels/channelSlice";

export default function ChatSection() {
  const { serverId, channelId } = useParams();
  const dispatch = useDispatch();
  const activeChannel = useSelector(selectActiveChannel);
  const channels = useSelector((state) =>
    selectChannelsByServer(state, serverId)
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (channels.length > 0 && channelId) {
      const found = channels.find((c) => c._id === channelId);
      if (found) {
        dispatch(setActiveChannel(found));
      }
    }
  }, [channelId, channels, dispatch]);

  if (!activeChannel) {
    return (
      <p className="p-4 text-gray-400">
        Selecciona un canal 💬
      </p>
    );
  }

  const isVoice = activeChannel.type === "voice";

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          {isVoice ? "🔊" : "#"} {activeChannel.name}
        </h2>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {isVoice ? (
          <VoiceControls channel={activeChannel} user={user} />
        ) : (
          <ChatMessages channelId={activeChannel._id} />
        )}
      </div>

      {!isVoice && (
        <div className="border-t border-gray-700 p-3 bg-gray-800">
          <ChatInput />
        </div>
      )}
    </div>
  );
}
