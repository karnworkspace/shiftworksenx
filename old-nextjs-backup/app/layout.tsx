import type { Metadata } from 'next';
import { Sarabun } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบจัดการเวรปฏิบัติงาน - SENX Juristic',
  description: 'ระบบจัดการเวรและบริหารค่าใช้จ่ายสำหรับนิติบุคคลอาคารชุดและหมู่บ้านจัดสรร',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={sarabun.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
