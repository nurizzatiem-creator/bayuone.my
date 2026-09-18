// ============================================================
// BayuOne — Share popup (BayuOne-wide sharing)
// ============================================================
// Amendment 6: Opens a popup with WhatsApp, Facebook, Threads,
// X, Telegram and Copy Link. Shares the current BayuOne site
// URL. Message text is fixed regardless of page.
// ============================================================

const BAYUONE_URL = 'https://www.bayuone.my';

const SHARE_MESSAGE =
`Saya Jumpa BayuOne! 👋
Platform Komuniti Kemahiran, Bakat & Peluang.

Mau cari event, trainer & talent pun senang!

Ada event, kepakaran atau bakat? Jom daftar di BayuOne.`;

// Full text = message + URL (for platforms that take one field)
function getFullShareText() {
    return SHARE_MESSAGE + '\n\n' + BAYUONE_URL;
}

// ------------------------------------------------------------
// Open / close the popup
// ------------------------------------------------------------

export function openSharePopup() {
    // If the modal does not exist in the DOM, build it once.
    let modal = document.getElementById('modal-share-bayuone');
    if (!modal) {
        modal = buildShareModal();
        document.body.appendChild(modal);
        wireShareButtons(modal);
    }
    modal.classList.remove('hidden');
}

export function closeSharePopup() {
    const modal = document.getElementById('modal-share-bayuone');
    if (modal) modal.classList.add('hidden');
}

// ------------------------------------------------------------
// Build the modal HTML
// ------------------------------------------------------------

function buildShareModal() {
    const wrapper = document.createElement('div');
    wrapper.id = 'modal-share-bayuone';
    wrapper.className = 'fixed inset-0 z-50 hidden overflow-y-auto modal-backdrop flex items-center justify-center p-4';

    wrapper.innerHTML = `
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-brand-border">
            <button data-share-close class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>

            <div class="text-center mb-5">
                <div class="w-14 h-14 bg-brand-bg rounded-2xl mx-auto flex items-center justify-center text-brand text-2xl mb-3">
                    <i class="fa-solid fa-share-nodes"></i>
                </div>
                <h3 class="text-lg font-bold text-brand-dark">Kongsi <span class="brand-text-b">Bayu</span><span class="brand-text-o">One</span></h3>
                <p class="text-xs text-brand-muted mt-2 leading-relaxed">
                    Sebarkan manfaat BayuOne. Kongsi platform ini bersama keluarga, rakan & komuniti anda.
                </p>
            </div>

            <div class="bg-brand-bg rounded-xl p-3 border border-brand-border mb-5">
                <p class="text-[11px] text-brand-dark whitespace-pre-line leading-relaxed">${SHARE_MESSAGE}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3">
                <a data-share="whatsapp" href="#" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </a>
                <a data-share="facebook" href="#" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors">
                    <i class="fa-brands fa-facebook-f"></i> Facebook
                </a>
                <a data-share="threads" href="#" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors">
                    <i class="fa-brands fa-threads"></i> Threads
                </a>
                <a data-share="x" href="#" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors">
                    <i class="fa-brands fa-x-twitter"></i> X
                </a>
                <a data-share="telegram" href="#" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-colors col-span-2">
                    <i class="fa-brands fa-telegram"></i> Telegram
                </a>
            </div>

            <button data-share-copy class="w-full flex items-center justify-center gap-2 bg-brand-bg hover:bg-brand text-brand hover:text-white border border-brand-border font-bold px-4 py-3 rounded-xl text-xs transition-colors mb-2">
                <i class="fa-solid fa-link"></i> <span data-share-copy-label>Salin Link</span>
            </button>

            <button data-share-close-2 class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors">
                Tutup
            </button>
        </div>
    `;
    return wrapper;
}

// ------------------------------------------------------------
// Wire up all buttons
// ------------------------------------------------------------

function wireShareButtons(modal) {
    const encodedText = encodeURIComponent(getFullShareText());
    const encodedTextOnly = encodeURIComponent(SHARE_MESSAGE);
    const encodedUrl = encodeURIComponent(BAYUONE_URL);

    modal.querySelector('[data-share="whatsapp"]').href =
        `https://wa.me/?text=${encodedText}`;

    modal.querySelector('[data-share="facebook"]').href =
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTextOnly}`;

    modal.querySelector('[data-share="threads"]').href =
        `https://www.threads.net/intent/post?text=${encodedText}`;

    modal.querySelector('[data-share="x"]').href =
        `https://twitter.com/intent/tweet?text=${encodedTextOnly}&url=${encodedUrl}`;

    modal.querySelector('[data-share="telegram"]').href =
        `https://t.me/share/url?url=${encodedUrl}&text=${encodedTextOnly}`;

    // Close buttons
    modal.querySelectorAll('[data-share-close], [data-share-close-2]').forEach(btn => {
        btn.addEventListener('click', closeSharePopup);
    });

    // Copy link button
    const copyBtn = modal.querySelector('[data-share-copy]');
    const copyLabel = modal.querySelector('[data-share-copy-label]');
    if (copyBtn && copyLabel) {
        copyBtn.addEventListener('click', async () => {
            const text = getFullShareText();
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                copyLabel.textContent = 'Disalin!';
                setTimeout(() => { copyLabel.textContent = 'Salin Link'; }, 1800);
            } catch (err) {
                prompt('Salin teks ini:', text);
            }
        });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSharePopup();
    });
}
