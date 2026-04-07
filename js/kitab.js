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
