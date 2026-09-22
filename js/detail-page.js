// ============================================================
// BayuOne — Detail page renderer
// ============================================================
// Amendment 2:  Malay date range
// Amendment 4:  Trainer/Talent description
// Amendment 9:  Dynamic Trainer share message
// Amendment 10: Dynamic Talent share message
// Amendment 14: Agenda detail 2-column layout
// Phase 3B:     Portfolio (photos + YouTube videos) for Top/Featured/Promoted
// ============================================================

import { loadAllData, bayuData } from './data-loader.js?v=6b5';
import { getSlugRoute, findRecordBySlug } from './slug.js?v=6b5';
import { formatAgendaDateRange } from './utils.js?v=6b5';

function getRoute() {
    const params = new URLSearchParams(window.location.search);
    const qType = (params.get('type') || '').trim();
    const qSlug = (params.get('slug') || '').trim();
    if (qType && qSlug) {
        const typeMap = { agenda: 'Agenda', trainer: 'Trainer', talent: 'Talent' };
        const normalized = typeMap[qType.toLowerCase()];
        if (normalized) return { type: normalized, slug: qSlug };
    }
    const pathRoute = getSlugRoute();
    if (pathRoute) return pathRoute;
    return null;
}

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function priceDisplay(item) {
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

// ------------------------------------------------------------
// Phase 3B: Portfolio helpers
// ------------------------------------------------------------

function getPortfolioLimits(label) {
    const l = (label || '').trim();
    if (l === 'Top') return { photos: 6, videos: 6 };
    if (l === 'Featured') return { photos: 2, videos: 1 };
    if (l === 'Promoted') return { photos: 1, videos: 0 };
    return { photos: 0, videos: 0 };
}

function getPortfolioPhotos(item) {
    const limits = getPortfolioLimits(item.label);
    if (limits.photos === 0) return [];
    const arr = [];
    for (let i = 1; i <= 6; i++) {
        const url = (item['photo_' + i] || '').trim();
        if (url) arr.push(url);
        if (arr.length >= limits.photos) break;
    }
    return arr;
}

function getPortfolioVideos(item) {
    const limits = getPortfolioLimits(item.label);
    if (limits.videos === 0) return [];
    const arr = [];
    for (let i = 1; i <= 6; i++) {
        const url = (item['youtube_' + i] || '').trim();
        if (url) arr.push(url);
        if (arr.length >= limits.videos) break;
    }
    return arr;
}

// Extract YouTube video ID from various URL formats:
//   youtube.com/watch?v=ID
//   youtu.be/ID
//   youtube.com/embed/ID
//   youtube.com/shorts/ID
function getYouTubeId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
        /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

function youtubeThumbnail(url) {
    const id = getYouTubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    return '';
}

// Slider renderer — 3 per row on desktop, 1 per row on mobile
// Uses simple CSS grid + JS pagination. No autoplay.
function renderPortfolioSlider(sectionId, items, renderItemFn) {
    const DESKTOP_PER_PAGE = 3;
    const MOBILE_PER_PAGE = 1;

    const wrapper = document.getElementById(sectionId);
    if (!wrapper) return;

    if (!items || items.length === 0) {
        wrapper.innerHTML = '';
        wrapper.style.display = 'none';
        return;
    }
    wrapper.style.display = 'block';

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const PER_PAGE = isMobile ? MOBILE_PER_PAGE : DESKTOP_PER_PAGE;
    const totalPages = Math.ceil(items.length / PER_PAGE);

    let currentPage = 0;

    function renderPage() {
        const start = currentPage * PER_PAGE;
        const pageItems = items.slice(start, start + PER_PAGE);

        const track = document.createElement('div');
        track.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

        pageItems.forEach(item => {
            track.innerHTML += renderItemFn(item);
        });

        const showNav = items.length > PER_PAGE;

        wrapper.innerHTML = `
            ${track.outerHTML}
            ${showNav ? `
                <div class="flex justify-center gap-3 mt-4">
                    <button type="button" data-prev class="w-10 h-10 rounded-full border border-brand-border bg-white text-brand-dark hover:bg-brand hover:text-white hover:border-brand transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed" ${currentPage === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-chevron-left text-xs"></i>
                    </button>
                    <button type="button" data-next class="w-10 h-10 rounded-full border border-brand-border bg-white text-brand-dark hover:bg-brand hover:text-white hover:border-brand transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
                        <i class="fa-solid fa-chevron-right text-xs"></i>
                    </button>
                </div>
            ` : ''}
        `;

        const prevBtn = wrapper.querySelector('[data-prev]');
        const nextBtn = wrapper.querySelector('[data-next]');
        if (prevBtn) prevBtn.onclick = () => { if (currentPage > 0) { currentPage--; renderPage(); } };
        if (nextBtn) nextBtn.onclick = () => { if (currentPage < totalPages - 1) { currentPage++; renderPage(); } };
    }

    renderPage();
}

function portfolioPhotoItemHtml(url) {
    return `
        <div class="bg-brand-bg border border-brand-border rounded-xl overflow-hidden" style="aspect-ratio: 4/3;">
            <img src="${escapeHtml(url)}" alt="Portfolio" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.display='none'">
        </div>`;
}

function portfolioVideoItemHtml(url) {
    const thumb = youtubeThumbnail(url);
    return `
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="group bg-brand-bg border border-brand-border rounded-xl overflow-hidden relative block" style="aspect-ratio: 4/3;">
            ${thumb ? `<img src="${escapeHtml(thumb)}" alt="YouTube video" class="w-full h-full object-cover" loading="lazy">` : ''}
            <div class="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <i class="fa-solid fa-play text-lg ml-1"></i>
                </div>
            </div>
        </a>`;
}

// Builds the full Portfolio section HTML (photos + videos)
function buildPortfolioSection(item) {
    const photos = getPortfolioPhotos(item);
    const videos = getPortfolioVideos(item);

    if (photos.length === 0 && videos.length === 0) return '';

    return `
        <div class="pt-6 mt-6 border-t border-brand-border">
            <h2 class="text-lg font-bold text-brand-dark mb-4">Portfolio</h2>

            ${photos.length > 0 ? `
                <div class="mb-6">
                    <h3 class="text-sm font-bold text-brand-dark uppercase tracking-wider mb-3">
                        <i class="fa-solid fa-images text-brand mr-1"></i> Photos
                    </h3>
                    <div id="portfolio-photos-slider"></div>
                </div>
            ` : ''}

            ${videos.length > 0 ? `
                <div>
                    <h3 class="text-sm font-bold text-brand-dark uppercase tracking-wider mb-3">
                        <i class="fa-brands fa-youtube text-red-600 mr-1"></i> Videos
                    </h3>
                    <div id="portfolio-videos-slider"></div>
                </div>
            ` : ''}
        </div>`;
}

// Called after the detail HTML is inserted to init the sliders
function initPortfolioSliders(item) {
    const photos = getPortfolioPhotos(item);
    const videos = getPortfolioVideos(item);

    if (photos.length > 0) {
        renderPortfolioSlider('portfolio-photos-slider', photos, portfolioPhotoItemHtml);
    }
    if (videos.length > 0) {
        renderPortfolioSlider('portfolio-videos-slider', videos, portfolioVideoItemHtml);
    }
}

// ------------------------------------------------------------
// Share buttons
// ------------------------------------------------------------

function shareButtonsHtml(item, pageUrl, shareText) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;

    return `
        <div class="flex flex-wrap gap-2">
            <a href="${whatsappUrl}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a href="${facebookUrl}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">
                <i class="fa-brands fa-facebook-f"></i> Facebook
            </a>
            <a href="${twitterUrl}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">
                <i class="fa-brands fa-x-twitter"></i> X
            </a>
            <button data-copy-url="${escapeHtml(pageUrl)}" class="copy-url-btn flex items-center gap-2 bg-brand-bg hover:bg-brand text-brand hover:text-white border border-brand-border font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">
                <i class="fa-solid fa-link"></i> Salin Link
            </button>
        </div>`;
}

// ------------------------------------------------------------
// Agenda detail — 2-column layout
// ------------------------------------------------------------

function renderAgenda(item, pageUrl) {
    const title = item.title || item.name || 'Program';
    const shareText = `Saya Jumpa ${title} di BayuOne. Jom kita join.`;
    const dateRange = formatAgendaDateRange(item.date, item.dateEnd || item.date, item.isOneDay);
    const organiser = item.org || item.penganjur || item.name || 'Penganjur';
    const portfolioHtml = buildPortfolioSection(item);

    document.title = `${title} | BayuOne`;
    return `
        <div class="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div class="p-5 sm:p-6">
                <div class="flex flex-wrap items-center gap-2 mb-5">
                    <span class="badge-pill bg-brand-bg text-brand border border-brand-border">${escapeHtml(item.category || 'Program')}</span>
                    <span class="badge-pill bg-brand-bg text-brand border border-brand-border">${escapeHtml(item.mode || 'Fizikal')}</span>
                    ${item.label ? `<span class="badge-pill badge-featured">${escapeHtml(item.label)}</span>` : ''}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div class="flex justify-center">
                        <div class="w-full bg-brand-bg border border-brand-border rounded-2xl overflow-hidden" style="max-width: 480px;">
                            <img src="${escapeHtml(item.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200')}" alt="${escapeHtml(title)}" class="w-full h-auto object-contain">
                        </div>
                    </div>

                    <div class="flex flex-col gap-5">
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-brand-dark leading-tight">${escapeHtml(title)}</h1>

                        <div class="grid grid-cols-1 gap-3 text-sm text-brand-text">
                            <div class="flex items-start gap-3">
                                <i class="fa-regular fa-calendar text-brand text-lg mt-0.5 w-5"></i>
                                <div>
                                    <div class="font-bold text-brand-dark text-xs uppercase tracking-wider">Tarikh Program</div>
                                    <div class="text-brand-muted mt-0.5">${escapeHtml(dateRange)}</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-brand text-lg mt-0.5 w-5"></i>
                                <div>
                                    <div class="font-bold text-brand-dark text-xs uppercase tracking-wider">Lokasi</div>
                                    <div class="text-brand-muted mt-0.5">${escapeHtml(item.location || 'Sabah')}</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-user text-brand text-lg mt-0.5 w-5"></i>
                                <div>
                                    <div class="font-bold text-brand-dark text-xs uppercase tracking-wider">Penganjur</div>
                                    <div class="text-brand-muted mt-0.5">${escapeHtml(organiser)}</div>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-tag text-brand text-lg mt-0.5 w-5"></i>
                                <div>
                                    <div class="font-bold text-brand-dark text-xs uppercase tracking-wider">Harga Yuran</div>
                                    <div class="text-brand-muted mt-0.5">${escapeHtml(priceDisplay(item))}</div>
                                </div>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-brand-border space-y-2">
                            <h2 class="text-xs font-bold text-brand-dark uppercase tracking-wider">Hubungi & Daftar</h2>
                            <div class="flex flex-wrap gap-2">
                                ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-arrow-up-right-from-square"></i> Daftar / Maklumat Lanjut</a>` : ''}
                                ${item.phone ? `<a href="tel:${escapeHtml(item.phone)}" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-phone"></i> Telefon</a>` : ''}
                                ${item.email ? `<a href="mailto:${escapeHtml(item.email)}" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-envelope"></i> Emel</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-brand-border">
                    <h2 class="text-lg font-bold text-brand-dark mb-3">Keterangan Program</h2>
                    <p class="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">${escapeHtml(item.description || item.summary || 'Tiada keterangan penuh disediakan.')}</p>
                </div>

                ${portfolioHtml}

                <div class="mt-8 pt-6 border-t border-brand-border space-y-3">
                    <h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider">Kongsi</h2>
                    <p class="text-xs text-brand-muted italic">"${escapeHtml(shareText)}"</p>
                    ${shareButtonsHtml(item, pageUrl, shareText)}
                </div>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Trainer detail
// ------------------------------------------------------------

function renderTrainer(item, pageUrl) {
    const name = item.name || 'Trainer';
    const expertiseList = (item.expertise && item.expertise.length > 0)
        ? item.expertise.join(', ')
        : 'profesional';
    const locationText = item.location || 'Sabah';
    const shareText = `Hai! Saya jumpa ${name}, jurulatih ${expertiseList} dari ${locationText}.\n\nSenang cari trainer untuk program di BayuOne!`;
    const expertise = (item.expertise || []).map(e =>
        `<span class="bg-brand-bg text-brand text-xs font-semibold px-3 py-1 rounded-lg border border-brand-border">${escapeHtml(e)}</span>`
    ).join(' ');
    const certs = (item.certs || []).map(c =>
        `<span class="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">${escapeHtml(c)}</span>`
    ).join(' ');
    const portfolioHtml = buildPortfolioSection(item);

    document.title = `${name} | BayuOne`;
    return `
        <div class="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div class="p-6 sm:p-8 space-y-6">
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <img src="${escapeHtml(item.photo || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400')}" alt="${escapeHtml(name)}" class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-brand-border">
                    <div class="text-center sm:text-left flex-1">
                        <h1 class="text-3xl font-extrabold text-brand-dark leading-tight">${escapeHtml(name)}</h1>
                        <p class="text-sm text-brand-muted mt-1">Trainer Profesional</p>
                        <p class="text-sm text-brand font-semibold mt-2"><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(item.location || 'Sabah')}</p>
                    </div>
                </div>
                ${expertise ? `<div class="pt-4 border-t border-brand-border"><h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider mb-3">Bidang Kepakaran</h2><div class="flex flex-wrap gap-2">${expertise}</div></div>` : ''}
                ${certs ? `<div class="pt-4 border-t border-brand-border"><h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider mb-3">Pentauliahan / Sijil</h2><div class="flex flex-wrap gap-2">${certs}</div></div>` : ''}
                <div class="pt-4 border-t border-brand-border">
                    <h2 class="text-lg font-bold text-brand-dark mb-2">Ringkasan Profil</h2>
                    <p class="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">${escapeHtml(item.summary || 'Tiada ringkasan disediakan.')}</p>
                </div>
                ${item.description ? `
                <div class="pt-4 border-t border-brand-border">
                    <h2 class="text-lg font-bold text-brand-dark mb-2">Keterangan Penuh</h2>
                    <p class="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">${escapeHtml(item.description)}</p>
                </div>` : ''}
                ${portfolioHtml}
                <div class="pt-4 border-t border-brand-border space-y-3">
                    <h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider">Hubungi Trainer</h2>
                    <div class="flex flex-wrap gap-2">
                        ${item.phone ? `<a href="tel:${escapeHtml(item.phone)}" class="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-phone"></i> Hubungi Trainer</a>` : ''}
                        ${item.email ? `<a href="mailto:${escapeHtml(item.email)}" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-envelope"></i> Emel</a>` : ''}
                        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-arrow-up-right-from-square"></i> Social Media / Website</a>` : ''}
                    </div>
                </div>
                <div class="pt-4 border-t border-brand-border space-y-3">
                    <h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider">Kongsi</h2>
                    <p class="text-xs text-brand-muted italic">"${escapeHtml(shareText)}"</p>
                    ${shareButtonsHtml(item, pageUrl, shareText)}
                </div>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Talent detail
// ------------------------------------------------------------

function renderTalent(item, pageUrl) {
    const name = item.name || 'Talent';
    const nicheText = (item.niche && String(item.niche).trim() !== '') ? item.niche : 'tempatan';
    const locationText = item.location || 'Sabah';
    const shareText = `Hai! Saya jumpa ${name}, talent untuk niche ${nicheText} dari ${locationText}.\n\nSenang cari talent untuk event atau projek di BayuOne!`;
    const portfolioHtml = buildPortfolioSection(item);

    document.title = `${name} | BayuOne`;
    return `
        <div class="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div class="p-6 sm:p-8 space-y-6">
                <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <img src="${escapeHtml(item.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400')}" alt="${escapeHtml(name)}" class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-brand-border">
                    <div class="text-center sm:text-left flex-1">
                        <h1 class="text-3xl font-extrabold text-brand-dark leading-tight">${escapeHtml(name)}</h1>
                        <p class="text-sm text-brand font-semibold mt-1">${escapeHtml(item.niche || 'Bakat Tempatan')}</p>
                        <p class="text-sm text-brand-muted mt-2"><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(item.location || 'Sabah')}</p>
                    </div>
                </div>
                <div class="pt-4 border-t border-brand-border">
                    <h2 class="text-lg font-bold text-brand-dark mb-2">Ringkasan Profil</h2>
                    <p class="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">${escapeHtml(item.summary || 'Tiada ringkasan disediakan.')}</p>
                </div>
                ${item.description ? `
                <div class="pt-4 border-t border-brand-border">
                    <h2 class="text-lg font-bold text-brand-dark mb-2">Keterangan Penuh</h2>
                    <p class="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">${escapeHtml(item.description)}</p>
                </div>` : ''}
                ${portfolioHtml}
                <div class="pt-4 border-t border-brand-border space-y-3">
                    <h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider">Hubungi Bakat</h2>
                    <div class="flex flex-wrap gap-2">
                        ${item.phone ? `<a href="tel:${escapeHtml(item.phone)}" class="flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-phone"></i> Hubungi Bakat</a>` : ''}
                        ${item.email ? `<a href="mailto:${escapeHtml(item.email)}" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-envelope"></i> Emel</a>` : ''}
                        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="flex items-center gap-2 bg-white border border-brand-border text-brand-dark hover:border-brand font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"><i class="fa-solid fa-arrow-up-right-from-square"></i> Social Media / Website</a>` : ''}
                    </div>
                </div>
                <div class="pt-4 border-t border-brand-border space-y-3">
                    <h2 class="text-sm font-bold text-brand-dark uppercase tracking-wider">Kongsi</h2>
                    <p class="text-xs text-brand-muted italic">"${escapeHtml(shareText)}"</p>
                    ${shareButtonsHtml(item, pageUrl, shareText)}
                </div>
            </div>
        </div>`;
}

// ------------------------------------------------------------
// Not found + meta tags
// ------------------------------------------------------------

function renderNotFound(reason) {
    document.title = 'Profil Tidak Ditemui | BayuOne';
    return `
        <div class="bg-white rounded-2xl border border-brand-border shadow-sm p-10 text-center">
            <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                <i class="fa-solid fa-circle-info"></i>
            </div>
            <h1 class="text-2xl font-extrabold text-brand-dark mb-2">Profil Tidak Ditemui</h1>
            <p class="text-sm text-brand-muted mb-6">${escapeHtml(reason || 'Maklumat ini belum diterbitkan atau tidak lagi tersedia.')}</p>
            <a href="../" class="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                <i class="fa-solid fa-arrow-left"></i> Kembali ke Laman Utama
            </a>
        </div>`;
}

function updateMetaTags(title, description, image, url) {
    const setMeta = (attr, key, content) => {
        if (!content) return;
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'profile');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }
    link.href = url;
}

