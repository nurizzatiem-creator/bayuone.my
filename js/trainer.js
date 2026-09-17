// ============================================================
// BayuOne — Trainer rendering + filtering
// ============================================================

import { bayuData } from './data-loader.js';
import {
    sortByPromotion,
    getPromotionalBadgeHtml,
    getTrainerCertDisplayList
} from './helpers.js';

// ------------------------------------------------------------
// Filtering
// ------------------------------------------------------------

function getTrainerFiltered() {
    const name = (document.getElementById('filter-trainer-name')?.value || '').toLowerCase().trim();
    const exp = (document.getElementById('filter-trainer-expertise')?.value || '').trim();
    const loc = (document.getElementById('filter-trainer-location')?.value || '').trim();
    const cert = (document.getElementById('filter-trainer-cert')?.value || '').trim();
    const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    return bayuData.applications.filter(item => {
        if (item.type !== 'Trainer') return false;
        if (item.approval !== 'Approved') return false;
        if (name && !(item.name || '').toLowerCase().includes(name)) return false;
        if (exp && !(item.expertise || []).includes(exp)) return false;
        if (loc && (item.location || '') !== loc) return false;
        if (cert) {
            const rawCerts = item.certs || [];
            const custom = (item.certCustom || '').trim();
            if (cert === 'Lain-Lain') {
                if (!(rawCerts.includes('Lain-Lain') && custom !== '')) return false;
            } else {
                if (!rawCerts.includes(cert)) return false;
            }
        }
        if (q) {
            const certList = getTrainerCertDisplayList(item);
            const hay = ((item.name || '') + ' ' + (item.title || '') + ' ' +
                (item.location || '') + ' ' + (item.summary || '') + ' ' +
                (item.expertise || []).join(' ') + ' ' + certList.join(' ')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

// ------------------------------------------------------------
// Card builder
// ------------------------------------------------------------

function buildTrainerCard(item) {
    const displayName = item.name || item.title;
    const expTags = (item.expertise || [])
        .map(exp => `<span class="bg-brand-bg text-brand text-[10px] font-semibold px-2 py-0.5 rounded-md border border-brand-border">${exp}</span>`)
        .join(' ');
    const certList = getTrainerCertDisplayList(item);
    const certTags = certList
        .map(cert => `<span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">${cert}</span>`)
        .join(' ');
    const certDisplay = certList.length > 0 ? `<div class="flex flex-wrap gap-1">${certTags}</div>` : '';
    const badgeHtml = getPromotionalBadgeHtml(item);
    const promoBadgeBlock = badgeHtml ? `<div class="flex flex-wrap gap-1">${badgeHtml}</div>` : '';

    return `
        <div class="bg-white rounded-2xl border border-brand-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div class="space-y-4">
                ${promoBadgeBlock}
                <div class="flex items-center gap-4">
                    <img src="${item.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'}" alt="${displayName}" class="w-16 h-16 rounded-2xl object-cover border border-brand-border shrink-0">
                    <div>
                        <h3 class="text-base font-bold text-brand-dark">${displayName}</h3>
                        <p class="text-xs text-brand-muted font-medium">${item.title || 'Trainer Profesional'}</p>
                        <p class="text-[11px] text-brand font-semibold mt-1"><i class="fa-solid fa-location-dot mr-1"></i>${item.location || 'Sabah'}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1">${expTags}</div>
                <p class="text-xs text-brand-muted leading-relaxed line-clamp-3">${item.summary || 'Tiada maklumat ringkasan profil.'}</p>
            </div>
            <div class="pt-4 mt-4 border-t border-brand-border flex items-center justify-between">
                ${certDisplay}
                <a href="${item.url || 'https://www.tiktok.com/@bayuone.my'}" target="_blank" class="bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors">Lihat Profil</a>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function renderTrainer() {
    const container = document.getElementById('grid-trainer');
    if (!container) return;
    container.innerHTML = '';
    const sorted = sortByPromotion(getTrainerFiltered());
    sorted.forEach(item => {
        container.innerHTML += buildTrainerCard(item);
    });
}

export function filterTrainer() {
    renderTrainer();
}

export function resetTrainerFilters() {
    document.getElementById('filter-trainer-name').value = '';
    document.getElementById('filter-trainer-expertise').value = '';
    document.getElementById('filter-trainer-location').value = '';
    document.getElementById('filter-trainer-cert').value = '';
    const gs = document.getElementById('global-search');
    if (gs) gs.value = '';
    renderTrainer();
}
