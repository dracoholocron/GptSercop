package com.globalcmx.api.compraspublicas.config.repository;

import com.globalcmx.api.compraspublicas.config.entity.CPProcessSectionConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPProcessSectionConfigRepository extends JpaRepository<CPProcessSectionConfig, String> {

    List<CPProcessSectionConfig> findByStepIdAndIsActiveTrueOrderByDisplayOrderAsc(String stepId);

    List<CPProcessSectionConfig> findBySectionTypeAndIsActiveTrueOrderByDisplayOrderAsc(String sectionType);
}
