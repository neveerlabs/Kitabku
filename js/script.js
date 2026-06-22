const licenseBtn = document.getElementById('licenseBtn');
const helpBtn = document.getElementById('helpBtn');
const licenseModal = document.getElementById('licenseModal');
const helpModal = document.getElementById('helpModal');
const closeButtons = document.querySelectorAll('.close-modal');
const notificationModal = document.getElementById('notificationModal');
const notificationMessage = document.getElementById('notificationMessage');
const closeNotificationBtn = document.getElementById('closeNotificationModal');
const locationPermissionModal = document.getElementById('locationPermissionModal');
const closeLocationPermissionBtn = document.getElementById('closeLocationPermissionModal');
const allowLocationBtn = document.getElementById('allowLocationBtn');
const denyLocationBtn = document.getElementById('denyLocationBtn');
const locationResultModal = document.getElementById('locationResultModal');
const locationResultMessage = document.getElementById('locationResultMessage');
const closeLocationResultBtn = document.getElementById('closeLocationResultModal');
const alarmModal = document.getElementById('alarmModal');
const alarmMessage = document.getElementById('alarmMessage');
const closeAlarmBtn = document.getElementById('closeAlarmModal');
const adzanModal = document.getElementById('adzanModal');
const adzanMessage = document.getElementById('adzanMessage');
const closeAdzanBtn = document.getElementById('closeAdzanModal');
let currentAlarmPlaying = false;
let currentAdzanPlaying = false;
let currentSapaPlaying = false;
let alarmAudio = null;
let adzanAudio = null;
let sapaAudio = null;
let checkPrayerInterval = null;
let locationWatchId = null;
let bestLocation = null;

function openModal(modal) {
    if (modal) modal.classList.add('show');
}
function closeModal(modal) {
    if (modal) modal.classList.remove('show');
}
function showNotification(msg) {
    if (notificationMessage) notificationMessage.innerHTML = msg;
    openModal(notificationModal);
}
function hideNotification() {
    closeModal(notificationModal);
}
if (closeNotificationBtn) {
    closeNotificationBtn.addEventListener('click', hideNotification);
}

const dropdownBtn = document.getElementById('dropdownBtn');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownLicense = document.getElementById('dropdownLicense');
const dropdownHelp = document.getElementById('dropdownHelp');

if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    window.addEventListener('click', function(e) {
        if (!e.target.closest('.header-right')) {
            dropdownMenu.classList.remove('show');
        }
    });
}
if (dropdownLicense && licenseModal) {
    dropdownLicense.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
        openModal(licenseModal);
    });
}
if (dropdownHelp && helpModal) {
    dropdownHelp.addEventListener('click', function() {
        dropdownMenu.classList.remove('show');
        openModal(helpModal);
    });
}

closeButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        const modal = this.closest('.modal');
        if (modal) closeModal(modal);
    });
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) closeModal(openModal);
    }
});

window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showNotification('<p>Terjadi kesalahan teknis. Silakan coba lagi nanti, terima kasih.</p><p><small>' + (event.message || '') + '</small></p>');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled rejection:', event.reason);
    showNotification('<p>Terjadi kesalahan pada sistem. Kami akan segera memperbaikinya.</p><p><small>' + (event.reason || '') + '</small></p>');
});

window.addEventListener('online', function() {
    showNotification('<p>Koneksi internet Anda kembali online! Silakan lanjutkan aktivitas anda sebelumnya, terima kasih.</p>');
});

window.addEventListener('offline', function() {
    showNotification('<p>Koneksi internet anda terputus! Beberapa fungsi mungkin tidak dapat berjalan dengan baik.</p>');
});

