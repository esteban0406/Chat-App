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
    <div>
      {friends.length === 0 ? (
        <p className="text-gray-400">No tienes amigos todavía 😢</p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend._id}
              className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              <span>
                {friend.username}{" "}
                <span className="text-gray-400 text-sm">({friend.email})</span>
              </span>
              <button className="text-sm text-red-400 hover:text-red-500">
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
