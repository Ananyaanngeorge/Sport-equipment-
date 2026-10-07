package com.example.sports.client;

import com.example.sports.dto.IssueRequest;
import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import com.example.sports.entity.Student;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.border.TitledBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Issue & Return Management Panel.
 * Handles issuing equipment to students and returning active borrowed gear.
 */
public class IssuePanel extends JPanel {

    private final ApiClient apiClient;
    private final Runnable onDataChanged;

    // Issue Form Components
    private final JComboBox<StudentItem> cmbStudents = new JComboBox<>();
    private final JComboBox<EquipmentItem> cmbEquipment = new JComboBox<>();
    private final JLabel lblAvailableQty = new JLabel("0");
    private final JSpinner spQuantity = new JSpinner(new SpinnerNumberModel(1, 1, 500, 1));
    private final JTextField txtIssueDate = new JTextField(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE), 10);
    private final JButton btnIssue = new JButton("Issue Equipment");

    // Active Issues Table
    private final DefaultTableModel tableModel;
    private final JTable table;
    private List<Issue> currentActiveIssues = new ArrayList<>();

    // Wrapper helper classes for JComboBox display
    public static class StudentItem {
        final Student student;
        public StudentItem(Student student) { this.student = student; }
        @Override
        public String toString() {
            return student.getFullName() + " (" + student.getEmail() + " - " + student.getDepartment() + ")";
        }
    }

    public static class EquipmentItem {
        final Equipment equipment;
        public EquipmentItem(Equipment equipment) { this.equipment = equipment; }
        @Override
        public String toString() {
            return equipment.getName() + " [" + equipment.getCategory() + "] - Avail: " + equipment.getAvailableQuantity();
        }
    }

    public IssuePanel(ApiClient apiClient, Runnable onDataChanged) {
        this.apiClient = apiClient;
        this.onDataChanged = onDataChanged;

        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(new Color(245, 247, 250));

        // 1. Top Section: Issue Equipment Form Box
        JPanel issueFormBox = new JPanel(new BorderLayout(10, 10));
        issueFormBox.setBackground(Color.WHITE);
        issueFormBox.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(16, 20, 16, 20)
        ));

        JLabel formTitle = new JLabel("Issue Equipment to Student");
        formTitle.setFont(new Font("Segoe UI", Font.BOLD, 17));
        formTitle.setForeground(new Color(30, 41, 59));
        issueFormBox.add(formTitle, BorderLayout.NORTH);

        JPanel grid = new JPanel(new GridLayout(2, 3, 16, 12));
        grid.setOpaque(false);

        // Column 1: Student
        JPanel pStudent = new JPanel(new BorderLayout(4, 4));
        pStudent.setOpaque(false);
        pStudent.add(new JLabel("Select Student: *"), BorderLayout.NORTH);
        pStudent.add(cmbStudents, BorderLayout.CENTER);

        // Column 2: Equipment
        JPanel pEquip = new JPanel(new BorderLayout(4, 4));
        pEquip.setOpaque(false);
        pEquip.add(new JLabel("Select Equipment: *"), BorderLayout.NORTH);
        pEquip.add(cmbEquipment, BorderLayout.CENTER);

        // Column 3: Available & Qty
        JPanel pQty = new JPanel(new GridLayout(1, 2, 8, 0));
        pQty.setOpaque(false);

        JPanel pAvail = new JPanel(new BorderLayout(4, 4));
        pAvail.setOpaque(false);
        pAvail.add(new JLabel("Stock Available:"), BorderLayout.NORTH);
        lblAvailableQty.setFont(new Font("Segoe UI", Font.BOLD, 16));
        lblAvailableQty.setForeground(new Color(16, 185, 129));
        pAvail.add(lblAvailableQty, BorderLayout.CENTER);

        JPanel pReq = new JPanel(new BorderLayout(4, 4));
        pReq.setOpaque(false);
        pReq.add(new JLabel("Quantity to Issue: *"), BorderLayout.NORTH);
        pReq.add(spQuantity, BorderLayout.CENTER);

        pQty.add(pAvail);
        pQty.add(pReq);

        // Column 4: Issue Date
        JPanel pDate = new JPanel(new BorderLayout(4, 4));
        pDate.setOpaque(false);
        pDate.add(new JLabel("Issue Date (YYYY-MM-DD):"), BorderLayout.NORTH);
        pDate.add(txtIssueDate, BorderLayout.CENTER);

        // Column 5 & 6: Action Button
        JPanel pAction = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 18));
        pAction.setOpaque(false);
        btnIssue.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnIssue.setBackground(new Color(37, 99, 235));
        btnIssue.setForeground(Color.WHITE);
        btnIssue.setFocusPainted(false);
        btnIssue.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnIssue.setPreferredSize(new Dimension(180, 36));
        btnIssue.addActionListener(e -> handleIssueEquipment());
        pAction.add(btnIssue);

        grid.add(pStudent);
        grid.add(pEquip);
        grid.add(pQty);
        grid.add(pDate);
        grid.add(pAction);

        issueFormBox.add(grid, BorderLayout.CENTER);
        add(issueFormBox, BorderLayout.NORTH);

        // Automatically update available quantity label when selected equipment changes
        cmbEquipment.addActionListener(e -> updateAvailableQuantityLabel());

        // 2. Center: Active Issues Table
        JPanel tableContainer = new JPanel(new BorderLayout(10, 10));
        tableContainer.setBackground(Color.WHITE);
        tableContainer.setBorder(BorderFactory.createCompoundBorder(
                new LineBorder(new Color(226, 232, 240), 1, true),
                new EmptyBorder(16, 20, 16, 20)
        ));

        JPanel tableHeader = new JPanel(new BorderLayout());
        tableHeader.setOpaque(false);
        JLabel tableTitle = new JLabel("Currently Borrowed Equipment (Active Issues)");
        tableTitle.setFont(new Font("Segoe UI", Font.BOLD, 17));
        tableTitle.setForeground(new Color(30, 41, 59));

        JButton btnReturn = new JButton("↩ Return Equipment");
        btnReturn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnReturn.setBackground(new Color(16, 185, 129));
        btnReturn.setForeground(Color.WHITE);
        btnReturn.setFocusPainted(false);
        btnReturn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnReturn.addActionListener(e -> handleReturnEquipment());

        tableHeader.add(tableTitle, BorderLayout.WEST);
        tableHeader.add(btnReturn, BorderLayout.EAST);
        tableContainer.add(tableHeader, BorderLayout.NORTH);

        String[] columns = {"Issue ID", "Student Name", "Equipment", "Quantity", "Issue Date", "Status"};
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
        table.getColumnModel().getColumn(3).setCellRenderer(center);
        table.getColumnModel().getColumn(4).setCellRenderer(center);
        table.getColumnModel().getColumn(5).setCellRenderer(center);

        JScrollPane scrollPane = new JScrollPane(table);
        scrollPane.setBorder(BorderFactory.createLineBorder(new Color(241, 245, 249)));
        scrollPane.getViewport().setBackground(Color.WHITE);
        tableContainer.add(scrollPane, BorderLayout.CENTER);

        add(tableContainer, BorderLayout.CENTER);
    }

    private void updateAvailableQuantityLabel() {
        EquipmentItem item = (EquipmentItem) cmbEquipment.getSelectedItem();
        if (item != null && item.equipment != null) {
            int avail = item.equipment.getAvailableQuantity();
            lblAvailableQty.setText(String.valueOf(avail));
            if (avail <= 0) {
                lblAvailableQty.setForeground(new Color(239, 68, 68));
            } else {
                lblAvailableQty.setForeground(new Color(16, 185, 129));
            }
        } else {
            lblAvailableQty.setText("0");
        }
    }

    public void loadData() {
        // Load Students and Equipment to populate dropdowns, and active issues for table
        SwingWorker<Void, Void> worker = new SwingWorker<>() {
            List<Student> students;
            List<Equipment> equipment;
            List<Issue> activeIssues;

            @Override
            protected Void doInBackground() throws Exception {
                students = apiClient.getList("/students", Student.class);
                equipment = apiClient.getList("/equipment", Equipment.class);
                activeIssues = apiClient.getList("/issues/active", Issue.class);
                return null;
            }

            @Override
            protected void done() {
                try {
                    get(); // Check for exceptions

                    // Populate students dropdown
                    cmbStudents.removeAllItems();
                    for (Student s : students) {
                        cmbStudents.addItem(new StudentItem(s));
                    }

                    // Populate equipment dropdown
                    cmbEquipment.removeAllItems();
                    for (Equipment eq : equipment) {
                        cmbEquipment.addItem(new EquipmentItem(eq));
                    }
                    updateAvailableQuantityLabel();

                    // Populate active issues table
                    currentActiveIssues = activeIssues;
                    tableModel.setRowCount(0);
                    for (Issue issue : activeIssues) {
                        tableModel.addRow(new Object[]{
                                issue.getId(),
                                issue.getStudent() != null ? issue.getStudent().getFullName() : "-",
                                issue.getEquipment() != null ? issue.getEquipment().getName() : "-",
                                issue.getQuantity(),
                                issue.getIssueDate(),
                                issue.getStatus()
                        });
                    }
                } catch (Exception e) {
                    System.err.println("IssuePanel sync error: " + e.getMessage());
                }
            }
        };
        worker.execute();
    }

    private void handleIssueEquipment() {
        StudentItem studentItem = (StudentItem) cmbStudents.getSelectedItem();
        EquipmentItem equipItem = (EquipmentItem) cmbEquipment.getSelectedItem();

        if (studentItem == null) {
            JOptionPane.showMessageDialog(this, "Please select a registered student.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }
        if (equipItem == null) {
            JOptionPane.showMessageDialog(this, "Please select an equipment item.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        int qty = (Integer) spQuantity.getValue();
        if (qty <= 0) {
            JOptionPane.showMessageDialog(this, "Quantity must be greater than zero.", "Validation Error", JOptionPane.ERROR_MESSAGE);
            return;
        }

        if (qty > equipItem.equipment.getAvailableQuantity()) {
            JOptionPane.showMessageDialog(this, "Insufficient equipment available. Available: " +
                    equipItem.equipment.getAvailableQuantity() + ", Requested: " + qty, "Insufficient Stock", JOptionPane.ERROR_MESSAGE);
            return;
        }

        LocalDate issueDate;
        try {
            issueDate = LocalDate.parse(txtIssueDate.getText().trim());
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Please enter a valid date in YYYY-MM-DD format.", "Invalid Date", JOptionPane.ERROR_MESSAGE);
            return;
        }

        IssueRequest request = new IssueRequest(studentItem.student.getId(), equipItem.equipment.getId(), qty, issueDate);

        try {
            apiClient.post("/issues", request, Issue.class);
            JOptionPane.showMessageDialog(this, "Equipment issued successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
            loadData();
            if (onDataChanged != null) onDataChanged.run();
        } catch (Exception e) {
            JOptionPane.showMessageDialog(this, e.getMessage(), "Issue Failed", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void handleReturnEquipment() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select an active issue record to return.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long issueId = (Long) tableModel.getValueAt(selectedRow, 0);
        String studentName = (String) tableModel.getValueAt(selectedRow, 1);
        String equipmentName = (String) tableModel.getValueAt(selectedRow, 2);
        int qty = (Integer) tableModel.getValueAt(selectedRow, 3);

        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to return this equipment?\n" +
                        "Student: " + studentName + "\n" +
                        "Equipment: " + equipmentName + " (" + qty + " units)",
                "Confirm Return", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            try {
                apiClient.put("/issues/" + issueId + "/return", null, Issue.class);
                JOptionPane.showMessageDialog(this, "Equipment returned successfully. Inventory updated.", "Success", JOptionPane.INFORMATION_MESSAGE);
                loadData();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception e) {
                JOptionPane.showMessageDialog(this, e.getMessage(), "Return Failed", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
