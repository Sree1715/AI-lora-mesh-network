package com.minerescue.simulator;

import com.minerescue.client.LoRaGatewayClient;
import com.minerescue.model.LoRaTelemetryPacket;
import java.util.Random;

/**
 * Mine Rescue & Safety Monitoring System (MRSMS)
 * Java Multi-Node Continuous Telemetry Stream Simulator
 *
 * Runs a background thread simulating 4 subsurface LoRa nodes transmitting
 * brownian walk telemetry and safety updates to the surface station.
 */
public class MineSensorSimulator {

    private final LoRaGatewayClient client;
    private final Random random = new Random();
    private volatile boolean running = true;

    // Simulation states
    private double node1Dist = 215.0;
    private double node1Ch4 = 650.0;
    private double node1Co = 7.5;
    private double node1O2 = 20.89;

    public MineSensorSimulator() {
        this.client = new LoRaGatewayClient();
    }

    public void startSimulation(int iterations, long intervalMs) {
        System.out.println("Starting Java LoRa Mesh Telemetry Stream (Interval: " + intervalMs + "ms)...");

        int count = 0;
        while (running && (iterations <= 0 || count < iterations)) {
            count++;

            // Brownian walk fluctuation
            node1Dist = Math.max(185.0, Math.min(240.0, node1Dist + (random.nextDouble() - 0.5) * 1.8));
            node1Ch4 = Math.max(400.0, Math.min(1200.0, node1Ch4 + (random.nextDouble() - 0.49) * 25.0));
            node1Co = Math.max(4.0, Math.min(14.0, node1Co + (random.nextDouble() - 0.49) * 0.4));
            node1O2 = Math.max(20.7, Math.min(21.0, node1O2 + (random.nextDouble() - 0.5) * 0.02));
            int rssi = -78 + (random.nextInt(7) - 3);

            LoRaTelemetryPacket packet = new LoRaTelemetryPacket(
                "NODE-01",
                round(node1Dist, 1),
                round(node1Ch4, 1),
                round(node1Co, 1),
                round(node1O2, 2),
                rssi,
                8.4,
                94
            );

            try {
                String response = client.sendTelemetry(packet);
                System.out.printf("[#%03d] Sent NODE-01: Dist=%.1fcm | CH4=%.1fppm | CO=%.1fppm | O2=%.2f%% | RSSI=%ddBm -> OK%n",
                    count, packet.getDistanceCm(), packet.getCh4Ppm(), packet.getCoPpm(), packet.getO2Percent(), packet.getRssi()
                );
            } catch (Exception e) {
                System.err.println("Transmission failed: " + e.getMessage());
            }

            try {
                Thread.sleep(intervalMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        System.out.println("Simulation complete. Total packets transmitted: " + count);
    }

    private static double round(double val, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    }

    public static void main(String[] args) {
        MineSensorSimulator sim = new MineSensorSimulator();
        // Run 10 telemetry transmission cycles by default
        sim.startSimulation(10, 1500);
    }
}

