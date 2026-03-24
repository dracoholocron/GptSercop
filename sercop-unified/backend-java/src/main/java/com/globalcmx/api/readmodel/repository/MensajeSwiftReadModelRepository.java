package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.MensajeSwiftReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensajeSwiftReadModelRepository extends JpaRepository<MensajeSwiftReadModel, Long> {
    List<MensajeSwiftReadModel> findByOperacionTipoAndOperacionId(String operacionTipo, Long operacionId);
    List<MensajeSwiftReadModel> findByTipoMensaje(String tipoMensaje);
    List<MensajeSwiftReadModel> findByEstado(String estado);
    List<MensajeSwiftReadModel> findByDireccion(String direccion);
    List<MensajeSwiftReadModel> findByMensajeRelacionadoId(Long mensajeRelacionadoId);
}
