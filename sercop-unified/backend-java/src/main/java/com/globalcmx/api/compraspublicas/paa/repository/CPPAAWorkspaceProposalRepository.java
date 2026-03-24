package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPPAAWorkspaceProposalRepository extends JpaRepository<CPPAAWorkspaceProposal, Long> {

    List<CPPAAWorkspaceProposal> findByWorkspaceIdOrderByCreatedAtDesc(Long workspaceId);

    List<CPPAAWorkspaceProposal> findByWorkspaceIdAndStatusOrderByCreatedAtDesc(Long workspaceId, String status);

    List<CPPAAWorkspaceProposal> findByWorkspaceIdAndDepartmentPlanIdAndAnchorFieldAndAnchorPhaseIndexAndStatus(
            Long workspaceId, Long departmentPlanId, String anchorField, Integer anchorPhaseIndex, String status);

    @Query("SELECT CONCAT(p.anchorField, ':', p.anchorPhaseIndex), COUNT(p) " +
           "FROM CPPAAWorkspaceProposal p " +
           "WHERE p.workspaceId = :wsId AND p.departmentPlanId = :deptId AND p.status = 'OPEN' " +
           "GROUP BY p.anchorField, p.anchorPhaseIndex")
    List<Object[]> countOpenProposalsByFieldAnchor(@Param("wsId") Long workspaceId, @Param("deptId") Long departmentPlanId);
}
