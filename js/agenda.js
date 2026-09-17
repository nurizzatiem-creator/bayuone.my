// ============================================================
// BayuOne — Agenda (events) rendering + filtering
// ============================================================

import { bayuData } from './data-loader.js';
import {
    getAgendaDateRange,
    getPriceDisplay,
    isPromotionActive,
    sortByPromotion,
    getPromotionalBadgeHtml,
    getAgendaStatusInfo
} from './helpers.js';
import { formatDateDisplay, getTodayStr } from './utils.js';

// The module-local UI state
let activeQuickFilter = '';
let currentAgendaPage = 1;
const AGENDA_PER_PAGE = 12;

// ------------------------------------------------------------
// Quick filter
// ------------------------------------------------------------

export function setQuickFilter(type) {
    activeQuickFilter = (activeQuickFilter === type) ? '' : type;
    document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
    if (activeQuickFilter) {
        const btn = document.getElementById('qf-' + type);
        if (btn) btn.classList.add('active');
    }
    currentAgendaPage = 1;
    renderAgenda();
}

function getActiveQuickFilter() {
    return activeQuickFilter;
}

// ------------------------------------------------------------
// Filtering
// ------------------------------------------------------------

export function isAgendaActiveOn(item, isoDate) {
    const { start, end } = getAgendaDateRange(item);
    if (!start) return false;
    const e = end || start;
    return isoDate >= start && isoDate <= e;
}

