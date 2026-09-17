// ============================================================
// BayuOne — Business helper functions
// ============================================================
// Functions that combine simple utils into BayuOne-specific
// behaviour: price display, promotion logic, badge HTML, etc.
// ============================================================

import { getTodayStr, formatDateDisplay } from './utils.js';

// ---------- Agenda date range ----------
export function getAgendaDateRange(item) {
    const start = item.date || '';
    const end = item.isOneDay ? start : (item.dateEnd || start);
    return { start, end };
}

// ---------- Price display ----------
export function getPriceDisplay(item) {
    const feeType = item.feeType || 'Percuma';
    if (feeType !== 'Berbayar') return 'Percuma';
    const min = item.hargaMin ? Number(item.hargaMin) : null;
    const max = item.hargaMax ? Number(item.hargaMax) : null;
    if (min && max && max > min) return `RM${min} - RM${max}`;
    if (min) return `RM${min}`;
    if (max) return `RM${max}`;
    if (item.hargaYuran) return item.hargaYuran;
    return 'Percuma';
}

// ---------- Promotion / label logic ----------
export function isPromotionActive(item) {
    if (!item || !item.label || item.label.trim() === '') return false;
    if (!item.tarikhDari || !item.tarikhSehingga) return false;
    const todayStr = getTodayStr();
    return todayStr >= item.tarikhDari && todayStr <= item.tarikhSehingga;
}

export function getPromoPriority(item) {
    if (!isPromotionActive(item)) return 4;
    const lbl = (item.label || '').toUpperCase();
    if (lbl === 'TOP') return 1;
    if (lbl === 'FEATURED') return 2;
    if (lbl === 'PROMOTED') return 3;
    return 4;
}

// Sort an array so that active promotions come first,
// then original order is preserved within each priority group.
export function sortByPromotion(items) {
    return items
        .map((item, idx) => ({ item, idx }))
        .sort((a, b) => {
            const pA = getPromoPriority(a.item);
            const pB = getPromoPriority(b.item);
            if (pA !== pB) return pA - pB;
            return a.idx - b.idx;
        })
        .map(entry => entry.item);
}

export function getPromotionalBadgeHtml(item) {
    if (!isPromotionActive(item)) return '';
    const lbl = (item.label || '').toUpperCase();
    if (lbl === 'TOP') return `<span class="badge-pill badge-top mr-1">TOP</span>`;
    if (lbl === 'FEATURED') return `<span class="badge-pill badge-featured mr-1">FEATURED</span>`;
    if (lbl === 'PROMOTED') return `<span class="badge-pill badge-promoted mr-1">PROMOTED</span>`;
    return '';
}

// ---------- Agenda status ----------
export function getAgendaStatusInfo(item) {
    if (item.statusPenangguhan === 'Dibatalkan') {
        return { code: 'DIBATALKAN', label: 'Dibatalkan' };
    }
    if (item.statusPenangguhan === 'Telah Ditunda') {
        return { code: 'TELAH_DITUNDA', label: 'Telah Ditunda' };
    }
    const { end } = getAgendaDateRange(item);
    const endDate = new Date(end || item.date);
    const today = new Date();
    if (today > endDate) return { code: 'TAMAT', label: 'Telah Tamat' };
    return { code: 'AKAN_DATANG', label: 'Akan Datang' };
}

// ---------- Trainer certificates ----------
export function getTrainerCertDisplayList(item) {
    const rawCerts = item.certs || [];
    const custom = (item.certCustom || '').trim();
    const result = [];
    rawCerts.forEach(c => {
        if (c === 'Lain-Lain') {
            if (custom !== '') result.push(custom);
        } else {
            result.push(c);
        }
    });
    return result;
}

// ---------- Banner status ----------
export function getBannerStatus(banner) {
    const todayStr = getTodayStr();
    if (todayStr < banner.startDate) {
        return { code: 'AKAN_DATANG', label: 'Akan Datang', class: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (todayStr >= banner.startDate && todayStr < banner.endDate) {
        return { code: 'SEDANG_AKTIF', label: 'Sedang Aktif', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { code: 'TELAH_TAMAT', label: 'Telah Tamat', class: 'bg-gray-100 text-gray-600 border-gray-200' };
}

// ---------- Re-export for convenience ----------
export { formatDateDisplay };
