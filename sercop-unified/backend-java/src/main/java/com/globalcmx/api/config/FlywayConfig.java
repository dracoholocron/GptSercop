package com.globalcmx.api.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Configuración de Flyway para manejar migraciones en múltiples bases de datos.
 * - EventStore (PostgreSQL): Migraciones para almacenamiento de eventos
 * - ReadModel (MySQL): Migraciones para modelos de lectura
 */
@Configuration
public class FlywayConfig {

    @Value("${spring.flyway.enabled:false}")
    private boolean flywayEnabled;

    /**
     * Flyway para Event Store (MySQL)
     * Ubicación de migraciones: db/migration/eventstore (vacío - Hibernate crea las tablas)
     * Las tablas del EventStore (event_store, snapshots) se crean automáticamente por Hibernate
     */
    @Bean
    public Flyway eventStoreFlyway(@Qualifier("eventStoreDataSource") DataSource dataSource) {
        if (!flywayEnabled) {
            return null;
        }
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration/eventstore")  // Carpeta vacía - no hay migraciones
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)
                .table("flyway_schema_history_eventstore")
                .load();

        // Repair schema history if needed
        try {
            flyway.repair();
        } catch (Exception e) {
            // Ignore repair errors
        }

        // Execute migration if enabled
        if (flywayEnabled) {
            flyway.migrate();
        }

        return flyway;
    }

    /**
     * Flyway para Read Model (MySQL)
     * Ubicación de migraciones: db/migration/mysql
     */
    @Bean
    public Flyway readModelFlyway(@Qualifier("readModelDataSource") DataSource dataSource) {
        if (!flywayEnabled) {
            return null;
        }
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration/mysql")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .validateOnMigrate(false)  // Disable validation to avoid checksum conflicts
                .placeholderReplacement(false)  // SQL contains {{template}} placeholders, not Flyway placeholders
                .table("flyway_schema_history_readmodel")
                .load();

        // Repair schema history if needed
        try {
            flyway.repair();
        } catch (Exception e) {
            // Ignore repair errors
        }

        // Execute migration if enabled
        if (flywayEnabled) {
            flyway.migrate();
        }

        return flyway;
    }

    /**
     * Estrategia para desactivar la migración automática de Spring Boot
     * y usar nuestras propias instancias de Flyway
     */
    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // No hacer nada - las migraciones se ejecutan en los beans configurados arriba
        };
    }
}
