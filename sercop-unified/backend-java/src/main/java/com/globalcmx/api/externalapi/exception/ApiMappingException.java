package com.globalcmx.api.externalapi.exception;

/**
 * Exception thrown when there is an error in API request/response mapping.
 */
public class ApiMappingException extends RuntimeException {

    public ApiMappingException(String message) {
        super(message);
    }

    public ApiMappingException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ApiMappingException requiredVariableNull(String variableCode, String parameterName) {
        return new ApiMappingException(
                "Required variable '" + variableCode + "' is null for API parameter '" + parameterName + "'");
    }

    public static ApiMappingException requiredResponseFieldNotFound(String jsonPath) {
        return new ApiMappingException(
                "Required response field not found at path: " + jsonPath);
    }

    public static ApiMappingException invalidDataType(String internalName, String expectedType, Object actualValue) {
        return new ApiMappingException(
                "Invalid data type for '" + internalName + "': expected " + expectedType +
                ", got " + (actualValue != null ? actualValue.getClass().getSimpleName() : "null"));
    }

    public static ApiMappingException validationFailed(String internalName, String reason) {
        return new ApiMappingException(
                "Validation failed for '" + internalName + "': " + reason);
    }

    public static ApiMappingException transformationFailed(String fieldName, String transformationType, Throwable cause) {
        return new ApiMappingException(
                "Transformation '" + transformationType + "' failed for field '" + fieldName + "': " + cause.getMessage(),
                cause);
    }
}
