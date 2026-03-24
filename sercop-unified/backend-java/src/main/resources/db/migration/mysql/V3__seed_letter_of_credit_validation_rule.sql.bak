-- ============================================================================
-- INSERCIÓN DE REGLA DE VALIDACIÓN DE CARTA DE CRÉDITO
-- Regla: letter-of-credit-validation.drl
-- Evento: PRE_CREATED
-- ============================================================================

INSERT INTO event_rules_read_model (
    id,
    code,
    name,
    description,
    operation_type,
    trigger_event,
    conditions_drl,
    actions_json,
    priority,
    active,
    created_at,
    updated_at,
    created_by,
    updated_by,
    aggregate_id,
    version
) VALUES (
    1,
    'LC_VALIDATION_PRE_CREATE',
    'Validación de Carta de Crédito Pre-Creación',
    'Conjunto de 10 reglas de validación de negocio para Cartas de Crédito que se ejecutan ANTES de guardar el evento en el EventStore. Incluye validaciones de fechas, montos, porcentajes, bancos confirmadores, beneficiarios y participantes según estándares UCP 600.',
    'LETTER_OF_CREDIT',
    'PRE_CREATED',
    'package com.globalcmx.validation

import com.globalcmx.api.dto.command.CreateLetterOfCreditCommand
import com.globalcmx.api.validation.ValidationResult
import java.math.BigDecimal
import java.time.LocalDate

global Boolean isDraft

// ============================================================================
// REGLAS DE VALIDACIÓN PARA CARTAS DE CRÉDITO
// ============================================================================

rule "Validar que fecha de vencimiento sea posterior a fecha de emisión"
    when
        command : CreateLetterOfCreditCommand(
            fechaEmision != null,
            fechaVencimiento != null,
            fechaVencimiento <= fechaEmision
        )
        result : ValidationResult()
    then
        result.addError("La fecha de vencimiento debe ser posterior a la fecha de emisión");
end

rule "Validar que fecha de último embarque sea antes de fecha de vencimiento"
    when
        command : CreateLetterOfCreditCommand(
            fechaUltimoEmbarque != null,
            fechaVencimiento != null,
            fechaUltimoEmbarque > fechaVencimiento
        )
        result : ValidationResult()
    then
        result.addError("La fecha de último embarque no puede ser posterior a la fecha de vencimiento");
end

rule "Validar que el monto sea positivo"
    when
        command : CreateLetterOfCreditCommand(
            monto != null,
            monto <= BigDecimal.ZERO
        )
        result : ValidationResult()
    then
        result.addError("El monto debe ser mayor a cero.");
end

rule "Validar porcentaje de tolerancia dentro de rango válido"
    when
        command : CreateLetterOfCreditCommand(
            porcentajeTolerancia != null,
            porcentajeTolerancia < BigDecimal.ZERO || porcentajeTolerancia > new BigDecimal("100")
        )
        result : ValidationResult()
    then
        result.addError("El porcentaje de tolerancia debe estar entre 0 y 100");
end

rule "Validar que LC confirmada requiera banco confirmador"
    when
        command : CreateLetterOfCreditCommand(
            tipoLc == "CONFIRMADA",
            bancoConfirmadorId == null
        )
        result : ValidationResult()
    then
        result.addError("Una carta de crédito confirmada requiere un banco confirmador");
end

rule "Validar que LC transferible requiera beneficiario"
    when
        command : CreateLetterOfCreditCommand(
            tipoLc == "TRANSFERIBLE",
            beneficiarioId == null
        )
        result : ValidationResult()
    then
        result.addError("Una carta de crédito transferible requiere un beneficiario");
end

rule "Validar plazo mínimo de vigencia (30 días)"
    when
        command : CreateLetterOfCreditCommand(
            fechaEmision != null,
            fechaVencimiento != null,
            $diasVigencia : fechaVencimiento.toEpochDay() - fechaEmision.toEpochDay() < 30
        )
        result : ValidationResult()
    then
        result.addError("La carta de crédito debe tener una vigencia mínima de 30 días");
end

rule "Validar monto máximo según modalidad"
    when
        command : CreateLetterOfCreditCommand(
            modalidad == "IMPORTACION",
            monto != null,
            monto > new BigDecimal("10000000")
        )
        result : ValidationResult()
    then
        result.addError("El monto máximo para importación es $10,000,000");
end

rule "Validar que LC con pago a la vista no tenga fecha de último embarque futura lejana"
    when
        command : CreateLetterOfCreditCommand(
            formaPago == "A_LA_VISTA",
            fechaEmision != null,
            fechaUltimoEmbarque != null,
            fechaUltimoEmbarque.toEpochDay() - fechaEmision.toEpochDay() > 180
        )
        result : ValidationResult()
    then
        result.addError("Para pago a la vista, el último embarque no puede ser más de 6 meses después de la emisión");
end

rule "Validar que el ordenante y beneficiario sean diferentes"
    when
        command : CreateLetterOfCreditCommand(
            ordenanteId != null,
            beneficiarioId != null,
            ordenanteId == beneficiarioId
        )
        result : ValidationResult()
    then
        result.addError("El ordenante y el beneficiario no pueden ser la misma entidad");
end
',
    '[
  {
    "type": "VALIDATE",
    "description": "Ejecutar validaciones de negocio con Drools",
    "onError": "REJECT_COMMAND"
  },
  {
    "type": "LOG",
    "level": "INFO",
    "message": "Validaciones de negocio ejecutadas correctamente"
  }
]',
    100,
    true,
    NOW(),
    NOW(),
    'system',
    'system',
    'CARTA_CREDITO',
    0
);
