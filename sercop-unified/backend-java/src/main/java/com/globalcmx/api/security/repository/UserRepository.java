package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.User;
import com.globalcmx.api.security.entity.UserApprovalStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la entidad User.
 * Conectado al datasource ReadModel (MySQL).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Buscar usuario por username.
     */
    Optional<User> findByUsername(String username);

    /**
     * Buscar usuario por email.
     */
    Optional<User> findByEmail(String email);

    /**
     * Verificar si existe un usuario con el username dado.
     */
    Boolean existsByUsername(String username);

    /**
     * Verificar si existe un usuario con el email dado.
     */
    Boolean existsByEmail(String email);

    /**
     * Find users by approval status.
     */
    List<User> findByApprovalStatus(UserApprovalStatus approvalStatus);

    /**
     * Find users by role name (e.g., ROLE_ADMIN, ROLE_OPERATOR).
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true"
    )
    List<User> findByRoleName(@org.springframework.data.repository.query.Param("roleName") String roleName);

    /**
     * Find all enabled users.
     */
    List<User> findByEnabledTrue();
}
