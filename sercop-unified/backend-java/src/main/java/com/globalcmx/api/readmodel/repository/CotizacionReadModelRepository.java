package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.CotizacionReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CotizacionReadModelRepository extends JpaRepository<CotizacionReadModel, Long> {
    List<CotizacionReadModel> findByCodigoMoneda(String codigoMoneda);
    List<CotizacionReadModel> findByFecha(LocalDate fecha);
    Optional<CotizacionReadModel> findByCodigoMonedaAndFecha(String codigoMoneda, LocalDate fecha);
    List<CotizacionReadModel> findByFechaBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT c FROM CotizacionReadModel c WHERE c.fecha = (SELECT MAX(c2.fecha) FROM CotizacionReadModel c2)")
    List<CotizacionReadModel> findLatest();
}
