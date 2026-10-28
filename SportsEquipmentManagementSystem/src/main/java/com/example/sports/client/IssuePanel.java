package com.example.sports.client;

import com.example.sports.dto.IssueRequest;
import com.example.sports.entity.Equipment;
import com.example.sports.entity.Issue;
import com.example.sports.entity.Student;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Issue & Return Management Panel.
 * Handles issuing equipment to students, returning active borrowed gear,
 * and tracking/settling overdue fines (₹5/day).
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
    private final JTextField txtExpectedReturnDate = new JTextField(LocalDate.now().plusDays(7).format(DateTimeFormatter.ISO_LOCAL_DATE), 10);
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

        JLabel formTitle = new JLabel("Issue Equipment to Student (Late return fine: ₹5/day after due date)");
        formTitle.setFont(new Font("Segoe UI", Font.BOLD, 16));
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
        pReq.add(new JLabel("Quantity: *"), BorderLayout.NORTH);
        pReq.add(spQuantity, BorderLayout.CENTER);

        pQty.add(pAvail);
        pQty.add(pReq);

        // Column 4: Issue Date & Due Date
        JPanel pDates = new JPanel(new GridLayout(1, 2, 8, 0));
        pDates.setOpaque(false);

        JPanel pDate = new JPanel(new BorderLayout(4, 4));
        pDate.setOpaque(false);
        pDate.add(new JLabel("Issue Date:"), BorderLayout.NORTH);
        pDate.add(txtIssueDate, BorderLayout.CENTER);

        JPanel pDueDate = new JPanel(new BorderLayout(4, 4));
        pDueDate.setOpaque(false);
        pDueDate.add(new JLabel("Due Date:"), BorderLayout.NORTH);
        pDueDate.add(txtExpectedReturnDate, BorderLayout.CENTER);

        pDates.add(pDate);
        pDates.add(pDueDate);

        // Column 5: Fine info note
        JPanel pFineNotice = new JPanel(new BorderLayout(4, 4));
        pFineNotice.setOpaque(false);
        JLabel lblFineNote = new JLabel("<html><font color='#dc2626'><b>Overdue Fine Policy:</b></font><br>₹5 per day late automatically charged on overdue returns.</html>");
        lblFineNote.setFont(new Font("Segoe UI", Font.PLAIN, 11));
        pFineNotice.add(lblFineNote, BorderLayout.CENTER);

        // Column 6: Action Button
        JPanel pAction = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 18));
        pAction.setOpaque(false);
        btnIssue.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnIssue.setBackground(new Color(37, 99, 235));
        btnIssue.setForeground(Color.WHITE);
        btnIssue.setFocusPainted(false);
        btnIssue.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnIssue.setPreferredSize(new Dimension(170, 36));
        btnIssue.addActionListener(e -> handleIssueEquipment());
        pAction.add(btnIssue);

        grid.add(pStudent);
        grid.add(pEquip);
        grid.add(pQty);
        grid.add(pDates);
        grid.add(pFineNotice);
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
        JLabel tableTitle = new JLabel("Currently Borrowed Equipment & Fine Tracking");
        tableTitle.setFont(new Font("Segoe UI", Font.BOLD, 17));
        tableTitle.setForeground(new Color(30, 41, 59));

        JPanel tableBtnGroup = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        tableBtnGroup.setOpaque(false);

        JButton btnPayFine = new JButton("💳 Pay Fine");
        btnPayFine.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnPayFine.setBackground(new Color(245, 158, 11));
        btnPayFine.setForeground(Color.WHITE);
        btnPayFine.setFocusPainted(false);
        btnPayFine.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnPayFine.addActionListener(e -> handlePayFine());

        JButton btnReturn = new JButton("↩ Return Equipment");
        btnReturn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnReturn.setBackground(new Color(16, 185, 129));
        btnReturn.setForeground(Color.WHITE);
        btnReturn.setFocusPainted(false);
        btnReturn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnReturn.addActionListener(e -> handleReturnEquipment());

        tableBtnGroup.add(btnPayFine);
        tableBtnGroup.add(btnReturn);

        tableHeader.add(tableTitle, BorderLayout.WEST);
        tableHeader.add(tableBtnGroup, BorderLayout.EAST);
        tableContainer.add(tableHeader, BorderLayout.NORTH);

        String[] columns = {"Issue ID", "Student Name", "Equipment", "Quantity", "Issue Date", "Due Date", "Status", "Fine Status (₹5/day)"};
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
        table.getColumnModel().getColumn(6).setCellRenderer(center);
        table.getColumnModel().getColumn(7).setCellRenderer(center);

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
        // Load Students and Equipment to populate dropdowns, and all active issues
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
                    get();

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

                    // Populate active issues table with fine info
                    currentActiveIssues = activeIssues;
                    tableModel.setRowCount(0);
                    for (Issue issue : activeIssues) {
                        String fineStatus = "No Fine";
                        if (issue.getExpectedReturnDate() != null) {
                            long daysLate = ChronoUnit.DAYS.between(issue.getExpectedReturnDate(), LocalDate.now());
                            if (daysLate > 0) {
                                double fine = daysLate * 5.0;
                                fineStatus = "⚠️ Overdue (" + daysLate + "d late: ₹" + fine + ")";
                            }
                        }

                        tableModel.addRow(new Object[]{
                                issue.getId(),
                                issue.getStudent() != null ? issue.getStudent().getFullName() : "-",
                                issue.getEquipment() != null ? issue.getEquipment().getName() : "-",
                                issue.getQuantity(),
                                issue.getIssueDate(),
                                issue.getExpectedReturnDate() != null ? issue.getExpectedReturnDate() : "-",
                                issue.getStatus(),
                                fineStatus
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
        LocalDate expectedReturnDate;
        try {
            issueDate = LocalDate.parse(txtIssueDate.getText().trim());
            expectedReturnDate = LocalDate.parse(txtExpectedReturnDate.getText().trim());
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Please enter valid dates in YYYY-MM-DD format.", "Invalid Date", JOptionPane.ERROR_MESSAGE);
            return;
        }

        if (expectedReturnDate.isBefore(issueDate)) {
            JOptionPane.showMessageDialog(this, "Due date cannot be earlier than issue date.", "Invalid Due Date", JOptionPane.ERROR_MESSAGE);
            return;
        }

        IssueRequest request = new IssueRequest(studentItem.student.getId(), equipItem.equipment.getId(), qty, issueDate, expectedReturnDate);

        try {
            apiClient.post("/issues", request, Issue.class);
            JOptionPane.showMessageDialog(this, "Equipment issued successfully.\nDue date set: " + expectedReturnDate + "\nLate fine policy: ₹5/day after due date.", "Success", JOptionPane.INFORMATION_MESSAGE);
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
        String dueDateStr = String.valueOf(tableModel.getValueAt(selectedRow, 5));

        // Calculate potential overdue fine
        double potentialFine = 0.0;
        long daysDelayed = 0;
        try {
            LocalDate due = LocalDate.parse(dueDateStr);
            if (LocalDate.now().isAfter(due)) {
                daysDelayed = ChronoUnit.DAYS.between(due, LocalDate.now());
                potentialFine = daysDelayed * 5.0;
            }
        } catch (Exception ignored) {}

        String message = "Are you sure you want to return this equipment?\n\n" +
                "Student: " + studentName + "\n" +
                "Equipment: " + equipmentName + " (" + qty + " units)\n" +
                "Due Date: " + dueDateStr + "\n";

        if (potentialFine > 0) {
            message += "\n⚠️ LATE RETURN ALERT:\n" +
                    daysDelayed + " days overdue!\n" +
                    "Calculated Fine: ₹" + String.format("%.2f", potentialFine) + " (at ₹5 per day)\n";
        }

        int confirm = JOptionPane.showConfirmDialog(this, message, "Confirm Equipment Return", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            try {
                Issue returned = apiClient.put("/issues/" + issueId + "/return", null, Issue.class);
                String resultMsg = "Equipment returned successfully. Inventory stock has been restored.";
                if (returned != null && returned.getFineAmount() != null && returned.getFineAmount() > 0) {
                    resultMsg += "\n\n⚠️ Late fine of ₹" + returned.getFineAmount() + " recorded against " + studentName + ".\nPlease collect fine payment.";
                }
                JOptionPane.showMessageDialog(this, resultMsg, "Return Processed", JOptionPane.INFORMATION_MESSAGE);
                loadData();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception e) {
                JOptionPane.showMessageDialog(this, e.getMessage(), "Return Failed", JOptionPane.ERROR_MESSAGE);
            }
        }
    }

    private void handlePayFine() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select an issue record to pay / settle fine.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long issueId = (Long) tableModel.getValueAt(selectedRow, 0);
        String studentName = (String) tableModel.getValueAt(selectedRow, 1);
        String fineCol = String.valueOf(tableModel.getValueAt(selectedRow, 7));

        int confirm = JOptionPane.showConfirmDialog(this,
                "Settle fine for:\nStudent: " + studentName + "\nStatus: " + fineCol + "\n\nMark fine as PAID?",
                "Settle Late Fine", JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            try {
                apiClient.put("/issues/" + issueId + "/pay-fine", null, Issue.class);
                JOptionPane.showMessageDialog(this, "Fine marked as PAID successfully.", "Fine Settled", JOptionPane.INFORMATION_MESSAGE);
                loadData();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception e) {
                JOptionPane.showMessageDialog(this, e.getMessage(), "Error Settling Fine", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
