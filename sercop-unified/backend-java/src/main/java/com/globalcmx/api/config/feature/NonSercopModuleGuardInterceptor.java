package com.globalcmx.api.config.feature;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.Locale;

public class NonSercopModuleGuardInterceptor implements HandlerInterceptor {

    private final ModuleIsolationProperties properties;

    public NonSercopModuleGuardInterceptor(ModuleIsolationProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        if (!properties.isSercopMode() || properties.isNonSercopModulesEnabled()) {
            return true;
        }

        Class<?> beanType = handlerMethod.getBeanType();
        String controllerName = beanType.getSimpleName().toLowerCase(Locale.ROOT);
        List<String> blockedKeywords = properties.getBlockedControllerKeywords();
        boolean blocked = blockedKeywords.stream()
                .map(k -> k.toLowerCase(Locale.ROOT))
                .anyMatch(controllerName::contains);

        if (!blocked) {
            return true;
        }

        response.sendError(HttpServletResponse.SC_NOT_FOUND,
                "Endpoint disabled in default SERCOP mode (Phase-1 isolation)");
        return false;
    }
}
