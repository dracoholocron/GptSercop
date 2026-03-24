package com.globalcmx.api.dto.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCurrencyCommand {

    @NotBlank(message = "El código de la moneda es requerido")
    @Size(min = 3, max = 3, message = "El código debe tener exactamente 3 caracteres")
    private String codigo;

    @NotBlank(message = "El nombre de la moneda es requerido")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;

    @Size(max = 50, message = "El símbolo no puede exceder 50 caracteres")
    private String simbolo;

    private Boolean activo = true;

    private String createdBy;
}
