package org.esteban_portafolio.Discol.common.security;

import java.util.List;

import org.esteban_portafolio.Discol.common.rbac.ServerPermissionInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SecurityWebMvcConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUserArgumentResolver;
    private final ServerPermissionInterceptor serverPermissionInterceptor;

    public SecurityWebMvcConfig(
        CurrentUserArgumentResolver currentUserArgumentResolver,
        ServerPermissionInterceptor serverPermissionInterceptor
    ) {
        this.currentUserArgumentResolver = currentUserArgumentResolver;
        this.serverPermissionInterceptor = serverPermissionInterceptor;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(serverPermissionInterceptor);
    }
}