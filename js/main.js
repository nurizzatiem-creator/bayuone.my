// ============================================================
// BayuOne — Main entry point
// ============================================================
// This file is the only script tag index.html needs.
// It imports every module, wires up event listeners, and
// exposes global functions used by inline onclick="..." attributes.
//
// Batch 4A: Wired in openSharePopup / closeSharePopup from share-popup.js
// ============================================================

import { db } from './supabase-client.js?v=6b5';
import { loadAllData, bayuData } from './data-loader.js?v=6b5';
import { getTodayStr, countWords } from './utils.js?v=6b5';

// Registration + form helpers
import {
    setRegisterType,
    handleStateChange,
    initLocationDropdowns,
    handleRegisterSubmit,
    togglePenganjurOneDay,
    syncPenganjurEndDate,
    togglePenganjurFee,
    toggleTrainerCertCustom,
    updateTrainerCertCustomCounter
} from './register.js?v=6b5';

// Public renderers
import {
    renderAgenda,
    filterAgenda,
    resetAgendaFilters,
    setQuickFilter,
    resetCurrentAgendaPage,
    isAgendaActiveOn,
    endedSliderPrev,
    endedSliderNext
} from './agenda.js?v=6b5';

import {
    renderTrainer,
    filterTrainer,
    resetTrainerFilters
} from './trainer.js?v=6b5';

import {
    renderTalent,
    filterTalent,
    resetTalentFilters
} from './talent.js?v=6b5';

import {
    renderBanner,
    renderBrandsSupport
} from './banner.js?v=6b3';

// Admin renderers
import {
    renderAdminTable,
    renderBannerTable,
    openAdminReviewModal,
    openBannerModal,
    calculateBannerEndDate,
    handleSaveBanner,
    confirmDeleteBanner,
    handleAdminLogin,
    logoutAdmin,
    confirmDeleteApplication,
    executeDeleteApplication,
    toggleAdminLabelFields,
    onAdminValidityChange,
    onAdminDariChange,
    resetAdminLabelDates,
    handleSaveAdminEdit
} from './admin.js?v=6b5';

// Feedback / subscribers / partners
import {
    renderFeedbackTable,
    handleFeedbackSubmit,
    openFeedbackPreview,
    toggleFeedbackStatus
} from './feedback.js?v=6b5';

import {
    renderSubscriberTable,
    handleSubscribeSubmit,
    openEditSubscriberModal,
    handleSaveSubscriber
} from './subscriber.js?v=6b5';

import {
    openPartnerModal,
    handleSavePartner,
    confirmDeletePartner,
    renderPartnerTable
} from './partner.js?v=6b5';

// Modals
import {
    openRegisterModal,
    closeRegisterModal,
    closeSubmissionSuccessModal,
    openFeedbackModal,
    closeFeedbackModal,
    closeFeedbackSuccessModal,
    openAdminLoginModal,
    closeAdminLoginModal,
    closeFeedbackPreviewModal,
    closeAdminReviewModal,
    closeBannerModal,
    closePartnerModal,
    closeEditSubscriberModal,
    closeDeleteModal
} from './modals.js?v=6b5';

// Tabs / search
import {
    switchTab,
    toggleMobileMenu,
    handleGlobalSearch,
    triggerSearch
} from './tabs.js?v=7c3';

// Share popup (Batch 4A)
import {
    openSharePopup,
    closeSharePopup
} from './share-popup.js?v=6b5';

// ------------------------------------------------------------
// Utility: word counter for trainer/talent summary fields
// ------------------------------------------------------------

function updateWordCounter(inputId, counterId) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;
    const words = countWords(input.value);
    counter.textContent = `${words} / 120 patah perkataan`;
    if (words > 120) {
        counter.classList.add('text-red-600', 'font-bold');
        counter.classList.remove('text-brand-muted');
    } else {
        counter.classList.remove('text-red-600', 'font-bold');
        counter.classList.add('text-brand-muted');
    }
}

// ------------------------------------------------------------
// Populate year/day selects on Agenda filter
// ------------------------------------------------------------

function populateYearDaySelects() {
    const yearSel = document.getElementById('filter-agenda-year');
    const daySel = document.getElementById('filter-agenda-day');
    const thisYear = new Date().getFullYear();

    if (yearSel && yearSel.options.length <= 1) {
        for (let y = thisYear - 2; y <= thisYear + 5; y++) {
            const o = document.createElement('option');
            o.value = String(y);
            o.textContent = String(y);
            yearSel.appendChild(o);
        }
    }
    if (daySel && daySel.options.length <= 1) {
        for (let d = 1; d <= 31; d++) {
            const o = document.createElement('option');
            const v = String(d).padStart(2, '0');
            o.value = v;
            o.textContent = v;
            daySel.appendChild(o);
        }
    }
}

// ------------------------------------------------------------
// Image URL preview listeners for banner/partner modals
// ------------------------------------------------------------

