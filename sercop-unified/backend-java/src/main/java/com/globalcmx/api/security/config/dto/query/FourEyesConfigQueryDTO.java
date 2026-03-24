package com.globalcmx.api.security.config.dto.query;

import com.globalcmx.api.security.config.entity.FourEyesConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FourEyesConfigQueryDTO {

    private Long id;
    private String entityType;
    private String actionType;
    private Boolean isEnabled;
    private Integer minApprovers;
    private BigDecimal amountThreshold;
    private Boolean requireDifferentDepartment;
    private Boolean requireHigherRole;
    private List<String> excludedRoles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;

    public static FourEyesConfigQueryDTO fromEntity(FourEyesConfig entity) {
        return FourEyesConfigQueryDTO.builder()
                .id(entity.getId())
                .entityType(entity.getEntityType())
                .actionType(entity.getActionType())
                .isEnabled(entity.getIsEnabled())
                .minApprovers(entity.getMinApprovers())
                .amountThreshold(entity.getAmountThreshold())
                .requireDifferentDepartment(entity.getRequireDifferentDepartment())
                .requireHigherRole(entity.getRequireHigherRole())
                .excludedRoles(entity.getExcludedRoles())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
}
