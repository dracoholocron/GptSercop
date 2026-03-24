package com.globalcmx.api.email.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.entity.EmailQueue;
import jakarta.mail.*;
import jakarta.mail.internet.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SmtpEmailProvider implements EmailProvider {

    private final ObjectMapper objectMapper;

    @Override
    public String getProviderType() { return "SMTP"; }

    @Override
    public EmailSendResult send(EmailQueue email, EmailProviderConfig config) {
        try {
            Properties props = buildProperties(config);
            Session session = createSession(props, config);
            MimeMessage message = new MimeMessage(session);

            String fromEmail = email.getFromEmail() != null ? email.getFromEmail() : config.getFromEmail();
            String fromName = email.getFromName() != null ? email.getFromName() : config.getFromName();
            message.setFrom(new InternetAddress(fromEmail, fromName));

            if (email.getToAddresses() != null) {
                List<String> toList = objectMapper.readValue(email.getToAddresses(), List.class);
                for (String to : toList) message.addRecipient(Message.RecipientType.TO, new InternetAddress(to));
            }
            if (email.getCcAddresses() != null) {
                List<String> ccList = objectMapper.readValue(email.getCcAddresses(), List.class);
                for (String cc : ccList) message.addRecipient(Message.RecipientType.CC, new InternetAddress(cc));
            }
            if (email.getBccAddresses() != null) {
                List<String> bccList = objectMapper.readValue(email.getBccAddresses(), List.class);
                for (String bcc : bccList) message.addRecipient(Message.RecipientType.BCC, new InternetAddress(bcc));
            }

            message.setSubject(email.getSubject());

            if (email.getBodyHtml() != null) {
                MimeMultipart multipart = new MimeMultipart("alternative");
                if (email.getBodyText() != null) {
                    MimeBodyPart textPart = new MimeBodyPart();
                    textPart.setText(email.getBodyText(), "utf-8");
                    multipart.addBodyPart(textPart);
                }
                MimeBodyPart htmlPart = new MimeBodyPart();
                htmlPart.setContent(email.getBodyHtml(), "text/html; charset=utf-8");
                multipart.addBodyPart(htmlPart);
                message.setContent(multipart);
            } else {
                message.setText(email.getBodyText() != null ? email.getBodyText() : "");
            }

            Transport.send(message);
            String messageId = UUID.randomUUID().toString();
            log.info("Email sent via SMTP. MessageId: {}", messageId);
            return EmailSendResult.success(messageId, "Email sent via SMTP");
        } catch (Exception e) {
            log.error("Failed to send email via SMTP", e);
            return EmailSendResult.failure(e.getMessage(), "SMTP_ERROR");
        }
    }

    @Override
    public boolean testConnection(EmailProviderConfig config) {
        try {
            Properties props = buildProperties(config);
            Session session = createSession(props, config);
            Transport transport = session.getTransport("smtp");
            transport.connect();
            transport.close();
            return true;
        } catch (Exception e) {
            log.error("SMTP connection test failed", e);
            return false;
        }
    }

    private Properties buildProperties(EmailProviderConfig config) {
        Properties props = new Properties();
        props.put("mail.smtp.host", config.getSmtpHost());
        props.put("mail.smtp.port", config.getSmtpPort());
        props.put("mail.smtp.auth", "true");
        if (Boolean.TRUE.equals(config.getSmtpUseTls())) props.put("mail.smtp.starttls.enable", "true");
        if (Boolean.TRUE.equals(config.getSmtpUseSsl())) props.put("mail.smtp.ssl.enable", "true");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        return props;
    }

    private Session createSession(Properties props, EmailProviderConfig config) {
        return Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(config.getSmtpUsername(), config.getSmtpPassword());
            }
        });
    }
}
