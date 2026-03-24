package com.globalcmx.api.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad temporal para generar hashes de contraseña BCrypt.
 * Se puede ejecutar como main para generar hashes.
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        if (args.length > 0) {
            String password = args[0];
            String hash = encoder.encode(password);
            System.out.println("Password: " + password);
            System.out.println("Hash: " + hash);
        } else {
            // Generar hash para admin123 por defecto
            String hash = encoder.encode("admin123");
            System.out.println("Hash for 'admin123': " + hash);
        }
    }
}














