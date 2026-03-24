package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.BankGuaranteeQueryDTO;
import com.globalcmx.api.readmodel.entity.OperationReadModel;
import com.globalcmx.api.readmodel.repository.OperationReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de consulta para garantías bancarias
 * Usa OperationReadModel como fuente de datos (productType = GUARANTEE)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class BankGuaranteeQueryService {

    private final OperationReadModelRepository operationRepository;

    private static final String GUARANTEE_PRODUCT_TYPE = "GUARANTEE";

    public List<BankGuaranteeQueryDTO> getAllGarantiasBancarias() {
        log.info("Querying all garantias bancarias from Operation Read Model");
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public BankGuaranteeQueryDTO getGarantiaBancariaById(Long id) {
        log.info("Querying garantia bancaria by ID from Operation Read Model: {}", id);
        return operationRepository.findById(id)
            .filter(op -> GUARANTEE_PRODUCT_TYPE.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Garantía bancaria no encontrada con ID: " + id));
    }

    public BankGuaranteeQueryDTO getGarantiaBancariaByNumero(String numeroGarantia) {
        log.info("Querying garantia bancaria by numero from Operation Read Model: {}", numeroGarantia);
        return operationRepository.findByReference(numeroGarantia)
            .filter(op -> GUARANTEE_PRODUCT_TYPE.equals(op.getProductType()))
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Garantía bancaria no encontrada con número: " + numeroGarantia));
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByEstado(String estado) {
        log.info("Querying garantias bancarias by estado from Operation Read Model: {}", estado);
        return operationRepository.findByProductTypeAndStatusOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE, estado)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByTipo(String tipo) {
        log.info("Querying garantias bancarias by tipo from Operation Read Model: {}", tipo);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> tipo.equals(op.getMessageType()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasBySubtipo(String subtipo) {
        log.info("Querying garantias bancarias by subtipo from Operation Read Model: {}", subtipo);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> subtipo.equals(op.getStage()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByOrdenante(Long ordenanteId) {
        log.info("Querying garantias bancarias by ordenante from Operation Read Model: {}", ordenanteId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> ordenanteId.equals(op.getApplicantId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByBeneficiario(Long beneficiarioId) {
        log.info("Querying garantias bancarias by beneficiario from Operation Read Model: {}", beneficiarioId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> beneficiarioId.equals(op.getBeneficiaryId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByBancoGarante(Long bancoGaranteId) {
        log.info("Querying garantias bancarias by banco garante from Operation Read Model: {}", bancoGaranteId);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> bancoGaranteId.equals(op.getIssuingBankId()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BankGuaranteeQueryDTO> getGarantiasBancariasByMoneda(String moneda) {
        log.info("Querying garantias bancarias by moneda from Operation Read Model: {}", moneda);
        return operationRepository.findByProductTypeOrderByCreatedAtDesc(GUARANTEE_PRODUCT_TYPE)
            .stream()
            .filter(op -> moneda.equals(op.getCurrency()))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    private BankGuaranteeQueryDTO convertToDTO(OperationReadModel operation) {
        return BankGuaranteeQueryDTO.builder()
            .id(operation.getId())
            .numeroGarantia(operation.getReference())
            .tipo(operation.getMessageType())
            .subtipo(operation.getStage())
            .estado(operation.getStatus())
            .ordenanteId(operation.getApplicantId())
            .beneficiarioId(operation.getBeneficiaryId())
            .bancoGaranteId(operation.getIssuingBankId())
            .bancoContragaranteId(operation.getAdvisingBankId())
            .moneda(operation.getCurrency())
            .monto(operation.getAmount())
            .porcentajeProyecto(null) // Not stored in operation
            .fechaEmision(operation.getIssueDate())
            .fechaVencimiento(operation.getExpiryDate())
            .fechaEjecucion(null) // Not stored in operation
            .fechaLiberacion(null) // Not stored in operation
            .numeroContrato(null) // Not stored in operation
            .objetoContrato(null) // Not stored in operation
            .montoContrato(null) // Not stored in operation
            .descripcion(null) // Not stored in operation
            .esReducible(null) // Not stored in operation
            .formulaReduccion(null) // Not stored in operation
            .condicionesEjecucion(null) // Not stored in operation
            .condicionesLiberacion(null) // Not stored in operation
            .swiftMt760(operation.getSwiftMessage())
            .swiftMt767(null)
            .createdAt(operation.getCreatedAt())
            .updatedAt(operation.getModifiedAt())
            .build();
    }
}
