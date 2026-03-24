package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.dashboard.dto.DashboardSummaryDTO;
import com.globalcmx.api.dashboard.service.DashboardService;
import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.BrandTemplate;
import com.globalcmx.api.readmodel.entity.ProductTypeConfigReadModel;
import com.globalcmx.api.readmodel.repository.ProductTypeConfigRepository;
import com.globalcmx.api.security.dto.MenuItemDTO;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.schedule.dto.ScheduleStatusDTO;
import com.globalcmx.api.security.schedule.service.SystemScheduleService;
import com.globalcmx.api.security.service.MenuConfigService;
import com.globalcmx.api.service.BrandTemplateService;
import com.globalcmx.api.service.SwiftSpecVersionResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador fachada para configuraciones del portal de clientes.
 *
 * Este controlador expone endpoints bajo /client-portal/config/ que permiten
 * a usuarios CLIENT acceder a configuraciones del sistema necesarias para
 * la UI, sin exponer las APIs internas del sistema.
 *
 * Endpoints disponibles:
 * - /client-portal/config/brand-templates/active - Template de marca activo
 * - /client-portal/config/schedules/current-status - Estado de horario actual
 * - /client-portal/config/swift/spec-versions - Versiones de especificación SWIFT
 */
@RestController
@RequestMapping("/client-portal/config")
@RequiredArgsConstructor
@Slf4j
public class ClientPortalConfigController {

    private final BrandTemplateService brandTemplateService;
    private final SystemScheduleService scheduleService;
    private final SwiftSpecVersionResolver specVersionResolver;
    private final UserRepository userRepository;
    private final MenuConfigService menuConfigService;
    private final DashboardService dashboardService;
    private final ProductTypeConfigRepository productTypeConfigRepository;

    /**
     * Obtiene el template de marca activo.
     * Este endpoint permite a usuarios CLIENT obtener la configuración
     * de branding para personalizar la UI.
     */
    @GetMapping("/brand-templates/active")
    public ResponseEntity<ApiResponse<BrandTemplate>> getActiveBrandTemplate() {
        log.debug("GET /client-portal/config/brand-templates/active");

        return brandTemplateService.getActive()
            .map(template -> ResponseEntity.ok(ApiResponse.success("Active template found", template)))
            .orElse(ResponseEntity.ok(ApiResponse.success("No active brand template", null)));
    }

    /**
     * Obtiene el estado actual del horario para el usuario autenticado.
     * Permite a usuarios CLIENT ver si están dentro del horario de acceso.
     */
    @GetMapping("/schedules/current-status")
    public ResponseEntity<ApiResponse<ScheduleStatusDTO>> getCurrentScheduleStatus(
            @RequestParam(value = "timezone", required = false) String timezoneParam,
            @RequestHeader(value = "X-User-Timezone", required = false) String timezoneHeader) {

        log.debug("GET /client-portal/config/schedules/current-status");

        User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Usuario no autenticado"));
        }

