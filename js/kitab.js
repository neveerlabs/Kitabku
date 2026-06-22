// js/kitab.js
const kitabModal = document.getElementById('kitabModal');
const kitabModalHeader = document.getElementById('kitabModalHeader');
const kitabModalBody = document.getElementById('kitabModalBody');

function openKitabModal(header, kontenArab) {
    kitabModalHeader.textContent = header;
    kitabModalBody.innerHTML = kontenArab;
    kitabModal.classList.add('show');
}
function closeKitabModalFunc() {
    kitabModal.classList.remove('show');
}

window.addEventListener('click', function(event) {
    if (event.target === kitabModal) {
        closeKitabModalFunc();
    }
});

document.addEventListener('click', function(event) {
    const target = event.target;
    if (target.classList.contains('kitab-tombol')) {
        const tag = target.getAttribute('data-tag');
        const urlParams = new URLSearchParams(window.location.search);
        const catKey = urlParams.get('cat');
        const topicId = urlParams.get('topic');

        if (catKey && topicId && categories[catKey]) {
            const category = categories[catKey];
            const topic = category.topics.find(t => t.id === topicId);
            if (topic && topic.tags) {
                const tagData = topic.tags.find(t => t.tag === tag);
                if (tagData) {
                    openKitabModal(tagData.header, tagData.kitab);
                } else {
                    alert('Terjadi kesalahan pada penundaan data kitab!');
                }
            }
        }
    }
});

(function() {
    function ensureRedirectModal() {
        if (document.getElementById('redirectModal')) return;
        const modal = document.createElement('div');
        modal.className = 'modal kitab-modal';
        modal.id = 'redirectModal';
        modal.innerHTML = `
            <div class="modal-content paper-texture">
                <div class="modal-header">
                    <h3 id="redirectModalHeader">Konten Terkait</h3>
                    <button class="close-modal" id="closeRedirectModal"><i class="far fa-times-circle"></i></button>
                </div>
                <div class="modal-body" id="redirectModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('closeRedirectModal').addEventListener('click', function() {
            modal.classList.remove('show');
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.remove('show');
        });
    }

    window.openRedirectModal = function(htmlContent) {
        ensureRedirectModal();
        const modal = document.getElementById('redirectModal');
        const body = document.getElementById('redirectModalBody');
        body.innerHTML = htmlContent;
        modal.classList.add('show');
    };

    document.addEventListener('click', function(event) {
        const target = event.target;
        if (target.classList.contains('redirect-tombol')) {
            const redirectName = target.getAttribute('data-redirect');
            if (redirectName && window.redirectDefinitions && window.redirectDefinitions[redirectName]) {
                openRedirectModal(window.redirectDefinitions[redirectName]);
            } else {
                alert('Konten redirect tidak ditemukan untuk: ' + redirectName);
            }
        }
    });
})();
