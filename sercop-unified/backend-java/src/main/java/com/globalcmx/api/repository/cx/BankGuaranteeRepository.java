package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.BankGuarantee;
import com.globalcmx.api.model.cx.enums.EstadoGarantia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankGuaranteeRepository extends JpaRepository<BankGuarantee, Long> {

    Optional<BankGuarantee> findByNumeroGarantia(String numeroGarantia);

    List<BankGuarantee> findByEstado(EstadoGarantia estado);

    List<BankGuarantee> findByOrdenanteId(Long ordenanteId);

    List<BankGuarantee> findByBeneficiarioId(Long beneficiarioId);

    boolean existsByNumeroGarantia(String numeroGarantia);
}
