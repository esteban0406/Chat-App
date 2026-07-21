package org.esteban_portafolio.Discol.common.security;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final JsonAuthErrorWriter writer;

    public RestAuthenticationEntryPoint(JsonAuthErrorWriter writer) {
        this.writer = writer;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
        throws IOException {
        writer.write(response, HttpStatus.UNAUTHORIZED, request.getRequestURI(), "Invalid or missing authentication token");
    }
}