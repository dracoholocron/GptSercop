package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DroolsRulesConfigCreatedEvent extends DomainEvent {
    private Long droolsRulesConfigId;
    private String ruleType;
    private String drlContent;
    private String sourceFileName;
    private Boolean isActive;
    private Integer version;

    public DroolsRulesConfigCreatedEvent(Long droolsRulesConfigId, String ruleType, String drlContent,
                                         String sourceFileName, Boolean isActive, Integer version,
                                         String performedBy) {
        super("DROOLS_RULES_CONFIG_CREATED", performedBy);
        this.droolsRulesConfigId = droolsRulesConfigId;
        this.ruleType = ruleType;
        this.drlContent = drlContent;
        this.sourceFileName = sourceFileName;
        this.isActive = isActive;
        this.version = version;
    }
}
