package com.globalcmx.api.controller;

import com.globalcmx.api.dto.command.CreateTradeFinancingCommand;
import com.globalcmx.api.dto.command.UpdateTradeFinancingCommand;
import com.globalcmx.api.entity.FinanciamientoCx;
import com.globalcmx.api.service.command.FinanciamientoCxCommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/foreign-trade/trade-financing/commands")
@RequiredArgsConstructor
@Slf4j
public class TradeFinancingCommandController {

    private final FinanciamientoCxCommandService commandService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFinanciamientoCx(@Valid @RequestBody CreateTradeFinancingCommand command) {
        try {
            log.info("Recibida solicitud para crear financiamiento: {}", command.getNumeroOperacion());
            FinanciamientoCx financiamiento = commandService.createFinanciamientoCx(command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Financiamiento creado exitosamente");
            response.put("data", financiamiento);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Error de validacion al crear financiamiento: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al crear financiamiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al crear financiamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateFinanciamientoCx(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTradeFinancingCommand command) {
        try {
            log.info("Recibida solicitud para actualizar financiamiento: {}", id);
            FinanciamientoCx financiamiento = commandService.updateFinanciamientoCx(id, command);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Financiamiento actualizado exitosamente");
            response.put("data", financiamiento);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Financiamiento no encontrado: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IllegalStateException e) {
            log.error("Error de estado al actualizar financiamiento: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al actualizar financiamiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al actualizar financiamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteFinanciamientoCx(
            @PathVariable Long id,
            @RequestParam(required = false) String deletedBy) {
        try {
            log.info("Recibida solicitud para eliminar financiamiento: {}", id);
            commandService.deleteFinanciamientoCx(id, deletedBy);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Financiamiento eliminado exitosamente");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Financiamiento no encontrado: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (IllegalStateException e) {
            log.error("Error de estado al eliminar financiamiento: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al eliminar financiamiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al eliminar financiamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