// ------------------------------------------------------------
// Main render
// ------------------------------------------------------------

async function init() {
    const container = document.getElementById('detail-content');
    const loading = document.getElementById('detail-loading');

    const route = getRoute();

    if (!route) {
        if (container) container.innerHTML = renderNotFound('URL tidak sah.');
        if (loading) loading.classList.add('hidden');
        return;
    }

    await loadAllData();

    const record = findRecordBySlug(route.type, route.slug);

    if (!record) {
        const existsButNotApproved = (bayuData.applications || []).some(
            a => a.type === route.type && (a.slug || '').toLowerCase() === route.slug.toLowerCase()
        );
        const reason = existsButNotApproved
            ? 'Maklumat ini belum diterbitkan secara awam.'
            : `${route.type} tidak ditemui.`;
        if (container) container.innerHTML = renderNotFound(reason);
        if (loading) loading.classList.add('hidden');
        return;
    }

    const pageUrl = window.location.href;

    let html = '';
    if (record.type === 'Agenda') html = renderAgenda(record, pageUrl);
    else if (record.type === 'Trainer') html = renderTrainer(record, pageUrl);
    else if (record.type === 'Talent') html = renderTalent(record, pageUrl);

    if (container) container.innerHTML = html;

    // Phase 3B: initialise portfolio sliders after HTML is in the DOM
    initPortfolioSliders(record);

    const shareTitle = record.title || record.name || 'BayuOne';
    const shareDesc = record.summary || record.description || 'Lihat profil penuh di BayuOne.';
    const shareImg = record.photo || '';
    updateMetaTags(shareTitle, shareDesc, shareImg, pageUrl);

    document.querySelectorAll('.copy-url-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.copyUrl || window.location.href;
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    const original = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Disalin!';
                    setTimeout(() => { btn.innerHTML = original; }, 1800);
                });
            } else {
                prompt('Salin URL ini:', url);
            }
        });
    });

    if (loading) loading.classList.add('hidden');
}

init().catch(err => {
    console.error('Detail page error:', err);
    const container = document.getElementById('detail-content');
    if (container) {
        container.innerHTML = renderNotFound('Ralat teknikal berlaku. Sila cuba lagi.');
    }
    const loading = document.getElementById('detail-loading');
    if (loading) loading.classList.add('hidden');
});
