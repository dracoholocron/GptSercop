package com.globalcmx.api.security.mfa.repository;

import com.globalcmx.api.security.mfa.entity.MfaMethod;
import com.globalcmx.api.security.mfa.entity.UserMfaEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMfaEnrollmentRepository extends JpaRepository<UserMfaEnrollment, Long> {

    List<UserMfaEnrollment> findByUserId(Long userId);

    List<UserMfaEnrollment> findByUserIdAndVerifiedTrue(Long userId);

    Optional<UserMfaEnrollment> findByUserIdAndMethod(Long userId, MfaMethod method);

    Optional<UserMfaEnrollment> findByUserIdAndIsPrimaryTrue(Long userId);

    @Query("SELECT e FROM UserMfaEnrollment e WHERE e.userId = :userId AND e.verified = true ORDER BY e.isPrimary DESC, e.lastUsedAt DESC")
    List<UserMfaEnrollment> findVerifiedEnrollmentsByUserIdOrderByPriority(@Param("userId") Long userId);

    @Query("SELECT COUNT(e) FROM UserMfaEnrollment e WHERE e.userId = :userId AND e.verified = true")
    int countVerifiedByUserId(@Param("userId") Long userId);

    @Query("SELECT e FROM UserMfaEnrollment e WHERE e.syncedToIdp = false AND e.verified = true")
    List<UserMfaEnrollment> findPendingSyncEnrollments();

    boolean existsByUserIdAndMethodAndVerifiedTrue(Long userId, MfaMethod method);

    void deleteByUserIdAndMethod(Long userId, MfaMethod method);
}
