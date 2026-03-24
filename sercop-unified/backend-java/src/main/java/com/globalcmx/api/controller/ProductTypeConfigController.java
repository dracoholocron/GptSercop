package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ApiResponse;
import com.globalcmx.api.readmodel.entity.ProductTypeConfigReadModel;
import com.globalcmx.api.readmodel.repository.ProductTypeConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for product type configuration.
 * Provides centralized mapping between product types and their UI views/wizards.
 */
@RestController
@RequestMapping("/product-type-config")
@RequiredArgsConstructor
@Slf4j
public class ProductTypeConfigController {

    private final ProductTypeConfigRepository productTypeConfigRepository;

    /**
     * Get all active product type configurations
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductTypeConfigReadModel>>> getAllConfigs() {
        log.info("GET /product-type-config - Getting all active configurations");

        List<ProductTypeConfigReadModel> configs = productTypeConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();

        return ResponseEntity.ok(ApiResponse.success("OK", configs));
    }

    /**
     * Get configuration for a specific product type
     */
    @GetMapping("/{productType}")
    public ResponseEntity<ApiResponse<ProductTypeConfigReadModel>> getConfigByProductType(
            @PathVariable String productType) {

        log.info("GET /api/product-type-config/{}", productType);

        return productTypeConfigRepository.findByProductType(productType)
                .map(config -> ResponseEntity.ok(ApiResponse.success("OK", config)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get configurations by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<ProductTypeConfigReadModel>>> getConfigsByCategory(
            @PathVariable String category) {

        log.info("GET /api/product-type-config/category/{}", category);

        List<ProductTypeConfigReadModel> configs =
                productTypeConfigRepository.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(category);

        return ResponseEntity.ok(ApiResponse.success("OK", configs));
    }

    /**
     * Get a map of product type to configuration for frontend consumption.
     * Returns a simplified map with just the essential routing information.
     */
    @GetMapping("/routing-map")
    public ResponseEntity<ApiResponse<Map<String, ProductTypeRouting>>> getRoutingMap() {
        log.info("GET /api/product-type-config/routing-map - Getting routing map");

        List<ProductTypeConfigReadModel> configs = productTypeConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();

        Map<String, ProductTypeRouting> routingMap = configs.stream()
                .collect(Collectors.toMap(
                        ProductTypeConfigReadModel::getProductType,
                        config -> new ProductTypeRouting(
                                config.getBaseUrl(),
                                config.getWizardUrl(),
                                config.getViewModeTitleKey(),
                                config.getCategory()
                        )
                ));

        return ResponseEntity.ok(ApiResponse.success("OK", routingMap));
    }

    /**
     * Update account prefix for a product type configuration
     */
    @PatchMapping("/{id}/account-prefix")
    public ResponseEntity<ApiResponse<ProductTypeConfigReadModel>> updateAccountPrefix(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        log.info("PATCH /api/product-type-config/{}/account-prefix", id);

        return productTypeConfigRepository.findById(id)
                .map(config -> {
                    String accountPrefix = body.get("accountPrefix");
                    config.setAccountPrefix(accountPrefix);
                    ProductTypeConfigReadModel saved = productTypeConfigRepository.save(config);
                    return ResponseEntity.ok(ApiResponse.success("Account prefix updated", saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Simple DTO for routing information
     */
    public record ProductTypeRouting(
            String baseUrl,
            String wizardUrl,
            String viewModeTitleKey,
            String category
    ) {}
}
