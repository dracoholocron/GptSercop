package com.globalcmx.api.customfields.repository;

import com.globalcmx.api.customfields.entity.OperationCustomData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for OperationCustomData entities.
 */
@Repository
public interface OperationCustomDataRepository extends JpaRepository<OperationCustomData, String> {

    /**
     * Find custom data by operation ID.
     */
    Optional<OperationCustomData> findByOperationId(String operationId);

    /**
     * Find custom data by operation type.
     */
    List<OperationCustomData> findByOperationType(String operationType);

    /**
     * Check if custom data exists for an operation.
     */
    boolean existsByOperationId(String operationId);

    /**
     * Find operations with a specific field value (JSON query).
     * Note: Requires MySQL 5.7+ JSON functions.
     */
    @Query(value = "SELECT * FROM operation_custom_data_readmodel " +
                   "WHERE JSON_EXTRACT(custom_data, :jsonPath) = :value",
           nativeQuery = true)
    List<OperationCustomData> findByCustomFieldValue(
        @Param("jsonPath") String jsonPath,
        @Param("value") String value
    );

    /**
     * Find operations with a custom field containing a value (for arrays/repeatable sections).
     */
    @Query(value = "SELECT * FROM operation_custom_data_readmodel " +
                   "WHERE JSON_SEARCH(custom_data, 'one', :value, NULL, :jsonPath) IS NOT NULL",
           nativeQuery = true)
    List<OperationCustomData> findByCustomFieldContaining(
        @Param("jsonPath") String jsonPath,
        @Param("value") String value
    );
}
