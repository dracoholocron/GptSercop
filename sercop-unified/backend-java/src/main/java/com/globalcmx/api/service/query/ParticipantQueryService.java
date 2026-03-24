package com.globalcmx.api.service.query;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.ParticipanteQueryDTO;
import com.globalcmx.api.eventsourcing.service.EventStoreService;
import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantQueryService {

    private final ParticipanteReadModelRepository participanteReadModelRepository;
    private final EventStoreService eventStoreService;
    private final ObjectMapper objectMapper;

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<ParticipanteQueryDTO> getAllParticipantes() {
        log.info("Obteniendo todos los participantes");
        return participanteReadModelRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Page<ParticipanteQueryDTO> getParticipantesPaginated(
            String identificacion,
            String tipo,
            String nombres,
            String apellidos,
            String email,
            String agencia,
            String autenticador,
            Pageable pageable) {
        log.info("Obteniendo participantes paginados - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        // Convert empty strings to null for the query
        String idFilter = (identificacion != null && !identificacion.trim().isEmpty()) ? identificacion : null;
        String tipoFilter = (tipo != null && !tipo.trim().isEmpty() && !tipo.equals("all")) ? tipo : null;
        String nombresFilter = (nombres != null && !nombres.trim().isEmpty()) ? nombres : null;
        String apellidosFilter = (apellidos != null && !apellidos.trim().isEmpty()) ? apellidos : null;
        String emailFilter = (email != null && !email.trim().isEmpty()) ? email : null;
        String agenciaFilter = (agencia != null && !agencia.trim().isEmpty()) ? agencia : null;
        String autenticadorFilter = (autenticador != null && !autenticador.trim().isEmpty() && !autenticador.equals("all")) ? autenticador : null;

        Page<ParticipanteReadModel> page = participanteReadModelRepository.findAllWithFilters(
            idFilter, tipoFilter, nombresFilter, apellidosFilter, emailFilter, agenciaFilter, autenticadorFilter, pageable);

        return page.map(this::toDTO);
    }

    /**
     * Search participants by a general term using OR logic across multiple fields.
     * This is optimized for autocomplete/search components.
     */
    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Page<ParticipanteQueryDTO> searchParticipantes(String searchTerm, Pageable pageable) {
        log.info("Buscando participantes con termino: '{}' - page: {}, size: {}",
            searchTerm, pageable.getPageNumber(), pageable.getPageSize());

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Page.empty(pageable);
        }

        Page<ParticipanteReadModel> page = participanteReadModelRepository.searchByTerm(searchTerm.trim(), pageable);
        return page.map(this::toDTO);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public ParticipanteQueryDTO getParticipanteById(Long id) {
        log.info("Obteniendo participante por ID: {}", id);
        ParticipanteReadModel participante = participanteReadModelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Participante no encontrado: " + id));
        return toDTO(participante);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public ParticipanteQueryDTO getParticipanteByIdentificacion(String identificacion) {
        log.info("Obteniendo participante por identificacion: {}", identificacion);
        ParticipanteReadModel participante = participanteReadModelRepository.findByIdentificacion(identificacion)
                .orElseThrow(() -> new RuntimeException("Participante no encontrado con identificacion: " + identificacion));
        return toDTO(participante);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public boolean existsByIdentificacionAndTipoReferencia(String identificacion, String tipoReferencia) {
        log.info("Verificando si existe participante con identificacion: {} y tipoReferencia: {}",
                identificacion, tipoReferencia);
        return participanteReadModelRepository.findByIdentificacionAndTipoReferencia(identificacion, tipoReferencia)
                .isPresent();
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<ParticipanteQueryDTO> getParticipantesByTipo(String tipo) {
        log.info("Obteniendo participantes por tipo: {}", tipo);
        return participanteReadModelRepository.findByTipo(tipo).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public ParticipanteQueryDTO getParticipanteByEmail(String email) {
        log.info("Obteniendo participante por email: {}", email);
        ParticipanteReadModel participante = participanteReadModelRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Participante no encontrado con email: " + email));
        return toDTO(participante);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<ParticipanteQueryDTO> getParticipantesByAgencia(String agencia) {
        log.info("Obteniendo participantes por agencia: {}", agencia);
        return participanteReadModelRepository.findByAgencia(agencia).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(transactionManager = "eventStoreTransactionManager", readOnly = true)
    public List<EventHistoryDTO> getEventHistory(Long id) {
        log.info("Obteniendo historial de eventos para participante: {}", id);
        String aggregateId = "Participante-" + id;

        return eventStoreService.getEvents(aggregateId)
                .stream()
                .map(event -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> eventData = objectMapper.readValue(event.getEventData(), Map.class);

                        return EventHistoryDTO.builder()
                                .eventId(event.getEventId())
                                .eventType(event.getEventType())
                                .timestamp(event.getTimestamp())
                                .performedBy(event.getPerformedBy())
                                .version(event.getVersion())
                                .eventData(eventData)
                                .build();
                    } catch (Exception e) {
                        log.error("Error parsing event data for event: {}", event.getEventId(), e);
                        return null;
                    }
                })
                .filter(event -> event != null)
                .collect(Collectors.toList());
    }

    private ParticipanteQueryDTO toDTO(ParticipanteReadModel model) {
        return ParticipanteQueryDTO.builder()
                .id(model.getId())
                .identificacion(model.getIdentificacion())
                .tipo(model.getTipo())
                .tipoReferencia(model.getTipoReferencia())
                .nombres(model.getNombres())
                .apellidos(model.getApellidos())
                .email(model.getEmail())
                .telefono(model.getTelefono())
                .direccion(model.getDireccion())
                .agencia(model.getAgencia())
                .ejecutivoAsignado(model.getEjecutivoAsignado())
                .ejecutivoId(model.getEjecutivoId())
                .correoEjecutivo(model.getCorreoEjecutivo())
                .autenticador(model.getAutenticador())
                .createdAt(model.getCreatedAt())
                .updatedAt(model.getUpdatedAt())
                .createdBy(model.getCreatedBy())
                .updatedBy(model.getUpdatedBy())
                .build();
    }
}
