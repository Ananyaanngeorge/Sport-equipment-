package com.example.sports.client;

import com.example.sports.entity.Equipment;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Equipment Management Panel.
 * Handles adding, updating, searching, filtering, and deleting sports gear.
 */
public class EquipmentPanel extends JPanel {

    private final ApiClient apiClient;
    private final Runnable onDataChanged;

    private final JTextField txtSearch = new JTextField(15);
    private final JComboBox<String> cmbCategoryFilter = new JComboBox<>(new String[]{"All", "Indoor", "Outdoor", "Fitness", "Athletics", "Other"});
    private final DefaultTableModel tableModel;
    private final JTable table;
    private List<Equipment> currentEquipmentList = new ArrayList<>();

    public EquipmentPanel(ApiClient apiClient, Runnable onDataChanged) {
        this.apiClient = apiClient;
        this.onDataChanged = onDataChanged;

        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(new Color(245, 247, 250));

        // 1. Top Controls Bar (Search, Filter, Add)
        JPanel topPanel = new JPanel(new BorderLayout(10, 10));
        topPanel.setOpaque(false);

        JLabel title = new JLabel("Sports Equipment Inventory");
        title.setFont(new Font("Segoe UI", Font.BOLD, 22));
        title.setForeground(new Color(30, 41, 59));

        JPanel filterPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        filterPanel.setOpaque(false);

        JLabel lblSearch = new JLabel("Search:");
        lblSearch.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        JLabel lblCategory = new JLabel("Category:");
        lblCategory.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        JButton btnSearch = new JButton("Filter");
        btnSearch.setBackground(new Color(241, 245, 249));
        btnSearch.setFocusPainted(false);
        btnSearch.addActionListener(e -> loadEquipment());

        JButton btnReset = new JButton("Reset");
        btnReset.setBackground(new Color(241, 245, 249));
        btnReset.setFocusPainted(false);
        btnReset.addActionListener(e -> {
            txtSearch.setText("");
            cmbCategoryFilter.setSelectedIndex(0);
            loadEquipment();
        });

        JButton btnAdd = new JButton("+ Add Equipment");
        btnAdd.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnAdd.setBackground(new Color(37, 99, 235));
        btnAdd.setForeground(Color.WHITE);
        btnAdd.setFocusPainted(false);
        btnAdd.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnAdd.addActionListener(e -> showAddDialog());

        filterPanel.add(lblSearch);
        filterPanel.add(txtSearch);
        filterPanel.add(lblCategory);
        filterPanel.add(cmbCategoryFilter);
        filterPanel.add(btnSearch);
        filterPanel.add(btnReset);
        filterPanel.add(btnAdd);

        topPanel.add(title, BorderLayout.WEST);
        topPanel.add(filterPanel, BorderLayout.EAST);
        add(topPanel, BorderLayout.NORTH);

        // 2. Center Table
        String[] columns = {"ID", "Equipment Name", "Category", "Total Quantity", "Available Quantity", "Description"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false;
            }
        };

        table = new JTable(tableModel);
        table.setRowHeight(34);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        table.getTableHeader().setFont(new Font("Segoe UI", Font.BOLD, 13));
        table.getTableHeader().setBackground(new Color(241, 245, 249));
        table.getTableHeader().setForeground(new Color(51, 65, 85));
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setSelectionBackground(new Color(224, 231, 255));
        table.setSelectionForeground(new Color(30, 41, 59));
        table.setShowGrid(true);
        table.setGridColor(new Color(241, 245, 249));

        DefaultTableCellRenderer center = new DefaultTableCellRenderer();
        center.setHorizontalAlignment(SwingConstants.CENTER);
        table.getColumnModel().getColumn(0).setCellRenderer(center);
        table.getColumnModel().getColumn(2).setCellRenderer(center);
        table.getColumnModel().getColumn(3).setCellRenderer(center);
        table.getColumnModel().getColumn(4).setCellRenderer(center);

