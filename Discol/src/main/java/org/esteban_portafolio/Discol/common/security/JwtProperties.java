package org.esteban_portafolio.Discol.common.security;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(String secret, Duration expiration) {

    public JwtProperties {
        if (expiration == null) {
            expiration = Duration.ofDays(7);
        }
    }
}