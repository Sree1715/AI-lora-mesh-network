package com.minerescue.client;

import com.minerescue.model.LoRaTelemetryPacket;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Mine Rescue & Safety Monitoring System (MRSMS)
 * Java LoRa Gateway Ingestion Client
 *
 * Transmits underground node telemetry packets over HTTP to the MRSMS Central Station.
 * Requires only standard Java Runtime (JRE 8+), zero external libraries needed.
 */
public class LoRaGatewayClient {

    private final String endpointUrl;

    public LoRaGatewayClient(String endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    public LoRaGatewayClient() {
        this("http://localhost:5000/api/telemetry");
    }

    /**
     * Sends a LoRa telemetry packet to the MRSMS Central Surface Station
     * @param packet The telemetry packet to ingest
     * @return Server response JSON string
     * @throws Exception On network or HTTP error
     */
    public String sendTelemetry(LoRaTelemetryPacket packet) throws Exception {
        URL url = new URL(this.endpointUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; utf-8");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("User-Agent", "MRSMS-Java-LoRa-Gateway/1.0");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(5000);
        conn.setDoOutput(true);

        String jsonPayload = packet.toJson();

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonPayload.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int code = conn.getResponseCode();
        StringBuilder response = new StringBuilder();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream(),
                StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                response.append(line.trim());
            }
        }

        if (code >= 200 && code < 300) {
            return response.toString();
        } else {
            throw new RuntimeException("HTTP Error " + code + ": " + response);
        }
    }

    /**
     * Standalone executable test runner
     */
    public static void main(String[] args) {
        System.out.println("=======================================================");
        System.out.println(" MRSMS - Java LoRa Gateway Client");
        System.out.println(" Transmitting Underground Telemetry to Surface Station");
        System.out.println("=======================================================");

        LoRaGatewayClient client = new LoRaGatewayClient();

        try {
            // Build a test packet for Sector 4 Deep Stope (-420m)
            LoRaTelemetryPacket packet = new LoRaTelemetryPacket(
                "NODE-01",   // Node ID
                214.5,       // Distance clearance in cm
                680.0,       // CH4 in ppm (Safe < 5000)
                8.4,         // CO in ppm (Safe < 35)
                20.88,       // O2 percent (Safe 19.5 - 23.5)
                -79,         // LoRa RSSI in dBm
                8.5,         // SNR in dB
                94           // Battery percent
            );

            System.out.println("Constructed LoRa Packet: " + packet);
            System.out.println("JSON Payload: " + packet.toJson());
            System.out.println("Connecting to MRSMS Surface Station at http://localhost:5000/api/telemetry...");

            String response = client.sendTelemetry(packet);
            System.out.println("Server Response (201 Ingested):");
            System.out.println(response);
            System.out.println("\nSUCCESS: Packet ingested and broadcasted to all connected control dashboards!");

        } catch (Exception e) {
            System.err.println("Ingestion error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

