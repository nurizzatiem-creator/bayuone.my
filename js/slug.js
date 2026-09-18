// ============================================================
// BayuOne — Slug routing helper
// ============================================================
// Amendment 4: data-loader import bumped to ?v=6b3.
// ============================================================

import { bayuData } from './data-loader.js?v=6b3';

const PREFIX_TO_TYPE = {
    agenda: 'Agenda',
    trainer: 'Trainer',
    talent: 'Talent'
};

export function getSlugRoute() {
    const path = window.location.pathname || '/';
    const parts = path.split('/').filter(Boolean);

    for (let i = 0; i < parts.length - 1; i++) {
        const prefix = parts[i].toLowerCase();
        if (PREFIX_TO_TYPE[prefix]) {
            const slug = decodeURIComponent(parts[i + 1] || '').trim();
            if (slug) {
                return {
                    type: PREFIX_TO_TYPE[prefix],
                    slug: slug
                };
            }
        }
    }
    return null;
}

export function findRecordBySlug(type, slug) {
    if (!type || !slug) return null;
    const lower = slug.toLowerCase();
    const record = (bayuData.applications || []).find(item => {
        if (item.type !== type) return false;
        if (item.approval !== 'Approved') return false;
        const itemSlug = (item.slug || '').toLowerCase();
        return itemSlug === lower;
    });
    return record || null;
}

export function buildDetailUrl(type, slug) {
    const prefixMap = {
        'Agenda': 'agenda',
        'Trainer': 'trainer',
        'Talent': 'talent'
    };
    const prefix = prefixMap[type];
    if (!prefix || !slug) return '/';

    // Always return a root-relative URL.
    return `/${prefix}/${encodeURIComponent(slug)}`;
}
