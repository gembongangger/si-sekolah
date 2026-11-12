import type { School } from '$lib/server/db/schema';

const DEFAULT_THEME: Record<string, string> = {
	'--primary': '#0f172a',
	'--primary-foreground': '#ffffff',
	'--secondary': '#64748b',
	'--success': '#10b981',
	'--success-foreground': '#ffffff',
	'--destructive': '#ef4444',
	'--destructive-foreground': '#ffffff',
	'--warning': '#eab308',
	'--warning-foreground': '#000000',
	'--info': '#6366f1',
	'--info-foreground': '#ffffff',
	'--ring': '#10b981'
};

function contrastColor(hex: string): string {
	const h = hex.replace('#', '');
	const r = parseInt(h.slice(0, 2), 16);
	const g = parseInt(h.slice(2, 4), 16);
	const b = parseInt(h.slice(4, 6), 16);
	// perceived brightness (ITU-R BT.601 luma), 0..1
	const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return lum > 0.5 ? '#000000' : '#ffffff';
}

export function schoolToCssVars(school: School | null): Record<string, string> {
	if (!school) {
		return DEFAULT_THEME;
	}

	const primary = school.primary_color ?? DEFAULT_THEME['--primary'];
	const success = school.accent_success ?? DEFAULT_THEME['--success'];
	const destructive = school.accent_danger ?? DEFAULT_THEME['--destructive'];
	const warning = school.accent_warning ?? DEFAULT_THEME['--warning'];
	const info = school.accent_info ?? DEFAULT_THEME['--info'];

	return {
		'--primary': primary,
		'--primary-foreground': contrastColor(primary),
		'--secondary': school.secondary_color ?? DEFAULT_THEME['--secondary'],
		'--success': success,
		'--success-foreground': contrastColor(success),
		'--destructive': destructive,
		'--destructive-foreground': contrastColor(destructive),
		'--warning': warning,
		'--warning-foreground': contrastColor(warning),
		'--info': info,
		'--info-foreground': contrastColor(info),
		'--ring': school.primary_color ?? DEFAULT_THEME['--ring']
	};
}

export function applySchoolTheme(school: School | null): void {
	const vars = schoolToCssVars(school);
	Object.entries(vars).forEach(([key, value]) => {
		document.documentElement.style.setProperty(key, value);
	});
}

export function resetTheme(): void {
	applySchoolTheme(null);
}
