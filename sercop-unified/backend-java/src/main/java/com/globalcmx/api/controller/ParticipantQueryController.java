package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.EventHistoryDTO;
import com.globalcmx.api.dto.query.ParticipanteQueryDTO;
import com.globalcmx.api.service.query.ParticipantQueryService;
import com.globalcmx.api.service.sync.ParticipanteSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/participants/queries")
@RequiredArgsConstructor
@Slf4j
public class ParticipantQueryController {

    private final ParticipantQueryService participantQueryService;
    private final ParticipanteSyncService participanteSyncService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllParticipantes() {
        try {
            log.info("Recibida solicitud para obtener todos los participantes");
            List<ParticipanteQueryDTO> participantes = participantQueryService.getAllParticipantes();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participantes);
            response.put("total", participantes.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener participantes: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<Map<String, Object>> getParticipantesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String identificacion,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String nombres,
            @RequestParam(required = false) String apellidos,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String agencia,
            @RequestParam(required = false) String autenticador) {
        try {
            log.info("Recibida solicitud paginada - page: {}, size: {}, sortBy: {}, sortDir: {}", page, size, sortBy, sortDir);

            Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
            Pageable pageable = PageRequest.of(page, size, sort);

            Page<ParticipanteQueryDTO> participantesPage = participantQueryService.getParticipantesPaginated(
                identificacion, tipo, nombres, apellidos, email, agencia, autenticador, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participantesPage.getContent());
            response.put("totalElements", participantesPage.getTotalElements());
            response.put("totalPages", participantesPage.getTotalPages());
            response.put("currentPage", participantesPage.getNumber());
            response.put("pageSize", participantesPage.getSize());
            response.put("first", participantesPage.isFirst());
            response.put("last", participantesPage.isLast());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener participantes paginados: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Search participants by a general term using OR logic.
     * Searches across: identificacion, nombres, apellidos, email
     * Optimized for autocomplete/search components.
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchParticipantes(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            log.info("Recibida solicitud de busqueda - term: '{}', page: {}, size: {}", q, page, size);

            Pageable pageable = PageRequest.of(page, size, Sort.by("nombres").ascending());
            Page<ParticipanteQueryDTO> participantesPage = participantQueryService.searchParticipantes(q, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participantesPage.getContent());
            response.put("totalElements", participantesPage.getTotalElements());
            response.put("totalPages", participantesPage.getTotalPages());
            response.put("currentPage", participantesPage.getNumber());
            response.put("pageSize", participantesPage.getSize());
            response.put("first", participantesPage.isFirst());
            response.put("last", participantesPage.isLast());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al buscar participantes: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al buscar participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getParticipanteById(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener participante por ID: {}", id);
            ParticipanteQueryDTO participante = participantQueryService.getParticipanteById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participante);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Participante no encontrado: {}", id);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/identificacion/{identificacion}")
    public ResponseEntity<Map<String, Object>> getParticipanteByIdentificacion(@PathVariable String identificacion) {
        try {
            log.info("Recibida solicitud para obtener participante por identificacion: {}", identificacion);
            ParticipanteQueryDTO participante = participantQueryService.getParticipanteByIdentificacion(identificacion);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participante);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Participante no encontrado con identificacion: {}", identificacion);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<Map<String, Object>> getParticipantesByTipo(@PathVariable String tipo) {
        try {
            log.info("Recibida solicitud para obtener participantes por tipo: {}", tipo);
            List<ParticipanteQueryDTO> participantes = participantQueryService.getParticipantesByTipo(tipo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participantes);
            response.put("total", participantes.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener participantes por tipo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Map<String, Object>> getParticipanteByEmail(@PathVariable String email) {
        try {
            log.info("Recibida solicitud para obtener participante por email: {}", email);
            ParticipanteQueryDTO participante = participantQueryService.getParticipanteByEmail(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participante);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Participante no encontrado con email: {}", email);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al obtener participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/agencia/{agencia}")
    public ResponseEntity<Map<String, Object>> getParticipantesByAgencia(@PathVariable String agencia) {
        try {
            log.info("Recibida solicitud para obtener participantes por agencia: {}", agencia);
            List<ParticipanteQueryDTO> participantes = participantQueryService.getParticipantesByAgencia(agencia);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", participantes);
            response.put("total", participantes.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener participantes por agencia: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<Map<String, Object>> getEventHistory(@PathVariable Long id) {
        try {
            log.info("Recibida solicitud para obtener historial de eventos del participante: {}", id);
            List<EventHistoryDTO> history = participantQueryService.getEventHistory(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("total", history.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al obtener historial de eventos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al obtener historial: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncParticipantes() {
        try {
            log.info("Recibida solicitud para sincronizar participantes desde Event Store");
            participanteSyncService.syncAllParticipantes();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Sincronización completada exitosamente");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al sincronizar participantes: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al sincronizar participantes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
