package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAAWorkspaceRepository extends JpaRepository<CPPAAWorkspace, Long> {

    Optional<CPPAAWorkspace> findByEntityRucAndFiscalYear(String entityRuc, Integer fiscalYear);

    Optional<CPPAAWorkspace> findByWorkspaceCode(String workspaceCode);

    List<CPPAAWorkspace> findByCoordinatorUserIdOrderByCreatedAtDesc(String coordinatorUserId);

    List<CPPAAWorkspace> findByStatusOrderByCreatedAtDesc(String status);

    List<CPPAAWorkspace> findByFiscalYearOrderByEntityNameAsc(Integer fiscalYear);
}
