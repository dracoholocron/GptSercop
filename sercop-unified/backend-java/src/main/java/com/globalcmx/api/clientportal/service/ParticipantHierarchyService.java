package com.globalcmx.api.clientportal.service;

import com.globalcmx.api.readmodel.entity.ParticipanteReadModel;
import com.globalcmx.api.readmodel.repository.ParticipanteReadModelRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing participant hierarchy (corporations, companies, branches).
 * Provides access control logic for the client portal.
 */
@Service
@Transactional(readOnly = true)
public class ParticipantHierarchyService {

    private static final Logger logger = LoggerFactory.getLogger(ParticipantHierarchyService.class);

    private final ParticipanteReadModelRepository participantRepository;

    public ParticipantHierarchyService(ParticipanteReadModelRepository participantRepository) {
        this.participantRepository = participantRepository;
    }

    /**
     * Get all participant IDs that a user can access based on their assigned participant.
     *
     * Rules:
     * - If user's participant is a CORPORATION: can access all descendants (companies and branches)
     * - If user's participant is a COMPANY with children: can access self and all branches
     * - If user's participant is a COMPANY without children: can only access self
     * - If user's participant is a BRANCH: can only access self
     *
     * @param participantId The participant ID assigned to the user
     * @return List of accessible participant IDs
     */
    public List<Long> getAccessibleParticipantIds(Long participantId) {
        if (participantId == null) {
            return List.of();
        }

        Optional<ParticipanteReadModel> participantOpt = participantRepository.findById(participantId);
        if (participantOpt.isEmpty()) {
            logger.warn("Participant not found: {}", participantId);
            return List.of();
        }

        ParticipanteReadModel participant = participantOpt.get();

        // If it's a corporation or has children, get all descendants
        if (participant.isCorporation() || participantRepository.hasChildren(participantId)) {
            return participantRepository.findAllDescendantIds(participantId);
        }

        // Otherwise, only self
        return List.of(participantId);
    }

    /**
     * Get accessible participants as entities with hierarchy info.
     *
     * @param participantId The participant ID assigned to the user
     * @return List of accessible participants
     */
    public List<ParticipanteReadModel> getAccessibleParticipants(Long participantId) {
        if (participantId == null) {
            return List.of();
        }

        Optional<ParticipanteReadModel> participantOpt = participantRepository.findById(participantId);
        if (participantOpt.isEmpty()) {
            return List.of();
        }

        ParticipanteReadModel participant = participantOpt.get();

        // If it's a corporation or has children, get all descendants
        if (participant.isCorporation() || participantRepository.hasChildren(participantId)) {
            return participantRepository.findAllDescendants(participantId);
        }

        // Otherwise, only self
        return List.of(participant);
    }

    /**
     * Check if a user (by their participant) can access a specific participant's data.
     *
     * @param userParticipantId The participant ID assigned to the user
     * @param targetParticipantId The participant ID to check access for
     * @return true if access is allowed
     */
    public boolean canAccessParticipant(Long userParticipantId, Long targetParticipantId) {
        if (userParticipantId == null || targetParticipantId == null) {
            return false;
        }

        // Same participant - always allowed
        if (userParticipantId.equals(targetParticipantId)) {
            return true;
        }

        // Check if target is a descendant of user's participant
        return participantRepository.isDescendantOf(targetParticipantId, userParticipantId);
    }

    /**
     * Check if the user's participant is a corporation (can see multiple companies).
     *
     * @param participantId The participant ID
     * @return true if it's a corporation
     */
    public boolean isCorporation(Long participantId) {
        return participantRepository.findById(participantId)
                .map(ParticipanteReadModel::isCorporation)
                .orElse(false);
    }

    /**
     * Check if the user's participant has children (is a parent).
     *
     * @param participantId The participant ID
     * @return true if has children
     */
    public boolean hasMultipleCompanies(Long participantId) {
        if (participantId == null) {
            return false;
        }

        Optional<ParticipanteReadModel> participant = participantRepository.findById(participantId);
        if (participant.isEmpty()) {
            return false;
        }

        // A corporation or company with children has multiple accessible companies
        return participant.get().isCorporation() || participantRepository.hasChildren(participantId);
    }

