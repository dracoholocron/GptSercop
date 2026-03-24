package com.globalcmx.api.externalapi.service;

import com.globalcmx.api.externalapi.dto.command.*;
import com.globalcmx.api.externalapi.dto.query.*;
import com.globalcmx.api.externalapi.entity.*;
import com.globalcmx.api.externalapi.repository.*;
import com.globalcmx.api.readmodel.repository.TemplateVariableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalApiMappingService {

    private final ExternalApiRequestMappingRepository requestMappingRepository;
    private final ExternalApiResponseMappingRepository responseMappingRepository;
    private final ExternalApiResponseListenerRepository listenerRepository;
    private final ExternalApiConfigRepository configRepository;
    private final TemplateVariableRepository variableRepository;

    // ==================== REQUEST MAPPINGS ====================

    @Transactional(readOnly = true)
    public List<RequestMappingDTO> getRequestMappings(Long apiConfigId) {
        return requestMappingRepository.findByApiConfigIdOrderByDisplayOrderAsc(apiConfigId)
                .stream()
                .map(this::toRequestMappingDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RequestMappingDTO createRequestMapping(CreateRequestMappingCommand command) {
        if (!configRepository.existsById(command.getApiConfigId())) {
            throw new IllegalArgumentException("API config not found: " + command.getApiConfigId());
        }

        // Validate based on source type
        if (!command.isValid()) {
            throw new IllegalArgumentException("Invalid mapping: required field missing for source type " + command.getSourceType());
        }

        ExternalApiRequestMapping mapping = ExternalApiRequestMapping.builder()
                .apiConfigId(command.getApiConfigId())
                .sourceType(command.getSourceType() != null ?
                        ExternalApiRequestMapping.SourceType.valueOf(command.getSourceType()) :
                        ExternalApiRequestMapping.SourceType.TEMPLATE_VARIABLE)
                .variableCode(command.getVariableCode())
                .constantValue(command.getConstantValue())
                .calculatedExpression(command.getCalculatedExpression())
                .apiParameterName(command.getParameterName())
                .parameterLocation(ExternalApiRequestMapping.ParameterLocation.valueOf(command.getParameterLocation()))
                .defaultValue(command.getDefaultValue())
                .isRequired(command.getRequired() != null ? command.getRequired() : false)
                .transformationType(command.getTransformationType() != null ?
                        ExternalApiRequestMapping.TransformationType.valueOf(command.getTransformationType()) :
                        ExternalApiRequestMapping.TransformationType.NONE)
                .transformationPattern(command.getTransformationPattern())
                .displayOrder(command.getDisplayOrder() != null ? command.getDisplayOrder() : 0)
                .isActive(command.getActive() != null ? command.getActive() : true)
                .build();

        ExternalApiRequestMapping saved = requestMappingRepository.save(mapping);
        log.info("Created request mapping {} for API config {} (source: {})", saved.getId(), command.getApiConfigId(), command.getSourceType());
        return toRequestMappingDTO(saved);
    }

    @Transactional
    public RequestMappingDTO updateRequestMapping(Long id, CreateRequestMappingCommand command) {
        ExternalApiRequestMapping mapping = requestMappingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Request mapping not found: " + id));

        // Validate based on source type
        if (!command.isValid()) {
            throw new IllegalArgumentException("Invalid mapping: required field missing for source type " + command.getSourceType());
        }

        mapping.setSourceType(command.getSourceType() != null ?
                ExternalApiRequestMapping.SourceType.valueOf(command.getSourceType()) :
                ExternalApiRequestMapping.SourceType.TEMPLATE_VARIABLE);
        mapping.setVariableCode(command.getVariableCode());
        mapping.setConstantValue(command.getConstantValue());
        mapping.setCalculatedExpression(command.getCalculatedExpression());
        mapping.setApiParameterName(command.getParameterName());
        mapping.setParameterLocation(ExternalApiRequestMapping.ParameterLocation.valueOf(command.getParameterLocation()));
        mapping.setDefaultValue(command.getDefaultValue());
        mapping.setIsRequired(command.getRequired() != null ? command.getRequired() : false);
        mapping.setTransformationType(command.getTransformationType() != null ?
                ExternalApiRequestMapping.TransformationType.valueOf(command.getTransformationType()) :
                ExternalApiRequestMapping.TransformationType.NONE);
        mapping.setTransformationPattern(command.getTransformationPattern());
        mapping.setDisplayOrder(command.getDisplayOrder() != null ? command.getDisplayOrder() : 0);
        mapping.setIsActive(command.getActive() != null ? command.getActive() : true);

        ExternalApiRequestMapping saved = requestMappingRepository.save(mapping);
        log.info("Updated request mapping {}", id);
        return toRequestMappingDTO(saved);
    }

    @Transactional
    public void deleteRequestMapping(Long id) {
        requestMappingRepository.deleteById(id);
        log.info("Deleted request mapping {}", id);
    }

    // ==================== RESPONSE MAPPINGS ====================

    @Transactional(readOnly = true)
    public List<ResponseMappingDTO> getResponseMappings(Long apiConfigId) {
        return responseMappingRepository.findByApiConfigIdOrderByDisplayOrderAsc(apiConfigId)
                .stream()
                .map(this::toResponseMappingDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResponseMappingDTO createResponseMapping(CreateResponseMappingCommand command) {
        if (!configRepository.existsById(command.getApiConfigId())) {
            throw new IllegalArgumentException("API config not found: " + command.getApiConfigId());
        }

        ExternalApiResponseMapping mapping = ExternalApiResponseMapping.builder()
                .apiConfigId(command.getApiConfigId())
                .internalName(command.getFieldName())
                .responseJsonPath(command.getJsonPath())
                .dataType(command.getDataType() != null ?
                        ExternalApiResponseMapping.DataType.valueOf(command.getDataType()) :
                        ExternalApiResponseMapping.DataType.STRING)
                .defaultValue(command.getDefaultValue())
                .isRequired(command.getRequired() != null ? command.getRequired() : false)
                .transformationType(command.getTransformationType() != null ?
                        ExternalApiResponseMapping.TransformationType.valueOf(command.getTransformationType()) :
                        ExternalApiResponseMapping.TransformationType.NONE)
                .transformationValue(command.getTransformationPattern())
                .validationRegex(command.getValidationRegex())
                .description(command.getDescription())
                .displayOrder(command.getDisplayOrder() != null ? command.getDisplayOrder() : 0)
                .isActive(command.getActive() != null ? command.getActive() : true)
                .build();

        ExternalApiResponseMapping saved = responseMappingRepository.save(mapping);
        log.info("Created response mapping {} for API config {}", saved.getId(), command.getApiConfigId());
        return toResponseMappingDTO(saved);
    }

    @Transactional
    public ResponseMappingDTO updateResponseMapping(Long id, CreateResponseMappingCommand command) {
        ExternalApiResponseMapping mapping = responseMappingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Response mapping not found: " + id));

        mapping.setInternalName(command.getFieldName());
        mapping.setResponseJsonPath(command.getJsonPath());
        mapping.setDataType(command.getDataType() != null ?
                ExternalApiResponseMapping.DataType.valueOf(command.getDataType()) :
                ExternalApiResponseMapping.DataType.STRING);
        mapping.setDefaultValue(command.getDefaultValue());
        mapping.setIsRequired(command.getRequired() != null ? command.getRequired() : false);
        mapping.setTransformationType(command.getTransformationType() != null ?
                ExternalApiResponseMapping.TransformationType.valueOf(command.getTransformationType()) :
                ExternalApiResponseMapping.TransformationType.NONE);
        mapping.setTransformationValue(command.getTransformationPattern());
        mapping.setValidationRegex(command.getValidationRegex());
        mapping.setDescription(command.getDescription());
        mapping.setDisplayOrder(command.getDisplayOrder() != null ? command.getDisplayOrder() : 0);
        mapping.setIsActive(command.getActive() != null ? command.getActive() : true);

        ExternalApiResponseMapping saved = responseMappingRepository.save(mapping);
        log.info("Updated response mapping {}", id);
        return toResponseMappingDTO(saved);
    }

    @Transactional
    public void deleteResponseMapping(Long id) {
        responseMappingRepository.deleteById(id);
        log.info("Deleted response mapping {}", id);
    }

    // ==================== RESPONSE LISTENERS ====================

    @Transactional(readOnly = true)
    public List<ResponseListenerDTO> getResponseListeners(Long apiConfigId) {
        return listenerRepository.findByApiConfigIdOrderByPriorityAsc(apiConfigId)
                .stream()
                .map(this::toResponseListenerDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResponseListenerDTO createResponseListener(CreateResponseListenerCommand command) {
        if (!configRepository.existsById(command.getApiConfigId())) {
            throw new IllegalArgumentException("API config not found: " + command.getApiConfigId());
        }

        ExternalApiResponseListener listener = ExternalApiResponseListener.builder()
                .apiConfigId(command.getApiConfigId())
                .name(command.getName())
                .description(command.getDescription())
                .actionType(ExternalApiResponseListener.ActionType.valueOf(command.getActionType()))
                .actionConfig(command.getActionConfigJson())
                .executionCondition(command.getConditionExpression())
                .onlyOnSuccess(command.getExecuteOnSuccess() != null ? command.getExecuteOnSuccess() : true)
                .onlyOnFailure(command.getExecuteOnFailure() != null ? command.getExecuteOnFailure() : false)
                .priority(command.getExecutionOrder() != null ? command.getExecutionOrder() : 100)
                .maxRetries(command.getRetryCount() != null ? command.getRetryCount() : 0)
                .retryDelaySeconds(command.getRetryDelayMs() != null ? command.getRetryDelayMs() / 1000 : 60)
                .isActive(command.getActive() != null ? command.getActive() : true)
                .build();

        ExternalApiResponseListener saved = listenerRepository.save(listener);
        log.info("Created response listener {} for API config {}", saved.getId(), command.getApiConfigId());
        return toResponseListenerDTO(saved);
    }

    @Transactional
    public ResponseListenerDTO updateResponseListener(Long id, CreateResponseListenerCommand command) {
        ExternalApiResponseListener listener = listenerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Response listener not found: " + id));

        listener.setName(command.getName());
        listener.setDescription(command.getDescription());
        listener.setActionType(ExternalApiResponseListener.ActionType.valueOf(command.getActionType()));
        listener.setActionConfig(command.getActionConfigJson());
        listener.setExecutionCondition(command.getConditionExpression());
        listener.setOnlyOnSuccess(command.getExecuteOnSuccess() != null ? command.getExecuteOnSuccess() : true);
        listener.setOnlyOnFailure(command.getExecuteOnFailure() != null ? command.getExecuteOnFailure() : false);
        listener.setPriority(command.getExecutionOrder() != null ? command.getExecutionOrder() : 100);
        listener.setMaxRetries(command.getRetryCount() != null ? command.getRetryCount() : 0);
        listener.setRetryDelaySeconds(command.getRetryDelayMs() != null ? command.getRetryDelayMs() / 1000 : 60);
        listener.setIsActive(command.getActive() != null ? command.getActive() : true);

        ExternalApiResponseListener saved = listenerRepository.save(listener);
        log.info("Updated response listener {}", id);
        return toResponseListenerDTO(saved);
    }

    @Transactional
    public void deleteResponseListener(Long id) {
        listenerRepository.deleteById(id);
        log.info("Deleted response listener {}", id);
    }

    // ==================== MAPPERS ====================

    private RequestMappingDTO toRequestMappingDTO(ExternalApiRequestMapping entity) {
        // Only lookup variable name for TEMPLATE_VARIABLE source type
        String variableName = null;
        if (entity.getSourceType() == ExternalApiRequestMapping.SourceType.TEMPLATE_VARIABLE
                && entity.getVariableCode() != null) {
            variableName = variableRepository.findByCode(entity.getVariableCode())
                    .map(v -> v.getLabelKey())
                    .orElse(entity.getVariableCode());
        }

        return RequestMappingDTO.builder()
                .id(entity.getId())
                .apiConfigId(entity.getApiConfigId())
                .sourceType(entity.getSourceType() != null ? entity.getSourceType().name() : "TEMPLATE_VARIABLE")
                .variableCode(entity.getVariableCode())
                .variableName(variableName)
                .constantValue(entity.getConstantValue())
                .calculatedExpression(entity.getCalculatedExpression())
                .parameterName(entity.getApiParameterName())
                .parameterLocation(entity.getParameterLocation().name())
                .defaultValue(entity.getDefaultValue())
                .required(entity.getIsRequired())
                .transformationType(entity.getTransformationType() != null ? entity.getTransformationType().name() : null)
                .transformationPattern(entity.getTransformationPattern())
                .displayOrder(entity.getDisplayOrder())
                .active(entity.getIsActive())
                .build();
    }

    private ResponseMappingDTO toResponseMappingDTO(ExternalApiResponseMapping entity) {
        return ResponseMappingDTO.builder()
                .id(entity.getId())
                .apiConfigId(entity.getApiConfigId())
                .fieldName(entity.getInternalName())
                .jsonPath(entity.getResponseJsonPath())
                .dataType(entity.getDataType() != null ? entity.getDataType().name() : null)
                .defaultValue(entity.getDefaultValue())
                .required(entity.getIsRequired())
                .transformationType(entity.getTransformationType() != null ? entity.getTransformationType().name() : null)
                .transformationPattern(entity.getTransformationValue())
                .validationRegex(entity.getValidationRegex())
                .description(entity.getDescription())
                .displayOrder(entity.getDisplayOrder())
                .active(entity.getIsActive())
                .build();
    }

    private ResponseListenerDTO toResponseListenerDTO(ExternalApiResponseListener entity) {
        return ResponseListenerDTO.builder()
                .id(entity.getId())
                .apiConfigId(entity.getApiConfigId())
                .name(entity.getName())
                .description(entity.getDescription())
                .actionType(entity.getActionType().name())
                .actionConfigJson(entity.getActionConfig())
                .conditionExpression(entity.getExecutionCondition())
                .executeOnSuccess(entity.getOnlyOnSuccess())
                .executeOnFailure(entity.getOnlyOnFailure())
                .executeAsync(true) // No field in entity, default to true
                .executionOrder(entity.getPriority())
                .retryCount(entity.getMaxRetries())
                .retryDelayMs(entity.getRetryDelaySeconds() * 1000)
                .active(entity.getIsActive())
                .build();
    }
}