        // Prefer query parameter over header
        String userTimezone = timezoneParam != null ? timezoneParam : timezoneHeader;
        ScheduleStatusDTO status = scheduleService.getScheduleStatus(user, userTimezone);
        return ResponseEntity.ok(ApiResponse.success("Estado actual del horario", status));
    }

    /**
     * Obtiene información de versiones de especificación SWIFT.
     * Útil para mostrar información de versión en el footer de la UI.
     */
    @GetMapping("/swift/spec-versions")
    public ResponseEntity<Map<String, Object>> getSwiftSpecVersions(
            @RequestParam(defaultValue = "MT700") String messageType) {

        log.debug("GET /client-portal/config/swift/spec-versions - messageType: {}", messageType);

        try {
            List<String> availableVersions = specVersionResolver.getAvailableVersions(messageType);
            String currentVersion = specVersionResolver.getCurrentActiveVersion();
            boolean overrideActive = specVersionResolver.isVersionOverrideActive();
            String overrideVersion = specVersionResolver.getConfiguredVersionOverride().orElse(null);
            List<Map<String, Object>> versionDetails = specVersionResolver.getVersionDetails();

            Map<String, Object> response = new HashMap<>();
            response.put("messageType", messageType);
            response.put("currentActiveVersion", currentVersion);
            response.put("availableVersions", availableVersions);
            response.put("versionDetails", versionDetails);
            response.put("overrideActive", overrideActive);
            response.put("overrideVersion", overrideVersion != null ? overrideVersion : "");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting SWIFT spec versions for client portal", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener versiones");
            errorResponse.put("currentActiveVersion", "N/A");
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * Obtiene los items de menú para el usuario actual basado en sus permisos.
     * Este endpoint permite a usuarios CLIENT obtener su menú de navegación.
     */
    @GetMapping("/menu/user")
    public ResponseEntity<List<MenuItemDTO>> getMenuForCurrentUser() {
        log.debug("GET /client-portal/config/menu/user");
        return ResponseEntity.ok(menuConfigService.getMenuForCurrentUser());
    }

    /**
     * Obtiene las opciones de filtros disponibles para el dashboard.
     * Retorna períodos, tipos de producto, monedas y filtros de estado.
     */
    @GetMapping("/dashboard/filters")
    public ResponseEntity<Map<String, Object>> getDashboardFilters() {
        log.debug("GET /client-portal/config/dashboard/filters");

        // Retornar opciones de filtros estáticas para el dashboard
        Map<String, Object> filters = new HashMap<>();

        filters.put("periods", List.of(
                Map.of("value", "today", "label", "Hoy"),
                Map.of("value", "week", "label", "Última Semana"),
                Map.of("value", "month", "label", "Último Mes"),
                Map.of("value", "quarter", "label", "Último Trimestre"),
                Map.of("value", "semester", "label", "Último Semestre"),
                Map.of("value", "year", "label", "Último Año"),
                Map.of("value", "more_than_year", "label", "Mayor a 1 Año"),
                Map.of("value", "all", "label", "Todo")
        ));

        filters.put("productTypes", List.of(
                Map.of("value", "LC_IMPORT", "label", "LC Import"),
                Map.of("value", "LC_EXPORT", "label", "LC Export"),
                Map.of("value", "GUARANTEE", "label", "Garantías"),
                Map.of("value", "STANDBY_LC", "label", "Standby LC"),
                Map.of("value", "COLLECTION", "label", "Cobranzas")
        ));

        filters.put("currencies", List.of("USD", "EUR", "MXN"));

        filters.put("statusFilters", List.of(
                Map.of("value", "OPEN", "label", "Solo Abiertas"),
                Map.of("value", "CLOSED", "label", "Solo Cerradas"),
                Map.of("value", "ALL", "label", "Todas")
        ));

        return ResponseEntity.ok(filters);
    }

    /**
     * Obtiene el resumen del dashboard para usuarios CLIENT.
     * Este endpoint permite a usuarios CLIENT ver el dashboard con sus datos.
     */
    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummaryDTO> getDashboardSummary(
            @RequestParam(defaultValue = "month") String period,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String currency,
            @RequestParam(defaultValue = "10") Integer topClientsLimit,
            @RequestParam(defaultValue = "OPEN") String statusFilter) {

        log.debug("GET /client-portal/config/dashboard/summary - period: {}, productType: {}, currency: {}, statusFilter: {}",
                period, productType, currency, statusFilter);

        return ResponseEntity.ok(dashboardService.getDashboardSummary(period, productType, currency, topClientsLimit, statusFilter, null));
    }

    /**
     * Obtiene las configuraciones de tipos de producto.
     * Este endpoint permite a usuarios CLIENT obtener la configuración
     * de tipos de producto para la UI del dashboard.
     */
    @GetMapping("/product-type-config")
    public ResponseEntity<ApiResponse<List<ProductTypeConfigReadModel>>> getProductTypeConfigs() {
        log.debug("GET /client-portal/config/product-type-config");
        List<ProductTypeConfigReadModel> configs = productTypeConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();
        return ResponseEntity.ok(ApiResponse.success("OK", configs));
    }

    /**
     * Obtiene la configuración de un tipo de producto específico por código.
     * Este endpoint permite a usuarios CLIENT obtener la configuración
     * de un tipo de producto específico para navegación y UI.
     */
    @GetMapping("/product-type-config/{productType}")
    public ResponseEntity<ApiResponse<ProductTypeConfigReadModel>> getProductTypeConfigByCode(
            @PathVariable String productType) {
        log.debug("GET /client-portal/config/product-type-config/{}", productType);
        return productTypeConfigRepository.findByProductTypeAndActiveTrue(productType)
                .map(config -> ResponseEntity.ok(ApiResponse.success("OK", config)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Obtiene el usuario actual desde el contexto de seguridad.
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        String username = auth.getName();
        return userRepository.findByUsername(username).orElse(null);
    }
}
