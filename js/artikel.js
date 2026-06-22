(function() {
    function collectRedirectDefinitions() {
        if (typeof categories === 'undefined' || !categories) return;
        const definitions = {};
        for (const catKey in categories) {
            if (!categories[catKey].topics) continue;
            categories[catKey].topics.forEach(function(topic) {
                if (!topic.content) return;
                const regex = /<\[\{([^}]+)\}\]>([\s\S]*?)<\/\[\{\1\}\]>/g;
                let match;
                while ((match = regex.exec(topic.content)) !== null) {
                    const name = match[1].trim();
                    const content = match[2];
                    if (name && !definitions[name]) {
                        definitions[name] = content;
                    }
                }
            });
        }
        window.redirectDefinitions = definitions;
    }

    function collectPreviewDefinitions() {
        if (typeof categories === 'undefined' || !categories) return;
        const definitions = {};
        for (const catKey in categories) {
            if (!categories[catKey].topics) continue;
            categories[catKey].topics.forEach(function(topic) {
                if (!topic.previews) return;
                topic.previews.forEach(function(preview) {
                    if (preview.name && !definitions[preview.name]) {
                        definitions[preview.name] = preview.files || [];
                    }
                });
            });
        }
        window.previewDefinitions = definitions;
    }

    if (typeof categories !== 'undefined') {
        collectRedirectDefinitions();
        collectPreviewDefinitions();
    } else {
        window.addEventListener('DOMContentLoaded', function() {
            collectRedirectDefinitions();
            collectPreviewDefinitions();
        });
    }
})();

