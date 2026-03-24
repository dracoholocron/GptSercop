package com.globalcmx.api.email.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.entity.EmailQueue;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MailgunEmailProvider.
 * Tests email sending and connection testing via Mailgun API.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MailgunEmailProvider - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MailgunEmailProviderTest {

    @Mock
    private RestTemplate restTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private MailgunEmailProvider mailgunProvider;

    private static final String MAILGUN_API_BASE = "https://api.mailgun.net/v3";

    // ==================================================================================
    // 1. PROVIDER TYPE TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Provider Type")
    class ProviderTypeTests {

        @Test
        @DisplayName("Should return MAILGUN as provider type")
        void shouldReturnMailgunProviderType() {
            // Act
            String type = mailgunProvider.getProviderType();

            // Assert
            assertThat(type).isEqualTo("MAILGUN");
        }
    }

    // ==================================================================================
    // 2. SEND EMAIL TESTS
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Send Email")
    class SendEmailTests {

        @Test
        @DisplayName("Should send email successfully via Mailgun")
        void shouldSendEmailSuccessfully() {
            // Arrange
            EmailQueue email = createEmailQueue();
            EmailProviderConfig config = createMailgunConfig();

            Map<String, String> responseBody = Map.of(
                    "id", "<20210101000000.1.ABC123@sandbox.mailgun.org>",
                    "message", "Queued. Thank you."
            );

            ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
            when(restTemplate.exchange(
                    eq(MAILGUN_API_BASE + "/sandbox.mailgun.org/messages"),
                    eq(HttpMethod.POST),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // Act
            EmailSendResult result = mailgunProvider.send(email, config);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getMessageId()).isEqualTo("<20210101000000.1.ABC123@sandbox.mailgun.org>");
            assertThat(result.getProviderResponse()).isEqualTo("Queued. Thank you.");

            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
        }

        @Test
        @DisplayName("Should handle Mailgun error response")
        void shouldHandleMailgunErrorResponse() {
            // Arrange
            EmailQueue email = createEmailQueue();
            EmailProviderConfig config = createMailgunConfig();

            ResponseEntity<Map> response = new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.POST),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // Act
            EmailSendResult result = mailgunProvider.send(email, config);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getErrorCode()).isEqualTo("MAILGUN_ERROR");
        }

        @Test
        @DisplayName("Should handle exception during send")
        void shouldHandleExceptionDuringSend() {
            // Arrange
            EmailQueue email = createEmailQueue();
            EmailProviderConfig config = createMailgunConfig();

            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.POST),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED, "Forbidden"));

            // Act
            EmailSendResult result = mailgunProvider.send(email, config);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getErrorCode()).isEqualTo("MAILGUN_ERROR");
        }

        @Test
        @DisplayName("Should use config from email when from address is provided")
        void shouldUseEmailFromAddressWhenProvided() {
            // Arrange
            EmailQueue email = createEmailQueue();
            email.setFromEmail("custom@sender.com");
            email.setFromName("Custom Sender");
            EmailProviderConfig config = createMailgunConfig();

            Map<String, String> responseBody = Map.of(
                    "id", "<message-id>",
                    "message", "Queued."
            );
            ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.POST),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // Act
            EmailSendResult result = mailgunProvider.send(email, config);

            // Assert
            assertThat(result.isSuccess()).isTrue();
            verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class));
        }

        @Test
        @DisplayName("Should handle email with CC and BCC")
        void shouldHandleEmailWithCcAndBcc() {
            // Arrange
            EmailQueue email = createEmailQueue();
            email.setCcAddresses("[\"cc1@test.com\", \"cc2@test.com\"]");
            email.setBccAddresses("[\"bcc@test.com\"]");
            EmailProviderConfig config = createMailgunConfig();

            Map<String, String> responseBody = Map.of("id", "<id>", "message", "Queued.");
            ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.POST),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // Act
            EmailSendResult result = mailgunProvider.send(email, config);

            // Assert
            assertThat(result.isSuccess()).isTrue();
        }
    }

    // ==================================================================================
    // 3. TEST CONNECTION TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Test Connection")
    class TestConnectionTests {

        @Test
        @DisplayName("Should return true when connection is successful")
        void shouldReturnTrueWhenConnectionSuccessful() {
            // Arrange
            EmailProviderConfig config = createMailgunConfig();

            ResponseEntity<Map> response = new ResponseEntity<>(Map.of(), HttpStatus.OK);
            when(restTemplate.exchange(
                    eq(MAILGUN_API_BASE + "/sandbox.mailgun.org"),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenReturn(response);

            // Act
            boolean result = mailgunProvider.testConnection(config);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should return false when connection fails with 401")
        void shouldReturnFalseWhenUnauthorized() {
            // Arrange
            EmailProviderConfig config = createMailgunConfig();

            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenThrow(new HttpClientErrorException(HttpStatus.UNAUTHORIZED));

            // Act
            boolean result = mailgunProvider.testConnection(config);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should return false when connection throws exception")
        void shouldReturnFalseWhenConnectionThrowsException() {
            // Arrange
            EmailProviderConfig config = createMailgunConfig();

            when(restTemplate.exchange(
                    anyString(),
                    eq(HttpMethod.GET),
                    any(HttpEntity.class),
                    eq(Map.class)
            )).thenThrow(new RuntimeException("Connection failed"));

            // Act
            boolean result = mailgunProvider.testConnection(config);

            // Assert
            assertThat(result).isFalse();
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private EmailQueue createEmailQueue() {
        return EmailQueue.builder()
                .id(1L)
                .uuid("test-uuid-123")
                .toAddresses("[\"recipient@test.com\"]")
                .subject("Test Subject")
                .bodyHtml("<h1>Test HTML</h1>")
                .bodyText("Test plain text")
                .priority(EmailQueue.Priority.NORMAL)
                .status(EmailQueue.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .createdBy("system")
                .build();
    }

    private EmailProviderConfig createMailgunConfig() {
        return EmailProviderConfig.builder()
                .id(1L)
                .name("Test Mailgun")
                .providerType("MAILGUN")
                .apiKey("key-abc123xyz")
                .apiEndpoint("sandbox.mailgun.org")
                .fromEmail("noreply@test.com")
                .fromName("Test Sender")
                .replyToEmail("reply@test.com")
                .isActive(true)
                .isDefault(true)
                .priority(1)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
