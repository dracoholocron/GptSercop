package com.globalcmx.api.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.globalcmx.api.eventsourcing.repository",
        entityManagerFactoryRef = "eventStoreEntityManagerFactory",
        transactionManagerRef = "eventStoreTransactionManager"
)
public class DataSourceConfig {

    // ========================================
    // Event Store DataSource (MySQL)
    // ========================================

    @Primary
    @Bean(name = "eventStoreDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.eventstore")
    public DataSource eventStoreDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean(name = "eventStoreEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean eventStoreEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("eventStoreDataSource") DataSource dataSource) {

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "none");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        properties.put("hibernate.format_sql", "true");
        properties.put("hibernate.physical_naming_strategy", "org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl");

        return builder
                .dataSource(dataSource)
                .packages("com.globalcmx.api.eventsourcing.entity")
                .persistenceUnit("eventStore")
                .properties(properties)
                .build();
    }

    @Primary
    @Bean(name = "eventStoreTransactionManager")
    public PlatformTransactionManager eventStoreTransactionManager(
            @Qualifier("eventStoreEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}

@Configuration
@EnableJpaRepositories(
        basePackages = {
                "com.globalcmx.api.readmodel.repository",
                "com.globalcmx.api.repository.cx",
                "com.globalcmx.api.security.repository",
                "com.globalcmx.api.security.audit",
                "com.globalcmx.api.security.config.repository",
                "com.globalcmx.api.security.mfa.repository",
                "com.globalcmx.api.security.schedule.repository",
                "com.globalcmx.api.document.repository",
                "com.globalcmx.api.email.repository",
                "com.globalcmx.api.externalapi.repository",
                "com.globalcmx.api.ai.repository",
                "com.globalcmx.api.ai.extraction.repository",
                "com.globalcmx.api.clientportal.repository",
                "com.globalcmx.api.customfields.repository",
                "com.globalcmx.api.scheduler.repository",
                "com.globalcmx.api.alerts.repository",
                "com.globalcmx.api.videoconference.repository",
                "com.globalcmx.api.certification.repository",
                "com.globalcmx.api.compraspublicas.ai.repository",
                "com.globalcmx.api.compraspublicas.config.repository",
                "com.globalcmx.api.compraspublicas.process.repository",
                "com.globalcmx.api.compraspublicas.paa.repository",
                "com.globalcmx.api.compraspublicas.budget.repository",
                "com.globalcmx.api.compraspublicas.market.repository",
                "com.globalcmx.api.compraspublicas.risk.repository",
                "com.globalcmx.api.compraspublicas.legal.repository",
                "com.globalcmx.api.compraspublicas.methodology.repository"
        },
        entityManagerFactoryRef = "readModelEntityManagerFactory",
        transactionManagerRef = "readModelTransactionManager"
)
class ReadModelDataSourceConfig {

    @Bean(name = "readModelDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.readmodel")
    public DataSource readModelDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "readModelEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean readModelEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("readModelDataSource") DataSource dataSource) {

        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "none");
        properties.put("hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        properties.put("hibernate.format_sql", "true");

        return builder
                .dataSource(dataSource)
                .packages(
                        "com.globalcmx.api.readmodel.entity",
                        "com.globalcmx.api.model.cx",
                        "com.globalcmx.api.security.entity",
                        "com.globalcmx.api.security.audit",
                        "com.globalcmx.api.security.config.entity",
                        "com.globalcmx.api.security.mfa.entity",
                        "com.globalcmx.api.security.schedule.entity",
                        "com.globalcmx.api.document.entity",
                        "com.globalcmx.api.email.entity",
                        "com.globalcmx.api.externalapi.entity",
                        "com.globalcmx.api.ai.entity",
                        "com.globalcmx.api.ai.extraction.entity",
                        "com.globalcmx.api.clientportal.entity",
                        "com.globalcmx.api.customfields.entity",
                        "com.globalcmx.api.scheduler.entity",
                        "com.globalcmx.api.alerts.entity",
                        "com.globalcmx.api.videoconference.entity",
                        "com.globalcmx.api.certification.entity",
                        "com.globalcmx.api.compraspublicas.ai.entity",
                        "com.globalcmx.api.compraspublicas.config.entity",
                        "com.globalcmx.api.compraspublicas.process.entity",
                        "com.globalcmx.api.compraspublicas.paa.entity",
                        "com.globalcmx.api.compraspublicas.budget.entity",
                        "com.globalcmx.api.compraspublicas.market.entity",
                        "com.globalcmx.api.compraspublicas.risk.entity",
                        "com.globalcmx.api.compraspublicas.legal.entity",
                        "com.globalcmx.api.compraspublicas.methodology.entity"
                )
                .persistenceUnit("readModel")
                .properties(properties)
                .build();
    }

    @Bean(name = "readModelTransactionManager")
    public PlatformTransactionManager readModelTransactionManager(
            @Qualifier("readModelEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }

    @Bean(name = "readModelJdbcTemplate")
    public org.springframework.jdbc.core.JdbcTemplate readModelJdbcTemplate(
            @Qualifier("readModelDataSource") DataSource dataSource) {
        return new org.springframework.jdbc.core.JdbcTemplate(dataSource);
    }
}
