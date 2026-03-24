package com.globalcmx.api.videoconference.repository;

import com.globalcmx.api.videoconference.entity.MeetingReadModel;
import com.globalcmx.api.videoconference.entity.MeetingReadModel.MeetingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for MeetingReadModel entities.
 */
@Repository
public interface MeetingRepository extends JpaRepository<MeetingReadModel, Long> {

    /**
     * Find meeting by provider's meeting ID
     */
    Optional<MeetingReadModel> findByMeetingId(String meetingId);

    /**
     * Find all meetings for an operation
     */
    List<MeetingReadModel> findByOperationIdOrderByScheduledStartDesc(String operationId);

    /**
     * Find all meetings for a client
     */
    List<MeetingReadModel> findByClientIdOrderByScheduledStartDesc(String clientId);

    /**
     * Find upcoming meetings for a user
     */
    @Query("SELECT m FROM MeetingReadModel m " +
           "WHERE m.createdBy = :userId " +
           "AND m.scheduledStart > :now " +
           "AND m.status IN ('SCHEDULED', 'PENDING') " +
           "ORDER BY m.scheduledStart ASC")
    List<MeetingReadModel> findUpcomingByUser(
            @Param("userId") String userId,
            @Param("now") LocalDateTime now);

    /**
     * Find upcoming meetings for a user (paginated)
     */
    @Query("SELECT m FROM MeetingReadModel m " +
           "WHERE m.createdBy = :userId " +
           "AND m.scheduledStart > :now " +
           "AND m.status IN ('SCHEDULED', 'PENDING') " +
           "ORDER BY m.scheduledStart ASC")
    Page<MeetingReadModel> findUpcomingByUserPaged(
            @Param("userId") String userId,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    /**
     * Find meetings in a date range
     */
    @Query("SELECT m FROM MeetingReadModel m " +
           "WHERE m.createdBy = :userId " +
           "AND m.scheduledStart BETWEEN :startDate AND :endDate " +
           "ORDER BY m.scheduledStart ASC")
    List<MeetingReadModel> findByUserAndDateRange(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find meetings by status
     */
    List<MeetingReadModel> findByStatusOrderByScheduledStartDesc(MeetingStatus status);

    /**
     * Find meetings by provider
     */
    List<MeetingReadModel> findByProviderOrderByScheduledStartDesc(String provider);

    /**
     * Count meetings by status for a user
     */
    @Query("SELECT m.status, COUNT(m) FROM MeetingReadModel m " +
           "WHERE m.createdBy = :userId " +
           "GROUP BY m.status")
    List<Object[]> countByStatusForUser(@Param("userId") String userId);

    /**
     * Find meetings that should be marked as completed (past end time)
     */
    @Query("SELECT m FROM MeetingReadModel m " +
           "WHERE m.scheduledEnd < :now " +
           "AND m.status = 'SCHEDULED'")
    List<MeetingReadModel> findMeetingsToComplete(@Param("now") LocalDateTime now);

    /**
     * Search meetings
     */
    @Query("SELECT m FROM MeetingReadModel m " +
           "WHERE m.createdBy = :userId " +
           "AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(m.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(m.clientName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY m.scheduledStart DESC")
    Page<MeetingReadModel> searchByUser(
            @Param("userId") String userId,
            @Param("query") String query,
            Pageable pageable);
}
