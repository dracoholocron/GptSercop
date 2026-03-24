package com.globalcmx.api.alerts.repository;

import com.globalcmx.api.alerts.entity.AlertTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for alert tags.
 */
@Repository
public interface AlertTagRepository extends JpaRepository<AlertTag, Long> {

    /**
     * Find all active tags ordered by display order
     */
    List<AlertTag> findByActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find all tags ordered by display order
     */
    List<AlertTag> findAllByOrderByDisplayOrderAsc();

    /**
     * Find tag by name
     */
    Optional<AlertTag> findByName(String name);

    /**
     * Check if tag name exists
     */
    boolean existsByName(String name);

    /**
     * Find tags by names
     */
    List<AlertTag> findByNameIn(List<String> names);
}
