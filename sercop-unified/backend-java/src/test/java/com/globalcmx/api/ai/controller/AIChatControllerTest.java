package com.globalcmx.api.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.ai.dto.*;
import com.globalcmx.api.ai.entity.AIContext;
import com.globalcmx.api.ai.entity.AIConversation;
import com.globalcmx.api.ai.entity.AIMessage;
import com.globalcmx.api.ai.service.AIChatService;
import com.globalcmx.api.ai.service.AIContextService;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.filter.ApiPermissionFilter;
import com.globalcmx.api.security.jwt.JwtAuthenticationFilter;
import com.globalcmx.api.security.jwt.JwtTokenProvider;
import com.globalcmx.api.security.repository.UserRepository;
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

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for AIChatController.
 * Tests REST API endpoints for AI chat functionality.
 */
@WebMvcTest(controllers = AIChatController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
        classes = {JwtAuthenticationFilter.class, ApiPermissionFilter.class}))
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AIChatController - REST API Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AIChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AIChatService chatService;

    @MockBean
    private AIContextService contextService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private ApiEndpointCacheService apiEndpointCacheService;

    // Helper methods
    private User createTestUser() {
        return User.builder()
                .id(1L)
                .username("testuser@example.com")
                .email("testuser@example.com")
                .name("Test User")
                .enabled(true)
                .build();
    }

    private AIContext createTestContext() {
        return AIContext.builder()
                .id(1L)
                .code("OPERATIONS")
                .name("Operaciones")
                .description("Contexto para operaciones")
                .contextType("OPERATIONS")
                .enabled(true)
                .displayOrder(1)
                .createdAt(Instant.now())
                .build();
    }

    private AIConversation createTestConversation(User user, AIContext context) {
        return AIConversation.builder()
                .id(1L)
                .user(user)
                .context(context)
                .title("Test Conversation")
                .isFavorite(false)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    private AIMessage createTestMessage(AIConversation conversation, AIMessage.MessageRole role) {
        return AIMessage.builder()
                .id(1L)
                .conversation(conversation)
                .role(role)
                .content("Test message content")
                .createdAt(Instant.now())
                .build();
    }

    // ==================================================================================
    // 1. GET CONTEXTS - GET /api/v1/ai/chat/contexts
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. GET CONTEXTS - GET /api/v1/ai/chat/contexts")
    class GetContextsEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return available contexts")
        void shouldReturnAvailableContexts() throws Exception {
            // Arrange
            AIContext context1 = createTestContext();
            AIContext context2 = AIContext.builder()
                    .id(2L)
                    .code("ACCOUNTING")
                    .name("Contabilidad")
                    .description("Contexto para contabilidad")
                    .contextType("ACCOUNTING")
                    .enabled(true)
                    .displayOrder(2)
                    .createdAt(Instant.now())
                    .build();
            List<AIContext> contexts = Arrays.asList(context1, context2);
            when(contextService.getAvailableContexts()).thenReturn(contexts);

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/contexts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.data[0].code").value("OPERATIONS"))
                    .andExpect(jsonPath("$.data[1].code").value("ACCOUNTING"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return empty list when no contexts available")
        void shouldReturnEmptyListWhenNoContexts() throws Exception {
            // Arrange
            when(contextService.getAvailableContexts()).thenReturn(List.of());

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/contexts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(0)));
        }
    }

    // ==================================================================================
    // 2. CREATE CONVERSATION - POST /api/v1/ai/chat/conversations
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. CREATE CONVERSATION - POST /api/v1/ai/chat/conversations")
    class CreateConversationEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should create new conversation")
        void shouldCreateConversation() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            when(chatService.createConversation("New Conversation", 1L, null)).thenReturn(conversation);

            String requestBody = """
                {
                    "title": "New Conversation",
                    "contextId": 1
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/ai/chat/conversations")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Test Conversation"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should create conversation without context")
        void shouldCreateConversationWithoutContext() throws Exception {
            // Arrange
            User user = createTestUser();
            AIConversation conversation = AIConversation.builder()
                    .id(1L)
                    .user(user)
                    .title("New Conversation")
                    .isFavorite(false)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            when(chatService.createConversation("New Conversation", null, null)).thenReturn(conversation);

            String requestBody = """
                {
                    "title": "New Conversation"
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/ai/chat/conversations")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ==================================================================================
    // 3. GET CONVERSATIONS - GET /api/v1/ai/chat/conversations
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. GET CONVERSATIONS - GET /api/v1/ai/chat/conversations")
    class GetConversationsEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return user conversations")
        void shouldReturnUserConversations() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conv1 = createTestConversation(user, context);
            AIConversation conv2 = AIConversation.builder()
                    .id(2L)
                    .user(user)
                    .context(context)
                    .title("Second Conversation")
                    .isFavorite(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            List<AIConversation> conversations = Arrays.asList(conv1, conv2);
            when(chatService.getUserConversations()).thenReturn(conversations);

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/conversations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }
    }

    // ==================================================================================
    // 4. GET CONVERSATION BY ID - GET /api/v1/ai/chat/conversations/{id}
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. GET CONVERSATION BY ID - GET /api/v1/ai/chat/conversations/{id}")
    class GetConversationByIdEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return conversation by ID")
        void shouldReturnConversationById() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            when(chatService.getConversation(1L)).thenReturn(conversation);

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/conversations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.title").value("Test Conversation"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when conversation not found")
        void shouldReturn404WhenNotFound() throws Exception {
            // Arrange
            when(chatService.getConversation(999L)).thenThrow(new IllegalArgumentException("Conversation not found"));

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/conversations/999"))
                    .andExpect(status().isNotFound());
        }
    }

    // ==================================================================================
    // 5. DELETE CONVERSATION - DELETE /api/v1/ai/chat/conversations/{id}
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. DELETE CONVERSATION - DELETE /api/v1/ai/chat/conversations/{id}")
    class DeleteConversationEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should delete conversation")
        void shouldDeleteConversation() throws Exception {
            // Arrange
            doNothing().when(chatService).deleteConversation(1L);

            // Act & Assert
            mockMvc.perform(delete("/v1/ai/chat/conversations/1")
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            verify(chatService).deleteConversation(1L);
        }

        @Test
        @WithMockUser
        @DisplayName("Should return 404 when deleting non-existent conversation")
        void shouldReturn404WhenDeletingNonExistent() throws Exception {
            // Arrange
            doThrow(new IllegalArgumentException("Conversation not found"))
                    .when(chatService).deleteConversation(999L);

            // Act & Assert
            mockMvc.perform(delete("/v1/ai/chat/conversations/999")
                            .with(csrf()))
                    .andExpect(status().isNotFound());
        }
    }

    // ==================================================================================
    // 6. SEND MESSAGE - POST /api/v1/ai/chat/conversations/{id}/messages
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. SEND MESSAGE - POST /api/v1/ai/chat/conversations/{id}/messages")
    class SendMessageEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should send message to conversation")
        void shouldSendMessage() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            AIMessage message = createTestMessage(conversation, AIMessage.MessageRole.ASSISTANT);
            when(chatService.sendMessage(1L, "Hello")).thenReturn(message);

            String requestBody = """
                {
                    "message": "Hello"
                }
            """;

            // Act & Assert
            mockMvc.perform(post("/v1/ai/chat/conversations/1/messages")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content").value("Test message content"));
        }
    }

    // ==================================================================================
    // 7. GET MESSAGES - GET /api/v1/ai/chat/conversations/{id}/messages
    // ==================================================================================

    @Nested
    @Order(7)
    @DisplayName("7. GET MESSAGES - GET /api/v1/ai/chat/conversations/{id}/messages")
    class GetMessagesEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should return messages for conversation")
        void shouldReturnMessages() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            AIMessage msg1 = createTestMessage(conversation, AIMessage.MessageRole.USER);
            AIMessage msg2 = createTestMessage(conversation, AIMessage.MessageRole.ASSISTANT);
            msg2.setId(2L);
            msg2.setContent("AI response");
            List<AIMessage> messages = Arrays.asList(msg1, msg2);
            when(chatService.getMessages(1L)).thenReturn(messages);

            // Act & Assert
            mockMvc.perform(get("/v1/ai/chat/conversations/1/messages"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(2)));
        }
    }

    // ==================================================================================
    // 8. TOGGLE FAVORITE - PATCH /api/v1/ai/chat/conversations/{id}/favorite
    // ==================================================================================

    @Nested
    @Order(8)
    @DisplayName("8. TOGGLE FAVORITE - PATCH /api/v1/ai/chat/conversations/{id}/favorite")
    class ToggleFavoriteEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should toggle favorite status")
        void shouldToggleFavorite() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            conversation.setIsFavorite(true);
            when(chatService.toggleFavorite(1L, true)).thenReturn(conversation);

            String requestBody = """
                {
                    "isFavorite": true
                }
            """;

            // Act & Assert
            mockMvc.perform(patch("/v1/ai/chat/conversations/1/favorite")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.isFavorite").value(true));
        }
    }

    // ==================================================================================
    // 9. UPDATE TITLE - PATCH /api/v1/ai/chat/conversations/{id}/title
    // ==================================================================================

    @Nested
    @Order(9)
    @DisplayName("9. UPDATE TITLE - PATCH /api/v1/ai/chat/conversations/{id}/title")
    class UpdateTitleEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should update conversation title")
        void shouldUpdateTitle() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            conversation.setTitle("Updated Title");
            when(chatService.updateTitle(1L, "Updated Title")).thenReturn(conversation);

            String requestBody = """
                {
                    "title": "Updated Title"
                }
            """;

            // Act & Assert
            mockMvc.perform(patch("/v1/ai/chat/conversations/1/title")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.title").value("Updated Title"));
        }

        @Test
        @WithMockUser
        @DisplayName("Should reject empty title")
        void shouldRejectEmptyTitle() throws Exception {
            String requestBody = """
                {
                    "title": ""
                }
            """;

            // Act & Assert
            mockMvc.perform(patch("/v1/ai/chat/conversations/1/title")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isBadRequest());
        }
    }

    // ==================================================================================
    // 10. UPDATE FOLDER - PATCH /api/v1/ai/chat/conversations/{id}/folder
    // ==================================================================================

    @Nested
    @Order(10)
    @DisplayName("10. UPDATE FOLDER - PATCH /api/v1/ai/chat/conversations/{id}/folder")
    class UpdateFolderEndpointTests {

        @Test
        @WithMockUser
        @DisplayName("Should update conversation folder")
        void shouldUpdateFolder() throws Exception {
            // Arrange
            User user = createTestUser();
            AIContext context = createTestContext();
            AIConversation conversation = createTestConversation(user, context);
            conversation.setFolderName("Work");
            when(chatService.updateFolder(1L, "Work")).thenReturn(conversation);

            String requestBody = """
                {
                    "folderName": "Work"
                }
            """;

            // Act & Assert
            mockMvc.perform(patch("/v1/ai/chat/conversations/1/folder")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestBody))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}

