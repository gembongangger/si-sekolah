/**
 * Generator jadwal: menempatkan semua sesi mengajar (dari distribusi
 * kelas–mapel–guru) ke slot waktu yang tersedia tanpa benturan kelas/guru.
 *
 * Greedy + banyak percobaan acak. Cukup untuk ukuran jadwal sekolah biasa;
 * bila tidak semua sesi tertampung, hasil terbaik dikembalikan agar UI bisa
 * melaporkan sesi yang belum terjadwal.
 */

export type GenTask = {
	classId: number;
	subjectId: number;
	teacherId: number;
	sessions: number;
	/** Rentang jam ideal untuk mapel prioritas, format HH:MM. */
	preferredStart?: string | null;
	preferredEnd?: string | null;
};

export type GenSlot = {
	id: number;
	day: number;
	/** Jam mulai slot, format HH:MM. */
	start?: string | null;
};

export type GenExisting = {
	classId: number;
	teacherId: number;
	slotId: number;
};

export type GenPlacement = {
	classId: number;
	subjectId: number;
	teacherId: number;
	slotId: number;
	day: number;
};

export type Unscheduled = {
	classId: number;
	subjectId: number;
	teacherId: number;
	count: number;
};

export type GenerateResult = {
	placements: GenPlacement[];
	unscheduled: Unscheduled[];
	total: number;
	placed: number;
};

type Session = {
	classId: number;
	subjectId: number;
	teacherId: number;
	preferredStart?: string | null;
	preferredEnd?: string | null;
};

const key2 = (a: number, b: number) => `${a}:${b}`;
const key3 = (a: number, b: number, c: number) => `${a}:${b}:${c}`;

/** PRNG deterministik agar hasil bisa diulang. */
function random(seed: number) {
	let state = seed >>> 0;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

function shuffle<T>(items: T[], rand: () => number) {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[items[i], items[j]] = [items[j], items[i]];
	}
	return items;
}

function isInPreferredWindow(session: Session, slot: GenSlot) {
	if (!session.preferredStart || !session.preferredEnd || !slot.start) return false;
	return slot.start >= session.preferredStart && slot.start < session.preferredEnd;
}

export function generateSchedule(
	tasks: GenTask[],
	slots: GenSlot[],
	existing: GenExisting[] = [],
	attempts = 120
): GenerateResult {
	const sessions: Session[] = [];
	const teacherLoad = new Map<number, number>();
	const classLoad = new Map<number, number>();

	for (const task of tasks) {
		const count = Math.max(0, Math.floor(task.sessions));
		for (let i = 0; i < count; i++) {
			sessions.push({
				classId: task.classId,
				subjectId: task.subjectId,
				teacherId: task.teacherId,
				preferredStart: task.preferredStart,
				preferredEnd: task.preferredEnd
			});
		}
		teacherLoad.set(task.teacherId, (teacherLoad.get(task.teacherId) ?? 0) + count);
		classLoad.set(task.classId, (classLoad.get(task.classId) ?? 0) + count);
	}

	const total = sessions.length;
	if (total === 0 || slots.length === 0) {
		return {
			placements: [],
			unscheduled: summarizeMissing(sessions),
			total,
			placed: 0
		};
	}

	const baseClass = new Set(existing.map((e) => key2(e.classId, e.slotId)));
	const baseTeacher = new Set(existing.map((e) => key2(e.teacherId, e.slotId)));

	// Mapel prioritas lebih dulu, lalu guru/kelas tersibuk: paling sulit ditempatkan.
	const compareSessions = (a: Session, b: Session) => {
		const byPriority =
			Number(!!(b.preferredStart && b.preferredEnd)) -
			Number(!!(a.preferredStart && a.preferredEnd));
		if (byPriority !== 0) return byPriority;
		const byTeacher = (teacherLoad.get(b.teacherId) ?? 0) - (teacherLoad.get(a.teacherId) ?? 0);
		if (byTeacher !== 0) return byTeacher;
		const byClass = (classLoad.get(b.classId) ?? 0) - (classLoad.get(a.classId) ?? 0);
		if (byClass !== 0) return byClass;
		return a.subjectId - b.subjectId;
	};

	const ordered = [...sessions].sort(compareSessions);

	let best: { placements: GenPlacement[]; missing: Session[] } | null = null;

	for (let attempt = 0; attempt < attempts; attempt++) {
		const rand = random(attempt + 1);
		const classBusy = new Set(baseClass);
		const teacherBusy = new Set(baseTeacher);
		const subjectDay = new Set<string>();
		const classDayCount = new Map<string, number>();
		const teacherDayCount = new Map<string, number>();
		const placements: GenPlacement[] = [];
		const missing: Session[] = [];

		const attemptOrder =
			attempt === 0 ? ordered : shuffle([...sessions], rand).sort(compareSessions);

		for (const session of attemptOrder) {
			let bestScore = Number.POSITIVE_INFINITY;
			let candidates: GenSlot[] = [];
			const hasPreference = !!(session.preferredStart && session.preferredEnd);

			for (const slot of slots) {
				if (classBusy.has(key2(session.classId, slot.id))) continue;
				if (teacherBusy.has(key2(session.teacherId, slot.id))) continue;

				const sameSubjectToday = subjectDay.has(
					key3(session.classId, session.subjectId, slot.day)
				);
				const classDay = classDayCount.get(key2(session.classId, slot.day)) ?? 0;
				const teacherDay = teacherDayCount.get(key2(session.teacherId, slot.day)) ?? 0;
				// Prioritas waktu = preferensi lunak; tetap bisa keluar rentang bila penuh.
				const outsidePreference = hasPreference && !isInPreferredWindow(session, slot) ? 500 : 0;
				const score =
					outsidePreference + (sameSubjectToday ? 5000 : 0) + classDay * 10 + teacherDay;

				if (score < bestScore) {
					bestScore = score;
					candidates = [slot];
				} else if (score === bestScore) {
					candidates.push(slot);
				}
			}

			if (candidates.length === 0) {
				missing.push(session);
				continue;
			}

			const slot = candidates[Math.floor(rand() * candidates.length)];
			classBusy.add(key2(session.classId, slot.id));
			teacherBusy.add(key2(session.teacherId, slot.id));
			subjectDay.add(key3(session.classId, session.subjectId, slot.day));
			classDayCount.set(
				key2(session.classId, slot.day),
				(classDayCount.get(key2(session.classId, slot.day)) ?? 0) + 1
			);
			teacherDayCount.set(
				key2(session.teacherId, slot.day),
				(teacherDayCount.get(key2(session.teacherId, slot.day)) ?? 0) + 1
			);

			placements.push({
				classId: session.classId,
				subjectId: session.subjectId,
				teacherId: session.teacherId,
				slotId: slot.id,
				day: slot.day
			});
		}

		if (!best || missing.length < best.missing.length) {
			best = { placements, missing };
		}
		if (missing.length === 0) break;
	}

	return {
		placements: best?.placements ?? [],
		unscheduled: summarizeMissing(best?.missing ?? sessions),
		total,
		placed: best?.placements.length ?? 0
	};
}

function summarizeMissing(missing: Session[]): Unscheduled[] {
	const counts = new Map<string, Unscheduled>();
	for (const session of missing) {
		const key = key3(session.classId, session.subjectId, session.teacherId);
		const current = counts.get(key);
		if (current) current.count++;
		else
			counts.set(key, {
				classId: session.classId,
				subjectId: session.subjectId,
				teacherId: session.teacherId,
				count: 1
			});
	}

	return [...counts.values()];
}
