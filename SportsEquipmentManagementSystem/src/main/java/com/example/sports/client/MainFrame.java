package com.example.sports.client;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 * Main Application Window using Java Swing.
 * Implements sidebar navigation, CardLayout screen switcher, and top header.
 */
public class MainFrame extends JFrame {

    private final ApiClient apiClient;

    private final CardLayout cardLayout = new CardLayout();
    private final JPanel contentPanel = new JPanel(cardLayout);

    private final DashboardPanel dashboardPanel;
    private final EquipmentPanel equipmentPanel;
    private final StudentPanel studentPanel;
    private final IssuePanel issuePanel;

    private final JLabel lblConnectionStatus = new JLabel("● Online (localhost:8080)");
    private JButton btnActiveNav = null;

    public MainFrame() {
        this("http://localhost:8080/api");
    }

    public MainFrame(String apiBaseUrl) {
        super("Sports Equipment Management System - CSE College Project");
        this.apiClient = new ApiClient(apiBaseUrl);

        // Configure frame properties
        setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
        setSize(1180, 760);
        setMinimumSize(new Dimension(980, 640));
        setLocationRelativeTo(null); // Center on screen

        // Intercept window close to confirm exit
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                handleExit();
            }
        });

        // Initialize panels with data synchronization callbacks
        Runnable onDataChanged = this::refreshAllData;
        dashboardPanel = new DashboardPanel(apiClient);
        equipmentPanel = new EquipmentPanel(apiClient, onDataChanged);
        studentPanel = new StudentPanel(apiClient, onDataChanged);
        issuePanel = new IssuePanel(apiClient, onDataChanged);

        // Register cards in CardLayout
        contentPanel.add(dashboardPanel, "DASHBOARD");
        contentPanel.add(equipmentPanel, "EQUIPMENT");
        contentPanel.add(studentPanel, "STUDENTS");
        contentPanel.add(issuePanel, "ISSUE");

        // Layout container: Left sidebar, Top header, Center content
        JPanel rootPanel = new JPanel(new BorderLayout());
        rootPanel.add(createSidebar(), BorderLayout.WEST);

        JPanel mainArea = new JPanel(new BorderLayout());
        mainArea.add(createTopHeader(), BorderLayout.NORTH);
        mainArea.add(contentPanel, BorderLayout.CENTER);

        rootPanel.add(mainArea, BorderLayout.CENTER);
        setContentPane(rootPanel);

        // Initial data load
        refreshAllData();
    }

    private JPanel createSidebar() {
        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setPreferredSize(new Dimension(240, 0));
        sidebar.setBackground(new Color(15, 23, 42)); // Dark slate navy
        sidebar.setBorder(new EmptyBorder(24, 16, 24, 16));

        // Brand / Logo section
        JLabel brandIcon = new JLabel("⚽ 🏆");
        brandIcon.setFont(new Font("Segoe UI Emoji", Font.PLAIN, 28));
        brandIcon.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel brandTitle = new JLabel("SPORTS DESK");
        brandTitle.setFont(new Font("Segoe UI", Font.BOLD, 18));
        brandTitle.setForeground(Color.WHITE);
        brandTitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel brandSub = new JLabel("College Equipment System");
        brandSub.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        brandSub.setForeground(new Color(148, 163, 184));
        brandSub.setAlignmentX(Component.CENTER_ALIGNMENT);

        sidebar.add(brandIcon);
        sidebar.add(Box.createRigidArea(new Dimension(0, 6)));
        sidebar.add(brandTitle);
        sidebar.add(Box.createRigidArea(new Dimension(0, 2)));
        sidebar.add(brandSub);
        sidebar.add(Box.createRigidArea(new Dimension(0, 30)));

        // Navigation Menu Buttons
        JButton btnDashboard = createNavButton("📊  Dashboard", "DASHBOARD");
        JButton btnEquipment = createNavButton("⚽  Equipment", "EQUIPMENT");
        JButton btnStudents = createNavButton("🎓  Students", "STUDENTS");
        JButton btnIssue = createNavButton("🔄  Issue / Return", "ISSUE");

        sidebar.add(btnDashboard);
        sidebar.add(Box.createRigidArea(new Dimension(0, 10)));
        sidebar.add(btnEquipment);
        sidebar.add(Box.createRigidArea(new Dimension(0, 10)));
        sidebar.add(btnStudents);
        sidebar.add(Box.createRigidArea(new Dimension(0, 10)));
        sidebar.add(btnIssue);

        // Highlight initial button
        setActiveNavButton(btnDashboard);

        // Push Exit button to the bottom
        sidebar.add(Box.createVerticalGlue());

        // Team info
        JLabel teamLabel = new JLabel("CSE Department • Team of 3");
        teamLabel.setFont(new Font("Segoe UI", Font.ITALIC, 11));
        teamLabel.setForeground(new Color(100, 116, 139));
        teamLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
        sidebar.add(teamLabel);
        sidebar.add(Box.createRigidArea(new Dimension(0, 14)));

        JButton btnExit = new JButton("🚪  Exit Application");
        btnExit.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnExit.setForeground(new Color(248, 113, 113));
        btnExit.setBackground(new Color(30, 41, 59));
        btnExit.setFocusPainted(false);
        btnExit.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(51, 65, 85), 1),
                new EmptyBorder(10, 14, 10, 14)
        ));
        btnExit.setMaximumSize(new Dimension(Integer.MAX_VALUE, 42));
        btnExit.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnExit.addActionListener(e -> handleExit());
        sidebar.add(btnExit);

        return sidebar;
    }

    private JButton createNavButton(String label, String cardName) {
        JButton btn = new JButton(label);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(new Color(203, 213, 225));
        btn.setBackground(new Color(30, 41, 59));
        btn.setFocusPainted(false);
        btn.setBorder(new EmptyBorder(12, 16, 12, 16));
        btn.setHorizontalAlignment(SwingConstants.LEFT);
        btn.setMaximumSize(new Dimension(Integer.MAX_VALUE, 44));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));

        btn.addActionListener(e -> {
            cardLayout.show(contentPanel, cardName);
            setActiveNavButton(btn);
            // Refresh target panel content
            if ("DASHBOARD".equals(cardName)) dashboardPanel.loadDashboardData();
            if ("EQUIPMENT".equals(cardName)) equipmentPanel.loadEquipment();
            if ("STUDENTS".equals(cardName)) studentPanel.loadStudents();
            if ("ISSUE".equals(cardName)) issuePanel.loadData();
        });

        return btn;
    }

    private void setActiveNavButton(JButton button) {
        if (btnActiveNav != null) {
            btnActiveNav.setBackground(new Color(30, 41, 59));
            btnActiveNav.setForeground(new Color(203, 213, 225));
        }
        btnActiveNav = button;
        btnActiveNav.setBackground(new Color(37, 99, 235)); // Vibrant blue active highlight
        btnActiveNav.setForeground(Color.WHITE);
    }

    private JPanel createTopHeader() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(Color.WHITE);
        header.setPreferredSize(new Dimension(0, 60));
        header.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, new Color(226, 232, 240)),
                new EmptyBorder(0, 24, 0, 24)
        ));

        JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 18));
        left.setOpaque(false);
        JLabel title = new JLabel("Sports Equipment Management System");
        title.setFont(new Font("Segoe UI", Font.BOLD, 16));
        title.setForeground(new Color(15, 23, 42));
        left.add(title);

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 14, 15));
        right.setOpaque(false);

        lblConnectionStatus.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lblConnectionStatus.setForeground(new Color(16, 185, 129));

        JButton btnSync = new JButton("↻ Sync All");
        btnSync.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        btnSync.setBackground(new Color(241, 245, 249));
        btnSync.setFocusPainted(false);
        btnSync.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnSync.addActionListener(e -> {
            refreshAllData();
            JOptionPane.showMessageDialog(this, "Data refreshed from Spring Boot backend.", "Sync Completed", JOptionPane.INFORMATION_MESSAGE);
        });

        right.add(lblConnectionStatus);
        right.add(btnSync);

        header.add(left, BorderLayout.WEST);
        header.add(right, BorderLayout.EAST);
        return header;
    }

    private void refreshAllData() {
        dashboardPanel.loadDashboardData();
        equipmentPanel.loadEquipment();
        studentPanel.loadStudents();
        issuePanel.loadData();
    }

    private void handleExit() {
        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to exit the Sports Equipment Management System?",
                "Exit Confirmation", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
        if (confirm == JOptionPane.YES_OPTION) {
            dispose();
            System.exit(0);
        }
    }

    public static void main(String[] args) {
        // Set cross-platform look and feel or Nimbus
        try {
            for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
                if ("Nimbus".equals(info.getName())) {
                    UIManager.setLookAndFeel(info.getClassName());
                    break;
                }
            }
        } catch (Exception ignored) {
        }

        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
