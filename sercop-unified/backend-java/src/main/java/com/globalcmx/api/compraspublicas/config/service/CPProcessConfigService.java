package com.globalcmx.api.compraspublicas.config.service;

import com.globalcmx.api.compraspublicas.config.dto.CPProcessConfigurationDTO;
import com.globalcmx.api.compraspublicas.config.entity.*;
import com.globalcmx.api.compraspublicas.config.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPProcessConfigService {

    private final CPCountryConfigRepository countryConfigRepository;
    private final CPProcessStepConfigRepository stepConfigRepository;
    private final CPProcessSectionConfigRepository sectionConfigRepository;
    private final CPProcessFieldConfigRepository fieldConfigRepository;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPProcessConfigurationDTO getFullConfiguration(String countryCode, String processType) {
        return getFullConfiguration(countryCode, processType, null);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPProcessConfigurationDTO getFullConfiguration(String countryCode, String processType, String tenantId) {
        log.info("Loading CP process configuration for country={}, processType={}, tenant={}",
                countryCode, processType, tenantId);

        CPCountryConfig country = countryConfigRepository.findByCountryCode(countryCode)
                .orElseThrow(() -> new IllegalArgumentException("Country not configured: " + countryCode));

        List<CPProcessStepConfig> steps;
        if (tenantId != null) {
            steps = stepConfigRepository.findActiveSteps(countryCode, processType, tenantId);
        } else {
            steps = stepConfigRepository.findActiveStepsGlobal(countryCode, processType);
        }

        List<CPProcessConfigurationDTO.StepDTO> stepDTOs = steps.stream()
                .map(this::mapStepToDTO)
                .collect(Collectors.toList());

        return CPProcessConfigurationDTO.builder()
                .country(country)
                .processType(processType)
                .steps(stepDTOs)
                .build();
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPCountryConfig> getActiveCountries() {
        return countryConfigRepository.findByIsActiveTrueOrderByCountryNameAsc();
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPCountryConfig getCountryConfig(String countryCode) {
        return countryConfigRepository.findByCountryCode(countryCode)
                .orElseThrow(() -> new IllegalArgumentException("Country not configured: " + countryCode));
    }

    private CPProcessConfigurationDTO.StepDTO mapStepToDTO(CPProcessStepConfig step) {
        List<CPProcessConfigurationDTO.SectionDTO> sectionDTOs = step.getSections().stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .sorted(Comparator.comparing(CPProcessSectionConfig::getDisplayOrder))
                .map(this::mapSectionToDTO)
                .collect(Collectors.toList());

        return CPProcessConfigurationDTO.StepDTO.builder()
                .id(step.getId())
                .stepCode(step.getStepCode())
                .stepNameKey(step.getStepNameKey())
                .stepDescriptionKey(step.getStepDescriptionKey())
                .phase(step.getPhase())
                .displayOrder(step.getDisplayOrder())
                .icon(step.getIcon())
                .color(step.getColor())
                .showInWizard(step.getShowInWizard())
                .showInExpert(step.getShowInExpert())
                .requiredRole(step.getRequiredRole())
                .sections(sectionDTOs)
                .build();
    }

    private CPProcessConfigurationDTO.SectionDTO mapSectionToDTO(CPProcessSectionConfig section) {
        List<CPProcessConfigurationDTO.FieldDTO> fieldDTOs = section.getFields().stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()))
                .sorted(Comparator.comparing(CPProcessFieldConfig::getDisplayOrder))
                .map(this::mapFieldToDTO)
                .collect(Collectors.toList());

        return CPProcessConfigurationDTO.SectionDTO.builder()
                .id(section.getId())
                .sectionCode(section.getSectionCode())
                .sectionNameKey(section.getSectionNameKey())
                .sectionDescriptionKey(section.getSectionDescriptionKey())
                .sectionType(section.getSectionType())
                .minRows(section.getMinRows())
                .maxRows(section.getMaxRows())
                .displayOrder(section.getDisplayOrder())
                .columnsCount(section.getColumnsCount())
                .collapsible(section.getCollapsible())
                .defaultCollapsed(section.getDefaultCollapsed())
                .fields(fieldDTOs)
                .build();
    }

    private CPProcessConfigurationDTO.FieldDTO mapFieldToDTO(CPProcessFieldConfig field) {
        return CPProcessConfigurationDTO.FieldDTO.builder()
                .id(field.getId())
                .fieldCode(field.getFieldCode())
                .fieldNameKey(field.getFieldNameKey())
                .fieldDescriptionKey(field.getFieldDescriptionKey())
                .fieldType(field.getFieldType())
                .componentType(field.getComponentType())
                .dataSourceType(field.getDataSourceType())
                .dataSourceCode(field.getDataSourceCode())
                .dataSourceFilters(field.getDataSourceFilters())
                .displayOrder(field.getDisplayOrder())
                .placeholderKey(field.getPlaceholderKey())
                .helpTextKey(field.getHelpTextKey())
                .isRequired(field.getIsRequired())
                .requiredCondition(field.getRequiredCondition())
                .validationRules(field.getValidationRules())
                .dependencies(field.getDependencies())
                .fieldOptions(field.getFieldOptions())
                .defaultValue(field.getDefaultValue())
                .defaultValueExpression(field.getDefaultValueExpression())
                .legalReference(field.getLegalReference())
                .aiAssistEnabled(field.getAiAssistEnabled())
                .mapsToExternalField(field.getMapsToExternalField())
                .showInWizard(field.getShowInWizard())
                .showInExpert(field.getShowInExpert())
                .showInView(field.getShowInView())
                .showInList(field.getShowInList())
                .build();
    }
}
