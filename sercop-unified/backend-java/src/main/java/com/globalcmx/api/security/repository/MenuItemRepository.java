package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    Optional<MenuItem> findByCode(String code);
    
    List<MenuItem> findByParentIsNullAndIsActiveTrueOrderByDisplayOrder();
    
    List<MenuItem> findByParentIdAndIsActiveTrueOrderByDisplayOrder(Long parentId);
    
    @Query("SELECT DISTINCT m FROM MenuItem m " +
           "LEFT JOIN FETCH m.requiredPermissions " +
           "LEFT JOIN FETCH m.children c " +
           "LEFT JOIN FETCH c.requiredPermissions " +
           "WHERE m.parent IS NULL AND m.isActive = true " +
           "ORDER BY m.displayOrder")
    List<MenuItem> findAllRootMenusWithPermissions();
    
    @Query("SELECT DISTINCT m FROM MenuItem m " +
           "LEFT JOIN FETCH m.requiredPermissions p " +
           "LEFT JOIN FETCH m.children c " +
           "WHERE m.isActive = true " +
           "AND (m.requiredPermissions IS EMPTY OR p.code IN :permissionCodes) " +
           "ORDER BY m.displayOrder")
    List<MenuItem> findMenusByPermissions(@Param("permissionCodes") List<String> permissionCodes);
    
    List<MenuItem> findAllByIsActiveTrueOrderByDisplayOrder();
    
    boolean existsByCode(String code);
}
