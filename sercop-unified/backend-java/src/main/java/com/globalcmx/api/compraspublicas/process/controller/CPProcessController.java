package com.globalcmx.api.compraspublicas.process.controller;

import com.globalcmx.api.compraspublicas.process.entity.CPProcessData;
import com.globalcmx.api.compraspublicas.process.service.CPProcessService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/process")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - Procesos", description = "CRUD de procesos de contratación pública")
public class CPProcessController {

    private final CPProcessService processService;

    @PostMapping
    @Operation(summary = "Crear proceso de contratación")
    @PreAuthorize("hasAuthority('CP_PROCESS_CREATE')")
    public ResponseEntity<CPProcessData> createProcess(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String countryCode = (String) request.getOrDefault("countryCode", "EC");
        String processType = (String) request.get("processType");
        String entityRuc = (String) request.get("entityRuc");
        String entityName = (String) request.get("entityName");
        @SuppressWarnings("unchecked")
        Map<String, Object> formData = (Map<String, Object>) request.get("formData");

        CPProcessData process = processService.createProcess(
                countryCode, processType, entityRuc, entityName, formData, user.getUsername());
        return ResponseEntity.ok(process);
    }

    @PutMapping("/{processId}")
    @Operation(summary = "Actualizar proceso de contratación")
    @PreAuthorize("hasAuthority('CP_PROCESS_EDIT')")
    public ResponseEntity<CPProcessData> updateProcess(
            @PathVariable String processId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String status = (String) request.get("status");
        @SuppressWarnings("unchecked")
        Map<String, Object> formData = (Map<String, Object>) request.get("formData");

        CPProcessData process = processService.updateProcess(processId, formData, status, user.getUsername());
        return ResponseEntity.ok(process);
    }

    @GetMapping("/{processId}")
    @Operation(summary = "Obtener proceso por ID")
    @PreAuthorize("hasAuthority('CP_PROCESS_VIEW')")
    public ResponseEntity<CPProcessData> getProcess(@PathVariable String processId) {
        return ResponseEntity.ok(processService.getProcess(processId));
    }

    @GetMapping
    @Operation(summary = "Listar procesos con filtros")
    @PreAuthorize("hasAuthority('CP_PROCESS_VIEW')")
    public ResponseEntity<Page<CPProcessData>> listProcesses(
            @RequestParam(defaultValue = "EC") String countryCode,
            @RequestParam(required = false) String processType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String entityRuc,
            Pageable pageable) {

        return ResponseEntity.ok(processService.listProcesses(countryCode, processType, status, entityRuc, pageable));
    }

    @DeleteMapping("/{processId}")
    @Operation(summary = "Eliminar proceso")
    @PreAuthorize("hasAuthority('CP_PROCESS_EDIT')")
    public ResponseEntity<Void> deleteProcess(@PathVariable String processId) {
        processService.deleteProcess(processId);
        return ResponseEntity.noContent().build();
    }
}
