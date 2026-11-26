import { describe, it, expect } from 'bun:test';
import { generateBuktiPPDB } from '../src/lib/server/pdf/bukti-ppdb';
import { writeFileSync } from 'node:fs';

const base = {
	schoolName: 'MTs Negeri 1 Contoh',
	schoolAddress: 'Jl. Pendidikan No. 1',
	schoolPhone: '021-123456',
	schoolEmail: 'info@mtscontoh.sch.id',
	batchName: 'Gelombang 1',
	academicYearName: '2025/2026',
	registrationNumber: 'PPDB-2026-0001',
	fullName: 'Ahmad Fauzi',
	nisn: '1234567890',
	nik: '3175012301900001',
	gender: 'L',
	birthPlace: 'Jakarta',
	birthDate: '2010-05-12',
	religion: 'Islam',
	address: 'Jl. Melati No. 5',
	phone: '08123456789',
	email: 'ahmad@example.com',
	previousSchool: 'SDN 01 Contoh',
	graduationYear: '2025',
	track: 'reguler',
	majorChoice: 'Umum',
	parentName: 'Budi Santoso',
	parentPhone: '08198765432',
	parentJob: 'Wiraswasta',
	status: 'submitted',
	selectionScore: null,
	notes: null,
	enrolledClass: null,
	createdAt: Date.now()
};

describe('generateBuktiPPDB', () => {
	it('menghasilkan PDF yang valid', () => {
		const pdf = generateBuktiPPDB(base);
		expect(pdf.slice(0, 5).toString()).toBe('%PDF-');
		expect(pdf.length).toBeGreaterThan(1000);
		writeFileSync('/tmp/bukti-test.pdf', pdf);
	});
});
