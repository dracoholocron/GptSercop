package com.globalcmx.api.videoconference.repository;

import com.globalcmx.api.videoconference.entity.MeetingNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for MeetingNote entities.
 */
@Repository
public interface MeetingNoteRepository extends JpaRepository<MeetingNote, Long> {

    /**
     * Find all notes for a specific meeting
     */
    @Query("SELECT n FROM MeetingNote n WHERE n.meeting.id = :meetingId ORDER BY n.createdAt DESC")
    List<MeetingNote> findByMeetingId(@Param("meetingId") Long meetingId);

    /**
     * Find notes with follow-up dates
     */
    @Query("SELECT n FROM MeetingNote n WHERE n.followUpDate IS NOT NULL AND n.followUpDate >= CURRENT_TIMESTAMP ORDER BY n.followUpDate")
    List<MeetingNote> findPendingFollowUps();
}