function initPrayerTimes() {
    const storedLocation = localStorage.getItem('kitabku_location');
    if (storedLocation) {
        try {
            const decoded = atob(storedLocation);
            const locData = JSON.parse(decoded);
            if (locData.timestamp && Date.now() - locData.timestamp < 86400000) {
                setupPrayerTimes(locData);
            } else {
                requestLocationPermission();
            }
        } catch (e) {
            console.warn('Failed to parse stored location', e);
            requestLocationPermission();
        }
    } else {
        requestLocationPermission();
    }
}
function requestLocationPermission() {
    if (sessionStorage.getItem('locationPermissionDenied')) return;
    openModal(locationPermissionModal);
}
if (closeLocationPermissionBtn) {
    closeLocationPermissionBtn.addEventListener('click', function() {
        closeModal(locationPermissionModal);
    });
}
function reverseGeocode(lat, lon, callback) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    fetch(url, {
        headers: {
            'User-Agent': 'Kitabku (userlinuxorg@gmail.com)'
        },
        signal: controller.signal
    })
    .then(response => response.json())
    .then(data => {
        clearTimeout(timeoutId);
        if (data && data.display_name) {
            callback(data.display_name);
        } else {
            callback(null);
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Reverse geocode error:', error);
        callback(null);
    });
}
function watchLocation(resolve, reject) {
    if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
    }
    let best = null;
    let resolved = false;
    const ACCURACY_THRESHOLD = 5;
    const TIMEOUT_MS = 45000;
    const startTime = Date.now();

    const success = (position) => {
        const coords = position.coords;
        const acc = coords.accuracy;
        if (!best || acc < best.accuracy) {
            best = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: acc,
                altitude: coords.altitude || null,
                altitudeAccuracy: coords.altitudeAccuracy || null,
                heading: coords.heading || null,
                speed: coords.speed || null,
                timestamp: position.timestamp
            };
        }
        if (acc <= ACCURACY_THRESHOLD && !resolved) {
            resolved = true;
            stopWatching();
            resolve(best);
        }
    };

    const error = (err) => {
        if (!resolved) {
            resolved = true;
            stopWatching();
            reject(err);
        }
    };

    locationWatchId = navigator.geolocation.watchPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
    });

    const timeoutHandler = setTimeout(() => {
        if (!resolved) {
            resolved = true;
            stopWatching();
            if (best) {
                resolve(best);
            } else {
                reject(new Error('Timeout'));
            }
        }
    }, TIMEOUT_MS);

    const originalResolve = resolve;
    const originalReject = reject;
    resolve = (value) => {
        clearTimeout(timeoutHandler);
        originalResolve(value);
    };
    reject = (reason) => {
        clearTimeout(timeoutHandler);
        originalReject(reason);
    };
}
function stopWatching() {
    if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
    }
}
if (allowLocationBtn) {
    allowLocationBtn.addEventListener('click', function() {
        closeModal(locationPermissionModal);
        bestLocation = null;
        watchLocation(
            (position) => {
                const locData = {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    accuracy: position.accuracy,
                    altitude: position.altitude,
                    altitudeAccuracy: position.altitudeAccuracy,
                    heading: position.heading,
                    speed: position.speed,
                    timestamp: Date.now()
                };
                const encrypted = btoa(JSON.stringify(locData));
                localStorage.setItem('kitabku_location', encrypted);

                reverseGeocode(locData.latitude, locData.longitude, address => {
                    let locationInfo = `<p>Lokasi anda berhasil didapatkan dengan presisi tinggi:</p>
                        <p>Latitude: ${locData.latitude}<br>Longitude: ${locData.longitude}<br>Akurasi: ${locData.accuracy} meter<br>Altitude: ${locData.altitude !== null ? locData.altitude + ' meter' : 'Tidak tersedia'}<br>Altitude Accuracy: ${locData.altitudeAccuracy !== null ? locData.altitudeAccuracy + ' meter' : 'Tidak tersedia'}<br>Heading: ${locData.heading !== null ? locData.heading + '°' : 'Tidak tersedia'}<br>Speed: ${locData.speed !== null ? locData.speed + ' m/s' : 'Tidak tersedia'}<br>Timestamp: ${new Date(locData.timestamp).toLocaleString()}</p>`;
                    if (address) {
                        locationInfo += `<p>Alamat: ${address}<br></p>`;
                    } else {
                        locationInfo += `<p>Alamat tidak dapat ditemukan! Pastikan GPS diperangkat anda aktif dan coba lagi, terima kasih.</p>`;
                    }
                    if (locData.accuracy > 50) {
                        locationInfo += `<p style="color: #cc0000; font-weight: bold;">⚠️ Akurasi lokasi ${locData.accuracy} meter (di atas 50m). Untuk hasil terbaik, pastikan Anda di luar ruangan dengan sinyal GPS jelas.</p>`;
                    } else if (locData.accuracy > 10) {
                        locationInfo += `<p style="color: #cc6600; font-weight: bold;">⚠️ Akurasi lokasi ${locData.accuracy} meter (antara 10-50m). Jadwal adzan masih dapat digunakan, namun presisi maksimal lebih baik di luar ruangan.</p>`;
                    } else {
                        locationInfo += `<p style="color: #006600; font-weight: bold;">✅ Akurasi lokasi sangat baik (${locData.accuracy} meter). Jadwal adzan akan sangat presisi.</p>`;
                    }
                    locationInfo += `<p>Terima kasih telah mengizinkan akses lokasi anda. Jadwal adzan akan kami buat menggunakan penyesuaian dari lokasi anda.</p>`;
                    locationResultMessage.innerHTML = locationInfo;
                    openModal(locationResultModal);
                });
                setupPrayerTimes(locData);
            },
            (error) => {
                let msg = 'Gagal mendapatkan lokasi presisi. ';
                if (error.code === 1) msg += 'Izin ditolak.';
                else if (error.code === 2) msg += 'Posisi tidak tersedia. Pastikan GPS aktif dan di luar ruangan.';
                else if (error.code === 3) msg += 'Waktu habis. Coba lagi dengan sinyal yang lebih baik.';
                else msg += error.message;
                locationResultMessage.innerHTML = `<p>${msg}</p><p>Jika ingin menggunakan perkiraan lokasi berdasarkan IP (kurang akurat), refresh halaman dan pilih "Izinkan" kembali. Namun disarankan menggunakan GPS untuk presisi maksimal.</p>`;
                openModal(locationResultModal);
            }
        );
    });
}
if (denyLocationBtn) {
    denyLocationBtn.addEventListener('click', function() {
        closeModal(locationPermissionModal);
        stopWatching();
        sessionStorage.setItem('locationPermissionDenied', 'true');
        locationResultMessage.innerHTML = '<p>Anda menolak izin lokasi! Fitur alarm adzan tidak akan berfungsi karena jadwal adzan belum dibuat. Anda dapat mengaktifkannya kembali dengan cara berpindah halaman atau refresh browser, terima kasih.</p>';
        openModal(locationResultModal);
    });
}
if (closeLocationResultBtn) {
    closeLocationResultBtn.addEventListener('click', function() {
        closeModal(locationResultModal);
    });
}
function setupPrayerTimes(locData) {
    if (typeof PrayTime === 'undefined') {
        console.error('PrayTime library not loaded');
        return;
    }
    const pray = new PrayTime('MWL');
    pray.adjust({ highLats: 'NightMiddle', tune: {} });
    const date = new Date();
    const times = pray.getTimes(date, [locData.latitude, locData.longitude], date.getTimezoneOffset() / -60, 0, '24h');
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerTimes = {};
    prayerNames.forEach(name => {
        if (times[name]) {
            prayerTimes[name] = times[name];
        } else {
            console.warn(`Prayer time ${name} not found in times object:`, times);
        }
    });
    
    const prayerData = {
        date: date.toDateString(),
        times: prayerTimes,
        location: locData
    };
    localStorage.setItem('kitabku_prayer', JSON.stringify(prayerData));
    console.table(prayerTimes);
    startPrayerCheck(prayerTimes);
}
function startPrayerCheck(prayerTimes) {
    if (checkPrayerInterval) clearInterval(checkPrayerInterval);
    checkPrayerInterval = setInterval(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;
        for (let [name, timeStr] of Object.entries(prayerTimes)) {
            if (!timeStr || typeof timeStr !== 'string') {
                console.warn(`Invalid time string for ${name}:`, timeStr);
                continue;
            }
            const parts = timeStr.split(':');
            if (parts.length < 2) {
                console.warn(`Invalid time format for ${name}: ${timeStr}`);
                continue;
            }
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            if (isNaN(hour) || isNaN(minute)) {
                console.warn(`Invalid time format for ${name}: ${timeStr}`);
                continue;
            }
            const prayerMin = hour * 60 + minute;
            const diff = prayerMin - currentTime;
            const displayName = name.charAt(0).toUpperCase() + name.slice(1);

            if (diff > 0 && diff <= 15 && !currentAlarmPlaying && !currentAdzanPlaying) {
                const timeSinceAlarmStart = 15 - diff;
                if (timeSinceAlarmStart < 10) {
                    playAlarm(displayName);
                }
            }
            if (diff > 0 && diff <= 1 && !currentSapaPlaying && !currentAdzanPlaying) {
                playSapa(displayName);
            }

            if (diff <= 2 && diff >= -2 && !currentAdzanPlaying) {
                playAdzan(displayName);
            }
        }
    }, 60000);
}
function playAlarm(prayerName) {
    if (currentAlarmPlaying) return;
    currentAlarmPlaying = true;
    alarmMessage.textContent = `SIAP SIAP! Sebentar lagi sudah mau masuk waktu adzan ${prayerName}!`;
    openModal(alarmModal);
    alarmAudio = new Audio('/sound/alarm.mp3');
    alarmAudio.loop = false;
    alarmAudio.play().catch(e => console.error('Alarm play failed:', e));
    setTimeout(() => {
        if (alarmAudio) {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            alarmAudio = null;
        }
        currentAlarmPlaying = false;
        closeModal(alarmModal);
    }, 600000);
}
function playSapa(prayerName) {
    if (currentSapaPlaying) return;
    currentSapaPlaying = true;
    sapaAudio = new Audio('/sound/sapa.mp3');
    sapaAudio.play().catch(e => console.error('Sapa play failed:', e));
    setTimeout(() => {
        if (sapaAudio) {
            sapaAudio.pause();
            sapaAudio.currentTime = 0;
            sapaAudio = null;
        }
        currentSapaPlaying = false;
    }, 60000);
}
function playAdzan(prayerName) {
    if (currentAdzanPlaying) return;
    currentAdzanPlaying = true;
    adzanMessage.textContent = `Guys, berhenti dulu yuk! Sudah masuk waktu sholat ${prayerName} nih. Sholat dulu yuk, setelah itu lanjutin lagi deh belajarnya sama baca bacanya.`;
    openModal(adzanModal);
    adzanAudio = new Audio('/sound/adzan.mp3');
    adzanAudio.play().catch(e => console.error('Adzan play failed:', e));
    adzanAudio.onended = () => {
        currentAdzanPlaying = false;
        closeModal(adzanModal);
        adzanAudio = null;
    };
}
if (closeAlarmBtn) {
    closeAlarmBtn.addEventListener('click', function() {
        closeModal(alarmModal);
        if (alarmAudio) {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            alarmAudio = null;
        }
        currentAlarmPlaying = false;
    });
}
if (closeAdzanBtn) {
    closeAdzanBtn.addEventListener('click', function() {
        closeModal(adzanModal);
        if (adzanAudio) {
            adzanAudio.pause();
            adzanAudio.currentTime = 0;
            adzanAudio = null;
        }
        currentAdzanPlaying = false;
    });
}

