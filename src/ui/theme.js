/**
 * XetaX mobile design tokens — one calm, professional palette shared by every
 * screen. Brand indigo matches the XetaX web panel; neutrals lean slightly cool.
 */
export const colors = {
  brand: '#4F46E5',
  brandDark: '#3730A3',
  brandSoft: '#EEF2FF',
  brandText: '#4338CA',

  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F8',
  border: '#E4E7F0',
  borderStrong: '#CFD4E3',

  text: '#161B2E',
  text2: '#4E5670',
  text3: '#8A92AB',
  inverse: '#FFFFFF',

  success: '#16A34A',
  successSoft: '#E8F8EE',
  warning: '#D97706',
  warningSoft: '#FEF3E2',
  danger: '#DC2626',
  dangerSoft: '#FDEBEB',
  info: '#0284C7',
  infoSoft: '#E5F4FD',
  whatsapp: '#25D366'
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  body2: { fontSize: 13.5, color: colors.text2, lineHeight: 19 },
  caption: { fontSize: 12, color: colors.text3 },
  label: { fontSize: 12, fontWeight: '600', color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.4 }
};

export const shadow = {
  card: {
    shadowColor: '#161B2E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  }
};

/** Stable colour for a stage/status/user name so the same label always looks the same. */
export function hueFor(label) {
  const palette = [
  ['#EEF1FF', '#2F3FBF'], ['#E8F8EE', '#15803D'], ['#FEF3E2', '#B45309'],
  ['#E5F4FD', '#0369A1'], ['#FDEBEB', '#B91C1C'], ['#F3E8FF', '#7E22CE'],
  ['#ECFEFF', '#0E7490'], ['#FCE7F3', '#BE185D']];

  let h = 0;
  for (const ch of String(label || '')) h = h * 31 + ch.charCodeAt(0) >>> 0;
  const [bg, fg] = palette[h % palette.length];
  return { bg, fg };
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatMoney(value) {
  const n = Number(value || 0);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
