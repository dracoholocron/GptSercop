package com.globalcmx.api.email.controller;

import com.globalcmx.api.email.dto.EmailProviderConfigDTO;
import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.service.EmailProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/admin/email/providers")
@RequiredArgsConstructor
public class EmailProviderController {

    private final EmailProviderService service;

    @GetMapping
    public List<EmailProviderConfig> findAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public EmailProviderConfig findById(@PathVariable Long id) { return service.findById(id); }

    @GetMapping("/active")
    public List<EmailProviderConfig> findActive() { return service.findActiveProviders(); }

    @GetMapping("/default")
    public ResponseEntity<EmailProviderConfig> findDefault() {
        EmailProviderConfig provider = service.findDefaultProvider();
        return provider != null ? ResponseEntity.ok(provider) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public EmailProviderConfig create(@RequestBody EmailProviderConfigDTO dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public EmailProviderConfig update(@PathVariable Long id, @RequestBody EmailProviderConfigDTO dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }

    @PostMapping("/{id}/set-default")
    public ResponseEntity<Void> setDefault(@PathVariable Long id) { service.setDefault(id); return ResponseEntity.ok().build(); }

    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        boolean success = service.testConnection(id);
        return ResponseEntity.ok(Map.of("success", success, "message", success ? "Connection successful" : "Connection failed"));
    }
}
