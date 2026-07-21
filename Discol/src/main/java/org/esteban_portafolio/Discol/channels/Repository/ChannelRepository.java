package org.esteban_portafolio.Discol.channels.Repository;

import org.esteban_portafolio.Discol.channels.Entity.Channel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, UUID> {

}