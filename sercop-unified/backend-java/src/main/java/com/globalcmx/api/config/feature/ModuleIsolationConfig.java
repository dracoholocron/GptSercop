package com.globalcmx.api.config.feature;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(ModuleIsolationProperties.class)
public class ModuleIsolationConfig implements WebMvcConfigurer {

    private final ModuleIsolationProperties properties;

    public ModuleIsolationConfig(ModuleIsolationProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new NonSercopModuleGuardInterceptor(properties));
    }
}
