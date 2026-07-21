package org.esteban_portafolio.Discol.users.Repository;

import org.esteban_portafolio.Discol.users.Entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

}