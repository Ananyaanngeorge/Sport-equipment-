package com.example.sports.client;

import com.example.sports.dto.DashboardResponse;
import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.List;

/**
 * Dashboard Panel displaying live metrics, recent transactions, and inventory summary.
 * All data is fetched dynamically from the Spring Boot REST API (/api/dashboard).
 */
public class DashboardPanel extends JPanel {

    private final ApiClient apiClient;

    // Card Value Labels
    private final JLabel lblTotalTypes = new JLabel("0", SwingConstants.CENTER);
    private final JLabel lblTotalQuantity = new JLabel("0", SwingConstants.CENTER);
    private final JLabel lblAvailableQuantity = new JLabel("0", SwingConstants.CENTER);
    private final JLabel lblIssuedQuantity = new JLabel("0", SwingConstants.CENTER);
    private final JLabel lblTotalStudents = new JLabel("0", SwingConstants.CENTER);

    // Tables
    private final DefaultTableModel recentTableModel;
    private final DefaultTableModel inventoryTableModel;
    private final JTable tblRecent;
    private final JTable tblInventory;

    public DashboardPanel(ApiClient apiClient) {
        this.apiClient = apiClient;
        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(new Color(245, 247, 250));

        // Top Header
        JPanel headerPanel = new JPanel(new BorderLayout());
        headerPanel.setOpaque(false);
        JLabel title = new JLabel("System Overview & Statistics");
        title.setFont(new Font("Segoe UI", Font.BOLD, 22));
        title.setForeground(new Color(30, 41, 59));

        JButton btnRefresh = new JButton("↻ Refresh Dashboard");
        btnRefresh.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnRefresh.setBackground(new Color(255, 255, 255));
        btnRefresh.setFocusPainted(false);
        btnRefresh.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnRefresh.addActionListener(e -> loadDashboardData());

        headerPanel.add(title, BorderLayout.WEST);
        headerPanel.add(btnRefresh, BorderLayout.EAST);

        // 1. KPI Cards Grid (5 cards across)
        JPanel cardsGrid = new JPanel(new GridLayout(1, 5, 14, 0));
        cardsGrid.setOpaque(false);
        cardsGrid.setPreferredSize(new Dimension(0, 110));

        cardsGrid.add(createMetricCard("Equipment Types", lblTotalTypes, new Color(59, 130, 246), "Distinct items in stock"));
        cardsGrid.add(createMetricCard("Total Quantity", lblTotalQuantity, new Color(16, 185, 129), "Total units owned"));
        cardsGrid.add(createMetricCard("Available", lblAvailableQuantity, new Color(14, 165, 233), "Ready for checkout"));
        cardsGrid.add(createMetricCard("Currently Issued", lblIssuedQuantity, new Color(245, 158, 11), "Active borrowings"));
        cardsGrid.add(createMetricCard("Registered Students", lblTotalStudents, new Color(139, 92, 246), "Authorized borrowers"));

        // Top container (Header + Cards)
        JPanel topContainer = new JPanel(new BorderLayout(0, 15));
        topContainer.setOpaque(false);
        topContainer.add(headerPanel, BorderLayout.NORTH);
        topContainer.add(cardsGrid, BorderLayout.CENTER);
        add(topContainer, BorderLayout.NORTH);

        // 2. Main Content Split: Recent Transactions (Left) and Inventory Summary (Right)
        JPanel tablesPanel = new JPanel(new GridLayout(1, 2, 16, 0));
        tablesPanel.setOpaque(false);

        // Recent Transactions Table
        recentTableModel = new DefaultTableModel(new String[]{"ID", "Student", "Equipment", "Qty", "Date", "Status"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        tblRecent = styleTable(new JTable(recentTableModel));
        JPanel recentCard = createSectionContainer("Recent Transactions", tblRecent);

        // Inventory Summary Table
        inventoryTableModel = new DefaultTableModel(new String[]{"Equipment", "Category", "Total", "Available", "Issued"}, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };
        tblInventory = styleTable(new JTable(inventoryTableModel));
        JPanel inventoryCard = createSectionContainer("Equipment Inventory Summary", tblInventory);

        tablesPanel.add(recentCard);
        tablesPanel.add(inventoryCard);
        add(tablesPanel, BorderLayout.CENTER);
    }

    private JPanel createMetricCard(String title, JLabel valueLabel, Color accentColor, String subtitle) {
        JPanel card = new JPanel(new BorderLayout(5, 5));
        card.setBackground(Color.WHITE);
        card.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(12, 14, 12, 14)
        ));

        // Top accent line
        JPanel strip = new JPanel();
        strip.setBackground(accentColor);
        strip.setPreferredSize(new Dimension(0, 3));
        card.add(strip, BorderLayout.NORTH);

        JPanel inner = new JPanel(new GridLayout(3, 1, 2, 2));
        inner.setOpaque(false);

        JLabel lblTitle = new JLabel(title);
        lblTitle.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lblTitle.setForeground(new Color(100, 116, 139));

        valueLabel.setFont(new Font("Segoe UI", Font.BOLD, 26));
        valueLabel.setForeground(new Color(15, 23, 42));
        valueLabel.setHorizontalAlignment(SwingConstants.LEFT);

        JLabel lblSub = new JLabel(subtitle);
        lblSub.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        lblSub.setForeground(new Color(148, 163, 184));

        inner.add(lblTitle);
        inner.add(valueLabel);
        inner.add(lblSub);

        card.add(inner, BorderLayout.CENTER);
        return card;
    }

