package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.UserRiskProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para perfiles de riesgo de usuarios.
 */
@Repository
public interface UserRiskProfileRepository extends JpaRepository<UserRiskProfile, Long> {

    /**
     * Buscar perfil por ID de usuario.
     */
    Optional<UserRiskProfile> findByUserId(Long userId);

    /**
     * Verificar si existe un perfil para el usuario.
     */
    boolean existsByUserId(Long userId);
}
