package org.esteban_portafolio.Discol.common.security;

import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, String username) {
}