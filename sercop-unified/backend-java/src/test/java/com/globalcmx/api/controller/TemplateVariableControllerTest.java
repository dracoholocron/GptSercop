package com.globalcmx.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.readmodel.entity.TemplateVariable;
import com.globalcmx.api.readmodel.repository.TemplateVariableRepository;
import com.globalcmx.api.security.filter.ApiPermissionFilter;
import com.globalcmx.api.security.jwt.JwtAuthenticationFilter;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.service.ApiEndpointCacheService;
import com.globalcmx.api.security.service.CustomUserDetailsService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for TemplateVariableController.
 * Tests REST API endpoints for template variable management.
 */
@WebMvcTest(controllers = TemplateVariableController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = {JwtAuthenticationFilter.class, ApiPermissionFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("TemplateVariableController - REST API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TemplateVariableControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TemplateVariableRepository repository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private ApiEndpointCacheService apiEndpointCacheService;

    // ==================================================================================
    // 1. LIST ENDPOINT - GET /api/v1/admin/template-variables
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. LIST - GET /api/v1/admin/template-variables")
    class ListEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return all template variables ordered by category and display order")
        void shouldReturnAllTemplateVariables() throws Exception {
            // Arrange
            List<TemplateVariable> variables = List.of(
                createVariable(1L, "reference", "OPERATION", "blue"),
                createVariable(2L, "amount", "AMOUNTS", "green"),
                createVariable(3L, "applicantName", "APPLICANT", "purple")
            );
            when(repository.findAllByOrderByCategoryAscDisplayOrderAsc()).thenReturn(variables);

            // Act & Assert
            mockMvc.perform(get("/v1/admin/template-variables"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(3)))
                    .andExpect(jsonPath("$.data[0].code").value("reference"))
                    .andExpect(jsonPath("$.data[1].code").value("amount"))
                    .andExpect(jsonPath("$.data[2].code").value("applicantName"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return empty list when no variables exist")
        void shouldReturnEmptyListWhenNoVariables() throws Exception {
            // Arrange
            when(repository.findAllByOrderByCategoryAscDisplayOrderAsc()).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/v1/admin/template-variables"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ==================================================================================
    // 2. GET BY ID - GET /api/v1/admin/template-variables/{id}
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. GET BY ID - GET /api/v1/admin/template-variables/{id}")
    class GetByIdEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return template variable by ID")
        void shouldReturnTemplateVariableById() throws Exception {
            // Arrange
            TemplateVariable variable = createVariable(1L, "reference", "OPERATION", "blue");
            when(repository.findById(1L)).thenReturn(Optional.of(variable));

            // Act & Assert
            mockMvc.perform(get("/v1/admin/template-variables/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.code").value("reference"))
                    .andExpect(jsonPath("$.data.category").value("OPERATION"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return error when variable not found")
        void shouldReturnErrorWhenNotFound() throws Exception {
            // Arrange
            when(repository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            mockMvc.perform(get("/v1/admin/template-variables/999"))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ==================================================================================
    // 3. GET BY CATEGORY - GET /api/v1/admin/template-variables/category/{category}
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. GET BY CATEGORY - GET /api/v1/admin/template-variables/category/{category}")
    class GetByCategoryEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return variables by category")
        void shouldReturnVariablesByCategory() throws Exception {
            // Arrange
            List<TemplateVariable> variables = List.of(
                createVariable(1L, "applicantName", "APPLICANT", "purple"),
                createVariable(2L, "applicantEmail", "APPLICANT", "purple")
            );
            when(repository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc("APPLICANT"))
                    .thenReturn(variables);

            // Act & Assert
            mockMvc.perform(get("/v1/admin/template-variables/category/APPLICANT"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].category").value("APPLICANT"))
                    .andExpect(jsonPath("$.data[1].category").value("APPLICANT"));
        }
    }

    // ==================================================================================
    // 4. CREATE - POST /api/v1/admin/template-variables
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. CREATE - POST /api/v1/admin/template-variables")
    class CreateEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should create new template variable")
        void shouldCreateTemplateVariable() throws Exception {
            // Arrange
            when(repository.existsByCode("newVariable")).thenReturn(false);
            when(repository.save(any(TemplateVariable.class))).thenAnswer(inv -> {
                TemplateVariable v = inv.getArgument(0);
                v.setId(1L);
                return v;
            });

            String requestBody = """
                {
                    "code": "newVariable",
                    "labelKey": "templateVar.new.variable",
                    "descriptionKey": "templateVar.new.variable.desc",
                    "category": "CUSTOM",
                    "color": "gray",
                    "sourceTable": "custom_table",
                    "sourceColumn": "custom_column",
                    "dataType": "STRING",
                    "displayOrder": 1
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/admin/template-variables")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.code").value("newVariable"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject duplicate code")
        void shouldRejectDuplicateCode() throws Exception {
            // Arrange
            when(repository.existsByCode("existingCode")).thenReturn(true);

            String requestBody = """
                {
                    "code": "existingCode",
                    "labelKey": "templateVar.existing",
                    "category": "CUSTOM",
                    "sourceTable": "table",
                    "sourceColumn": "column"
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/admin/template-variables")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ==================================================================================
    // 5. UPDATE - PUT /api/v1/admin/template-variables/{id}
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. UPDATE - PUT /api/v1/admin/template-variables/{id}")
    class UpdateEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should update existing template variable")
        void shouldUpdateTemplateVariable() throws Exception {
            // Arrange
            TemplateVariable existing = createVariable(1L, "reference", "OPERATION", "blue");
            when(repository.findById(1L)).thenReturn(Optional.of(existing));
            when(repository.existsByCode("updatedReference")).thenReturn(false);
            when(repository.save(any(TemplateVariable.class))).thenAnswer(inv -> inv.getArgument(0));

            String requestBody = """
                {
                    "code": "updatedReference",
                    "labelKey": "templateVar.updated.reference",
                    "category": "OPERATION",
                    "sourceTable": "operation_readmodel",
                    "sourceColumn": "reference"
                }
            """;

            // Act & Assert
            mockMvc.perform(put("/v1/admin/template-variables/1")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.code").value("updatedReference"));
        }
    }

    // ==================================================================================
    // 6. DELETE - DELETE /api/v1/admin/template-variables/{id}
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. DELETE - DELETE /api/v1/admin/template-variables/{id}")
    class DeleteEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should delete template variable")
        void shouldDeleteTemplateVariable() throws Exception {
            // Arrange
            when(repository.existsById(1L)).thenReturn(true);
            doNothing().when(repository).deleteById(1L);

            // Act & Assert
            mockMvc.perform(delete("/v1/admin/template-variables/1")
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(repository).deleteById(1L);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return error when deleting non-existent variable")
        void shouldReturnErrorWhenDeletingNonExistent() throws Exception {
            // Arrange
            when(repository.existsById(999L)).thenReturn(false);

            // Act & Assert
            mockMvc.perform(delete("/v1/admin/template-variables/999")
                            .with(csrf()))
                    .andExpect(status().is4xxClientError());
        }
    }

    // ==================================================================================
    // 7. TOGGLE ACTIVE - POST /api/v1/admin/template-variables/{id}/toggle-active
    // ==================================================================================

    @Nested
    @Order(7)
    @DisplayName("7. TOGGLE ACTIVE - POST /api/v1/admin/template-variables/{id}/toggle-active")
    class ToggleActiveEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should toggle active status from true to false")
        void shouldToggleActiveStatusToFalse() throws Exception {
            // Arrange
            TemplateVariable variable = createVariable(1L, "reference", "OPERATION", "blue");
            variable.setIsActive(true);
            when(repository.findById(1L)).thenReturn(Optional.of(variable));
            when(repository.save(any(TemplateVariable.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            mockMvc.perform(post("/v1/admin/template-variables/1/toggle-active")
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.isActive").value(false));
        }

        @Test
        @WithMockUser
        @DisplayName("Should toggle active status from false to true")
        void shouldToggleActiveStatusToTrue() throws Exception {
            // Arrange
            TemplateVariable variable = createVariable(1L, "reference", "OPERATION", "blue");
            variable.setIsActive(false);
            when(repository.findById(1L)).thenReturn(Optional.of(variable));
            when(repository.save(any(TemplateVariable.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act & Assert
            mockMvc.perform(post("/v1/admin/template-variables/1/toggle-active")
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.isActive").value(true));
        }
    }

    // ==================================================================================
    // 8. ACTIVE GROUPED - GET /api/v1/template-variables/active
    // ==================================================================================

    @Nested
    @Order(8)
    @DisplayName("8. ACTIVE GROUPED - GET /api/v1/template-variables/active")
    class ActiveGroupedEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return active variables grouped by category")
        void shouldReturnActiveVariablesGroupedByCategory() throws Exception {
            // Arrange
            List<TemplateVariable> variables = List.of(
                createVariable(1L, "reference", "OPERATION", "blue"),
                createVariable(2L, "status", "OPERATION", "blue"),
                createVariable(3L, "amount", "AMOUNTS", "green"),
                createVariable(4L, "applicantName", "APPLICANT", "purple")
            );
            when(repository.findByIsActiveTrueOrderByCategoryAscDisplayOrderAsc()).thenReturn(variables);

            // Act & Assert
            mockMvc.perform(get("/v1/template-variables/active"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(3))) // 3 categories
                    .andExpect(jsonPath("$.data[0].category").value("OPERATION"))
                    .andExpect(jsonPath("$.data[0].color").value("blue"))
                    .andExpect(jsonPath("$.data[0].variables", hasSize(2)));
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private TemplateVariable createVariable(Long id, String code, String category, String color) {
        return TemplateVariable.builder()
                .id(id)
                .code(code)
                .labelKey("templateVar." + category.toLowerCase() + "." + code)
                .descriptionKey("templateVar." + category.toLowerCase() + "." + code + ".desc")
                .category(category)
                .color(color)
                .sourceTable("operation_readmodel")
                .sourceColumn(code)
                .dataType("STRING")
                .displayOrder(1)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .createdBy("system")
                .build();
    }
}
