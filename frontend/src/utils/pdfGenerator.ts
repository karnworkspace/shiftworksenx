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

interface DeductionDetail {
  projectName: string;
  amount: number;
  percentage: number;
}

interface ReportData {
  project: Project;
  month: Dayjs;
  staff: Staff[];
  rosterData: RosterData;
  shiftTypes: any[];
  summary: {
    totalAbsent: number;
    ownDeduction: number;
    receivedFromOthers: number;
    receivedDetails: DeductionDetail[];
    grandTotalDeduction: number;
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
  
  // Build day headers HTML
  let dayHeadersHTML = '';
  for (let day = 1; day <= daysInMonth; day++) {
    dayHeadersHTML += `<th style="padding: 4px 2px; text-align: center; border: 1px solid #000; font-weight: normal;">${day}</th>`;
  }

  // Build table rows HTML
  let tableRowsHTML = '';
  data.staff.forEach((staff, index) => {
    const bgColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
    let rowHTML = `<tr style="background-color: ${bgColor};">`;
    rowHTML += `<td style="text-align: center; padding: 4px 3px; border: 1px solid #000; font-size: 9px;">${index + 1}</td>`;
    rowHTML += `<td style="text-align: left; padding: 4px 6px; border: 1px solid #000; white-space: nowrap; font-size: 9px;">${staff.name}</td>`;
    rowHTML += `<td style="text-align: left; padding: 4px 6px; border: 1px solid #000; white-space: nowrap; font-size: 9px;">${staff.position}</td>`;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const shift = data.rosterData[staff.id]?.[day] || 'OFF';
      rowHTML += `<td style="text-align: center; padding: 4px 2px; border: 1px solid #000; font-size: 9px;">${shift}</td>`;
    }
    
    rowHTML += '</tr>';
    tableRowsHTML += rowHTML;
  });

  // Build received from others text
  let receivedHTML = '';
  if (data.summary.receivedDetails.length > 0) {
    data.summary.receivedDetails.forEach(d => {
      receivedHTML += `<tr><td style="padding: 4px 8px; border: 1px solid #000; font-size: 11px;">- ${d.projectName}</td><td style="padding: 4px 8px; border: 1px solid #000; text-align: right; font-size: 11px;">${d.amount.toLocaleString()}</td><td style="padding: 4px 8px; border: 1px solid #000; text-align: center; font-size: 11px;">${d.percentage}%</td></tr>`;
    });
  } else {
    receivedHTML = '<tr><td colspan="3" style="padding: 4px 8px; border: 1px solid #000; text-align: center; font-size: 11px;">- ไม่มี -</td></tr>';
  }

  // Create HTML content - optimized for nearly full A4 landscape page
  const htmlContent = `
    <div id="pdf-content" style="font-family: Tahoma, Arial, sans-serif; padding: 12px 20px; background: white; width: 287mm; height: 190mm; box-sizing: border-box;">
      
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
          ตารางการปฏิบัติงาน (Work Schedule)
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
              สรุปข้อมูล (Summary)
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #000; background: #f9f9f9;"><strong>จำนวนวันขาดงานรวม</strong></td>
                <td style="padding: 5px 8px; border: 1px solid #000; text-align: right; width: 100px;">${data.summary.totalAbsent} วัน</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #000; background: #f9f9f9;"><strong>หักเงินจากโครงการตนเอง</strong></td>
                <td style="padding: 5px 8px; border: 1px solid #000; text-align: right;">${data.summary.ownDeduction.toLocaleString()} บาท</td>
              </tr>
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #000; background: #f9f9f9;" colspan="2"><strong>หักเงินจากโครงการที่แชร์</strong></td>
              </tr>
              ${receivedHTML}
              <tr style="background: #333; color: white;">
                <td style="padding: 6px 8px; border: 1px solid #000;"><strong>รวมหักเงินทั้งหมด</strong></td>
                <td style="padding: 6px 8px; border: 1px solid #000; text-align: right; font-size: 12px;"><strong>${data.summary.grandTotalDeduction.toLocaleString()} บาท</strong></td>
              </tr>
            </table>
          </td>
          
          <!-- Signature Section -->
          <td style="width: 60%; vertical-align: top;">
            <table style="width: 100%;">
              <tr>
                <td style="text-align: center; width: 33%; vertical-align: top; padding: 0 5px;">
                  <div style="border: 1px solid #000; padding: 12px 8px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 35px;">ผู้จัดทำ</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ลงชื่อ ................................</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">(..................................)</div>
                    <div style="font-size: 10px;">วันที่ ${formatThaiDateFull(dayjs())}</div>
                  </div>
                </td>
                <td style="text-align: center; width: 33%; vertical-align: top; padding: 0 5px;">
                  <div style="border: 1px solid #000; padding: 12px 8px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 35px;">ผู้ตรวจสอบ</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ลงชื่อ ................................</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">(..................................)</div>
                    <div style="font-size: 10px;">วันที่ ........./........./.........</div>
                  </div>
                </td>
                <td style="text-align: center; width: 33%; vertical-align: top; padding: 0 5px;">
                  <div style="border: 1px solid #000; padding: 12px 8px;">
                    <div style="font-weight: bold; font-size: 11px; margin-bottom: 35px;">ผู้อนุมัติ</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">ลงชื่อ ................................</div>
                    <div style="font-size: 10px; margin-bottom: 8px;">(..................................)</div>
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
