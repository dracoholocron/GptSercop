package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.FinancialInstitution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialInstitutionRepository extends JpaRepository<FinancialInstitution, Long> {

    Optional<FinancialInstitution> findByCodigo(String codigo);

    Optional<FinancialInstitution> findBySwiftCode(String swiftCode);

    List<FinancialInstitution> findByPais(String pais);

    List<FinancialInstitution> findByEsCorresponsalTrue();

    List<FinancialInstitution> findByActivoTrue();

    boolean existsByCodigo(String codigo);

    boolean existsBySwiftCode(String swiftCode);
}
