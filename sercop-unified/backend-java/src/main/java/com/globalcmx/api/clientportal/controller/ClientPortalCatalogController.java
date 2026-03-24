package com.globalcmx.api.clientportal.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.dto.query.CatalogoPersonalizadoQueryDTO;
import com.globalcmx.api.dto.query.FinancialInstitutionQueryDTO;
import com.globalcmx.api.dto.query.MonedaQueryDTO;
import com.globalcmx.api.dto.query.ParticipanteQueryDTO;
import com.globalcmx.api.service.query.CurrencyQueryService;
import com.globalcmx.api.service.query.CustomCatalogQueryService;
import com.globalcmx.api.service.query.FinancialInstitutionQueryService;
import com.globalcmx.api.service.query.ParticipantQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

/**
 * Controlador fachada para catálogos del portal de clientes.
 *
 * Este controlador expone endpoints bajo /client-portal/catalogs/ que permiten
 * a usuarios CLIENT acceder a catálogos del sistema necesarios para
 * los formularios dinámicos, sin exponer las APIs internas del sistema.
 *
 * SEGURIDAD: Solo se exponen catálogos específicos mediante whitelist.
 *
 * Endpoints disponibles:
 * - /client-portal/catalogs/currencies - Lista de monedas activas
 * - /client-portal/catalogs/custom-catalogs/code/{codigo} - Valores de un catálogo específico (whitelist)
 */
@RestController
@RequestMapping("/client-portal/catalogs")
@RequiredArgsConstructor
@Slf4j
public class ClientPortalCatalogController {

    private final CurrencyQueryService currencyQueryService;
    private final CustomCatalogQueryService customCatalogQueryService;
    private final FinancialInstitutionQueryService financialInstitutionQueryService;
    private final ParticipantQueryService participantQueryService;

    /**
     * Whitelist de códigos de catálogo permitidos para el portal de clientes.
     * Solo estos catálogos pueden ser consultados por usuarios CLIENT.
     * Agregar nuevos códigos aquí cuando se necesiten exponer más catálogos.
     */
    private static final Set<String> ALLOWED_CATALOG_CODES = Set.of(
            // General Catalogs
            "COUNTRY",
            "INCOTERMS",
            // Document Type Catalogs (V181)
            "DOCUMENT_TYPES_LC",
            "DOCUMENT_TYPES_GUARANTEE",
            "DOCUMENT_TYPES_COLLECTION",
            // Form Field Catalogs (V171, V181)
            "ID_TYPES",
            "RELATIONSHIPS",
            "RISK_CATEGORIES",
            "GUARANTEE_TYPES",
            // DOKA Risk Data Catalogs (V224)
            "ACCDES",   // Account Descriptor - Destino Contable
            "FINDES",   // Financial Destination - Destino Financiero
            "SOURES",   // Source of Resources - Origen de Recursos
            "CRESEC",   // Credit Sector - Sector de Crédito
            "ECOACT",   // Economic Activity CIIU - Actividad Económica
            "DOMFLG",   // Domestic Flag - Indicador Doméstico
            "CSTBCH"    // Branch Code - Código de Agencia
    );

    /**
     * Obtiene todas las monedas activas.
     * Este endpoint permite a usuarios CLIENT obtener la lista de monedas
     * para llenar campos de selección en formularios.
     */
    @GetMapping("/currencies")
    public ResponseEntity<ApiResponse<List<MonedaQueryDTO>>> getActiveCurrencies() {
        log.debug("GET /client-portal/catalogs/currencies");

        try {
            List<MonedaQueryDTO> currencies = currencyQueryService.getActiveMonedasOnly();
            return ResponseEntity.ok(ApiResponse.success("Monedas obtenidas exitosamente", currencies));
        } catch (Exception e) {
            log.error("Error al obtener monedas para portal cliente", e);
            return ResponseEntity.ok(ApiResponse.error("Error al obtener monedas"));
        }
    }

    /**
     * Obtiene los valores de un catálogo específico por su código.
     * Solo permite catálogos en la whitelist ALLOWED_CATALOG_CODES.
     * Retorna los hijos (nivel 2) del catálogo solicitado.
     *
     * @param codigo Código del catálogo (debe estar en whitelist)
     * @return Lista de valores del catálogo
     */
    @GetMapping("/custom-catalogs/code/{codigo}")
    public ResponseEntity<ApiResponse<List<CatalogoPersonalizadoQueryDTO>>> getCatalogValuesByCode(
            @PathVariable String codigo) {
        log.debug("GET /client-portal/catalogs/custom-catalogs/code/{}", codigo);

        // Validar que el código esté en la whitelist
        if (!ALLOWED_CATALOG_CODES.contains(codigo)) {
            log.warn("SECURITY: Intento de acceso a catálogo no permitido: {}", codigo);
            return ResponseEntity.status(403)
                    .body(ApiResponse.error("Catálogo no disponible para portal de clientes"));
        }

        try {
            // Buscar el catálogo padre por código
            CatalogoPersonalizadoQueryDTO parent = customCatalogQueryService.getCatalogoPersonalizadoByCodigo(codigo);

            // Obtener los hijos (valores) del catálogo
            List<CatalogoPersonalizadoQueryDTO> values =
                customCatalogQueryService.getCatalogosByCatalogoPadreIdAndActivo(parent.getId(), true);

            log.debug("Catálogo {} devuelve {} valores", codigo, values.size());
            return ResponseEntity.ok(ApiResponse.success("Valores del catálogo obtenidos exitosamente", values));
        } catch (RuntimeException e) {
            log.error("Catálogo no encontrado: {}", codigo);
            return ResponseEntity.ok(ApiResponse.error("Catálogo no encontrado: " + codigo));
        } catch (Exception e) {
            log.error("Error al obtener valores del catálogo {}", codigo, e);
            return ResponseEntity.ok(ApiResponse.error("Error al obtener catálogo"));
        }
    }

