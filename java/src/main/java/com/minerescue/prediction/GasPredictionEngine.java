package com.minerescue.prediction;

import com.minerescue.model.LoRaTelemetryPacket;
import java.util.List;

/**
 * Mine Rescue & Safety Monitoring System (MRSMS)
 * Industrial Gas Prediction and Hazard Forecasting Engine
 */
public class GasPredictionEngine {

    // Thresholds calibrated to MSHA and OSHA Title 30 underground standards
    public static final double CH4_CAUTION_PPM = 5000.0;   // 10% LEL
    public static final double CH4_CRITICAL_PPM = 10000.0; // 20% LEL (Mandatory Evac)
    public static final double CO_CAUTION_PPM = 35.0;      // OSHA 8-hr REL
    public static final double CO_CRITICAL_PPM = 100.0;    // Toxic combustion ceiling
    public static final double O2_CAUTION_LOW = 19.5;      // Deficiency threshold
    public static final double O2_CRITICAL_LOW = 16.0;     // Asphyxiation hazard
    public static final double DISTANCE_CAUTION_CM = 180.0;// Tunnel convergence caution
    public static final double DISTANCE_CRITICAL_CM = 100.0;// Impending cave-in hazard

    public enum HazardLevel {
        NORMAL, CAUTION, CRITICAL
    }

    public static class ForecastResult {
        public double currentValue;
        public double ratePerMin;
        public double predicted10m;
        public Double timeToCriticalSec;
        public HazardLevel hazardLevel;

        public ForecastResult(double currentValue, double ratePerMin, double predicted10m, Double timeToCriticalSec, HazardLevel hazardLevel) {
            this.currentValue = currentValue;
            this.ratePerMin = ratePerMin;
            this.predicted10m = predicted10m;
            this.timeToCriticalSec = timeToCriticalSec;
            this.hazardLevel = hazardLevel;
        }

        @Override
        public String toString() {
            return String.format("Current: %.1f | Rate: %.2f/min | 10m Forecast: %.1f | Level: %s | TimeToCritical: %s",
                currentValue, ratePerMin, predicted10m, hazardLevel,
                timeToCriticalSec != null ? String.format("%.0fs", timeToCriticalSec) : "None"
            );
        }
    }

    /**
     * Forecasts gas accumulation over a recent series of telemetry readings
     */
    public static ForecastResult forecastMethane(List<LoRaTelemetryPacket> history) {
        if (history == null || history.isEmpty()) {
            return new ForecastResult(0, 0, 0, null, HazardLevel.NORMAL);
        }

        int n = history.size();
        LoRaTelemetryPacket latest = history.get(n - 1);
        double currentCh4 = latest.getCh4Ppm();

        if (n < 2) {
            return new ForecastResult(currentCh4, 0, currentCh4, null, 
                currentCh4 >= CH4_CRITICAL_PPM ? HazardLevel.CRITICAL : 
                currentCh4 >= CH4_CAUTION_PPM ? HazardLevel.CAUTION : HazardLevel.NORMAL);
        }

        // Calculate rate of change per minute over recent window
        int window = Math.min(30, n);
        LoRaTelemetryPacket oldestInWindow = history.get(n - window);
        double deltaVal = currentCh4 - oldestInWindow.getCh4Ppm();
        // Assuming ~1.2s per telemetry sample
        double elapsedMin = (window * 1.2) / 60.0;
        double ratePerMin = elapsedMin > 0 ? deltaVal / elapsedMin : 0;

        double predicted10m = Math.max(0, currentCh4 + (ratePerMin * 10.0));
        Double timeToCritical = null;

        if (ratePerMin > 10.0 && currentCh4 < CH4_CRITICAL_PPM) {
            double remaining = CH4_CRITICAL_PPM - currentCh4;
            timeToCritical = (remaining / ratePerMin) * 60.0;
        }

        HazardLevel level = HazardLevel.NORMAL;
        if (currentCh4 >= CH4_CRITICAL_PPM || (timeToCritical != null && timeToCritical < 300)) {
            level = HazardLevel.CRITICAL;
        } else if (currentCh4 >= CH4_CAUTION_PPM || (timeToCritical != null && timeToCritical < 600)) {
            level = HazardLevel.CAUTION;
        }

        return new ForecastResult(currentCh4, ratePerMin, predicted10m, timeToCritical, level);
    }

    /**
     * Calculates composite Tunnel Safety Index (0 to 100)
     */
    public static int calculateSafetyIndex(LoRaTelemetryPacket packet) {
        if (packet == null) return 100;
        int score = 100;

        // Ultrasonic clearance
        double dist = packet.getDistanceCm();
        if (dist < DISTANCE_CRITICAL_CM) score -= 45;
        else if (dist < 120.0) score -= 30;
        else if (dist < DISTANCE_CAUTION_CM) score -= 15;

        // Methane CH4
        double ch4 = packet.getCh4Ppm();
        if (ch4 >= CH4_CRITICAL_PPM) score -= 45;
        else if (ch4 >= CH4_CAUTION_PPM) score -= 25;
        else if (ch4 >= 2500.0) score -= 10;

        // Carbon Monoxide CO
        double co = packet.getCoPpm();
        if (co >= CO_CRITICAL_PPM) score -= 40;
        else if (co >= 50.0) score -= 25;
        else if (co >= CO_CAUTION_PPM) score -= 15;

        // Oxygen O2
        double o2 = packet.getO2Percent();
        if (o2 <= O2_CRITICAL_LOW) score -= 40;
        else if (o2 < O2_CAUTION_LOW) score -= 20;

        // RSSI & Battery
        if (packet.getRssi() < -115) score -= 10;
        if (packet.getBattery() < 20) score -= 5;

        return Math.max(0, Math.min(100, score));
    }
}

