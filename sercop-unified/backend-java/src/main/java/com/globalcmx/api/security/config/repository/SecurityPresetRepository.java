package com.globalcmx.api.security.config.repository;

import com.globalcmx.api.security.config.entity.SecurityPresetReadModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityPresetRepository extends JpaRepository<SecurityPresetReadModel, Long> {

    Optional<SecurityPresetReadModel> findByCode(String code);

    List<SecurityPresetReadModel> findByIsSystemTrueOrderByDisplayOrderAsc();

    List<SecurityPresetReadModel> findByIsSystemFalseOrderByDisplayOrderAsc();

    List<SecurityPresetReadModel> findAllByOrderByDisplayOrderAsc();

    boolean existsByCode(String code);
}
