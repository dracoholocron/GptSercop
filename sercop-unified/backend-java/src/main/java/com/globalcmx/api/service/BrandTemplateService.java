package com.globalcmx.api.service;

import com.globalcmx.api.readmodel.entity.BrandTemplate;
import com.globalcmx.api.readmodel.repository.BrandTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrandTemplateService {

    private final BrandTemplateRepository brandTemplateRepository;

    public List<BrandTemplate> getAll() {
        return brandTemplateRepository.findAllByOrderByDisplayOrderAsc();
    }

    public Optional<BrandTemplate> getById(Long id) {
        return brandTemplateRepository.findById(id);
    }

    public Optional<BrandTemplate> getByCode(String code) {
        return brandTemplateRepository.findByCode(code);
    }

    public Optional<BrandTemplate> getActive() {
        return brandTemplateRepository.findByActiveTrue();
    }

    @Transactional
    public BrandTemplate create(BrandTemplate template) {
        if (brandTemplateRepository.existsByCode(template.getCode())) {
            throw new IllegalArgumentException("Brand template with code '" + template.getCode() + "' already exists");
        }
        
        template.setCreatedBy(getCurrentUsername());
        template.setUpdatedBy(getCurrentUsername());
        
        // If this is the first template, make it active and default
        if (brandTemplateRepository.count() == 0) {
            template.setActive(true);
            template.setIsDefault(true);
        }
        
        return brandTemplateRepository.save(template);
    }

    @Transactional
    public BrandTemplate update(Long id, BrandTemplate updates) {
        BrandTemplate existing = brandTemplateRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Brand template not found with id: " + id));
        
        if (!existing.getIsEditable()) {
            throw new IllegalArgumentException("This brand template cannot be edited");
        }
        
        // Update fields
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getLogoUrl() != null) existing.setLogoUrl(updates.getLogoUrl());
        if (updates.getLogoSmallUrl() != null) existing.setLogoSmallUrl(updates.getLogoSmallUrl());
        if (updates.getFaviconUrl() != null) existing.setFaviconUrl(updates.getFaviconUrl());
        if (updates.getCompanyName() != null) existing.setCompanyName(updates.getCompanyName());
        if (updates.getCompanyShortName() != null) existing.setCompanyShortName(updates.getCompanyShortName());
        if (updates.getPrimaryColor() != null) existing.setPrimaryColor(updates.getPrimaryColor());
        if (updates.getSecondaryColor() != null) existing.setSecondaryColor(updates.getSecondaryColor());
        if (updates.getAccentColor() != null) existing.setAccentColor(updates.getAccentColor());
        if (updates.getSidebarBgColor() != null) existing.setSidebarBgColor(updates.getSidebarBgColor());
        if (updates.getSidebarTextColor() != null) existing.setSidebarTextColor(updates.getSidebarTextColor());
        if (updates.getHeaderBgColor() != null) existing.setHeaderBgColor(updates.getHeaderBgColor());
        if (updates.getFontFamily() != null) existing.setFontFamily(updates.getFontFamily());
        if (updates.getFontUrl() != null) existing.setFontUrl(updates.getFontUrl());
        if (updates.getContentBgColor() != null) existing.setContentBgColor(updates.getContentBgColor());
        if (updates.getContentBgColorDark() != null) existing.setContentBgColorDark(updates.getContentBgColorDark());
        if (updates.getCardBgColor() != null) existing.setCardBgColor(updates.getCardBgColor());
        if (updates.getCardBgColorDark() != null) existing.setCardBgColorDark(updates.getCardBgColorDark());
        if (updates.getBorderColor() != null) existing.setBorderColor(updates.getBorderColor());
        if (updates.getBorderColorDark() != null) existing.setBorderColorDark(updates.getBorderColorDark());
        if (updates.getTextColor() != null) existing.setTextColor(updates.getTextColor());
        if (updates.getTextColorDark() != null) existing.setTextColorDark(updates.getTextColorDark());
        if (updates.getTextColorSecondary() != null) existing.setTextColorSecondary(updates.getTextColorSecondary());
        if (updates.getTextColorSecondaryDark() != null) existing.setTextColorSecondaryDark(updates.getTextColorSecondaryDark());
        if (updates.getDarkModeEnabled() != null) existing.setDarkModeEnabled(updates.getDarkModeEnabled());
        if (updates.getCustomCss() != null) existing.setCustomCss(updates.getCustomCss());
        if (updates.getDisplayOrder() != null) existing.setDisplayOrder(updates.getDisplayOrder());
        
        existing.setUpdatedBy(getCurrentUsername());
        
        return brandTemplateRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        BrandTemplate template = brandTemplateRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Brand template not found with id: " + id));
        
        if (template.getIsDefault()) {
            throw new IllegalArgumentException("Cannot delete the default brand template");
        }
        
        if (template.getActive()) {
            // Activate default template if we're deleting the active one
            brandTemplateRepository.findByIsDefaultTrue()
                .ifPresent(defaultTemplate -> {
                    defaultTemplate.setActive(true);
                    brandTemplateRepository.save(defaultTemplate);
                });
        }
        
        brandTemplateRepository.delete(template);
    }

    @Transactional
    public BrandTemplate activate(Long id) {
        BrandTemplate templateToActivate = brandTemplateRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Brand template not found with id: " + id));

        // Deactivate all active templates
        List<BrandTemplate> allTemplates = brandTemplateRepository.findAll();
        for (BrandTemplate t : allTemplates) {
            if (Boolean.TRUE.equals(t.getActive())) {
                t.setActive(false);
                brandTemplateRepository.save(t);
            }
        }

        // Activate the selected one
        templateToActivate.setActive(true);
        templateToActivate.setUpdatedBy(getCurrentUsername());

        return brandTemplateRepository.save(templateToActivate);
    }

    @Transactional
    public BrandTemplate clone(Long id, String newCode, String newName) {
        BrandTemplate source = brandTemplateRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Brand template not found with id: " + id));
        
        if (brandTemplateRepository.existsByCode(newCode)) {
            throw new IllegalArgumentException("Brand template with code '" + newCode + "' already exists");
        }
        
        BrandTemplate clone = BrandTemplate.builder()
            .code(newCode)
            .name(newName != null ? newName : source.getName() + " (Copy)")
            .description(source.getDescription())
            .logoUrl(source.getLogoUrl())
            .logoSmallUrl(source.getLogoSmallUrl())
            .faviconUrl(source.getFaviconUrl())
            .companyName(source.getCompanyName())
            .companyShortName(source.getCompanyShortName())
            .primaryColor(source.getPrimaryColor())
            .secondaryColor(source.getSecondaryColor())
            .accentColor(source.getAccentColor())
            .sidebarBgColor(source.getSidebarBgColor())
            .sidebarTextColor(source.getSidebarTextColor())
            .headerBgColor(source.getHeaderBgColor())
            .fontFamily(source.getFontFamily())
            .fontUrl(source.getFontUrl())
            .contentBgColor(source.getContentBgColor())
            .contentBgColorDark(source.getContentBgColorDark())
            .cardBgColor(source.getCardBgColor())
            .cardBgColorDark(source.getCardBgColorDark())
            .borderColor(source.getBorderColor())
            .borderColorDark(source.getBorderColorDark())
            .textColor(source.getTextColor())
            .textColorDark(source.getTextColorDark())
            .textColorSecondary(source.getTextColorSecondary())
            .textColorSecondaryDark(source.getTextColorSecondaryDark())
            .darkModeEnabled(source.getDarkModeEnabled())
            .customCss(source.getCustomCss())
            .active(false)
            .isDefault(false)
            .isEditable(true)
            .displayOrder(source.getDisplayOrder() + 1)
            .createdBy(getCurrentUsername())
            .updatedBy(getCurrentUsername())
            .build();
        
        return brandTemplateRepository.save(clone);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
