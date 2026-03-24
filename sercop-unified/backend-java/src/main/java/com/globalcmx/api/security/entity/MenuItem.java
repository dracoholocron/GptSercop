package com.globalcmx.api.security.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "menu_item")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private MenuItem parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<MenuItem> children = new HashSet<>();

    @Column(name = "label_key", nullable = false, length = 200)
    private String labelKey;

    @Column(length = 100)
    private String icon;

    @Column(length = 255)
    private String path;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_section")
    private Boolean isSection = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "user_type_restriction", length = 20)
    private String userTypeRestriction; // INTERNAL, CLIENT, or null for all

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "menu_item_permission",
        joinColumns = @JoinColumn(name = "menu_item_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_code", referencedColumnName = "code")
    )
    private Set<Permission> requiredPermissions = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "menu_item_api_endpoint",
        joinColumns = @JoinColumn(name = "menu_item_id"),
        inverseJoinColumns = @JoinColumn(name = "api_endpoint_id")
    )
    private Set<ApiEndpoint> apiEndpoints = new HashSet<>();

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public MenuItem getParent() { return parent; }
    public void setParent(MenuItem parent) { this.parent = parent; }

    public Set<MenuItem> getChildren() { return children; }
    public void setChildren(Set<MenuItem> children) { this.children = children; }

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

    public Set<Permission> getRequiredPermissions() { return requiredPermissions; }
    public void setRequiredPermissions(Set<Permission> requiredPermissions) { this.requiredPermissions = requiredPermissions; }

    public Set<ApiEndpoint> getApiEndpoints() { return apiEndpoints; }
    public void setApiEndpoints(Set<ApiEndpoint> apiEndpoints) { this.apiEndpoints = apiEndpoints; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public String getUserTypeRestriction() { return userTypeRestriction; }
    public void setUserTypeRestriction(String userTypeRestriction) { this.userTypeRestriction = userTypeRestriction; }
}
