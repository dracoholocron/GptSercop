package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.LcAmendment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LcAmendmentRepository extends JpaRepository<LcAmendment, Long> {

    @Query("SELECT e FROM LcAmendment e WHERE e.cartaCredito.id = :lcId ORDER BY e.numeroEnmienda DESC")
    List<LcAmendment> findByLcIdOrderByNumeroEnmiendaDesc(@Param("lcId") Long lcId);

    @Query("SELECT e FROM LcAmendment e WHERE e.cartaCredito.id = :lcId AND e.estado = :estado")
    List<LcAmendment> findByLcIdAndEstado(@Param("lcId") Long lcId, @Param("estado") String estado);

    @Query("SELECT e FROM LcAmendment e WHERE e.cartaCredito.id = :lcId AND e.numeroEnmienda = :numero")
    LcAmendment findByLcIdAndNumeroEnmienda(@Param("lcId") Long lcId, @Param("numero") Integer numero);

    @Query("SELECT MAX(e.numeroEnmienda) FROM LcAmendment e WHERE e.cartaCredito.id = :lcId")
    Integer findMaxNumeroEnmiendaByLcId(@Param("lcId") Long lcId);
}
