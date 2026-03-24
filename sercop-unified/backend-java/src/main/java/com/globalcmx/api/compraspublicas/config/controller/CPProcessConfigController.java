package com.globalcmx.api.compraspublicas.config.controller;

import com.globalcmx.api.compraspublicas.config.dto.CPProcessConfigurationDTO;
import com.globalcmx.api.compraspublicas.config.entity.CPCountryConfig;
import com.globalcmx.api.compraspublicas.config.service.CPProcessConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/config")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - Configuración", description = "Configuración de procesos de contratación pública")
public class CPProcessConfigController {

    private final CPProcessConfigService configService;

    @GetMapping("/countries")
    @Operation(summary = "Obtener países configurados")
    @PreAuthorize("hasAnyAuthority('CP_PROCESS_VIEW', 'CP_PROCESS_CREATE')")
    public ResponseEntity<List<CPCountryConfig>> getActiveCountries() {
        return ResponseEntity.ok(configService.getActiveCountries());
    }

    @GetMapping("/countries/{countryCode}")
    @Operation(summary = "Obtener configuración de un país")
    @PreAuthorize("hasAnyAuthority('CP_PROCESS_VIEW', 'CP_PROCESS_CREATE')")
    public ResponseEntity<CPCountryConfig> getCountryConfig(@PathVariable String countryCode) {
        return ResponseEntity.ok(configService.getCountryConfig(countryCode));
    }

    @GetMapping("/{countryCode}/{processType}")
    @Operation(summary = "Obtener configuración completa de proceso",
               description = "Retorna la jerarquía completa de steps/sections/fields para un país y tipo de proceso")
    @PreAuthorize("hasAnyAuthority('CP_PROCESS_VIEW', 'CP_PROCESS_CREATE')")
    public ResponseEntity<CPProcessConfigurationDTO> getProcessConfiguration(
            @PathVariable String countryCode,
            @PathVariable String processType,
            @RequestParam(required = false) String tenantId) {

        log.info("Requesting configuration for country={}, processType={}, tenant={}",
                countryCode, processType, tenantId);

        CPProcessConfigurationDTO config = configService.getFullConfiguration(countryCode, processType, tenantId);
        return ResponseEntity.ok(config);
    }
}
