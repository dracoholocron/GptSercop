package com.globalcmx.api.readmodel.projection;

import com.globalcmx.api.dto.event.FinancialInstitutionEvent;
import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import com.globalcmx.api.readmodel.enums.FinancialInstitutionType;
import com.globalcmx.api.readmodel.repository.FinancialInstitutionReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinancialInstitutionProjection {

    private final FinancialInstitutionReadModelRepository repository;

    @KafkaListener(topics = "institucion-financiera-events", groupId = "institucion-financiera-projection-group")
    @Transactional(transactionManager = "readModelTransactionManager")
    public void handleFinancialInstitutionEvent(FinancialInstitutionEvent event) {
        log.info("Procesando evento de institución financiera: {} para ID: {}", event.getEventType(), event.getInstitucionId());

        try {
            switch (event.getEventType()) {
                case CREATED:
                    handleCreated(event);
                    break;
                case UPDATED:
                    handleUpdated(event);
                    break;
                case DELETED:
                    handleDeleted(event);
                    break;
                default:
                    log.warn("Tipo de evento desconocido: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error procesando evento de institución financiera: {}", e.getMessage(), e);
            throw e;
        }
    }

    private void handleCreated(FinancialInstitutionEvent event) {
        FinancialInstitutionReadModel institucion = FinancialInstitutionReadModel.builder()
                .id(event.getInstitucionId())
                .codigo(event.getCodigo())
                .nombre(event.getNombre())
                .swiftCode(event.getSwiftCode())
                .pais(event.getPais())
                .ciudad(event.getCiudad())
                .direccion(event.getDireccion())
                .tipo(FinancialInstitutionType.valueOf(event.getTipo()))
                .rating(event.getRating())
                .esCorresponsal(event.getEsCorresponsal())
                .activo(event.getActivo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .aggregateId("INSTITUCION_FINANCIERA-" + event.getInstitucionId())
                .version(0L)
                .build();

        repository.save(institucion);
        log.info("Institución financiera creada en read model: {}", event.getInstitucionId());
    }

    private void handleUpdated(FinancialInstitutionEvent event) {
        FinancialInstitutionReadModel institucion = repository.findById(event.getInstitucionId())
                .orElseThrow(() -> new RuntimeException("Institución financiera no encontrada: " + event.getInstitucionId()));

        institucion.setCodigo(event.getCodigo());
        institucion.setNombre(event.getNombre());
        institucion.setSwiftCode(event.getSwiftCode());
        institucion.setPais(event.getPais());
        institucion.setCiudad(event.getCiudad());
        institucion.setDireccion(event.getDireccion());
        institucion.setTipo(FinancialInstitutionType.valueOf(event.getTipo()));
        institucion.setRating(event.getRating());
        institucion.setEsCorresponsal(event.getEsCorresponsal());
        institucion.setActivo(event.getActivo());
        institucion.setUpdatedAt(LocalDateTime.now());

        repository.save(institucion);
        log.info("Institución financiera actualizada en read model: {}", event.getInstitucionId());
    }

    private void handleDeleted(FinancialInstitutionEvent event) {
        repository.deleteById(event.getInstitucionId());
        log.info("Institución financiera eliminada del read model: {}", event.getInstitucionId());
    }
}
