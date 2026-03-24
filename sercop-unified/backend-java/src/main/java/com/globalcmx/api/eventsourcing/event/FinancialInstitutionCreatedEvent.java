package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class FinancialInstitutionCreatedEvent extends DomainEvent {
    private Long institucionId;
    private String codigo;
    private String nombre;
    private String swiftCode;
    private String pais;
    private String ciudad;
    private String direccion;
    private String tipo;
    private String rating;
    private Boolean esCorresponsal;
    private Boolean activo;

    public FinancialInstitutionCreatedEvent(Long institucionId, String codigo, String nombre,
                                              String swiftCode, String pais, String tipo,
                                              Boolean activo, String performedBy) {
        super("INSTITUCION_FINANCIERA_CREATED", performedBy);
        this.institucionId = institucionId;
        this.codigo = codigo;
        this.nombre = nombre;
        this.swiftCode = swiftCode;
        this.pais = pais;
        this.tipo = tipo;
        this.activo = activo;
    }
}
