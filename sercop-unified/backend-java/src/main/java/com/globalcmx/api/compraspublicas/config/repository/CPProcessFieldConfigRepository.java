package com.globalcmx.api.compraspublicas.config.repository;

import com.globalcmx.api.compraspublicas.config.entity.CPProcessFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CPProcessFieldConfigRepository extends JpaRepository<CPProcessFieldConfig, String> {

    List<CPProcessFieldConfig> findBySectionIdAndIsActiveTrueOrderByDisplayOrderAsc(String sectionId);

    List<CPProcessFieldConfig> findBySectionIdAndShowInWizardTrueAndIsActiveTrueOrderByDisplayOrderAsc(String sectionId);

    List<CPProcessFieldConfig> findBySectionIdAndShowInExpertTrueAndIsActiveTrueOrderByDisplayOrderAsc(String sectionId);

    List<CPProcessFieldConfig> findBySectionIdAndShowInListTrueAndIsActiveTrueOrderByDisplayOrderAsc(String sectionId);

    List<CPProcessFieldConfig> findByAiAssistEnabledTrueAndIsActiveTrueOrderByDisplayOrderAsc();

    List<CPProcessFieldConfig> findByComponentTypeAndIsActiveTrueOrderByDisplayOrderAsc(String componentType);
}
