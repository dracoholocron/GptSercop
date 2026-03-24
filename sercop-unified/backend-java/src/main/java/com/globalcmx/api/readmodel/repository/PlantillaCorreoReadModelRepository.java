package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.PlantillaCorreoReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantillaCorreoReadModelRepository extends JpaRepository<PlantillaCorreoReadModel, Long> {
    Optional<PlantillaCorreoReadModel> findByCodigo(String codigo);
    List<PlantillaCorreoReadModel> findByActivo(Boolean activo);
    List<PlantillaCorreoReadModel> findByActivoOrderByNombreAsc(Boolean activo);
}
