package com.globalcmx.api.config;

import lombok.extern.slf4j.Slf4j;
import org.drools.compiler.kie.builder.impl.KieFileSystemImpl;
import org.kie.api.KieServices;
import org.kie.api.builder.KieBuilder;
import org.kie.api.builder.KieFileSystem;
import org.kie.api.builder.KieRepository;
import org.kie.api.builder.Message;
import org.kie.api.runtime.KieContainer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Configuración de Drools para evaluación de reglas DRL
 * Compatible con Drools 8.44.0.Final y Java 17+
 */
@Configuration
@Slf4j
public class DroolsConfig {

    /**
     * Bean de KieServices - Punto de entrada principal para la API de Drools
     * KieServices proporciona acceso a todos los servicios de Drools
     */
    @Bean
    public KieServices kieServices() {
        log.info("Inicializando KieServices para Drools 8.x");
        return KieServices.Factory.get();
    }

    /**
     * Bean de KieFileSystem - Sistema de archivos virtual para almacenar recursos de reglas
     * Permite agregar reglas DRL dinámicamente en memoria
     */
    @Bean
    public KieFileSystem kieFileSystem(KieServices kieServices) {
        log.info("Inicializando KieFileSystem para compilación dinámica de reglas");
        return kieServices.newKieFileSystem();
    }

    /**
     * Bean de KieContainer - Contenedor base para gestión de reglas
     * Este contenedor se usa como base, pero se crearán contenedores específicos
     * para cada regla en tiempo de ejecución
     */
    @Bean
    public KieContainer kieContainer(KieServices kieServices, KieFileSystem kieFileSystem) {
        log.info("Inicializando KieContainer base");

        KieRepository kieRepository = kieServices.getRepository();

        // Cargar archivos DRL de validación desde resources/rules/
        try {
            org.springframework.core.io.Resource[] resources = new org.springframework.core.io.support.PathMatchingResourcePatternResolver()
                    .getResources("classpath*:rules/*.drl");

            for (org.springframework.core.io.Resource resource : resources) {
                String filename = resource.getFilename();
                String content = new String(resource.getInputStream().readAllBytes());
                String path = "src/main/resources/rules/" + filename;
                kieFileSystem.write(path, content);
                log.info("Cargado archivo de reglas: {}", filename);
            }
        } catch (Exception e) {
            log.warn("No se pudieron cargar archivos DRL de validación: {}", e.getMessage());
        }

        // Compilar el KieFileSystem
        KieBuilder kieBuilder = kieServices.newKieBuilder(kieFileSystem);
        kieBuilder.buildAll();

        // Verificar si hay errores de compilación
        if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
            List<String> errors = kieBuilder.getResults()
                .getMessages(Message.Level.ERROR)
                .stream()
                .map(Message::getText)
                .collect(Collectors.toList());

            log.error("Errores al inicializar KieContainer: {}", errors);
            throw new RuntimeException("Error al compilar reglas base: " + errors);
        }

        log.info("KieContainer base inicializado correctamente");
        return kieServices.newKieContainer(kieRepository.getDefaultReleaseId());
    }

    /**
     * Compila una regla DRL y retorna un KieContainer específico para esa regla
     * Este método es thread-safe y puede ser llamado múltiples veces
     *
     * @param kieServices El servicio de Kie
     * @param drlContent Contenido de la regla DRL
     * @param ruleName Nombre único para identificar la regla
     * @return KieContainer con la regla compilada
     * @throws RuntimeException si hay errores de compilación
     */
    public KieContainer compileRule(KieServices kieServices, String drlContent, String ruleName) {
        log.debug("Compilando regla DRL: {}", ruleName);

        // Crear un nuevo KieFileSystem para esta regla específica
        KieFileSystem kfs = kieServices.newKieFileSystem();

        // Agregar la regla al KieFileSystem con una ruta única
        String resourcePath = "src/main/resources/rules/" + ruleName + ".drl";
        kfs.write(resourcePath, drlContent);

        // Compilar la regla
        KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
        kieBuilder.buildAll();

        // Verificar errores de compilación
        if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
            List<String> errors = kieBuilder.getResults()
                .getMessages(Message.Level.ERROR)
                .stream()
                .map(Message::getText)
                .collect(Collectors.toList());

            log.error("Errores al compilar regla '{}': {}", ruleName, errors);
            throw new RuntimeException("Error al compilar regla DRL: " + String.join("; ", errors));
        }

        // Obtener warnings si existen
        if (kieBuilder.getResults().hasMessages(Message.Level.WARNING)) {
            List<String> warnings = kieBuilder.getResults()
                .getMessages(Message.Level.WARNING)
                .stream()
                .map(Message::getText)
                .collect(Collectors.toList());

            log.warn("Warnings al compilar regla '{}': {}", ruleName, warnings);
        }

        log.debug("Regla '{}' compilada exitosamente", ruleName);

        // Crear y retornar el KieContainer con la regla compilada
        return kieServices.newKieContainer(
            kieServices.getRepository().getDefaultReleaseId()
        );
    }

    /**
     * Valida la sintaxis de una regla DRL sin crear un KieContainer
     *
     * @param kieServices El servicio de Kie
     * @param drlContent Contenido de la regla DRL
     * @return Lista de errores (vacía si no hay errores)
     */
    public List<String> validateDrlSyntax(KieServices kieServices, String drlContent) {
        log.debug("Validando sintaxis DRL");

        try {
            // Crear un KieFileSystem temporal
            KieFileSystem kfs = kieServices.newKieFileSystem();

            // Agregar la regla con un nombre temporal
            String resourcePath = "src/main/resources/rules/validation-temp.drl";
            kfs.write(resourcePath, drlContent);

            // Compilar para validar
            KieBuilder kieBuilder = kieServices.newKieBuilder(kfs);
            kieBuilder.buildAll();

            // Retornar errores si existen
            if (kieBuilder.getResults().hasMessages(Message.Level.ERROR)) {
                return kieBuilder.getResults()
                    .getMessages(Message.Level.ERROR)
                    .stream()
                    .map(Message::getText)
                    .collect(Collectors.toList());
            }

            log.debug("Sintaxis DRL válida");
            return List.of(); // Sin errores

        } catch (Exception e) {
            log.error("Error al validar sintaxis DRL: {}", e.getMessage());
            return List.of("Error al validar DRL: " + e.getMessage());
        }
    }
}
