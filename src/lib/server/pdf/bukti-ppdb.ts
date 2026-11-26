// Server-side PDF generator untuk Bukti Pendaftaran PPDB
// Tidak menggunakan dependency eksternal; pure TypeScript → PDF 1.4 (Helvetica)

type RGB = [number, number, number];

interface RegData {
	schoolName: string;
	schoolAddress: string | null;
	schoolPhone: string | null;
	schoolEmail: string | null;
	batchName: string;
	academicYearName: string;
	registrationNumber: string;
	fullName: string;
	nisn: string | null;
	nik: string | null;
	gender: string;
	birthPlace: string | null;
	birthDate: string | null;
	religion: string | null;
	address: string | null;
	phone: string | null;
	email: string | null;
	previousSchool: string | null;
	graduationYear: string | null;
	track: string | null;
	majorChoice: string | null;
	parentName: string | null;
	parentPhone: string | null;
	parentJob: string | null;
	status: string;
	selectionScore: number | null;
	notes: string | null;
	enrolledClass: string | null;
	createdAt: number;
}

const W = 595.28;
const H = 841.89;
const M = 48;
const CW = W - 2 * M;

// Helvetica widths (approx: 0.5 * size per char for rough centering)
function textWidth(str: string, size: number): number {
	return str.length * size * 0.5;
}

