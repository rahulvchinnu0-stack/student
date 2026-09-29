'use client';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export interface ExportRow {
  studentId: string;
  studentName: string;
  className: string;
  subjectName: string;
  date: string;
  status: string;
  teacherName: string;
  note?: string;
}

export function exportToCSV(data: ExportRow[], filename = 'attendance_report.csv') {
  if (!data || data.length === 0) return;

  const headers = ['Student ID', 'Student Name', 'Class', 'Subject', 'Date', 'Status', 'Teacher', 'Notes'];
  const csvRows = [headers.join(',')];

  data.forEach((row) => {
    const values = [
      `"${row.studentId}"`,
      `"${row.studentName}"`,
      `"${row.className}"`,
      `"${row.subjectName}"`,
      `"${row.date}"`,
      `"${row.status}"`,
      `"${row.teacherName}"`,
      `"${(row.note || '').replace(/"/g, '""')}"`,
    ];
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXLSX(data: ExportRow[], filename = 'attendance_report.xlsx') {
  if (!data || data.length === 0) return;

  const formatted = data.map((r) => ({
    'Student ID': r.studentId,
    'Student Name': r.studentName,
    Class: r.className,
    Subject: r.subjectName,
    Date: r.date,
    Status: r.status,
    Teacher: r.teacherName,
    Notes: r.note || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(
  data: ExportRow[],
  meta: { title?: string; classInfo?: string; generatedBy?: string; threshold?: string },
  filename = 'attendance_report.pdf'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  let y = margin + 20;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(meta.title || 'Student Attendance Report', margin, y);

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${reportDate}  |  By: ${meta.generatedBy || 'Administrator'}`, margin, y);

  if (meta.classInfo) {
    y += 14;
    doc.text(`Scope: ${meta.classInfo}  |  Required Threshold: ${meta.threshold || '75.00%'}`, margin, y);
  }

  y += 20;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(margin, y, 555, y);
  y += 16;

  // Table Columns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('Date', margin, y);
  doc.text('Student', margin + 70, y);
  doc.text('Roll', margin + 180, y);
  doc.text('Subject', margin + 240, y);
  doc.text('Status', margin + 370, y);
  doc.text('Teacher', margin + 440, y);

  y += 8;
  doc.line(margin, y, 555, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const maxRowsPerPage = 32;
  let count = 0;

  for (const item of data) {
    if (count > maxRowsPerPage) {
      doc.addPage();
      y = margin + 20;
      count = 0;
    }

    doc.setTextColor(71, 85, 105);
    doc.text(item.date, margin, y);
    doc.text(item.studentName.substring(0, 20), margin + 70, y);
    doc.text(item.studentId, margin + 180, y);
    doc.text(item.subjectName.substring(0, 24), margin + 240, y);

    // Status color
    if (item.status === 'PRESENT') doc.setTextColor(22, 163, 74);
    else if (item.status === 'ABSENT') doc.setTextColor(225, 29, 72);
    else if (item.status === 'LATE') doc.setTextColor(217, 119, 6);
    else doc.setTextColor(147, 51, 234);

    doc.text(item.status, margin + 370, y);

    doc.setTextColor(100, 116, 139);
    doc.text(item.teacherName.substring(0, 18), margin + 440, y);

    y += 15;
    count++;
  }

  doc.save(filename);
}
