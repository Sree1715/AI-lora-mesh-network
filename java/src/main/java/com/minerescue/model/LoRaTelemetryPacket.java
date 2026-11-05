package com.minerescue.model;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

/**
 * Mine Rescue & Safety Monitoring System (MRSMS)
 * LoRa Subsurface Telemetry Packet Data Model
 */
public class LoRaTelemetryPacket implements Serializable {
    private static final long serialVersionUID = 1L;

    private String nodeId;
    private String timestamp;
    private double distanceCm;
    private double ch4Ppm;
    private double coPpm;
    private double o2Percent;
    private int rssi;
    private double snr;
    private int battery;
    private int packetId;

    public LoRaTelemetryPacket() {
        this.timestamp = currentIsoTimestamp();
    }

    public LoRaTelemetryPacket(String nodeId, double distanceCm, double ch4Ppm, double coPpm, double o2Percent, int rssi, double snr, int battery) {
        this.nodeId = nodeId;
        this.timestamp = currentIsoTimestamp();
        this.distanceCm = distanceCm;
        this.ch4Ppm = ch4Ppm;
        this.coPpm = coPpm;
        this.o2Percent = o2Percent;
        this.rssi = rssi;
        this.snr = snr;
        this.battery = battery;
        this.packetId = (int) (Math.random() * 65535);
    }

    private static String currentIsoTimestamp() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date());
    }

    // Getters and Setters
    public String getNodeId() { return nodeId; }
    public void setNodeId(String nodeId) { this.nodeId = nodeId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public double getDistanceCm() { return distanceCm; }
    public void setDistanceCm(double distanceCm) { this.distanceCm = distanceCm; }

    public double getCh4Ppm() { return ch4Ppm; }
    public void setCh4Ppm(double ch4Ppm) { this.ch4Ppm = ch4Ppm; }

    public double getCoPpm() { return coPpm; }
    public void setCoPpm(double coPpm) { this.coPpm = coPpm; }

    public double getO2Percent() { return o2Percent; }
    public void setO2Percent(double o2Percent) { this.o2Percent = o2Percent; }

    public int getRssi() { return rssi; }
    public void setRssi(int rssi) { this.rssi = rssi; }

    public double getSnr() { return snr; }
    public void setSnr(double snr) { this.snr = snr; }

    public int getBattery() { return battery; }
    public void setBattery(int battery) { this.battery = battery; }

    public int getPacketId() { return packetId; }
    public void setPacketId(int packetId) { this.packetId = packetId; }

    /**
     * Converts the object to JSON format for MRSMS API ingestion
     */
    public String toJson() {
        return String.format(
            "{\"node_id\":\"%s\",\"timestamp\":\"%s\",\"distance_cm\":%.1f,\"ch4_ppm\":%.1f,\"co_ppm\":%.1f,\"o2_percent\":%.2f,\"rssi\":%d,\"snr\":%.1f,\"battery\":%d,\"packet_id\":%d}",
            nodeId != null ? nodeId : "NODE-01",
            timestamp != null ? timestamp : currentIsoTimestamp(),
            distanceCm,
            ch4Ppm,
            coPpm,
            o2Percent,
            rssi,
            snr,
            battery,
            packetId
        );
    }

    @Override
    public String toString() {
        return String.format(
            "LoRaPacket[%s | Dist: %.1fcm | CH4: %.1fppm | CO: %.1fppm | O2: %.2f%% | RSSI: %ddBm | Batt: %d%%]",
            nodeId, distanceCm, ch4Ppm, coPpm, o2Percent, rssi, battery
        );
    }
}

