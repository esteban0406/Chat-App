import { useSelector, useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import {
  selectChannelsByServer,
  selectActiveChannel,
  setActiveChannel,
} from "./channelSlice";

export default function ChannelSidebar({ serverId }) {
  const dispatch = useDispatch();
  const { channelId } = useParams();
  const channels = useSelector((state) => selectChannelsByServer(state, serverId));
  const activeChannel = useSelector(selectActiveChannel);

  return (
    <aside className="w-60 bg-gray-800 p-3 flex flex-col border-r border-gray-700">
      <h2 className="text-gray-400 font-semibold mb-4 uppercase text-sm tracking-wide">
        Channels
      </h2>

      <nav className="space-y-1">
        {channels.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            No hay canales en este servidor
          </p>
        ) : (
          channels.map((ch) => (
            <Link
              key={ch._id}
              to={`/servers/${serverId}/channels/${ch._id}`}
              onClick={() => dispatch(setActiveChannel(ch))} // 👈 actualiza Redux
              className={`block px-3 py-2 rounded-md transition ${
                channelId === ch._id || activeChannel?._id === ch._id
                  ? "bg-gray-700 text-white font-semibold"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {ch.type === "voice" ? "🔊" : "#"} {ch.name}
            </Link>
          ))
        )}
      </nav>
    </aside>
  );
}
