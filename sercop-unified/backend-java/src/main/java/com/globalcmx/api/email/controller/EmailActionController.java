package com.globalcmx.api.email.controller;

import com.globalcmx.api.email.dto.EmailActionConfigDTO;
import com.globalcmx.api.email.entity.EmailActionConfig;
import com.globalcmx.api.email.service.EmailActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/v1/admin/email/actions")
@RequiredArgsConstructor
public class EmailActionController {

    private final EmailActionService service;

    @GetMapping
    public List<EmailActionConfig> findAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public EmailActionConfig findById(@PathVariable Long id) { return service.findById(id); }

    @PostMapping
    public EmailActionConfig create(@RequestBody EmailActionConfigDTO dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public EmailActionConfig update(@PathVariable Long id, @RequestBody EmailActionConfigDTO dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
