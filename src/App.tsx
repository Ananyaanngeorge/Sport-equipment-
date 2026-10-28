/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Dumbbell,
  GraduationCap,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Plus,
  Trash2,
  Filter,
  Grid,
  List,
  CheckCircle2,
  Clock,
  Pencil,
  IndianRupee,
  Receipt,
  Coins,
  AlertTriangle,
  Sliders,
  History,
  Check,
  Printer,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

// Overdue Fine Rate: ₹5 per day late
export const FINE_PER_DAY = 5;

// Data Interfaces
export interface EquipmentItem {
  id: number;
  name: string;
  category: 'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other';
  totalQuantity: number;
  availableQuantity: number;
  description: string;
}

export interface StudentItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  classSemester: string;
}

export interface IssueItem {
  id: number;
  studentId: number;
  studentName: string;
  equipmentId: number;
  equipmentName: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate: string; // Due date
  returnDate?: string | null;  // Actual return date
  status: 'ISSUED' | 'RETURNED';
  fineAmount?: number;         // ₹5/day
  finePaid?: boolean;          // Payment status
  fineWaived?: boolean;        // Admin waiver
}

export interface FineReceipt {
  receiptId: string;
  issueId: number;
  studentName: string;
  studentDept: string;
  equipmentName: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate: string;
  returnDate: string;
  daysOverdue: number;
  fineAmount: number;
  paidAt: string;
  paymentMethod: 'CASH_DESK' | 'UPI' | 'COLLEGE_CARD';
}

// Initial catalog data for first-time launch
const DEFAULT_EQUIPMENT: EquipmentItem[] = [
  { id: 1, name: 'Football (Match Ball)', category: 'Outdoor', totalQuantity: 15, availableQuantity: 13, description: 'FIFA standard size 5 match footballs for college tournaments.' },
  { id: 2, name: 'Basketball (Spalding)', category: 'Outdoor', totalQuantity: 12, availableQuantity: 11, description: 'Composite leather official regulation basketballs.' },
  { id: 3, name: 'Volleyball (Mikasa)', category: 'Outdoor', totalQuantity: 10, availableQuantity: 10, description: 'Soft-touch competition volleyballs for court and sand.' },
  { id: 4, name: 'Badminton Racket (Yonex)', category: 'Indoor', totalQuantity: 20, availableQuantity: 18, description: 'Carbon fiber lightweight tournament badminton rackets.' },
  { id: 5, name: 'Cricket Bat (English Willow)', category: 'Outdoor', totalQuantity: 8, availableQuantity: 8, description: 'Full-size grade A English willow bats for college team.' },
  { id: 6, name: 'Yoga / Fitness Mat', category: 'Fitness', totalQuantity: 25, availableQuantity: 25, description: '6mm high-density non-slip exercise mats.' },
  { id: 7, name: 'Table Tennis Paddle (Stiga)', category: 'Indoor', totalQuantity: 16, availableQuantity: 16, description: 'Professional ITTF approved rubber paddles with edge guard.' },
  { id: 8, name: 'Competition Javelin (800g)', category: 'Athletics', totalQuantity: 6, availableQuantity: 6, description: 'Competition aluminum IAAF certified javelins.' }
];

const DEFAULT_STUDENTS: StudentItem[] = [
  { id: 1, fullName: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', phone: '9876543210', department: 'Computer Science & Engineering', classSemester: 'Semester 4' },
  { id: 2, fullName: 'Diya Patel', email: 'diya.patel@campus.edu', phone: '9876543211', department: 'Information Technology', classSemester: 'Semester 2' },
  { id: 3, fullName: 'Rohan Verma', email: 'rohan.verma@campus.edu', phone: '9876543212', department: 'Mechanical Engineering', classSemester: 'Semester 6' },
  { id: 4, fullName: 'Sneha Reddy', email: 'sneha.reddy@campus.edu', phone: '9876543213', department: 'Electronics & Communication', classSemester: 'Semester 4' }
];

const DEFAULT_ISSUES: IssueItem[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Aarav Sharma',
    equipmentId: 1,
    equipmentName: 'Football (Match Ball)',
    quantity: 2,
    issueDate: '2026-10-10',
    expectedReturnDate: '2026-10-17', // Overdue loan
    status: 'ISSUED',
    fineAmount: 55, // 11 days overdue * ₹5 = ₹55
    finePaid: false
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Diya Patel',
    equipmentId: 4,
    equipmentName: 'Badminton Racket (Yonex)',
    quantity: 2,
    issueDate: '2026-10-25',
    expectedReturnDate: '2026-11-01',
    status: 'ISSUED',
    fineAmount: 0,
    finePaid: false
  },
  {
    id: 3,
    studentId: 3,
    studentName: 'Rohan Verma',
    equipmentId: 2,
    equipmentName: 'Basketball (Spalding)',
    quantity: 1,
    issueDate: '2026-10-01',
    expectedReturnDate: '2026-10-08',
    returnDate: '2026-10-11',
    status: 'RETURNED',
    fineAmount: 15, // Returned 3 days late
    finePaid: true
  }
];

