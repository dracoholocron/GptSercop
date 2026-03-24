package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la entidad Role.
 * Conectado al datasource ReadModel (MySQL).
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Buscar rol por nombre.
     */
    Optional<Role> findByName(String name);

    /**
     * Verificar si existe un rol con el nombre dado.
     */
    Boolean existsByName(String name);
}
