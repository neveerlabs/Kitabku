const urlParams = new URLSearchParams(window.location.search);
const catKey = urlParams.get('cat');
const topicId = urlParams.get('topic');
const breadcrumb = document.getElementById('breadcrumb');
const judul = document.getElementById('artikel-judul');
const isi = document.getElementById('artikel-isi');

function processContent(content, tags) {
    if (!content) return '';
    let processed = content.replace(/\*\*(.*?)\*\*/g, '<span class="highlight-text">$1</span>');
    processed = processed.replace(/!!(.*?)!!/g, '<div class="catatan-text">$1</div>');
    if (tags && tags.length > 0) {
        tags.forEach(tagObj => {
            const tagText = tagObj.tag;
            const escapedTag = tagText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\(\\(${escapedTag}\\)\\)`, 'g');
            processed = processed.replace(regex, `<span class="kitab-tombol" data-tag="${tagText}">${tagText}</span>`);
        });
    }
    return processed;
}
function showError(message, withHomeLink = true) {
    document.title = 'Kitabku - Error';
    judul.textContent = 'Terjadi masalah';
    let html = `<p>${message}</p>`;
    if (withHomeLink) {
        html += `<p style="text-align: center; margin-top: 20px;"><a href="../index.html" class="action-link" style="display: inline-block; padding: 8px 16px; background: #c4a27a; color: white; border-radius: 40px; text-decoration: none;">Kembali ke Home</a></p>`;
    }
    isi.innerHTML = html;
    breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <span>Error</span>`;
}
if (!catKey || !topicId) {
    showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
} else if (!categories[catKey]) {
    showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
} else {
    const category = categories[catKey];
    const topic = category.topics.find(t => t.id === topicId);
    if (!topic) {
        showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
    } else {
        if (!topic.content || topic.content.trim() === '') {
            document.title = `Kitabku - Dalam Pengembangan`;
            judul.textContent = 'Dalam pengembangan';
            isi.innerHTML = '<div class="catatan-text" style="text-align: center; font-size: 1.2rem;">Maaf, kami tidak dapat menampilkan halaman untuk anda saat ini! Silahkan tunggu beberapa hari kemudian untuk update lebih lanjut tentang halaman ini, terima kasih.</div>';
            breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <a href="daftar.html?cat=${catKey}">${category.title}</a> <span class="separator">›</span> <span>${topic.title}</span>`;
        } else {
            document.title = `Kitabku - ${topic.title}`;
            judul.textContent = topic.title;
            isi.innerHTML = processContent(topic.content, topic.tags);
            breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <a href="daftar.html?cat=${catKey}">${category.title}</a> <span class="separator">›</span> <span>${topic.title}</span>`;
        }
    }
}