document.addEventListener('DOMContentLoaded', initPrayerTimes);

(function() {
    function getBasePath() {
        var path = window.location.pathname;
        var subfolder = '/Kitabku';
        if (path.indexOf(subfolder) === 0) {
            return subfolder + '/';
        }
        return '/';
    }
    var basePath = getBasePath();

    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer) return;

    const searchBoxDesktop = searchContainer.querySelector('.search-box');
    const searchInputDesktop = searchBoxDesktop ? searchBoxDesktop.querySelector('input') : null;
    const searchResultsDesktop = searchContainer.querySelector('.search-results-desktop');

    const searchIconMobile = document.getElementById('searchIconMobile');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchOverlayInput = document.getElementById('searchOverlayInput');
    const searchResultsOverlay = document.getElementById('searchResultsOverlay');
    const searchOverlayClose = document.getElementById('searchOverlayClose');

    function performSearch(query) {
        query = query.trim().toLowerCase();
        const results = [];

        if (query.length === 0) {
            return results;
        }

        if (typeof categories !== 'undefined' && categories) {
            for (const [key, cat] of Object.entries(categories)) {
                if (cat.title.toLowerCase().includes(query)) {
                    results.push({
                        type: 'bab',
                        title: cat.title,
                        link: basePath + 'id/daftar.html?cat=' + key
                    });
                }
                if (cat.topics && Array.isArray(cat.topics)) {
                    cat.topics.forEach(topic => {
                        if (topic.title.toLowerCase().includes(query)) {
                            results.push({
                                type: 'artikel',
                                title: topic.title,
                                link: basePath + 'id/artikel.html?cat=' + key + '&topic=' + topic.id
                            });
                        }
                    });
                }
            }
        }

        return results.slice(0, 20);
    }

    function renderDesktopResults(results) {
        if (!searchResultsDesktop) return;
        searchResultsDesktop.innerHTML = '';
        if (results.length === 0) {
            searchResultsDesktop.innerHTML = '<div class="no-result">Tidak ada hasil</div>';
        } else {
            results.forEach(item => {
                const a = document.createElement('a');
                a.className = 'result-item';
                a.href = item.link;
                a.innerHTML = `${item.title} <span class="result-type">${item.type === 'bab' ? 'Bab' : 'Artikel'}</span>`;
                searchResultsDesktop.appendChild(a);
            });
        }
        searchResultsDesktop.classList.add('show');
    }

    function renderOverlayResults(results) {
        if (!searchResultsOverlay) return;
        searchResultsOverlay.innerHTML = '';
        if (results.length === 0) {
            searchResultsOverlay.innerHTML = '<div class="no-result">Tidak ada hasil</div>';
        } else {
            results.forEach(item => {
                const a = document.createElement('a');
                a.className = 'result-item';
                a.href = item.link;
                a.innerHTML = `${item.title} <span class="result-type">${item.type === 'bab' ? 'Bab' : 'Artikel'}</span>`;
                searchResultsOverlay.appendChild(a);
            });
        }
    }

    function openMobileSearch(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (searchOverlay) {
            searchOverlay.classList.add('show');
            if (searchOverlayInput) {
                searchOverlayInput.value = '';
                searchOverlayInput.focus();
            }
            renderOverlayResults([]);
        }
    }

    function closeMobileSearch(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (searchOverlay) {
            searchOverlay.classList.remove('show');
        }
    }

    if (searchIconMobile) {
        searchIconMobile.addEventListener('click', openMobileSearch);
        searchIconMobile.addEventListener('touchstart', function(e) {
            if (e.cancelable) {
                e.preventDefault();
            }
            openMobileSearch(e);
        }, { passive: false });
    }

    if (searchOverlayClose) {
        searchOverlayClose.addEventListener('click', closeMobileSearch);
        searchOverlayClose.addEventListener('touchstart', function(e) {
            if (e.cancelable) {
                e.preventDefault();
            }
            closeMobileSearch(e);
        }, { passive: false });
    }

    if (searchOverlay) {
        searchOverlay.addEventListener('click', function(e) {
            if (e.target === searchOverlay) {
                closeMobileSearch(e);
            }
        });
    }

    if (searchInputDesktop && searchResultsDesktop) {
        let desktopTimeout;
        searchInputDesktop.addEventListener('input', function(e) {
            clearTimeout(desktopTimeout);
            const query = this.value;
            desktopTimeout = setTimeout(() => {
                const results = performSearch(query);
                renderDesktopResults(results);
            }, 200);
        });

        document.addEventListener('click', function(e) {
            if (!searchContainer.contains(e.target)) {
                searchResultsDesktop.classList.remove('show');
            }
        });

        searchInputDesktop.addEventListener('blur', function() {
            setTimeout(() => {
                searchResultsDesktop.classList.remove('show');
            }, 200);
        });
    }

    let overlayTimeout;
    if (searchOverlayInput) {
        searchOverlayInput.addEventListener('input', function(e) {
            clearTimeout(overlayTimeout);
            const query = this.value;
            overlayTimeout = setTimeout(() => {
                const results = performSearch(query);
                renderOverlayResults(results);
            }, 200);
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (searchOverlay && searchOverlay.classList.contains('show')) {
                searchOverlay.classList.remove('show');
            }
            if (searchResultsDesktop) {
                searchResultsDesktop.classList.remove('show');
            }
        }
    });

})();
