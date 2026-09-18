// ============================================================
// BayuOne — Trainer card component
// ============================================================

import {
    getPromotionalBadgeHtml,
    getTrainerCertDisplayList
} from '../helpers.js?v=6b3';
import { buildDetailUrl } from '../slug.js?v=6b3';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400';
const TIKTOK_URL = 'https://www.tiktok.com/@bayuone.my';

export function renderTrainerCard(item) {
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
                    <img src="${item.photo || FALLBACK_PHOTO}" alt="${displayName}" class="w-16 h-16 rounded-2xl object-cover border border-brand-border shrink-0">
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
                <a href="${buildDetailUrl('Trainer', item.slug)}" class="bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors">Lihat Profil</a>
            </div>
        </div>`;
}
