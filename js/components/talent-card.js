// ============================================================
// BayuOne — Talent card component
// ============================================================
// Amendment 4: all imports bumped to ?v=6b3.
// ============================================================

import { getPromotionalBadgeHtml } from '../helpers.js?v=6b3';
import { buildDetailUrl } from '../slug.js?v=6b3';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

export function renderTalentCard(item) {
    const displayName = item.name || item.title;
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
                        <p class="text-xs text-brand font-semibold">${item.niche || 'Bakat Tempatan'}</p>
                        <p class="text-[11px] text-brand-muted mt-0.5"><i class="fa-solid fa-location-dot mr-1"></i>${item.location || 'Sabah'}</p>
                    </div>
                </div>
                <p class="text-xs text-brand-muted leading-relaxed line-clamp-3">${item.summary || 'Tiada maklumat ringkasan profil.'}</p>
            </div>
            <div class="pt-4 mt-4 border-t border-brand-border">
                <a href="${buildDetailUrl('Talent', item.slug)}" class="w-full bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors block text-center">Lihat Profil</a>
            </div>
        </div>`;
}
