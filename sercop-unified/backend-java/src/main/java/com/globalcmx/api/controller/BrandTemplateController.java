package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.BrandTemplate;
import com.globalcmx.api.service.BrandTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/brand-templates")
@RequiredArgsConstructor
@Slf4j
public class BrandTemplateController {

    private final BrandTemplateService brandTemplateService;

    /**
     * Get all brand templates
     */
    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BrandTemplate>>> getAll() {
        List<BrandTemplate> templates = brandTemplateService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Templates retrieved successfully", templates));
    }

    /**
     * Get active brand template (public endpoint for login page branding)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<BrandTemplate>> getActive() {
        return brandTemplateService.getActive()
            .map(template -> ResponseEntity.ok(ApiResponse.success("Active template found", template)))
            .orElse(ResponseEntity.ok(ApiResponse.success("No active brand template", null)));
    }

    /**
     * Get brand template by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('VIEW_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandTemplate>> getById(@PathVariable Long id) {
        return brandTemplateService.getById(id)
            .map(template -> ResponseEntity.ok(ApiResponse.success("Template found", template)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new brand template
     */
    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandTemplate>> create(@RequestBody CreateRequest request) {
        BrandTemplate template = BrandTemplate.builder()
            .code(request.code())
            .name(request.name())
            .description(request.description())
            .logoUrl(request.logoUrl())
            .logoSmallUrl(request.logoSmallUrl())
            .faviconUrl(request.faviconUrl())
            .companyName(request.companyName())
            .companyShortName(request.companyShortName())
            .primaryColor(request.primaryColor() != null ? request.primaryColor() : "#3182CE")
            .secondaryColor(request.secondaryColor() != null ? request.secondaryColor() : "#718096")
            .accentColor(request.accentColor() != null ? request.accentColor() : "#38B2AC")
            .sidebarBgColor(request.sidebarBgColor() != null ? request.sidebarBgColor() : "#1A202C")
            .sidebarTextColor(request.sidebarTextColor() != null ? request.sidebarTextColor() : "#FFFFFF")
            .headerBgColor(request.headerBgColor() != null ? request.headerBgColor() : "#FFFFFF")
            .fontFamily(request.fontFamily() != null ? request.fontFamily() : "Inter")
            .fontUrl(request.fontUrl())
            .contentBgColor(request.contentBgColor() != null ? request.contentBgColor() : "#F7FAFC")
            .contentBgColorDark(request.contentBgColorDark() != null ? request.contentBgColorDark() : "#2D3748")
            .cardBgColor(request.cardBgColor() != null ? request.cardBgColor() : "#FFFFFF")
            .cardBgColorDark(request.cardBgColorDark() != null ? request.cardBgColorDark() : "#2D3748")
            .borderColor(request.borderColor() != null ? request.borderColor() : "#E2E8F0")
            .borderColorDark(request.borderColorDark() != null ? request.borderColorDark() : "#4A5568")
            .textColor(request.textColor() != null ? request.textColor() : "#1A202C")
            .textColorDark(request.textColorDark() != null ? request.textColorDark() : "#F7FAFC")
            .textColorSecondary(request.textColorSecondary() != null ? request.textColorSecondary() : "#718096")
            .textColorSecondaryDark(request.textColorSecondaryDark() != null ? request.textColorSecondaryDark() : "#A0AEC0")
            .darkModeEnabled(request.darkModeEnabled() != null ? request.darkModeEnabled() : false)
            .customCss(request.customCss())
            .build();
        
        BrandTemplate created = brandTemplateService.create(template);
        return ResponseEntity.ok(ApiResponse.success("Brand template created successfully", created));
    }

    /**
     * Update an existing brand template
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandTemplate>> update(
            @PathVariable Long id,
            @RequestBody UpdateRequest request) {
        
        BrandTemplate updates = BrandTemplate.builder()
            .name(request.name())
            .description(request.description())
            .logoUrl(request.logoUrl())
            .logoSmallUrl(request.logoSmallUrl())
            .faviconUrl(request.faviconUrl())
            .companyName(request.companyName())
            .companyShortName(request.companyShortName())
            .primaryColor(request.primaryColor())
            .secondaryColor(request.secondaryColor())
            .accentColor(request.accentColor())
            .sidebarBgColor(request.sidebarBgColor())
            .sidebarTextColor(request.sidebarTextColor())
            .headerBgColor(request.headerBgColor())
            .fontFamily(request.fontFamily())
            .fontUrl(request.fontUrl())
            .contentBgColor(request.contentBgColor())
            .contentBgColorDark(request.contentBgColorDark())
            .cardBgColor(request.cardBgColor())
            .cardBgColorDark(request.cardBgColorDark())
            .borderColor(request.borderColor())
            .borderColorDark(request.borderColorDark())
            .textColor(request.textColor())
            .textColorDark(request.textColorDark())
            .textColorSecondary(request.textColorSecondary())
            .textColorSecondaryDark(request.textColorSecondaryDark())
            .darkModeEnabled(request.darkModeEnabled())
            .customCss(request.customCss())
            .displayOrder(request.displayOrder())
            .build();
        
        BrandTemplate updated = brandTemplateService.update(id, updates);
        return ResponseEntity.ok(ApiResponse.success("Brand template updated successfully", updated));
    }

    /**
     * Delete a brand template
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        brandTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Brand template deleted successfully", null));
    }

    /**
     * Activate a brand template
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('MANAGE_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandTemplate>> activate(@PathVariable Long id) {
        BrandTemplate activated = brandTemplateService.activate(id);
        return ResponseEntity.ok(ApiResponse.success("Brand template activated successfully", activated));
    }

    /**
     * Clone a brand template
     */
    @PostMapping("/{id}/clone")
    @PreAuthorize("hasAuthority('MANAGE_BRAND_TEMPLATES') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandTemplate>> clone(
            @PathVariable Long id,
            @RequestBody CloneRequest request) {
        
        BrandTemplate cloned = brandTemplateService.clone(id, request.code(), request.name());
        return ResponseEntity.ok(ApiResponse.success("Brand template cloned successfully", cloned));
    }

    // Request DTOs
    public record CreateRequest(
        String code,
        String name,
        String description,
        String logoUrl,
        String logoSmallUrl,
        String faviconUrl,
        String companyName,
        String companyShortName,
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String sidebarBgColor,
        String sidebarTextColor,
        String headerBgColor,
        String fontFamily,
        String fontUrl,
        String contentBgColor,
        String contentBgColorDark,
        String cardBgColor,
        String cardBgColorDark,
        String borderColor,
        String borderColorDark,
        String textColor,
        String textColorDark,
        String textColorSecondary,
        String textColorSecondaryDark,
        Boolean darkModeEnabled,
        String customCss
    ) {}

    public record UpdateRequest(
        String name,
        String description,
        String logoUrl,
        String logoSmallUrl,
        String faviconUrl,
        String companyName,
        String companyShortName,
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String sidebarBgColor,
        String sidebarTextColor,
        String headerBgColor,
        String fontFamily,
        String fontUrl,
        String contentBgColor,
        String contentBgColorDark,
        String cardBgColor,
        String cardBgColorDark,
        String borderColor,
        String borderColorDark,
        String textColor,
        String textColorDark,
        String textColorSecondary,
        String textColorSecondaryDark,
        Boolean darkModeEnabled,
        String customCss,
        Integer displayOrder
    ) {}

    public record CloneRequest(
        String code,
        String name
    ) {}
}
