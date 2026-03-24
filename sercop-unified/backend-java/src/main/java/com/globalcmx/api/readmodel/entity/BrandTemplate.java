package com.globalcmx.api.readmodel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * Entity for brand/theme templates.
 * Allows customization of the application's visual identity.
 */
@Entity
@Table(name = "brand_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "logo_small_url", length = 500)
    private String logoSmallUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "company_short_name", length = 50)
    private String companyShortName;

    @Column(name = "primary_color", length = 20)
    @Builder.Default
    private String primaryColor = "#3182CE";

    @Column(name = "secondary_color", length = 20)
    @Builder.Default
    private String secondaryColor = "#718096";

    @Column(name = "accent_color", length = 20)
    @Builder.Default
    private String accentColor = "#38B2AC";

    @Column(name = "sidebar_bg_color", length = 20)
    @Builder.Default
    private String sidebarBgColor = "#1A202C";

    @Column(name = "sidebar_text_color", length = 20)
    @Builder.Default
    private String sidebarTextColor = "#FFFFFF";

    @Column(name = "header_bg_color", length = 20)
    @Builder.Default
    private String headerBgColor = "#FFFFFF";

    @Column(name = "font_family", length = 100)
    @Builder.Default
    private String fontFamily = "Inter";

    @Column(name = "font_url", length = 500)
    private String fontUrl;

    @Column(name = "content_bg_color", length = 20)
    @Builder.Default
    private String contentBgColor = "#F7FAFC";

    @Column(name = "content_bg_color_dark", length = 20)
    @Builder.Default
    private String contentBgColorDark = "#2D3748";

    @Column(name = "card_bg_color", length = 20)
    @Builder.Default
    private String cardBgColor = "#FFFFFF";

    @Column(name = "card_bg_color_dark", length = 20)
    @Builder.Default
    private String cardBgColorDark = "#2D3748";

    @Column(name = "border_color", length = 20)
    @Builder.Default
    private String borderColor = "#E2E8F0";

    @Column(name = "border_color_dark", length = 20)
    @Builder.Default
    private String borderColorDark = "#4A5568";

    @Column(name = "text_color", length = 20)
    @Builder.Default
    private String textColor = "#1A202C";

    @Column(name = "text_color_dark", length = 20)
    @Builder.Default
    private String textColorDark = "#F7FAFC";

    @Column(name = "text_color_secondary", length = 20)
    @Builder.Default
    private String textColorSecondary = "#718096";

    @Column(name = "text_color_secondary_dark", length = 20)
    @Builder.Default
    private String textColorSecondaryDark = "#A0AEC0";

    @Column(name = "dark_mode_enabled")
    @Builder.Default
    private Boolean darkModeEnabled = false;

    @Column(name = "custom_css", columnDefinition = "TEXT")
    private String customCss;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean active = false;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "is_editable")
    @Builder.Default
    private Boolean isEditable = true;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

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
}
