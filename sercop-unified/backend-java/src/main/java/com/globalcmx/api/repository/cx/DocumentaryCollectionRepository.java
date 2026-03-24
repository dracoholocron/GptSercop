package com.globalcmx.api.repository.cx;

import com.globalcmx.api.model.cx.DocumentaryCollection;
import com.globalcmx.api.model.cx.enums.EstadoCobranza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentaryCollectionRepository extends JpaRepository<DocumentaryCollection, Long> {

    Optional<DocumentaryCollection> findByNumeroOperacion(String numeroOperacion);

    List<DocumentaryCollection> findByEstado(EstadoCobranza estado);

    List<DocumentaryCollection> findByLibradorId(Long libradorId);

    List<DocumentaryCollection> findByLibradoId(Long libradoId);

    boolean existsByNumeroOperacion(String numeroOperacion);
}
