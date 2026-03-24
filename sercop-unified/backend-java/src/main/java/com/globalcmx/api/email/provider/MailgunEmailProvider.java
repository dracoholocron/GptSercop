package com.globalcmx.api.email.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.email.entity.EmailProviderConfig;
import com.globalcmx.api.email.entity.EmailQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Proveedor de email usando Mailgun API.
 * Requiere configurar:
 * - apiKey: la API Key de Mailgun
 * - apiEndpoint: el dominio de Mailgun (ej: sandbox123.mailgun.org)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MailgunEmailProvider implements EmailProvider {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    private static final String MAILGUN_API_BASE = "https://api.mailgun.net/v3";

    @Override
    public String getProviderType() {
        return "MAILGUN";
    }

    @Override
    public EmailSendResult send(EmailQueue email, EmailProviderConfig config) {
        try {
            String domain = config.getApiEndpoint(); // El dominio de Mailgun
            String apiKey = config.getApiKey();
            String url = MAILGUN_API_BASE + "/" + domain + "/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth("api", apiKey);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();

            // From
            String fromEmail = email.getFromEmail() != null ? email.getFromEmail() : config.getFromEmail();
            String fromName = email.getFromName() != null ? email.getFromName() : config.getFromName();
            body.add("from", fromName + " <" + fromEmail + ">");

            // To
            if (email.getToAddresses() != null) {
                List<String> toList = objectMapper.readValue(email.getToAddresses(), List.class);
                for (String to : toList) {
                    body.add("to", to);
                }
            }

            // CC
            if (email.getCcAddresses() != null) {
                List<String> ccList = objectMapper.readValue(email.getCcAddresses(), List.class);
                for (String cc : ccList) {
                    body.add("cc", cc);
                }
            }

            // BCC
            if (email.getBccAddresses() != null) {
                List<String> bccList = objectMapper.readValue(email.getBccAddresses(), List.class);
                for (String bcc : bccList) {
                    body.add("bcc", bcc);
                }
            }

            // Subject
            body.add("subject", email.getSubject());

            // Body
            if (email.getBodyText() != null) {
                body.add("text", email.getBodyText());
            }
            if (email.getBodyHtml() != null) {
                body.add("html", email.getBodyHtml());
            }

            // Reply-To
            if (config.getReplyToEmail() != null) {
                body.add("h:Reply-To", config.getReplyToEmail());
            }

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            log.info("Sending email via Mailgun to domain: {}", domain);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String messageId = (String) response.getBody().get("id");
                String message = (String) response.getBody().get("message");
                log.info("Email sent successfully via Mailgun. MessageId: {}", messageId);
                return EmailSendResult.success(messageId, message);
            } else {
                log.error("Mailgun returned non-success status: {}", response.getStatusCode());
                return EmailSendResult.failure("Mailgun error: " + response.getStatusCode(), "MAILGUN_ERROR");
            }

        } catch (Exception e) {
            log.error("Failed to send email via Mailgun", e);
            return EmailSendResult.failure(e.getMessage(), "MAILGUN_ERROR");
        }
    }

    @Override
    public boolean testConnection(EmailProviderConfig config) {
        try {
            String domain = config.getApiEndpoint();
            String apiKey = config.getApiKey();
            String url = MAILGUN_API_BASE + "/" + domain;

            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth("api", apiKey);

            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            boolean success = response.getStatusCode().is2xxSuccessful();
            log.info("Mailgun connection test {}: domain={}", success ? "successful" : "failed", domain);
            return success;

        } catch (Exception e) {
            log.error("Mailgun connection test failed", e);
            return false;
        }
    }
}
