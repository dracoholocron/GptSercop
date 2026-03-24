package com.globalcmx.api.security.schedule.service;

import com.globalcmx.api.security.entity.Role;
import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.repository.RoleRepository;
import com.globalcmx.api.security.repository.UserRepository;
import com.globalcmx.api.security.schedule.entity.ScheduleExemptRole;
import com.globalcmx.api.security.schedule.entity.ScheduleExemptUser;
import com.globalcmx.api.security.schedule.repository.ScheduleExemptRoleRepository;
import com.globalcmx.api.security.schedule.repository.ScheduleExemptUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleExemptionService {

    private final ScheduleExemptUserRepository exemptUserRepo;
    private final ScheduleExemptRoleRepository exemptRoleRepo;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    // === Exempt Users ===

    public List<ScheduleExemptUser> getAllExemptUsers() {
        return exemptUserRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<ScheduleExemptUser> getActiveExemptUsers() {
        return exemptUserRepo.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public ScheduleExemptUser createExemptUser(Long userId, String reason, LocalDateTime validFrom, LocalDateTime validUntil) {
        if (exemptUserRepo.existsByUserId(userId)) {
            throw new IllegalArgumentException("El usuario ya tiene una exención configurada");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + userId));

        String currentUser = getCurrentUsername();

        ScheduleExemptUser exemption = ScheduleExemptUser.builder()
                .user(user)
                .reason(reason)
                .isActive(true)
                .validFrom(validFrom)
                .validUntil(validUntil)
                .createdBy(currentUser)
                .approvedBy(currentUser)
                .approvedAt(LocalDateTime.now())
                .build();

        log.info("Creating exempt user for userId={} by {}: {}", userId, currentUser, reason);
        return exemptUserRepo.save(exemption);
    }

    @Transactional
    public ScheduleExemptUser updateExemptUser(Long id, String reason, LocalDateTime validFrom, LocalDateTime validUntil, Boolean isActive) {
        ScheduleExemptUser exemption = exemptUserRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        if (reason != null) exemption.setReason(reason);
        if (validFrom != null) exemption.setValidFrom(validFrom);
        if (validUntil != null) exemption.setValidUntil(validUntil);
        if (isActive != null) exemption.setIsActive(isActive);

        exemption.setUpdatedBy(getCurrentUsername());

        log.info("Updating exempt user {} by {}", id, getCurrentUsername());
        return exemptUserRepo.save(exemption);
    }

    @Transactional
    public void deleteExemptUser(Long id) {
        ScheduleExemptUser exemption = exemptUserRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        log.info("Deleting exempt user {} (userId={}) by {}",
                id, exemption.getUser().getId(), getCurrentUsername());
        exemptUserRepo.delete(exemption);
    }

    @Transactional
    public ScheduleExemptUser toggleExemptUserActive(Long id) {
        ScheduleExemptUser exemption = exemptUserRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        exemption.setIsActive(!exemption.getIsActive());
        exemption.setUpdatedBy(getCurrentUsername());

        log.info("Toggling exempt user {} active={} by {}",
                id, exemption.getIsActive(), getCurrentUsername());
        return exemptUserRepo.save(exemption);
    }

    // === Exempt Roles ===

    public List<ScheduleExemptRole> getAllExemptRoles() {
        return exemptRoleRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<ScheduleExemptRole> getActiveExemptRoles() {
        return exemptRoleRepo.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public ScheduleExemptRole createExemptRole(Long roleId, String reason, LocalDateTime validFrom, LocalDateTime validUntil) {
        if (exemptRoleRepo.existsByRoleId(roleId)) {
            throw new IllegalArgumentException("El rol ya tiene una exención configurada");
        }

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado: " + roleId));

        String currentUser = getCurrentUsername();

        ScheduleExemptRole exemption = ScheduleExemptRole.builder()
                .role(role)
                .reason(reason)
                .isActive(true)
                .validFrom(validFrom)
                .validUntil(validUntil)
                .createdBy(currentUser)
                .approvedBy(currentUser)
                .approvedAt(LocalDateTime.now())
                .build();

        log.info("Creating exempt role for roleId={} by {}: {}", roleId, currentUser, reason);
        return exemptRoleRepo.save(exemption);
    }

    @Transactional
    public ScheduleExemptRole updateExemptRole(Long id, String reason, LocalDateTime validFrom, LocalDateTime validUntil, Boolean isActive) {
        ScheduleExemptRole exemption = exemptRoleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        if (reason != null) exemption.setReason(reason);
        if (validFrom != null) exemption.setValidFrom(validFrom);
        if (validUntil != null) exemption.setValidUntil(validUntil);
        if (isActive != null) exemption.setIsActive(isActive);

        exemption.setUpdatedBy(getCurrentUsername());

        log.info("Updating exempt role {} by {}", id, getCurrentUsername());
        return exemptRoleRepo.save(exemption);
    }

    @Transactional
    public void deleteExemptRole(Long id) {
        ScheduleExemptRole exemption = exemptRoleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        log.info("Deleting exempt role {} (roleId={}) by {}",
                id, exemption.getRole().getId(), getCurrentUsername());
        exemptRoleRepo.delete(exemption);
    }

    @Transactional
    public ScheduleExemptRole toggleExemptRoleActive(Long id) {
        ScheduleExemptRole exemption = exemptRoleRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exención no encontrada: " + id));

        exemption.setIsActive(!exemption.getIsActive());
        exemption.setUpdatedBy(getCurrentUsername());

        log.info("Toggling exempt role {} active={} by {}",
                id, exemption.getIsActive(), getCurrentUsername());
        return exemptRoleRepo.save(exemption);
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }
}
