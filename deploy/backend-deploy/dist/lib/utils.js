"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIFT_LABELS = exports.SHIFT_COLORS = exports.THAI_MONTHS = void 0;
exports.cn = cn;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.toBuddhistYear = toBuddhistYear;
exports.toChristYear = toChristYear;
exports.getDaysInMonth = getDaysInMonth;
exports.getMonthDays = getMonthDays;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
    }).format(amount);
}
function formatDate(date) {
    return new Intl.DateTimeFormat('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}
// แปลงปี ค.ศ. เป็น พ.ศ.
function toBuddhistYear(year) {
    return year + 543;
}
function toChristYear(buddhistYear) {
    return buddhistYear - 543;
}
// ดึงจำนวนวันในเดือน
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}
// สร้าง Array ของวันในเดือน
function getMonthDays(year, month) {
    const days = getDaysInMonth(year, month);
    return Array.from({ length: days }, (_, i) => i + 1);
}
// ชื่อเดือน (ภาษาไทย)
exports.THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
// Shift color mapping
exports.SHIFT_COLORS = {
    '1': 'bg-shift-day1 text-white',
    '2': 'bg-shift-day2 text-white',
    '3': 'bg-shift-day3 text-white',
    'ดึก': 'bg-shift-night text-white',
    'OFF': 'bg-shift-off text-white',
    'ข': 'bg-shift-absent text-white', // ขาด
    'ป': 'bg-shift-sick text-white', // ลาป่วย
    'ก': 'bg-shift-personal text-white', // ลากิจ
    'พ': 'bg-shift-vacation text-white', // พักร้อน
};
// Shift labels
exports.SHIFT_LABELS = {
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
//# sourceMappingURL=utils.js.map