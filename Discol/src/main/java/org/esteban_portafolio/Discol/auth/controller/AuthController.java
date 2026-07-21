package org.esteban_portafolio.Discol.auth.controller;

import org.esteban_portafolio.Discol.auth.DTO.AuthResponse;
import org.esteban_portafolio.Discol.auth.DTO.LoginRequest;
import org.esteban_portafolio.Discol.auth.DTO.MessageResponse;
import org.esteban_portafolio.Discol.auth.DTO.RegisterRequest;
import org.esteban_portafolio.Discol.auth.service.AuthService;
import org.esteban_portafolio.Discol.common.security.AuthenticatedUser;
import org.esteban_portafolio.Discol.common.security.CurrentUser;
import org.esteban_portafolio.Discol.users.DTO.UserSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public MessageResponse logout(@CurrentUser AuthenticatedUser user) {
        return authService.logout(user.id());
    }

    @GetMapping("/me")
    public UserSummaryResponse me(@CurrentUser AuthenticatedUser user) {
        return authService.me(user.id());
    }
}