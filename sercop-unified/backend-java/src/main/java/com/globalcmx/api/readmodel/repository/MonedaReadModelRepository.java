package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.MonedaReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonedaReadModelRepository extends JpaRepository<MonedaReadModel, Long> {

    Optional<MonedaReadModel> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);
}
