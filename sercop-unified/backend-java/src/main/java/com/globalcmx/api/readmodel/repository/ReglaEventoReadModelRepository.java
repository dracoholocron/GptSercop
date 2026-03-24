package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.ReglaEventoReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReglaEventoReadModelRepository extends JpaRepository<ReglaEventoReadModel, Long> {
    Optional<ReglaEventoReadModel> findByCodigo(String codigo);

    List<ReglaEventoReadModel> findByActivoOrderByPrioridadAsc(Boolean activo);

    List<ReglaEventoReadModel> findByTipoOperacionAndActivoOrderByPrioridadAsc(String tipoOperacion, Boolean activo);

    List<ReglaEventoReadModel> findByEventoTriggerAndActivoOrderByPrioridadAsc(String eventoTrigger, Boolean activo);

    List<ReglaEventoReadModel> findByTipoOperacionAndEventoTriggerAndActivoOrderByPrioridadAsc(
            String tipoOperacion, String eventoTrigger, Boolean activo);
}
