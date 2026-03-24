package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.FinancialInstitutionReadModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialInstitutionReadModelRepository extends JpaRepository<FinancialInstitutionReadModel, Long> {
    Optional<FinancialInstitutionReadModel> findByCodigo(String codigo);
    Optional<FinancialInstitutionReadModel> findBySwiftCode(String swiftCode);
    List<FinancialInstitutionReadModel> findByActivo(Boolean activo);
    List<FinancialInstitutionReadModel> findByTipo(String tipo);
    List<FinancialInstitutionReadModel> findByPais(String pais);
    List<FinancialInstitutionReadModel> findByEsCorresponsal(Boolean esCorresponsal);

    /**
     * Búsqueda paginada con filtros opcionales
     */
    @Query("SELECT f FROM FinancialInstitutionReadModel f WHERE " +
           "(:codigo IS NULL OR LOWER(f.codigo) LIKE LOWER(CONCAT('%', :codigo, '%'))) AND " +
           "(:nombre IS NULL OR LOWER(f.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))) AND " +
           "(:swiftCode IS NULL OR LOWER(f.swiftCode) LIKE LOWER(CONCAT('%', :swiftCode, '%'))) AND " +
           "(:pais IS NULL OR LOWER(f.pais) LIKE LOWER(CONCAT('%', :pais, '%'))) AND " +
           "(:ciudad IS NULL OR LOWER(f.ciudad) LIKE LOWER(CONCAT('%', :ciudad, '%'))) AND " +
           "(:tipo IS NULL OR f.tipo = :tipo) AND " +
           "(:esCorresponsal IS NULL OR f.esCorresponsal = :esCorresponsal) AND " +
           "(:activo IS NULL OR f.activo = :activo)")
    Page<FinancialInstitutionReadModel> searchWithFilters(
            @Param("codigo") String codigo,
            @Param("nombre") String nombre,
            @Param("swiftCode") String swiftCode,
            @Param("pais") String pais,
            @Param("ciudad") String ciudad,
            @Param("tipo") String tipo,
            @Param("esCorresponsal") Boolean esCorresponsal,
            @Param("activo") Boolean activo,
            Pageable pageable);
}
