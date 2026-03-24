package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateParticipantCommand;
import com.globalcmx.api.dto.command.UpdateParticipantCommand;
import com.globalcmx.api.entity.Participante;
import com.globalcmx.api.service.command.ParticipanteCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/participants/commands")
@RequiredArgsConstructor
@Slf4j
public class ParticipantCommandController {

    private final ParticipanteCommandService participanteCommandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createParticipante(@Valid @RequestBody CreateParticipantCommand command) {
        try {
            log.info("Recibida solicitud para crear participante: {}", command.getIdentificacion());
            Participante participante = participanteCommandService.createParticipante(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Participante creado exitosamente");
            response.put("data", participante);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error al crear participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateParticipante(
            @PathVariable Long id,
            @Valid @RequestBody UpdateParticipantCommand command) {
        try {
            log.info("Recibida solicitud para actualizar participante: {}", id);
            Participante participante = participanteCommandService.updateParticipante(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Participante actualizado exitosamente");
            response.put("data", participante);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al actualizar participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteParticipante(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar participante: {}", id);
            participanteCommandService.deleteParticipante(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Participante eliminado exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error al eliminar participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar participante: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar participante: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
