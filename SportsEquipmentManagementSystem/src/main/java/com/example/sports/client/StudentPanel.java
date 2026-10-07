package com.example.sports.client;

import com.example.sports.entity.Student;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Student Management Panel.
 * Handles student registration, updates, search, and deletion with integrity constraints.
 */
public class StudentPanel extends JPanel {

    private final ApiClient apiClient;
    private final Runnable onDataChanged;

    private final JTextField txtSearch = new JTextField(16);
    private final DefaultTableModel tableModel;
    private final JTable table;
    private List<Student> currentStudentList = new ArrayList<>();

    public StudentPanel(ApiClient apiClient, Runnable onDataChanged) {
        this.apiClient = apiClient;
        this.onDataChanged = onDataChanged;

        setLayout(new BorderLayout(15, 15));
        setBorder(new EmptyBorder(20, 20, 20, 20));
        setBackground(new Color(245, 247, 250));

        // 1. Top Controls Bar
        JPanel topPanel = new JPanel(new BorderLayout(10, 10));
        topPanel.setOpaque(false);

        JLabel title = new JLabel("Registered College Students");
        title.setFont(new Font("Segoe UI", Font.BOLD, 22));
        title.setForeground(new Color(30, 41, 59));

        JPanel filterPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        filterPanel.setOpaque(false);

        JLabel lblSearch = new JLabel("Search Student:");
        lblSearch.setFont(new Font("Segoe UI", Font.PLAIN, 13));

        JButton btnSearch = new JButton("Search");
        btnSearch.setBackground(new Color(241, 245, 249));
        btnSearch.setFocusPainted(false);
        btnSearch.addActionListener(e -> loadStudents());

        JButton btnReset = new JButton("Clear");
        btnReset.setBackground(new Color(241, 245, 249));
        btnReset.setFocusPainted(false);
        btnReset.addActionListener(e -> {
            txtSearch.setText("");
            loadStudents();
        });

        JButton btnAdd = new JButton("+ Register Student");
        btnAdd.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btnAdd.setBackground(new Color(37, 99, 235));
        btnAdd.setForeground(Color.WHITE);
        btnAdd.setFocusPainted(false);
        btnAdd.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btnAdd.addActionListener(e -> showAddDialog());

        filterPanel.add(lblSearch);
        filterPanel.add(txtSearch);
        filterPanel.add(btnSearch);
        filterPanel.add(btnReset);
        filterPanel.add(btnAdd);

        topPanel.add(title, BorderLayout.WEST);
        topPanel.add(filterPanel, BorderLayout.EAST);
        add(topPanel, BorderLayout.NORTH);

        // 2. Center Table
        String[] columns = {"ID", "Full Name", "Email", "Phone", "Department", "Class/Semester"};
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
        table.getColumnModel().getColumn(5).setCellRenderer(center);

        table.getColumnModel().getColumn(0).setPreferredWidth(50);
        table.getColumnModel().getColumn(1).setPreferredWidth(170);
        table.getColumnModel().getColumn(2).setPreferredWidth(210);
        table.getColumnModel().getColumn(3).setPreferredWidth(110);
        table.getColumnModel().getColumn(4).setPreferredWidth(190);
        table.getColumnModel().getColumn(5).setPreferredWidth(110);

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

        JButton btnUpdate = new JButton("Edit Student");
        btnUpdate.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnUpdate.setBackground(new Color(255, 255, 255));
        btnUpdate.setFocusPainted(false);
        btnUpdate.addActionListener(e -> showUpdateDialog());

        JButton btnDelete = new JButton("Delete Student");
        btnDelete.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnDelete.setBackground(new Color(254, 242, 242));
        btnDelete.setForeground(new Color(220, 38, 38));
        btnDelete.setFocusPainted(false);
        btnDelete.addActionListener(e -> deleteSelectedStudent());

        JButton btnRefresh = new JButton("↻ Refresh");
        btnRefresh.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        btnRefresh.setBackground(new Color(255, 255, 255));
        btnRefresh.setFocusPainted(false);
        btnRefresh.addActionListener(e -> loadStudents());

        bottomPanel.add(btnUpdate);
        bottomPanel.add(btnDelete);
        bottomPanel.add(btnRefresh);
        add(bottomPanel, BorderLayout.SOUTH);
    }

    public void loadStudents() {
        String search = txtSearch.getText().trim();
        String endpoint = search.isEmpty() ? "/students" : "/students?search=" + search;

        SwingWorker<List<Student>, Void> worker = new SwingWorker<>() {
            @Override
            protected List<Student> doInBackground() throws Exception {
                return apiClient.getList(endpoint, Student.class);
            }

            @Override
            protected void done() {
                try {
                    currentStudentList = get();
                    tableModel.setRowCount(0);
                    for (Student s : currentStudentList) {
                        tableModel.addRow(new Object[]{
                                s.getId(),
                                s.getFullName(),
                                s.getEmail(),
                                s.getPhone(),
                                s.getDepartment(),
                                s.getClassSemester()
                        });
                    }
                } catch (Exception e) {
                    JOptionPane.showMessageDialog(StudentPanel.this,
                            "Failed to load students: " + e.getMessage(),
                            "Connection Notice", JOptionPane.WARNING_MESSAGE);
                }
            }
        };
        worker.execute();
    }