function wireImagePreviews() {
    document.getElementById('banner-photo')?.addEventListener('input', function () {
        const url = this.value.trim();
        const preview = document.getElementById('banner-photo-preview');
        if (!preview) return;
        if (url) {
            preview.classList.remove('hidden');
            preview.querySelector('img').src = url;
        } else {
            preview.classList.add('hidden');
        }
    });

    document.getElementById('partner-image')?.addEventListener('input', function () {
        const url = this.value.trim();
        const preview = document.getElementById('partner-image-preview');
        if (!preview) return;
        if (url) {
            preview.classList.remove('hidden');
            preview.querySelector('img').src = url;
        } else {
            preview.classList.add('hidden');
        }
    });

    document.getElementById('reg-trainer-cert-custom')?.addEventListener('input', updateTrainerCertCustomCounter);
}

// ------------------------------------------------------------
// Refresh every view (used after DB writes)
// ------------------------------------------------------------

function refreshAllViews() {
    renderAgenda();
    renderTrainer();
    renderTalent();
    renderBanner();
    renderBrandsSupport();
    renderAdminTable();
    renderFeedbackTable();
    renderSubscriberTable();
    renderBannerTable();
    renderPartnerTable();
}

// ------------------------------------------------------------
// Expose functions to window for HTML onclick="" attributes
// ------------------------------------------------------------

Object.assign(window, {
    // Tabs / navigation
    switchTab,
    toggleMobileMenu,
    handleGlobalSearch,
    triggerSearch,

    // Share popup (Batch 4A)
    openSharePopup,
    closeSharePopup,

    // Modals
    openRegisterModal,
    closeRegisterModal,
    closeSubmissionSuccessModal,
    openFeedbackModal,
    closeFeedbackModal,
    closeFeedbackSuccessModal,
    openAdminLoginModal,
    closeAdminLoginModal,
    closeFeedbackPreviewModal,
    closeAdminReviewModal,
    closeBannerModal,
    closePartnerModal,
    closeEditSubscriberModal,
    closeDeleteModal,

    // Register form
    setRegisterType,
    handleStateChange,
    handleRegisterSubmit,
    togglePenganjurOneDay,
    syncPenganjurEndDate,
    togglePenganjurFee,
    toggleTrainerCertCustom,

    // Filter / render
    filterAgenda,
    resetAgendaFilters,
    setQuickFilter,
    renderAgenda,
    endedSliderPrev,
    endedSliderNext,
    filterTrainer,
    resetTrainerFilters,
    renderTrainer,
    filterTalent,
    resetTalentFilters,
    renderTalent,
    renderBanner,
    renderBrandsSupport,

    // Admin
    renderAdminTable,
    renderBannerTable,
    openAdminReviewModal,
    openBannerModal,
    calculateBannerEndDate,
    handleSaveBanner,
    confirmDeleteBanner,
    handleAdminLogin,
    logoutAdmin,
    confirmDeleteApplication,
    toggleAdminLabelFields,
    onAdminValidityChange,
    onAdminDariChange,
    resetAdminLabelDates,
    handleSaveAdminEdit,

    // Feedback / subscriber / partner
    renderFeedbackTable,
    handleFeedbackSubmit,
    openFeedbackPreview,
    toggleFeedbackStatus,
    renderSubscriberTable,
    handleSubscribeSubmit,
    openEditSubscriberModal,
    handleSaveSubscriber,
    openPartnerModal,
    handleSavePartner,
    confirmDeletePartner,

    // Utilities
    updateWordCounter,
    resetCurrentAgendaPage,
    refreshAllViews
});

// ------------------------------------------------------------
// Wire up event listeners that cannot live in HTML (form submits)
// ------------------------------------------------------------

function wireFormSubmits() {
    document.getElementById('form-register')?.addEventListener('submit', handleRegisterSubmit);
    document.getElementById('form-feedback')?.addEventListener('submit', handleFeedbackSubmit);
    document.getElementById('subscribe-form')?.addEventListener('submit', handleSubscribeSubmit);
    document.getElementById('form-banner')?.addEventListener('submit', handleSaveBanner);
    document.getElementById('form-partner')?.addEventListener('submit', handleSavePartner);
    document.getElementById('form-edit-subscriber')?.addEventListener('submit', handleSaveSubscriber);
    document.getElementById('reg-penganjur-fee-type')?.addEventListener('change', togglePenganjurFee);
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------

(async function init() {
    initLocationDropdowns();
    populateYearDaySelects();
    wireFormSubmits();
    wireImagePreviews();

    try {
        await db.auth.getSession();
    } catch (err) {
        console.warn('Session check skipped:', err.message);
    }

    await loadAllData();
    refreshAllViews();

    const overlay = document.getElementById('app-loading');
    if (overlay) overlay.style.display = 'none';
})();
