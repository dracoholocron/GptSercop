package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.FinanciamientoCx;
import com.globalcmx.api.model.cx.enums.EstadoFinanciamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinanciamientoCxRepository extends JpaRepository<FinanciamientoCx, Long> {

    Optional<FinanciamientoCx> findByNumeroOperacion(String numeroOperacion);

    List<FinanciamientoCx> findByClienteId(Long clienteId);

    List<FinanciamientoCx> findByEstado(EstadoFinanciamiento estado);

    List<FinanciamientoCx> findByLineaCreditoId(Long lineaCreditoId);

    @Query("SELECT f FROM FinanciamientoCx f WHERE f.operacionVinculadaTipo = :tipo AND f.operacionVinculadaId = :id")
    List<FinanciamientoCx> findByOperacionVinculada(@Param("tipo") String tipo, @Param("id") Long id);

    @Query("SELECT f FROM FinanciamientoCx f WHERE f.fechaVencimiento BETWEEN :fechaInicio AND :fechaFin")
    List<FinanciamientoCx> findByFechaVencimientoBetween(@Param("fechaInicio") LocalDate fechaInicio,
                                                           @Param("fechaFin") LocalDate fechaFin);

    @Query("SELECT f FROM FinanciamientoCx f WHERE f.estado = :estado AND f.fechaVencimiento <= :fecha")
    List<FinanciamientoCx> findProximosAVencer(@Param("estado") EstadoFinanciamiento estado,
                                                 @Param("fecha") LocalDate fecha);

    @Query("SELECT SUM(f.montoDesembolsado) FROM FinanciamientoCx f WHERE f.clienteId = :clienteId AND f.estado = :estado")
    java.math.BigDecimal calcularTotalDesembolsadoCliente(@Param("clienteId") Long clienteId,
                                                           @Param("estado") EstadoFinanciamiento estado);

    boolean existsByNumeroOperacion(String numeroOperacion);
}
