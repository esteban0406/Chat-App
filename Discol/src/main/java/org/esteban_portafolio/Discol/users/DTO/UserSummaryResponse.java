package org.esteban_portafolio.Discol.users.DTO;

import java.time.Instant;
import java.util.UUID;

import org.esteban_portafolio.Discol.users.Entity.User;
import org.esteban_portafolio.Discol.users.Entity.UserStatus;

public record UserSummaryResponse(
    UUID id,
    String email,
    String username,
    String avatarUrl,
    UserStatus status,
    Instant createdAt,
    Instant updatedAt
) {

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.getAvatarUrl(),
            user.getStatus(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}