    private void showAddDialog() {
        JDialog dialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), "Register New Student", true);
        dialog.setSize(440, 360);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(5, 2, 10, 12));
        form.setBorder(new EmptyBorder(20, 20, 10, 20));

        JTextField txtName = new JTextField();
        JTextField txtEmail = new JTextField();
        JTextField txtPhone = new JTextField();
        JTextField txtDept = new JTextField("Computer Science Engineering");
        JTextField txtSem = new JTextField("Semester 2");

        form.add(new JLabel("Full Name: *"));
        form.add(txtName);
        form.add(new JLabel("College Email: *"));
        form.add(txtEmail);
        form.add(new JLabel("Phone Number: *"));
        form.add(txtPhone);
        form.add(new JLabel("Department: *"));
        form.add(txtDept);
        form.add(new JLabel("Class / Semester: *"));
        form.add(txtSem);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 12));
        JButton btnSave = new JButton("Register");
        btnSave.setBackground(new Color(37, 99, 235));
        btnSave.setForeground(Color.WHITE);
        btnSave.setFocusPainted(false);

        JButton btnCancel = new JButton("Cancel");
        btnCancel.addActionListener(e -> dialog.dispose());

        btnSave.addActionListener(e -> {
            String name = txtName.getText().trim();
            String email = txtEmail.getText().trim();
            String phone = txtPhone.getText().trim();
            String dept = txtDept.getText().trim();
            String sem = txtSem.getText().trim();

            if (name.isEmpty() || email.isEmpty() || phone.isEmpty() || dept.isEmpty() || sem.isEmpty()) {
                JOptionPane.showMessageDialog(dialog, "All fields are required.", "Validation Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            Student s = new Student(name, email, phone, dept, sem);
            try {
                apiClient.post("/students", s, Student.class);
                JOptionPane.showMessageDialog(dialog, "Student registered successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                dialog.dispose();
                loadStudents();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, ex.getMessage(), "Registration Error", JOptionPane.ERROR_MESSAGE);
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
            JOptionPane.showMessageDialog(this, "Please select a student to edit.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long id = (Long) tableModel.getValueAt(selectedRow, 0);
        Student current = currentStudentList.stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (current == null) return;

        JDialog dialog = new JDialog((Frame) SwingUtilities.getWindowAncestor(this), "Edit Student (ID: " + id + ")", true);
        dialog.setSize(440, 360);
        dialog.setLocationRelativeTo(this);
        dialog.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(5, 2, 10, 12));
        form.setBorder(new EmptyBorder(20, 20, 10, 20));

        JTextField txtName = new JTextField(current.getFullName());
        JTextField txtEmail = new JTextField(current.getEmail());
        JTextField txtPhone = new JTextField(current.getPhone());
        JTextField txtDept = new JTextField(current.getDepartment());
        JTextField txtSem = new JTextField(current.getClassSemester());

        form.add(new JLabel("Full Name: *"));
        form.add(txtName);
        form.add(new JLabel("College Email: *"));
        form.add(txtEmail);
        form.add(new JLabel("Phone Number: *"));
        form.add(txtPhone);
        form.add(new JLabel("Department: *"));
        form.add(txtDept);
        form.add(new JLabel("Class / Semester: *"));
        form.add(txtSem);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 12));
        JButton btnSave = new JButton("Update");
        btnSave.setBackground(new Color(37, 99, 235));
        btnSave.setForeground(Color.WHITE);
        btnSave.setFocusPainted(false);

        JButton btnCancel = new JButton("Cancel");
        btnCancel.addActionListener(e -> dialog.dispose());

        btnSave.addActionListener(e -> {
            String name = txtName.getText().trim();
            String email = txtEmail.getText().trim();
            String phone = txtPhone.getText().trim();
            String dept = txtDept.getText().trim();
            String sem = txtSem.getText().trim();

            if (name.isEmpty() || email.isEmpty() || phone.isEmpty() || dept.isEmpty() || sem.isEmpty()) {
                JOptionPane.showMessageDialog(dialog, "All fields are required.", "Validation Error", JOptionPane.ERROR_MESSAGE);
                return;
            }

            Student updated = new Student(name, email, phone, dept, sem);
            try {
                apiClient.put("/students/" + id, updated, Student.class);
                JOptionPane.showMessageDialog(dialog, "Student updated successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                dialog.dispose();
                loadStudents();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(dialog, ex.getMessage(), "Update Error", JOptionPane.ERROR_MESSAGE);
            }
        });

        btnPanel.add(btnCancel);
        btnPanel.add(btnSave);

        dialog.add(form, BorderLayout.CENTER);
        dialog.add(btnPanel, BorderLayout.SOUTH);
        dialog.setVisible(true);
    }

    private void deleteSelectedStudent() {
        int selectedRow = table.getSelectedRow();
        if (selectedRow < 0) {
            JOptionPane.showMessageDialog(this, "Please select a student to delete.", "Selection Required", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        Long id = (Long) tableModel.getValueAt(selectedRow, 0);
        String name = (String) tableModel.getValueAt(selectedRow, 1);

        int confirm = JOptionPane.showConfirmDialog(this,
                "Are you sure you want to delete student '" + name + "' (ID: " + id + ")?",
                "Confirm Delete", JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE);

        if (confirm == JOptionPane.YES_OPTION) {
            try {
                apiClient.delete("/students/" + id);
                JOptionPane.showMessageDialog(this, "Student deleted successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                loadStudents();
                if (onDataChanged != null) onDataChanged.run();
            } catch (Exception ex) {
                // If student has active issues, shows: "Cannot delete student with active issues."
                JOptionPane.showMessageDialog(this, ex.getMessage(), "Cannot Delete Student", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
