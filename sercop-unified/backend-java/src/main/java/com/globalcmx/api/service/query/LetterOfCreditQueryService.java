package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.LetterOfCreditQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de consulta para cartas de crédito
 * Usa OperationReadModel como fuente de datos (productType = LC_IMPORT o LC_EXPORT)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class LetterOfCreditQueryService {

    private final OperationReadModelRepository operationRepository;

    private static final String LC_IMPORT = "LC_IMPORT";
    private static final String LC_EXPORT = "LC_EXPORT";

    public List<LetterOfCreditQueryDTO> getAllCartasCredito() {
        log.info("Querying all cartas de credito from Operation Read Model");
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_IMPORT);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_EXPORT);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public LetterOfCreditQueryDTO getCartaCreditoById(Long id) {
        log.info("Querying carta de credito by ID from Operation Read Model: {}", id);
        return operationRepository.findById(id)
            .filter(op -> LC_IMPORT.equals(op.getProductType()) || LC_EXPORT.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Carta de crédito no encontrada con ID: " + id));
    }

    public LetterOfCreditQueryDTO getCartaCreditoByNumeroOperacion(String numeroOperacion) {
        log.info("Querying carta de credito by numero operacion from Operation Read Model: {}", numeroOperacion);
        return operationRepository.findByReference(numeroOperacion)
            .filter(op -> LC_IMPORT.equals(op.getProductType()) || LC_EXPORT.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Carta de crédito no encontrada con número de operación: " + numeroOperacion));
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByEstado(String estado) {
        log.info("Querying cartas de credito by estado from Operation Read Model: {}", estado);
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(LC_IMPORT, estado);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(LC_EXPORT, estado);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByTipoLc(String tipoLc) {
        log.info("Querying cartas de credito by tipo LC from Operation Read Model: {}", tipoLc);
        String productType = tipoLc.toUpperCase().contains("EXPORT") ? LC_EXPORT : LC_IMPORT;
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(productType)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByModalidad(String modalidad) {
        log.info("Querying cartas de credito by modalidad from Operation Read Model: {}", modalidad);
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_IMPORT);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_EXPORT);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .filter(op -> modalidad.equals(op.getStage()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByOrdenante(Long ordenanteId) {
        log.info("Querying cartas de credito by ordenante from Operation Read Model: {}", ordenanteId);
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_IMPORT);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_EXPORT);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .filter(op -> ordenanteId.equals(op.getApplicantId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByBeneficiario(Long beneficiarioId) {
        log.info("Querying cartas de credito by beneficiario from Operation Read Model: {}", beneficiarioId);
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_IMPORT);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_EXPORT);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .filter(op -> beneficiarioId.equals(op.getBeneficiaryId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<LetterOfCreditQueryDTO> getCartasCreditoByParticipante(Long participanteId) {
        log.info("Querying cartas de credito by participante from Operation Read Model: {}", participanteId);
        List<OperationReadModel> lcImport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_IMPORT);
        List<OperationReadModel> lcExport = operationRepository.findByProductTypeOrderByCreatedAtDesc(LC_EXPORT);

        return java.util.stream.Stream.concat(lcImport.stream(), lcExport.stream())
            .filter(op -> participanteId.equals(op.getApplicantId()) ||
                         participanteId.equals(op.getBeneficiaryId()) ||
                         participanteId.equals(op.getIssuingBankId()) ||
                         participanteId.equals(op.getAdvisingBankId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private LetterOfCreditQueryDTO convertToDTO(OperationReadModel operation) {
        return LetterOfCreditQueryDTO.builder()
            .id(operation.getId())
            .numeroOperacion(operation.getReference())
            .tipoLc(operation.getProductType())
            .modalidad(operation.getStage())
            .formaPago(null) // Not stored in operation
            .estado(operation.getStatus())
            .ordenanteId(operation.getApplicantId())
            .beneficiarioId(operation.getBeneficiaryId())
            .bancoEmisorId(operation.getIssuingBankId())
            .bancoAvisadorId(operation.getAdvisingBankId())
            .bancoConfirmadorId(null) // Not stored in operation
            .bancoPagadorId(null) // Not stored in operation
            .moneda(operation.getCurrency())
            .monto(operation.getAmount())
            .montoUtilizado(null) // Not stored in operation
            .porcentajeTolerancia(null) // Not stored in operation
            .fechaEmision(operation.getIssueDate())
            .fechaVencimiento(operation.getExpiryDate())
            .fechaUltimoEmbarque(null) // Not stored in operation
            .lugarEmbarque(null) // Not stored in operation
            .lugarDestino(null) // Not stored in operation
            .requiereFacturaComercial(null)
            .requierePackingList(null)
            .requiereConocimientoEmbarque(null)
            .requiereCertificadoOrigen(null)
            .requiereCertificadoSeguro(null)
            .documentosAdicionales(null)
            .incoterm(null)
            .descripcionMercancia(null)
            .condicionesEspeciales(null)
            .instruccionesEmbarque(null)
            .usuarioCreacion(operation.getCreatedBy())
            .fechaCreacion(operation.getCreatedAt())
            .usuarioModificacion(operation.getModifiedBy())
            .fechaModificacion(operation.getModifiedAt())
            .build();
    }
}