        table.getColumnModel().getColumn(0).setPreferredWidth(60);
        table.getColumnModel().getColumn(1).setPreferredWidth(180);
        table.getColumnModel().getColumn(2).setPreferredWidth(120);
        table.getColumnModel().getColumn(3).setPreferredWidth(110);
        table.getColumnModel().getColumn(4).setPreferredWidth(120);
        table.getColumnModel().getColumn(5).setPreferredWidth(260);

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(0, 0, 0, 0)
        ));
        scrollPane.getViewport().setBackground(Color.WHITE);
        add(scrollPane, BorderLayout.CENTER);

        // 3. Bottom Action Buttons
        JPanel bottomPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        bottomPanel.setOpaque(false);

        JButton btnUpdate = new JButton("Update Equipment");
        btnUpdate.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnUpdate.setBackground(new Color(255, 255, 255));
        btnUpdate.setFocusPainted(false);
        btnUpdate.addActionListener(e -> showUpdateDialog());

        JButton btnDelete = new JButton("Delete Equipment");
        btnDelete.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnDelete.setBackground(new Color(254, 242, 242));
        btnDelete.setForeground(new Color(220, 38, 38));
        btnDelete.setFocusPainted(false);
        btnDelete.addActionListener(e -> deleteSelectedEquipment());

        JButton btnRefresh = new JButton("↻ Refresh");
        btnRefresh.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnRefresh.setBackground(new Color(255, 255, 255));
        btnRefresh.setFocusPainted(false);
        btnRefresh.addActionListener(e -> loadEquipment());

        bottomPanel.add(btnUpdate);
        bottomPanel.add(btnDelete);
        bottomPanel.add(btnRefresh);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    public void loadEquipment() {
        String category = (String) cmbCategoryFilter.getSelectedItem();
        String search = txtSearch.getText().trim();

        StringBuilder query = new StringBuilder("/equipment?");
        if (category != null && !category.equals("All")) {
            query.append("category=").append(category).append("&");
        }
        if (!search.isEmpty()) {
            query.append("search=").append(search);
        }

        SwingWorker<List<Equipment>, Void> worker = new SwingWorker<>() {
            @Override
            protected List<Equipment> doInBackground() throws Exception {
                return apiClient.getList(query.toString(), Equipment.class);
            }

            @Override
            protected void done() {
                try {
                    currentEquipmentList = get();
                    tableModel.setRowCount(0);
                    for (Equipment eq : currentEquipmentList) {
                        tableModel.addRow(new Object[]{
                                eq.getId(),
                                eq.getName(),
                                eq.getCategory(),
                                eq.getTotalQuantity(),
                                eq.getAvailableQuantity(),
                                eq.getDescription() != null ? eq.getDescription() : ""
                        });
                    }
                } catch (Exception e) {
                    JOptionPane.showMessageDialog(EquipmentPanel.this,
                            "Failed to load equipment: " + e.getMessage(),
                            "Connection Notice", JOptionPane.WARNING_MESSAGE);
                }
            }
        };
        worker.execute();
    }

    private void showAddDialog() {
        JDialog dialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), "Add New Equipment", true);
        dialog.setSize(440, 380);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(4, 2, 10, 14));
        form.setBorder(new EmptyBorder(20, 20, 10, 20));

        JTextField txtName = new JTextField();
        JComboBox<String> cmbCat = new JComboBox<>(new String[]{"Indoor", "Outdoor", "Fitness", "Athletics", "Other"});
        JSpinner spQty = new JSpinner(new SpinnerNumberModel(1, 1, 1000, 1));
        JTextArea txtDesc = new JTextArea(3, 20);
        txtDesc.setLineWrap(true);
        txtDesc.setWrapStyleWord(true);
        JScrollPane scrollDesc = new JScrollPane(txtDesc);

        form.add(new JLabel("Equipment Name: *"));
        form.add(txtName);
        form.add(new JLabel("Category: *"));
        form.add(cmbCat);
        form.add(new JLabel("Total Quantity: *"));
        form.add(spQty);
        form.add(new JLabel("Description:"));
        form.add(scrollDesc);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 12));
        JButton btnSave = new JButton("Save Equipment");
        btnSave.setBackground(new Color(37, 99, 235));
        btnSave.setForeground(Color.WHITE);
        btnSave.setFocusPainted(false);

        JButton btnCancel = new JButton("Cancel");
        btnCancel.addActionListener(e -> dialog.dispose());

        btnSave.addActionListener(e -> {
            String name = txtName.getText().trim();
            String cat = (String) cmbCat.getSelectedItem();
            int qty = (Integer) spQty.getValue();
            String desc = txtDesc.getText().trim();

            if (name.isEmpty()) {
                JOptionPane.showMessageDialog(dialog, "Equipment name cannot be empty.", "Validation Error", JOptionPane.ERROR_MESSAGE);
                return;
            }
            if (qty <= 0) {
                JOptionPane.showMessageDialog(dialog, "Total quantity must be greater than zero.", "Validation Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            Equipment eq = new Equipment(name, cat, qty, qty, desc);
            try {
                apiClient.post("/equipment", eq, Equipment.class);
                JOptionPane.showMessageDialog(dialog, "Equipment added successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                dialog.dispose();
                loadEquipment();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, ex.getMessage(), "Error Adding Equipment", JOptionPane.ERROR_MESSAGE);
            }
        });

        btnPanel.add(btnCancel);
        btnPanel.add(btnSave);

        dialog.add(form, BorderLayout.CENTER);
        dialog.add(btnPanel, BorderLayout.SOUTH);
        dialog.setVisible(true);
    }

    private void showUpdateDialog() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select an equipment item to edit.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long id = (Long) tableModel.getValueAt(selectedRow, 0);
        Equipment current = currentEquipmentList.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (current == null) return;

        JDialog dialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), "Update Equipment (ID: " + id + ")", true);
        dialog.setSize(440, 380);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(4, 2, 10, 14));
        form.setBorder(new EmptyBorder(20, 20, 10, 20));

        JTextField txtName = new JTextField(current.getName());
        JComboBox<String> cmbCat = new JComboBox<>(new String[]{"Indoor", "Outdoor", "Fitness", "Athletics", "Other"});
        cmbCat.setSelectedItem(current.getCategory());
        JSpinner spQty = new JSpinner(new SpinnerNumberModel((int) current.getTotalQuantity(), 1, 1000, 1));
        JTextArea txtDesc = new JTextArea(current.getDescription() != null ? current.getDescription() : "", 3, 20);
        txtDesc.setLineWrap(true);
        txtDesc.setWrapStyleWord(true);
        JScrollPane scrollDesc = new JScrollPane(txtDesc);

        form.add(new JLabel("Equipment Name: *"));
        form.add(txtName);
        form.add(new JLabel("Category: *"));
        form.add(cmbCat);
        form.add(new JLabel("Total Quantity: *"));
        form.add(spQty);
        form.add(new JLabel("Description:"));
        form.add(scrollDesc);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 12));
        JButton btnSave = new JButton("Update");
        btnSave.setBackground(new Color(37, 99, 235));
        btnSave.setForeground(Color.WHITE);
        btnSave.setFocusPainted(false);

        JButton btnCancel = new JButton("Cancel");
        btnCancel.addActionListener(e -> dialog.dispose());

        btnSave.addActionListener(e -> {
            String name = txtName.getText().trim();
            String cat = (String) cmbCat.getSelectedItem();
            int qty = (Integer) spQty.getValue();
            String desc = txtDesc.getText().trim();

            if (name.isEmpty()) {
                JOptionPane.showMessageDialog(dialog, "Equipment name cannot be empty.", "Validation Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            Equipment updatePayload = new Equipment(name, cat, qty, current.getAvailableQuantity(), desc);
            try {
                apiClient.put("/equipment/" + id, updatePayload, Equipment.class);
                JOptionPane.showMessageDialog(dialog, "Equipment updated successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                dialog.dispose();
                loadEquipment();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, ex.getMessage(), "Error Updating Equipment", JOptionPane.ERROR_MESSAGE);
            }
        });

        btnPanel.add(btnCancel);
        btnPanel.add(btnSave);

        dialog.add(form, BorderLayout.CENTER);
        dialog.add(btnPanel, BorderLayout.SOUTH);
        dialog.setVisible(true);
    }

    private void deleteSelectedEquipment() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select an equipment item to delete.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long id = (Long) tableModel.getValueAt(selectedRow, 0);
        String name = (String) tableModel.getValueAt(selectedRow, 1);

        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to delete equipment '" + name + "' (ID: " + id + ")?",
                "Confirm Delete", JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            try {
                apiClient.delete("/equipment/" + id);
                JOptionPane.showMessageDialog(this, "Equipment deleted successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                loadEquipment();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                // If active issues exist, displays: "Cannot delete equipment because it is currently issued."
                JOptionPane.showMessageDialog(this, ex.getMessage(), "Cannot Delete Equipment", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
