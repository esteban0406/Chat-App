package org.esteban_portafolio.Discol.users.Repository;

import org.esteban_portafolio.Discol.users.Entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

}