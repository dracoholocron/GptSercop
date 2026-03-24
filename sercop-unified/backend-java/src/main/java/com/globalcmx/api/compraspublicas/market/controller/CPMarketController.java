package com.globalcmx.api.compraspublicas.market.controller;

import com.globalcmx.api.compraspublicas.market.entity.CPInflationIndex;
import com.globalcmx.api.compraspublicas.market.entity.CPRFI;
import com.globalcmx.api.compraspublicas.market.entity.CPRFIResponse;
import com.globalcmx.api.compraspublicas.market.service.CPMarketAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/compras-publicas/market")
@RequiredArgsConstructor
@Tag(name = "Compras Públicas - Estudio de Mercado", description = "Análisis de mercado, inflación y solicitudes de información")
public class CPMarketController {

    private final CPMarketAnalysisService marketAnalysisService;

    @GetMapping("/inflation/{countryCode}")
    @Operation(summary = "Obtener índices de inflación por país")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<List<CPInflationIndex>> getInflationIndices(@PathVariable String countryCode) {
        return ResponseEntity.ok(marketAnalysisService.getInflationIndices(countryCode));
    }

    @GetMapping("/inflation/adjust-price")
    @Operation(summary = "Calcular precio ajustado por inflación")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<Map<String, Object>> adjustPrice(
            @RequestParam BigDecimal price,
            @RequestParam String fromMonth,
            @RequestParam String toMonth,
            @RequestParam(defaultValue = "EC") String countryCode) {

        BigDecimal adjustedPrice = marketAnalysisService.getInflationAdjustedPrice(
                price, fromMonth, toMonth, countryCode);

        return ResponseEntity.ok(Map.of(
                "originalPrice", price,
                "adjustedPrice", adjustedPrice,
                "fromMonth", fromMonth,
                "toMonth", toMonth,
                "countryCode", countryCode
        ));
    }

    @PostMapping("/rfi")
    @Operation(summary = "Crear solicitud de información (RFI)")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<CPRFI> createRFI(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails user) {

        String processId = (String) request.get("processId");
        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String cpcCode = (String) request.get("cpcCode");

        CPRFI rfi = marketAnalysisService.createRFI(processId, title, description, cpcCode, user.getUsername());
        return ResponseEntity.ok(rfi);
    }

    @GetMapping("/rfi/{id}")
    @Operation(summary = "Obtener RFI por ID")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<CPRFI> getRFI(@PathVariable String id) {
        return ResponseEntity.ok(marketAnalysisService.getRFI(id));
    }

    @PostMapping("/rfi/{rfiId}/responses")
    @Operation(summary = "Agregar respuesta a RFI")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<CPRFIResponse> addRFIResponse(
            @PathVariable String rfiId,
            @RequestBody Map<String, Object> request) {

        String supplierRuc = (String) request.get("supplierRuc");
        String supplierName = (String) request.get("supplierName");
        BigDecimal unitPrice = new BigDecimal(request.get("unitPrice").toString());
        BigDecimal totalPrice = request.get("totalPrice") != null
                ? new BigDecimal(request.get("totalPrice").toString()) : null;
        Integer deliveryDays = request.get("deliveryDays") != null
                ? Integer.valueOf(request.get("deliveryDays").toString()) : null;
        String observations = (String) request.get("observations");

        CPRFIResponse response = marketAnalysisService.addRFIResponse(
                rfiId, supplierRuc, supplierName, unitPrice, totalPrice, deliveryDays, observations);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rfi/{rfiId}/statistics")
    @Operation(summary = "Obtener estadísticas de RFI")
    @PreAuthorize("hasAuthority('CP_AI_PRICE_ANALYSIS')")
    public ResponseEntity<Map<String, Object>> getRFIStatistics(@PathVariable String rfiId) {
        return ResponseEntity.ok(marketAnalysisService.getRFIStatistics(rfiId));
    }
}
