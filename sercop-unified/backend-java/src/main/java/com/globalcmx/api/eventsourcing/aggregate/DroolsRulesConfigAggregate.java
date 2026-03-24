package com.globalcmx.api.eventsourcing.aggregate;

import com.globalcmx.api.dto.command.SaveDroolsRulesCommand;
import com.globalcmx.api.eventsourcing.event.DomainEvent;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigCreatedEvent;
import com.globalcmx.api.eventsourcing.event.DroolsRulesConfigUpdatedEvent;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class DroolsRulesConfigAggregate {
    private Long droolsRulesConfigId;
    private String ruleType;
    private String drlContent;
    private String sourceFileName;
    private Boolean isActive;
    private Integer version;
    private Long aggregateVersion = 0L;

    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public DroolsRulesConfigAggregate() {
    }

    public DroolsRulesConfigAggregate(Long droolsRulesConfigId) {
        this.droolsRulesConfigId = droolsRulesConfigId;
    }

    public void handleCreate(SaveDroolsRulesCommand command, Integer version) {
        DroolsRulesConfigCreatedEvent event = new DroolsRulesConfigCreatedEvent(
                this.droolsRulesConfigId,
                command.getRuleType(),
                command.getDrlContent(),
                command.getSourceFileName(),
                true,
                version,
                command.getPerformedBy() != null ? command.getPerformedBy() : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    public void handleDeactivate(String performedBy) {
        DroolsRulesConfigUpdatedEvent event = new DroolsRulesConfigUpdatedEvent(
                this.droolsRulesConfigId,
                this.ruleType,
                this.drlContent,
                this.sourceFileName,
                false,
                this.version,
                performedBy != null ? performedBy : "system"
        );

        apply(event);
        uncommittedEvents.add(event);
    }

    private void apply(DroolsRulesConfigCreatedEvent event) {
        this.droolsRulesConfigId = event.getDroolsRulesConfigId();
        this.ruleType = event.getRuleType();
        this.drlContent = event.getDrlContent();
        this.sourceFileName = event.getSourceFileName();
        this.isActive = event.getIsActive();
        this.version = event.getVersion();
        this.aggregateVersion++;
    }

    private void apply(DroolsRulesConfigUpdatedEvent event) {
        this.ruleType = event.getRuleType();
        this.drlContent = event.getDrlContent();
        this.sourceFileName = event.getSourceFileName();
        this.isActive = event.getIsActive();
        this.version = event.getVersion();
        this.aggregateVersion++;
    }

    public void loadFromHistory(List<DomainEvent> events) {
        for (DomainEvent event : events) {
            if (event instanceof DroolsRulesConfigCreatedEvent) {
                apply((DroolsRulesConfigCreatedEvent) event);
            } else if (event instanceof DroolsRulesConfigUpdatedEvent) {
                apply((DroolsRulesConfigUpdatedEvent) event);
            }
        }
        uncommittedEvents.clear();
    }

    public List<DomainEvent> getUncommittedEvents() {
        return new ArrayList<>(uncommittedEvents);
    }

    public void markEventsAsCommitted() {
        uncommittedEvents.clear();
    }
}
