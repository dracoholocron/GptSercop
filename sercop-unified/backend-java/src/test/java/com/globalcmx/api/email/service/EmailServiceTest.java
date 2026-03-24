package com.globalcmx.api.email.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.dto.EmailStatsDTO;
import com.globalcmx.api.email.dto.SendEmailRequest;
import com.globalcmx.api.email.entity.EmailLog;
import com.globalcmx.api.email.entity.EmailQueue;
import com.globalcmx.api.email.repository.EmailLogRepository;
import com.globalcmx.api.email.repository.EmailQueueRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailService.
 * Tests email queuing, retrieval, and management functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService - Unit Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EmailServiceTest {

    @Mock
    private EmailQueueRepository queueRepository;

    @Mock
    private EmailLogRepository logRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private EmailService emailService;

    // ==================================================================================
    // 1. QUEUE EMAIL TESTS
    // ==================================================================================

    @Nested
    @Order(1)
    @DisplayName("1. Queue Email")
    class QueueEmailTests {

        @Test
        @DisplayName("Should queue email successfully with all fields")
        void shouldQueueEmailSuccessfully() {
            // Arrange
            SendEmailRequest request = SendEmailRequest.builder()
                    .to(List.of("user@test.com"))
                    .cc(List.of("cc@test.com"))
                    .subject("Test Subject")
                    .bodyHtml("<h1>Test</h1>")
                    .bodyText("Test")
                    .priority("HIGH")
                    .referenceType("OPERATION")
                    .referenceId("OP-001")
                    .build();

            when(queueRepository.save(any(EmailQueue.class))).thenAnswer(inv -> {
                EmailQueue e = inv.getArgument(0);
                e.setId(1L);
                e.setUuid("test-uuid-123");
                return e;
            });
            when(logRepository.save(any(EmailLog.class))).thenReturn(new EmailLog());

            // Act
            EmailQueue result = emailService.queueEmail(request, "admin@test.com");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getSubject()).isEqualTo("Test Subject");
            assertThat(result.getPriority()).isEqualTo(EmailQueue.Priority.HIGH);
            assertThat(result.getReferenceType()).isEqualTo("OPERATION");
            assertThat(result.getReferenceId()).isEqualTo("OP-001");
            assertThat(result.getCreatedBy()).isEqualTo("admin@test.com");

            verify(queueRepository).save(any(EmailQueue.class));
            verify(logRepository).save(any(EmailLog.class)); // Log "QUEUED" event
        }

        @Test
        @DisplayName("Should queue email with default NORMAL priority when not specified")
        void shouldQueueEmailWithDefaultPriority() {
            // Arrange
            SendEmailRequest request = SendEmailRequest.builder()
                    .to(List.of("user@test.com"))
                    .subject("Test Subject")
                    .bodyText("Test body")
                    .build();

            when(queueRepository.save(any(EmailQueue.class))).thenAnswer(inv -> {
                EmailQueue e = inv.getArgument(0);
                e.setId(1L);
                return e;
            });
            when(logRepository.save(any(EmailLog.class))).thenReturn(new EmailLog());

            // Act
            EmailQueue result = emailService.queueEmail(request, "user@test.com");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getPriority()).isEqualTo(EmailQueue.Priority.NORMAL);
        }
    }

    // ==================================================================================
    // 2. FIND EMAIL TESTS
    // ==================================================================================

    @Nested
    @Order(2)
    @DisplayName("2. Find Email")
    class FindEmailTests {

        @Test
        @DisplayName("Should find email by ID")
        void shouldFindEmailById() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "test-uuid");
            when(queueRepository.findById(1L)).thenReturn(Optional.of(email));

            // Act
            EmailQueue result = emailService.findById(1L);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw exception when email not found by ID")
        void shouldThrowExceptionWhenNotFoundById() {
            // Arrange
            when(queueRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> emailService.findById(999L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Email not found: 999");
        }

        @Test
        @DisplayName("Should find email by UUID")
        void shouldFindEmailByUuid() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "unique-uuid-123");
            when(queueRepository.findByUuid("unique-uuid-123")).thenReturn(Optional.of(email));

            // Act
            EmailQueue result = emailService.findByUuid("unique-uuid-123");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getUuid()).isEqualTo("unique-uuid-123");
        }

        @Test
        @DisplayName("Should return paginated emails")
        void shouldReturnPaginatedEmails() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<EmailQueue> emails = List.of(
                    createEmailQueue(1L, "uuid-1"),
                    createEmailQueue(2L, "uuid-2")
            );
            Page<EmailQueue> page = new PageImpl<>(emails, pageable, 2);
            when(queueRepository.findAll(pageable)).thenReturn(page);

            // Act
            Page<EmailQueue> result = emailService.findAll(pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should find emails by status")
        void shouldFindEmailsByStatus() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            List<EmailQueue> emails = List.of(createEmailQueue(1L, "uuid-1"));
            emails.get(0).setStatus(EmailQueue.Status.FAILED);
            Page<EmailQueue> page = new PageImpl<>(emails, pageable, 1);
            when(queueRepository.findByStatus(EmailQueue.Status.FAILED, pageable)).thenReturn(page);

            // Act
            Page<EmailQueue> result = emailService.findByStatus(EmailQueue.Status.FAILED, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(EmailQueue.Status.FAILED);
        }
    }

    // ==================================================================================
    // 3. EMAIL STATS TESTS
    // ==================================================================================

    @Nested
    @Order(3)
    @DisplayName("3. Email Stats")
    class EmailStatsTests {

        @Test
        @DisplayName("Should calculate email stats correctly")
        void shouldCalculateEmailStats() {
            // Arrange
            List<Object[]> statusCounts = List.of(
                    new Object[]{EmailQueue.Status.PENDING, 5L},
                    new Object[]{EmailQueue.Status.SENT, 100L},
                    new Object[]{EmailQueue.Status.FAILED, 3L},
                    new Object[]{EmailQueue.Status.PROCESSING, 2L}
            );
            when(queueRepository.getStatusCounts()).thenReturn(statusCounts);

            // Act
            EmailStatsDTO stats = emailService.getStats();

            // Assert
            assertThat(stats).isNotNull();
            assertThat(stats.getPending()).isEqualTo(5L);
            assertThat(stats.getSent()).isEqualTo(100L);
            assertThat(stats.getFailed()).isEqualTo(3L);
            assertThat(stats.getProcessing()).isEqualTo(2L);
            assertThat(stats.getTotal()).isEqualTo(110L);
        }
    }

    // ==================================================================================
    // 4. CANCEL EMAIL TESTS
    // ==================================================================================

    @Nested
    @Order(4)
    @DisplayName("4. Cancel Email")
    class CancelEmailTests {

        @Test
        @DisplayName("Should cancel pending email")
        void shouldCancelPendingEmail() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "uuid-1");
            email.setStatus(EmailQueue.Status.PENDING);
            when(queueRepository.findById(1L)).thenReturn(Optional.of(email));
            when(queueRepository.save(any(EmailQueue.class))).thenAnswer(inv -> inv.getArgument(0));
            when(logRepository.save(any(EmailLog.class))).thenReturn(new EmailLog());

            // Act
            emailService.cancelEmail(1L);

            // Assert
            assertThat(email.getStatus()).isEqualTo(EmailQueue.Status.CANCELLED);
            verify(queueRepository).save(email);
            verify(logRepository).save(any(EmailLog.class));
        }

        @Test
        @DisplayName("Should throw exception when trying to cancel sent email")
        void shouldThrowExceptionWhenCancellingSentEmail() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "uuid-1");
            email.setStatus(EmailQueue.Status.SENT);
            when(queueRepository.findById(1L)).thenReturn(Optional.of(email));

            // Act & Assert
            assertThatThrownBy(() -> emailService.cancelEmail(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Cannot cancel sent email");
        }
    }

    // ==================================================================================
    // 5. RETRY EMAIL TESTS
    // ==================================================================================

    @Nested
    @Order(5)
    @DisplayName("5. Retry Email")
    class RetryEmailTests {

        @Test
        @DisplayName("Should retry failed email")
        void shouldRetryFailedEmail() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "uuid-1");
            email.setStatus(EmailQueue.Status.FAILED);
            email.setRetryCount(2);
            email.setLastError("Previous error");
            when(queueRepository.findById(1L)).thenReturn(Optional.of(email));
            when(queueRepository.save(any(EmailQueue.class))).thenAnswer(inv -> inv.getArgument(0));
            when(logRepository.save(any(EmailLog.class))).thenReturn(new EmailLog());

            // Act
            emailService.retryEmail(1L);

            // Assert
            assertThat(email.getStatus()).isEqualTo(EmailQueue.Status.PENDING);
            assertThat(email.getRetryCount()).isEqualTo(0);
            assertThat(email.getLastError()).isNull();
            verify(queueRepository).save(email);
        }

        @Test
        @DisplayName("Should throw exception when retrying non-failed email")
        void shouldThrowExceptionWhenRetryingNonFailedEmail() {
            // Arrange
            EmailQueue email = createEmailQueue(1L, "uuid-1");
            email.setStatus(EmailQueue.Status.PENDING);
            when(queueRepository.findById(1L)).thenReturn(Optional.of(email));

            // Act & Assert
            assertThatThrownBy(() -> emailService.retryEmail(1L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Can only retry failed emails");
        }
    }

    // ==================================================================================
    // 6. GET EMAIL LOGS TESTS
    // ==================================================================================

    @Nested
    @Order(6)
    @DisplayName("6. Get Email Logs")
    class GetEmailLogsTests {

        @Test
        @DisplayName("Should return email logs for email")
        void shouldReturnEmailLogs() {
            // Arrange
            List<EmailLog> logs = List.of(
                    createEmailLog(1L, 1L, "QUEUED"),
                    createEmailLog(2L, 1L, "PROCESSING"),
                    createEmailLog(3L, 1L, "SENT")
            );
            when(logRepository.findByEmailQueueIdOrderByEventTimestampDesc(1L)).thenReturn(logs);

            // Act
            List<EmailLog> result = emailService.getEmailLogs(1L);

            // Assert
            assertThat(result).hasSize(3);
            assertThat(result.get(0).getEventType()).isEqualTo("QUEUED");
        }
    }

    // ==================================================================================
    // HELPER METHODS
    // ==================================================================================

    private EmailQueue createEmailQueue(Long id, String uuid) {
        return EmailQueue.builder()
                .id(id)
                .uuid(uuid)
                .toAddresses("[\"user@test.com\"]")
                .subject("Test Subject")
                .bodyText("Test body")
                .priority(EmailQueue.Priority.NORMAL)
                .status(EmailQueue.Status.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .createdAt(LocalDateTime.now())
                .createdBy("system")
                .build();
    }

    private EmailLog createEmailLog(Long id, Long emailQueueId, String eventType) {
        return EmailLog.builder()
                .id(id)
                .emailQueueId(emailQueueId)
                .eventType(eventType)
                .eventTimestamp(LocalDateTime.now())
                .build();
    }
}
