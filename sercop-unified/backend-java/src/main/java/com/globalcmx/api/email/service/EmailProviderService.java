package com.globalcmx.api.email.service;

import com.globalcmx.api.email.dto.EmailProviderConfigDTO;
import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.provider.EmailProvider;
import com.globalcmx.api.email.repository.EmailProviderConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailProviderService {

    private final EmailProviderConfigRepository repository;
    private final List<EmailProvider> providers;

    private Map<String, EmailProvider> getProviderMap() {
        return providers.stream().collect(Collectors.toMap(EmailProvider::getProviderType, Function.identity()));
    }

    public List<EmailProviderConfig> findAll() { return repository.findAll(); }

    public EmailProviderConfig findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Provider not found: " + id));
    }

    public EmailProviderConfig findDefaultProvider() { return repository.findDefaultActiveProvider().orElse(null); }

    public List<EmailProviderConfig> findActiveProviders() { return repository.findByIsActiveTrueOrderByPriorityDesc(); }

    @Transactional
    public EmailProviderConfig create(EmailProviderConfigDTO dto) {
        return repository.save(mapToEntity(dto));
    }

    @Transactional
    public EmailProviderConfig update(Long id, EmailProviderConfigDTO dto) {
        EmailProviderConfig existing = findById(id);
        updateEntity(existing, dto);
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) { repository.deleteById(id); }

    @Transactional
    public void setDefault(Long id) {
        repository.findAll().forEach(c -> { if (c.getIsDefault()) { c.setIsDefault(false); repository.save(c); } });
        EmailProviderConfig newDefault = findById(id);
        newDefault.setIsDefault(true);
        repository.save(newDefault);
    }

    public boolean testConnection(Long id) {
        EmailProviderConfig config = findById(id);
        EmailProvider provider = getProviderMap().get(config.getProviderType());
        if (provider == null) throw new RuntimeException("No provider implementation for: " + config.getProviderType());
        return provider.testConnection(config);
    }

    public EmailProvider getProvider(String providerType) {
        EmailProvider provider = getProviderMap().get(providerType);
        if (provider == null) throw new RuntimeException("No provider implementation for: " + providerType);
        return provider;
    }

    private EmailProviderConfig mapToEntity(EmailProviderConfigDTO dto) {
        return EmailProviderConfig.builder()
                .tenantId(dto.getTenantId()).name(dto.getName()).providerType(dto.getProviderType())
                .smtpHost(dto.getSmtpHost()).smtpPort(dto.getSmtpPort()).smtpUsername(dto.getSmtpUsername())
                .smtpPassword(dto.getSmtpPassword()).smtpUseTls(dto.getSmtpUseTls()).smtpUseSsl(dto.getSmtpUseSsl())
                .apiKey(dto.getApiKey()).apiEndpoint(dto.getApiEndpoint()).apiRegion(dto.getApiRegion())
                .fromEmail(dto.getFromEmail()).fromName(dto.getFromName()).replyToEmail(dto.getReplyToEmail())
                .rateLimitPerMinute(dto.getRateLimitPerMinute()).rateLimitPerHour(dto.getRateLimitPerHour())
                .rateLimitPerDay(dto.getRateLimitPerDay()).isActive(dto.getIsActive()).isDefault(dto.getIsDefault())
                .priority(dto.getPriority()).build();
    }

    private void updateEntity(EmailProviderConfig entity, EmailProviderConfigDTO dto) {
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getProviderType() != null) entity.setProviderType(dto.getProviderType());
        if (dto.getSmtpHost() != null) entity.setSmtpHost(dto.getSmtpHost());
        if (dto.getSmtpPort() != null) entity.setSmtpPort(dto.getSmtpPort());
        if (dto.getSmtpUsername() != null) entity.setSmtpUsername(dto.getSmtpUsername());
        if (dto.getSmtpPassword() != null) entity.setSmtpPassword(dto.getSmtpPassword());
        if (dto.getSmtpUseTls() != null) entity.setSmtpUseTls(dto.getSmtpUseTls());
        if (dto.getSmtpUseSsl() != null) entity.setSmtpUseSsl(dto.getSmtpUseSsl());
        if (dto.getApiKey() != null) entity.setApiKey(dto.getApiKey());
        if (dto.getFromEmail() != null) entity.setFromEmail(dto.getFromEmail());
        if (dto.getFromName() != null) entity.setFromName(dto.getFromName());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());
        if (dto.getIsDefault() != null) entity.setIsDefault(dto.getIsDefault());
        if (dto.getPriority() != null) entity.setPriority(dto.getPriority());
    }
}
