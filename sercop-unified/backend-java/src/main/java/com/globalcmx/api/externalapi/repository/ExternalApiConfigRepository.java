package com.globalcmx.api.externalapi.repository;

import com.globalcmx.api.externalapi.entity.ExternalApiConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalApiConfigRepository extends
        JpaRepository<ExternalApiConfigReadModel, Long>,
        JpaSpecificationExecutor<ExternalApiConfigReadModel> {

    Optional<ExternalApiConfigReadModel> findByCode(String code);

    Optional<ExternalApiConfigReadModel> findByCodeAndActiveTrue(String code);

    boolean existsByCode(String code);

    List<ExternalApiConfigReadModel> findByActiveTrue();

    List<ExternalApiConfigReadModel> findByEnvironment(String environment);

    List<ExternalApiConfigReadModel> findByActiveAndEnvironment(Boolean active, String environment);

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "LEFT JOIN FETCH c.authConfig " +
           "WHERE c.id = :id")
    Optional<ExternalApiConfigReadModel> findByIdWithAuth(@Param("id") Long id);

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "LEFT JOIN FETCH c.authConfig " +
           "LEFT JOIN FETCH c.requestTemplates " +
           "LEFT JOIN FETCH c.responseConfigs " +
           "WHERE c.id = :id")
    Optional<ExternalApiConfigReadModel> findByIdWithAllRelations(@Param("id") Long id);

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "LEFT JOIN FETCH c.authConfig " +
           "LEFT JOIN FETCH c.requestTemplates " +
           "LEFT JOIN FETCH c.responseConfigs " +
           "WHERE c.code = :code")
    Optional<ExternalApiConfigReadModel> findByCodeWithAllRelations(@Param("code") String code);

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "LEFT JOIN FETCH c.requestTemplates " +
           "WHERE c.code = :code")
    Optional<ExternalApiConfigReadModel> findByCodeWithTemplates(@Param("code") String code);

    @Query("SELECT c.name, c.httpMethod, c.baseUrl, c.path FROM ExternalApiConfigReadModel c WHERE c.code = :code")
    List<Object[]> findBasicFieldsByCode(@Param("code") String code);

    @Query("SELECT t.bodyTemplate FROM ExternalApiRequestTemplate t WHERE t.apiConfig.code = :code ORDER BY t.isDefault DESC")
    List<String> findBodyTemplatesByApiCode(@Param("code") String code);

    @Query("SELECT c.id FROM ExternalApiConfigReadModel c WHERE c.code = :code")
    Optional<Long> findIdByCode(@Param("code") String code);

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "WHERE c.active = true " +
           "ORDER BY c.name")
    List<ExternalApiConfigReadModel> findAllActiveOrderByName();

    @Query("SELECT c FROM ExternalApiConfigReadModel c " +
           "WHERE (:active IS NULL OR c.active = :active) " +
           "AND (:environment IS NULL OR c.environment = :environment) " +
           "ORDER BY c.name")
    List<ExternalApiConfigReadModel> findByFilters(
            @Param("active") Boolean active,
            @Param("environment") String environment);
}
