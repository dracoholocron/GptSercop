package com.globalcmx.api.clientportal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Request DTO for creating a new client request.
 */
public class CreateSolicitudRequest {

    @NotBlank(message = "Product type is required")
    private String productoType;

    private String productoSubtype;

    private BigDecimal monto;

    private String moneda;

    private String priority;

    private Map<String, Object> customData;

    // Getters and Setters
    public String getProductoType() {
        return productoType;
    }

    public void setProductoType(String productoType) {
        this.productoType = productoType;
    }

    public String getProductoSubtype() {
        return productoSubtype;
    }

    public void setProductoSubtype(String productoSubtype) {
        this.productoSubtype = productoSubtype;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public Map<String, Object> getCustomData() {
        return customData;
    }

    public void setCustomData(Map<String, Object> customData) {
        this.customData = customData;
    }
}
