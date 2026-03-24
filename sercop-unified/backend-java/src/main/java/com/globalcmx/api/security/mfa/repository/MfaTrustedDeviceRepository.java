package com.globalcmx.api.security.mfa.repository;

import com.globalcmx.api.security.mfa.entity.MfaTrustedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MfaTrustedDeviceRepository extends JpaRepository<MfaTrustedDevice, Long> {

    List<MfaTrustedDevice> findByUserId(Long userId);

    Optional<MfaTrustedDevice> findByUserIdAndDeviceFingerprint(Long userId, String deviceFingerprint);

    @Query("SELECT d FROM MfaTrustedDevice d WHERE d.userId = :userId AND d.trustedUntil > :now")
    List<MfaTrustedDevice> findValidTrustedDevices(@Param("userId") Long userId, @Param("now") Instant now);

    @Query("SELECT CASE WHEN COUNT(d) > 0 THEN true ELSE false END FROM MfaTrustedDevice d WHERE d.userId = :userId AND d.deviceFingerprint = :fingerprint AND d.trustedUntil > :now")
    boolean isDeviceTrusted(@Param("userId") Long userId, @Param("fingerprint") String fingerprint, @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM MfaTrustedDevice d WHERE d.trustedUntil < :now")
    int deleteExpiredDevices(@Param("now") Instant now);

    void deleteByUserIdAndDeviceFingerprint(Long userId, String deviceFingerprint);

    void deleteAllByUserId(Long userId);
}
