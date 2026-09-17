// ============================================================
// BayuOne — Talent rendering + filtering
// ============================================================

import { bayuData } from './data-loader.js';
import {
    sortByPromotion,
    getPromotionalBadgeHtml
} from './helpers.js';

// ------------------------------------------------------------
// Filtering
// ------------------------------------------------------------

function getTalentFiltered() {
    const name = (document.getElementById('filter-talent-name')?.value || '').toLowerCase().trim();
    const niche = (document.getElementById('filter-talent-niche')?.value || '').trim();
    const loc = (document.getElementById('filter-talent-location')?.value || '').trim();
    const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    return bayuData.applications.filter(item => {
        if (item.type !== 'Talent') return false;
        if (item.approval !== 'Approved') return false;
        if (name && !(item.name || '').toLowerCase().includes(name)) return false;
        if (niche && (item.niche || '') !== niche) return false;
        if (loc && (item.location || '') !== loc) return false;
        if (q) {
            const hay = ((item.name || '') + ' ' + (item.title || '') + ' ' + (item.niche || '') + ' ' +
                (item.location || '') + ' ' + (item.summary || '')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

// ------------------------------------------------------------
// Card builder
// ------------------------------------------------------------

function buildTalentCard(item) {
    const displayName = item.name || item.title;
    const badgeHtml = getPromotionalBadgeHtml(item);
    const promoBadgeBlock = badgeHtml ? `<div class="flex flex-wrap gap-1">${badgeHtml}</div>` : '';

    return `
        <div class="bg-white rounded-2xl border border-brand-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div class="space-y-4">
                ${promoBadgeBlock}
                <div class="flex items-center gap-4">
                    <img src="${item.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}" alt="${displayName}" class="w-16 h-16 rounded-2xl object-cover border border-brand-border shrink-0">
                    <div>
                        <h3 class="text-base font-bold text-brand-dark">${displayName}</h3>
                        <p class="text-xs text-brand font-semibold">${item.niche || 'Bakat Tempatan'}</p>
                        <p class="text-[11px] text-brand-muted mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${item.location || 'Sabah'}</p>
                    </div>
                </div>
                <p class="text-xs text-brand-muted leading-relaxed line-clamp-3">${item.summary || 'Tiada maklumat ringkasan profil.'}</p>
            </div>
            <div class="pt-4 mt-4 border-t border-brand-border">
                <a href="${item.url || 'https://www.tiktok.com/@bayuone.my'}" target="_blank" class="w-full bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors block text-center">Lihat Profil</a>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function renderTalent() {
    const container = document.getElementById('grid-talent');
    if (!container) return;
    container.innerHTML = '';
    const sorted = sortByPromotion(getTalentFiltered());
    sorted.forEach(item => {
        container.innerHTML += buildTalentCard(item);
    });
}

export function filterTalent() {
    renderTalent();
}

export function resetTalentFilters() {
    document.getElementById('filter-talent-name').value = '';
    document.getElementById('filter-talent-niche').value = '';
    document.getElementById('filter-talent-location').value = '';
    const gs = document.getElementById('global-search');
    if (gs) gs.value = '';
    renderTalent();
}
