package com.globalcmx.api.videoconference.repository;

import com.globalcmx.api.videoconference.entity.MeetingHistoryReadModel;
import com.globalcmx.api.videoconference.entity.MeetingHistoryReadModel.ActionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for MeetingHistoryReadModel entities.
 */
@Repository
public interface MeetingHistoryRepository extends JpaRepository<MeetingHistoryReadModel, Long> {

    /**
     * Find all history entries for a meeting
     */
    List<MeetingHistoryReadModel> findByMeetingIdOrderByCreatedAtDesc(String meetingId);

    /**
     * Find history entries by action type
     */
    List<MeetingHistoryReadModel> findByMeetingIdAndActionTypeOrderByCreatedAtDesc(
            String meetingId, ActionType actionType);

    /**
     * Find recent history entries for a user
     */
    Page<MeetingHistoryReadModel> findByCreatedByOrderByCreatedAtDesc(
            String createdBy, Pageable pageable);

    /**
     * Find history entries in a date range
     */
    List<MeetingHistoryReadModel> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Count history entries by action type for a meeting
     */
    long countByMeetingIdAndActionType(String meetingId, ActionType actionType);
}
