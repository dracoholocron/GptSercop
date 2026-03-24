package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAADepartmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAADepartmentPlanRepository extends JpaRepository<CPPAADepartmentPlan, Long> {

    List<CPPAADepartmentPlan> findByWorkspaceIdOrderByDepartmentNameAsc(Long workspaceId);

    Optional<CPPAADepartmentPlan> findByWorkspaceIdAndDepartmentCode(Long workspaceId, String departmentCode);

    List<CPPAADepartmentPlan> findByAssignedUserIdOrderByCreatedAtDesc(String assignedUserId);

    List<CPPAADepartmentPlan> findByWorkspaceIdAndStatus(Long workspaceId, String status);
}
