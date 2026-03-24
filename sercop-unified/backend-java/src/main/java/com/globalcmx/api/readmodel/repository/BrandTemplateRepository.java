package com.globalcmx.api.readmodel.repository;

import com.globalcmx.api.readmodel.entity.BrandTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BrandTemplateRepository extends JpaRepository<BrandTemplate, Long> {

    Optional<BrandTemplate> findByCode(String code);
    
    boolean existsByCode(String code);
    
    Optional<BrandTemplate> findByActiveTrue();
    
    Optional<BrandTemplate> findByIsDefaultTrue();
    
    List<BrandTemplate> findAllByOrderByDisplayOrderAsc();
    
    @Modifying(clearAutomatically = true)
    @Query("UPDATE BrandTemplate b SET b.active = false WHERE b.active = true")
    void deactivateAll();
    
    @Query("SELECT COUNT(b) FROM BrandTemplate b WHERE b.active = true")
    long countActive();
}
