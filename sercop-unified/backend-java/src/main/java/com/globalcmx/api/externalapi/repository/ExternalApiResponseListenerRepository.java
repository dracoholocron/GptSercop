package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiResponseListener;
import com.globalcmx.api.externalapi.entity.ExternalApiResponseListener.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExternalApiResponseListenerRepository extends JpaRepository<ExternalApiResponseListener, Long> {

    /**
     * Find all active listeners for an API config, ordered by priority
     */
    List<ExternalApiResponseListener> findByApiConfigIdAndIsActiveTrueOrderByPriorityAsc(Long apiConfigId);

    /**
     * Find all listeners for an API config
     */
    List<ExternalApiResponseListener> findByApiConfigIdOrderByPriorityAsc(Long apiConfigId);

    /**
     * Find listeners by action type
     */
    List<ExternalApiResponseListener> findByApiConfigIdAndActionTypeAndIsActiveTrue(Long apiConfigId, ActionType actionType);

    /**
     * Delete all listeners for an API config
     */
    void deleteByApiConfigId(Long apiConfigId);

    /**
     * Count active listeners for an API config
     */
    long countByApiConfigIdAndIsActiveTrue(Long apiConfigId);

    /**
     * Find listeners that should run on success
     */
    @Query("SELECT l FROM ExternalApiResponseListener l WHERE l.apiConfigId = :apiConfigId AND l.isActive = true AND l.onlyOnSuccess = true ORDER BY l.priority")
    List<ExternalApiResponseListener> findSuccessListeners(Long apiConfigId);

    /**
     * Find listeners that should run on failure
     */
    @Query("SELECT l FROM ExternalApiResponseListener l WHERE l.apiConfigId = :apiConfigId AND l.isActive = true AND l.onlyOnFailure = true ORDER BY l.priority")
    List<ExternalApiResponseListener> findFailureListeners(Long apiConfigId);
}
