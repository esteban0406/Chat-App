package org.esteban_portafolio.Discol.servers.Repository;

import org.esteban_portafolio.Discol.servers.Entity.ServerInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ServerInviteRepository extends JpaRepository<ServerInvite, UUID> {

}