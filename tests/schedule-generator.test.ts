import { expect, test } from 'bun:test';
import { generateSchedule, type GenSlot, type GenTask } from '../src/lib/server/schedule-generator';

const slots: GenSlot[] = [];
for (let day = 1; day <= 3; day++) {
	for (let slot = 1; slot <= 4; slot++) slots.push({ id: day * 10 + slot, day });
}

test('menempatkan semua sesi tanpa benturan kelas/guru', () => {
	const tasks: GenTask[] = [
		{ classId: 1, subjectId: 1, teacherId: 10, sessions: 2 },
		{ classId: 1, subjectId: 2, teacherId: 11, sessions: 2 },
		{ classId: 2, subjectId: 1, teacherId: 10, sessions: 2 },
		{ classId: 2, subjectId: 2, teacherId: 11, sessions: 2 }
	];

	const result = generateSchedule(tasks, slots);

	expect(result.placed).toBe(8);
	expect(result.unscheduled).toEqual([]);
	expect(new Set(result.placements.map((p) => `${p.classId}:${p.slotId}`)).size).toBe(8);
	expect(new Set(result.placements.map((p) => `${p.teacherId}:${p.slotId}`)).size).toBe(8);
});

test('melaporkan sesi yang tidak tertampung', () => {
	const tasks: GenTask[] = [
		{ classId: 1, subjectId: 1, teacherId: 10, sessions: 20 }
	];

	const result = generateSchedule(tasks, slots.slice(0, 4));

	expect(result.placed).toBe(4);
	expect(result.unscheduled).toEqual([
		{ classId: 1, subjectId: 1, teacherId: 10, count: 16 }
	]);
});

test('mapel prioritas ditempatkan di rentang jam yang diminta', () => {
	const timeSlots: GenSlot[] = [
		{ id: 1, day: 1, start: '07:00' },
		{ id: 2, day: 1, start: '13:00' },
		{ id: 3, day: 2, start: '07:00' },
		{ id: 4, day: 2, start: '13:00' }
	];
	const tasks: GenTask[] = [
		{
			classId: 1,
			subjectId: 1,
			teacherId: 10,
			sessions: 2,
			preferredStart: '07:00',
			preferredEnd: '10:00'
		},
		{ classId: 1, subjectId: 2, teacherId: 11, sessions: 2 }
	];

	const result = generateSchedule(tasks, timeSlots);
	const prioritized = result.placements.filter((p) => p.subjectId === 1);

	expect(prioritized).toHaveLength(2);
	for (const placement of prioritized) {
		const slot = timeSlots.find((s) => s.id === placement.slotId)!;
		expect(slot.start! < '10:00').toBe(true);
	}
});