function getAgendaFiltered() {
    const loc = (document.getElementById('filter-agenda-location')?.value || '').trim();
    const mode = (document.getElementById('filter-agenda-mode')?.value || '').trim();
    const cat = (document.getElementById('filter-agenda-category')?.value || '').trim();
    const day = (document.getElementById('filter-agenda-day')?.value || '').trim();
    const month = (document.getElementById('filter-agenda-month')?.value || '').trim();
    const year = (document.getElementById('filter-agenda-year')?.value || '').trim();
    const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    return bayuData.applications.filter(item => {
        if (item.type !== 'Agenda') return false;
        if (item.approval !== 'Approved') return false;
        if (loc && (item.location || '') !== loc) return false;
        if (mode && (item.mode || '') !== mode) return false;
        if (cat && (item.category || '') !== cat) return false;

        const { start, end } = getAgendaDateRange(item);
        if (year || month || day) {
            let matches = false;
            if (year && !month && !day) {
                const ys = start.slice(0, 4);
                const ye = (end || start).slice(0, 4);
                matches = (ys <= year && ye >= year);
            } else if (year && month && !day) {
                const startD = new Date(start);
                const endD = new Date(end || start);
                const monthStart = new Date(`${year}-${month}-01`);
                const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
                matches = (startD <= monthEnd && endD >= monthStart);
            } else if (year && month && day) {
                const target = `${year}-${month}-${day}`;
                matches = isAgendaActiveOn(item, target);
            } else if (month && !year && !day) {
                const sm = start.slice(5, 7);
                const em = (end || start).slice(5, 7);
                matches = (sm === month || em === month || (sm <= month && em >= month));
            } else if (day && !month && !year) {
                const sd = start.slice(8, 10);
                const ed = (end || start).slice(8, 10);
                matches = (sd === day || ed === day || (sd <= day && ed >= day));
            } else if (day && month && !year) {
                const sd = start.slice(5, 10);
                const ed = (end || start).slice(5, 10);
                const target = `${month}-${day}`;
                matches = (sd <= target && ed >= target) || sd === target || ed === target;
            }
            if (!matches) return false;
        }

        if (activeQuickFilter) {
            const today = new Date();
            const startD = new Date(start);
            const endD = new Date(end || start);
            if (activeQuickFilter === 'week') {
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                const weekStart = new Date(today.setDate(diff));
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                if (!(startD <= weekEnd && endD >= weekStart)) return false;
            } else if (activeQuickFilter === 'month') {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                if (!(startD <= monthEnd && endD >= monthStart)) return false;
            } else if (activeQuickFilter === 'year') {
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                yearEnd.setHours(23, 59, 59, 999);
                if (!(startD <= yearEnd && endD >= yearStart)) return false;
            } else if (activeQuickFilter === 'course') {
                const courseCategories = ['Kursus & Latihan', 'Bengkel', 'Seminar & Forum'];
                if (!courseCategories.includes(item.category)) return false;
            }
        }

        if (q) {
            const hay = ((item.title || '') + ' ' + (item.name || '') + ' ' + (item.org || '') + ' ' +
                (item.penganjur || '') + ' ' + (item.location || '') + ' ' +
                (item.category || '') + ' ' + (item.summary || '')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

// ------------------------------------------------------------
// Card builder
// ------------------------------------------------------------

function buildAgendaCard(item) {
    const badgeHtml = getPromotionalBadgeHtml(item);
    const displayTitle = item.title || item.name;
    const priceDisplay = getPriceDisplay(item);
    const { start, end } = getAgendaDateRange(item);
    const dateDisplay = item.isOneDay
        ? formatDateDisplay(start)
        : `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
    const penganjurDisplay = item.org || item.penganjur || item.name || 'Penganjur';

    return `
        <div class="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
                <div class="relative h-48 bg-gray-100 overflow-hidden">
                    <img src="${item.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}" alt="${displayTitle}" class="w-full h-full object-cover">
                    <div class="absolute top-3 left-3 flex flex-wrap gap-1">${badgeHtml}</div>
                    <div class="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg font-semibold">${item.mode || 'Fizikal'}</div>
                </div>
                <div class="p-5 space-y-3">
                    <div class="text-xs font-bold text-brand uppercase tracking-wider">${item.category || 'Program'}</div>
                    <h3 class="text-lg font-bold text-brand-dark leading-snug hover:text-brand transition-colors">${displayTitle}</h3>
                    <div class="text-xs text-brand-muted space-y-1">
                        <div class="flex items-center gap-2"><i class="fa-regular fa-calendar text-brand"></i> ${dateDisplay || 'Akan Datang'}</div>
                        <div class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-brand"></i> ${item.location || 'Sabah'}</div>
                        <div class="flex items-center gap-2"><i class="fa-solid fa-user text-brand"></i> Penganjur: <span class="font-semibold text-brand-dark">${penganjurDisplay}</span></div>
                        <div class="flex items-center gap-2"><i class="fa-solid fa-tag text-brand"></i> Harga Yuran: <span class="font-bold text-brand-dark">${priceDisplay}</span></div>
                    </div>
                </div>
            </div>
            <div class="p-5 pt-0">
                <a href="${item.url || 'https://www.tiktok.com/@bayuone.my'}" target="_blank" class="w-full bg-brand-bg hover:bg-brand text-brand hover:text-white border border-brand-border font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                    <span>Maklumat Lanjut</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------

export function renderAgenda() {
    const upcomingContainer = document.getElementById('grid-agenda-upcoming');
    const endedContainer = document.getElementById('grid-agenda-ended');
    const paginationEl = document.getElementById('agenda-pagination');
    if (!upcomingContainer || !endedContainer) return;

    upcomingContainer.innerHTML = '';
    endedContainer.innerHTML = '';
    if (paginationEl) paginationEl.innerHTML = '';

    const filtered = getAgendaFiltered();
    const promoted = filtered.filter(x => isPromotionActive(x));
    const normal = filtered.filter(x => !isPromotionActive(x));
    const sortedPromoted = sortByPromotion(promoted);
    normal.sort((a, b) => {
        const da = a.date || '9999-12-31';
        const db = b.date || '9999-12-31';
        return da.localeCompare(db);
    });
    const sortedAgenda = [...sortedPromoted, ...normal];

    const upcoming = [];
    const ended = [];
    sortedAgenda.forEach(item => {
        const s = getAgendaStatusInfo(item);
        if (s.code === 'TAMAT' || s.code === 'DIBATALKAN') ended.push(item);
        else upcoming.push(item);
    });

    const totalPages = Math.max(1, Math.ceil(upcoming.length / AGENDA_PER_PAGE));
    if (currentAgendaPage > totalPages) currentAgendaPage = totalPages;
    const startIdx = (currentAgendaPage - 1) * AGENDA_PER_PAGE;
    const pageItems = upcoming.slice(startIdx, startIdx + AGENDA_PER_PAGE);

    pageItems.forEach(item => { upcomingContainer.innerHTML += buildAgendaCard(item); });
    ended.forEach(item => { endedContainer.innerHTML += buildAgendaCard(item); });

    document.getElementById('count-upcoming').textContent = `${upcoming.length} Program`;
    document.getElementById('count-ended').textContent = `${ended.length} Program`;

    if (paginationEl && totalPages > 1) {
        const makeBtn = (label, page, disabled, active) => {
            const b = document.createElement('button');
            b.textContent = label;
            b.className = `px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                active ? 'bg-brand text-white border-brand' :
                disabled ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' :
                'bg-white text-brand-dark border-brand-border hover:border-brand hover:text-brand'
            }`;
            if (!disabled && !active) {
                b.onclick = () => {
                    currentAgendaPage = page;
                    renderAgenda();
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                };
            }
            return b;
        };
        paginationEl.appendChild(makeBtn('«', Math.max(1, currentAgendaPage - 1), currentAgendaPage === 1, false));
        for (let p = 1; p <= totalPages; p++) {
            paginationEl.appendChild(makeBtn(String(p), p, false, p === currentAgendaPage));
        }
        paginationEl.appendChild(makeBtn('»', Math.min(totalPages, currentAgendaPage + 1), currentAgendaPage === totalPages, false));
    }
}

export function filterAgenda() {
    currentAgendaPage = 1;
    renderAgenda();
}

export function resetAgendaFilters() {
    document.getElementById('filter-agenda-location').value = '';
    document.getElementById('filter-agenda-mode').value = '';
    document.getElementById('filter-agenda-category').value = '';
    document.getElementById('filter-agenda-day').value = '';
    document.getElementById('filter-agenda-month').value = '';
    document.getElementById('filter-agenda-year').value = '';
    const gs = document.getElementById('global-search');
    if (gs) gs.value = '';
    activeQuickFilter = '';
    document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
    currentAgendaPage = 1;
    renderAgenda();
}

export function resetCurrentAgendaPage() {
    currentAgendaPage = 1;
}