// Helper: Calculate days overdue
function calculateDaysOverdue(expectedReturnDate: string, returnDate?: string | null): number {
  if (!expectedReturnDate) return 0;
  const due = new Date(expectedReturnDate);
  const ref = returnDate ? new Date(returnDate) : new Date();
  const dueTime = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const refTime = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const diffDays = Math.ceil((refTime - dueTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper: Compute fine amount (₹5 per day delay)
function computeIssueFine(issue: IssueItem, customReturnDate?: string): number {
  if (issue.fineWaived) return 0;
  if (issue.status === 'RETURNED' && issue.fineAmount !== undefined) {
    return issue.fineAmount;
  }
  const days = calculateDaysOverdue(issue.expectedReturnDate, customReturnDate || issue.returnDate);
  return days * FINE_PER_DAY;
}

// Helper: Add days to date
function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

export default function App() {
  // Navigation
  const [activePage, setActivePage] = useState<'dashboard' | 'equipment' | 'students' | 'issue' | 'return' | 'fines'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Persistence in localStorage
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('sports_equipment_list');
      return saved ? JSON.parse(saved) : DEFAULT_EQUIPMENT;
    } catch {
      return DEFAULT_EQUIPMENT;
    }
  });

  const [studentList, setStudentList] = useState<StudentItem[]>(() => {
    try {
      const saved = localStorage.getItem('sports_student_list');
      return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
    } catch {
      return DEFAULT_STUDENTS;
    }
  });

  const [issueList, setIssueList] = useState<IssueItem[]>(() => {
    try {
      const saved = localStorage.getItem('sports_issue_list');
      return saved ? JSON.parse(saved) : DEFAULT_ISSUES;
    } catch {
      return DEFAULT_ISSUES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sports_equipment_list', JSON.stringify(equipmentList));
    } catch {}
  }, [equipmentList]);

  useEffect(() => {
    try {
      localStorage.setItem('sports_student_list', JSON.stringify(studentList));
    } catch {}
  }, [studentList]);

  useEffect(() => {
    try {
      localStorage.setItem('sports_issue_list', JSON.stringify(issueList));
    } catch {}
  }, [issueList]);

  // View modes
  const [equipViewMode, setEquipViewMode] = useState<'table' | 'cards'>('cards');
  const [studentViewMode, setStudentViewMode] = useState<'table' | 'cards'>('cards');

  // Search & Filter
  const [equipCategoryFilter, setEquipCategoryFilter] = useState<string>('All');
  const [equipSearchQuery, setEquipSearchQuery] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [returnSearchQuery, setReturnSearchQuery] = useState<string>('');
  const [returnStatusFilter, setReturnStatusFilter] = useState<'ALL' | 'ISSUED' | 'RETURNED'>('ISSUED');

  // Fine section state
  const [fineViewRole, setFineViewRole] = useState<'admin' | 'student'>('admin');
  const [fineStatusFilter, setFineStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PAID' | 'WAIVED'>('ALL');
  const [fineSearchQuery, setFineSearchQuery] = useState<string>('');
  const [selectedStudentForFineView, setSelectedStudentForFineView] = useState<number>(1);
  const [payingFineIssue, setPayingFineIssue] = useState<IssueItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_DESK' | 'UPI' | 'COLLEGE_CARD'>('UPI');
  const [activeReceipt, setActiveReceipt] = useState<FineReceipt | null>(null);

  // Modals
  const [isAddEquipModalOpen, setIsAddEquipModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<EquipmentItem | null>(null);
  const [viewingStudentHistory, setViewingStudentHistory] = useState<StudentItem | null>(null);

  // Equipment Form & Edit State
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other'>('Outdoor');
  const [newEquipQuantity, setNewEquipQuantity] = useState(10);
  const [newEquipDesc, setNewEquipDesc] = useState('');

  const [editEquipName, setEditEquipName] = useState('');
  const [editEquipCategory, setEditEquipCategory] = useState<'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other'>('Outdoor');
  const [editEquipTotalQty, setEditEquipTotalQty] = useState(10);
  const [editEquipAvailQty, setEditEquipAvailQty] = useState(10);
  const [editEquipDesc, setEditEquipDesc] = useState('');

  // Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentDept, setNewStudentDept] = useState('Computer Science & Engineering');
  const [newStudentSem, setNewStudentSem] = useState('Semester 4');

  // Issue Form
  const [issueStudentId, setIssueStudentId] = useState<number>(studentList[0]?.id || 1);
  const [issueEquipId, setIssueEquipId] = useState<number>(equipmentList[0]?.id || 1);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [issueExpectedReturnDate, setIssueExpectedReturnDate] = useState<string>(
    addDays(new Date().toISOString().split('T')[0], 7)
  );

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Derived Metrics
  const totalTypes = equipmentList.length;
  const totalQuantity = equipmentList.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const availableQuantity = equipmentList.reduce((acc, curr) => acc + curr.availableQuantity, 0);
  const activeLoans = issueList.filter(i => i.status === 'ISSUED');
  const currentlyIssued = activeLoans.reduce((acc, curr) => acc + curr.quantity, 0);
  const overdueActiveLoans = activeLoans.filter(i => calculateDaysOverdue(i.expectedReturnDate) > 0);

  const totalFineIncurred = issueList.reduce((acc, curr) => {
    if (curr.fineWaived) return acc;
    if (curr.status === 'RETURNED' && curr.fineAmount !== undefined) {
      return acc + curr.fineAmount;
    }
    return acc + computeIssueFine(curr);
  }, 0);

  const totalFineCollected = issueList.reduce((acc, curr) => {
    return acc + (curr.finePaid ? (curr.fineAmount || 0) : 0);
  }, 0);

  const totalFinePending = issueList.reduce((acc, curr) => {
    if (curr.fineWaived || curr.finePaid) return acc;
    return acc + computeIssueFine(curr);
  }, 0);

  const selectedEquipForIssue = equipmentList.find(e => e.id === Number(issueEquipId)) || equipmentList[0];

  // Equipment Actions
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipName.trim()) {
      showToast('Equipment name cannot be empty.', 'error');
      return;
    }
    if (newEquipQuantity <= 0) {
      showToast('Quantity must be greater than zero.', 'error');
      return;
    }

    const newId = equipmentList.length > 0 ? Math.max(...equipmentList.map(eq => eq.id)) + 1 : 1;
    const item: EquipmentItem = {
      id: newId,
      name: newEquipName.trim(),
      category: newEquipCategory,
      totalQuantity: Number(newEquipQuantity),
      availableQuantity: Number(newEquipQuantity),
      description: newEquipDesc.trim()
    };

    setEquipmentList([...equipmentList, item]);
    setNewEquipName('');
    setNewEquipDesc('');
    setNewEquipQuantity(10);
    setIsAddEquipModalOpen(false);
    showToast(`Added '${item.name}' with ${item.totalQuantity} units in stock.`, 'success');
  };

  const handleOpenEditEquip = (equip: EquipmentItem) => {
    setEditingEquip(equip);
    setEditEquipName(equip.name);
    setEditEquipCategory(equip.category);
    setEditEquipTotalQty(equip.totalQuantity);
    setEditEquipAvailQty(equip.availableQuantity);
    setEditEquipDesc(equip.description || '');
  };

  const adjustEditTotal = (delta: number) => {
    if (!editingEquip) return;
    const currentlyBorrowed = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const minTotal = Math.max(1, currentlyBorrowed);
    const nextTotal = Math.max(minTotal, editEquipTotalQty + delta);
    const diff = nextTotal - editEquipTotalQty;
    setEditEquipTotalQty(nextTotal);

    if (diff > 0) {
      setEditEquipAvailQty(prev => prev + diff);
    } else {
      const maxAvail = Math.max(0, nextTotal - currentlyBorrowed);
      setEditEquipAvailQty(prev => Math.min(prev, maxAvail));
    }
  };

  const adjustEditAvail = (delta: number) => {
    if (!editingEquip) return;
    const currentlyBorrowed = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const nextAvail = Math.max(0, editEquipAvailQty + delta);
    setEditEquipAvailQty(nextAvail);

    if (nextAvail + currentlyBorrowed > editEquipTotalQty) {
      setEditEquipTotalQty(nextAvail + currentlyBorrowed);
    }
  };

  const adjustBothTotalAndAvail = (delta: number) => {
    if (!editingEquip) return;
    const currentlyBorrowed = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const nextTotal = Math.max(currentlyBorrowed || 1, editEquipTotalQty + delta);
    const nextAvail = Math.max(0, editEquipAvailQty + delta);
    setEditEquipTotalQty(nextTotal);
    setEditEquipAvailQty(nextAvail);
  };

  const handleSaveEditEquip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquip) return;
    if (!editEquipName.trim()) {
      showToast('Equipment name cannot be empty.', 'error');
      return;
    }
    const currentlyBorrowed = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    let finalTotal = parseInt(String(editEquipTotalQty), 10) || 1;
    let finalAvail = Math.max(0, parseInt(String(editEquipAvailQty), 10) || 0);

    if (finalTotal < currentlyBorrowed) {
      finalTotal = currentlyBorrowed;
    }
    if (finalAvail + currentlyBorrowed > finalTotal) {
      finalTotal = finalAvail + currentlyBorrowed;
    }

    setEquipmentList(prev =>
      prev.map(item =>
        item.id === editingEquip.id
          ? {
              ...item,
              name: editEquipName.trim(),
              category: editEquipCategory,
              totalQuantity: finalTotal,
              availableQuantity: finalAvail,
              description: editEquipDesc.trim()
            }
          : item
      )
    );

    setEditingEquip(null);
    showToast(`Updated '${editEquipName.trim()}': Total ${finalTotal}, Available ${finalAvail}.`, 'success');
  };

  const handleQuickAddStock = (equipId: number, delta: number) => {
    let name = '';
    let total = 0;
    let avail = 0;

    setEquipmentList(prev =>
      prev.map(item => {
        if (item.id === equipId) {
          const currentlyBorrowed = Math.max(0, item.totalQuantity - item.availableQuantity);
          let newTotal = item.totalQuantity + delta;
          if (newTotal < currentlyBorrowed) newTotal = currentlyBorrowed;
          let newAvail = Math.max(0, item.availableQuantity + delta);
          if (newAvail + currentlyBorrowed > newTotal) newTotal = newAvail + currentlyBorrowed;

          name = item.name;
          total = newTotal;
          avail = newAvail;
          return { ...item, totalQuantity: newTotal, availableQuantity: newAvail };
        }
        return item;
      })
    );
    showToast(`Stock updated for '${name}': Available ${avail} / Total ${total}.`, 'success');
  };

  const handleDeleteEquipment = (id: number, name: string) => {
    const hasActive = issueList.some(i => i.equipmentId === id && i.status === 'ISSUED');
    if (hasActive) {
      showToast(`Cannot delete '${name}' because active student borrowings exist.`, 'error');
      return;
    }
    setEquipmentList(prev => prev.filter(e => e.id !== id));
    showToast(`Equipment '${name}' deleted successfully.`, 'info');
  };

  // Student Actions
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentEmail.trim() || !newStudentPhone.trim()) {
      showToast('Full name, email, and phone number are required.', 'error');
      return;
    }
    const emailExists = studentList.some(s => s.email.toLowerCase() === newStudentEmail.trim().toLowerCase());
    if (emailExists) {
      showToast(`Email already registered: ${newStudentEmail}`, 'error');
      return;
    }

    const newId = studentList.length > 0 ? Math.max(...studentList.map(s => s.id)) + 1 : 1;
    const student: StudentItem = {
      id: newId,
      fullName: newStudentName.trim(),
      email: newStudentEmail.trim().toLowerCase(),
      phone: newStudentPhone.trim(),
      department: newStudentDept.trim(),
      classSemester: newStudentSem.trim()
    };

    setStudentList([...studentList, student]);
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentPhone('');
    setIsAddStudentModalOpen(false);
    showToast(`Registered student '${student.fullName}'!`, 'success');
  };

  const handleDeleteStudent = (id: number, name: string) => {
    const hasActive = issueList.some(i => i.studentId === id && i.status === 'ISSUED');
    if (hasActive) {
      showToast(`Cannot delete student '${name}' because they have active unreturned equipment.`, 'error');
      return;
    }
    setStudentList(prev => prev.filter(s => s.id !== id));
    showToast(`Student '${name}' removed.`, 'info');
  };

  // Issue Equipment Action
  const handleIssueEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = studentList.find(s => s.id === Number(issueStudentId));
    const equip = equipmentList.find(eq => eq.id === Number(issueEquipId));

    if (!student || !equip) {
      showToast('Please select both a valid student and equipment.', 'error');
      return;
    }
    if (issueQty <= 0) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }
    if (issueQty > equip.availableQuantity) {
      showToast(`Insufficient stock. Only ${equip.availableQuantity} units available.`, 'error');
      return;
    }

    const issueDateStr = issueDate || new Date().toISOString().split('T')[0];
    const returnDueDate = issueExpectedReturnDate || addDays(issueDateStr, 7);

    const newIssueId = issueList.length > 0 ? Math.max(...issueList.map(i => i.id)) + 1 : 1;
    const newIssue: IssueItem = {
      id: newIssueId,
      studentId: student.id,
      studentName: student.fullName,
      equipmentId: equip.id,
      equipmentName: equip.name,
      quantity: Number(issueQty),
      issueDate: issueDateStr,
      expectedReturnDate: returnDueDate,
      status: 'ISSUED',
      fineAmount: 0,
      finePaid: false
    };

    setEquipmentList(prev =>
      prev.map(item =>
        item.id === equip.id
          ? { ...item, availableQuantity: item.availableQuantity - issueQty }
          : item
      )
    );

    setIssueList([newIssue, ...issueList]);
    setIssueQty(1);
    showToast(`Issued ${issueQty} ${equip.name}(s) to ${student.fullName}. Due: ${returnDueDate}.`, 'success');
    setActivePage('return');
  };

  // Return Equipment Action
  const handleReturnEquipment = (issueId: number, customReturnDate?: string) => {
    const issue = issueList.find(i => i.id === issueId);
    if (!issue || issue.status !== 'ISSUED') {
      showToast('This equipment has already been returned.', 'info');
      return;
    }

    const returnDateStr = customReturnDate || new Date().toISOString().split('T')[0];
    const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, returnDateStr);
    const calculatedFine = daysOverdue * FINE_PER_DAY;

    setEquipmentList(prev =>
      prev.map(item => {
        if (item.id === issue.equipmentId) {
          const restored = Math.min(item.totalQuantity, item.availableQuantity + issue.quantity);
          return { ...item, availableQuantity: restored };
        }
        return item;
      })
    );

    setIssueList(prev =>
      prev.map(item =>
        item.id === issueId
          ? {
              ...item,
              status: 'RETURNED',
              returnDate: returnDateStr,
              fineAmount: calculatedFine,
              finePaid: calculatedFine === 0
            }
          : item
      )
    );

    if (calculatedFine > 0) {
      showToast(`Returned with ${daysOverdue} days delay. Late fine of ₹${calculatedFine} assessed (@ ₹5/day).`, 'error');
    } else {
      showToast(`Returned on time! Equipment stock restored.`, 'success');
    }
  };

  // Fine Payment & Waiver Actions
  const handleCollectFine = (issue: IssueItem, method: 'CASH_DESK' | 'UPI' | 'COLLEGE_CARD') => {
    const fine = computeIssueFine(issue);
    const days = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
    const student = studentList.find(s => s.id === issue.studentId);

    setIssueList(prev =>
      prev.map(item =>
        item.id === issue.id
          ? { ...item, fineAmount: fine, finePaid: true, fineWaived: false }
          : item
      )
    );

    const receipt: FineReceipt = {
      receiptId: `RCP-${Date.now().toString().slice(-6)}`,
      issueId: issue.id,
      studentName: issue.studentName,
      studentDept: student?.department || 'Physical Education Dept',
      equipmentName: issue.equipmentName,
      quantity: issue.quantity,
      issueDate: issue.issueDate,
      expectedReturnDate: issue.expectedReturnDate,
      returnDate: issue.returnDate || new Date().toISOString().split('T')[0],
      daysOverdue: days,
      fineAmount: fine,
      paidAt: new Date().toLocaleString(),
      paymentMethod: method
    };

    setPayingFineIssue(null);
    setActiveReceipt(receipt);
    showToast(`Fine of ₹${fine} collected for ${issue.studentName}. Receipt generated!`, 'success');
  };

  const handleWaiveFine = (issueId: number) => {
    setIssueList(prev =>
      prev.map(item =>
        item.id === issueId
          ? { ...item, fineWaived: true, finePaid: false, fineAmount: 0 }
          : item
      )
    );
    showToast(`Late fine waived by Sports Authority.`, 'info');
  };

  // Filtered views
  const filteredEquipment = equipmentList.filter(item => {
    const matchesCat = equipCategoryFilter === 'All' || item.category === equipCategoryFilter;
    const matchesSearch = !equipSearchQuery || item.name.toLowerCase().includes(equipSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredStudents = studentList.filter(s => {
    if (!studentSearchQuery) return true;
    const q = studentSearchQuery.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const filteredIssues = issueList.filter(issue => {
    const matchesStatus = returnStatusFilter === 'ALL' || issue.status === returnStatusFilter;
    if (!returnSearchQuery) return matchesStatus;
    const q = returnSearchQuery.toLowerCase().trim();
    return matchesStatus && (
      issue.studentName.toLowerCase().includes(q) ||
      issue.equipmentName.toLowerCase().includes(q) ||
      issue.id.toString().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Container */}
      {toast && (
        <div
          className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md border animate-in slide-in-from-top-3 duration-200"
          style={{
            backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(37, 99, 235, 0.95)',
            borderColor: toast.type === 'error' ? '#f87171' : toast.type === 'success' ? '#34d399' : '#60a5fa',
            color: '#ffffff'
          }}
        >
          <span>{toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* Top Application Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/25 shrink-0">
              ⚽
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                  SportsDesk
                </h1>
                <span className="inline-flex items-center space-x-1 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Live System</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Campus Sports Equipment &amp; Inventory Management Portal
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setActivePage('issue');
              }}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Issue Gear</span>
              <span className="sm:hidden">Issue</span>
            </button>

            <button
              onClick={() => setIsAddEquipModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700/80 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 flex flex-col md:flex-row gap-6">
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 md:rounded-2xl md:border ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 md:hidden mb-4">
              <span className="font-bold text-white text-sm">SPORTSDESK NAVIGATION</span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'equipment', label: 'Equipment Inventory', icon: Dumbbell, count: totalTypes },
                { id: 'students', label: 'Students Directory', icon: GraduationCap, count: studentList.length },
                { id: 'issue', label: 'Issue Equipment', icon: ArrowUpRight },
                { id: 'return', label: 'Returns & Check-in', icon: ArrowDownLeft, count: activeLoans.length },
                {
                  id: 'fines',
                  label: 'Late Fine Center',
                  icon: IndianRupee,
                  count: overdueActiveLoans.length,
                  alert: overdueActiveLoans.length > 0
                }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id as any);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && item.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          item.alert
                            ? 'bg-rose-500 text-white animate-pulse'
                            : isActive
                            ? 'bg-blue-800 text-blue-100'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick System Summary in Sidebar */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Total Stock:</span>
                <span className="font-bold text-white">{totalQuantity} units</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Available:</span>
                <span className="font-bold text-emerald-400">{availableQuantity} units</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${totalQuantity > 0 ? (availableQuantity / totalQuantity) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center">
              Campus Sports &amp; Athletics Dept<br />Production Release
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col min-w-0">
          {/* ========================================================================= */}
          {/* 1. DASHBOARD OVERVIEW                                                     */}
          {/* ========================================================================= */}
          {activePage === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center space-x-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                    <span>System Dashboard</span>
                  </h2>
                  <p className="text-xs text-slate-400">Overview of equipment inventory, active borrowings, and overdue fine status</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivePage('issue')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Issue Equipment</span>
                  </button>
                  <button
                    onClick={() => setActivePage('return')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Check-in Return</span>
                  </button>
                </div>
              </div>

              {/* Overdue Warning Callout */}
              {overdueActiveLoans.length > 0 && (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-300">
                        {overdueActiveLoans.length} Equipment Borrowing{overdueActiveLoans.length > 1 ? 's' : ''} Past Return Due Date!
                      </h4>
                      <p className="text-rose-400/80 text-[11px]">
                        Late fine policy: ₹5 per day automatically accumulating until equipment return.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActivePage('fines')}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shrink-0 cursor-pointer shadow-sm"
                  >
                    Manage Overdue Fines
                  </button>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Equipment</span>
                  <div className="text-xl sm:text-2xl font-black text-white">{totalTypes} <span className="text-xs font-normal text-slate-400">types</span></div>
                  <div className="text-[11px] text-slate-400">Total units: <strong className="text-white">{totalQuantity}</strong></div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Available Stock</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">{availableQuantity} <span className="text-xs font-normal text-slate-400">units</span></div>
                  <div className="text-[11px] text-slate-400">{totalQuantity > 0 ? Math.round((availableQuantity / totalQuantity) * 100) : 0}% ready to issue</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Currently Borrowed</span>
                  <div className="text-xl sm:text-2xl font-black text-blue-400">{currentlyIssued} <span className="text-xs font-normal text-slate-400">units</span></div>
                  <div className="text-[11px] text-slate-400">{activeLoans.length} active issue records</div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Overdue Fines</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">₹{totalFinePending}</div>
                  <div className="text-[11px] text-slate-400">₹{totalFineCollected} collected to date</div>
                </div>
              </div>

              {/* Two Column Layout: Recent Transactions + Inventory Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Recent Borrowing &amp; Return Activity</span>
                    </h3>
                    <button
                      onClick={() => setActivePage('return')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {issueList.slice(0, 5).map(issue => {
                      const isOverdue = issue.status === 'ISSUED' && calculateDaysOverdue(issue.expectedReturnDate) > 0;
                      const daysLate = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                      return (
                        <div key={issue.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="text-lg shrink-0">
                              {issue.status === 'ISSUED' ? '📤' : '📥'}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-200 truncate">
                                {issue.quantity}x {issue.equipmentName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                Borrower: <strong className="text-slate-300">{issue.studentName}</strong> • Due: {issue.expectedReturnDate}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {issue.status === 'RETURNED' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Returned
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Overdue ({daysLate}d • ₹{daysLate * FINE_PER_DAY})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                Active Loan
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Stock Distribution */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Stock by Category</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {['Outdoor', 'Indoor', 'Fitness', 'Athletics', 'Other'].map(cat => {
                      const itemsInCat = equipmentList.filter(e => e.category === cat);
                      const catTotal = itemsInCat.reduce((acc, c) => acc + c.totalQuantity, 0);
                      const catAvail = itemsInCat.reduce((acc, c) => acc + c.availableQuantity, 0);
                      const pct = catTotal > 0 ? Math.round((catAvail / catTotal) * 100) : 0;

                      return (
                        <div key={cat} className="space-y-1 text-xs">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-300">{cat}</span>
                            <span className="text-slate-400">{catAvail} / {catTotal} units</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. EQUIPMENT INVENTORY                                                     */}
          {/* ========================================================================= */}
          {activePage === 'equipment' && (
            <div className="space-y-4">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                    <span>Sports Equipment Inventory</span>
                  </h2>
                  <p className="text-xs text-slate-400">Manage sports gear, add new stock, edit quantity, and adjust availability</p>
                </div>
                <button
                  onClick={() => setIsAddEquipModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Equipment</span>
                </button>
              </div>

              {/* Search, Category Filter & View Mode Toggle */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search equipment..."
                      value={equipSearchQuery}
                      onChange={e => setEquipSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center space-x-1 overflow-x-auto">
                    {['All', 'Outdoor', 'Indoor', 'Fitness', 'Athletics', 'Other'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setEquipCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                          equipCategoryFilter === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg self-end md:self-auto">
                  <button
                    onClick={() => setEquipViewMode('cards')}
                    className={`p-1.5 rounded-md text-xs cursor-pointer ${
                      equipViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Grid Cards View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEquipViewMode('table')}
                    className={`p-1.5 rounded-md text-xs cursor-pointer ${
                      equipViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Equipment Grid Cards View */}
              {equipViewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredEquipment.length > 0 ? (
                    filteredEquipment.map(item => {
                      const issuedCount = Math.max(0, item.totalQuantity - item.availableQuantity);
                      const isOutOfStock = item.availableQuantity <= 0;
                      const isLowStock = item.availableQuantity > 0 && item.availableQuantity <= 2;

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all shadow-md group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                {item.category}
                              </span>
                              {isOutOfStock ? (
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                                  In Stock
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-white mt-2 group-hover:text-blue-300 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                              {item.description || 'Standard college athletics equipment.'}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-800/60">
                            {/* Stock Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">Available / Total:</span>
                                <span className="font-mono font-bold text-white">
                                  <span className={isOutOfStock ? 'text-rose-400' : 'text-emerald-400'}>
                                    {item.availableQuantity}
                                  </span>{' '}
                                  / {item.totalQuantity} units
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: `${item.totalQuantity > 0 ? (item.availableQuantity / item.totalQuantity) * 100 : 0}%`
                                  }}
                                />
                              </div>
                            </div>

                            {/* Quick Add Stock Buttons */}
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <span className="text-[10px] text-slate-500">Quick Stock:</span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleQuickAddStock(item.id, 1)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                                  title="Add 1 to total and available stock"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleQuickAddStock(item.id, 5)}
                                  className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                                  title="Add 5 to total and available stock"
                                >
                                  +5
                                </button>
                                {item.availableQuantity > 0 && (
                                  <button
                                    onClick={() => handleQuickAddStock(item.id, -1)}
                                    className="bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                                    title="Subtract 1 from available and total stock"
                                  >
                                    -1
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                              <button
                                onClick={() => handleOpenEditEquip(item)}
                                className="bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit Stock</span>
                              </button>
                              <button
                                onClick={() => handleDeleteEquipment(item.id, item.name)}
                                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors"
                                title="Delete equipment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                      No equipment matches your search or filter.
                    </div>
                  )}
                </div>
              )}

              {/* Equipment Table View */}
              {equipViewMode === 'table' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">Equipment Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-center">Total Stock</th>
                        <th className="py-3 px-3 text-center">Available</th>
                        <th className="py-3 px-3 text-center">Borrowed</th>
                        <th className="py-3 px-3 text-center">Quick Adjust</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredEquipment.length > 0 ? (
                        filteredEquipment.map(item => {
                          const borrowed = Math.max(0, item.totalQuantity - item.availableQuantity);
                          return (
                            <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-3 font-mono text-slate-500">#{item.id}</td>
                              <td className="py-3 px-3 font-bold text-white">{item.name}</td>
                              <td className="py-3 px-3">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-blue-300">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-bold">{item.totalQuantity}</td>
                              <td className="py-3 px-3 text-center font-bold text-emerald-400">{item.availableQuantity}</td>
                              <td className="py-3 px-3 text-center text-slate-400">{borrowed}</td>
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center space-x-1">
                                  <button
                                    onClick={() => handleQuickAddStock(item.id, 1)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  >
                                    +1
                                  </button>
                                  <button
                                    onClick={() => handleQuickAddStock(item.id, 5)}
                                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  >
                                    +5
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center space-x-2">
                                  <button
                                    onClick={() => handleOpenEditEquip(item)}
                                    className="text-blue-400 hover:text-blue-300 font-semibold text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEquipment(item.id, item.name)}
                                    className="text-slate-500 hover:text-rose-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            No equipment found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. STUDENTS DIRECTORY                                                     */}
          {/* ========================================================================= */}
          {activePage === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-blue-400" />
                    <span>Registered College Students &amp; Members</span>
                  </h2>
                  <p className="text-xs text-slate-400">View borrowing history, active loans, and student profiles</p>
                </div>
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Student</span>
                </button>
              </div>

              {/* Search & Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, department, or email..."
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setStudentViewMode('cards')}
                    className={`p-1.5 rounded-md text-xs cursor-pointer ${
                      studentViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setStudentViewMode('table')}
                    className={`p-1.5 rounded-md text-xs cursor-pointer ${
                      studentViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Student Cards View */}
              {studentViewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                      const activeStudentLoans = issueList.filter(
                        i => i.studentId === student.id && i.status === 'ISSUED'
                      );
                      const pendingStudentFine = issueList
                        .filter(i => i.studentId === student.id && !i.finePaid && !i.fineWaived)
                        .reduce((acc, curr) => acc + computeIssueFine(curr), 0);

                      return (
                        <div
                          key={student.id}
                          className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-md hover:border-slate-700 transition-all"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-sm">
                                  {student.fullName.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-white text-sm">{student.fullName}</h3>
                                  <span className="text-[10px] text-slate-400">ID #{student.id}</span>
                                </div>
                              </div>

                              {activeStudentLoans.length > 0 ? (
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded">
                                  {activeStudentLoans.length} Active Loan{activeStudentLoans.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                  No Active Loans
                                </span>
                              )}
                            </div>

                            <div className="mt-3 space-y-1 text-xs text-slate-400">
                              <p className="truncate"><strong className="text-slate-300">Dept:</strong> {student.department}</p>
                              <p className="truncate"><strong className="text-slate-300">Sem:</strong> {student.classSemester}</p>
                              <p className="truncate flex items-center space-x-1 pt-0.5">
                                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{student.email}</span>
                              </p>
                              <p className="truncate flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{student.phone}</span>
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            {pendingStudentFine > 0 ? (
                              <span className="text-[11px] font-bold text-rose-400">
                                Due Fine: ₹{pendingStudentFine}
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-400 font-medium">✓ Dues Clear</span>
                            )}

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setViewingStudentHistory(student)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer"
                                title="View loan history"
                              >
                                <History className="w-3 h-3" />
                                <span>History</span>
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id, student.fullName)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                                title="Delete student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                      No students found matching your query.
                    </div>
                  )}
                </div>
              )}

              {/* Student Table View */}
              {studentViewMode === 'table' && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">ID</th>
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">Semester</th>
                        <th className="py-3 px-3">Contact</th>
                        <th className="py-3 px-3 text-center">Active Loans</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredStudents.map(student => {
                        const activeCount = issueList.filter(
                          i => i.studentId === student.id && i.status === 'ISSUED'
                        ).length;
                        return (
                          <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-500">#{student.id}</td>
                            <td className="py-3 px-3 font-bold text-white">{student.fullName}</td>
                            <td className="py-3 px-3 text-slate-300">{student.department}</td>
                            <td className="py-3 px-3 text-slate-400">{student.classSemester}</td>
                            <td className="py-3 px-3 text-[11px] text-slate-400">
                              <div>{student.email}</div>
                              <div className="text-slate-500">{student.phone}</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                activeCount > 0 ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'
                              }`}>
                                {activeCount}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center space-x-2">
                                <button
                                  onClick={() => setViewingStudentHistory(student)}
                                  className="text-blue-400 hover:text-blue-300 font-semibold"
                                >
                                  History
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(student.id, student.fullName)}
                                  className="text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. ISSUE EQUIPMENT                                                        */}
          {/* ========================================================================= */}
          {activePage === 'issue' && (
            <div className="max-w-3xl space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ArrowUpRight className="w-5 h-5 text-blue-400" />
                  <span>Issue Equipment to Student</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select student borrower, sports item, and expected return date (Late return fine: ₹5/day overdue)
                </p>
              </div>

              <form onSubmit={handleIssueEquipment} className="bg-slate-950 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Student */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Select Student Borrower *</span>
                      <button
                        type="button"
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="text-[11px] text-blue-400 hover:underline font-normal cursor-pointer"
                      >
                        + New Student
                      </button>
                    </label>
                    <select
                      value={issueStudentId}
                      onChange={e => setIssueStudentId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    >
                      {studentList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.department}) - #{s.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Equipment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Select Sports Equipment *</span>
                      <button
                        type="button"
                        onClick={() => setIsAddEquipModalOpen(true)}
                        className="text-[11px] text-blue-400 hover:underline font-normal cursor-pointer"
                      >
                        + New Item
                      </button>
                    </label>
                    <select
                      value={issueEquipId}
                      onChange={e => setIssueEquipId(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    >
                      {equipmentList.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} [{eq.category}] — Avail: {eq.availableQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity to Issue */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Quantity to Issue *</span>
                      <span className="text-[11px] text-slate-400">
                        Max available: <strong className="text-emerald-400">{selectedEquipForIssue?.availableQuantity || 0}</strong>
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedEquipForIssue?.availableQuantity || 1}
                      value={issueQty}
                      onChange={e => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Issue Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Issue Date *</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={e => {
                        setIssueDate(e.target.value);
                        setIssueExpectedReturnDate(addDays(e.target.value, 7));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Return Due Date with Presets */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-bold text-purple-400 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Expected Return Due Date *</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {[
                        { label: '3 Days', days: 3 },
                        { label: '7 Days', days: 7 },
                        { label: '14 Days', days: 14 }
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => setIssueExpectedReturnDate(addDays(issueDate, preset.days))}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="date"
                    value={issueExpectedReturnDate}
                    onChange={e => setIssueExpectedReturnDate(e.target.value)}
                    min={issueDate}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                {/* Late Fine Notice Banner */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start space-x-2.5">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Overdue Fine Policy: ₹5.00 per day</span>
                    <p className="text-[11px] text-amber-400/80 mt-0.5">
                      If equipment is not returned by {issueExpectedReturnDate}, a fine of ₹5/day will accumulate automatically and be visible to both admin and student.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedEquipForIssue || selectedEquipForIssue.availableQuantity <= 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center space-x-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Issue Equipment</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. RETURNS & CHECK-IN                                                     */}
          {/* ========================================================================= */}
          {activePage === 'return' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                    <span>Returns &amp; Check-in</span>
                  </h2>
                  <p className="text-xs text-slate-400">Receive equipment back into inventory stock and record delay penalties</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student name or equipment..."
                    value={returnSearchQuery}
                    onChange={e => setReturnSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-1">
                  {(['ISSUED', 'ALL', 'RETURNED'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setReturnStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        returnStatusFilter === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {status === 'ISSUED' ? 'Active Borrowed' : status === 'ALL' ? 'All Loans' : 'Returned'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loans Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Loan ID</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Equipment</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3">Issue Date</th>
                      <th className="py-3 px-3">Due Date</th>
                      <th className="py-3 px-3 text-center">Status &amp; Fine</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredIssues.length > 0 ? (
                      filteredIssues.map(issue => {
                        const isReturned = issue.status === 'RETURNED';
                        const daysLate = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                        const fine = computeIssueFine(issue);

                        return (
                          <tr key={issue.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-500">#{issue.id}</td>
                            <td className="py-3 px-3 font-bold text-white">{issue.studentName}</td>
                            <td className="py-3 px-3 text-blue-300 font-semibold">{issue.equipmentName}</td>
                            <td className="py-3 px-3 text-center font-bold">{issue.quantity}</td>
                            <td className="py-3 px-3 text-slate-400">{issue.issueDate}</td>
                            <td className="py-3 px-3 font-medium text-purple-400">{issue.expectedReturnDate}</td>
                            <td className="py-3 px-3 text-center">
                              {isReturned ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  Returned ({issue.returnDate})
                                </span>
                              ) : daysLate > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                  ⚠️ {daysLate}d Overdue • ₹{fine} fine
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  On Loan (On Time)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {!isReturned ? (
                                <button
                                  onClick={() => handleReturnEquipment(issue.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer shadow-sm"
                                >
                                  Return Now
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Restored</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No records match current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. LATE FINE CENTER (₹5 / DAY SYSTEM)                                     */}
          {/* ========================================================================= */}
          {activePage === 'fines' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <IndianRupee className="w-5 h-5 text-amber-400" />
                    <span>Late Return Fine Center (₹5 per Day Delay)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Students are charged ₹5/day for unreturned equipment past the returning date.
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setFineViewRole('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fineViewRole === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Admin Fine Desk
                  </button>
                  <button
                    onClick={() => setFineViewRole('student')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fineViewRole === 'student' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Student Self-Lookup
                  </button>
                </div>
              </div>

              {/* Admin Fine Desk View */}
              {fineViewRole === 'admin' && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Fines Incurred</span>
                      <div className="text-xl font-black text-white mt-1">₹{totalFineIncurred}</div>
                      <span className="text-[10px] text-slate-500">Rate: ₹5 per day overdue</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Fines Collected</span>
                      <div className="text-xl font-black text-emerald-400 mt-1">₹{totalFineCollected}</div>
                      <span className="text-[10px] text-slate-500">Processed &amp; receipted</span>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Pending Dues</span>
                      <div className="text-xl font-black text-rose-400 mt-1">₹{totalFinePending}</div>
                      <span className="text-[10px] text-slate-500">Outstanding student penalties</span>
                    </div>
                  </div>

                  {/* Fines Table */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3">Borrower</th>
                          <th className="py-3 px-3">Equipment</th>
                          <th className="py-3 px-3">Due Date</th>
                          <th className="py-3 px-3 text-center">Delay</th>
                          <th className="py-3 px-3 text-right">Fine Amount</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {issueList.map(issue => {
                          const daysLate = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                          const fine = computeIssueFine(issue);
                          const isPaid = issue.finePaid;
                          const isWaived = issue.fineWaived;

                          return (
                            <tr key={issue.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-3 font-bold text-white">{issue.studentName}</td>
                              <td className="py-3 px-3 text-slate-300">{issue.equipmentName} ({issue.quantity}x)</td>
                              <td className="py-3 px-3 text-purple-400 font-mono">{issue.expectedReturnDate}</td>
                              <td className="py-3 px-3 text-center">
                                {daysLate > 0 ? (
                                  <span className="text-rose-400 font-bold">{daysLate} days</span>
                                ) : (
                                  <span className="text-slate-500">0 days</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                ₹{fine}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isPaid ? (
                                  <span className="text-emerald-400 font-semibold text-[11px]">✓ Cleared</span>
                                ) : isWaived ? (
                                  <span className="text-slate-400 text-[11px] italic">Waived</span>
                                ) : fine > 0 ? (
                                  <span className="text-rose-400 font-bold text-[11px]">Unpaid Due</span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">No fine</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {fine > 0 && !isPaid && !isWaived ? (
                                  <div className="inline-flex items-center space-x-2">
                                    <button
                                      onClick={() => setPayingFineIssue(issue)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer shadow-sm"
                                    >
                                      Collect ₹{fine}
                                    </button>
                                    <button
                                      onClick={() => handleWaiveFine(issue.id)}
                                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                                    >
                                      Waive
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Student Self-Lookup View */}
              {fineViewRole === 'student' && (
                <div className="space-y-4">
                  {/* Select Student Selector */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white">Select Student Profile:</span>
                      <p className="text-[11px] text-slate-400">Lookup personal equipment loans and penalty status</p>
                    </div>
                    <select
                      value={selectedStudentForFineView}
                      onChange={e => setSelectedStudentForFineView(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {studentList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.department}) - #{s.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student View Details */}
                  {(() => {
                    const student = studentList.find(s => s.id === Number(selectedStudentForFineView)) || studentList[0];
                    if (!student) return null;
                    const studentLoans = issueList.filter(i => i.studentId === student.id);
                    const studentPendingFine = studentLoans.reduce((acc, curr) => {
                      if (curr.fineWaived || curr.finePaid) return acc;
                      return acc + computeIssueFine(curr);
                    }, 0);

                    return (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div>
                            <h3 className="text-base font-bold text-white">{student.fullName}</h3>
                            <p className="text-xs text-slate-400">{student.department} • {student.classSemester}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400">Total Unpaid Fine:</span>
                            <div className="text-xl font-black text-rose-400">₹{studentPendingFine}</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-300">Borrowing Records:</h4>
                          {studentLoans.length > 0 ? (
                            studentLoans.map(loan => {
                              const daysLate = calculateDaysOverdue(loan.expectedReturnDate, loan.returnDate);
                              const fine = computeIssueFine(loan);
                              return (
                                <div key={loan.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <div className="font-bold text-white">{loan.quantity}x {loan.equipmentName}</div>
                                    <div className="text-[11px] text-slate-400">
                                      Due: <span className="text-purple-400">{loan.expectedReturnDate}</span> • Status: {loan.status}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    {daysLate > 0 && !loan.finePaid && !loan.fineWaived ? (
                                      <div className="text-right">
                                        <div className="text-rose-400 font-bold">₹{fine} Due ({daysLate}d late)</div>
                                        <button
                                          onClick={() => setPayingFineIssue(loan)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer mt-1"
                                        >
                                          Pay Now
                                        </button>
                                      </div>
                                    ) : loan.finePaid ? (
                                      <span className="text-emerald-400 font-bold">✓ Cleared</span>
                                    ) : (
                                      <span className="text-emerald-400 font-semibold">✓ No Fine</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-500">No borrowing records on file for this student.</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Modal: Add Equipment */}
      {isAddEquipModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <span>Add New Sports Equipment</span>
              </h3>
              <button onClick={() => setIsAddEquipModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Equipment Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Badminton Racket (Carbon)"
                  value={newEquipName}
                  onChange={e => setNewEquipName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Category *</label>
                  <select
                    value={newEquipCategory}
                    onChange={e => setNewEquipCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Outdoor">Outdoor</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Athletics">Athletics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Total Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    value={newEquipQuantity}
                    onChange={e => setNewEquipQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description / Specifications</label>
                <textarea
                  placeholder="Brand, size, condition, storage location..."
                  rows={2}
                  value={newEquipDesc}
                  onChange={e => setNewEquipDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEquipModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Equipment Stock & Details */}
      {editingEquip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Edit Stock &amp; Details: {editingEquip.name}</span>
              </h3>
              <button onClick={() => setEditingEquip(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEquip} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Equipment Name *</label>
                  <input
                    type="text"
                    value={editEquipName}
                    onChange={e => setEditEquipName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Category *</label>
                  <select
                    value={editEquipCategory}
                    onChange={e => setEditEquipCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Outdoor">Outdoor</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Athletics">Athletics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Stock Steppers Box */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Stock Adjustment Steppers</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => adjustBothTotalAndAvail(5)}
                      className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-emerald-600/30 cursor-pointer"
                    >
                      +5 Quick Add
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustBothTotalAndAvail(10)}
                      className="bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-emerald-600/30 cursor-pointer"
                    >
                      +10 Quick Add
                    </button>
                  </div>
                </div>

                {/* Total Quantity Stepper */}
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-300 font-semibold block">Total Quantity</span>
                    <span className="text-[10px] text-slate-500">All purchased units</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => adjustEditTotal(-5)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustEditTotal(-1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      -1
                    </button>
                    <span className="w-12 text-center font-mono font-bold text-white text-sm">
                      {editEquipTotalQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustEditTotal(1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustEditTotal(5)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Available Quantity Stepper */}
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-emerald-400 font-semibold block">Available Stock</span>
                    <span className="text-[10px] text-slate-500">Currently in rack</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => adjustEditAvail(-5)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustEditAvail(-1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      -1
                    </button>
                    <span className="w-12 text-center font-mono font-bold text-emerald-400 text-sm">
                      {editEquipAvailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustEditAvail(1)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustEditAvail(5)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 w-7 h-7 rounded font-bold cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editEquipDesc}
                  onChange={e => setEditEquipDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingEquip(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Student */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span>Register College Student</span>
              </h3>
              <button onClick={() => setIsAddStudentModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Rohit Sharma"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  placeholder="rohit.sharma@campus.edu"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={newStudentPhone}
                    onChange={e => setNewStudentPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Semester *</label>
                  <select
                    value={newStudentSem}
                    onChange={e => setNewStudentSem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Department *</label>
                <select
                  value={newStudentDept}
                  onChange={e => setNewStudentDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics &amp; Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Physical Education & Sports">Physical Education &amp; Sports</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Borrowing History */}
      {viewingStudentHistory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Borrowing History: {viewingStudentHistory.fullName}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {viewingStudentHistory.department} • ID #{viewingStudentHistory.id}
                </span>
              </div>
              <button onClick={() => setViewingStudentHistory(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {issueList.filter(i => i.studentId === viewingStudentHistory.id).length > 0 ? (
                issueList
                  .filter(i => i.studentId === viewingStudentHistory.id)
                  .map(loan => (
                    <div
                      key={loan.id}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {loan.quantity}x {loan.equipmentName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Issued: {loan.issueDate} • Due: {loan.expectedReturnDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            loan.status === 'RETURNED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-blue-500/15 text-blue-400'
                          }`}
                        >
                          {loan.status}
                        </span>
                        {loan.fineAmount !== undefined && loan.fineAmount > 0 && (
                          <div className="text-[10px] text-rose-400 font-bold mt-1">
                            Fine: ₹{loan.fineAmount} ({loan.finePaid ? 'Paid' : 'Unpaid'})
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-center py-6 text-slate-500 text-xs">
                  No previous equipment borrowings for this student.
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingStudentHistory(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Collect Fine & Payment Method */}
      {payingFineIssue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <IndianRupee className="w-4 h-4 text-emerald-400" />
                <span>Collect Late Return Fine</span>
              </h3>
              <button onClick={() => setPayingFineIssue(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Student Borrower:</span>
                <span className="font-bold text-white">{payingFineIssue.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Equipment Item:</span>
                <span className="font-bold text-white">{payingFineIssue.equipmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="text-purple-400 font-mono">{payingFineIssue.expectedReturnDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Days Delayed:</span>
                <span className="font-bold text-amber-400">
                  {calculateDaysOverdue(payingFineIssue.expectedReturnDate, payingFineIssue.returnDate)} Days
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-300">Total Penalty (@ ₹5/day):</span>
                <span className="font-extrabold text-emerald-400 text-base">
                  ₹{computeIssueFine(payingFineIssue)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Select Payment Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR' },
                  { id: 'CASH_DESK', label: 'Cash Desk' },
                  { id: 'COLLEGE_CARD', label: 'Campus ID' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-2 rounded-lg text-center font-bold transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setPayingFineIssue(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCollectFine(payingFineIssue, paymentMethod)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm &amp; Generate Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Digital Fine Receipt */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Receipt className="w-4 h-4" />
                <span>Sports Authority Fine Receipt</span>
              </span>
              <button onClick={() => setActiveReceipt(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs bg-slate-950/40">
              <div className="text-center pb-2 border-b border-slate-800 space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 inline-flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">COLLEGE SPORTS &amp; ATHLETICS</h3>
                <p className="text-[11px] text-slate-400">Late Equipment Return Clearance Slip</p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Receipt: <strong className="text-blue-400">{activeReceipt.receiptId}</strong> • {activeReceipt.paidAt}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Borrower:</span>
                  <span className="font-bold text-white">{activeReceipt.studentName} ({activeReceipt.studentDept})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Equipment:</span>
                  <span className="font-bold text-white">{activeReceipt.quantity}x {activeReceipt.equipmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="text-purple-400 font-mono">{activeReceipt.expectedReturnDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Delayed:</span>
                  <span className="font-bold text-amber-400">{activeReceipt.daysOverdue} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rate:</span>
                  <span>₹5.00 / day</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Fine Paid:</span>
                  <span className="text-emerald-400 text-sm font-extrabold">₹{activeReceipt.fineAmount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Payment Mode: <strong>{activeReceipt.paymentMethod}</strong></span>
                <span className="text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                  ✓ PAID &amp; CLEARED
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-3.5 text-center text-xs text-slate-500 mt-auto">
        SportsDesk • Campus Sports Equipment &amp; Inventory Management Portal • All rights reserved
      </footer>
    </div>
  );
}
