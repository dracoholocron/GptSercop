package com.globalcmx.api.realtime.noop;

import com.globalcmx.api.alerts.dto.AlertResponse;
import com.globalcmx.api.realtime.RealTimeNotificationService;
import com.globalcmx.api.realtime.dto.RealTimeMessage;
import com.globalcmx.api.realtime.dto.RealTimeSystemMessage;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;

/**
 * No-operation implementation of RealTimeNotificationService.
 *
 * This implementation is used when real-time notifications are disabled.
 * All methods are no-ops that log at debug level.
 *
 * Alerts will still be persisted in the database; users will see them
 * when they refresh the page or poll for updates.
 */
@Slf4j
public class NoOpRealTimeNotificationService implements RealTimeNotificationService {

    public NoOpRealTimeNotificationService() {
        log.info("RealTime: NoOp provider initialized. Real-time notifications are disabled.");
    }

    @Override
    public void sendAlertToUser(String userId, AlertResponse alert) {
        log.debug("RealTime (NoOp): Alert '{}' for user {} will be fetched on next poll",
            alert.getTitle(), userId);
    }

    @Override
    public void sendVideoCallInvitation(String userId, AlertResponse alert) {
        log.debug("RealTime (NoOp): Video call invitation for user {} will be fetched on next poll", userId);
    }

    @Override
    public void sendInstantMessage(String userId, RealTimeMessage message) {
        log.debug("RealTime (NoOp): Message from {} to {} will be fetched on next poll",
            message.getSenderName(), userId);
    }

    @Override
    public void broadcastSystemMessage(RealTimeSystemMessage message) {
        log.debug("RealTime (NoOp): System message '{}' will not be broadcast", message.getMessage());
    }

    @Override
    public boolean isUserConnected(String userId) {
        return false;
    }

    @Override
    public int getConnectedUserCount() {
        return 0;
    }

    @Override
    public List<String> getConnectedUserIds() {
        return Collections.emptyList();
    }

    @Override
    public boolean isEnabled() {
        return false;
    }

    @Override
    public String getProviderName() {
        return "NoOp";
    }
}
