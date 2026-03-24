package com.globalcmx.api.service.cx;

import com.globalcmx.api.dto.cx.FinancialInstitutionDTO;
import com.globalcmx.api.model.cx.FinancialInstitution;
import com.globalcmx.api.repository.cx.FinancialInstitutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FinancialInstitutionService {

    private final FinancialInstitutionRepository repository;

    public FinancialInstitutionDTO crear(FinancialInstitutionDTO dto) {
        log.info("Creando institución financiera: {}", dto.getCodigo());

        // Validar que no exista
        if (repository.existsByCodigo(dto.getCodigo())) {
            throw new IllegalArgumentException("Ya existe una institución con el código: " + dto.getCodigo());
        }

        if (dto.getSwiftCode() != null && repository.existsBySwiftCode(dto.getSwiftCode())) {
            throw new IllegalArgumentException("Ya existe una institución con el SWIFT code: " + dto.getSwiftCode());
        }

        FinancialInstitution entity = dto.toEntity();
        entity = repository.save(entity);

        log.info("Institución financiera creada con ID: {}", entity.getId());
        return FinancialInstitutionDTO.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public FinancialInstitutionDTO obtenerPorId(Long id) {
        FinancialInstitution entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con ID: " + id));
        return FinancialInstitutionDTO.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public FinancialInstitutionDTO obtenerPorCodigo(String codigo) {
        FinancialInstitution entity = repository.findByCodigo(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con código: " + codigo));
        return FinancialInstitutionDTO.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public FinancialInstitutionDTO obtenerPorSwiftCode(String swiftCode) {
        FinancialInstitution entity = repository.findBySwiftCode(swiftCode)
                .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con SWIFT code: " + swiftCode));
        return FinancialInstitutionDTO.fromEntity(entity);
    }

    @Transactional(readOnly = true)
    public List<FinancialInstitutionDTO> listarTodas() {
        return repository.findAll().stream()
                .map(FinancialInstitutionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FinancialInstitutionDTO> listarPorPais(String pais) {
        return repository.findByPais(pais).stream()
                .map(FinancialInstitutionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FinancialInstitutionDTO> listarCorresponsales() {
        return repository.findByEsCorresponsalTrue().stream()
                .map(FinancialInstitutionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FinancialInstitutionDTO> listarActivas() {
        return repository.findByActivoTrue().stream()
                .map(FinancialInstitutionDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public FinancialInstitutionDTO actualizar(Long id, FinancialInstitutionDTO dto) {
        log.info("Actualizando institución financiera ID: {}", id);

        FinancialInstitution entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Institución financiera no encontrada con ID: " + id));

        // Actualizar campos
        entity.setNombre(dto.getNombre());
        entity.setSwiftCode(dto.getSwiftCode());
        entity.setPais(dto.getPais());
        entity.setCiudad(dto.getCiudad());
        entity.setDireccion(dto.getDireccion());
        entity.setTipo(dto.getTipo() != null ? FinancialInstitution.TipoInstitucion.valueOf(dto.getTipo()) : null);
        entity.setRating(dto.getRating());
        entity.setEsCorresponsal(dto.getEsCorresponsal());
        entity.setActivo(dto.getActivo());

        entity = repository.save(entity);

        log.info("Institución financiera actualizada: {}", id);
        return FinancialInstitutionDTO.fromEntity(entity);
    }

    public void eliminar(Long id) {
        log.info("Eliminando institución financiera ID: {}", id);

        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Institución financiera no encontrada con ID: " + id);
        }

        repository.deleteById(id);
        log.info("Institución financiera eliminada: {}", id);
    }
}
