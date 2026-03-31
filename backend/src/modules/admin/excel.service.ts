import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma';

export const excelService = {
  async generateLearnerReport(): Promise<Buffer> {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        certificates: { include: { course: { select: { title: true } } } },
        progress: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ผู้เรียน');

    sheet.columns = [
      { header: 'ชื่อ', key: 'name', width: 25 },
      { header: 'อีเมล', key: 'email', width: 30 },
      { header: 'เลขบัตรประชาชน', key: 'cid', width: 18 },
      { header: 'สถานพยาบาล', key: 'hospital', width: 30 },
      { header: 'ตำแหน่ง', key: 'position', width: 20 },
      { header: 'จำนวนใบประกาศ', key: 'certs', width: 16 },
      { header: 'เวลาเรียนรวม (ชม.)', key: 'hours', width: 20 },
      { header: 'วันที่สมัคร', key: 'createdAt', width: 20 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7B68EE' } };

    for (const user of users) {
      const totalSeconds = user.progress.reduce((s, p) => s + (p.watchedSeconds ?? 0), 0);
      sheet.addRow({
        name: user.name,
        email: user.email,
        cid: user.cid ?? '-',
        hospital: user.hospital ?? '-',
        position: user.position ?? '-',
        certs: user.certificates.length,
        hours: Math.round((totalSeconds / 3600) * 10) / 10,
        createdAt: user.createdAt.toLocaleDateString('th-TH'),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  },
};
