package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.DocumentaryCollectionQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de consulta para cobranzas documentarias
 * Usa OperationReadModel como fuente de datos (productType = DOCUMENTARY_COLLECTION)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class DocumentaryCollectionQueryService {

    private final OperationReadModelRepository operationRepository;

    private static final String DOCUMENTARY_COLLECTION = "DOCUMENTARY_COLLECTION";

    public List<DocumentaryCollectionQueryDTO> getAllCobranzasDocumentarias() {
        log.info("Querying all cobranzas documentarias from Operation Read Model");
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public DocumentaryCollectionQueryDTO getCobranzaDocumentariaById(Long id) {
        log.info("Querying cobranza documentaria by ID from Operation Read Model: {}", id);
        return operationRepository.findById(id)
            .filter(op -> DOCUMENTARY_COLLECTION.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Cobranza documentaria no encontrada con ID: " + id));
    }

    public DocumentaryCollectionQueryDTO getCobranzaDocumentariaByNumeroOperacion(String numeroOperacion) {
        log.info("Querying cobranza documentaria by numero operacion from Operation Read Model: {}", numeroOperacion);
        return operationRepository.findByReference(numeroOperacion)
            .filter(op -> DOCUMENTARY_COLLECTION.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Cobranza documentaria no encontrada con número de operación: " + numeroOperacion));
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByTipo(String tipo) {
        log.info("Querying cobranzas documentarias by tipo from Operation Read Model: {}", tipo);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .filter(op -> tipo.equals(op.getMessageType()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByModalidad(String modalidad) {
        log.info("Querying cobranzas documentarias by modalidad from Operation Read Model: {}", modalidad);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .filter(op -> modalidad.equals(op.getStage()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByEstado(String estado) {
        log.info("Querying cobranzas documentarias by estado from Operation Read Model: {}", estado);
        return operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION, estado)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByLibrador(Long libradorId) {
        log.info("Querying cobranzas documentarias by librador from Operation Read Model: {}", libradorId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .filter(op -> libradorId.equals(op.getApplicantId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByLibrado(Long libradoId) {
        log.info("Querying cobranzas documentarias by librado from Operation Read Model: {}", libradoId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .filter(op -> libradoId.equals(op.getBeneficiaryId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<DocumentaryCollectionQueryDTO> getCobranzasDocumentariasByParticipante(Long participanteId) {
        log.info("Querying cobranzas documentarias by participante from Operation Read Model: {}", participanteId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(DOCUMENTARY_COLLECTION)
            .stream()
            .filter(op -> participanteId.equals(op.getApplicantId()) ||
                         participanteId.equals(op.getBeneficiaryId()) ||
                         participanteId.equals(op.getIssuingBankId()) ||
                         participanteId.equals(op.getAdvisingBankId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private DocumentaryCollectionQueryDTO convertToDTO(OperationReadModel operation) {
        return DocumentaryCollectionQueryDTO.builder()
            .id(operation.getId())
            .numeroOperacion(operation.getReference())
            .tipo(operation.getMessageType())
            .modalidad(operation.getStage())
            .estado(operation.getStatus())
            .libradorId(operation.getApplicantId())
            .libradoId(operation.getBeneficiaryId())
            .bancoRemitenteId(operation.getIssuingBankId())
            .bancoCobradorId(operation.getAdvisingBankId())
            .moneda(operation.getCurrency())
            .monto(operation.getAmount())
            .fechaRecepcion(operation.getIssueDate())
            .fechaVencimiento(operation.getExpiryDate())
            .createdAt(operation.getCreatedAt())
            .updatedAt(operation.getModifiedAt())
            .build();
    }
}
