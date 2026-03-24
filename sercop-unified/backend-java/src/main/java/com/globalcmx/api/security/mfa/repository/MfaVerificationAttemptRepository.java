package com.globalcmx.api.security.mfa.repository;

import com.globalcmx.api.security.mfa.entity.MfaVerificationAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MfaVerificationAttemptRepository extends JpaRepository<MfaVerificationAttempt, Long> {

    List<MfaVerificationAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);

    @Query("SELECT a FROM MfaVerificationAttempt a WHERE a.userId = :userId AND a.attemptedAt > :since ORDER BY a.attemptedAt DESC")
    List<MfaVerificationAttempt> findRecentAttempts(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT COUNT(a) FROM MfaVerificationAttempt a WHERE a.userId = :userId AND a.success = false AND a.attemptedAt > :since")
    int countFailedAttemptsSince(@Param("userId") Long userId, @Param("since") Instant since);

    @Query("SELECT a FROM MfaVerificationAttempt a WHERE a.userId = :userId AND a.success = true ORDER BY a.attemptedAt DESC")
    List<MfaVerificationAttempt> findSuccessfulAttempts(@Param("userId") Long userId);
}
