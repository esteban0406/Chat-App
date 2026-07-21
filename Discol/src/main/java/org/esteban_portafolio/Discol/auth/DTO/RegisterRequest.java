package org.esteban_portafolio.Discol.auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 3, max = 32) String username,
    @NotBlank @Size(min = 6, max = 128) String password
) {
}