    /**
     * Get the children (direct descendants) of a participant.
     *
     * @param participantId The parent participant ID
     * @return List of child participants
     */
    public List<ParticipanteReadModel> getChildren(Long participantId) {
        if (participantId == null) {
            return List.of();
        }
        return participantRepository.findByParentIdOrderByNombresAsc(participantId);
    }

    /**
     * Get the root corporation for a participant (traverse up the hierarchy).
     *
     * @param participantId Any participant ID
     * @return The root corporation, or the participant itself if it's already root
     */
    public Optional<ParticipanteReadModel> getRootCorporation(Long participantId) {
        if (participantId == null) {
            return Optional.empty();
        }
        return participantRepository.findRootAncestor(participantId);
    }

    /**
     * Get the ancestor path from root to a participant (for breadcrumb display).
     *
     * @param participantId The participant ID
     * @return List of participants from root to the given participant
     */
    public List<ParticipanteReadModel> getAncestorPath(Long participantId) {
        if (participantId == null) {
            return List.of();
        }
        return participantRepository.findAncestorPath(participantId);
    }

    /**
     * Build a hierarchical tree structure starting from a participant.
     *
     * @param participantId The root participant ID
     * @return The participant with populated children (recursively)
     */
    public Optional<ParticipanteReadModel> getHierarchyTree(Long participantId) {
        return participantRepository.findById(participantId)
                .map(this::loadChildrenRecursively);
    }

    private ParticipanteReadModel loadChildrenRecursively(ParticipanteReadModel participant) {
        List<ParticipanteReadModel> children = participantRepository.findByParentIdOrderByNombresAsc(participant.getId());

        // Recursively load children of children
        List<ParticipanteReadModel> loadedChildren = children.stream()
                .map(this::loadChildrenRecursively)
                .collect(Collectors.toList());

        participant.setChildren(loadedChildren);
        return participant;
    }

    /**
     * Add a participant as a child of another (create hierarchy relationship).
     *
     * @param parentId The parent participant ID
     * @param childId The child participant ID
     * @param hierarchyType The hierarchy type for the child (COMPANY, BRANCH)
     */
    @Transactional
    public void addChild(Long parentId, Long childId, String hierarchyType) {
        ParticipanteReadModel parent = participantRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent participant not found: " + parentId));

        ParticipanteReadModel child = participantRepository.findById(childId)
                .orElseThrow(() -> new IllegalArgumentException("Child participant not found: " + childId));

        // Validate: cannot add a participant that already has a parent
        if (child.getParentId() != null) {
            throw new IllegalStateException("Participant " + childId + " already has a parent");
        }

        // Validate: cannot create circular reference
        if (participantRepository.isDescendantOf(parentId, childId)) {
            throw new IllegalStateException("Cannot create circular hierarchy");
        }

        // Set parent and hierarchy level
        child.setParentId(parentId);
        child.setHierarchyType(hierarchyType != null ? hierarchyType : "COMPANY");
        child.setHierarchyLevel(parent.getHierarchyLevel() + 1);

        participantRepository.save(child);

        logger.info("Added participant {} as child of {} with type {}", childId, parentId, hierarchyType);
    }

    /**
     * Remove a participant from its parent (remove from hierarchy).
     *
     * @param childId The child participant ID to detach
     */
    @Transactional
    public void removeFromParent(Long childId) {
        ParticipanteReadModel child = participantRepository.findById(childId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + childId));

        if (child.getParentId() == null) {
            throw new IllegalStateException("Participant " + childId + " has no parent");
        }

        Long oldParentId = child.getParentId();

        child.setParentId(null);
        child.setHierarchyType("COMPANY");
        child.setHierarchyLevel(0);

        participantRepository.save(child);

        logger.info("Removed participant {} from parent {}", childId, oldParentId);
    }

    /**
     * Convert a participant to a corporation (top-level holding).
     *
     * @param participantId The participant ID
     */
    @Transactional
    public void convertToCorporation(Long participantId) {
        ParticipanteReadModel participant = participantRepository.findById(participantId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found: " + participantId));

        if (participant.getParentId() != null) {
            throw new IllegalStateException("Cannot convert a child participant to corporation. Remove from parent first.");
        }

        participant.setHierarchyType("CORPORATION");
        participant.setHierarchyLevel(0);

        participantRepository.save(participant);

        logger.info("Converted participant {} to CORPORATION", participantId);
    }
}