function esc(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(text: string, maxWidth: number, size: number): string[] {
	const words = text.split(' ');
	const lines: string[] = [];
	let cur = '';
	for (const w of words) {
		const test = cur ? cur + ' ' + w : w;
		if (textWidth(test, size) <= maxWidth) {
			cur = test;
		} else {
			lines.push(cur);
			cur = w;
		}
	}
	if (cur) lines.push(cur);
	return lines;
}

function drawRect(x: number, y: number, w: number, h: number, fill?: RGB, stroke?: RGB): string {
	const parts: string[] = [];
	if (fill) parts.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg`);
	if (stroke) parts.push(`${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG`);
	parts.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
	parts.push(fill && stroke ? 'B' : fill ? 'f' : 'S');
	return parts.join(' ');
}

function drawLine(x1: number, y1: number, x2: number, y2: number, width = 1, color: RGB = [0.5, 0.5, 0.5]): string {
	return `${width} w ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
}

function textOut(x: number, y: number, str: string, size: number, font = '/F1', color?: RGB): string {
	const parts: string[] = ['BT'];
	if (color) parts.push(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`);
	parts.push(`/${font} ${size} Tf`);
	parts.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
	parts.push(`(${esc(str)}) Tj`);
	parts.push('ET');
	return parts.join(' ');
}

function textOutMultiline(x: number, yStart: number, lines: string[], size: number, leading: number, font = '/F1', color?: RGB): string {
	const parts: string[] = ['BT'];
	if (color) parts.push(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`);
	parts.push(`/${font} ${size} Tf`);
	parts.push(`1 0 0 1 ${x.toFixed(2)} ${yStart.toFixed(2)} Tm`);
	for (let i = 0; i < lines.length; i++) {
		if (i > 0) parts.push(`0 ${(-leading).toFixed(2)} Td`);
		parts.push(`(${esc(lines[i])}) Tj`);
	}
	parts.push('ET');
	return parts.join(' ');
}

export function generateBuktiPPDB(reg: RegData): Uint8Array {
	const created = new Date(reg.createdAt);
	const dateStr = created.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
	const timeStr = created.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

	const statusLabel: Record<string, string> = {
		submitted: 'Pendaftaran Diterima',
		verified: 'Berkas Terverifikasi',
		accepted: 'DITERIMA / LULUS',
		rejected: 'Tidak Lulus',
		enrolled: 'Siswa Aktif'
	};
	const trackLabel: Record<string, string> = {
		reguler: 'Reguler', prestasi: 'Prestasi', zonasi: 'Zonasi', afirmasi: 'Afirmasi'
	};

	const genderLabel = reg.gender === 'L' ? 'Laki-laki' : 'Perempuan';
	const trackDisplay = reg.track ? trackLabel[reg.track] ?? reg.track : '-';

	// Build content stream lines
	const cmds: string[] = [];

	// Page border
	cmds.push(drawRect(M - 4, M - 4, CW + 8, H - 2 * M + 8, undefined, [0.7, 0.7, 0.7]));

	// Header band (blue)
	const headerH = 72;
	cmds.push(drawRect(M - 4, H - M - headerH + 4, CW + 8, headerH, [0.12, 0.35, 0.65]));
	cmds.push(textOut(M + 8, H - M - 18, reg.schoolName.toUpperCase(), 14, '/F2', [1, 1, 1]));
	const addrLine = [reg.schoolAddress, reg.schoolPhone, reg.schoolEmail].filter(Boolean).join('  |  ');
	cmds.push(textOut(M + 8, H - M - 34, addrLine, 8, '/F1', [1, 1, 1]));
	cmds.push(textOut(M + 8, H - M - 46, `Tahun Ajaran: ${reg.academicYearName}  |  Gelombang: ${reg.batchName}`, 8, '/F1', [1, 1, 1]));

	// Title
	const titleY = H - M - headerH - 30;
	cmds.push(textOut((W - textWidth('BUKTI PENDAFTARAN PESERTA DIDIK BARU', 16)) / 2, titleY, 'BUKTI PENDAFTARAN PESERTA DIDIK BARU', 16, '/F2'));
	cmds.push(drawLine(M, titleY - 8, W - M, titleY - 8, 1, [0.7, 0.7, 0.7]));

	// Reg number box
	const boxY = titleY - 40;
	cmds.push(drawRect(M, boxY, CW, 24, [0.95, 0.95, 0.97], [0.6, 0.6, 0.6]));
	cmds.push(textOut(M + 6, boxY + 6, `Nomor Registrasi: ${reg.registrationNumber}`, 11, '/F2'));

	// Table helper
	let cursorY = boxY - 20;
	const rowH = 18;
	const labelW = 160;
	const valueX = M + labelW + 8;
	const valueW = CW - labelW - 8;

	function addRow(label: string, value: string | null, fontLabel = '/F1', fontValue = '/F1', size = 9) {
		if (!value) value = '-';
		const lines = wrapText(value, valueW, size);
		const h = Math.max(rowH, lines.length * (size + 2) + 4);
		// label
		cmds.push(textOut(M + 4, cursorY - 10, label, size, fontLabel, [0.3, 0.3, 0.3]));
		// value
		cmds.push(textOutMultiline(valueX, cursorY - 6, lines, size, size + 2, fontValue));
		// separator line
		cmds.push(drawLine(M, cursorY - h + 2, W - M, cursorY - h + 2, 0.5, [0.85, 0.85, 0.85]));
		cursorY -= h;
	}

	function addSection(title: string) {
		cursorY -= 6;
		cmds.push(textOut(M + 4, cursorY - 2, title, 11, '/F2', [0.12, 0.35, 0.65]));
		cursorY -= 10;
		cmds.push(drawLine(M, cursorY, W - M, cursorY, 1, [0.12, 0.35, 0.65]));
		cursorY -= 6;
	}

	// Data Pribadi
	addSection('DATA PRIBADI');
	addRow('Nama Lengkap', reg.fullName, '/F1', '/F2', 10);
	addRow('NISN', reg.nisn);
	addRow('NIK', reg.nik);
	addRow('Jenis Kelamin', genderLabel);
	const ttl = [reg.birthPlace, reg.birthDate ? new Date(reg.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null].filter(Boolean).join(', ');
	addRow('Tempat / Tgl Lahir', ttl);
	addRow('Agama', reg.religion);
	addRow('Alamat', reg.address);
	addRow('No. Telepon', reg.phone);
	addRow('Email', reg.email);

	// Data Pendidikan
	addSection('DATA PENDIDIKAN');
	addRow('Sekolah Asal', reg.previousSchool);
	addRow('Tahun Lulus', reg.graduationYear);
	addRow('Jalur PPDB', trackDisplay);
	addRow('Pilihan Jurusan', reg.majorChoice);

	// Data Orang Tua
	addSection('DATA ORANG TUA / WALI');
	addRow('Nama Ayah / Wali', reg.parentName);
	addRow('Pekerjaan', reg.parentJob);
	addRow('No. Telepon', reg.parentPhone);

	// Status
	addSection('STATUS PENDAFTARAN');
	const statusText = statusLabel[reg.status] ?? reg.status;
	const statusColor: Record<string, RGB> = {
		submitted: [0.5, 0.5, 0.5],
		verified: [0.85, 0.65, 0.13],
		accepted: [0.13, 0.7, 0.3],
		rejected: [0.85, 0.2, 0.2],
		enrolled: [0.12, 0.35, 0.65]
	};
	const sc = statusColor[reg.status] ?? [0.5, 0.5, 0.5];
	cmds.push(drawRect(M + 4, cursorY - 20, 120, 22, sc));
	cmds.push(textOutMultiline(M + 10, cursorY - 12, [statusText], 9, 11, '/F2', [1, 1, 1]));
	cursorY -= 26;
	addRow('Skor Seleksi', reg.selectionScore !== null && reg.selectionScore !== undefined ? String(reg.selectionScore) : '-');
	if (reg.enrolledClass) addRow('Kelas Diterima', reg.enrolledClass);
	if (reg.notes) addRow('Catatan', reg.notes);

	// Footer
	cursorY -= 20;
	cmds.push(drawLine(M, cursorY, W - M, cursorY, 1, [0.7, 0.7, 0.7]));
	cursorY -= 18;
	cmds.push(textOut(M + 4, cursorY, `Dicetak pada: ${dateStr} ${timeStr}`, 8, '/F1', [0.5, 0.5, 0.5]));
	cmds.push(textOut(W - M - textWidth('SISKO — Sistem Informasi Sekolah', 8), cursorY, 'SISKO — Sistem Informasi Sekolah', 8, '/F1', [0.5, 0.5, 0.5]));
	cursorY -= 14;
	cmds.push(textOut(M + 4, cursorY, 'Dokumen ini merupakan bukti pendaftaran resmi dan tidak memerlukan tanda tangan basah.', 7, '/F1', [0.6, 0.6, 0.6]));

	const contentStream = cmds.join('\n');

	// PDF object builder
	const objects: string[] = [];

	// 1 Catalog
	objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
	// 2 Pages
	objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

	// 3 Page
	objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W.toFixed(2) + ' ' + H.toFixed(2) + '] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj');

	// 4 Contents
	const contentBytes = Buffer.from(contentStream, 'latin1');
	objects.push(`4 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}\nendstream\nendobj`);

	// 5 Font Helvetica
	objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj');
	// 6 Font Helvetica-Bold
	objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj');

	// xref
	let offset = 0;
	const xrefOffsets: number[] = [0]; // dummy for 0
	const header = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
	let out = header;
	for (const obj of objects) {
		xrefOffsets.push(out.length);
		out += obj + '\n';
	}
	const xrefStart = out.length;
	out += 'xref\n';
	out += `0 ${objects.length + 1}\n`;
	out += '0000000000 65535 f \n';
	for (let i = 1; i <= objects.length; i++) {
		out += xrefOffsets[i].toString().padStart(10, '0') + ' 00000 n \n';
	}
	out += 'trailer\n';
	out += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
	out += 'startxref\n';
	out += xrefStart.toString() + '\n';
	out += '%%EOF';

	return Buffer.from(out, 'latin1');
}