    /**
     * Obtiene todas las instituciones financieras.
     * Este endpoint permite a usuarios CLIENT obtener la lista de bancos/instituciones
     * para seleccionar en formularios (banco avisador, banco emisor, etc.)
     */
    @GetMapping("/financial-institutions")
    public ResponseEntity<ApiResponse<List<FinancialInstitutionQueryDTO>>> getFinancialInstitutions() {
        log.debug("GET /client-portal/catalogs/financial-institutions");

        try {
            List<FinancialInstitutionQueryDTO> institutions = financialInstitutionQueryService.getAllInstitucionesFinancieras();
            log.debug("Devolviendo {} instituciones financieras", institutions.size());
            return ResponseEntity.ok(ApiResponse.success("Instituciones financieras obtenidas exitosamente", institutions));
        } catch (Exception e) {
            log.error("Error al obtener instituciones financieras para portal cliente", e);
            return ResponseEntity.ok(ApiResponse.error("Error al obtener instituciones financieras"));
        }
    }

    /**
     * Obtiene instituciones financieras corresponsales.
     * Útil para seleccionar bancos corresponsales en operaciones de comercio exterior.
     */
    @GetMapping("/financial-institutions/correspondents")
    public ResponseEntity<ApiResponse<List<FinancialInstitutionQueryDTO>>> getCorrespondentBanks() {
        log.debug("GET /client-portal/catalogs/financial-institutions/correspondents");

        try {
            List<FinancialInstitutionQueryDTO> institutions = financialInstitutionQueryService.getInstitucionesCorresponsales();
            log.debug("Devolviendo {} bancos corresponsales", institutions.size());
            return ResponseEntity.ok(ApiResponse.success("Bancos corresponsales obtenidos exitosamente", institutions));
        } catch (Exception e) {
            log.error("Error al obtener bancos corresponsales para portal cliente", e);
            return ResponseEntity.ok(ApiResponse.error("Error al obtener bancos corresponsales"));
        }
    }

    /**
     * Busca participantes por término de búsqueda.
     * Este endpoint permite a usuarios CLIENT buscar participantes para componentes
     * de selección de participantes en formularios dinámicos.
     *
     * @param q Término de búsqueda (nombre, identificación, etc.)
     * @param page Número de página (default: 0)
     * @param size Tamaño de página (default: 20, max: 50)
     * @return Página de participantes que coinciden con la búsqueda
     */
    @GetMapping("/participants/search")
    public ResponseEntity<ApiResponse<Page<ParticipanteQueryDTO>>> searchParticipants(
            @RequestParam("q") String searchTerm,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        log.debug("GET /client-portal/catalogs/participants/search?q={}&page={}&size={}", searchTerm, page, size);

        try {
            // Limit page size to prevent large queries
            int limitedSize = Math.min(size, 50);

            Page<ParticipanteQueryDTO> participants = participantQueryService.searchParticipantes(
                    searchTerm,
                    PageRequest.of(page, limitedSize)
            );

            log.debug("Búsqueda de participantes '{}' devuelve {} resultados", searchTerm, participants.getTotalElements());
            return ResponseEntity.ok(ApiResponse.success("Participantes encontrados", participants));
        } catch (Exception e) {
            log.error("Error al buscar participantes para portal cliente", e);
            return ResponseEntity.ok(ApiResponse.error("Error al buscar participantes"));
        }
    }

    /**
     * Obtiene un participante por su ID.
     *
     * @param id ID del participante
     * @return Participante con el ID especificado
     */
    @GetMapping("/participants/{id}")
    public ResponseEntity<ApiResponse<ParticipanteQueryDTO>> getParticipantById(@PathVariable Long id) {
        log.debug("GET /client-portal/catalogs/participants/{}", id);

        try {
            ParticipanteQueryDTO participant = participantQueryService.getParticipanteById(id);
            return ResponseEntity.ok(ApiResponse.success("Participante encontrado", participant));
        } catch (Exception e) {
            log.error("Error al obtener participante {} para portal cliente", id, e);
            return ResponseEntity.ok(ApiResponse.error("Participante no encontrado"));
        }
    }
}
