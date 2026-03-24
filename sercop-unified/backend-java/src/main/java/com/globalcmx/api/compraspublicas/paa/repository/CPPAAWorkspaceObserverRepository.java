package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceObserver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAAWorkspaceObserverRepository extends JpaRepository<CPPAAWorkspaceObserver, Long> {

    List<CPPAAWorkspaceObserver> findByWorkspaceIdOrderByAddedAtAsc(Long workspaceId);

    Optional<CPPAAWorkspaceObserver> findByWorkspaceIdAndUserId(Long workspaceId, String userId);

    void deleteByWorkspaceIdAndUserId(Long workspaceId, String userId);
}
