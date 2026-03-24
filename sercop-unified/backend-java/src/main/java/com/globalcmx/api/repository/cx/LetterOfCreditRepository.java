package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.LetterOfCredit;
import com.globalcmx.api.model.cx.enums.EstadoLC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LetterOfCreditRepository extends JpaRepository<LetterOfCredit, Long> {

    Optional<LetterOfCredit> findByNumeroOperacion(String numeroOperacion);

    List<LetterOfCredit> findByEstado(EstadoLC estado);

    List<LetterOfCredit> findByOrdenanteId(Long ordenanteId);

    List<LetterOfCredit> findByBeneficiarioId(Long beneficiarioId);

    @Query("SELECT lc FROM LetterOfCredit lc WHERE lc.fechaVencimiento BETWEEN :fechaInicio AND :fechaFin")
    List<LetterOfCredit> findByFechaVencimientoBetween(@Param("fechaInicio") LocalDate fechaInicio,
                                                       @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT lc FROM LetterOfCredit lc WHERE lc.estado = :estado AND lc.fechaVencimiento <= :fecha")
    List<LetterOfCredit> findProximasAVencer(@Param("estado") EstadoLC estado,
                                            @Param("fecha") LocalDate fecha);

    @Query("SELECT SUM(lc.monto - lc.montoUtilizado) FROM LetterOfCredit lc WHERE lc.ordenanteId = :clienteId AND lc.estado IN :estados")
    java.math.BigDecimal calcularExposicionCliente(@Param("clienteId") Long clienteId,
                                                     @Param("estados") List<EstadoLC> estados);

    boolean existsByNumeroOperacion(String numeroOperacion);
}
