package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.LineaCreditoReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LineaCreditoReadModelRepository extends JpaRepository<LineaCreditoReadModel, Long> {
    List<LineaCreditoReadModel> findByClienteId(Long clienteId);
    List<LineaCreditoReadModel> findByEstado(String estado);
    List<LineaCreditoReadModel> findByClienteIdAndEstado(Long clienteId, String estado);
    List<LineaCreditoReadModel> findByTipo(String tipo);
    List<LineaCreditoReadModel> findByMoneda(String moneda);
}
