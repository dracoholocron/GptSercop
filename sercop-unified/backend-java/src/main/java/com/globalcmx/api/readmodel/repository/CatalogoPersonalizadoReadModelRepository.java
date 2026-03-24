package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.CatalogoPersonalizadoReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogoPersonalizadoReadModelRepository extends JpaRepository<CatalogoPersonalizadoReadModel, Long> {
    Optional<CatalogoPersonalizadoReadModel> findByCodigo(String codigo);
    Optional<CatalogoPersonalizadoReadModel> findByCodigoAndCatalogoPadreId(String codigo, Long catalogoPadreId);
    Optional<CatalogoPersonalizadoReadModel> findByCodigoAndNivel(String codigo, Integer nivel);
    List<CatalogoPersonalizadoReadModel> findByNivel(Integer nivel);
    List<CatalogoPersonalizadoReadModel> findByCatalogoPadreId(Long catalogoPadreId);
    List<CatalogoPersonalizadoReadModel> findByActivo(Boolean activo);
    List<CatalogoPersonalizadoReadModel> findByNivelAndActivoOrderByOrdenAsc(Integer nivel, Boolean activo);
    List<CatalogoPersonalizadoReadModel> findByCatalogoPadreIdAndActivoOrderByOrdenAsc(Long catalogoPadreId, Boolean activo);
}
