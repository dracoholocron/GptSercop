package com.globalcmx.api.readmodel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para el Read Model de Moneda
 * Solo operaciones de lectura y actualización vía proyecciones
 */
@Repository
public interface MonedaReadModelRepository extends JpaRepository<MonedaReadModel, Long> {

    Optional<MonedaReadModel> findByCodigo(String codigo);

    List<MonedaReadModel> findByActivoTrue();

    List<MonedaReadModel> findByNombreContainingIgnoreCase(String nombre);

    boolean existsByCodigo(String codigo);
}
