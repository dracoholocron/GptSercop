package com.globalcmx.api.repository;

import com.globalcmx.api.entity.Moneda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MonedaRepository extends JpaRepository<Moneda, Long> {

    Optional<Moneda> findByCodigo(String codigo);

    List<Moneda> findByActivoTrue();

    List<Moneda> findByNombreContainingIgnoreCase(String nombre);

    boolean existsByCodigo(String codigo);
}
