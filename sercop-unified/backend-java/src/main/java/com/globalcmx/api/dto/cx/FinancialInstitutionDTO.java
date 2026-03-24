package com.globalcmx.api.dto.cx;

import com.globalcmx.api.model.cx.FinancialInstitution;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialInstitutionDTO {

    private Long id;

    @NotBlank(message = "El código es requerido")
    @Size(max = 50)
    private String codigo;

    @NotBlank(message = "El nombre es requerido")
    @Size(max = 200)
    private String nombre;

    @Size(max = 11)
    private String swiftCode;

    @Size(max = 3)
    private String pais;

    @Size(max = 100)
    private String ciudad;

    private String direccion;

    @NotBlank(message = "El tipo es requerido")
    private String tipo;

    @Size(max = 10)
    private String rating;

    private Boolean esCorresponsal;

    private Boolean activo;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Método para convertir desde Entity
    public static FinancialInstitutionDTO fromEntity(FinancialInstitution entity) {
        return FinancialInstitutionDTO.builder()
                .id(entity.getId())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .swiftCode(entity.getSwiftCode())
                .pais(entity.getPais())
                .ciudad(entity.getCiudad())
                .direccion(entity.getDireccion())
                .tipo(entity.getTipo() != null ? entity.getTipo().name() : null)
                .rating(entity.getRating())
                .esCorresponsal(entity.getEsCorresponsal())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // Método para convertir a Entity
    public FinancialInstitution toEntity() {
        return FinancialInstitution.builder()
                .id(this.id)
                .codigo(this.codigo)
                .nombre(this.nombre)
                .swiftCode(this.swiftCode)
                .pais(this.pais)
                .ciudad(this.ciudad)
                .direccion(this.direccion)
                .tipo(this.tipo != null ? FinancialInstitution.TipoInstitucion.valueOf(this.tipo) : null)
                .rating(this.rating)
                .esCorresponsal(this.esCorresponsal != null ? this.esCorresponsal : false)
                .activo(this.activo != null ? this.activo : true)
                .build();
    }
}