(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const catKey = urlParams.get('cat');
    const topicId = urlParams.get('topic');
    const breadcrumb = document.getElementById('breadcrumb');
    const judul = document.getElementById('artikel-judul');
    const isi = document.getElementById('artikel-isi');

    function processContent(content, tags) {
        if (!content) return '';

        let processed = content;

        processed = processed.replace(/<\[\{([^}]+)\}\]>([\s\S]*?)<\/\[\{\1\}\]>/g, function(match, name, inner) {
            return inner;
        });

        processed = processed.replace(/<\[redirect\]>\s*\{([^}]+)\}\s*<\/\[redirect\]>/g, function(match, redirectName) {
            const escapedName = redirectName.replace(/"/g, '&quot;');
            return `<span class="redirect-tombol" data-redirect="${escapedName}">${redirectName}</span>`;
        });

        processed = processed.replace(/<quiz>([\s\S]*?)<\/quiz>\s*<answer>([\s\S]*?)<\/answer>/g, function(match, question, answer) {
            return `<div class="quiz-block">
                <div class="quiz-question">
                    <div class="quiz-question-text">${question}</div>
                    <button class="quiz-show-more">Lihat selengkapnya</button>
                </div>
                <div class="quiz-answer">${answer}</div>
            </div>`;
        });

        processed = processed.replace(/<preview>([^<]+)<\/preview>/g, function(match, name) {
            const files = window.previewDefinitions && window.previewDefinitions[name.trim()] ? window.previewDefinitions[name.trim()] : [];
            if (files.length === 0) return '<div class="catatan-text">Preview tidak tersedia</div>';
            const filesHtml = files.map(function(f, i) {
                if (f.type === 'video') return `<video src="../img/preview/${f.src}" controls class="preview-media ${i===0?'active':''}" data-index="${i}"></video>`;
                return `<img src="../img/preview/${f.src}" class="preview-media ${i===0?'active':''}" data-index="${i}" alt="preview">`;
            }).join('');
            const dots = files.map(function(_, i) {
                return `<span class="preview-dot ${i===0?'active':''}" data-index="${i}"></span>`;
            }).join('');
            return `<div class="preview-container" data-preview="${name.trim()}">
                <div class="preview-media-wrapper">${filesHtml}</div>
                <div class="preview-indicators">${dots}</div>
                <button class="preview-nav prev">&lt;</button>
                <button class="preview-nav next">&gt;</button>
            </div>`;
        });

        processed = processed.replace(/\*\*(.*?)\*\*/g, '<span class="highlight-text">$1</span>');
        processed = processed.replace(/!!(.*?)!!/g, '<div class="catatan-text">$1</div>');

        if (tags && tags.length > 0) {
            tags.forEach(function(tagObj) {
                const tagText = tagObj.tag;
                if (!tagText) return;
                const escapedTag = tagText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\(\\(${escapedTag}\\)\\)`, 'g');
                processed = processed.replace(regex, `<span class="kitab-tombol" data-tag="${tagText}">${tagText}</span>`);
            });
        }

        return processed;
    }

    function showError(message, withHomeLink) {
        if (withHomeLink === undefined) withHomeLink = true;
        document.title = 'Kitabku - Error';
        if (judul) judul.textContent = 'Terjadi masalah';
        let html = `<p>${message}</p>`;
        if (withHomeLink) {
            html += `<p style="text-align: center; margin-top: 20px;"><a href="../index.html" class="action-link" style="display: inline-block; padding: 8px 16px; background: #c4a27a; color: white; border-radius: 40px; text-decoration: none;">Kembali ke Home</a></p>`;
        }
        if (isi) isi.innerHTML = html;
        if (breadcrumb) breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <span>Error</span>`;
    }

    if (!catKey || !topicId) {
        showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
        return;
    }

    if (!window.categories) {
        showError('Data tidak tersedia. Pastikan data.json dapat diakses.', true);
        return;
    }

    if (!window.categories[catKey]) {
        showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
        return;
    }

    const category = window.categories[catKey];
    const topic = category.topics.find(function(t) { return t.id === topicId; });

    if (!topic) {
        showError('Tidak dapat menampilkan halaman untuk anda! Silahkan refresh halaman browser anda dan masukkan alamat url yang benar, terima kasih.', true);
        return;
    }

    if (!topic.content || topic.content.trim() === '') {
        document.title = 'Kitabku - Dalam Pengembangan';
        if (judul) judul.textContent = 'Dalam pengembangan';
        if (isi) {
            isi.innerHTML = '<div class="catatan-text" style="text-align: center; font-size: 1.2rem;">Maaf, kami tidak dapat menampilkan halaman untuk anda saat ini! Silahkan tunggu beberapa hari kemudian untuk update lebih lanjut tentang halaman ini, terima kasih.</div>';
        }
        if (breadcrumb) {
            breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <a href="daftar.html?cat=${catKey}">${category.title}</a> <span class="separator">›</span> <span>${topic.title}</span>`;
        }
    } else {
        document.title = `Kitabku - ${topic.title}`;
        if (judul) judul.textContent = topic.title;
        if (isi) {
            isi.innerHTML = processContent(topic.content, topic.tags);

            document.querySelectorAll('.quiz-block').forEach(function(block) {
                const questionDiv = block.querySelector('.quiz-question');
                const showBtn = block.querySelector('.quiz-show-more');
                if (questionDiv) {
                    questionDiv.addEventListener('click', function(e) {
                        if (e.target === showBtn) return;
                        block.classList.toggle('expanded');
                    });
                }
                if (showBtn) {
                    showBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        block.classList.add('expanded');
                    });
                }
            });

            document.querySelectorAll('.preview-container').forEach(function(container) {
                const mediaElements = container.querySelectorAll('.preview-media');
                const dots = container.querySelectorAll('.preview-dot');
                const prevBtn = container.querySelector('.preview-nav.prev');
                const nextBtn = container.querySelector('.preview-nav.next');
                let currentIndex = 0;

                function showSlide(index) {
                    mediaElements.forEach(function(m) { m.classList.remove('active'); });
                    dots.forEach(function(d) { d.classList.remove('active'); });
                    if (mediaElements[index]) {
                        mediaElements[index].classList.add('active');
                        dots[index].classList.add('active');
                        currentIndex = index;
                    }
                }

                if (prevBtn) {
                    prevBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const newIndex = (currentIndex - 1 + mediaElements.length) % mediaElements.length;
                        showSlide(newIndex);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const newIndex = (currentIndex + 1) % mediaElements.length;
                        showSlide(newIndex);
                    });
                }

                dots.forEach(function(dot) {
                    dot.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const index = parseInt(this.getAttribute('data-index'), 10);
                        showSlide(index);
                    });
                });
            });
        }
        if (breadcrumb) {
            breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <a href="daftar.html?cat=${catKey}">${category.title}</a> <span class="separator">›</span> <span>${topic.title}</span>`;
        }
    }
})();
