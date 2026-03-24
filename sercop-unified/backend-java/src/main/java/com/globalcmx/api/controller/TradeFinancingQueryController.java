package com.globalcmx.api.controller;

import com.globalcmx.api.dto.query.FinanciamientoCxQueryDTO;
import com.globalcmx.api.service.query.TradeFinancingQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/foreign-trade/trade-financing")
@RequiredArgsConstructor
@Slf4j
public class TradeFinancingQueryController {

    private final TradeFinancingQueryService tradeFinancingQueryService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFinanciamientos() {
        try {
            log.info("Consulta de todos los financiamientos");
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getAll();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFinanciamientoById(@PathVariable Long id) {
        try {
            log.info("Consulta de financiamiento por ID: {}", id);
            FinanciamientoCxQueryDTO financiamiento = tradeFinancingQueryService.getById(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamiento);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Financiamiento no encontrado: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al consultar financiamiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/numero/{numeroOperacion}")
    public ResponseEntity<Map<String, Object>> getFinanciamientoByNumeroOperacion(@PathVariable String numeroOperacion) {
        try {
            log.info("Consulta de financiamiento por numero de operacion: {}", numeroOperacion);
            FinanciamientoCxQueryDTO financiamiento = tradeFinancingQueryService.getByNumeroOperacion(numeroOperacion);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamiento);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Financiamiento no encontrado: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } catch (Exception e) {
            log.error("Error al consultar financiamiento: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<Map<String, Object>> getFinanciamientosByCliente(@PathVariable Long clienteId) {
        try {
            log.info("Consulta de financiamientos por cliente: {}", clienteId);
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getByCliente(clienteId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos por cliente: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos por cliente: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<Map<String, Object>> getFinanciamientosByEstado(@PathVariable String estado) {
        try {
            log.info("Consulta de financiamientos por estado: {}", estado);
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getByEstado(estado);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos por estado: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos por estado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<Map<String, Object>> getFinanciamientosByTipo(@PathVariable String tipo) {
        try {
            log.info("Consulta de financiamientos por tipo: {}", tipo);
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getByTipo(tipo);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos por tipo: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos por tipo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/linea-credito/{lineaCreditoId}")
    public ResponseEntity<Map<String, Object>> getFinanciamientosByLineaCredito(@PathVariable Long lineaCreditoId) {
        try {
            log.info("Consulta de financiamientos por linea de credito: {}", lineaCreditoId);
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getByLineaCredito(lineaCreditoId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos por linea de credito: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos por linea de credito: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/operacion-vinculada/{tipo}/{id}")
    public ResponseEntity<Map<String, Object>> getFinanciamientosByOperacionVinculada(
            @PathVariable String tipo,
            @PathVariable Long id) {
        try {
            log.info("Consulta de financiamientos por operacion vinculada: tipo={}, id={}", tipo, id);
            List<FinanciamientoCxQueryDTO> financiamientos = tradeFinancingQueryService.getByOperacionVinculada(tipo, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", financiamientos);
            response.put("total", financiamientos.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al consultar financiamientos por operacion vinculada: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error al consultar financiamientos por operacion vinculada: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

}
