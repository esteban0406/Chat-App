import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useOutletContext, useParams } from "react-router-dom";
import {
  Bars3Icon,
  HashtagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import VoiceControls from "../voice/VoiceControls";
import {
  selectActiveChannel,
  setActiveChannel,
  selectChannelsByServer,
  setPreferredChannelId,
} from "../channels/channelSlice";

export default function ChatSection() {
  const { serverId, channelId } = useParams();
  const dispatch = useDispatch();
  const layoutContext = useOutletContext() ?? {};
  const {
    openServerDrawer = () => {},
    openSectionSidebar = () => {},
    openProfileDrawer = () => {},
  } = layoutContext;
  const activeChannel = useSelector(selectActiveChannel);
  const channels = useSelector((state) =>
    selectChannelsByServer(state, serverId)
  );
  const { user } = useSelector((state) => state.auth);
  const activeChannelId = activeChannel?._id;

  useEffect(() => {
    dispatch(setPreferredChannelId(channelId || null));
  }, [channelId, dispatch]);

  useEffect(() => {
    if (channels.length > 0 && channelId) {
      const found = channels.find((c) => c._id === channelId);
      if (found && activeChannelId !== found._id) {
        dispatch(setActiveChannel(found));
      }
    }
  }, [channelId, channels, activeChannelId, dispatch]);

  if (!activeChannel) {
    return (
      <p className="p-4 text-gray-400">
        Selecciona un canal 💬
      </p>
    );
  }

  const isVoice = activeChannel.type === "voice";

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openServerDrawer}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
            aria-label="Abrir servidores"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span>{isVoice ? "🔊" : "#"}</span>
            <span className="truncate">{activeChannel.name}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openSectionSidebar}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Abrir canales"
          >
            <HashtagIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={openProfileDrawer}
            className="rounded-md p-2 text-gray-400 transition hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Abrir perfil"
          >
            <UserCircleIcon className="h-5 w-5" />
          </button>
        </div>
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
        <div className="border-t border-gray-700 bg-gray-800 px-3 py-3">
          <ChatInput className="min-h-[48px]" />
        </div>
      )}
    </div>
  );
}
