import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends } from "./friendsSlice";
import "./FriendList.css";

export default function FriendList() {
  const dispatch = useDispatch();
  const { items: friends, loading, error } = useSelector((state) => state.friends);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  if (loading) return <p>Cargando amigos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="friend-list">
      <h3>Mis amigos</h3>
      {friends.length === 0 ? (
        <p>No tienes amigos todavía 😢</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend._id}>
              {friend.username} <span style={{ color: "gray" }}>({friend.email})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
