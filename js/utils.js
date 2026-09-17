// ============================================================
// BayuOne — Small utility functions
// ============================================================
// Pure functions with no dependencies. Safe to import anywhere.
// ============================================================

// Today's date in YYYY-MM-DD (local time).
export function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Convert ISO date (YYYY-MM-DD or full timestamp) to DD-MM-YYYY.
export function formatDateDisplay(iso) {
    if (!iso) return '';
    const s = String(iso).split('T')[0];
    const parts = s.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Count words in a string (whitespace-delimited).
export function countWords(str) {
    const t = (str || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
}

// Calculate the "tarikh tamat" of a promotion given a start date
// and a validity label such as "1 Bulan", "3 Bulan", "6 Bulan", "1 Tahun".
// Returns YYYY-MM-DD or "" if invalid.
export function calculateTarikhTamat(startDateStr, validityPeriod) {
    if (!startDateStr || !validityPeriod) return '';
    const [y, m, d] = startDateStr.split('-').map(Number);
    let targetYear = y;
    let targetMonth = m - 1;
    let targetDay = d;
    let addMonths = 0;
    if (validityPeriod === '1 Bulan') addMonths = 1;
    else if (validityPeriod === '3 Bulan') addMonths = 3;
    else if (validityPeriod === '6 Bulan') addMonths = 6;
    else if (validityPeriod === '1 Tahun') addMonths = 12;
    if (addMonths === 0) return '';
    targetMonth += addMonths;
    while (targetMonth > 11) {
        targetMonth -= 12;
        targetYear += 1;
    }
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    if (targetDay > lastDayOfTargetMonth) targetDay = lastDayOfTargetMonth;
    const resultDate = new Date(targetYear, targetMonth, targetDay);
    const rY = resultDate.getFullYear();
    const rM = String(resultDate.getMonth() + 1).padStart(2, '0');
    const rD = String(resultDate.getDate()).padStart(2, '0');
    return `${rY}-${rM}-${rD}`;
}

// Escape HTML special characters so user content is safe to inject.
export function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
