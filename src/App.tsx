/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import JSZip from 'jszip';
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
  RefreshCw,
  Download,
  Copy,
  Check,
  FileCode,
  Trash2,
  Filter,
  Grid,
  List,
  Terminal,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Info,
  Pencil,
  IndianRupee,
  Receipt,
  Coins,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { PROJECT_FILES, ProjectFile } from './projectFiles';

// Late Return Fine Constant: ₹5 per day
export const FINE_PER_DAY = 5;

// Interfaces matching MySQL schema & Java Entities
interface EquipmentItem {
  id: number;
  name: string;
  category: 'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other';
  totalQuantity: number;
  availableQuantity: number;
  description: string;
}

interface StudentItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  classSemester: string;
}

interface IssueItem {
  id: number;
  studentId: number;
  studentName: string;
  equipmentId: number;
  equipmentName: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate: string; // Returning date / Due date
  returnDate?: string | null; // Actual return date
  status: 'ISSUED' | 'RETURNED';
  fineAmount?: number; // Calculated or assessed fine in INR (₹)
  finePaid?: boolean; // Whether fine has been paid
  fineWaived?: boolean; // Whether fine was waived by admin
}

// Receipt generated upon fine payment
interface FineReceipt {
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

// Helper: Add days to date string YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
}

// Helper: Calculate number of overdue days
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

// Sample data available on demand for testing / demo
const SAMPLE_EQUIPMENT: EquipmentItem[] = [
  { id: 1, name: 'Football', category: 'Outdoor', totalQuantity: 15, availableQuantity: 13, description: 'Official size 5 match footballs for college tournaments' },
  { id: 2, name: 'Basketball', category: 'Outdoor', totalQuantity: 10, availableQuantity: 9, description: 'Spalding composite leather standard basketballs' },
  { id: 3, name: 'Volleyball', category: 'Outdoor', totalQuantity: 12, availableQuantity: 12, description: 'Mikasa soft touch indoor/outdoor volleyballs' },
  { id: 4, name: 'Badminton Racket', category: 'Indoor', totalQuantity: 20, availableQuantity: 18, description: 'Yonex carbon fiber lightweight rackets with covers' },
  { id: 5, name: 'Cricket Bat', category: 'Outdoor', totalQuantity: 8, availableQuantity: 8, description: 'English willow full-size bats for college team' },
  { id: 6, name: 'Yoga Mat', category: 'Fitness', totalQuantity: 25, availableQuantity: 25, description: 'High-density anti-tear non-slip exercise mats' },
  { id: 7, name: 'Table Tennis Racket', category: 'Indoor', totalQuantity: 16, availableQuantity: 16, description: 'Stiga professional rubber paddle with protective casing' },
  { id: 8, name: 'Javelin', category: 'Athletics', totalQuantity: 6, availableQuantity: 6, description: 'Standard 800g aluminum competition javelins' }
];

const SAMPLE_STUDENTS: StudentItem[] = [
  { id: 1, fullName: 'Aarav Sharma', email: 'aarav.sharma@college.edu', phone: '9876543210', department: 'Computer Science Engineering', classSemester: 'Semester 2' },
  { id: 2, fullName: 'Diya Patel', email: 'diya.patel@college.edu', phone: '9876543211', department: 'Information Technology', classSemester: 'Semester 2' },
  { id: 3, fullName: 'Rohan Verma', email: 'rohan.verma@college.edu', phone: '9876543212', department: 'Electronics & Communication', classSemester: 'Semester 4' },
  { id: 4, fullName: 'Sneha Reddy', email: 'sneha.reddy@college.edu', phone: '9876543213', department: 'Mechanical Engineering', classSemester: 'Semester 6' }
];

// Sample issues including overdue loan (₹5/day fine) and returned with fine paid for comprehensive demonstration
const SAMPLE_ISSUES: IssueItem[] = [
  {
    id: 1,
    studentId: 1,
    studentName: 'Aarav Sharma',
    equipmentId: 1,
    equipmentName: 'Football',
    quantity: 2,
    issueDate: '2026-10-01',
    expectedReturnDate: '2026-10-08',
    status: 'ISSUED',
    fineAmount: 30, // Overdue by 6 days = ₹30 (6 * 5)
    finePaid: false
  },
  {
    id: 2,
    studentId: 2,
    studentName: 'Diya Patel',
    equipmentId: 4,
    equipmentName: 'Badminton Racket',
    quantity: 2,
    issueDate: '2026-10-10',
    expectedReturnDate: '2026-10-17',
    status: 'ISSUED',
    fineAmount: 0,
    finePaid: false
  },
  {
    id: 3,
    studentId: 3,
    studentName: 'Rohan Verma',
    equipmentId: 2,
    equipmentName: 'Basketball',
    quantity: 1,
    issueDate: '2026-09-20',
    expectedReturnDate: '2026-09-27',
    returnDate: '2026-09-30',
    status: 'RETURNED',
    fineAmount: 15, // Returned 3 days late, fine collected
    finePaid: true
  }
];

// Fresh start by default (0 equipment, 0 students, 0 issues)
const INITIAL_EQUIPMENT: EquipmentItem[] = [];
const INITIAL_STUDENTS: StudentItem[] = [];
const INITIAL_ISSUES: IssueItem[] = [];

