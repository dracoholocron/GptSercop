package com.globalcmx.api.externalapi.service.command;

import com.globalcmx.api.externalapi.dto.command.*;
import com.globalcmx.api.externalapi.dto.query.TestResultResponse;
import com.globalcmx.api.externalapi.entity.*;
import com.globalcmx.api.externalapi.repository.*;
import com.globalcmx.api.externalapi.service.EncryptionService;
import com.globalcmx.api.externalapi.service.ExternalApiExecutorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalApiConfigCommandService {

    private final ExternalApiConfigRepository configRepository;
    private final ExternalApiAuthConfigRepository authRepository;
    private final ExternalApiRequestTemplateRepository templateRepository;
    private final ExternalApiResponseConfigRepository responseRepository;
    private final ExternalApiTestResultRepository testResultRepository;
    private final EncryptionService encryptionService;
    private final ExternalApiExecutorService executorService;

    @Transactional
    public ExternalApiConfigReadModel create(CreateExternalApiConfigCommand command) {
        log.info("Creating external API config: {}", command.getCode());

        if (configRepository.existsByCode(command.getCode())) {
            throw new IllegalArgumentException("Ya existe una configuracion con codigo: " + command.getCode());
        }

        ExternalApiConfigReadModel config = mapToEntity(command);
        config = configRepository.save(config);

        if (command.getAuthConfig() != null) {
            createAuthConfig(config, command.getAuthConfig());
        }

        if (command.getRequestTemplates() != null) {
            for (RequestTemplateCommand templateCmd : command.getRequestTemplates()) {
                createRequestTemplate(config, templateCmd);
            }
        }

        if (command.getResponseConfig() != null) {
            createResponseConfig(config, command.getResponseConfig());
        }

        log.info("External API config created successfully: {}", config.getId());
        return configRepository.findByIdWithAllRelations(config.getId()).orElse(config);
    }

    @Transactional
    public ExternalApiConfigReadModel update(Long id, UpdateExternalApiConfigCommand command) {
        log.info("Updating external API config: {}", id);

        ExternalApiConfigReadModel config = configRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + id));

        updateEntity(config, command);
        config = configRepository.save(config);

        if (command.getAuthConfig() != null) {
            authRepository.findByApiConfigId(id).ifPresent(authRepository::delete);
            createAuthConfig(config, command.getAuthConfig());
        }

        if (command.getRequestTemplates() != null) {
            templateRepository.deleteByApiConfigId(id);
            for (RequestTemplateCommand templateCmd : command.getRequestTemplates()) {
                createRequestTemplate(config, templateCmd);
            }
        }

        if (command.getResponseConfig() != null) {
            responseRepository.findByApiConfigId(id).ifPresent(responseRepository::delete);
            createResponseConfig(config, command.getResponseConfig());
        }

        log.info("External API config updated successfully: {}", id);
        return configRepository.findByIdWithAllRelations(id).orElse(config);
    }

    @Transactional
    public void delete(Long id) {
        log.info("Deleting external API config: {}", id);
        ExternalApiConfigReadModel config = configRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + id));
        configRepository.delete(config);
        log.info("External API config deleted: {}", id);
    }

    @Transactional
    public ExternalApiConfigReadModel toggleActive(Long id) {
        ExternalApiConfigReadModel config = configRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + id));
        config.setActive(!config.getActive());
        return configRepository.save(config);
    }

    @Transactional
    public TestResultResponse testConnection(Long id, TestApiConnectionCommand command) {
        log.info("Testing connection for API config: {}", id);

        ExternalApiConfigReadModel config = configRepository.findByIdWithAllRelations(id)
            .orElseThrow(() -> new IllegalArgumentException("Configuracion no encontrada: " + id));

        return executorService.testConnection(config, command);
    }

    private ExternalApiConfigReadModel mapToEntity(CreateExternalApiConfigCommand command) {
        return ExternalApiConfigReadModel.builder()
            .code(command.getCode())
            .name(command.getName())
            .description(command.getDescription())
            .baseUrl(command.getBaseUrl())
            .path(command.getPath())
            .httpMethod(ExternalApiConfigReadModel.HttpMethod.valueOf(command.getHttpMethod()))
            .contentType(command.getContentType())
            .timeoutMs(command.getTimeoutMs())
            .retryCount(command.getRetryCount())
            .retryBackoffMultiplier(command.getRetryBackoffMultiplier())
            .retryInitialDelayMs(command.getRetryInitialDelayMs())
            .retryMaxDelayMs(command.getRetryMaxDelayMs())
            .circuitBreakerEnabled(command.getCircuitBreakerEnabled())
            .circuitBreakerThreshold(command.getCircuitBreakerThreshold())
            .circuitBreakerTimeoutMs(command.getCircuitBreakerTimeoutMs())
            .active(command.getActive() != null ? command.getActive() : true)
            .environment(command.getEnvironment())
            .mockEnabled(command.getMockEnabled() != null ? command.getMockEnabled() : false)
            .mockProvider(command.getMockProvider())
            .mockCustomUrl(command.getMockCustomUrl())
            .createdBy(command.getCreatedBy())
            .build();
    }

    private void updateEntity(ExternalApiConfigReadModel config, UpdateExternalApiConfigCommand command) {
        config.setName(command.getName());
        config.setDescription(command.getDescription());
        config.setBaseUrl(command.getBaseUrl());
        config.setPath(command.getPath());
        config.setHttpMethod(ExternalApiConfigReadModel.HttpMethod.valueOf(command.getHttpMethod()));
        config.setContentType(command.getContentType());
        config.setTimeoutMs(command.getTimeoutMs());
        config.setRetryCount(command.getRetryCount());
        config.setRetryBackoffMultiplier(command.getRetryBackoffMultiplier());
        config.setRetryInitialDelayMs(command.getRetryInitialDelayMs());
        config.setRetryMaxDelayMs(command.getRetryMaxDelayMs());
        config.setCircuitBreakerEnabled(command.getCircuitBreakerEnabled());
        config.setCircuitBreakerThreshold(command.getCircuitBreakerThreshold());
        config.setCircuitBreakerTimeoutMs(command.getCircuitBreakerTimeoutMs());
        config.setActive(command.getActive());
        config.setEnvironment(command.getEnvironment());
        config.setMockEnabled(command.getMockEnabled() != null ? command.getMockEnabled() : false);
        config.setMockProvider(command.getMockProvider());
        config.setMockCustomUrl(command.getMockCustomUrl());
        config.setUpdatedBy(command.getUpdatedBy());
    }

    private void createAuthConfig(ExternalApiConfigReadModel config, AuthConfigCommand command) {
        ExternalApiAuthConfig auth = ExternalApiAuthConfig.builder()
            .apiConfig(config)
            .authType(ExternalApiAuthConfig.AuthType.valueOf(command.getAuthType()))
            .active(true)
            .build();

        switch (auth.getAuthType()) {
            case API_KEY -> {
                auth.setApiKeyName(command.getApiKeyName());
                auth.setApiKeyValueEncrypted(encryptionService.encrypt(command.getApiKeyValue()));
                auth.setApiKeyLocation(command.getApiKeyLocation() != null ?
                    ExternalApiAuthConfig.ApiKeyLocation.valueOf(command.getApiKeyLocation()) :
                    ExternalApiAuthConfig.ApiKeyLocation.HEADER);
            }
            case BASIC_AUTH -> {
                auth.setUsername(command.getUsername());
                auth.setPasswordEncrypted(encryptionService.encrypt(command.getPassword()));
            }
            case BEARER_TOKEN -> auth.setStaticTokenEncrypted(encryptionService.encrypt(command.getStaticToken()));
            case OAUTH2_CLIENT_CREDENTIALS -> {
                auth.setOauth2TokenUrl(command.getOauth2TokenUrl());
                auth.setOauth2ClientId(command.getOauth2ClientId());
                auth.setOauth2ClientSecretEncrypted(encryptionService.encrypt(command.getOauth2ClientSecret()));
                auth.setOauth2Scope(command.getOauth2Scope());
                auth.setOauth2Audience(command.getOauth2Audience());
            }
            case OAUTH2_AUTHORIZATION_CODE -> {
                auth.setOauth2TokenUrl(command.getOauth2TokenUrl());
                auth.setOauth2ClientId(command.getOauth2ClientId());
                auth.setOauth2ClientSecretEncrypted(encryptionService.encrypt(command.getOauth2ClientSecret()));
                auth.setOauth2AuthUrl(command.getOauth2AuthUrl());
                auth.setOauth2RedirectUri(command.getOauth2RedirectUri());
                auth.setOauth2Scope(command.getOauth2Scope());
            }
            case JWT -> {
                auth.setJwtSecretEncrypted(encryptionService.encrypt(command.getJwtSecret()));
                auth.setJwtAlgorithm(command.getJwtAlgorithm());
                auth.setJwtIssuer(command.getJwtIssuer());
                auth.setJwtAudience(command.getJwtAudience());
                auth.setJwtExpirationSeconds(command.getJwtExpirationSeconds());
                auth.setJwtClaimsTemplate(command.getJwtClaimsTemplate());
            }
            case MTLS -> {
                auth.setMtlsCertPath(command.getMtlsCertPath());
                auth.setMtlsKeyPath(command.getMtlsKeyPath());
                auth.setMtlsCaCertPath(command.getMtlsCaCertPath());
                auth.setMtlsKeyPasswordEncrypted(encryptionService.encrypt(command.getMtlsKeyPassword()));
            }
            case CUSTOM_HEADER -> auth.setCustomHeadersJson(command.getCustomHeadersJson());
        }

        authRepository.save(auth);
    }

    private void createRequestTemplate(ExternalApiConfigReadModel config, RequestTemplateCommand command) {
        ExternalApiRequestTemplate template = ExternalApiRequestTemplate.builder()
            .apiConfig(config)
            .name(command.getName())
            .description(command.getDescription())
            .staticHeadersJson(command.getStaticHeadersJson())
            .queryParamsTemplate(command.getQueryParamsTemplate())
            .bodyTemplate(command.getBodyTemplate())
            .variableMappingsJson(command.getVariableMappingsJson())
            .isDefault(command.getIsDefault() != null ? command.getIsDefault() : false)
            .active(command.getActive() != null ? command.getActive() : true)
            .build();

        templateRepository.save(template);
    }

    private void createResponseConfig(ExternalApiConfigReadModel config, ResponseConfigCommand command) {
        ExternalApiResponseConfig responseConfig = ExternalApiResponseConfig.builder()
            .apiConfig(config)
            .successCodes(command.getSuccessCodes())
            .responseType(command.getResponseType() != null ?
                ExternalApiResponseConfig.ResponseType.valueOf(command.getResponseType()) :
                ExternalApiResponseConfig.ResponseType.JSON)
            .successFieldPath(command.getSuccessFieldPath())
            .successExpectedValue(command.getSuccessExpectedValue())
            .errorMessagePath(command.getErrorMessagePath())
            .transactionIdPath(command.getTransactionIdPath())
            .extractionMappingsJson(command.getExtractionMappingsJson())
            .validationRulesJson(command.getValidationRulesJson())
            .build();

        responseRepository.save(responseConfig);
    }
}
