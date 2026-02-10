import html2pdf from 'html2pdf.js';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import senxLogoUrl from '../assets/senx-logo.webp';

dayjs.extend(buddhistEra);
dayjs.locale('th');

interface Staff {
  id: string;
  name: string;
  position: string;
  wagePerDay: number;
}

interface Project {
  id: string;
  name: string;
}

interface RosterData {
  [staffId: string]: {
    [day: number]: string;
  };
}

interface ReportData {
  project: Project;
  month: Dayjs;
  staff: Staff[];
  rosterData: RosterData;
  shiftTypes: any[];
  deductionConfig?: {
    sickLeaveDeductionPerDay: number;
    maxSickLeaveDaysPerMonth: number;
  };
  summary: {
    totalAbsent: number;
    totalDeduction: number;
    subProjects?: { name: string; percentage: number; amount: number }[];
  };
}

// Thai month names
const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const formatThaiDate = (date: Dayjs) => {
  const month = thaiMonths[date.month()];
  const year = date.year() + 543;
  return `${month} ${year}`;
};

const formatThaiDateFull = (date: Dayjs) => {
  const day = date.date();
  const month = thaiMonths[date.month()];
  const year = date.year() + 543;
  return `${day} ${month} ${year}`;
};

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

export const generateMonthlyReport = async (data: ReportData) => {
  await preloadImage(senxLogoUrl);

  const daysInMonth = data.month.daysInMonth();
  const vatRate = 0.07;
  const netDeduction = data.summary.totalDeduction ?? 0;
  const vatAmount = netDeduction * vatRate;
  const totalWithVat = netDeduction + vatAmount;
  const absentShift = data.shiftTypes.find((s) => s.code === 'ขาด' || s.code === 'ข');
  const absentCode = absentShift?.code || 'ขาด';
  const sickShift = data.shiftTypes.find((s) => s.code === 'ป่วย' || s.code === 'ป');
  const sickCode = sickShift?.code || 'ป';
  const maxSickDays = data.deductionConfig?.maxSickLeaveDaysPerMonth ?? 0;
  const sickLeaveDeductionPerDay = data.deductionConfig?.sickLeaveDeductionPerDay ?? 0;
  const dailyDeductionTotals = Array.from({ length: daysInMonth }, () => 0);
  const positionSummaryMap = new Map<string, { position: string; rate: number; absentDays: number; amount: number }>();
  let totalAbsentDays = 0;
  let totalAbsentAmount = 0;
  let totalExcessSickDays = 0;
  let totalSickAmount = 0;
  
  // Build day headers HTML
  let dayHeadersHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    dayHeadersHTML += `<th style="padding: 4px 2px; text-align: center; border: 1px solid #000; font-weight: normal;">${day}</th>`;
  }

  // Build table rows HTML
  let tableRowsHTML = '';
  data.staff.forEach((staff, index) => {
    let sickCount = 0;
    let absentCount = 0;
    const bgColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
    let rowHTML = `<tr style="background-color: ${bgColor};">`;
    rowHTML += `<td style="text-align: center; padding: 4px 3px; border: 1px solid #000; font-size: 9px;">${index + 1}</td>`;
    rowHTML += `<td style="text-align: left; padding: 4px 6px; border: 1px solid #000; white-space: nowrap; font-size: 9px;">${staff.name}</td>`;
    rowHTML += `<td style="text-align: left; padding: 4px 6px; border: 1px solid #000; white-space: nowrap; font-size: 9px;">${staff.position}</td>`;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const shift = data.rosterData[staff.id]?.[day] || 'OFF';
      if (shift === absentCode) {
        absentCount += 1;
        dailyDeductionTotals[day - 1] += staff.wagePerDay;
      } else if (shift === sickCode) {
        sickCount += 1;
        if (sickCount > maxSickDays) {
          dailyDeductionTotals[day - 1] += sickLeaveDeductionPerDay;
        }
      }
      rowHTML += `<td style="text-align: center; padding: 4px 2px; border: 1px solid #000; font-size: 9px;">${shift}</td>`;
    }
    
    const excessSickDays = Math.max(0, sickCount - maxSickDays);
    const absentAmount = absentCount * staff.wagePerDay;
    const sickAmount = excessSickDays * sickLeaveDeductionPerDay;
    const summaryKey = `${staff.position}__${staff.wagePerDay}`;
    const summaryRow = positionSummaryMap.get(summaryKey) || {
      position: staff.position,
      rate: staff.wagePerDay,
      absentDays: 0,
      amount: 0,
    };
    summaryRow.absentDays += absentCount;
    summaryRow.amount += absentAmount;
    positionSummaryMap.set(summaryKey, summaryRow);
    totalAbsentDays += absentCount;
    totalAbsentAmount += absentAmount;
    totalExcessSickDays += excessSickDays;
    totalSickAmount += sickAmount;

    rowHTML += '</tr>';
    tableRowsHTML += rowHTML;
  });

  let deductionRowHTML = '<tr style="background-color: #fff2f0; font-weight: bold;">';
  deductionRowHTML += '<td colspan="3" style="text-align: right; padding: 4px 6px; border: 1px solid #000; font-size: 9px;">ยอดหักเงิน/วัน</td>';
  for (let day = 1; day <= daysInMonth; day++) {
    const value = dailyDeductionTotals[day - 1];
    deductionRowHTML += `<td style="text-align: center; padding: 4px 2px; border: 1px solid #000; font-size: 8px;">${value > 0 ? value.toLocaleString() : '-'}</td>`;
  }
  deductionRowHTML += '</tr>';
  tableRowsHTML += deductionRowHTML;

  // Build summary table rows (position + totals)
  const positionRows = Array.from(positionSummaryMap.values());
  let positionRowsHTML = '';
  positionRows.forEach((row) => {
    positionRowsHTML += `
      <tr>
        <td style="padding: 4px 6px; border: 1px solid #000; font-size: 10px;">${row.position}</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${row.rate.toLocaleString()}</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: center; font-size: 10px;">${row.absentDays}</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${row.amount.toLocaleString()}</td>
      </tr>
    `;
  });

  let sickRowHTML = '';
  if (totalSickAmount > 0) {
    sickRowHTML = `
      <tr>
        <td style="padding: 4px 6px; border: 1px solid #000; font-size: 10px;">หักป่วยเกินสิทธิ</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${sickLeaveDeductionPerDay.toLocaleString()}</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: center; font-size: 10px;">${totalExcessSickDays}</td>
        <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${totalSickAmount.toLocaleString()}</td>
      </tr>
    `;
  }

  const totalDeductionRaw = data.summary.totalDeduction ?? (totalAbsentAmount + totalSickAmount);
  const subProjects = Array.isArray(data.summary.subProjects) ? data.summary.subProjects : [];
  let subProjectRowsHTML = '';
  if (subProjects.length > 0) {
    subProjects.forEach((sp) => {
      const name = sp?.name ?? '';
      if (!name) return;
      const percentage = Number(sp?.percentage);
      const amount = Number(sp?.amount);
      if (!Number.isFinite(percentage) || !Number.isFinite(amount)) return;
      subProjectRowsHTML += `
        <tr style="background: #fff7e6;">
          <td style="padding: 4px 6px; border: 1px solid #000; font-size: 10px;">${name}</td>
          <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${percentage}%</td>
          <td style="padding: 4px 6px; border: 1px solid #000; text-align: center; font-size: 10px;">-</td>
          <td style="padding: 4px 6px; border: 1px solid #000; text-align: right; font-size: 10px;">${amount.toLocaleString()}</td>
        </tr>
      `;
    });
  }



  // Create HTML content - optimized for nearly full A4 landscape page
  const htmlContent = `
    <div id="pdf-content" style="font-family: 'Sarabun', Tahoma, Arial, sans-serif; padding: 12px 20px; background: white; width: 287mm; height: 190mm; box-sizing: border-box;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
      </style>
      
      <!-- Document Header -->
      <div style="border: 2px solid #000; padding: 10px 15px; margin-bottom: 12px;">
        <table style="width: 100%;">
          <tr>
            <td style="width: 12%; text-align: center; vertical-align: middle;">
              <div style="width: 55px; height: 55px; border: 1px solid #000; background: #141414; margin: auto; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <img src="${senxLogoUrl}" alt="Sen-X" style="max-width: 50px; max-height: 45px; object-fit: contain;" />
              </div>
            </td>
            <td style="width: 76%; text-align: center; vertical-align: middle;">
              <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">รายงานการปฏิบัติงานประจำเดือน</div>
              <div style="font-size: 14px; font-weight: bold;">Monthly Work Attendance Report</div>
            </td>
            <td style="width: 12%; text-align: center; vertical-align: middle;">
              <div style="font-size: 10px;">เอกสารเลขที่</div>
              <div style="font-size: 10px; border: 1px solid #000; padding: 4px; margin-top: 3px;">ATT-${data.month.format('YYMM')}-001</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Document Info -->
      <table style="width: 100%; margin-bottom: 10px; font-size: 12px; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0;"><strong>โครงการ:</strong> ${data.project.name}</td>
          <td style="padding: 4px 0; text-align: center;"><strong>จำนวนพนักงาน:</strong> ${data.staff.length} คน</td>
          <td style="padding: 4px 0; text-align: right;"><strong>ประจำเดือน:</strong> ${formatThaiDate(data.month)}</td>
        </tr>
      </table>

      <!-- Roster Table -->
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: bold; padding: 5px 8px; background: #e0e0e0; border: 1px solid #000; border-bottom: none;">
              สรุปรายการหักขาดอัตรา ประจำเดือน ${formatThaiDate(data.month)}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 5px 3px; text-align: center; border: 1px solid #000; width: 25px;">No.</th>
              <th style="padding: 5px 3px; text-align: center; border: 1px solid #000;">ชื่อ-นามสกุล</th>
              <th style="padding: 5px 3px; text-align: center; border: 1px solid #000;">ตำแหน่ง</th>
              ${dayHeadersHTML}
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>
      </div>

      <!-- Bottom Section: Summary + Signatures -->
      <table style="width: 100%;">
        <tr>
          <!-- Summary Section -->

          <td style="width: 40%; vertical-align: top; padding-right: 15px;">
            <div style="font-size: 12px; font-weight: bold; padding: 5px 8px; background: #e0e0e0; border: 1px solid #000; border-bottom: none;">
              ตารางสรุปข้อมูล
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <thead>
                <tr style="background: #d9e8ff;">
                  <th style="padding: 4px 6px; border: 1px solid #000; text-align: center;">ตำแหน่ง</th>
                  <th style="padding: 4px 6px; border: 1px solid #000; text-align: center;">อัตรา</th>
                  <th style="padding: 4px 6px; border: 1px solid #000; text-align: center;">จำนวน (วัน)</th>
                  <th style="padding: 4px 6px; border: 1px solid #000; text-align: center;">รวมเป็นเงิน</th>
                </tr>
              </thead>
              <tbody>
                ${positionRowsHTML}
                ${sickRowHTML}
                <tr style="background: #f5f5f5; font-weight: bold;">
                  <td colspan="2" style="padding: 4px 6px; border: 1px solid #000;">รวม</td>
                  <td style="padding: 4px 6px; border: 1px solid #000; text-align: center;">${totalAbsentDays}</td>
                  <td style="padding: 4px 6px; border: 1px solid #000; text-align: right;">${totalDeductionRaw.toLocaleString()}</td>
                </tr>
                ${subProjectRowsHTML}
                <tr style="font-weight: bold;">
                  <td colspan="3" style="padding: 4px 6px; border: 1px solid #000;">รวมยอดลดหนี้ก่อนภาษีมูลค่าเพิ่ม</td>
                  <td style="padding: 4px 6px; border: 1px solid #000; text-align: right;">${netDeduction.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 4px 6px; border: 1px solid #000;">ภาษีมูลค่าเพิ่ม 7%</td>
                  <td style="padding: 4px 6px; border: 1px solid #000; text-align: right;">${vatAmount.toLocaleString()}</td>
                </tr>
                <tr style="background: #333; color: white; font-weight: bold;">
                  <td colspan="3" style="padding: 5px 6px; border: 1px solid #000;">รวมภาษีมูลค่าเพิ่ม 7%</td>
                  <td style="padding: 5px 6px; border: 1px solid #000; text-align: right;">${totalWithVat.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </td>
          
          <!-- Signature Section -->
          <td style="width: 60%; vertical-align: top;">
            <table style="width: 100%;">
              <tr>
                <td style="text-align: center; width: 50%; vertical-align: top; padding: 0 5px;">
                  <div style="border: 1px solid #000; padding: 12px 8px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 35px;">ผู้จัดทำ</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ลงชื่อ ................................</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">(..................................)</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ตำแหน่ง ผู้จัดการอาคาร</div>
                    <div style="font-size: 10px;">วันที่ ${formatThaiDateFull(dayjs())}</div>
                  </div>
                </td>
                <td style="text-align: center; width: 50%; vertical-align: top; padding: 0 5px;">
                  <div style="border: 1px solid #000; padding: 12px 8px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 35px;">ผู้ตรวจสอบ/อนุมัติ</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ลงชื่อ ................................</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">(..................................)</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ตำแหน่ง ................................</div>
                    <div style="font-size: 10px;">วันที่ ........./........./.........</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <div style="margin-top: 8px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 5px;">
        เอกสารฉบับนี้จัดทำโดยระบบจัดการตารางเวร (Shift Work Management System) | พิมพ์เมื่อ ${formatThaiDateFull(dayjs())}
      </div>
    </div>
  `;

  // Create temporary element - must be visible for html2canvas to work
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1200px';
  container.style.background = 'white';
  document.body.appendChild(container);

  const pdfContent = container.querySelector('#pdf-content') as HTMLElement;
  
  if (!pdfContent) {
    console.error('PDF content element not found');
    document.body.removeChild(container);
    return;
  }

  // PDF options - fit to single page
  const opt = {
    margin: [3, 3, 3, 3] as [number, number, number, number],
    filename: `รายงานการเข้าทำงาน_${data.project.name}_${formatThaiDate(data.month)}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.95 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: { 
      unit: 'mm' as const, 
      format: 'a4' as const, 
      orientation: 'landscape' as const
    }
  };

  // Generate PDF
  return html2pdf()
    .set(opt)
    .from(pdfContent)
    .save()
    .then(() => {
      document.body.removeChild(container);
    })
    .catch((err: any) => {
      console.error('PDF generation error:', err);
      document.body.removeChild(container);
    });
};
