package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Repository for Permission entity.
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, String> {

    Optional<Permission> findByCode(String code);

    List<Permission> findByModule(String module);

    List<Permission> findAllByCodeIn(Set<String> codes);

    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r WHERE r.name = :roleName")
    Set<Permission> findByRoleName(@Param("roleName") String roleName);

    @Query("SELECT DISTINCT p FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.username = :username")
    Set<Permission> findByUsername(@Param("username") String username);

    @Query("SELECT DISTINCT p.code FROM Permission p JOIN p.roles r JOIN r.users u WHERE u.username = :username")
    Set<String> findPermissionCodesByUsername(@Param("username") String username);

    @Query("SELECT DISTINCT p.module FROM Permission p ORDER BY p.module")
    List<String> findAllModules();

    boolean existsByCode(String code);


    List<Permission> findByCodeIn(List<String> codes);
}
