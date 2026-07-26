package org.esteban_portafolio.Discol.auth.service;

import java.time.Instant;
import java.util.UUID;

import org.esteban_portafolio.Discol.auth.DTO.AuthResponse;
import org.esteban_portafolio.Discol.auth.DTO.LoginRequest;
import org.esteban_portafolio.Discol.auth.DTO.MessageResponse;
import org.esteban_portafolio.Discol.auth.DTO.RegisterRequest;
import org.esteban_portafolio.Discol.common.exception.ConflictException;
import org.esteban_portafolio.Discol.common.exception.NotFoundException;
import org.esteban_portafolio.Discol.common.exception.UnauthorizedException;
import org.esteban_portafolio.Discol.common.security.JwtProperties;
import org.esteban_portafolio.Discol.users.DTO.UserSummaryResponse;
import org.esteban_portafolio.Discol.users.Entity.User;
import org.esteban_portafolio.Discol.users.Repository.UserRepository;
import org.esteban_portafolio.Discol.users.Entity.UserStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtEncoder jwtEncoder,
        JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        userRepository.findByEmail(request.email())
            .ifPresent(existing -> { throw new ConflictException("Email already in use"); });
        userRepository.findByUsername(request.username())
            .ifPresent(existing -> { throw new ConflictException("Username already taken"); });

        User user = new User();
        user.setEmail(request.email());
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(UserStatus.ONLINE);
        user = userRepository.saveAndFlush(user);

        return new AuthResponse(UserSummaryResponse.from(user), issueToken(user));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new UnauthorizedException("Invalid email"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid password");
        }

        user.setStatus(UserStatus.ONLINE);
        user = userRepository.saveAndFlush(user);

        return new AuthResponse(UserSummaryResponse.from(user), issueToken(user));
    }

    @Transactional
    public MessageResponse logout(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        user.setStatus(UserStatus.OFFLINE);
        userRepository.save(user);
        return new MessageResponse("Logged out successfully");
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse me(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        return UserSummaryResponse.from(user);
    }

    private String issueToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuedAt(now)
            .expiresAt(now.plus(jwtProperties.expiration()))
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("username", user.getUsername())
            .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}