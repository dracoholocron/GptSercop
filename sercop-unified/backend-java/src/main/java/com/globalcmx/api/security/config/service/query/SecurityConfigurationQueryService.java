package com.globalcmx.api.security.config.service.query;

import com.globalcmx.api.security.config.dto.query.*;
import com.globalcmx.api.security.config.entity.*;
import com.globalcmx.api.security.config.entity.SecurityConfigurationReadModel.ConfigType;
import com.globalcmx.api.security.config.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SecurityConfigurationQueryService {

    private final SecurityConfigurationRepository configRepository;
    private final SecurityPresetRepository presetRepository;
    private final FourEyesConfigRepository fourEyesRepository;
    private final SecurityConfigAuditLogRepository auditLogRepository;
    private final RiskScoringRuleRepository riskRuleRepository;

    public List<SecurityConfigurationQueryDTO> getAllActiveConfigurations() {
        return configRepository.findByIsActiveTrue().stream()
                .map(SecurityConfigurationQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SecurityConfigurationQueryDTO> getConfigurationsByType(ConfigType type) {
        return configRepository.findByConfigTypeAndIsActiveTrue(type).stream()
                .map(SecurityConfigurationQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<SecurityConfigurationQueryDTO> getConfiguration(ConfigType type, String key, String environment) {
        return configRepository.findByConfigTypeAndConfigKeyAndEnvironmentAndIsActiveTrue(type, key, environment)
                .map(SecurityConfigurationQueryDTO::fromEntity);
    }

    public List<SecurityPresetQueryDTO> getAllPresets() {
        return presetRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(SecurityPresetQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<SecurityPresetQueryDTO> getSystemPresets() {
        return presetRepository.findByIsSystemTrueOrderByDisplayOrderAsc().stream()
                .map(SecurityPresetQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FourEyesConfigQueryDTO> getAllFourEyesConfigs() {
        return fourEyesRepository.findAll().stream()
                .map(FourEyesConfigQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<FourEyesConfigQueryDTO> getFourEyesConfigsByEntity(String entityType) {
        return fourEyesRepository.findByEntityType(entityType).stream()
                .map(FourEyesConfigQueryDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public boolean requiresFourEyesApproval(String entityType, String actionType, String creatorId, String approverId) {
        Optional<FourEyesConfig> config = fourEyesRepository.findActiveConfig(entityType, actionType);

        if (config.isEmpty() || !config.get().getIsEnabled()) {
            return false;
        }

        return creatorId.equals(approverId);
    }

    public boolean requiresFourEyesApproval(String entityType, String actionType,
                                             String creatorId, String approverId, BigDecimal amount) {
        Optional<FourEyesConfig> config = fourEyesRepository.findApplicableConfig(entityType, actionType, amount);

        if (config.isEmpty() || !config.get().getIsEnabled()) {
            return false;
        }

        FourEyesConfig fourEyes = config.get();

        if (creatorId.equals(approverId)) {
            log.warn("4-Eyes violation attempt: user {} tried to approve their own {} {}",
                    approverId, entityType, actionType);
            return true;
        }

        return false;
    }

    public FourEyesValidationResult validateFourEyes(String entityType, String actionType,
                                                      String creatorId, String approverId,
                                                      BigDecimal amount, Map<String, Object> context) {
        Optional<FourEyesConfig> configOpt = fourEyesRepository.findApplicableConfig(entityType, actionType, amount);

        if (configOpt.isEmpty() || !configOpt.get().getIsEnabled()) {
            return FourEyesValidationResult.notRequired();
        }

        FourEyesConfig config = configOpt.get();

        if (creatorId.equals(approverId)) {
            return FourEyesValidationResult.failed("fourEyes.error.sameUser");
        }

        if (config.getRequireDifferentDepartment() != null && config.getRequireDifferentDepartment()) {
            String creatorDept = (String) context.get("creatorDepartment");
            String approverDept = (String) context.get("approverDepartment");
            if (creatorDept != null && creatorDept.equals(approverDept)) {
                return FourEyesValidationResult.failed("fourEyes.error.sameDepartment");
            }
        }

        if (config.getRequireHigherRole() != null && config.getRequireHigherRole()) {
            Integer creatorLevel = (Integer) context.get("creatorRoleLevel");
            Integer approverLevel = (Integer) context.get("approverRoleLevel");
            if (creatorLevel != null && approverLevel != null && approverLevel <= creatorLevel) {
                return FourEyesValidationResult.failed("fourEyes.error.requireHigherRole");
            }
        }

        return FourEyesValidationResult.success();
    }

    public Page<SecurityConfigAuditLog> getAuditLog(Pageable pageable) {
        return auditLogRepository.findAllByOrderByChangedAtDesc(pageable);
    }

    public List<RiskScoringRule> getActiveRiskRules() {
        return riskRuleRepository.findAllActiveOrderedByPriority();
    }

    public record FourEyesValidationResult(boolean required, boolean validated, String errorKey) {
        public static FourEyesValidationResult notRequired() {
            return new FourEyesValidationResult(false, true, null);
        }

        public static FourEyesValidationResult success() {
            return new FourEyesValidationResult(true, true, null);
        }

        public static FourEyesValidationResult failed(String errorKey) {
            return new FourEyesValidationResult(true, false, errorKey);
        }
    }
}
