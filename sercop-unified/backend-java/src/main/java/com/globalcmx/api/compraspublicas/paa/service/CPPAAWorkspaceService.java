package com.globalcmx.api.compraspublicas.paa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.compraspublicas.paa.entity.*;
import com.globalcmx.api.compraspublicas.paa.repository.*;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import com.globalcmx.api.realtime.dto.RealTimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CPPAAWorkspaceService {

    private final CPPAAWorkspaceRepository workspaceRepository;
    private final CPPAADepartmentPlanRepository departmentPlanRepository;
    private final CPPAAWorkspaceCommentRepository commentRepository;
    private final CPPAAWorkspaceObserverRepository observerRepository;
    private final CPPAAWorkspaceProposalRepository proposalRepository;
    private final CPPAAWorkspaceProposalVoteRepository proposalVoteRepository;
    private final CPPAAFieldChangeLogRepository fieldChangeLogRepository;
    private final RealTimeNotificationService realTimeNotificationService;
    private final ObjectMapper objectMapper;

    // ========================================================================
    // Workspace CRUD
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspace createWorkspace(String entityRuc, String entityName, Integer fiscalYear,
                                           String sectorCode, Long methodologyId, BigDecimal totalBudget,
                                           String coordinatorUserId, String coordinatorUserName) {
        log.info("Creating PAA workspace: entity={}, fiscalYear={}", entityRuc, fiscalYear);

        String code = String.format("PAA-%d-%s", fiscalYear, entityRuc.substring(0, Math.min(6, entityRuc.length())));

        CPPAAWorkspace workspace = CPPAAWorkspace.builder()
                .workspaceCode(code)
                .entityRuc(entityRuc)
                .entityName(entityName)
                .fiscalYear(fiscalYear)
                .sectorCode(sectorCode)
                .methodologyId(methodologyId)
                .totalBudget(totalBudget)
                .coordinatorUserId(coordinatorUserId)
                .coordinatorUserName(coordinatorUserName)
                .status("ABIERTO")
                .createdAt(LocalDateTime.now())
                .build();

        return workspaceRepository.save(workspace);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAAWorkspace getWorkspace(Long id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + id));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspace> listWorkspaces(Integer fiscalYear) {
        return workspaceRepository.findByFiscalYearOrderByEntityNameAsc(fiscalYear);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspace> listMyWorkspaces(String userId) {
        return workspaceRepository.findByCoordinatorUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspace updateWorkspaceStatus(Long id, String newStatus, String userId) {
        log.info("Updating workspace {} status to {}", id, newStatus);
        CPPAAWorkspace workspace = getWorkspace(id);
        workspace.setStatus(newStatus);
        CPPAAWorkspace saved = workspaceRepository.save(workspace);

        broadcastWorkspaceEvent(id, "PAA_WORKSPACE_STATUS_UPDATE", Map.of(
                "workspaceId", id,
                "newStatus", newStatus
        ), userId);

        return saved;
    }

    // ========================================================================
    // Department Plans
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan addDepartment(Long workspaceId, String departmentName, String departmentCode,
                                              String assignedUserId, String assignedUserName,
                                              BigDecimal departmentBudget) {
        log.info("Adding department {} to workspace {}", departmentName, workspaceId);

        CPPAAWorkspace workspace = getWorkspace(workspaceId);

        CPPAADepartmentPlan plan = CPPAADepartmentPlan.builder()
                .workspace(workspace)
                .departmentName(departmentName)
                .departmentCode(departmentCode)
                .assignedUserId(assignedUserId)
                .assignedUserName(assignedUserName)
                .departmentBudget(departmentBudget)
                .status("PENDIENTE")
                .currentPhase(0)
                .createdAt(LocalDateTime.now())
                .build();

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_ADDED", Map.of(
                "departmentId", saved.getId(),
                "departmentName", departmentName
        ), null);

        return saved;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAADepartmentPlan getDepartmentPlan(Long id) {
        return departmentPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department plan not found: " + id));
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAADepartmentPlan> getMyDepartmentPlans(String userId) {
        return departmentPlanRepository.findByAssignedUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan updatePhaseData(Long departmentPlanId, Integer phaseNumber,
                                                String phaseDataJson, String userId) {
        log.info("Updating phase {} data for department plan {}", phaseNumber, departmentPlanId);

        CPPAADepartmentPlan plan = getDepartmentPlan(departmentPlanId);
        String oldPhaseDataJson = plan.getPhaseData();

        plan.setCurrentPhase(phaseNumber);
        plan.setPhaseData(phaseDataJson);
        if ("PENDIENTE".equals(plan.getStatus())) {
            plan.setStatus("EN_PROGRESO");
        }
        plan.setLastModifiedBy(userId);
        plan.setLastModifiedByName(resolveUserDisplayName(userId));

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        Long workspaceId = plan.getWorkspaceId() != null ? plan.getWorkspaceId() :
                (plan.getWorkspace() != null ? plan.getWorkspace().getId() : null);

        // Track field-level changes
        if (workspaceId != null) {
            detectAndLogFieldChanges(workspaceId, plan.getId(), oldPhaseDataJson, phaseDataJson,
                    userId, saved.getLastModifiedByName());
        }

        if (workspaceId != null) {
            broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_PHASE_UPDATE", Map.of(
                    "departmentId", plan.getId(),
                    "departmentName", plan.getDepartmentName(),
                    "modifiedByName", saved.getLastModifiedByName() != null ? saved.getLastModifiedByName() : "",
                    "changeType", "PHASE_DATA_UPDATE",
                    "phaseNumber", phaseNumber,
                    "status", plan.getStatus()
            ), userId);
        }

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan updateItemsData(Long departmentPlanId, String itemsDataJson,
                                                Integer itemsCount, BigDecimal itemsTotalBudget, String userId) {
        log.info("Updating items data for department plan {}", departmentPlanId);

        CPPAADepartmentPlan plan = getDepartmentPlan(departmentPlanId);
        plan.setItemsData(itemsDataJson);
        plan.setItemsCount(itemsCount);
        plan.setItemsTotalBudget(itemsTotalBudget);
        plan.setLastModifiedBy(userId);
        plan.setLastModifiedByName(resolveUserDisplayName(userId));

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        Long workspaceId = plan.getWorkspaceId() != null ? plan.getWorkspaceId() :
                (plan.getWorkspace() != null ? plan.getWorkspace().getId() : null);
        if (workspaceId != null) {
            broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_ITEMS_UPDATED", Map.of(
                    "departmentId", plan.getId(),
                    "departmentName", plan.getDepartmentName(),
                    "modifiedByName", saved.getLastModifiedByName() != null ? saved.getLastModifiedByName() : "",
                    "changeType", "ITEMS_DATA_UPDATE",
                    "itemsCount", itemsCount,
                    "status", plan.getStatus()
            ), userId);
        }

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan submitDepartmentPlan(Long departmentPlanId, String itemsDataJson,
                                                     Integer itemsCount, BigDecimal itemsTotalBudget,
                                                     String userId) {
        log.info("Submitting department plan {}", departmentPlanId);

        CPPAADepartmentPlan plan = getDepartmentPlan(departmentPlanId);
        plan.setStatus("ENVIADO");
        plan.setItemsData(itemsDataJson);
        plan.setItemsCount(itemsCount);
        plan.setItemsTotalBudget(itemsTotalBudget);
        plan.setSubmittedAt(LocalDateTime.now());
        plan.setLastModifiedBy(userId);
        plan.setLastModifiedByName(resolveUserDisplayName(userId));

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        Long workspaceId = plan.getWorkspaceId() != null ? plan.getWorkspaceId() :
                (plan.getWorkspace() != null ? plan.getWorkspace().getId() : null);
        if (workspaceId != null) {
            broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_SUBMITTED", Map.of(
                    "departmentId", plan.getId(),
                    "departmentName", plan.getDepartmentName(),
                    "modifiedByName", saved.getLastModifiedByName() != null ? saved.getLastModifiedByName() : "",
                    "changeType", "SUBMITTED",
                    "itemsCount", itemsCount,
                    "totalBudget", itemsTotalBudget
            ), userId);
        }

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan approveDepartmentPlan(Long departmentPlanId, String approvedBy) {
        log.info("Approving department plan {}", departmentPlanId);

        CPPAADepartmentPlan plan = getDepartmentPlan(departmentPlanId);
        plan.setStatus("APROBADO");
        plan.setApprovedAt(LocalDateTime.now());
        plan.setApprovedBy(approvedBy);
        plan.setLastModifiedBy(approvedBy);
        plan.setLastModifiedByName(resolveUserDisplayName(approvedBy));

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        Long workspaceId = plan.getWorkspaceId() != null ? plan.getWorkspaceId() :
                (plan.getWorkspace() != null ? plan.getWorkspace().getId() : null);
        if (workspaceId != null) {
            broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_APPROVED", Map.of(
                    "departmentId", plan.getId(),
                    "departmentName", plan.getDepartmentName(),
                    "modifiedByName", saved.getLastModifiedByName() != null ? saved.getLastModifiedByName() : "",
                    "changeType", "APPROVED",
                    "approvedBy", approvedBy
            ), approvedBy);
        }

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAADepartmentPlan rejectDepartmentPlan(Long departmentPlanId, String rejectionReason, String rejectedBy) {
        log.info("Rejecting department plan {}: {}", departmentPlanId, rejectionReason);

        CPPAADepartmentPlan plan = getDepartmentPlan(departmentPlanId);
        plan.setStatus("RECHAZADO");
        plan.setRejectionReason(rejectionReason);
        plan.setLastModifiedBy(rejectedBy);
        plan.setLastModifiedByName(resolveUserDisplayName(rejectedBy));

        CPPAADepartmentPlan saved = departmentPlanRepository.save(plan);

        Long workspaceId = plan.getWorkspaceId() != null ? plan.getWorkspaceId() :
                (plan.getWorkspace() != null ? plan.getWorkspace().getId() : null);
        if (workspaceId != null) {
            broadcastWorkspaceEvent(workspaceId, "PAA_DEPT_REJECTED", Map.of(
                    "departmentId", plan.getId(),
                    "departmentName", plan.getDepartmentName(),
                    "modifiedByName", saved.getLastModifiedByName() != null ? saved.getLastModifiedByName() : "",
                    "changeType", "REJECTED",
                    "reason", rejectionReason
            ), rejectedBy);
        }

        return saved;
    }

    // ========================================================================
    // Consolidation
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspace consolidateWorkspace(Long workspaceId, String userId) {
        log.info("Consolidating workspace {}", workspaceId);

        CPPAAWorkspace workspace = getWorkspace(workspaceId);
        List<CPPAADepartmentPlan> approvedPlans = departmentPlanRepository
                .findByWorkspaceIdAndStatus(workspaceId, "APROBADO");

        if (approvedPlans.isEmpty()) {
            throw new IllegalStateException("No approved department plans to consolidate");
        }

        Map<String, Object> consolidated = new HashMap<>();
        consolidated.put("entityRuc", workspace.getEntityRuc());
        consolidated.put("entityName", workspace.getEntityName());
        consolidated.put("fiscalYear", workspace.getFiscalYear());
        consolidated.put("totalDepartments", approvedPlans.size());

        int totalItems = 0;
        BigDecimal totalBudget = BigDecimal.ZERO;
        for (CPPAADepartmentPlan plan : approvedPlans) {
            totalItems += plan.getItemsCount() != null ? plan.getItemsCount() : 0;
            totalBudget = totalBudget.add(plan.getItemsTotalBudget() != null ? plan.getItemsTotalBudget() : BigDecimal.ZERO);
            plan.setStatus("CONSOLIDADO");
            departmentPlanRepository.save(plan);
        }

        consolidated.put("totalItems", totalItems);
        consolidated.put("totalBudget", totalBudget);

        try {
            workspace.setConsolidatedData(objectMapper.writeValueAsString(consolidated));
        } catch (Exception e) {
            log.error("Error serializing consolidated data", e);
        }

        workspace.setStatus("CONSOLIDADO");
        workspace.setTotalBudget(totalBudget);

        CPPAAWorkspace saved = workspaceRepository.save(workspace);

        broadcastWorkspaceEvent(workspaceId, "PAA_WORKSPACE_CONSOLIDATED", Map.of(
                "workspaceId", workspaceId,
                "totalDepartments", approvedPlans.size(),
                "totalItems", totalItems
        ), userId);

        return saved;
    }

    // ========================================================================
    // Dashboard data
    // ========================================================================

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Map<String, Object> getWorkspaceDashboard(Long workspaceId) {
        CPPAAWorkspace workspace = getWorkspace(workspaceId);
        List<CPPAADepartmentPlan> plans = departmentPlanRepository.findByWorkspaceIdOrderByDepartmentNameAsc(workspaceId);

        int totalItems = 0;
        BigDecimal totalBudget = BigDecimal.ZERO;
        int completedDepts = 0;
        int inProgressDepts = 0;
        int pendingDepts = 0;

        for (CPPAADepartmentPlan plan : plans) {
            totalItems += plan.getItemsCount() != null ? plan.getItemsCount() : 0;
            totalBudget = totalBudget.add(plan.getItemsTotalBudget() != null ? plan.getItemsTotalBudget() : BigDecimal.ZERO);
            switch (plan.getStatus()) {
                case "ENVIADO", "APROBADO", "CONSOLIDADO" -> completedDepts++;
                case "EN_PROGRESO" -> inProgressDepts++;
                default -> pendingDepts++;
            }
        }

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("workspace", workspace);
        dashboard.put("departments", plans);
        dashboard.put("totalItems", totalItems);
        dashboard.put("totalBudget", totalBudget);
        dashboard.put("completedDepts", completedDepts);
        dashboard.put("inProgressDepts", inProgressDepts);
        dashboard.put("pendingDepts", pendingDepts);

        return dashboard;
    }

    // ========================================================================
    // Comments
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceComment addComment(Long workspaceId, Long departmentPlanId,
                                             String authorUserId, String authorUserName,
                                             String authorRole, String content) {
        log.info("Adding comment to workspace {} by {}", workspaceId, authorUserId);

        CPPAAWorkspaceComment comment = CPPAAWorkspaceComment.builder()
                .workspaceId(workspaceId)
                .departmentPlanId(departmentPlanId)
                .authorUserId(authorUserId)
                .authorUserName(authorUserName)
                .authorRole(authorRole != null ? authorRole : "COORDINATOR")
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        CPPAAWorkspaceComment saved = commentRepository.save(comment);

        Map<String, Object> commentData = new HashMap<>();
        commentData.put("commentId", saved.getId());
        commentData.put("authorUserName", authorUserName);
        commentData.put("authorRole", saved.getAuthorRole());
        commentData.put("content", content);
        if (departmentPlanId != null) {
            commentData.put("departmentPlanId", departmentPlanId);
        }

        broadcastWorkspaceEvent(workspaceId, "PAA_COMMENT_ADDED", commentData, authorUserId);

        return saved;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspaceComment> getComments(Long workspaceId) {
        return commentRepository.findByWorkspaceIdOrderByCreatedAtAsc(workspaceId);
    }

    // ========================================================================
    // Field-level (inline) comments
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceComment addFieldComment(Long workspaceId, Long departmentPlanId,
                                                  String anchorField, Integer anchorPhaseIndex,
                                                  String authorUserId, String authorUserName,
                                                  String authorRole, String content, Long parentCommentId) {
        log.info("Adding field comment to ws={}, dept={}, field={}:{}", workspaceId, departmentPlanId, anchorField, anchorPhaseIndex);

        CPPAAWorkspaceComment comment = CPPAAWorkspaceComment.builder()
                .workspaceId(workspaceId)
                .departmentPlanId(departmentPlanId)
                .anchorField(anchorField)
                .anchorPhaseIndex(anchorPhaseIndex)
                .parentCommentId(parentCommentId)
                .authorUserId(authorUserId)
                .authorUserName(authorUserName)
                .authorRole(authorRole != null ? authorRole : "COORDINATOR")
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();

        CPPAAWorkspaceComment saved = commentRepository.save(comment);

        Map<String, Object> commentData = new HashMap<>();
        commentData.put("commentId", saved.getId());
        commentData.put("authorUserName", authorUserName);
        commentData.put("authorRole", saved.getAuthorRole());
        commentData.put("content", content);
        commentData.put("anchorField", anchorField);
        commentData.put("anchorPhaseIndex", anchorPhaseIndex);
        if (departmentPlanId != null) commentData.put("departmentPlanId", departmentPlanId);

        broadcastWorkspaceEvent(workspaceId, "PAA_FIELD_COMMENT_ADDED", commentData, authorUserId);

        return saved;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspaceComment> getFieldComments(Long workspaceId, Long departmentPlanId,
                                                         String anchorField, Integer anchorPhaseIndex) {
        return commentRepository.findByWorkspaceIdAndDepartmentPlanIdAndAnchorFieldAndAnchorPhaseIndexOrderByCreatedAtAsc(
                workspaceId, departmentPlanId, anchorField, anchorPhaseIndex);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Map<String, Integer> getFieldCommentCounts(Long workspaceId, Long departmentPlanId) {
        List<Object[]> results = commentRepository.countCommentsByFieldAnchor(workspaceId, departmentPlanId);
        Map<String, Integer> counts = new HashMap<>();
        for (Object[] row : results) {
            counts.put((String) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    // ========================================================================
    // Observers
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceObserver addObserver(Long workspaceId, String userId, String userName,
                                               String role, String addedBy) {
        log.info("Adding observer {} to workspace {}", userId, workspaceId);

        // Check workspace exists
        getWorkspace(workspaceId);

        CPPAAWorkspaceObserver observer = CPPAAWorkspaceObserver.builder()
                .workspaceId(workspaceId)
                .userId(userId)
                .userName(userName)
                .role(role != null ? role : "OBSERVER")
                .addedBy(addedBy)
                .addedAt(LocalDateTime.now())
                .build();

        CPPAAWorkspaceObserver saved = observerRepository.save(observer);

        broadcastWorkspaceEvent(workspaceId, "PAA_OBSERVER_ADDED", Map.of(
                "userId", userId,
                "userName", userName,
                "role", saved.getRole()
        ), addedBy);

        return saved;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspaceObserver> getObservers(Long workspaceId) {
        return observerRepository.findByWorkspaceIdOrderByAddedAtAsc(workspaceId);
    }

    @Transactional("readModelTransactionManager")
    public void removeObserver(Long workspaceId, String userId, String removedBy) {
        log.info("Removing observer {} from workspace {}", userId, workspaceId);
        observerRepository.deleteByWorkspaceIdAndUserId(workspaceId, userId);

        broadcastWorkspaceEvent(workspaceId, "PAA_OBSERVER_REMOVED", Map.of(
                "userId", userId
        ), removedBy);
    }

    // ========================================================================
    // Participants (coordinator + departments + observers with online status)
    // ========================================================================

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<Map<String, Object>> getWorkspaceParticipants(Long workspaceId) {
        CPPAAWorkspace workspace = getWorkspace(workspaceId);
        List<Map<String, Object>> participants = new ArrayList<>();

        // Coordinator
        Map<String, Object> coordinator = new HashMap<>();
        coordinator.put("userId", workspace.getCoordinatorUserId());
        coordinator.put("userName", workspace.getCoordinatorUserName());
        coordinator.put("role", "COORDINATOR");
        coordinator.put("online", realTimeNotificationService.isUserConnected(workspace.getCoordinatorUserId()));
        participants.add(coordinator);

        // Department assigned users
        List<CPPAADepartmentPlan> plans = departmentPlanRepository.findByWorkspaceIdOrderByDepartmentNameAsc(workspaceId);
        Set<String> addedUserIds = new HashSet<>();
        addedUserIds.add(workspace.getCoordinatorUserId());

        for (CPPAADepartmentPlan plan : plans) {
            if (plan.getAssignedUserId() != null && !addedUserIds.contains(plan.getAssignedUserId())) {
                Map<String, Object> dept = new HashMap<>();
                dept.put("userId", plan.getAssignedUserId());
                dept.put("userName", plan.getAssignedUserName());
                dept.put("role", "DEPARTMENT");
                dept.put("departmentName", plan.getDepartmentName());
                dept.put("online", realTimeNotificationService.isUserConnected(plan.getAssignedUserId()));
                participants.add(dept);
                addedUserIds.add(plan.getAssignedUserId());
            }
        }

        // Observers
        List<CPPAAWorkspaceObserver> observers = observerRepository.findByWorkspaceIdOrderByAddedAtAsc(workspaceId);
        for (CPPAAWorkspaceObserver observer : observers) {
            if (!addedUserIds.contains(observer.getUserId())) {
                Map<String, Object> obs = new HashMap<>();
                obs.put("userId", observer.getUserId());
                obs.put("userName", observer.getUserName());
                obs.put("role", "OBSERVER");
                obs.put("online", realTimeNotificationService.isUserConnected(observer.getUserId()));
                participants.add(obs);
                addedUserIds.add(observer.getUserId());
            }
        }

        return participants;
    }

    // ========================================================================
    // Proposals with voting
    // ========================================================================

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceProposal createProposal(Long workspaceId, Long departmentPlanId,
                                                   String anchorField, Integer anchorPhaseIndex,
                                                   String proposerUserId, String proposerName,
                                                   String currentValue, String proposedValue,
                                                   String justification) {
        log.info("Creating proposal for ws={}, dept={}, field={}:{}", workspaceId, departmentPlanId, anchorField, anchorPhaseIndex);

        // Calculate votes required = ceil(participants / 2)
        List<Map<String, Object>> participants = getWorkspaceParticipants(workspaceId);
        int votesRequired = Math.max(1, (int) Math.ceil(participants.size() / 2.0));

        CPPAAWorkspaceProposal proposal = CPPAAWorkspaceProposal.builder()
                .workspaceId(workspaceId)
                .departmentPlanId(departmentPlanId)
                .anchorField(anchorField)
                .anchorPhaseIndex(anchorPhaseIndex != null ? anchorPhaseIndex : 0)
                .proposerUserId(proposerUserId)
                .proposerName(proposerName != null ? proposerName : resolveUserDisplayName(proposerUserId))
                .currentValue(currentValue)
                .proposedValue(proposedValue)
                .justification(justification)
                .status("OPEN")
                .votesRequired(votesRequired)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CPPAAWorkspaceProposal saved = proposalRepository.save(proposal);

        broadcastWorkspaceEvent(workspaceId, "PAA_PROPOSAL_CREATED", Map.of(
                "proposalId", saved.getId(),
                "proposerName", saved.getProposerName(),
                "anchorField", anchorField,
                "departmentPlanId", departmentPlanId
        ), proposerUserId);

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceProposal voteOnProposal(Long proposalId, String voterUserId, String voterName,
                                                   String voteType, String comment) {
        CPPAAWorkspaceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        if (!"OPEN".equals(proposal.getStatus())) {
            throw new IllegalStateException("Proposal is not open for voting");
        }

        // Check for duplicate vote
        if (proposalVoteRepository.findByProposalIdAndVoterUserId(proposalId, voterUserId).isPresent()) {
            throw new IllegalStateException("User has already voted on this proposal");
        }

        CPPAAWorkspaceProposalVote vote = CPPAAWorkspaceProposalVote.builder()
                .proposal(proposal)
                .voterUserId(voterUserId)
                .voterName(voterName != null ? voterName : resolveUserDisplayName(voterUserId))
                .voteType(voteType)
                .comment(comment)
                .votedAt(LocalDateTime.now())
                .build();

        proposalVoteRepository.save(vote);

        // Update counts
        if ("APPROVE".equals(voteType)) {
            proposal.setVotesApprove(proposal.getVotesApprove() + 1);
        } else {
            proposal.setVotesReject(proposal.getVotesReject() + 1);
        }

        // Auto-resolve if majority reached
        if (proposal.getVotesApprove() >= proposal.getVotesRequired()) {
            proposal.setStatus("APPROVED");
            proposal.setResolvedAt(LocalDateTime.now());
        } else if (proposal.getVotesReject() >= proposal.getVotesRequired()) {
            proposal.setStatus("REJECTED");
            proposal.setResolvedAt(LocalDateTime.now());
        }

        proposal.setUpdatedAt(LocalDateTime.now());
        CPPAAWorkspaceProposal saved = proposalRepository.save(proposal);

        broadcastWorkspaceEvent(proposal.getWorkspaceId(), "PAA_PROPOSAL_VOTED", Map.of(
                "proposalId", proposalId,
                "voterName", vote.getVoterName(),
                "voteType", voteType,
                "proposalStatus", saved.getStatus()
        ), voterUserId);

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public CPPAAWorkspaceProposal applyProposal(Long proposalId, String appliedBy) {
        CPPAAWorkspaceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        if (!"APPROVED".equals(proposal.getStatus())) {
            throw new IllegalStateException("Proposal must be APPROVED before applying");
        }

        // Patch the field value in phaseData
        CPPAADepartmentPlan plan = getDepartmentPlan(proposal.getDepartmentPlanId());
        try {
            if (plan.getPhaseData() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> phaseDataMap = objectMapper.readValue(plan.getPhaseData(), Map.class);

                // Navigate to the correct phase and set the field
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> phases = (List<Map<String, Object>>) phaseDataMap.get("phases");
                if (phases != null && proposal.getAnchorPhaseIndex() < phases.size()) {
                    Map<String, Object> phase = phases.get(proposal.getAnchorPhaseIndex());
                    phase.put(proposal.getAnchorField(), proposal.getProposedValue());
                }

                plan.setPhaseData(objectMapper.writeValueAsString(phaseDataMap));
                plan.setLastModifiedBy(appliedBy);
                plan.setLastModifiedByName(resolveUserDisplayName(appliedBy));
                departmentPlanRepository.save(plan);
            }
        } catch (Exception e) {
            log.error("Error applying proposal to phaseData: {}", e.getMessage());
            throw new IllegalStateException("Failed to apply proposal to phase data", e);
        }

        proposal.setStatus("APPLIED");
        proposal.setResolvedBy(appliedBy);
        proposal.setResolvedAt(LocalDateTime.now());
        proposal.setUpdatedAt(LocalDateTime.now());
        CPPAAWorkspaceProposal saved = proposalRepository.save(proposal);

        broadcastWorkspaceEvent(proposal.getWorkspaceId(), "PAA_PROPOSAL_APPLIED", Map.of(
                "proposalId", proposalId,
                "anchorField", proposal.getAnchorField(),
                "departmentPlanId", proposal.getDepartmentPlanId(),
                "appliedBy", appliedBy
        ), appliedBy);

        return saved;
    }

    @Transactional("readModelTransactionManager")
    public void withdrawProposal(Long proposalId, String userId) {
        CPPAAWorkspaceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        if (!proposal.getProposerUserId().equals(userId)) {
            throw new IllegalStateException("Only the proposer can withdraw the proposal");
        }
        if (!"OPEN".equals(proposal.getStatus())) {
            throw new IllegalStateException("Can only withdraw OPEN proposals");
        }

        proposal.setStatus("WITHDRAWN");
        proposal.setUpdatedAt(LocalDateTime.now());
        proposalRepository.save(proposal);
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public List<CPPAAWorkspaceProposal> getProposals(Long workspaceId, String status) {
        List<CPPAAWorkspaceProposal> proposals;
        if (status != null && !status.isEmpty()) {
            proposals = proposalRepository.findByWorkspaceIdAndStatusOrderByCreatedAtDesc(workspaceId, status);
        } else {
            proposals = proposalRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        }
        // Detach votes to avoid LazyInitializationException during JSON serialization
        proposals.forEach(p -> p.setVotes(null));
        return proposals;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public CPPAAWorkspaceProposal getProposalDetail(Long proposalId) {
        CPPAAWorkspaceProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));
        // Force-load votes
        if (proposal.getVotes() != null) {
            proposal.getVotes().size();
        }
        return proposal;
    }

    @Transactional(transactionManager = "readModelTransactionManager", readOnly = true)
    public Map<String, Integer> getProposalCounts(Long workspaceId, Long departmentPlanId) {
        List<Object[]> results = proposalRepository.countOpenProposalsByFieldAnchor(workspaceId, departmentPlanId);
        Map<String, Integer> counts = new HashMap<>();
        for (Object[] row : results) {
            counts.put((String) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    // ========================================================================
    // User name resolution
    // ========================================================================

    /**
     * Resolve a display name for the given userId.
     * First checks if the user is a known workspace participant (coordinator / department / observer).
     * Falls back to the userId itself.
     */
    private String resolveUserDisplayName(String userId) {
        if (userId == null) return null;
        // Look up from department plans where assignedUserId matches
        List<CPPAADepartmentPlan> plans = departmentPlanRepository.findAll();
        for (CPPAADepartmentPlan p : plans) {
            if (userId.equals(p.getAssignedUserId()) && p.getAssignedUserName() != null) {
                return p.getAssignedUserName();
            }
        }
        // Look up from workspaces where coordinator matches
        List<CPPAAWorkspace> workspaces = workspaceRepository.findAll();
        for (CPPAAWorkspace ws : workspaces) {
            if (userId.equals(ws.getCoordinatorUserId()) && ws.getCoordinatorUserName() != null) {
                return ws.getCoordinatorUserName();
            }
        }
        // Look up from observers
        List<CPPAAWorkspaceObserver> observers = observerRepository.findAll();
        for (CPPAAWorkspaceObserver obs : observers) {
            if (userId.equals(obs.getUserId()) && obs.getUserName() != null) {
                return obs.getUserName();
            }
        }
        return userId;
    }

    // ========================================================================
    // Real-time broadcast
    // ========================================================================

    private void broadcastWorkspaceEvent(Long workspaceId, String eventType, Map<String, Object> data, String excludeUserId) {
        try {
            // Collect all participant user IDs
            Set<String> recipientIds = new HashSet<>();

            CPPAAWorkspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
            if (workspace == null) return;

            // Coordinator
            if (workspace.getCoordinatorUserId() != null) {
                recipientIds.add(workspace.getCoordinatorUserId());
            }

            // Department assigned users
            List<CPPAADepartmentPlan> plans = departmentPlanRepository.findByWorkspaceIdOrderByDepartmentNameAsc(workspaceId);
            for (CPPAADepartmentPlan plan : plans) {
                if (plan.getAssignedUserId() != null) {
                    recipientIds.add(plan.getAssignedUserId());
                }
            }

            // Observers
            List<CPPAAWorkspaceObserver> observers = observerRepository.findByWorkspaceIdOrderByAddedAtAsc(workspaceId);
            for (CPPAAWorkspaceObserver observer : observers) {
                recipientIds.add(observer.getUserId());
            }

            // Remove excluded user (the one who triggered the event)
            if (excludeUserId != null) {
                recipientIds.remove(excludeUserId);
            }

            // Build JSON envelope
            Map<String, Object> envelope = new HashMap<>();
            envelope.put("type", "PAA_WORKSPACE_EVENT");
            envelope.put("workspaceId", workspaceId);
            envelope.put("event", eventType);
            envelope.put("data", data);
            envelope.put("timestamp", System.currentTimeMillis());

            String messageJson = objectMapper.writeValueAsString(envelope);

            // Send to each participant
            for (String userId : recipientIds) {
                try {
                    realTimeNotificationService.sendInstantMessage(userId,
                            RealTimeMessage.of("paa-workspace", "PAA Workspace", messageJson));
                } catch (Exception e) {
                    log.debug("Failed to send workspace event to user {}: {}", userId, e.getMessage());
                }
            }

            log.debug("Broadcast workspace event {} to {} users for workspace {}",
                    eventType, recipientIds.size(), workspaceId);
        } catch (Exception e) {
            log.warn("Failed to broadcast workspace event {}: {}", eventType, e.getMessage());
        }
    }

    // ========================================================================
    // Field Change Log — Track Changes
    // ========================================================================

    /**
     * Compares old and new phaseData JSON, detects field-level changes, and logs them.
     */
    @SuppressWarnings("unchecked")
    private void detectAndLogFieldChanges(Long workspaceId, Long departmentPlanId,
                                           String oldJson, String newJson,
                                           String userId, String userName) {
        try {
            if (oldJson == null || oldJson.isBlank()) {
                log.info("[FieldChangeLog] Skipping — old phaseData is null/blank for dept {}", departmentPlanId);
                return;
            }
            Map<String, Object> oldData = objectMapper.readValue(oldJson, Map.class);
            Map<String, Object> newData = objectMapper.readValue(newJson, Map.class);
            int changesFound = 0;

            log.info("[FieldChangeLog] oldKeys={} newKeys={}", oldData.keySet(), newData.keySet());

            // phaseData can be in two formats:
            // Format A (after mural serialization): { "phaseKey": { "needs": "...", "priorities": "...", ... }, ... }
            // Format B (AI-generated / wizard): { "data": {...}, "step": 7, "phaseCode": "..." }
            // We handle both by iterating all top-level keys where the value is a Map (phase objects)

            for (String phaseKey : newData.keySet()) {
                Object newPhaseObj = newData.get(phaseKey);
                Object oldPhaseObj = oldData.get(phaseKey);

                // Skip non-Map values (step numbers, phaseCode strings, etc.)
                if (!(newPhaseObj instanceof Map)) {
                    continue;
                }

                // Derive phaseIndex: try numeric parse, otherwise use iteration order
                int phaseIndex;
                try {
                    phaseIndex = Integer.parseInt(phaseKey.replaceAll("\\D", "")) - 1;
                    if (phaseIndex < 0) phaseIndex = 0;
                } catch (NumberFormatException e) {
                    // Non-numeric key like "data" — use 0 as default
                    phaseIndex = 0;
                }

                Map<String, Object> newPhase = (Map<String, Object>) newPhaseObj;
                Map<String, Object> oldPhase = oldPhaseObj instanceof Map ? (Map<String, Object>) oldPhaseObj : Map.of();

                // Compare all fields within this phase object
                changesFound += comparePhaseFields(workspaceId, departmentPlanId, phaseIndex,
                        newPhase, oldPhase, userId, userName);
            }

            log.info("[FieldChangeLog] Compared dept={}: {} field changes logged", departmentPlanId, changesFound);
        } catch (Exception e) {
            log.warn("[FieldChangeLog] Failed for dept plan {}: {}", departmentPlanId, e.getMessage(), e);
        }
    }

    /** Compare fields within a phase object and log changes for string/text fields */
    private int comparePhaseFields(Long workspaceId, Long departmentPlanId, int phaseIndex,
                                    Map<String, Object> newPhase, Map<String, Object> oldPhase,
                                    String userId, String userName) {
        int changesFound = 0;
        // Fields we care about tracking (text fields that users edit)
        Set<String> trackableFields = Set.of(
                "needs", "priorities", "timeline", "missionSummary", "summary",
                "enrichedNeeds", "entityName", "entityRuc",
                "objectives", "justification", "scope", "description",
                "methodology", "budget", "requirements", "observations"
        );

        for (Map.Entry<String, Object> entry : newPhase.entrySet()) {
            String fieldCode = entry.getKey();
            Object newObj = entry.getValue();
            Object oldObj = oldPhase.get(fieldCode);

            // Only track known text fields, skip metadata/internal fields
            if (!trackableFields.contains(fieldCode)) {
                // Also track any field whose value is a non-empty string (catch custom fields)
                if (!(newObj instanceof String) || ((String) newObj).isBlank()) {
                    continue;
                }
            }

            // Stringify values for comparison
            String newValue;
            String oldValue;
            try {
                newValue = newObj != null ? (newObj instanceof String ? (String) newObj : objectMapper.writeValueAsString(newObj)) : "";
                oldValue = oldObj != null ? (oldObj instanceof String ? (String) oldObj : objectMapper.writeValueAsString(oldObj)) : "";
            } catch (Exception ex) {
                continue;
            }

            if (!newValue.equals(oldValue)) {
                CPPAAFieldChangeLog changeLog = CPPAAFieldChangeLog.builder()
                        .workspaceId(workspaceId)
                        .departmentPlanId(departmentPlanId)
                        .fieldCode(fieldCode)
                        .phaseIndex(phaseIndex)
                        .oldValue(oldValue)
                        .newValue(newValue)
                        .changedByUserId(userId)
                        .changedByName(userName != null ? userName : userId)
                        .changedAt(LocalDateTime.now())
                        .build();
                fieldChangeLogRepository.save(changeLog);
                changesFound++;
                log.info("[FieldChangeLog] Change detected: dept={} phase={} field='{}' by={}",
                        departmentPlanId, phaseIndex, fieldCode, userName);
            }
        }
        return changesFound;
    }

    /**
     * Get the latest field changes per field for a department plan (for diff highlighting).
     */
    @Transactional(value = "readModelTransactionManager", readOnly = true)
    public List<CPPAAFieldChangeLog> getLatestFieldChanges(Long departmentPlanId) {
        return fieldChangeLogRepository.findLatestChangesPerField(departmentPlanId);
    }

    /**
     * Get change history for a specific field.
     */
    @Transactional(value = "readModelTransactionManager", readOnly = true)
    public List<CPPAAFieldChangeLog> getFieldChangeHistory(Long departmentPlanId, String fieldCode, Integer phaseIndex) {
        return fieldChangeLogRepository.findByDepartmentPlanIdAndFieldCodeAndPhaseIndexOrderByChangedAtDesc(
                departmentPlanId, fieldCode, phaseIndex);
    }
}
