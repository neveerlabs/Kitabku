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
                    <span class="quiz-question-text">${question}</span>
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

            function initQuizBlocks() {
                document.querySelectorAll('.quiz-block').forEach(function(block) {
                    const textSpan = block.querySelector('.quiz-question-text');
                    const showBtn = block.querySelector('.quiz-show-more');
                    const questionDiv = block.querySelector('.quiz-question');

                    function checkOverflow() {
                        if (textSpan) {
                            const isOverflow = textSpan.scrollWidth > textSpan.clientWidth;
                            block.classList.toggle('has-overflow', isOverflow);
                        }
                    }

                    function toggleBlock(e) {
                        block.classList.toggle('expanded');
                        if (block.classList.contains('expanded')) {
                            block.classList.remove('has-overflow');
                        } else {
                            requestAnimationFrame(function() {
                                setTimeout(checkOverflow, 50);
                            });
                        }
                    }

                    questionDiv.removeEventListener('click', toggleBlock);
                    showBtn.removeEventListener('click', toggleBlock);
                    
                    questionDiv.addEventListener('click', toggleBlock);
                    showBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        toggleBlock(e);
                    });

                    requestAnimationFrame(function() {
                        setTimeout(checkOverflow, 100);
                    });

                    window.addEventListener('resize', function() {
                        if (!block.classList.contains('expanded')) {
                            checkOverflow();
                        }
                    });
                });
            }

            setTimeout(initQuizBlocks, 50);

            document.querySelectorAll('.preview-container').forEach(function(container) {
                const mediaElements = container.querySelectorAll('.preview-media');
                const dots = container.querySelectorAll('.preview-dot');
                const prevBtn = container.querySelector('.preview-nav.prev');
                const nextBtn = container.querySelector('.preview-nav.next');
                let currentIndex = 0;
                let touchStartX = 0;
                let touchStartY = 0;
                let isSwiping = false;

                function showSlide(index) {
                    if (!mediaElements.length) return;
                    index = (index + mediaElements.length) % mediaElements.length;
                    mediaElements.forEach(function(m) { m.classList.remove('active'); });
                    dots.forEach(function(d) { d.classList.remove('active'); });
                    if (mediaElements[index]) {
                        mediaElements[index].classList.add('active');
                        if (dots[index]) dots[index].classList.add('active');
                        currentIndex = index;
                    }
                }

                function goPrev(e) {
                    if (e) e.stopPropagation();
                    showSlide(currentIndex - 1);
                }

                function goNext(e) {
                    if (e) e.stopPropagation();
                    showSlide(currentIndex + 1);
                }

                if (prevBtn) {
                    prevBtn.removeEventListener('click', goPrev);
                    prevBtn.addEventListener('click', goPrev);
                }
                if (nextBtn) {
                    nextBtn.removeEventListener('click', goNext);
                    nextBtn.addEventListener('click', goNext);
                }

                dots.forEach(function(dot) {
                    dot.removeEventListener('click', function() {});
                    dot.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const index = parseInt(this.getAttribute('data-index'), 10);
                        if (!isNaN(index)) showSlide(index);
                    });
                });

                container.addEventListener('touchstart', function(e) {
                    const touch = e.touches[0];
                    if (touch) {
                        touchStartX = touch.clientX;
                        touchStartY = touch.clientY;
                        isSwiping = false;
                    }
                }, { passive: true });

                container.addEventListener('touchmove', function(e) {
                    if (touchStartX === 0) return;
                    const touch = e.touches[0];
                    if (!touch) return;
                    const deltaX = touch.clientX - touchStartX;
                    const deltaY = touch.clientY - touchStartY;
                    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
                        isSwiping = true;
                        e.preventDefault();
                    }
                }, { passive: false });

                container.addEventListener('touchend', function(e) {
                    if (!isSwiping || touchStartX === 0) {
                        touchStartX = 0;
                        touchStartY = 0;
                        return;
                    }
                    const touch = e.changedTouches[0];
                    if (!touch) return;
                    const deltaX = touch.clientX - touchStartX;
                    if (Math.abs(deltaX) > 30) {
                        if (deltaX < 0) {
                            goNext(e);
                        } else {
                            goPrev(e);
                        }
                    }
                    touchStartX = 0;
                    touchStartY = 0;
                    isSwiping = false;
                }, { passive: true });

                showSlide(0);
            });
        }
        if (breadcrumb) {
            breadcrumb.innerHTML = `<a href="../index.html">Home</a> <span class="separator">›</span> <a href="daftar.html?cat=${catKey}">${category.title}</a> <span class="separator">›</span> <span>${topic.title}</span>`;
        }
    }
})();
