package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ReferenceNumberConfigReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferenceNumberConfigRepository extends JpaRepository<ReferenceNumberConfigReadModel, Long> {

    List<ReferenceNumberConfigReadModel> findByClientIdAndActiveTrue(String clientId);

    Optional<ReferenceNumberConfigReadModel> findByClientIdAndProductCodeAndCountryCodeAndActiveTrue(
            String clientId, String productCode, String countryCode);

    List<ReferenceNumberConfigReadModel> findByProductCodeAndActiveTrue(String productCode);

    List<ReferenceNumberConfigReadModel> findByActiveTrue();

    @Query("SELECT c FROM ReferenceNumberConfigReadModel c WHERE c.clientId = :clientId " +
           "AND c.productCode = :productCode AND c.countryCode = :countryCode")
    Optional<ReferenceNumberConfigReadModel> findConfigByClientAndProduct(
            @Param("clientId") String clientId,
            @Param("productCode") String productCode,
            @Param("countryCode") String countryCode);
}
