import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends } from "./friendsSlice";

export default function FriendList() {
  const dispatch = useDispatch();
  const { items: friends, loading, error } = useSelector((state) => state.friends);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  if (loading) return <p className="text-gray-400">Cargando amigos...</p>;
  if (error) return <p className="text-red-400">Error: {error}</p>;

  return (
    <div className="max-w-2xl w-full">
      {friends.length === 0 ? (
        <p className="text-gray-400">No tienes amigos todavía 😢</p>
      ) : (
        <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {friends
            .filter(Boolean)
            .map((friend) => {
              const key = friend.id || friend._id || friend.email || friend.username;
              return (
                <li
                  key={key}
                  className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 transition w-full"
                >
                  <span className="truncate mr-4">
                    <span className="font-semibold">{friend.username}</span>{" "}
                    <span className="text-gray-400 text-sm">({friend.email})</span>
                  </span>
                  <button className="text-sm text-red-400 hover:text-red-500 whitespace-nowrap">
                    Eliminar
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
