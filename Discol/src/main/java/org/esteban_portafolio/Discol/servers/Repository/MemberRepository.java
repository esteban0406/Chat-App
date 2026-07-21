package org.esteban_portafolio.Discol.servers.Repository;

import org.esteban_portafolio.Discol.servers.Entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {

    Optional<Member> findByUser_IdAndServer_Id(UUID userId, UUID serverId);
}