import React, { useEffect, useState } from "react";
import { getFriends } from "./invite.service";

export default function FriendList() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriends();
        setFriends(res.data);
      } catch (err) {
        console.error("Error cargando amigos:", err);
      }
    };
    fetchFriends();
  }, []);

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
