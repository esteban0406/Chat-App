package org.esteban_portafolio.Discol.auth.DTO;

import org.esteban_portafolio.Discol.users.DTO.UserSummaryResponse;

public record AuthResponse(UserSummaryResponse user, String accessToken) {
}