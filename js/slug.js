// ============================================================
// BayuOne — Slug routing helper
// ============================================================
// Reads the current URL path and returns:
//   null                                  — for home/unknown pages
//   { type: 'Agenda', slug: '...' }       — for /agenda/{slug}
//   { type: 'Trainer', slug: '...' }      — for /trainer/{slug}
//   { type: 'Talent', slug: '...' }       — for /talent/{slug}
//
// Also provides findRecordBySlug() to look up the matching
// record inside the shared data cache.
// ============================================================

import { bayuData } from './data-loader.js?v=6b';

// ------------------------------------------------------------
// Route parsing
// ------------------------------------------------------------

// Map slug prefix → record type in the app
const PREFIX_TO_TYPE = {
    agenda: 'Agenda',
    trainer: 'Trainer',
    talent: 'Talent'
};

export function getSlugRoute() {
    // Use window.location.pathname — the part after the domain
    // Examples:
    //   "/"                              → home
    //   "/trainer/ahmad-rahman-123"      → trainer detail
    //   "/repo-name/trainer/ahmad-rahman" → (GitHub Pages sub-path)

    const path = window.location.pathname || '/';

    // Split into non-empty segments
    const parts = path.split('/').filter(Boolean);

    // Walk the parts looking for a known prefix followed by a slug
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

// ------------------------------------------------------------
// Record lookup
// ------------------------------------------------------------

export function findRecordBySlug(type, slug) {
    if (!type || !slug) return null;
    const lower = slug.toLowerCase();

    // Look up in the loaded applications cache
    const record = (bayuData.applications || []).find(item => {
        if (item.type !== type) return false;
        if (item.approval !== 'Approved') return false;
        const itemSlug = (item.slug || '').toLowerCase();
        return itemSlug === lower;
    });

    return record || null;
}

// ------------------------------------------------------------
// Public URL builder — used by cards to link to detail pages
// ------------------------------------------------------------

export function buildDetailUrl(type, slug) {
    const prefixMap = {
        'Agenda': 'agenda',
        'Trainer': 'trainer',
        'Talent': 'talent'
    };
    const prefix = prefixMap[type];
    if (!prefix || !slug) return '/';

    // Build a root-relative URL that always starts with "/".
    // The browser will resolve it against the current domain.
    return `/${prefix}/${encodeURIComponent(slug)}`;
}