    private JPanel createSectionContainer(String titleText, JTable table) {
        JPanel panel = new JPanel(new BorderLayout(0, 10));
        panel.setBackground(Color.WHITE);
        panel.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(14, 14, 14, 14)
        ));

        JLabel title = new JLabel(titleText);
        title.setFont(new Font("Segoe UI", Font.BOLD, 15));
        title.setForeground(new Color(30, 41, 59));
        panel.add(title, BorderLayout.NORTH);

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(241, 245, 249)));
        scrollPane.getViewport().setBackground(Color.WHITE);
        panel.add(scrollPane, BorderLayout.CENTER);

        return panel;
    }

    private JTable styleTable(JTable table) {
        table.setRowHeight(32);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 12));
        table.getTableHeader().setBackground(new Color(248, 250, 252));
        table.getTableHeader().setForeground(new Color(71, 85, 105));
        table.getTableHeader().setReorderingAllowed(false);
        table.setSelectionBackground(new Color(224, 231, 255));
        table.setSelectionForeground(new Color(30, 41, 59));
        table.setShowGrid(true);
        table.setGridColor(new Color(241, 245, 249));

        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(SwingConstants.CENTER);
        table.setDefaultRenderer(Object.class, centerRenderer);

        return table;
    }

    public void loadDashboardData() {
        // Run in background thread to keep Swing UI responsive
        SwingWorker<DashboardResponse, Void> worker = new SwingWorker<>() {
            @Override
            protected DashboardResponse doInBackground() throws Exception {
                return apiClient.get("/dashboard", DashboardResponse.class);
            }

            @Override
            protected void done() {
                try {
                    DashboardResponse data = get();
                    // Update KPI cards
                    lblTotalTypes.setText(String.valueOf(data.getTotalEquipmentTypes()));
                    lblTotalQuantity.setText(String.valueOf(data.getTotalEquipmentQuantity()));
                    lblAvailableQuantity.setText(String.valueOf(data.getAvailableQuantity()));
                    lblIssuedQuantity.setText(String.valueOf(data.getCurrentlyIssuedQuantity()));
                    lblTotalStudents.setText(String.valueOf(data.getRegisteredStudents()));

                    // Update Recent Transactions Table
                    recentTableModel.setRowCount(0);
                    List<Issue> recent = data.getRecentTransactions();
                    if (recent != null) {
                        for (Issue issue : recent) {
                            recentTableModel.addRow(new Object[]{
                                    issue.getId(),
                                    issue.getStudent() != null ? issue.getStudent().getFullName() : "-",
                                    issue.getEquipment() != null ? issue.getEquipment().getName() : "-",
                                    issue.getQuantity(),
                                    issue.getIssueDate(),
                                    issue.getStatus()
                            });
                        }
                    }

                    // Update Inventory Summary Table
                    inventoryTableModel.setRowCount(0);
                    List<Equipment> items = data.getInventorySummary();
                    if (items != null) {
                        for (Equipment eq : items) {
                            int issued = eq.getTotalQuantity() - eq.getAvailableQuantity();
                            inventoryTableModel.addRow(new Object[]{
                                    eq.getName(),
                                    eq.getCategory(),
                                    eq.getTotalQuantity(),
                                    eq.getAvailableQuantity(),
                                    issued
                            });
                        }
                    }
                } catch (Exception e) {
                    // Do not show noisy stack traces, just gentle banner or message
                    System.err.println("Dashboard sync notice: " + e.getMessage());
                }
            }
        };
        worker.execute();
    }
}
