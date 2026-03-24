package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPPAAWorkspaceCommentRepository extends JpaRepository<CPPAAWorkspaceComment, Long> {

    List<CPPAAWorkspaceComment> findByWorkspaceIdOrderByCreatedAtAsc(Long workspaceId);

    List<CPPAAWorkspaceComment> findByWorkspaceIdAndDepartmentPlanIdOrderByCreatedAtAsc(Long workspaceId, Long departmentPlanId);

    // Field-level comments (inline)
    List<CPPAAWorkspaceComment> findByWorkspaceIdAndDepartmentPlanIdAndAnchorFieldAndAnchorPhaseIndexOrderByCreatedAtAsc(
            Long workspaceId, Long departmentPlanId, String anchorField, Integer anchorPhaseIndex);

    // Replies to a comment
    List<CPPAAWorkspaceComment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);

    // Count comments grouped by field anchor for badge display
    @Query("SELECT CONCAT(c.anchorField, ':', c.anchorPhaseIndex), COUNT(c) " +
           "FROM CPPAAWorkspaceComment c " +
           "WHERE c.workspaceId = :wsId AND c.departmentPlanId = :deptId " +
           "AND c.anchorField IS NOT NULL " +
           "GROUP BY c.anchorField, c.anchorPhaseIndex")
    List<Object[]> countCommentsByFieldAnchor(@Param("wsId") Long workspaceId, @Param("deptId") Long departmentPlanId);
}
