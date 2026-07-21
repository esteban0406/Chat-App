package org.esteban_portafolio.Discol.common.rbac;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.esteban_portafolio.Discol.common.exception.ForbiddenException;
import org.esteban_portafolio.Discol.common.exception.NotFoundException;
import org.esteban_portafolio.Discol.servers.Entity.Member;
import org.esteban_portafolio.Discol.servers.Entity.Role;
import org.esteban_portafolio.Discol.servers.Entity.Server;
import org.esteban_portafolio.Discol.servers.Entity.ServerPermission;
import org.esteban_portafolio.Discol.servers.Repository.MemberRepository;
import org.esteban_portafolio.Discol.servers.Repository.ServerRepository;
import org.esteban_portafolio.Discol.users.Entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerMapping;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServerPermissionInterceptorTest {

    @Mock
    private ServerRepository serverRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HandlerMethod handlerMethod;

    private ServerPermissionInterceptor interceptor;

    private final UUID userId = UUID.randomUUID();
    private final UUID serverId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        interceptor = new ServerPermissionInterceptor(serverRepository, memberRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(UUID id) {
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "HS256")
            .subject(id.toString())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    private Server serverOwnedBy(UUID ownerId) {
        User owner = new User();
        owner.setId(ownerId);
        Server server = new Server();
        server.setId(serverId);
        server.setOwner(owner);
        return server;
    }

    @Test
    void allowsWhenNoRequirePermissionAnnotation() {
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(null);

        boolean result = interceptor.preHandle(request, response, handlerMethod);

        assertThat(result).isTrue();
    }

    @Test
    void allowsWhenCallerIsServerOwner() {
        RequirePermission annotation = mock(RequirePermission.class);
        when(annotation.value()).thenReturn(ServerPermission.MANAGE_ROLES);
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(annotation);
        authenticateAs(userId);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
            .thenReturn(Map.of("serverId", serverId.toString()));
        when(serverRepository.findById(serverId)).thenReturn(Optional.of(serverOwnedBy(userId)));

        boolean result = interceptor.preHandle(request, response, handlerMethod);

        assertThat(result).isTrue();
    }

    @Test
    void throwsNotFoundWhenServerMissing() {
        RequirePermission annotation = mock(RequirePermission.class);
        when(annotation.value()).thenReturn(ServerPermission.MANAGE_ROLES);
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(annotation);
        authenticateAs(userId);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
            .thenReturn(Map.of("serverId", serverId.toString()));
        when(serverRepository.findById(serverId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handlerMethod))
            .isInstanceOf(NotFoundException.class)
            .hasMessage("Server not found");
    }

    @Test
    void throwsForbiddenWhenCallerIsNotAMember() {
        UUID ownerId = UUID.randomUUID();
        RequirePermission annotation = mock(RequirePermission.class);
        when(annotation.value()).thenReturn(ServerPermission.MANAGE_ROLES);
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(annotation);
        authenticateAs(userId);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
            .thenReturn(Map.of("serverId", serverId.toString()));
        when(serverRepository.findById(serverId)).thenReturn(Optional.of(serverOwnedBy(ownerId)));
        when(memberRepository.findByUser_IdAndServer_Id(userId, serverId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handlerMethod))
            .isInstanceOf(ForbiddenException.class)
            .hasMessage("You are not a member of this server");
    }

    @Test
    void throwsForbiddenWhenMemberLacksRequiredPermission() {
        UUID ownerId = UUID.randomUUID();
        RequirePermission annotation = mock(RequirePermission.class);
        when(annotation.value()).thenReturn(ServerPermission.MANAGE_ROLES);
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(annotation);
        authenticateAs(userId);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
            .thenReturn(Map.of("serverId", serverId.toString()));
        when(serverRepository.findById(serverId)).thenReturn(Optional.of(serverOwnedBy(ownerId)));

        Role role = new Role();
        role.setPermissions(java.util.Set.of(ServerPermission.CREATE_CHANNEL));
        Member member = new Member();
        member.setRole(role);
        when(memberRepository.findByUser_IdAndServer_Id(userId, serverId)).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> interceptor.preHandle(request, response, handlerMethod))
            .isInstanceOf(ForbiddenException.class)
            .hasMessage("You do not have permission to perform this action");
    }

    @Test
    void allowsWhenMemberHasRequiredPermission() {
        UUID ownerId = UUID.randomUUID();
        RequirePermission annotation = mock(RequirePermission.class);
        when(annotation.value()).thenReturn(ServerPermission.MANAGE_ROLES);
        when(handlerMethod.getMethodAnnotation(RequirePermission.class)).thenReturn(annotation);
        authenticateAs(userId);
        when(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE))
            .thenReturn(Map.of("serverId", serverId.toString()));
        when(serverRepository.findById(serverId)).thenReturn(Optional.of(serverOwnedBy(ownerId)));

        Role role = new Role();
        role.setPermissions(java.util.Set.of(ServerPermission.MANAGE_ROLES));
        Member member = new Member();
        member.setRole(role);
        when(memberRepository.findByUser_IdAndServer_Id(userId, serverId)).thenReturn(Optional.of(member));

        boolean result = interceptor.preHandle(request, response, handlerMethod);

        assertThat(result).isTrue();
    }
}
