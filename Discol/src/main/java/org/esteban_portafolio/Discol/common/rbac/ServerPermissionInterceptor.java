package org.esteban_portafolio.Discol.common.rbac;

import java.util.Map;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.esteban_portafolio.Discol.common.exception.ForbiddenException;
import org.esteban_portafolio.Discol.common.exception.NotFoundException;
import org.esteban_portafolio.Discol.common.exception.UnauthorizedException;
import org.esteban_portafolio.Discol.servers.Entity.Member;
import org.esteban_portafolio.Discol.servers.Entity.Role;
import org.esteban_portafolio.Discol.servers.Entity.Server;
import org.esteban_portafolio.Discol.servers.Entity.ServerPermission;
import org.esteban_portafolio.Discol.servers.Repository.MemberRepository;
import org.esteban_portafolio.Discol.servers.Repository.ServerRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

@Component
public class ServerPermissionInterceptor implements HandlerInterceptor {

    private final ServerRepository serverRepository;
    private final MemberRepository memberRepository;

    public ServerPermissionInterceptor(ServerRepository serverRepository, MemberRepository memberRepository) {
        this.serverRepository = serverRepository;
        this.memberRepository = memberRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequirePermission annotation = handlerMethod.getMethodAnnotation(RequirePermission.class);
        if (annotation == null) {
            return true;
        }
        ServerPermission required = annotation.value();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuth)) {
            throw new UnauthorizedException("Not authenticated");
        }
        UUID userId = UUID.fromString(jwtAuth.getToken().getSubject());

        @SuppressWarnings("unchecked")
        Map<String, String> pathVariables =
            (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        String serverIdRaw = pathVariables != null ? pathVariables.get("serverId") : null;
        if (serverIdRaw == null) {
            throw new IllegalStateException("@RequirePermission used on a handler without a {serverId} path variable");
        }
        UUID serverId = UUID.fromString(serverIdRaw);

        Server server = serverRepository.findById(serverId)
            .orElseThrow(() -> new NotFoundException("Server not found"));

        if (server.getOwner().getId().equals(userId)) {
            return true;
        }

        Member member = memberRepository.findByUser_IdAndServer_Id(userId, serverId)
            .orElseThrow(() -> new ForbiddenException("You are not a member of this server"));

        Role role = member.getRole();
        if (role == null || !role.getPermissions().contains(required)) {
            throw new ForbiddenException("You do not have permission to perform this action");
        }

        return true;
    }
}