// ============================================================
// BayuOne — Modal open / close helpers
// ============================================================

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

export function openRegisterModal() {
    openModal('modal-register');
    window.setRegisterType?.('penganjur');
}

export function closeRegisterModal() { closeModal('modal-register'); }
export function closeSubmissionSuccessModal() { closeModal('modal-submission-success'); }
export function openFeedbackModal() { openModal('modal-feedback'); }
export function closeFeedbackModal() { closeModal('modal-feedback'); }
export function closeFeedbackSuccessModal() { closeModal('modal-feedback-success'); }
export function openAdminLoginModal() { openModal('modal-admin-login'); }
export function closeAdminLoginModal() { closeModal('modal-admin-login'); }
export function closeFeedbackPreviewModal() { closeModal('modal-feedback-preview'); }
export function closeAdminReviewModal() { closeModal('modal-admin-review'); }
export function closeBannerModal() { closeModal('modal-banner'); }
export function closePartnerModal() { closeModal('modal-partner'); }
export function closeEditSubscriberModal() { closeModal('modal-edit-subscriber'); }
export function closeDeleteModal() {
    window.__applicationToDelete = null;
    closeModal('modal-confirm-delete');
}