export default function App() {
  // Navigation & View Mode
  const [activeView, setActiveView] = useState<'app' | 'code' | 'viva' | 'guide'>('app');
  const [activePage, setActivePage] = useState<'dashboard' | 'equipment' | 'students' | 'issue' | 'return' | 'fines'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Responsive View Toggle for tables on mobile/tablet (table vs cards)
  const [equipViewMode, setEquipViewMode] = useState<'table' | 'cards'>('cards');
  const [studentViewMode, setStudentViewMode] = useState<'table' | 'cards'>('cards');
  const [returnViewMode, setReturnViewMode] = useState<'table' | 'cards'>('cards');
  const [fineViewMode, setFineViewMode] = useState<'table' | 'cards'>('cards');

  // Application Data States (Live in-memory database simulation matching MySQL backend)
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [studentList, setStudentList] = useState<StudentItem[]>(INITIAL_STUDENTS);
  const [issueList, setIssueList] = useState<IssueItem[]>(INITIAL_ISSUES);

  // Filter & Search States
  const [equipCategoryFilter, setEquipCategoryFilter] = useState<string>('All');
  const [equipSearchQuery, setEquipSearchQuery] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [returnSearchQuery, setReturnSearchQuery] = useState<string>('');
  const [returnStatusFilter, setReturnStatusFilter] = useState<'ALL' | 'ISSUED' | 'RETURNED'>('ISSUED');

  // Fine Section Management & Portal States
  const [fineViewRole, setFineViewRole] = useState<'admin' | 'student'>('admin');
  const [fineStatusFilter, setFineStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');
  const [fineSearchQuery, setFineSearchQuery] = useState<string>('');
  const [selectedStudentForFineView, setSelectedStudentForFineView] = useState<number>(1);
  const [payingFineIssue, setPayingFineIssue] = useState<IssueItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_DESK' | 'UPI' | 'COLLEGE_CARD'>('UPI');
  const [activeReceipt, setActiveReceipt] = useState<FineReceipt | null>(null);

  // Modals
  const [isAddEquipModalOpen, setIsAddEquipModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<EquipmentItem | null>(null);

  // Edit Equipment Form & Stock Adjustment States
  const [editEquipName, setEditEquipName] = useState('');
  const [editEquipCategory, setEditEquipCategory] = useState<'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other'>('Outdoor');
  const [editEquipTotalQty, setEditEquipTotalQty] = useState(10);
  const [editEquipAvailQty, setEditEquipAvailQty] = useState(10);
  const [editEquipDesc, setEditEquipDesc] = useState('');

  // Quick Return Form States
  const [quickReturnIssueId, setQuickReturnIssueId] = useState<string>('');
  const [quickReturnDate, setQuickReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickReturnCollectFine, setQuickReturnCollectFine] = useState<boolean>(true);

  // Forms
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<'Indoor' | 'Outdoor' | 'Fitness' | 'Athletics' | 'Other'>('Outdoor');
  const [newEquipQuantity, setNewEquipQuantity] = useState(10);
  const [newEquipDesc, setNewEquipDesc] = useState('');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentDept, setNewStudentDept] = useState('Computer Science Engineering');
  const [newStudentSem, setNewStudentSem] = useState('Semester 2');

  const [issueStudentId, setIssueStudentId] = useState<number>(1);
  const [issueEquipId, setIssueEquipId] = useState<number>(1);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [issueExpectedReturnDate, setIssueExpectedReturnDate] = useState<string>(
    addDays(new Date().toISOString().split('T')[0], 7)
  );

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Code Explorer States
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PROJECT_FILES[0] || {} as any);
  const [fileFilterCat, setFileFilterCat] = useState<string>('All');
  const [fileSearch, setFileSearch] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isMobileFileDrawerOpen, setIsMobileFileDrawerOpen] = useState(false);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Copy Snippet Helper
  const copyText = (text: string, snippetId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(snippetId);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // Derived Metrics & Stock Calculations
  const totalTypes = equipmentList.length;
  const totalQuantity = equipmentList.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const availableQuantity = equipmentList.reduce((acc, curr) => acc + curr.availableQuantity, 0);
  const activeLoans = issueList.filter(i => i.status === 'ISSUED');
  const currentlyIssued = activeLoans.reduce((acc, curr) => acc + curr.quantity, 0);
  const registeredStudentsCount = studentList.length;

  // Fine & Late Return Derived Metrics (₹5 / day rate)
  const overdueActiveLoans = activeLoans.filter(i => calculateDaysOverdue(i.expectedReturnDate) > 0);
  const allFinedIssues = issueList.filter(i => {
    if (i.fineWaived) return false;
    if (i.status === 'ISSUED') {
      return calculateDaysOverdue(i.expectedReturnDate) > 0;
    }
    return (i.fineAmount || 0) > 0;
  });

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

  const currentSelectedEquip = equipmentList.find(e => e.id === Number(issueEquipId)) || equipmentList[0] || {
    id: 1,
    name: 'Football',
    category: 'Outdoor',
    totalQuantity: 10,
    availableQuantity: 10,
    description: ''
  };

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
    showToast(`Added '${item.name}' to inventory! Total & available stock: ${item.totalQuantity} units.`, 'success');
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

  // Quick 1-click stock adjustment (useful after creating equipment)
  // Quick 1-click stock adjustment (useful after creating equipment)
  const handleQuickAddStock = (equipId: number, delta: number) => {
    let updatedName = '';
    let updatedTotal = 0;
    let updatedAvail = 0;

    setEquipmentList(prev =>
      prev.map(item => {
        if (item.id === equipId) {
          const currentlyIssued = Math.max(0, item.totalQuantity - item.availableQuantity);
          let newTotal = item.totalQuantity + delta;
          if (newTotal < currentlyIssued) {
            newTotal = currentlyIssued;
          }
          let newAvail = Math.max(0, item.availableQuantity + delta);
          if (newAvail + currentlyIssued > newTotal) {
            newTotal = newAvail + currentlyIssued;
          }
          updatedName = item.name;
          updatedTotal = newTotal;
          updatedAvail = newAvail;
          return { ...item, totalQuantity: newTotal, availableQuantity: newAvail };
        }
        return item;
      })
    );
    showToast(`Updated '${updatedName}' stock: Total ${updatedTotal}, Available ${updatedAvail} units (${delta > 0 ? '+' + delta : delta}).`, 'success');
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
      showToast(`Email already exists: ${newStudentEmail}`, 'error');
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
    showToast(`Student '${name}' deleted successfully.`, 'info');
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

    // Atomic update simulation (@Transactional)
    setEquipmentList(prev =>
      prev.map(item =>
        item.id === equip.id
          ? { ...item, availableQuantity: item.availableQuantity - issueQty }
          : item
      )
    );

    setIssueList([newIssue, ...issueList]);
    setIssueQty(1);
    showToast(`Issued ${issueQty} ${equip.name}(s) to ${student.fullName}! Due Date: ${returnDueDate} (Late fine: ₹5/day).`, 'success');
  };

  // Equipment Edit & Stock Adjustment Handlers
  const handleOpenEditEquip = (equip: EquipmentItem) => {
    setEditingEquip(equip);
    setEditEquipName(equip.name);
    setEditEquipCategory(equip.category);
    setEditEquipTotalQty(equip.totalQuantity);
    setEditEquipAvailQty(equip.availableQuantity);
    setEditEquipDesc(equip.description || '');
  };

  // Adjust total quantity in modal
  const adjustEditTotal = (delta: number) => {
    if (!editingEquip) return;
    const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const minTotal = Math.max(1, currentlyIssued);
    const nextTotal = Math.max(minTotal, editEquipTotalQty + delta);
    const diff = nextTotal - editEquipTotalQty;
    setEditEquipTotalQty(nextTotal);

    // If total increases, newly added units are immediately available!
    if (diff > 0) {
      setEditEquipAvailQty(prev => prev + diff);
    } else {
      // If total decreases, clamp available stock to not exceed nextTotal - currentlyIssued
      const maxAvail = Math.max(0, nextTotal - currentlyIssued);
      setEditEquipAvailQty(prev => Math.min(prev, maxAvail));
    }
  };

  // Adjust available quantity in modal
  const adjustEditAvail = (delta: number) => {
    if (!editingEquip) return;
    const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const nextAvail = Math.max(0, editEquipAvailQty + delta);
    setEditEquipAvailQty(nextAvail);

    // If available stock exceeds total minus issued, automatically increase total quantity!
    if (nextAvail + currentlyIssued > editEquipTotalQty) {
      setEditEquipTotalQty(nextAvail + currentlyIssued);
    }
  };

  // Conveniently add new stock to both total and available in 1-click
  const adjustBothTotalAndAvail = (delta: number) => {
    if (!editingEquip) return;
    const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    const nextTotal = Math.max(currentlyIssued || 1, editEquipTotalQty + delta);
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
    const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
    
    let finalTotal = parseInt(String(editEquipTotalQty), 10) || 1;
    let finalAvail = Math.max(0, parseInt(String(editEquipAvailQty), 10) || 0);

    // Safeguard 1: Total cannot be less than currently borrowed items
    if (finalTotal < currentlyIssued) {
      finalTotal = currentlyIssued;
    }

    // Safeguard 2: If user specified available stock + issued > total, expand total to fit seamlessly
    if (finalAvail + currentlyIssued > finalTotal) {
      finalTotal = finalAvail + currentlyIssued;
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
    showToast(`✅ Updated '${editEquipName.trim()}'! Total Stock: ${finalTotal}, Available: ${finalAvail} units.`, 'success');
  };

  // Return Equipment Actions - Direct, instant, and reliable with ₹5/day fine handling!
  const handleReturnEquipment = (issueId: number, customReturnDate?: string, collectFineNow: boolean = true) => {
    const issue = issueList.find(i => i.id === issueId);
    if (!issue || issue.status !== 'ISSUED') {
      showToast('This equipment has already been returned.', 'info');
      return;
    }

    const returnDateStr = customReturnDate || new Date().toISOString().split('T')[0];
    const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, returnDateStr);
    const calculatedFine = daysOverdue * FINE_PER_DAY;

    // 1. Replenish equipment stock in inventory
    setEquipmentList(prev =>
      prev.map(item =>
        item.id === issue.equipmentId
          ? { ...item, availableQuantity: Math.min(item.totalQuantity, item.availableQuantity + issue.quantity) }
          : item
      )
    );

    // 2. Mark issue as RETURNED with accurate fine record
    const isFinePaid = calculatedFine === 0 || collectFineNow;

    setIssueList(prev =>
      prev.map(item =>
        item.id === issue.id
          ? {
              ...item,
              status: 'RETURNED',
              returnDate: returnDateStr,
              fineAmount: calculatedFine,
              finePaid: isFinePaid,
              fineWaived: false
            }
          : item
      )
    );

    if (quickReturnIssueId === String(issueId)) {
      setQuickReturnIssueId('');
    }

    if (calculatedFine > 0) {
      if (isFinePaid) {
        // If collected, prompt receipt
        const student = studentList.find(s => s.id === issue.studentId);
        setActiveReceipt({
          receiptId: `RCP-${Date.now().toString().slice(-6)}`,
          issueId: issue.id,
          studentName: issue.studentName,
          studentDept: student?.department || 'Sports Department',
          equipmentName: issue.equipmentName,
          quantity: issue.quantity,
          issueDate: issue.issueDate,
          expectedReturnDate: issue.expectedReturnDate,
          returnDate: returnDateStr,
          daysOverdue: daysOverdue,
          fineAmount: calculatedFine,
          paidAt: new Date().toLocaleString(),
          paymentMethod: 'CASH_DESK'
        });
        showToast(`✅ Returned ${issue.equipmentName}! Collected ₹${calculatedFine} late fine (${daysOverdue} days @ ₹5/day). Receipt generated!`, 'success');
      } else {
        showToast(`⚠️ Returned ${issue.equipmentName}! Late fine of ₹${calculatedFine} (${daysOverdue} days @ ₹5/day) logged as UNPAID in Fine Section.`, 'info');
      }
    } else {
      showToast(`✅ Returned ${issue.quantity} ${issue.equipmentName}(s) from ${issue.studentName} on time! Fine: ₹0. Stock replenished.`, 'success');
    }
  };

  const handleQuickReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReturnIssueId) {
      showToast('Please select an active loan to return from the dropdown.', 'error');
      return;
    }
    handleReturnEquipment(Number(quickReturnIssueId), quickReturnDate, quickReturnCollectFine);
  };

  // Fine Management Actions
  const handleCollectFine = (issue: IssueItem, method: 'CASH_DESK' | 'UPI' | 'COLLEGE_CARD' = 'UPI') => {
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
      studentDept: student?.department || 'Sports Department',
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
    showToast(`💰 Fine of ₹${fine} collected for ${issue.studentName}! Digital receipt generated.`, 'success');
  };

  const handleWaiveFine = (issueId: number) => {
    setIssueList(prev =>
      prev.map(item =>
        item.id === issueId
          ? { ...item, fineWaived: true, finePaid: false, fineAmount: 0 }
          : item
      )
    );
    showToast(`🛡️ Late fine waived by College Sports Authority.`, 'info');
  };

  const handleSendFineReminder = (studentName: string, amount: number) => {
    showToast(`🔔 Official return and late fine notice (₹${amount}) dispatched to ${studentName}!`, 'info');
  };

  // Demo Data vs Fresh Empty State Controls
  const handleLoadSampleData = () => {
    setEquipmentList(SAMPLE_EQUIPMENT);
    setStudentList(SAMPLE_STUDENTS);
    setIssueList(SAMPLE_ISSUES);
    showToast('Loaded sample sports equipment, students, and active loans for testing!', 'success');
  };

  const handleResetToFresh = () => {
    setEquipmentList([]);
    setStudentList([]);
    setIssueList([]);
    setQuickReturnIssueId('');
    showToast('Reset to clean fresh state (0 equipment, 0 users). Ready for fresh demonstration!', 'info');
  };

  // ZIP Download Handler
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      showToast('Packaging project into ZIP file...', 'info');

      // Client-side packaging of all files into SportsEquipmentManagementSystem
      const zip = new JSZip();
      const folder = zip.folder('SportsEquipmentManagementSystem');
      PROJECT_FILES.forEach(f => {
        folder?.file(f.path, f.content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SportsEquipmentManagementSystem_Maven_Java21.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Project ZIP downloaded successfully!', 'success');
    } catch (err: any) {
      showToast('Error downloading ZIP: ' + err.message, 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCode = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      showToast('Code copied to clipboard!', 'info');
    }
  };

  // Filtered Lists
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
    const matchesSearch =
      issue.studentName.toLowerCase().includes(q) ||
      issue.equipmentName.toLowerCase().includes(q) ||
      issue.id.toString().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredFiles = PROJECT_FILES.filter(f => {
    const matchesCat = fileFilterCat === 'All' || f.category === fileFilterCat;
    const matchesSearch = !fileSearch || f.name.toLowerCase().includes(fileSearch.toLowerCase()) || f.path.toLowerCase().includes(fileSearch.toLowerCase());
    return matchesCat && matchesSearch;
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

      {/* Primary Top Bar - Responsive Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Identity */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-base sm:text-xl shadow-lg shadow-blue-500/25 shrink-0">
              ⚽
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">
                  Sports Equipment System
                </h1>
                <span className="hidden xl:inline-flex items-center space-x-1 text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Java 21 • Spring Boot • MySQL</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                CSE College Major Project • Team of 3 Students
              </p>
            </div>
          </div>

          {/* Mode Switchers & Download Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Toggle demo vs fresh empty state */}
            {equipmentList.length === 0 ? (
              <button
                onClick={handleLoadSampleData}
                className="bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700/80 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                title="Populate sample records for practice testing"
              >
                <span>🧪</span>
                <span className="hidden sm:inline">Load Demo Data</span>
                <span className="sm:hidden">Samples</span>
              </button>
            ) : (
              <button
                onClick={handleResetToFresh}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/80 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                title="Reset to 0 equipment and 0 users for fresh demonstration"
              >
                <span>✨</span>
                <span className="hidden sm:inline">Reset to Fresh</span>
                <span className="sm:hidden">Fresh</span>
              </button>
            )}

            {/* Download Project ZIP button */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center space-x-1 sm:space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              title="Download Complete Maven Project for IntelliJ IDEA"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isZipping ? 'Zipping...' : 'Download ZIP'}</span>
              <span className="sm:hidden text-[11px]">{isZipping ? '...' : 'ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs Bar - Accessible on all screen sizes */}
        <div className="border-t border-slate-800/80 bg-slate-950/70 px-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1.5 scrollbar-none">
            {[
              { id: 'app', label: 'Web Application', icon: '🖥️' },
              { id: 'code', label: `Source Code (${PROJECT_FILES.length})`, icon: '📁' },
              { id: 'viva', label: 'Viva Voce Guide', icon: '🎓' },
              { id: 'guide', label: 'Setup & Run', icon: '🚀' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                  activeView === tab.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Responsive Shell */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 md:p-6 flex flex-col">
        {/* ========================================================================= */}
        {/* 1. INTERACTIVE RESPONSIVE WEB APPLICATION                                 */}
        {/* ========================================================================= */}
        {activeView === 'app' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row flex-1">
            {/* Mobile Sidebar Overlay Backdrop */}
            {isMobileSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Sidebar Navigation */}
            <aside
              className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
                isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
              }`}
            >
              <div>
                {/* Mobile Sidebar Header */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 md:hidden mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚽</span>
                    <span className="font-bold text-white text-sm">SPORTS DESK</span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sidebar Brand on Desktop */}
                <div className="hidden md:block pb-4 mb-4 border-b border-slate-800/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">College Inventory</div>
                  <div className="text-base font-extrabold text-white flex items-center justify-between">
                    <span>SPORTS DESK</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">v1.0</span>
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'equipment', label: 'Equipment Inventory', icon: Dumbbell },
                    { id: 'students', label: 'Registered Students', icon: GraduationCap },
                    { id: 'issue', label: 'Issue Equipment', icon: ArrowUpRight },
                    { id: 'return', label: 'Return Equipment', icon: ArrowDownLeft },
                    {
                      id: 'fines',
                      label: 'Fine Section (₹5/day)',
                      icon: IndianRupee,
                      badge: totalFinePending > 0 ? `₹${totalFinePending}` : (overdueActiveLoans.length > 0 ? `${overdueActiveLoans.length}` : null)
                    }
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activePage === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActivePage(tab.id as any);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.badge && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>MySQL Database</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-mono text-emerald-400 text-[10px] mt-0.5 truncate">sports_equipment_db</div>
                </div>
                <div className="text-[10px] text-slate-500 text-center">
                  Spring Boot REST API • Port 8080
                </div>
              </div>
            </aside>

            {/* Main Application Content Area */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden min-w-0">
              {/* Top Navigation Inside App View */}
              <div className="bg-slate-900/60 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/80 flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-1.5 sm:p-2 bg-slate-800 text-slate-300 rounded-lg md:hidden hover:text-white shrink-0"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm md:text-base font-bold text-white capitalize truncate">
                      {activePage === 'dashboard' && 'Live Inventory Dashboard'}
                      {activePage === 'equipment' && 'Equipment Management'}
                      {activePage === 'students' && 'Student Management'}
                      {activePage === 'issue' && 'Issue Equipment Module'}
                      {activePage === 'return' && 'Return Borrowed Equipment'}
                      {activePage === 'fines' && 'Late Return Fine & Penalty Section'}
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">
                      {activePage === 'dashboard' && 'Aggregated statistics and recent transactions from MySQL'}
                      {activePage === 'equipment' && 'Catalog of college sports goods with stock verification'}
                      {activePage === 'students' && 'Authorized college students eligible to borrow equipment'}
                      {activePage === 'issue' && 'Atomic database transaction with stock decrement'}
                      {activePage === 'return' && 'Active borrower records pending equipment return'}
                      {activePage === 'fines' && 'Enforces college policy: ₹5 per day penalty for late returns'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                  <span className="hidden md:inline-flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>REST: 8080</span>
                  </span>
                  <button
                    onClick={() => showToast('Refreshed data from Spring Boot backend.', 'info')}
                    className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 border border-slate-700/80 cursor-pointer"
                    title="Refresh data"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Mobile Quick Navigation Bar (Tabs for phones) */}
              <div className="md:hidden bg-slate-900 border-b border-slate-800/80 px-2 py-1.5 flex items-center space-x-1 overflow-x-auto scrollbar-none">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'equipment', label: 'Equipment', icon: Dumbbell },
                  { id: 'students', label: 'Students', icon: GraduationCap },
                  { id: 'issue', label: 'Issue', icon: ArrowUpRight },
                  { id: 'return', label: 'Return', icon: ArrowDownLeft },
                  { id: 'fines', label: 'Fines (₹5)', icon: IndianRupee }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activePage === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActivePage(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Page Contents */}
              <div className="p-3 sm:p-5 md:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
                {/* 1. DASHBOARD PAGE */}
                {activePage === 'dashboard' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* 5 KPI Cards Grid - Fully Responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-blue-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Equipment Types</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1">{totalTypes}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Distinct catalog items</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Quantity</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mt-1">{totalQuantity}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Total college units</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-sky-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Available Stock</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-sky-400 mt-1">{availableQuantity}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Ready for checkout</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Currently Issued</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-400 mt-1">{currentlyIssued}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Active student loans</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-sm relative overflow-hidden col-span-2 sm:col-span-1">
                        <div className="h-1 bg-purple-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">Registered Students</div>
                        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-purple-400 mt-1">{registeredStudentsCount}</div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate">Authorized borrowers</div>
                      </div>
                    </div>

                    {/* Dual Tables Grid: Recent Transactions & Inventory Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Recent Transactions */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Recent Transactions</h3>
                          <span className="text-[11px] text-slate-400">Latest loan activity</span>
                        </div>
                        <div className="overflow-x-auto -mx-3.5 sm:mx-0 flex-1">
                          <table className="w-full text-xs text-left min-w-[340px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">ID</th>
                                <th className="py-2 px-3">Student</th>
                                <th className="py-2 px-3">Equipment</th>
                                <th className="py-2 px-3 text-center">Qty</th>
                                <th className="py-2 px-3">Status</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {issueList.length > 0 ? (
                                issueList.slice(0, 6).map(i => (
                                  <tr key={i.id} className="hover:bg-slate-800/40">
                                    <td className="py-2.5 px-3 font-mono text-slate-400">#{i.id}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-200">{i.studentName}</td>
                                    <td className="py-2.5 px-3 text-slate-400">{i.equipmentName}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-white">{i.quantity}</td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          i.status === 'ISSUED'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                      >
                                        {i.status}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {i.status === 'ISSUED' ? (
                                        <button
                                          onClick={() => handleReturnEquipment(i.id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition-all cursor-pointer inline-flex items-center space-x-1"
                                          title="Return & Replenish Stock"
                                        >
                                          <ArrowDownLeft className="w-3 h-3" />
                                          <span>Return</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 italic">Done</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="py-6 text-center text-slate-500 text-[11px]">
                                    ✨ Fresh database. No transactions yet. Issue equipment to record borrowings.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Equipment Inventory Summary */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Equipment Inventory Summary</h3>
                          <span className="text-[11px] text-slate-400">Current stock balance</span>
                        </div>
                        <div className="overflow-x-auto -mx-3.5 sm:mx-0 flex-1">
                          <table className="w-full text-xs text-left min-w-[380px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Equipment</th>
                                <th className="py-2 px-3">Category</th>
                                <th className="py-2 px-3 text-center">Total</th>
                                <th className="py-2 px-3 text-center">Avail</th>
                                <th className="py-2 px-3 text-center">Issued</th>
                                <th className="py-2 px-3 text-right">Edit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {equipmentList.map(eq => {
                                const issuedCount = eq.totalQuantity - eq.availableQuantity;
                                return (
                                  <tr key={eq.id} className="hover:bg-slate-800/40">
                                    <td className="py-2.5 px-3 font-semibold text-slate-200">{eq.name}</td>
                                    <td className="py-2.5 px-3">
                                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                        {eq.category}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{eq.totalQuantity}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{eq.availableQuantity}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-amber-400">{issuedCount}</td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        onClick={() => handleOpenEditEquip(eq)}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center space-x-1"
                                        title="Edit total quantity and available stock"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EQUIPMENT MANAGEMENT PAGE */}
                {activePage === 'equipment' && (
                  <div className="space-y-4">
                    {/* Total Equipment Inventory Summary & Quick Stock Editor Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1.5">
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Total Stock &amp; Inventory Control</span>
                            </span>
                            <span className="text-xs text-slate-400">Total &amp; Available Stock</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center space-x-2">
                            <span>📦</span>
                            <span>Total Equipment Section • Stock &amp; Availability Editor</span>
                          </h3>
                          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                            Edit total equipment quantities or adjust available shelf stock anytime after creating new equipment.
                            Click <strong className="text-blue-400">"Edit Stock"</strong> on any item to modify total units owned or available quantity, or use the quick <strong className="text-emerald-400">+1 / -1 buttons</strong>.
                          </p>
                        </div>

                        {/* Quick Stats Badges */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
                          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-center min-w-[85px]">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Total Units</div>
                            <div className="text-base sm:text-lg font-extrabold text-white">{totalQuantity}</div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-center min-w-[85px]">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Available</div>
                            <div className="text-base sm:text-lg font-extrabold text-emerald-400">{availableQuantity}</div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-center min-w-[85px]">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Issued</div>
                            <div className="text-base sm:text-lg font-extrabold text-amber-400">{currentlyIssued}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Responsive Toolbar */}
                    <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                        {/* Search input */}
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search equipment by name..."
                            value={equipSearchQuery}
                            onChange={e => setEquipSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        </div>

                        {/* Category Dropdown */}
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                          <Filter className="w-3.5 h-3.5 shrink-0" />
                          <select
                            value={equipCategoryFilter}
                            onChange={e => setEquipCategoryFilter(e.target.value)}
                            className="w-full sm:w-auto bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="All">All Categories</option>
                            <option value="Indoor">Indoor</option>
                            <option value="Outdoor">Outdoor</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Athletics">Athletics</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* View toggle (cards vs table) */}
                        <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
                          <button
                            onClick={() => setEquipViewMode('cards')}
                            className={`p-1.5 rounded text-xs ${equipViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Card Grid View"
                          >
                            <Grid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEquipViewMode('table')}
                            className={`p-1.5 rounded text-xs ${equipViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Table View"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => setIsAddEquipModalOpen(true)}
                          className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Equipment</span>
                        </button>
                      </div>
                    </div>

                    {/* Equipment Cards View (Default mobile/compact friendly) */}
                    {equipViewMode === 'cards' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredEquipment.length > 0 ? (
                          filteredEquipment.map(eq => {
                            const percent = Math.round((eq.availableQuantity / eq.totalQuantity) * 100);
                            return (
                              <div key={eq.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <span className="text-[10px] font-mono text-slate-500">#{eq.id}</span>
                                      <h4 className="text-sm font-bold text-white leading-tight">{eq.name}</h4>
                                    </div>
                                    <span className="bg-slate-800 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] shrink-0">
                                      {eq.category}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                                    {eq.description || 'No description provided.'}
                                  </p>

                                  {/* Stock progress */}
                                  <div className="space-y-1 mb-3">
                                    <div className="flex justify-between text-[11px]">
                                      <span className="text-slate-400">Available:</span>
                                      <span className={`font-bold ${eq.availableQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {eq.availableQuantity} / {eq.totalQuantity} units
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${eq.availableQuantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                 <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>Borrowed: <strong className="text-amber-400">{eq.totalQuantity - eq.availableQuantity}</strong></span>
                                    <span>Total: <strong className="text-white">{eq.totalQuantity}</strong></span>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 pt-1">
                                    {/* Quick Stock Bump */}
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => handleQuickAddStock(eq.id, -1)}
                                        className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white px-1.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border border-slate-700/60"
                                        title="Quick decrease 1 unit from stock"
                                      >
                                        -1
                                      </button>
                                      <button
                                        onClick={() => handleQuickAddStock(eq.id, 1)}
                                        className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border border-slate-700/60"
                                        title="Quick add +1 unit to total and available stock"
                                      >
                                        +1 Stock
                                      </button>
                                      <button
                                        onClick={() => handleQuickAddStock(eq.id, 5)}
                                        className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 hover:text-emerald-300 px-1.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border border-slate-700/60"
                                        title="Quick add +5 units to total and available stock"
                                      >
                                        +5
                                      </button>
                                    </div>

                                    {/* Edit & Delete Action */}
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => handleOpenEditEquip(eq)}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 transition-all cursor-pointer font-bold shadow-xs"
                                        title="Edit equipment details, total quantity, and stock availability"
                                      >
                                        <Pencil className="w-3 h-3" />
                                        <span>Edit Stock</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                                        title="Delete equipment"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                            No equipment found matching criteria.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Equipment Table View */}
                    {equipViewMode === 'table' && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left min-w-[620px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-3 px-3.5">ID</th>
                                <th className="py-3 px-3.5">Equipment Name</th>
                                <th className="py-3 px-3.5">Category</th>
                                <th className="py-3 px-3.5 text-center">Total Qty</th>
                                <th className="py-3 px-3.5 text-center">Available Stock</th>
                                <th className="py-3 px-3.5">Description</th>
                                <th className="py-3 px-3.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filteredEquipment.length > 0 ? (
                                filteredEquipment.map(eq => (
                                  <tr key={eq.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 px-3.5 font-mono text-slate-500">#{eq.id}</td>
                                    <td className="py-3 px-3.5 font-bold text-white">{eq.name}</td>
                                    <td className="py-3 px-3.5">
                                      <span className="bg-slate-800/80 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded text-[10px]">
                                        {eq.category}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-center font-semibold text-slate-300">{eq.totalQuantity}</td>
                                    <td className="py-3 px-3.5 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                                          eq.availableQuantity > 0
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        }`}
                                      >
                                        {eq.availableQuantity} units
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-slate-400 max-w-xs truncate">{eq.description || '-'}</td>
                                    <td className="py-3 px-3.5 text-right">
                                       <div className="flex items-center justify-end space-x-1.5">
                                        <button
                                          onClick={() => handleQuickAddStock(eq.id, -1)}
                                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-1.5 py-1 rounded text-[11px] transition-colors cursor-pointer border border-slate-700/60"
                                          title="Quick remove 1 unit from stock"
                                        >
                                          -1
                                        </button>
                                        <button
                                          onClick={() => handleQuickAddStock(eq.id, 1)}
                                          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-2 py-1 rounded text-[11px] transition-colors cursor-pointer border border-slate-700/60"
                                          title="Quick add +1 unit to inventory and available stock"
                                        >
                                          +1 Stock
                                        </button>
                                        <button
                                          onClick={() => handleQuickAddStock(eq.id, 5)}
                                          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold px-1.5 py-1 rounded text-[11px] transition-colors cursor-pointer border border-slate-700/60"
                                          title="Quick add +5 units to stock"
                                        >
                                          +5
                                        </button>
                                        <button
                                          onClick={() => handleOpenEditEquip(eq)}
                                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                                          title="Edit Equipment & Stock"
                                        >
                                          <Pencil className="w-3 h-3" />
                                          <span>Edit Stock</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Delete Equipment"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-slate-500">
                                    No equipment found matching criteria.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STUDENT MANAGEMENT PAGE */}
                {activePage === 'students' && (
                  <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search student by name, email, or department..."
                          value={studentSearchQuery}
                          onChange={e => setStudentSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* View toggle */}
                        <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center">
                          <button
                            onClick={() => setStudentViewMode('cards')}
                            className={`p-1.5 rounded text-xs ${studentViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Card Grid View"
                          >
                            <Grid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStudentViewMode('table')}
                            className={`p-1.5 rounded text-xs ${studentViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Table View"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => setIsAddStudentModalOpen(true)}
                          className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Register Student</span>
                        </button>
                      </div>
                    </div>

                    {/* Students Cards View */}
                    {studentViewMode === 'cards' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map(s => (
                            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <span className="text-[10px] font-mono text-slate-500">ID #{s.id}</span>
                                    <h4 className="text-sm font-bold text-white leading-tight">{s.fullName}</h4>
                                  </div>
                                  <span className="bg-slate-800 text-emerald-400 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] shrink-0 font-medium">
                                    {s.classSemester}
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-xs mb-3">
                                  <div className="text-slate-400 flex items-center space-x-1.5">
                                    <span className="text-slate-500 text-[10px]">DEPT:</span>
                                    <span className="font-medium text-slate-300">{s.department}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center space-x-1.5 truncate">
                                    <span className="text-slate-500 text-[10px]">EMAIL:</span>
                                    <span className="font-mono text-blue-400 text-[11px] truncate">{s.email}</span>
                                  </div>
                                  <div className="text-slate-400 flex items-center space-x-1.5">
                                    <span className="text-slate-500 text-[10px]">PHONE:</span>
                                    <span className="font-mono text-slate-300 text-[11px]">{s.phone}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500">Authorized Borrower</span>
                                <button
                                  onClick={() => handleDeleteStudent(s.id, s.fullName)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                                  title="Delete student"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                            No students found matching criteria.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Students Table View */}
                    {studentViewMode === 'table' && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left min-w-[620px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-3 px-3.5">ID</th>
                                <th className="py-3 px-3.5">Full Name</th>
                                <th className="py-3 px-3.5">College Email</th>
                                <th className="py-3 px-3.5">Phone Number</th>
                                <th className="py-3 px-3.5">Department</th>
                                <th className="py-3 px-3.5">Class / Semester</th>
                                <th className="py-3 px-3.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filteredStudents.length > 0 ? (
                                filteredStudents.map(s => (
                                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 px-3.5 font-mono text-slate-500">#{s.id}</td>
                                    <td className="py-3 px-3.5 font-bold text-white">{s.fullName}</td>
                                    <td className="py-3 px-3.5 font-mono text-blue-400 text-[11px]">{s.email}</td>
                                    <td className="py-3 px-3.5 font-mono text-slate-400">{s.phone}</td>
                                    <td className="py-3 px-3.5 text-slate-300">{s.department}</td>
                                    <td className="py-3 px-3.5 text-slate-400">{s.classSemester}</td>
                                    <td className="py-3 px-3.5 text-right">
                                      <button
                                        onClick={() => handleDeleteStudent(s.id, s.fullName)}
                                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Student"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-slate-500">
                                    No registered students found matching criteria.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. ISSUE EQUIPMENT PAGE */}
                {activePage === 'issue' && (
                  <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center space-x-2.5 pb-4 mb-4 border-b border-slate-800">
                        <ArrowUpRight className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Issue Equipment to Student</h3>
                          <p className="text-[11px] text-slate-400">Enforces atomic stock check and database transaction</p>
                        </div>
                      </div>

                      <form onSubmit={handleIssueEquipment} className="space-y-4 text-xs">
                        {/* Student selection */}
                        <div>
                          <label className="block text-slate-300 font-bold mb-1.5">Select Student: *</label>
                          <select
                            value={issueStudentId}
                            onChange={e => setIssueStudentId(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          >
                            {studentList.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.fullName} ({s.department}) - ID #{s.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Equipment selection */}
                        <div>
                          <label className="block text-slate-300 font-bold mb-1.5">Select Equipment: *</label>
                          <select
                            value={issueEquipId}
                            onChange={e => setIssueEquipId(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                          >
                            {equipmentList.map(eq => (
                              <option key={eq.id} value={eq.id}>
                                {eq.name} [{eq.category}] — Avail: {eq.availableQuantity} of {eq.totalQuantity}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stock Preview & Quantity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1.5">Current Stock Available:</label>
                            <div
                              className={`p-2.5 rounded-lg border font-bold text-center ${
                                currentSelectedEquip.availableQuantity > 0
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {currentSelectedEquip.availableQuantity} units available
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold mb-1.5">Quantity to Issue: *</label>
                            <input
                              type="number"
                              min={1}
                              max={currentSelectedEquip.availableQuantity || 1}
                              value={issueQty}
                              onChange={e => setIssueQty(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-bold text-center focus:outline-none focus:border-blue-500 text-xs"
                              required
                            />
                          </div>
                        </div>

                        {/* Issue Date & Expected Return Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-slate-300 font-bold mb-1.5">Issue Date (YYYY-MM-DD): *</label>
                            <input
                              type="date"
                              value={issueDate}
                              onChange={e => {
                                setIssueDate(e.target.value);
                                setIssueExpectedReturnDate(addDays(e.target.value, 7));
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-medium"
                              required
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-slate-300 font-bold">Expected Return Date: *</label>
                              <span className="text-[10px] text-amber-400 font-semibold">Fine: ₹5/day after this</span>
                            </div>
                            <input
                              type="date"
                              min={issueDate}
                              value={issueExpectedReturnDate}
                              onChange={e => setIssueExpectedReturnDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-bold"
                              required
                            />
                            {/* Quick Days Selector */}
                            <div className="flex items-center space-x-1.5 mt-1.5">
                              <span className="text-[10px] text-slate-500">Preset:</span>
                              {[
                                { label: '+3 Days', days: 3 },
                                { label: '+7 Days', days: 7 },
                                { label: '+14 Days', days: 14 }
                              ].map(p => (
                                <button
                                  key={p.days}
                                  type="button"
                                  onClick={() => setIssueExpectedReturnDate(addDays(issueDate, p.days))}
                                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* College Fine Notice Box */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-start space-x-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-white text-[11px] block">College Sports Late Return Policy (₹5 / Day)</span>
                            <span className="text-[11px] text-amber-300/90 leading-relaxed block">
                              Students must return equipment within the scheduled return date. If delayed by 1 day, ₹5 fine is charged; if delayed by 2 days, ₹10 fine, and so on at ₹5 per day. Fines are visible to both student and admin.
                            </span>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={currentSelectedEquip.availableQuantity <= 0}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center space-x-2"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                            <span>Confirm &amp; Record Issue</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* 5. RETURN EQUIPMENT PAGE (FULLY RESPONSIVE) */}
                {activePage === 'return' && (
                  <div className="space-y-4">
                    {/* Header & Quick Stats */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                          <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                            Active Borrowing &amp; Return Ledger
                          </h3>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                          Equipment currently issued to students pending return and stock replenishment
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap">
                        {overdueActiveLoans.length > 0 && (
                          <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center space-x-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                            <span>{overdueActiveLoans.length} Overdue (₹5/day)</span>
                          </span>
                        )}
                        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full font-bold flex items-center space-x-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>{activeLoans.length} Pending Return</span>
                        </span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-full font-bold hidden xs:inline-flex shrink-0">
                          <span>{currentlyIssued} Units Out</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Return Transaction Form */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-emerald-400 font-bold">📥</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">Process Equipment Return</h4>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">— Select an active loan to replenish stock</span>
                      </div>
                      <form onSubmit={handleQuickReturnSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-slate-300 font-bold mb-1 text-[11px]">Select Active Loan to Return: *</label>
                            <select
                              value={quickReturnIssueId}
                              onChange={e => setQuickReturnIssueId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                              required
                            >
                              <option value="">-- Choose Active Loan ({activeLoans.length} pending) --</option>
                              {activeLoans.map(issue => {
                                const isOverdue = calculateDaysOverdue(issue.expectedReturnDate) > 0;
                                return (
                                  <option key={issue.id} value={issue.id}>
                                    Loan #{issue.id}: {issue.studentName} — {issue.equipmentName} ({issue.quantity} units, Due: {issue.expectedReturnDate}) {isOverdue ? '⚠️ OVERDUE' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 font-bold mb-1 text-[11px]">Return Date: *</label>
                            <input
                              type="date"
                              value={quickReturnDate}
                              onChange={e => setQuickReturnDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        {quickReturnIssueId && (() => {
                          const sel = issueList.find(i => i.id === Number(quickReturnIssueId));
                          if (!sel) return null;
                          const daysOverdue = calculateDaysOverdue(sel.expectedReturnDate, quickReturnDate);
                          const fine = daysOverdue * FINE_PER_DAY;
                          return (
                            <div className="space-y-2">
                              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                                <span>Borrower: <strong className="text-blue-400">{sel.studentName}</strong></span>
                                <span>Equipment: <strong className="text-emerald-400">{sel.equipmentName}</strong></span>
                                <span>Qty: <strong className="text-amber-400">{sel.quantity} unit(s)</strong></span>
                                <span>Issued: <strong className="text-slate-300">{sel.issueDate}</strong></span>
                                <span>Returning Due Date: <strong className="text-purple-400">{sel.expectedReturnDate}</strong></span>
                              </div>

                              {daysOverdue > 0 ? (
                                <div className="bg-rose-500/15 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-300 flex items-start space-x-2.5">
                                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 space-y-1">
                                    <div className="font-bold text-rose-200">
                                      ⚠️ Overdue Return Alert: Delayed by {daysOverdue} Day{daysOverdue > 1 ? 's' : ''}!
                                    </div>
                                    <div className="text-[11px] text-rose-300">
                                      Late Fine Calculation: {daysOverdue} days × ₹5/day = <strong className="text-white text-xs underline font-mono">₹{fine} Fine Due</strong>
                                    </div>
                                    <label className="flex items-center space-x-2 mt-2 cursor-pointer text-white font-medium text-xs">
                                      <input
                                        type="checkbox"
                                        checked={quickReturnCollectFine}
                                        onChange={e => setQuickReturnCollectFine(e.target.checked)}
                                        className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                                      />
                                      <span>Collect late fee of ₹{fine} and generate digital receipt now</span>
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-400 flex items-center space-x-2">
                                  <span>✅ Returning on or before due date. Fine amount: ₹0.00 (No late fee).</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <button
                          type="submit"
                          disabled={activeLoans.length === 0}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>Return Equipment &amp; Replenish Stock</span>
                        </button>
                      </form>
                    </div>

                    {/* Responsive Toolbar with Search, Status Filter & View Toggle */}
                    <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Search borrower name, equipment, or loan #..."
                          value={returnSearchQuery}
                          onChange={e => setReturnSearchQuery(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                      </div>

                      {/* Status Pills & Layout Switcher */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 overflow-x-auto scrollbar-none">
                        {/* Status Filter Pills */}
                        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                          <button
                            onClick={() => setReturnStatusFilter('ISSUED')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              returnStatusFilter === 'ISSUED'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Pending ({activeLoans.length})
                          </button>
                          <button
                            onClick={() => setReturnStatusFilter('ALL')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              returnStatusFilter === 'ALL'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            All ({issueList.length})
                          </button>
                          <button
                            onClick={() => setReturnStatusFilter('RETURNED')}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              returnStatusFilter === 'RETURNED'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Returned ({issueList.filter(i => i.status === 'RETURNED').length})
                          </button>
                        </div>

                        {/* View Switcher: Cards vs Table */}
                        <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center shrink-0">
                          <button
                            onClick={() => setReturnViewMode('cards')}
                            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                              returnViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Card View (Mobile Optimized)"
                          >
                            <Grid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setReturnViewMode('table')}
                            className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                              returnViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Table View (Full Columns)"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CARD GRID VIEW (Mobile-first, touch-friendly, no sideways scrolling needed!) */}
                    {returnViewMode === 'cards' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredIssues.length > 0 ? (
                          filteredIssues.map(issue => {
                            const isIssued = issue.status === 'ISSUED';
                            return (
                              <div
                                key={issue.id}
                                className={`border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all ${
                                  isIssued
                                    ? 'bg-slate-900 border-amber-500/30 hover:border-amber-500/60 shadow-sm'
                                    : 'bg-slate-900/60 border-slate-800 opacity-80'
                                }`}
                              >
                                <div>
                                  {/* Header with Loan ID and Status */}
                                  <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                      Loan #{issue.id}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isIssued
                                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      }`}
                                    >
                                      {isIssued ? '⏳ Pending Return' : '✓ Returned'}
                                    </span>
                                  </div>

                                  {/* Equipment Info */}
                                  <div className="mb-2.5">
                                    <div className="text-[10px] uppercase font-bold text-slate-500">Equipment Item</div>
                                    <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight flex items-center space-x-1.5 mt-0.5">
                                      <span>⚽</span>
                                      <span className="truncate">{issue.equipmentName}</span>
                                    </h4>
                                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                                      {issue.quantity} {issue.quantity > 1 ? 'units' : 'unit'} borrowed
                                    </div>
                                  </div>

                                  {/* Borrower and Date Details */}
                                  <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800/80 mb-3 space-y-1.5 text-xs">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Student Borrower</span>
                                      <span className="font-bold text-slate-200 flex items-center space-x-1 mt-0.5">
                                        <span>🎓</span>
                                        <span className="truncate">{issue.studentName}</span>
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                                      <span>Issue Date:</span>
                                      <span className="font-mono text-slate-300">{issue.issueDate}</span>
                                    </div>
                                    {!isIssued && issue.returnDate && (
                                      <div className="flex items-center justify-between text-[11px] text-emerald-400">
                                        <span>Return Date:</span>
                                        <span className="font-mono">{issue.returnDate}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Button */}
                                <div>
                                  {isIssued ? (
                                    <button
                                      onClick={() => handleReturnEquipment(issue.id)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-2.5 px-3 rounded-lg text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                                    >
                                      <ArrowDownLeft className="w-4 h-4 shrink-0" />
                                      <span>Return &amp; Replenish Stock</span>
                                    </button>
                                  ) : (
                                    <div className="text-center py-2 text-[11px] text-slate-500 italic bg-slate-950/40 rounded-lg border border-slate-800/50">
                                      Returned ({issue.returnDate || 'Completed'})
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
                            {returnStatusFilter === 'ISSUED'
                              ? '🎉 No active loans pending return! All equipment is currently checked in.'
                              : 'No issue records found matching criteria.'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TABLE VIEW (Scrollable for desktop / wide viewports) */}
                    {returnViewMode === 'table' && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left min-w-[580px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-3 px-3.5">Issue ID</th>
                                <th className="py-3 px-3.5">Student Name</th>
                                <th className="py-3 px-3.5">Equipment Name</th>
                                <th className="py-3 px-3.5 text-center">Quantity</th>
                                <th className="py-3 px-3.5">Issue Date</th>
                                <th className="py-3 px-3.5">Status</th>
                                <th className="py-3 px-3.5 text-right">Return Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {filteredIssues.length > 0 ? (
                                filteredIssues.map(issue => (
                                  <tr key={issue.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 px-3.5 font-mono text-slate-500">#{issue.id}</td>
                                    <td className="py-3 px-3.5 font-bold text-white">{issue.studentName}</td>
                                    <td className="py-3 px-3.5 font-medium text-slate-300">{issue.equipmentName}</td>
                                    <td className="py-3 px-3.5 text-center font-bold text-white">{issue.quantity}</td>
                                    <td className="py-3 px-3.5 font-mono text-slate-400">{issue.issueDate}</td>
                                    <td className="py-3 px-3.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                          issue.status === 'ISSUED'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}
                                      >
                                        {issue.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-right">
                                      {issue.status === 'ISSUED' ? (
                                        <button
                                          onClick={() => handleReturnEquipment(issue.id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all inline-flex items-center space-x-1 cursor-pointer"
                                        >
                                          <ArrowDownLeft className="w-3.5 h-3.5" />
                                          <span>Return Equipment</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-slate-500 italic">
                                          Returned ({issue.returnDate || 'Completed'})
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-slate-500">
                                    {returnStatusFilter === 'ISSUED'
                                      ? 'No active equipment issues pending return.'
                                      : 'No transactions found matching criteria.'}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. FINE & PENALTY SECTION (₹5 / DAY) */}
                {activePage === 'fines' && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Policy Banner with Role Switcher */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1.5">
                              <Coins className="w-3.5 h-3.5 text-rose-400" />
                              <span>Fine Policy: ₹5 per day late return</span>
                            </span>
                            <span className="text-xs text-slate-400">College Sports Regulations</span>
                          </div>
                          <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                            <span>💰</span>
                            <span>Equipment Delay Fine &amp; Penalty Counter</span>
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Under college guidelines, students must return equipment on or before the designated return date.
                            If delayed by <strong className="text-amber-400">1 day, a fine of ₹5 is charged; 2 days = ₹10; 3 days = ₹15</strong>,
                            and so on at <strong className="text-emerald-400">₹5/day</strong>.
                            Fines are transparently calculated and visible to both Admin and Student.
                          </p>
                        </div>

                        {/* Role View Toggle: Admin View vs Student View */}
                        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center self-start lg:self-auto shrink-0 shadow-inner">
                          <button
                            onClick={() => setFineViewRole('admin')}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                              fineViewRole === 'admin'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>🛡️</span>
                            <span>Admin View</span>
                          </button>
                          <button
                            onClick={() => setFineViewRole('student')}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                              fineViewRole === 'student'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>🎓</span>
                            <span>Student View</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Fine Statistics KPI Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-rose-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          Pending Fines
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1 flex items-baseline space-x-0.5">
                          <span>₹{totalFinePending}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">Total uncollected late dues</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          Fines Collected
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 flex items-baseline space-x-0.5">
                          <span>₹{totalFineCollected}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">Received &amp; receipted</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          Overdue Loans
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">
                          {overdueActiveLoans.length}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">Delayed past return date</div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl shadow-sm relative overflow-hidden">
                        <div className="h-1 bg-blue-500 absolute top-0 left-0 right-0"></div>
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                          Fine Rate
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-blue-400 mt-1">
                          ₹5 / Day
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">Per day beyond due date</div>
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* 6A. ADMIN VIEW: COMPLETE OVERDUE & FINE MANAGEMENT        */}
                    {/* ========================================================= */}
                    {fineViewRole === 'admin' && (
                      <div className="space-y-4">
                        {/* Admin Toolbar with Search, Status Filter & View Toggle */}
                        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
                          <div className="relative flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="Search fine records by student name, roll, or equipment..."
                              value={fineSearchQuery}
                              onChange={e => setFineSearchQuery(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                          </div>

                          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
                            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                              {[
                                { id: 'ALL', label: `All (${issueList.length})` },
                                { id: 'PENDING', label: `Pending Fines (${issueList.filter(i => !i.finePaid && !i.fineWaived && computeIssueFine(i) > 0).length})` },
                                { id: 'OVERDUE', label: `Overdue Active (${overdueActiveLoans.length})` },
                                { id: 'PAID', label: `Paid (${issueList.filter(i => i.finePaid && (i.fineAmount || 0) > 0).length})` }
                              ].map(f => (
                                <button
                                  key={f.id}
                                  onClick={() => setFineStatusFilter(f.id as any)}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                                    fineStatusFilter === f.id
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>

                            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center shrink-0">
                              <button
                                onClick={() => setFineViewMode('cards')}
                                className={`p-1.5 rounded text-xs cursor-pointer ${fineViewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Card View"
                              >
                                <Grid className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setFineViewMode('table')}
                                className={`p-1.5 rounded text-xs cursor-pointer ${fineViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Table View"
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Admin Cards View */}
                        {fineViewMode === 'cards' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {(() => {
                              const list = issueList.filter(issue => {
                                const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                                const fine = computeIssueFine(issue);

                                if (fineStatusFilter === 'PENDING') {
                                  if (issue.finePaid || issue.fineWaived || fine <= 0) return false;
                                } else if (fineStatusFilter === 'OVERDUE') {
                                  if (issue.status !== 'ISSUED' || daysOverdue <= 0) return false;
                                } else if (fineStatusFilter === 'PAID') {
                                  if (!issue.finePaid || (issue.fineAmount || 0) <= 0) return false;
                                }

                                if (fineSearchQuery) {
                                  const q = fineSearchQuery.toLowerCase().trim();
                                  return (
                                    issue.studentName.toLowerCase().includes(q) ||
                                    issue.equipmentName.toLowerCase().includes(q) ||
                                    issue.id.toString().includes(q)
                                  );
                                }
                                return true;
                              });

                              if (list.length === 0) {
                                return (
                                  <div className="col-span-full py-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
                                    No fine records found matching the selected filter.
                                  </div>
                                );
                              }

                              return list.map(issue => {
                                const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                                const fine = computeIssueFine(issue);
                                const isOverdue = daysOverdue > 0;
                                const isPaid = issue.finePaid;
                                const isWaived = issue.fineWaived;

                                return (
                                  <div
                                    key={issue.id}
                                    className={`border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all ${
                                      isOverdue && !isPaid && !isWaived
                                        ? 'bg-slate-900 border-rose-500/30 hover:border-rose-500/60 shadow-sm'
                                        : 'bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <div>
                                      {/* Header with Loan ID & Status */}
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                          Loan #{issue.id}
                                        </span>
                                        {isWaived ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                            Waived
                                          </span>
                                        ) : isPaid ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            ✓ Fine Paid (₹{issue.fineAmount})
                                          </span>
                                        ) : isOverdue ? (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                                            ⚠️ Unpaid Fine (₹{fine})
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                            ✓ On Time (₹0)
                                          </span>
                                        )}
                                      </div>

                                      {/* Student & Equipment Details */}
                                      <div className="space-y-1 mb-2.5">
                                        <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                                          <span>🎓</span>
                                          <span className="truncate">{issue.studentName}</span>
                                        </div>
                                        <div className="text-xs text-slate-300 flex items-center space-x-1.5">
                                          <span>⚽</span>
                                          <span className="font-semibold text-white">{issue.equipmentName}</span>
                                          <span className="text-slate-500">({issue.quantity} units)</span>
                                        </div>
                                      </div>

                                      {/* Date & Fine Calculation Box */}
                                      <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800 space-y-1.5 text-xs mb-3">
                                        <div className="flex justify-between text-slate-400 text-[11px]">
                                          <span>Scheduled Return:</span>
                                          <span className="font-mono text-purple-400 font-bold">{issue.expectedReturnDate}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400 text-[11px]">
                                          <span>Return Status:</span>
                                          <span className="font-mono text-slate-300">
                                            {issue.status === 'RETURNED' ? `Returned on ${issue.returnDate}` : '⏳ Still Out'}
                                          </span>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-xs">
                                          <span className="text-slate-400">Delay Period:</span>
                                          <span className={`font-bold ${daysOverdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {daysOverdue > 0 ? `${daysOverdue} Day(s) Overdue` : '0 Days (On Time)'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-slate-400">Fine Calculation:</span>
                                          <span className="font-mono text-slate-300 text-[11px]">
                                            {daysOverdue} × ₹5/day = <strong className="text-rose-400 font-bold text-xs">₹{fine}</strong>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                                      {isPaid ? (
                                        <div className="w-full flex items-center justify-between">
                                          <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>Cleared</span>
                                          </span>
                                          <button
                                            onClick={() => {
                                              const student = studentList.find(s => s.id === issue.studentId);
                                              setActiveReceipt({
                                                receiptId: `RCP-${issue.id}00${Date.now().toString().slice(-4)}`,
                                                issueId: issue.id,
                                                studentName: issue.studentName,
                                                studentDept: student?.department || 'Sports Department',
                                                equipmentName: issue.equipmentName,
                                                quantity: issue.quantity,
                                                issueDate: issue.issueDate,
                                                expectedReturnDate: issue.expectedReturnDate,
                                                returnDate: issue.returnDate || issue.expectedReturnDate,
                                                daysOverdue: daysOverdue,
                                                fineAmount: issue.fineAmount || 0,
                                                paidAt: 'Recorded',
                                                paymentMethod: 'UPI'
                                              });
                                            }}
                                            className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                                          >
                                            <Receipt className="w-3 h-3" />
                                            <span>View Receipt</span>
                                          </button>
                                        </div>
                                      ) : isWaived ? (
                                        <span className="text-[11px] text-slate-500 italic">Waived by Authority</span>
                                      ) : fine > 0 ? (
                                        <div className="w-full flex items-center space-x-1.5">
                                          <button
                                            onClick={() => setPayingFineIssue(issue)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-1.5 px-2 rounded-lg text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-sm"
                                          >
                                            <Coins className="w-3.5 h-3.5" />
                                            <span>Collect ₹{fine}</span>
                                          </button>
                                          <button
                                            onClick={() => handleWaiveFine(issue.id)}
                                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                                            title="Waive fine for exceptional reason"
                                          >
                                            Waive
                                          </button>
                                          <button
                                            onClick={() => handleSendFineReminder(issue.studentName, fine)}
                                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 px-2 py-1.5 rounded-lg text-[11px] cursor-pointer"
                                            title="Send reminder notice"
                                          >
                                            🔔
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[11px] text-slate-500 italic">No fine applicable</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}

                        {/* Admin Table View */}
                        {fineViewMode === 'table' && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left min-w-[700px]">
                                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                                  <tr>
                                    <th className="py-3 px-3.5">Loan ID</th>
                                    <th className="py-3 px-3.5">Student Borrower</th>
                                    <th className="py-3 px-3.5">Equipment</th>
                                    <th className="py-3 px-3.5">Scheduled Return</th>
                                    <th className="py-3 px-3.5 text-center">Delay</th>
                                    <th className="py-3 px-3.5 text-center">Fine (₹5/day)</th>
                                    <th className="py-3 px-3.5">Payment Status</th>
                                    <th className="py-3 px-3.5 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {issueList.length > 0 ? (
                                    issueList.map(issue => {
                                      const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                                      const fine = computeIssueFine(issue);
                                      const isPaid = issue.finePaid;
                                      const isWaived = issue.fineWaived;

                                      return (
                                        <tr key={issue.id} className="hover:bg-slate-800/30 transition-colors">
                                          <td className="py-3 px-3.5 font-mono text-slate-500">#{issue.id}</td>
                                          <td className="py-3 px-3.5 font-bold text-white">{issue.studentName}</td>
                                          <td className="py-3 px-3.5 text-slate-300 font-medium">
                                            {issue.equipmentName} ({issue.quantity})
                                          </td>
                                          <td className="py-3 px-3.5 font-mono text-purple-400">{issue.expectedReturnDate}</td>
                                          <td className="py-3 px-3.5 text-center">
                                            <span
                                              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                                                daysOverdue > 0
                                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                                  : 'text-slate-400'
                                              }`}
                                            >
                                              {daysOverdue > 0 ? `${daysOverdue} days` : '0 days'}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3.5 text-center font-extrabold text-white text-xs">
                                            ₹{fine}
                                          </td>
                                          <td className="py-3 px-3.5">
                                            {isWaived ? (
                                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                                                Waived
                                              </span>
                                            ) : isPaid ? (
                                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                                Paid
                                              </span>
                                            ) : fine > 0 ? (
                                              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                                Unpaid
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-500">On Time</span>
                                            )}
                                          </td>
                                          <td className="py-3 px-3.5 text-right">
                                            {fine > 0 && !isPaid && !isWaived ? (
                                              <div className="flex items-center justify-end space-x-1">
                                                <button
                                                  onClick={() => setPayingFineIssue(issue)}
                                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded text-[11px] cursor-pointer"
                                                >
                                                  Collect ₹{fine}
                                                </button>
                                                <button
                                                  onClick={() => handleWaiveFine(issue.id)}
                                                  className="text-slate-400 hover:text-white px-1.5 py-1 text-[11px]"
                                                  title="Waive fine"
                                                >
                                                  Waive
                                                </button>
                                              </div>
                                            ) : isPaid ? (
                                              <span className="text-[11px] text-emerald-400 font-medium">✓ Cleared</span>
                                            ) : (
                                              <span className="text-[11px] text-slate-500">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={8} className="py-8 text-center text-slate-500">
                                        No issue records present.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ========================================================= */}
                    {/* 6B. STUDENT VIEW: STUDENT PERSONAL PORTAL & FINE SLIP     */}
                    {/* ========================================================= */}
                    {fineViewRole === 'student' && (
                      <div className="space-y-4">
                        {/* Student Selector Card */}
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">🎓</span>
                            <div>
                              <h4 className="text-sm font-bold text-white">Student Perspective View</h4>
                              <p className="text-[11px] text-slate-400">Select which registered student profile you want to inspect as</p>
                            </div>
                          </div>

                          <div className="w-full sm:w-72">
                            <select
                              value={selectedStudentForFineView}
                              onChange={e => setSelectedStudentForFineView(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
                            >
                              {studentList.length > 0 ? (
                                studentList.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.fullName} ({s.department}) - ID #{s.id}
                                  </option>
                                ))
                              ) : (
                                <option value="0">No registered students</option>
                              )}
                            </select>
                          </div>
                        </div>

                        {/* Selected Student Fine Profile & Dues Statement */}
                        {(() => {
                          const student = studentList.find(s => s.id === Number(selectedStudentForFineView)) || studentList[0];
                          if (!student) {
                            return (
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                                No student selected or registered yet. Add a student to view the student perspective.
                              </div>
                            );
                          }

                          const studentLoans = issueList.filter(i => i.studentId === student.id);
                          const studentPendingFine = studentLoans.reduce((acc, curr) => {
                            if (curr.fineWaived || curr.finePaid) return acc;
                            return acc + computeIssueFine(curr);
                          }, 0);

                          return (
                            <div className="space-y-4">
                              {/* Student Summary Card */}
                              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-base sm:text-lg font-extrabold text-white">{student.fullName}</h4>
                                    <span className="bg-slate-800 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-mono">
                                      ID #{student.id}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-1 space-x-3">
                                    <span>{student.department}</span>
                                    <span>•</span>
                                    <span>{student.classSemester}</span>
                                    <span>•</span>
                                    <span className="font-mono text-slate-300">{student.email}</span>
                                  </div>
                                </div>

                                <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 flex items-center justify-between sm:justify-end space-x-4">
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Fine Due</div>
                                    <div className={`text-2xl font-extrabold mt-0.5 ${studentPendingFine > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                      ₹{studentPendingFine}
                                    </div>
                                  </div>
                                  {studentPendingFine > 0 && (
                                    <button
                                      onClick={() => {
                                        const firstUnpaid = studentLoans.find(i => !i.finePaid && !i.fineWaived && computeIssueFine(i) > 0);
                                        if (firstUnpaid) setPayingFineIssue(firstUnpaid);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                                    >
                                      <Coins className="w-3.5 h-3.5" />
                                      <span>Pay Dues Online</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Student Notification Banner */}
                              {studentPendingFine > 0 ? (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-start space-x-3">
                                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                  <div>
                                    <h5 className="font-bold text-rose-200">Attention: Equipment Delayed Beyond Return Date</h5>
                                    <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                                      You have equipment that has not been returned by the scheduled returning date. A late fee of ₹5 per day has been charged to your account.
                                      Please return the items immediately to the sports room counter and clear outstanding dues.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 flex items-center space-x-2.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>
                                    <strong>All Clear!</strong> You have no pending equipment fines or overdue borrowings.
                                  </span>
                                </div>
                              )}

                              {/* Itemized Borrowing & Late Fine List for Student */}
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                  My Borrowed Equipment &amp; Fine Breakdown ({studentLoans.length})
                                </h5>

                                {studentLoans.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {studentLoans.map(issue => {
                                      const daysOverdue = calculateDaysOverdue(issue.expectedReturnDate, issue.returnDate);
                                      const fine = computeIssueFine(issue);
                                      const isPaid = issue.finePaid;
                                      const isWaived = issue.fineWaived;

                                      return (
                                        <div
                                          key={issue.id}
                                          className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between ${
                                            daysOverdue > 0 && !isPaid && !isWaived
                                              ? 'border-rose-500/40 shadow-sm'
                                              : 'border-slate-800'
                                          }`}
                                        >
                                          <div>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                                                <span>⚽</span>
                                                <span>{issue.equipmentName}</span>
                                              </span>
                                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                                                {issue.quantity} unit(s)
                                              </span>
                                            </div>

                                            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-xs mb-3">
                                              <div className="flex justify-between text-slate-400 text-[11px]">
                                                <span>Issued Date:</span>
                                                <span className="font-mono text-slate-300">{issue.issueDate}</span>
                                              </div>
                                              <div className="flex justify-between text-slate-400 text-[11px]">
                                                <span>Return Due Date:</span>
                                                <span className="font-mono text-purple-400 font-bold">{issue.expectedReturnDate}</span>
                                              </div>
                                              <div className="flex justify-between text-slate-400 text-[11px]">
                                                <span>Status:</span>
                                                <span className="font-mono text-slate-300">
                                                  {issue.status === 'RETURNED' ? `Returned (${issue.returnDate})` : '⏳ Active Loan'}
                                                </span>
                                              </div>
                                              <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-xs">
                                                <span className="text-slate-400">Delay Period:</span>
                                                <span className={`font-bold ${daysOverdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                  {daysOverdue > 0 ? `${daysOverdue} Day(s) Overdue` : 'On Time'}
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400">Late Fee (@ ₹5/day):</span>
                                                <span className="font-mono text-white font-extrabold">₹{fine}</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                            {isPaid ? (
                                              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>Fine Paid (₹{issue.fineAmount})</span>
                                              </span>
                                            ) : isWaived ? (
                                              <span className="text-xs text-slate-400 italic">Fine Waived</span>
                                            ) : fine > 0 ? (
                                              <div className="w-full flex items-center justify-between">
                                                <span className="text-xs text-rose-400 font-bold animate-pulse">
                                                  DUE: ₹{fine}
                                                </span>
                                                <button
                                                  onClick={() => setPayingFineIssue(issue)}
                                                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm cursor-pointer"
                                                >
                                                  <Coins className="w-3.5 h-3.5" />
                                                  <span>Pay ₹{fine}</span>
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-emerald-400 font-semibold">
                                                ✓ No fine due (Returned on time)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
                                    This student has no borrowing history yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SOURCE CODE EXPLORER                                                   */}
        {/* ========================================================================= */}
        {activeView === 'code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row flex-1 min-h-[640px]">
            {/* Mobile File Selector Dropdown Header */}
            <div className="md:hidden bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Select File to View:</label>
                <select
                  value={selectedFile.path}
                  onChange={e => {
                    const found = PROJECT_FILES.find(f => f.path === e.target.value);
                    if (found) setSelectedFile(found);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 truncate"
                >
                  {PROJECT_FILES.map(f => (
                    <option key={f.path} value={f.path}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1 shrink-0 mt-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP</span>
              </button>
            </div>

            {/* Desktop File List Drawer */}
            <div className="hidden md:flex w-80 bg-slate-900 border-r border-slate-800 p-4 flex-col shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Project Files</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full">
                  {PROJECT_FILES.length} Files
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 mb-2 text-[11px] scrollbar-none">
                {['All', 'Backend', 'Web Frontend', 'Config & SQL'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFileFilterCat(cat)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      fileFilterCat === cat ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search file input */}
              <div className="relative mb-2.5">
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={fileSearch}
                  onChange={e => setFileSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 pl-7 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
              </div>

              {/* Scrollable files list */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[460px]">
                {filteredFiles.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start space-x-2 cursor-pointer ${
                      selectedFile.path === file.path
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{file.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 mt-2">
                <button
                  onClick={handleDownloadZip}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete ZIP</span>
                </button>
              </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden min-w-0">
              <div className="bg-slate-900 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white truncate">{selectedFile?.path || 'pom.xml'}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                      {selectedFile?.language || 'xml'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{selectedFile?.description || 'File contents'}</p>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors border border-slate-700 shrink-0 cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3 sm:p-4 bg-slate-950 text-[11px] sm:text-xs font-mono leading-relaxed text-slate-300">
                <pre>
                  <code>{selectedFile?.content}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. VIVA VOCE EXAM PREPARATION GUIDE                                       */}
        {/* ========================================================================= */}
        {activeView === 'viva' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">Academic Oral Defense</span>
              <h2 className="text-base sm:text-xl font-extrabold text-white">First-Year CSE Viva Voce Preparation Guide</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Technical explanations of the 3-tier architecture, ACID transactions, JPA mapping, and database foreign keys so your team of 3 can answer examination questions with confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">1. Architecture Question</span>
                <h3 className="text-sm font-bold text-white">
                  Why did you build this as a 3-tier architecture instead of directly connecting frontend to MySQL?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Answer:</strong> Direct database connection from clients exposes MySQL database credentials and bypasses centralized business logic. By adopting a 3-tier REST architecture:
                  <br />• Database credentials stay securely on the Spring Boot server.
                  <br />• Business rules (@Transactional, stock checks, duplicate email checks) are enforced in one place.
                  <br />• The browser communicates cleanly via JSON REST APIs over HTTP.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">2. Database &amp; Transaction</span>
                <h3 className="text-sm font-bold text-white">
                  What is the exact purpose of <code className="text-emerald-300">@Transactional</code> in <code className="text-emerald-300">IssueService.java</code>?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Answer:</strong> Issuing equipment consists of two atomic database operations:
                  <br />1. Decrementing <code className="text-emerald-300">available_quantity</code> in the <code className="text-emerald-300">equipment</code> table.
                  <br />2. Inserting a new record in the <code className="text-emerald-300">issue</code> table.
                  <br />Without <code className="text-emerald-300">@Transactional</code>, if a server failure occurs between step 1 and 2, stock would decrease without an issue record being saved. <code className="text-emerald-300">@Transactional</code> guarantees ACID properties: both succeed together or both roll back.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">3. Spring Data JPA</span>
                <h3 className="text-sm font-bold text-white">
                  How does Spring Data JPA execute queries without writing SQL?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Answer:</strong> Spring Data JPA parses method naming conventions (such as <code className="text-purple-300">findByCategoryIgnoreCaseAndNameContainingIgnoreCase</code>). At runtime, Spring dynamically constructs JPQL (Java Persistence Query Language) queries executed through Hibernate.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">4. Entity Relationships</span>
                <h3 className="text-sm font-bold text-white">
                  Explain the relationship between Issue, Student, and Equipment.
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Answer:</strong> In <code className="text-amber-300">Issue.java</code>, we defined two <code className="text-amber-300">@ManyToOne</code> relationships:
                  <br />• Many issues can be made by one student (<code className="text-amber-300">@JoinColumn(name = "student_id")</code>).
                  <br />• Many issues can refer to the same equipment item (<code className="text-amber-300">@JoinColumn(name = "equipment_id")</code>).
                  <br />This matches the foreign keys in the MySQL schema, preserving relational integrity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. SETUP & RUN GUIDE                                                      */}
        {/* ========================================================================= */}
        {activeView === 'guide' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Local Deployment</span>
              <h2 className="text-base sm:text-xl font-bold text-white">How to Run this Project Locally (IntelliJ IDEA + MySQL)</h2>
              <p className="text-xs text-slate-400 mt-1">
                Follow these 4 simple steps to run the complete Spring Boot backend and Web application on your computer.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                  1
                </div>
                <div className="flex-1 space-y-2 text-xs min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Create Database in MySQL Workbench</h3>
                    <button
                      onClick={() => copyText('CREATE DATABASE sports_equipment_db;', 'sql-db')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      {copiedSnippet === 'sql-db' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'sql-db' ? 'Copied' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300">Open MySQL Workbench and execute:</p>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-emerald-400 overflow-x-auto text-[11px] sm:text-xs">
                    CREATE DATABASE sports_equipment_db;
                  </pre>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                  2
                </div>
                <div className="flex-1 space-y-2 text-xs min-w-0">
                  <h3 className="text-sm font-bold text-white">Configure MySQL Password in application.properties</h3>
                  <p className="text-slate-300">
                    Open <code className="text-blue-300">src/main/resources/application.properties</code> and set your MySQL password:
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-sky-300 overflow-x-auto text-[11px] sm:text-xs">
{`spring.datasource.url=jdbc:mysql://localhost:3306/sports_equipment_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD`}
                  </pre>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                  3
                </div>
                <div className="flex-1 space-y-2 text-xs min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Start the Spring Boot Backend in IntelliJ IDEA</h3>
                    <button
                      onClick={() => copyText('mvn clean spring-boot:run', 'mvn-run')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      {copiedSnippet === 'mvn-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet === 'mvn-run' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300">
                    Right click <code className="text-blue-300">SportsEquipmentManagementSystemApplication.java</code> and click <strong>Run</strong>.
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-amber-300 overflow-x-auto text-[11px] sm:text-xs">
                    mvn clean spring-boot:run
                  </pre>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs sm:text-sm">
                  4
                </div>
                <div className="flex-1 space-y-2 text-xs min-w-0">
                  <h3 className="text-sm font-bold text-white">Open the Web Browser</h3>
                  <p className="text-slate-300">
                    Navigate to <code className="text-emerald-400 font-bold">http://localhost:8080/</code> in your browser.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    The entire responsive college inventory dashboard will open connected to your local MySQL database, with initial demo equipment and students automatically populated!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS (RESPONSIVE FOR ALL SCREEN SIZES)                                 */}
      {/* ========================================================================= */}

      {/* Modal: Add Equipment */}
      {isAddEquipModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <span>⚽</span>
                <span>Add New Equipment</span>
              </span>
              <button
                onClick={() => setIsAddEquipModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Equipment Name: *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Football, Basketball, Table Tennis Bat"
                  value={newEquipName}
                  onChange={e => setNewEquipName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Category: *</label>
                <select
                  value={newEquipCategory}
                  onChange={e => setNewEquipCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Outdoor">Outdoor</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Athletics">Athletics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Total Quantity: *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newEquipQuantity}
                  onChange={e => setNewEquipQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Available quantity will initially match this total quantity.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description: (Optional)</label>
                <textarea
                  rows={2}
                  value={newEquipDesc}
                  onChange={e => setNewEquipDesc(e.target.value)}
                  placeholder="Brand, size, condition, specifications"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
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

      {/* Modal: Register Student */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <span>🎓</span>
                <span>Register College Student</span>
              </span>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name: *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Patel"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">College Email: *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. diya.patel@college.edu"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Must be unique across all students.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number: *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newStudentPhone}
                  onChange={e => setNewStudentPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Department: (Optional)</label>
                <input
                  type="text"
                  value={newStudentDept}
                  onChange={e => setNewStudentDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Class / Semester: (Optional)</label>
                <input
                  type="text"
                  value={newStudentSem}
                  onChange={e => setNewStudentSem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
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

      {/* Modal: Edit Equipment & Adjust Stock Availability */}
      {editingEquip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <span className="text-blue-400">✏️</span>
                <span>Edit Equipment &amp; Adjust Stock (#{editingEquip.id})</span>
              </span>
              <button
                onClick={() => setEditingEquip(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEquip} className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Equipment Name: *</label>
                <input
                  type="text"
                  required
                  value={editEquipName}
                  onChange={e => setEditEquipName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Category: *</label>
                <select
                  value={editEquipCategory}
                  onChange={e => setEditEquipCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Outdoor">Outdoor</option>
                  <option value="Indoor">Indoor</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Athletics">Athletics</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Total Stock Quantity Section */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold">Total Quantity Owned: *</label>
                  <span className="text-blue-400 font-extrabold text-sm">{editEquipTotalQty} units</span>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min={1}
                    required
                    value={editEquipTotalQty === 0 ? '' : editEquipTotalQty}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setEditEquipTotalQty(0);
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
                        const diff = val - editEquipTotalQty;
                        setEditEquipTotalQty(val);
                        if (diff > 0) {
                          // Increase available stock automatically
                          setEditEquipAvailQty(prev => prev + diff);
                        } else {
                          const maxAvail = Math.max(0, val - currentlyIssued);
                          setEditEquipAvailQty(prev => Math.min(prev, maxAvail));
                        }
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-200 font-bold focus:outline-none focus:border-blue-500 text-xs"
                    placeholder="Enter total stock"
                  />
                  <button
                    type="button"
                    onClick={() => adjustEditTotal(-5)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Decrease total stock by 5"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditTotal(-1)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Decrease total stock by 1"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditTotal(1)}
                    className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Increase total stock by 1"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditTotal(5)}
                    className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Increase total stock by 5"
                  >
                    +5
                  </button>
                </div>
                <div className="text-[10px] text-slate-500">
                  Total inventory units owned. Currently borrowed by students: {Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity)} units.
                </div>
              </div>

              {/* Stock Availability Adjustment Controls */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold">Available on Shelf for Issue:</label>
                  <span className="text-emerald-400 font-extrabold text-sm">{editEquipAvailQty} units</span>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min={0}
                    value={editEquipAvailQty === 0 ? '0' : editEquipAvailQty}
                    onChange={e => {
                      const raw = e.target.value;
                      if (raw === '') {
                        setEditEquipAvailQty(0);
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        setEditEquipAvailQty(val);
                        const currentlyIssued = Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity);
                        if (val + currentlyIssued > editEquipTotalQty) {
                          setEditEquipTotalQty(val + currentlyIssued);
                        }
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-200 font-bold focus:outline-none focus:border-emerald-500 text-xs"
                    placeholder="Enter available stock"
                  />
                  <button
                    type="button"
                    onClick={() => adjustEditAvail(-5)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Remove 5 from available stock"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditAvail(-1)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Remove 1 from available stock"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditAvail(1)}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Add 1 to available stock"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustEditAvail(5)}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-2 rounded-lg text-xs font-bold cursor-pointer"
                    title="Add 5 to available stock"
                  >
                    +5
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
                  <span>Currently Borrowed: <strong className="text-amber-400">{Math.max(0, editingEquip.totalQuantity - editingEquip.availableQuantity)}</strong></span>
                  <span>Available on Shelf: <strong className="text-emerald-400">{editEquipAvailQty}</strong></span>
                </div>
              </div>

              {/* Quick Batch Stock Addition */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-300 font-bold block text-[11px]">New Stock Purchase?</span>
                  <span className="text-[10px] text-slate-500">Increases both Total and Available units</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => adjustBothTotalAndAvail(5)}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    +5 Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustBothTotalAndAvail(10)}
                    className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    +10 Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description: (Optional)</label>
                <textarea
                  rows={2}
                  value={editEquipDesc}
                  onChange={e => setEditEquipDesc(e.target.value)}
                  placeholder="Brand, size, condition, specifications"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingEquip(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Collect / Pay Overdue Fine (₹5/day) */}
      {payingFineIssue && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 px-4 sm:px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Coins className="w-4 h-4 text-rose-400" />
                <span>Pay Equipment Delay Fine (Loan #{payingFineIssue.id})</span>
              </span>
              <button
                onClick={() => setPayingFineIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto">
              {/* Borrower & Equipment Summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Student Borrower:</span>
                  <span className="font-bold text-white flex items-center space-x-1">
                    <span>🎓</span>
                    <span>{payingFineIssue.studentName}</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Equipment Item:</span>
                  <span className="font-semibold text-slate-200">
                    {payingFineIssue.equipmentName} ({payingFineIssue.quantity} units)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Issue Date:</span>
                  <span className="font-mono text-slate-300">{payingFineIssue.issueDate}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Scheduled Return Date:</span>
                  <span className="font-mono text-purple-400 font-bold">{payingFineIssue.expectedReturnDate}</span>
                </div>
              </div>

              {/* Delay and Fine Breakdown */}
              {(() => {
                const daysOverdue = calculateDaysOverdue(payingFineIssue.expectedReturnDate, payingFineIssue.returnDate);
                const fineAmount = computeIssueFine(payingFineIssue);

                return (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 space-y-2 text-rose-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Days Delayed:</span>
                      <span className="font-extrabold text-sm text-rose-400">
                        {daysOverdue} Day{daysOverdue > 1 ? 's' : ''} Past Return Date
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-rose-300">
                      <span>Fine Policy Rate:</span>
                      <span className="font-bold">₹5 per day late</span>
                    </div>
                    <div className="pt-2 border-t border-rose-500/20 flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Total Fine Payable:</span>
                      <span className="text-2xl font-extrabold text-rose-400 flex items-center space-x-0.5">
                        <span>₹{fineAmount}</span>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Select Payment Mode: *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: '📱' },
                    { id: 'CASH_DESK', label: 'Cash Desk', icon: '💵' },
                    { id: 'COLLEGE_CARD', label: 'College ID', icon: '💳' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-blue-600/30 border-blue-500 text-white font-bold shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-base mb-0.5">{m.icon}</div>
                      <div className="text-[11px] leading-tight">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment confirmation action */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayingFineIssue(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCollectFine(payingFineIssue, paymentMethod)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg shadow-md shadow-emerald-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Payment &amp; Issue Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Digital Fine Payment Receipt */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 max-w-lg w-full overflow-hidden max-h-[95vh] flex flex-col">
            <div className="bg-slate-950 px-4 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <Receipt className="w-4 h-4" />
                <span>College Sports Authority • Official Fine Receipt</span>
              </span>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto bg-slate-950/40">
              {/* Receipt Header Badge */}
              <div className="text-center pb-3 border-b border-slate-800/80 space-y-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mb-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  DEPARTMENT OF PHYSICAL EDUCATION &amp; SPORTS
                </h3>
                <p className="text-[11px] text-slate-400">
                  Government Engineering College Campus • Sports Equipment Penalty Clearance Slip
                </p>
                <div className="pt-1 flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span>Receipt No: <strong className="text-blue-400 font-bold">{activeReceipt.receiptId}</strong></span>
                  <span>•</span>
                  <span>Date: {activeReceipt.paidAt}</span>
                </div>
              </div>

              {/* Student & Equipment Particulars */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Student Borrower</span>
                    <span className="font-bold text-white text-xs">{activeReceipt.studentName}</span>
                    <span className="text-slate-400 block text-[10px]">{activeReceipt.studentDept}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Equipment Item</span>
                    <span className="font-bold text-white text-xs">{activeReceipt.equipmentName}</span>
                    <span className="text-slate-400 block text-[10px]">{activeReceipt.quantity} unit(s)</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Issued On:</span>
                    <span>{activeReceipt.issueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Return Due:</span>
                    <span className="text-purple-400">{activeReceipt.expectedReturnDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cleared On:</span>
                    <span className="text-emerald-400">{activeReceipt.returnDate}</span>
                  </div>
                </div>
              </div>

              {/* Fine Calculation Itemized Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-center">Days Delayed</th>
                      <th className="py-2 px-3 text-center">Rate</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        Late return penalty for {activeReceipt.equipmentName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                        {activeReceipt.daysOverdue} Day{activeReceipt.daysOverdue > 1 ? 's' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">₹5 / day</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">₹{activeReceipt.fineAmount}</td>
                    </tr>
                    <tr className="bg-slate-950/60 font-bold">
                      <td colSpan={3} className="py-2.5 px-3 text-right text-slate-300 uppercase text-[10px]">
                        Total Paid:
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 text-sm font-extrabold">
                        ₹{activeReceipt.fineAmount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stamp & Verification */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                    {activeReceipt.paymentMethod === 'UPI'
                      ? 'UPI / QR Code'
                      : activeReceipt.paymentMethod === 'CASH_DESK'
                      ? 'Cash Counter'
                      : 'College Smartcard'}
                  </span>
                </div>

                <div className="border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 rounded text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">
                  ✓ PAID &amp; CLEARED
                </div>
              </div>

              {/* Print & Close Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 px-4 sm:px-6 py-3.5 text-center text-[11px] sm:text-xs text-slate-500 mt-auto">
        Sports Equipment Management System • College Major Project • Team of 3 CSE Students • Java 21, Spring Boot, MySQL, REST API
      </footer>
    </div>
  );
}
