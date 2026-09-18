// ============================================================
// BayuOne — Agenda card component
// ============================================================
// Shared renderer for Agenda event cards. Used by:
//   - js/agenda.js (list view)
//   - Future: detail/slug pages
// ============================================================

import {
    getAgendaDateRange,
    getPriceDisplay,
    getPromotionalBadgeHtml
} from '../helpers.js?v=6b';
import { formatDateDisplay } from '../utils.js?v=6b';
import { buildDetailUrl } from '../slug.js?v=6b';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
const TIKTOK_URL = 'https://www.tiktok.com/@bayuone.my';

export function renderAgendaCard(item) {
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
                    <img src="${item.photo || FALLBACK_PHOTO}" alt="${displayTitle}" class="w-full h-full object-cover">
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
                <a href="${buildDetailUrl('Agenda', item.slug)}" class="w-full bg-brand-bg hover:bg-brand text-brand hover:text-white border border-brand-border font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                    <span>Lihat Detail</span>
                    <i class="fa-solid fa-arrow-right text-[10px]"></i>
                </a>
            </div>
        </div>`;
}
