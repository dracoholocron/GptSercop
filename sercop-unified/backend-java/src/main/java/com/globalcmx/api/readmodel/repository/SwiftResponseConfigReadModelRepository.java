package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.SwiftResponseConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for SWIFT response configuration.
 * Provides queries for expected response rules.
 */
@Repository
public interface SwiftResponseConfigReadModelRepository extends JpaRepository<SwiftResponseConfigReadModel, Long> {

    /**
     * Find response config for sent message type
     */
    Optional<SwiftResponseConfigReadModel> findBySentMessageTypeAndOperationTypeAndLanguageAndIsActiveTrue(
            String sentMessageType, String operationType, String language);

    /**
     * Find all response configs for operation type
     */
    List<SwiftResponseConfigReadModel> findByOperationTypeAndLanguageAndIsActiveTrue(
            String operationType, String language);

    /**
     * Find all response configs by sent message type
     */
    List<SwiftResponseConfigReadModel> findBySentMessageTypeAndLanguageAndIsActiveTrue(
            String sentMessageType, String language);

    /**
     * Find response config by expected response type
     */
    List<SwiftResponseConfigReadModel> findByExpectedResponseTypeAndLanguageAndIsActiveTrue(
            String expectedResponseType, String language);

    /**
     * Find all active response configs
     */
    List<SwiftResponseConfigReadModel> findByIsActiveTrueOrderByOperationTypeAscSentMessageTypeAsc();

    /**
     * Find response configs by language
     */
    List<SwiftResponseConfigReadModel> findByLanguageAndIsActiveTrueOrderByOperationTypeAscSentMessageTypeAsc(
            String language);

    /**
     * Get expected response details
     */
    @Query("SELECT r FROM SwiftResponseConfigReadModel r WHERE " +
            "r.sentMessageType = :sentMessageType AND " +
            "r.operationType = :operationType AND " +
            "r.isActive = true")
    List<SwiftResponseConfigReadModel> findExpectedResponses(
            @Param("sentMessageType") String sentMessageType,
            @Param("operationType") String operationType);

    /**
     * Get distinct operation types
     */
    @Query("SELECT DISTINCT r.operationType FROM SwiftResponseConfigReadModel r WHERE r.isActive = true")
    List<String> findDistinctOperationTypes();

    /**
     * Get distinct sent message types
     */
    @Query("SELECT DISTINCT r.sentMessageType FROM SwiftResponseConfigReadModel r WHERE r.isActive = true")
    List<String> findDistinctSentMessageTypes();

    /**
     * Count by operation type
     */
    long countByOperationTypeAndIsActiveTrue(String operationType);

    /**
     * Find by sent message type, operation type and language (including inactive)
     */
    Optional<SwiftResponseConfigReadModel> findBySentMessageTypeAndOperationTypeAndLanguage(
            String sentMessageType, String operationType, String language);
}
