package com.globalcmx.api.security.dto;

import java.util.ArrayList;
import java.util.List;

public class MenuItemDTO {
    private Long id;
    private String code;
    private Long parentId;
    private String labelKey;  // i18n key for translation
    private String icon;
    private String path;
    private Integer displayOrder;
    private Boolean isSection;
    private Boolean isActive;
    private List<String> requiredPermissions = new ArrayList<>();
    private List<MenuItemDTO> children = new ArrayList<>();
    private List<String> apiEndpointCodes = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public String getLabelKey() { return labelKey; }
    public void setLabelKey(String labelKey) { this.labelKey = labelKey; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public Boolean getIsSection() { return isSection; }
    public void setIsSection(Boolean isSection) { this.isSection = isSection; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<String> getRequiredPermissions() { return requiredPermissions; }
    public void setRequiredPermissions(List<String> requiredPermissions) { this.requiredPermissions = requiredPermissions; }

    public List<MenuItemDTO> getChildren() { return children; }
    public void setChildren(List<MenuItemDTO> children) { this.children = children; }

    public List<String> getApiEndpointCodes() { return apiEndpointCodes; }
    public void setApiEndpointCodes(List<String> apiEndpointCodes) { this.apiEndpointCodes = apiEndpointCodes; }
}
