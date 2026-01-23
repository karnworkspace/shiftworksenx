import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// แปลงปี ค.ศ. เป็น พ.ศ.
export function toBuddhistYear(year: number): number {
  return year + 543;
}

export function toChristYear(buddhistYear: number): number {
  return buddhistYear - 543;
}

// ดึงจำนวนวันในเดือน
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// สร้าง Array ของวันในเดือน
export function getMonthDays(year: number, month: number): number[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => i + 1);
}

// ชื่อเดือน (ภาษาไทย)
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

// Shift color mapping
export const SHIFT_COLORS: Record<string, string> = {
  '1': 'bg-shift-day1 text-white',
  '2': 'bg-shift-day2 text-white',
  '3': 'bg-shift-day3 text-white',
  'ดึก': 'bg-shift-night text-white',
  'OFF': 'bg-shift-off text-white',
  'ข': 'bg-shift-absent text-white', // ขาด
  'ป': 'bg-shift-sick text-white',   // ลาป่วย
  'ก': 'bg-shift-personal text-white', // ลากิจ
  'พ': 'bg-shift-vacation text-white', // พักร้อน
};

// Shift labels
export const SHIFT_LABELS: Record<string, string> = {
  '1': 'กะเช้า',
  '2': 'กะบ่าย',
  '3': 'กะดึก',
  'ดึก': 'ดึก',
  'OFF': 'หยุด',
  'ข': 'ขาด',
  'ป': 'ลาป่วย',
  'ก': 'ลากิจ',
  'พ': 'พักร้อน',
};
