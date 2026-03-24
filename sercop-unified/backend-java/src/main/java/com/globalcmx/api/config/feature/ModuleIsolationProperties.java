package com.globalcmx.api.config.feature;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.module-isolation")
public class ModuleIsolationProperties {

    private boolean sercopMode = true;
    private boolean nonSercopModulesEnabled = false;
    private List<String> blockedControllerKeywords = new ArrayList<>(List.of(
            "tradefinancing",
            "documentarycollection",
            "letterofcredit",
            "bankguarantee",
            "swiftmessage",
            "swiftdraft",
            "swiftfieldconfig",
            "creditline",
            "financialinstitution",
            "commission"
    ));

    public boolean isSercopMode() {
        return sercopMode;
    }

    public void setSercopMode(boolean sercopMode) {
        this.sercopMode = sercopMode;
    }

    public boolean isNonSercopModulesEnabled() {
        return nonSercopModulesEnabled;
    }

    public void setNonSercopModulesEnabled(boolean nonSercopModulesEnabled) {
        this.nonSercopModulesEnabled = nonSercopModulesEnabled;
    }

    public List<String> getBlockedControllerKeywords() {
        return blockedControllerKeywords;
    }

    public void setBlockedControllerKeywords(List<String> blockedControllerKeywords) {
        this.blockedControllerKeywords = blockedControllerKeywords;
    }
}
