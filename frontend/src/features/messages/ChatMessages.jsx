import { useSelector } from "react-redux";
import useMessages from "./useMessages";

export default function ChatMessages({ channelId }) {
  const { messages, loading, error } = useMessages(channelId);
  const { user } = useSelector((state) => state.auth);

  if (loading) return <p className="p-4 text-gray-400">Cargando mensajes...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col space-y-3 p-4">

      {messages.map((msg) => {
        const isOwn = msg.sender?._id === user?.id;

        return (
          <div
            key={msg._id}
            className={`flex flex-col max-w-[70%] ${
              isOwn ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div
              className={`inline-block rounded-lg px-3 py-2 shadow-sm ${
                isOwn ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-200"
              }`}
            >
              <p className="text-sm break-words">
                {!isOwn && (
                  <span className="font-semibold text-indigo-400">
                    {msg.sender?.username || "?"}:{" "}
                  </span>
                )}
                {msg.text}
              </p>
            </div>
            <small className="text-xs text-gray-400 mt-1">
              {msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString()
                : ""}
            </small>
          </div>
        );
      })}
    </div>
  );
}
