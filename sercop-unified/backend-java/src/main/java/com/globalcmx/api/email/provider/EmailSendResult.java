package com.globalcmx.api.email.provider;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailSendResult {
    private boolean success;
    private String messageId;
    private String providerResponse;
    private String errorMessage;
    private String errorCode;

    public static EmailSendResult success(String messageId, String providerResponse) {
        return EmailSendResult.builder().success(true).messageId(messageId).providerResponse(providerResponse).build();
    }

    public static EmailSendResult failure(String errorMessage, String errorCode) {
        return EmailSendResult.builder().success(false).errorMessage(errorMessage).errorCode(errorCode).build();
    }
}
