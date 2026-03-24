package com.globalcmx.api.service.query;

import com.globalcmx.api.dto.query.FinancialInstitutionQueryDTO;
import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
public class FinancialInstitutionQueryService {

    private final FinancialInstitutionReadModelRepository readModelRepository;

    public List<FinancialInstitutionQueryDTO> getAllInstitucionesFinancieras() {
        log.info("Querying all instituciones financieras from Read Model");
        return readModelRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public FinancialInstitutionQueryDTO getInstitucionFinancieraById(Long id) {
        log.info("Querying institucion financiera by ID from Read Model: {}", id);
        return readModelRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con ID: " + id));
    }

    public FinancialInstitutionQueryDTO getInstitucionFinancieraByCodigo(String codigo) {
        log.info("Querying institucion financiera by codigo from Read Model: {}", codigo);
        return readModelRepository.findByCodigo(codigo)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con código: " + codigo));
    }

    public FinancialInstitutionQueryDTO getInstitucionFinancieraBySwiftCode(String swiftCode) {
        log.info("Querying institucion financiera by swift code from Read Model: {}", swiftCode);
        return readModelRepository.findBySwiftCode(swiftCode)
            .map(this::convertToDTO)
            .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con SWIFT code: " + swiftCode));
    }

    public List<FinancialInstitutionQueryDTO> getInstitucionesFinancierasActivas() {
        log.info("Querying only active instituciones financieras from Read Model");
        return readModelRepository.findByActivo(true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinancialInstitutionQueryDTO> getInstitucionesFinancierasByTipo(String tipo) {
        log.info("Querying instituciones financieras by tipo from Read Model: {}", tipo);
        return readModelRepository.findByTipo(tipo)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinancialInstitutionQueryDTO> getInstitucionesFinancierasByPais(String pais) {
        log.info("Querying instituciones financieras by pais from Read Model: {}", pais);
        return readModelRepository.findByPais(pais)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<FinancialInstitutionQueryDTO> getInstitucionesCorresponsales() {
        log.info("Querying instituciones corresponsales from Read Model");
        return readModelRepository.findByEsCorresponsal(true)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Búsqueda paginada con filtros opcionales
     */
    public Page<FinancialInstitutionQueryDTO> searchWithFilters(
            String codigo,
            String nombre,
            String swiftCode,
            String pais,
            String ciudad,
            String tipo,
            Boolean esCorresponsal,
            Boolean activo,
            Pageable pageable) {
        log.info("Searching instituciones financieras with filters - page: {}, size: {}",
                 pageable.getPageNumber(), pageable.getPageSize());

        return readModelRepository.searchWithFilters(
                codigo, nombre, swiftCode, pais, ciudad, tipo, esCorresponsal, activo, pageable)
            .map(this::convertToDTO);
    }

    private FinancialInstitutionQueryDTO convertToDTO(FinancialInstitutionReadModel readModel) {
        return FinancialInstitutionQueryDTO.builder()
            .id(readModel.getId())
            .codigo(readModel.getCodigo())
            .nombre(readModel.getNombre())
            .swiftCode(readModel.getSwiftCode())
            .pais(readModel.getPais())
            .ciudad(readModel.getCiudad())
            .direccion(readModel.getDireccion())
            .tipo(readModel.getTipo().name())
            .rating(readModel.getRating())
            .esCorresponsal(readModel.getEsCorresponsal())
            .activo(readModel.getActivo())
            .createdAt(readModel.getCreatedAt())
            .updatedAt(readModel.getUpdatedAt())
            .build();
    }
}
