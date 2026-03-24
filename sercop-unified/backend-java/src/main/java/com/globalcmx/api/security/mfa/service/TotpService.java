package com.globalcmx.api.security.mfa.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Service for TOTP (Time-based One-Time Password) operations.
 * Implements RFC 6238.
 */
@Slf4j
@Service
public class TotpService {

    private static final int SECRET_SIZE = 20; // 160 bits
    private static final int CODE_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int WINDOW_SIZE = 1; // Allow 1 step before/after for clock skew
    private static final String HMAC_ALGORITHM = "HmacSHA1";

    @Value("${mfa.totp.issuer:GlobalCMX}")
    private String issuer;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Base32 base32 = new Base32();

    /**
     * Generate a new TOTP secret.
     *
     * @return Base32 encoded secret
     */
    public String generateSecret() {
        byte[] secretBytes = new byte[SECRET_SIZE];
        secureRandom.nextBytes(secretBytes);
        return base32.encodeToString(secretBytes);
    }

    /**
     * Generate a QR code for the TOTP secret.
     *
     * @param secret Base32 encoded secret
     * @param accountName User's account name (usually email)
     * @return Base64 encoded PNG image
     */
    public String generateQrCode(String secret, String accountName) {
        try {
            String otpAuthUri = buildOtpAuthUri(secret, accountName);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthUri, BarcodeFormat.QR_CODE, 200, 200);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (WriterException | java.io.IOException e) {
            log.error("Failed to generate QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Build the otpauth:// URI for authenticator apps.
     */
    public String buildOtpAuthUri(String secret, String accountName) {
        try {
            String encodedIssuer = URLEncoder.encode(issuer, StandardCharsets.UTF_8);
            String encodedAccount = URLEncoder.encode(accountName, StandardCharsets.UTF_8);

            return String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d",
                encodedIssuer, encodedAccount, secret, encodedIssuer, CODE_DIGITS, TIME_STEP_SECONDS
            );
        } catch (Exception e) {
            log.error("Failed to build OTP auth URI", e);
            throw new RuntimeException("Failed to build OTP auth URI", e);
        }
    }

    /**
     * Verify a TOTP code.
     *
     * @param secret Base32 encoded secret
     * @param code The code to verify
     * @return true if valid
     */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }

        // Clean the code (remove spaces)
        code = code.replaceAll("\\s", "");

        if (code.length() != CODE_DIGITS) {
            return false;
        }

        try {
            int codeInt = Integer.parseInt(code);
            long currentTimeStep = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;

            // Check current time step and adjacent ones (for clock skew)
            for (int i = -WINDOW_SIZE; i <= WINDOW_SIZE; i++) {
                int expectedCode = generateCode(secret, currentTimeStep + i);
                if (expectedCode == codeInt) {
                    return true;
                }
            }

            return false;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Generate a TOTP code for a given time step.
     */
    private int generateCode(String secret, long timeStep) {
        try {
            byte[] secretBytes = base32.decode(secret);
            byte[] timeBytes = ByteBuffer.allocate(8).putLong(timeStep).array();

            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretBytes, HMAC_ALGORITHM));
            byte[] hash = mac.doFinal(timeBytes);

            // Dynamic truncation
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                       | ((hash[offset + 1] & 0xff) << 16)
                       | ((hash[offset + 2] & 0xff) << 8)
                       | (hash[offset + 3] & 0xff);

            return binary % (int) Math.pow(10, CODE_DIGITS);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Failed to generate TOTP code", e);
            throw new RuntimeException("Failed to generate TOTP code", e);
        }
    }

    /**
     * Generate the current TOTP code (for testing purposes).
     */
    public String getCurrentCode(String secret) {
        long timeStep = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;
        int code = generateCode(secret, timeStep);
        return String.format("%0" + CODE_DIGITS + "d", code);
    }

    public String getIssuer() {
        return issuer;
    }
}
