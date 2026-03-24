package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.FinanciamientoCxQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de consulta para financiamientos de comercio exterior
 * Usa OperationReadModel como fuente de datos (productType = TRADE_FINANCING)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class TradeFinancingQueryService {

    private final OperationReadModelRepository operationRepository;

    private static final String TRADE_FINANCING = "TRADE_FINANCING";

    public List<FinanciamientoCxQueryDTO> getAll() {
        log.info("Querying all financiamientos from Operation Read Model");
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(TRADE_FINANCING)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public FinanciamientoCxQueryDTO getById(Long id) {
        log.info("Querying financiamiento by ID from Operation Read Model: {}", id);
        return operationRepository.findById(id)
            .filter(op -> TRADE_FINANCING.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Financiamiento no encontrado con ID: " + id));
    }

    public FinanciamientoCxQueryDTO getByNumeroOperacion(String numeroOperacion) {
        log.info("Querying financiamiento by numero operacion from Operation Read Model: {}", numeroOperacion);
        return operationRepository.findByReference(numeroOperacion)
            .filter(op -> TRADE_FINANCING.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Financiamiento no encontrado con numero de operacion: " + numeroOperacion));
    }

    public List<FinanciamientoCxQueryDTO> getByCliente(Long clienteId) {
        log.info("Querying financiamientos by cliente from Operation Read Model: {}", clienteId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(TRADE_FINANCING)
            .stream()
            .filter(op -> clienteId.equals(op.getApplicantId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinanciamientoCxQueryDTO> getByEstado(String estado) {
        log.info("Querying financiamientos by estado from Operation Read Model: {}", estado);
        return operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(TRADE_FINANCING, estado)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinanciamientoCxQueryDTO> getByTipo(String tipo) {
        log.info("Querying financiamientos by tipo from Operation Read Model: {}", tipo);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(TRADE_FINANCING)
            .stream()
            .filter(op -> tipo.equals(op.getMessageType()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinanciamientoCxQueryDTO> getByLineaCredito(Long lineaCreditoId) {
        log.info("Querying financiamientos by linea credito from Operation Read Model: {}", lineaCreditoId);
        // Note: lineaCreditoId would need to be stored in a suitable field or as part of event data
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(TRADE_FINANCING)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinanciamientoCxQueryDTO> getByOperacionVinculada(String tipo, Long id) {
        log.info("Querying financiamientos by operacion vinculada from Operation Read Model: tipo={}, id={}", tipo, id);
        // Note: operacion vinculada would need to be stored in operation_readmodel or queried from event log
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(TRADE_FINANCING)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private FinanciamientoCxQueryDTO convertToDTO(OperationReadModel operation) {
        return FinanciamientoCxQueryDTO.builder()
            .id(operation.getId())
            .numeroOperacion(operation.getReference())
            .tipo(operation.getMessageType())
            .clienteId(operation.getApplicantId())
            .moneda(operation.getCurrency())
            .montoSolicitado(operation.getAmount())
            .fechaDesembolso(operation.getIssueDate())
            .fechaVencimiento(operation.getExpiryDate())
            .estado(operation.getStatus())
            .createdAt(operation.getCreatedAt())
            .updatedAt(operation.getModifiedAt())
            .build();
    }
}
