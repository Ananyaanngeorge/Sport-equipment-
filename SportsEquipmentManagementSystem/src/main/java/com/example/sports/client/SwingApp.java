package com.example.sports.client;

import javax.swing.*;

/**
 * Convenience entry point to launch the Java Swing frontend.
 * 
 * Instructions for Students:
 * 1. Start Spring Boot: Run 'SportsEquipmentManagementSystemApplication.java'
 * 2. Start Swing UI: Run this 'SwingApp.java' (Right Click -> Run 'SwingApp.main()')
 */
public class SwingApp {

    public static void main(String[] args) {
        // Run on Event Dispatch Thread (Swing best practice)
        SwingUtilities.invokeLater(() -> {
            try {
                // Use system look and feel for native OS appearance
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception ignored) {
            }

            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
