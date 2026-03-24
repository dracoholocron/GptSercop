package com.globalcmx.api.security.schedule.repository;

import com.globalcmx.api.security.schedule.entity.SystemScheduleGlobal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemScheduleGlobalRepository extends JpaRepository<SystemScheduleGlobal, Long> {

    /**
     * Encuentra el horario global predeterminado activo.
     */
    @Query("SELECT s FROM SystemScheduleGlobal s WHERE s.isDefault = true AND s.isActive = true")
    Optional<SystemScheduleGlobal> findDefaultSchedule();

    /**
     * Encuentra todos los horarios globales activos.
     */
    List<SystemScheduleGlobal> findByIsActiveTrue();

    /**
     * Verifica si existe un horario predeterminado.
     */
    boolean existsByIsDefaultTrue();
}
