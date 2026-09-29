package com.attendance.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class AttendanceService {

    /**
     * Section 10: Attendance Calculation Formula
     * attended = PRESENT + LATE
     * counted = PRESENT + ABSENT + LATE
     * percentage = (attended / counted) * 100
     */
    public BigDecimal calculatePercentage(int present, int absent, int late, int excused) {
        int attended = present + late;
        int counted = present + absent + late;

        if (counted == 0) {
            return BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.valueOf(attended)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(counted), 2, RoundingMode.HALF_UP);
    }

    /**
     * Section 14: Attendance Calculator Formula
     * (attended + N) / (counted + N) >= target
     * Find smallest valid integer N.
     */
    public int calculateRequiredFutureClasses(int attended, int counted, double targetPercentage) {
        if (targetPercentage <= 0) return 0;
        if (targetPercentage > 100) return -1;
        if (counted == 0) return 0;

        double currentPercent = ((double) attended / counted) * 100.0;
        if (currentPercent >= targetPercentage) return 0;

        double targetRatio = targetPercentage / 100.0;
        double numerator = (targetRatio * counted) - attended;
        double denominator = 1.0 - targetRatio;

        if (denominator <= 0) return -1; // mathematically impossible if absences exist

        return (int) Math.ceil(numerator / denominator);
    }

    /**
     * Section 23: QR Token Hashing
     * Never store raw tokens in the database; hash tokens using SHA-256
     */
    public String hashQrToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Section 23: Verify QR Token Validity & Expiry
     */
    public boolean isQrTokenValid(String rawToken, String expectedHash, Instant expiresAt) {
        if (rawToken == null || expectedHash == null || expiresAt == null) {
            return false;
        }

        if (Instant.now().isAfter(expiresAt)) {
            return false; // Expired token
        }

        String calculatedHash = hashQrToken(rawToken);
        return calculatedHash.equalsIgnoreCase(expectedHash);
    }
}
