package com.globalcmx.api.security.dto;

import com.globalcmx.api.security.schedule.dto.ScheduleStatusDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para respuesta de autenticación exitosa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    private ScheduleStatusDTO scheduleStatus;

    // Client Portal fields
    private String userType;
    private String participantId; // cliente_id for CLIENT users
    private String participantName;

    public AuthResponse(String token, Long id, String username, String email, List<String> roles) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    public AuthResponse(String token, Long id, String username, String email, List<String> roles,
                        String userType, String participantId, String participantName) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.userType = userType;
        this.participantId = participantId;
        this.participantName = participantName;
    }
}
