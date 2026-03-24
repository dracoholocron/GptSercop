package com.globalcmx.api.security.repository;

import com.globalcmx.api.security.entity.ApiEndpoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiEndpointRepository extends JpaRepository<ApiEndpoint, Long> {
    
    Optional<ApiEndpoint> findByCode(String code);
    
    List<ApiEndpoint> findByModuleAndIsActiveTrue(String module);
    
    List<ApiEndpoint> findByIsActiveTrueOrderByModule();
    
    @Query("SELECT DISTINCT e FROM ApiEndpoint e " +
           "LEFT JOIN FETCH e.requiredPermissions " +
           "WHERE e.isActive = true")
    List<ApiEndpoint> findAllWithPermissions();
    
    @Query("SELECT e FROM ApiEndpoint e " +
           "LEFT JOIN e.requiredPermissions p " +
           "WHERE e.httpMethod = :method " +
           "AND e.isActive = true " +
           "AND (e.urlPattern = :url OR :url LIKE REPLACE(e.urlPattern, '**', '%'))")
    List<ApiEndpoint> findByMethodAndUrlPattern(@Param("method") String method, @Param("url") String url);
    
    @Query("SELECT DISTINCT e.module FROM ApiEndpoint e WHERE e.module IS NOT NULL ORDER BY e.module")
    List<String> findAllModules();
    
    boolean existsByCode(String code);
}
