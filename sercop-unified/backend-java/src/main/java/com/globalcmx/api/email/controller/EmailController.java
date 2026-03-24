package com.globalcmx.api.email.controller;

import com.globalcmx.api.email.dto.EmailQueueDTO;
import com.globalcmx.api.email.dto.EmailStatsDTO;
import com.globalcmx.api.email.dto.SendEmailRequest;
import com.globalcmx.api.email.entity.EmailLog;
import com.globalcmx.api.email.entity.EmailQueue;
import com.globalcmx.api.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/admin/email/queue")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService service;

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendEmail(@RequestBody SendEmailRequest request, Authentication auth) {
        String createdBy = auth != null ? auth.getName() : "system";
        EmailQueue email = service.queueEmail(request, createdBy);
        return ResponseEntity.ok(Map.of("success", true, "uuid", email.getUuid(), "message", "Email queued"));
    }

    @GetMapping
    public Page<EmailQueueDTO> findAll(Pageable pageable) { return service.findAll(pageable).map(service::mapToDTO); }

    @GetMapping("/{id}")
    public EmailQueueDTO findById(@PathVariable Long id) { return service.mapToDTO(service.findById(id)); }

    @GetMapping("/uuid/{uuid}")
    public EmailQueueDTO findByUuid(@PathVariable String uuid) { return service.mapToDTO(service.findByUuid(uuid)); }

    @GetMapping("/status/{status}")
    public Page<EmailQueueDTO> findByStatus(@PathVariable EmailQueue.Status status, Pageable pageable) { return service.findByStatus(status, pageable).map(service::mapToDTO); }

    @GetMapping("/{id}/logs")
    public List<EmailLog> getEmailLogs(@PathVariable Long id) { return service.getEmailLogs(id); }

    @GetMapping("/stats")
    public EmailStatsDTO getStats() { return service.getStats(); }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelEmail(@PathVariable Long id) { service.cancelEmail(id); return ResponseEntity.ok(Map.of("success", true)); }

    @PostMapping("/{id}/retry")
    public ResponseEntity<Map<String, Object>> retryEmail(@PathVariable Long id) { service.retryEmail(id); return ResponseEntity.ok(Map.of("success", true)); }
}
