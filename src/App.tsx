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
  Pencil
} from 'lucide-react';
import { PROJECT_FILES, ProjectFile } from './projectFiles';

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
  returnDate?: string | null;
  status: 'ISSUED' | 'RETURNED';
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

const SAMPLE_ISSUES: IssueItem[] = [
  { id: 1, studentId: 1, studentName: 'Aarav Sharma', equipmentId: 1, equipmentName: 'Football', quantity: 2, issueDate: '2026-10-03', status: 'ISSUED' },
  { id: 2, studentId: 2, studentName: 'Diya Patel', equipmentId: 4, equipmentName: 'Badminton Racket', quantity: 2, issueDate: '2026-10-04', status: 'ISSUED' },
  { id: 3, studentId: 3, studentName: 'Rohan Verma', equipmentId: 2, equipmentName: 'Basketball', quantity: 1, issueDate: '2026-10-05', status: 'ISSUED' }
];

// Fresh start by default (0 equipment, 0 students, 0 issues)
const INITIAL_EQUIPMENT: EquipmentItem[] = [];
const INITIAL_STUDENTS: StudentItem[] = [];
const INITIAL_ISSUES: IssueItem[] = [];

export default function App() {
  // Navigation & View Mode
  const [activeView, setActiveView] = useState<'app' | 'code' | 'viva' | 'guide'>('app');
  const [activePage, setActivePage] = useState<'dashboard' | 'equipment' | 'students' | 'issue' | 'return'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Responsive View Toggle for tables on mobile/tablet (table vs cards)
  const [equipViewMode, setEquipViewMode] = useState<'table' | 'cards'>('cards');
  const [studentViewMode, setStudentViewMode] = useState<'table' | 'cards'>('cards');
  const [returnViewMode, setReturnViewMode] = useState<'table' | 'cards'>('cards');

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

  // Derived Metrics
  const totalTypes = equipmentList.length;
  const totalQuantity = equipmentList.reduce((acc, curr) => acc + curr.totalQuantity, 0);
  const availableQuantity = equipmentList.reduce((acc, curr) => acc + curr.availableQuantity, 0);
  const activeLoans = issueList.filter(i => i.status === 'ISSUED');
  const currentlyIssued = activeLoans.reduce((acc, curr) => acc + curr.quantity, 0);
  const registeredStudentsCount = studentList.length;

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
    showToast(`Added '${item.name}' to inventory!`, 'success');
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

    const newIssueId = issueList.length > 0 ? Math.max(...issueList.map(i => i.id)) + 1 : 1;
    const newIssue: IssueItem = {
      id: newIssueId,
      studentId: student.id,
      studentName: student.fullName,
      equipmentId: equip.id,
      equipmentName: equip.name,
      quantity: Number(issueQty),
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      status: 'ISSUED'
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
    showToast(`Issued ${issueQty} ${equip.name}(s) to ${student.fullName}!`, 'success');
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

  const adjustEditAvail = (delta: number) => {
    if (!editingEquip) return;
    const currentlyIssued = editingEquip.totalQuantity - editingEquip.availableQuantity;
    const maxAvailable = editEquipTotalQty - currentlyIssued;
    const nextVal = Math.max(0, Math.min(maxAvailable, editEquipAvailQty + delta));
    setEditEquipAvailQty(nextVal);
  };

  const handleSaveEditEquip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquip) return;
    if (!editEquipName.trim()) {
      showToast('Equipment name cannot be empty.', 'error');
      return;
    }
    if (editEquipTotalQty <= 0) {
      showToast('Total quantity must be greater than zero.', 'error');
      return;
    }
    const currentlyIssued = editingEquip.totalQuantity - editingEquip.availableQuantity;
    if (editEquipTotalQty < currentlyIssued) {
      showToast(`Total quantity cannot be less than currently issued items (${currentlyIssued}).`, 'error');
      return;
    }
    if (editEquipAvailQty < 0) {
      showToast('Available quantity cannot be negative.', 'error');
      return;
    }
    const maxAvailable = editEquipTotalQty - currentlyIssued;
    if (editEquipAvailQty > maxAvailable) {
      showToast(`Available quantity cannot exceed ${maxAvailable} because ${currentlyIssued} unit(s) are currently borrowed.`, 'error');
      return;
    }

    setEquipmentList(prev =>
      prev.map(item =>
        item.id === editingEquip.id
          ? {
              ...item,
              name: editEquipName.trim(),
              category: editEquipCategory,
              totalQuantity: editEquipTotalQty,
              availableQuantity: editEquipAvailQty,
              description: editEquipDesc.trim()
            }
          : item
      )
    );

    setEditingEquip(null);
    showToast(`Equipment '${editEquipName}' updated! Available stock is now ${editEquipAvailQty} units.`, 'success');
  };

  // Return Equipment Actions - Direct, instant, and reliable!
  const handleReturnEquipment = (issueId: number, customReturnDate?: string) => {
    const issue = issueList.find(i => i.id === issueId);
    if (!issue || issue.status !== 'ISSUED') {
      showToast('This equipment has already been returned.', 'info');
      return;
    }

    const returnDateStr = customReturnDate || new Date().toISOString().split('T')[0];

    // 1. Replenish equipment stock in inventory
    setEquipmentList(prev =>
      prev.map(item =>
        item.id === issue.equipmentId
          ? { ...item, availableQuantity: Math.min(item.totalQuantity, item.availableQuantity + issue.quantity) }
          : item
      )
    );

    // 2. Mark issue as RETURNED
    setIssueList(prev =>
      prev.map(item =>
        item.id === issue.id
          ? { ...item, status: 'RETURNED', returnDate: returnDateStr }
          : item
      )
    );

    if (quickReturnIssueId === String(issueId)) {
      setQuickReturnIssueId('');
    }

    showToast(`✅ Returned ${issue.quantity} ${issue.equipmentName}(s) from ${issue.studentName}! Stock replenished.`, 'success');
  };

  const handleQuickReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickReturnIssueId) {
      showToast('Please select an active loan to return from the dropdown.', 'error');
      return;
    }
    handleReturnEquipment(Number(quickReturnIssueId), quickReturnDate);
  };

  // Demo Data vs Fresh Empty State Controls
  const handleLoadSampleData = () => {
    setEquipmentList(SAMPLE_EQUIPMENT);
    setStudentList(SAMPLE_STUDENTS);
    setIssueList(SAMPLE_ISSUES);
    showToast('Loaded sample sports equipment and students for testing!', 'success');
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
                    { id: 'return', label: 'Return Equipment', icon: ArrowDownLeft }
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
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-3 transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
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
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate">
                      {activePage === 'dashboard' && 'Aggregated statistics and recent transactions from MySQL'}
                      {activePage === 'equipment' && 'Catalog of college sports goods with stock verification'}
                      {activePage === 'students' && 'Authorized college students eligible to borrow equipment'}
                      {activePage === 'issue' && 'Atomic database transaction with stock decrement'}
                      {activePage === 'return' && 'Active borrower records pending equipment return'}
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
                  { id: 'return', label: 'Return', icon: ArrowDownLeft }
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
                          <table className="w-full text-xs text-left min-w-[340px]">
                            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                              <tr>
                                <th className="py-2 px-3">Equipment</th>
                                <th className="py-2 px-3">Category</th>
                                <th className="py-2 px-3 text-center">Total</th>
                                <th className="py-2 px-3 text-center">Avail</th>
                                <th className="py-2 px-3 text-center">Issued</th>
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
                                    <td className="py-2.5 px-3 text-center text-slate-400">{eq.totalQuantity}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{eq.availableQuantity}</td>
                                    <td className="py-2.5 px-3 text-center font-bold text-amber-400">{issuedCount}</td>
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

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500">
                                    {eq.totalQuantity - eq.availableQuantity} issued
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleOpenEditEquip(eq)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 py-1 rounded-lg text-xs flex items-center space-x-1 transition-colors cursor-pointer font-medium"
                                      title="Edit equipment and adjust stock availability"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>Edit</span>
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
                                      <div className="flex items-center justify-end space-x-1">
                                        <button
                                          onClick={() => handleOpenEditEquip(eq)}
                                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                          title="Edit Equipment & Stock"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
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

                        {/* Issue Date */}
                        <div>
                          <label className="block text-slate-300 font-bold mb-1.5">Issue Date (YYYY-MM-DD): *</label>
                          <input
                            type="date"
                            value={issueDate}
                            onChange={e => setIssueDate(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                            required
                          />
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
                              {activeLoans.map(issue => (
                                <option key={issue.id} value={issue.id}>
                                  Loan #{issue.id}: {issue.studentName} — {issue.equipmentName} ({issue.quantity} units, Issued: {issue.issueDate})
                                </option>
                              ))}
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
                          return (
                            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
                              <span>Borrower: <strong className="text-blue-400">{sel.studentName}</strong></span>
                              <span>Equipment: <strong className="text-emerald-400">{sel.equipmentName}</strong></span>
                              <span>Qty: <strong className="text-amber-400">{sel.quantity} unit(s)</strong></span>
                              <span>Issued: <strong className="text-slate-300">{sel.issueDate}</strong></span>
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

              <div>
                <label className="block text-slate-300 font-bold mb-1">Total Quantity: *</label>
                <input
                  type="number"
                  min={editingEquip.totalQuantity - editingEquip.availableQuantity || 1}
                  required
                  value={editEquipTotalQty}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEditEquipTotalQty(val);
                    if (editEquipAvailQty > val) {
                      setEditEquipAvailQty(val);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Total units owned. Must be at least {editingEquip.totalQuantity - editingEquip.availableQuantity} (units currently issued).
                </span>
              </div>

              {/* Stock Availability Adjustment Controls */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-bold">Available in Stock:</label>
                  <span className="text-emerald-400 font-extrabold text-sm">{editEquipAvailQty} units</span>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    min={0}
                    max={editEquipTotalQty - (editingEquip.totalQuantity - editingEquip.availableQuantity)}
                    value={editEquipAvailQty}
                    onChange={e => setEditEquipAvailQty(Number(e.target.value))}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-center text-slate-200 font-bold focus:outline-none focus:border-emerald-500 text-xs"
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
                  <span>Currently Borrowed: <strong className="text-amber-400">{editingEquip.totalQuantity - editingEquip.availableQuantity}</strong></span>
                  <span>Max Available: <strong className="text-slate-200">{editEquipTotalQty - (editingEquip.totalQuantity - editingEquip.availableQuantity)}</strong></span>
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

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 px-4 sm:px-6 py-3.5 text-center text-[11px] sm:text-xs text-slate-500 mt-auto">
        Sports Equipment Management System • College Major Project • Team of 3 CSE Students • Java 21, Spring Boot, MySQL, REST API
      </footer>
    </div>
  );
}
