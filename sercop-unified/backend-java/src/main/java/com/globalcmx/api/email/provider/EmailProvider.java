package com.globalcmx.api.email.provider;

import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.entity.EmailQueue;

public interface EmailProvider {
    String getProviderType();
    EmailSendResult send(EmailQueue email, EmailProviderConfig config);
    boolean testConnection(EmailProviderConfig config);
}
