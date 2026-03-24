package com.globalcmx.api.service.plantilla;

import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Servicio que resuelve los datos de una garantía bancaria para plantillas
 * Usa OperationReadModel como fuente de datos
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuaranteeTemplateDataResolver {

    private final OperationReadModelRepository operationRepository;
    private final ParticipanteReadModelRepository participanteRepository;
    private final FinancialInstitutionReadModelRepository financialInstitutionRepository;
    private final NumberToWordsService numberToWordsService;

    private static final DateTimeFormatter DATE_FORMAT_ES = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", new java.util.Locale("es", "ES"));
    private static final DateTimeFormatter DATE_FORMAT_EN = DateTimeFormatter.ofPattern("MMMM dd, yyyy", java.util.Locale.ENGLISH);
    private static final DateTimeFormatter DATE_FORMAT_SHORT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Resuelve los datos de una garantía por su referencia
     * @param reference Referencia de la operación (numero de garantía)
     * @param language Idioma (ES o EN)
     * @return Mapa de variables para la plantilla
     */
    public Map<String, Object> resolve(String reference, String language) {
        OperationReadModel operation = operationRepository.findByReference(reference)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + reference));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + reference);
        }

        return resolveFromOperation(operation, language);
    }

    /**
     * Resuelve los datos de una garantía por ID de operación
     * @param operationId ID de la operación
     * @param language Idioma (ES o EN)
     * @return Mapa de variables para la plantilla
     */
    public Map<String, Object> resolveById(Long operationId, String language) {
        OperationReadModel operation = operationRepository.findById(operationId)
            .orElseThrow(() -> new IllegalArgumentException("Operación no encontrada: " + operationId));

        if (!"GUARANTEE".equals(operation.getProductType())) {
            throw new IllegalArgumentException("La operación no es una garantía: " + operationId);
        }

        return resolveFromOperation(operation, language);
    }

    /**
     * Resuelve los datos de una garantía desde OperationReadModel
     * @param operation Modelo de operación
     * @param language Idioma (ES o EN)
     * @return Mapa de variables para la plantilla
     */
    public Map<String, Object> resolveFromOperation(OperationReadModel operation, String language) {
        Map<String, Object> data = new HashMap<>();
        boolean isSpanish = "ES".equalsIgnoreCase(language);
        DateTimeFormatter dateFormat = isSpanish ? DATE_FORMAT_ES : DATE_FORMAT_EN;

        // === Datos básicos de la garantía ===
        data.put("numeroGarantia", operation.getReference());
        data.put("referencia", operation.getReference());
        data.put("tipo", "GUARANTEE");
        data.put("subtipo", "PERFORMANCE_BOND");
        data.put("estado", operation.getStatus());
        data.put("tipoDescripcion", getGuaranteeTypeDescription("PERFORMANCE", isSpanish));

        // === Montos ===
        BigDecimal monto = operation.getAmount() != null ? operation.getAmount() : BigDecimal.ZERO;
        String moneda = operation.getCurrency() != null ? operation.getCurrency() : "USD";

        data.put("moneda", moneda);
        data.put("monto", monto);
        data.put("montoFormateado", String.format("%s %,.2f", moneda, monto));
        data.put("montoLetras", isSpanish ?
            numberToWordsService.convertToSpanish(monto, moneda) :
            numberToWordsService.convertToEnglish(monto, moneda));
        data.put("montoConLetras", numberToWordsService.formatAmountWithWords(monto, moneda, language));
        data.put("porcentajeProyecto", "");
        data.put("porcentajeFormateado", "");

        // === Fechas ===
        data.put("fechaEmision", formatDate(operation.getIssueDate(), dateFormat));
        data.put("fechaEmisionCorta", formatDate(operation.getIssueDate(), DATE_FORMAT_SHORT));
        data.put("fechaVencimiento", formatDate(operation.getExpiryDate(), dateFormat));
        data.put("fechaVencimientoCorta", formatDate(operation.getExpiryDate(), DATE_FORMAT_SHORT));
        data.put("fechaActual", formatDate(LocalDate.now(), dateFormat));

        // === Datos del contrato ===
        data.put("numeroContrato", "");
        data.put("objetoContrato", "");
        data.put("descripcion", "");
        data.put("montoContrato", "");
        data.put("montoContratoFormateado", "");
        data.put("montoContratoLetras", "");

        // === Condiciones ===
        data.put("condicionesEjecucion", "");
        data.put("condicionesLiberacion", "");
        data.put("esReducible", false);
        data.put("formulaReduccion", "");

        // === Partes: Ordenante (Applicant) ===
        if (operation.getApplicantId() != null) {
            resolveOrdenante(data, operation.getApplicantId());
        } else if (operation.getApplicantName() != null) {
            data.put("ordenanteNombre", operation.getApplicantName());
            data.put("applicantName", operation.getApplicantName());
            setEmptyOrdenanteFields(data);
        } else {
            setEmptyOrdenante(data);
        }

        // === Partes: Beneficiario ===
        if (operation.getBeneficiaryId() != null) {
            resolveBeneficiario(data, operation.getBeneficiaryId());
        } else if (operation.getBeneficiaryName() != null) {
            data.put("beneficiarioNombre", operation.getBeneficiaryName());
            data.put("beneficiaryName", operation.getBeneficiaryName());
            setEmptyBeneficiarioFields(data);
        } else {
            setEmptyBeneficiario(data);
        }

        // === Partes: Banco Garante (Issuing Bank) ===
        if (operation.getIssuingBankId() != null) {
            resolveBancoGarante(data, operation.getIssuingBankId());
        } else if (operation.getIssuingBankBic() != null) {
            financialInstitutionRepository.findBySwiftCode(operation.getIssuingBankBic())
                .ifPresentOrElse(
                    banco -> {
                        data.put("bancoGaranteNombre", banco.getNombre());
                        data.put("bancoGaranteSwift", banco.getSwiftCode());
                        data.put("bancoGaranteDireccion", banco.getDireccion() != null ? banco.getDireccion() : "");
                        data.put("bancoGarantePais", banco.getPais() != null ? banco.getPais() : "");
                        data.put("bancoGaranteCiudad", banco.getCiudad() != null ? banco.getCiudad() : "");
                        data.put("issuingBankName", banco.getNombre());
                        data.put("issuingBankSwift", banco.getSwiftCode());
                        data.put("issuingBankAddress", banco.getDireccion() != null ? banco.getDireccion() : "");
                    },
                    () -> {
                        data.put("bancoGaranteSwift", operation.getIssuingBankBic());
                        data.put("issuingBankSwift", operation.getIssuingBankBic());
                        setEmptyBancoGaranteFields(data);
                    }
                );
        } else {
            setEmptyBancoGarante(data);
        }

        // === Partes: Banco Contragarante (Advising Bank) ===
        if (operation.getAdvisingBankId() != null) {
            resolveBancoContragarante(data, operation.getAdvisingBankId());
        } else {
            setEmptyBancoContragarante(data);
        }

        // === Idioma ===
        data.put("idioma", language);
        data.put("esEspanol", isSpanish);

        // === Textos legales predeterminados ===
        addDefaultLegalTexts(data, isSpanish);

        log.info("Datos resueltos desde operación {}: {} variables", operation.getReference(), data.size());
        return data;
    }

    private void resolveOrdenante(Map<String, Object> data, Long ordenanteId) {
        Optional<ParticipanteReadModel> ordenanteOpt = participanteRepository.findById(ordenanteId);
        if (ordenanteOpt.isPresent()) {
            ParticipanteReadModel ordenante = ordenanteOpt.get();
            String nombreCompleto = (ordenante.getNombres() + " " + ordenante.getApellidos()).trim();
            data.put("ordenanteId", ordenanteId);
            data.put("ordenanteNombre", nombreCompleto);
            data.put("ordenanteDireccion", ordenante.getDireccion() != null ? ordenante.getDireccion() : "");
            data.put("ordenanteIdentificacion", ordenante.getIdentificacion() != null ? ordenante.getIdentificacion() : "");
            data.put("ordenanteEmail", ordenante.getEmail() != null ? ordenante.getEmail() : "");
            data.put("ordenanteTelefono", ordenante.getTelefono() != null ? ordenante.getTelefono() : "");
            data.put("applicantName", nombreCompleto);
            data.put("applicantAddress", ordenante.getDireccion() != null ? ordenante.getDireccion() : "");
        } else {
            setEmptyOrdenante(data);
        }
    }

    private void setEmptyOrdenanteFields(Map<String, Object> data) {
        data.put("ordenanteId", "");
        data.put("ordenanteDireccion", "");
        data.put("ordenanteIdentificacion", "");
        data.put("ordenanteEmail", "");
        data.put("ordenanteTelefono", "");
        data.put("applicantAddress", "");
    }

    private void setEmptyOrdenante(Map<String, Object> data) {
        data.put("ordenanteId", "");
        data.put("ordenanteNombre", "");
        data.put("ordenanteDireccion", "");
        data.put("ordenanteIdentificacion", "");
        data.put("ordenanteEmail", "");
        data.put("ordenanteTelefono", "");
        data.put("applicantName", "");
        data.put("applicantAddress", "");
    }

    private void resolveBeneficiario(Map<String, Object> data, Long beneficiarioId) {
        Optional<ParticipanteReadModel> beneficiarioOpt = participanteRepository.findById(beneficiarioId);
        if (beneficiarioOpt.isPresent()) {
            ParticipanteReadModel beneficiario = beneficiarioOpt.get();
            String nombreCompleto = (beneficiario.getNombres() + " " + beneficiario.getApellidos()).trim();
            data.put("beneficiarioId", beneficiarioId);
            data.put("beneficiarioNombre", nombreCompleto);
            data.put("beneficiarioDireccion", beneficiario.getDireccion() != null ? beneficiario.getDireccion() : "");
            data.put("beneficiarioIdentificacion", beneficiario.getIdentificacion() != null ? beneficiario.getIdentificacion() : "");
            data.put("beneficiarioEmail", beneficiario.getEmail() != null ? beneficiario.getEmail() : "");
            data.put("beneficiarioTelefono", beneficiario.getTelefono() != null ? beneficiario.getTelefono() : "");
            data.put("beneficiaryName", nombreCompleto);
            data.put("beneficiaryAddress", beneficiario.getDireccion() != null ? beneficiario.getDireccion() : "");
        } else {
            setEmptyBeneficiario(data);
        }
    }

    private void setEmptyBeneficiarioFields(Map<String, Object> data) {
        data.put("beneficiarioId", "");
        data.put("beneficiarioDireccion", "");
        data.put("beneficiarioIdentificacion", "");
        data.put("beneficiarioEmail", "");
        data.put("beneficiarioTelefono", "");
        data.put("beneficiaryAddress", "");
    }

    private void setEmptyBeneficiario(Map<String, Object> data) {
        data.put("beneficiarioId", "");
        data.put("beneficiarioNombre", "");
        data.put("beneficiarioDireccion", "");
        data.put("beneficiarioIdentificacion", "");
        data.put("beneficiarioEmail", "");
        data.put("beneficiarioTelefono", "");
        data.put("beneficiaryName", "");
        data.put("beneficiaryAddress", "");
    }

    private void resolveBancoGarante(Map<String, Object> data, Long bancoGaranteId) {
        Optional<FinancialInstitutionReadModel> bancoOpt = financialInstitutionRepository.findById(bancoGaranteId);
        if (bancoOpt.isPresent()) {
            FinancialInstitutionReadModel banco = bancoOpt.get();
            data.put("bancoGaranteId", bancoGaranteId);
            data.put("bancoGaranteNombre", banco.getNombre() != null ? banco.getNombre() : "");
            data.put("bancoGaranteSwift", banco.getSwiftCode() != null ? banco.getSwiftCode() : "");
            data.put("bancoGaranteDireccion", banco.getDireccion() != null ? banco.getDireccion() : "");
            data.put("bancoGarantePais", banco.getPais() != null ? banco.getPais() : "");
            data.put("bancoGaranteCiudad", banco.getCiudad() != null ? banco.getCiudad() : "");
            data.put("issuingBankName", banco.getNombre() != null ? banco.getNombre() : "");
            data.put("issuingBankSwift", banco.getSwiftCode() != null ? banco.getSwiftCode() : "");
            data.put("issuingBankAddress", banco.getDireccion() != null ? banco.getDireccion() : "");
        } else {
            setEmptyBancoGarante(data);
        }
    }

    private void setEmptyBancoGaranteFields(Map<String, Object> data) {
        data.put("bancoGaranteId", "");
        data.put("bancoGaranteNombre", "");
        data.put("bancoGaranteDireccion", "");
        data.put("bancoGarantePais", "");
        data.put("bancoGaranteCiudad", "");
        data.put("issuingBankName", "");
        data.put("issuingBankAddress", "");
    }

    private void setEmptyBancoGarante(Map<String, Object> data) {
        data.put("bancoGaranteId", "");
        data.put("bancoGaranteNombre", "");
        data.put("bancoGaranteSwift", "");
        data.put("bancoGaranteDireccion", "");
        data.put("bancoGarantePais", "");
        data.put("bancoGaranteCiudad", "");
        data.put("issuingBankName", "");
        data.put("issuingBankSwift", "");
        data.put("issuingBankAddress", "");
    }

    private void resolveBancoContragarante(Map<String, Object> data, Long bancoContragaranteId) {
        Optional<FinancialInstitutionReadModel> bancoOpt = financialInstitutionRepository.findById(bancoContragaranteId);
        if (bancoOpt.isPresent()) {
            FinancialInstitutionReadModel banco = bancoOpt.get();
            data.put("bancoContragaranteId", bancoContragaranteId);
            data.put("bancoContragaranteNombre", banco.getNombre() != null ? banco.getNombre() : "");
            data.put("bancoContragaranteSwift", banco.getSwiftCode() != null ? banco.getSwiftCode() : "");
            data.put("bancoContragaranteDireccion", banco.getDireccion() != null ? banco.getDireccion() : "");
            data.put("counterGuarantorName", banco.getNombre() != null ? banco.getNombre() : "");
            data.put("counterGuarantorSwift", banco.getSwiftCode() != null ? banco.getSwiftCode() : "");
        } else {
            setEmptyBancoContragarante(data);
        }
    }

    private void setEmptyBancoContragarante(Map<String, Object> data) {
        data.put("bancoContragaranteId", "");
        data.put("bancoContragaranteNombre", "");
        data.put("bancoContragaranteSwift", "");
        data.put("bancoContragaranteDireccion", "");
        data.put("counterGuarantorName", "");
        data.put("counterGuarantorSwift", "");
    }

    private String formatDate(LocalDate date, DateTimeFormatter formatter) {
        if (date == null) return "";
        try {
            return date.format(formatter);
        } catch (Exception e) {
            return date.toString();
        }
    }

    private String getGuaranteeTypeDescription(String subtipo, boolean isSpanish) {
        if (subtipo == null) return "";

        Map<String, String[]> descriptions = new HashMap<>();
        descriptions.put("ADVANCE_PAYMENT", new String[]{"Garantía de Anticipo", "Advance Payment Guarantee"});
        descriptions.put("PERFORMANCE", new String[]{"Garantía de Cumplimiento", "Performance Bond"});
        descriptions.put("BID_BOND", new String[]{"Garantía de Licitación", "Bid Bond"});
        descriptions.put("PAYMENT", new String[]{"Garantía de Pago", "Payment Guarantee"});
        descriptions.put("WARRANTY", new String[]{"Garantía de Calidad", "Warranty Bond"});
        descriptions.put("COUNTER", new String[]{"Contragarantía", "Counter Guarantee"});
        descriptions.put("CUSTOMS", new String[]{"Garantía Aduanera", "Customs Bond"});
        descriptions.put("CREDIT", new String[]{"Garantía de Crédito", "Credit Guarantee"});
        descriptions.put("RETENTION", new String[]{"Garantía de Retención", "Retention Bond"});
        descriptions.put("OTHER", new String[]{"Otra Garantía", "Other Guarantee"});

        String[] desc = descriptions.get(subtipo);
        if (desc != null) {
            return isSpanish ? desc[0] : desc[1];
        }
        return subtipo;
    }

    private void addDefaultLegalTexts(Map<String, Object> data, boolean isSpanish) {
        if (isSpanish) {
            data.put("textoIrrevocable", "Esta garantía es irrevocable e incondicional.");
            data.put("textoTransferible", "Esta garantía no es transferible sin autorización previa.");
            data.put("textoJurisdiccion", "Cualquier disputa será resuelta bajo las leyes de la jurisdicción del banco garante.");
            data.put("textoLeyAplicable", "Esta garantía se rige por las Reglas Uniformes para Garantías a Primer Requerimiento (URDG 758) de la Cámara de Comercio Internacional.");
        } else {
            data.put("textoIrrevocable", "This guarantee is irrevocable and unconditional.");
            data.put("textoTransferible", "This guarantee is not transferable without prior authorization.");
            data.put("textoJurisdiccion", "Any dispute shall be resolved under the laws of the guarantor bank's jurisdiction.");
            data.put("textoLeyAplicable", "This guarantee is subject to the Uniform Rules for Demand Guarantees (URDG 758) of the International Chamber of Commerce.");
        }
    }
}
