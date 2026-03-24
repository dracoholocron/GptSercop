package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.PlantillaReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantillaReadModelRepository extends JpaRepository<PlantillaReadModel, Long> {
    Optional<PlantillaReadModel> findByCodigo(String codigo);
    List<PlantillaReadModel> findByActivo(Boolean activo);
    List<PlantillaReadModel> findByTipoDocumento(String tipoDocumento);
    List<PlantillaReadModel> findByActivoOrderByNombreAsc(Boolean activo);
}
