package org.esteban_portafolio.Discol.common.exception;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    List<String> messages,
    String path
) {

    public static ErrorResponse of(HttpStatus status, List<String> messages, String path) {
        return new ErrorResponse(Instant.now(), status.value(), status.getReasonPhrase(), messages, path);
    }
}