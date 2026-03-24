package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.CuentaBancariaReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuentaBancariaReadModelRepository extends JpaRepository<CuentaBancariaReadModel, Long> {
    Optional<CuentaBancariaReadModel> findByIdentificacionCuenta(String identificacionCuenta);
    Optional<CuentaBancariaReadModel> findByNumeroCuenta(String numeroCuenta);
    List<CuentaBancariaReadModel> findByIdentificacionParticipante(String identificacionParticipante);
    List<CuentaBancariaReadModel> findByTipo(String tipo);
    List<CuentaBancariaReadModel> findByActivo(Boolean activo);
}
