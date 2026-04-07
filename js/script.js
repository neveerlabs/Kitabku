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
if (licenseBtn && licenseModal) {
    licenseBtn.addEventListener('click', () => openModal(licenseModal));
}
if (helpBtn && helpModal) {
    helpBtn.addEventListener('click', () => openModal(helpModal));
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
    fetch(url, {
        headers: {
            'User-Agent': 'Kitabku (userlinuxorg@gmail.com)'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.display_name) {
            callback(data.display_name);
        } else {
            callback(null);
        }
    })
    .catch(error => {
        console.error('Reverse geocode error:', error);
        callback(null);
    });
}
function watchLocation(resolve, reject) {
    if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
    }
    locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const acc = position.coords.accuracy;
            if (!bestLocation || acc < bestLocation.accuracy) {
                bestLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: acc,
                    timestamp: position.timestamp
                };
                // berhenti search jika akurasi < 10 meter
                if (acc < 10) {
                    stopWatching();
                    resolve(bestLocation);
                }
            }
        },
        (error) => {
            stopWatching();
            reject(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
    setTimeout(() => {
        if (bestLocation) {
            stopWatching();
            resolve(bestLocation);
        } else {
            stopWatching();
            reject(new Error('Timeout'));
        }
    }, 30000);
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
                    timestamp: Date.now()
                };
                const encrypted = btoa(JSON.stringify(locData));
                localStorage.setItem('kitabku_location', encrypted);

                reverseGeocode(locData.latitude, locData.longitude, address => {
                    let locationInfo = `<p>Lokasi anda berhasil didapatkan:</p>
                        <p>Latitude: ${locData.latitude}<br>Longitude: ${locData.longitude}<br>Akurasi: ${locData.accuracy} meter<br>Timestamp: ${new Date(locData.timestamp).toLocaleString()}</p>`;
                    if (address) {
                        locationInfo += `<p>Alamat: ${address}<br></p>`;
                    } else {
                        locationInfo += `<p>Alamat tidak dapat ditemukan! Pastikan GPS diperangkat anda aktif, terima kasih.</p>`;
                    }
                    // Tambahkan peringatan jika akurasi > 50 meter
                    if (locData.accuracy > 50) {
                        locationInfo += `<p style="color: #cc0000; font-weight: bold;">⚠️ Akurasi lokasi ${locData.accuracy} meter (di atas 50m). Jadwal adzan mungkin kurang presisi. Untuk hasil terbaik, pastikan Anda di luar ruangan dengan sinyal GPS jelas.</p>`;
                    }
                    locationInfo += `<p>Terima kasih telah mengizinkan akses lokasi anda. Jadwal adzan akan kami buat menggunakan penyesuaian dari lokasi anda.</p>`;
                    locationResultMessage.innerHTML = locationInfo;
                    openModal(locationResultModal);
                });
                setupPrayerTimes(locData);
            },
            (error) => {
                let msg = 'Gagal mendapatkan lokasi. ';
                if (error.code === 1) msg += 'Izin ditolak.';
                else if (error.code === 2) msg += 'Posisi tidak tersedia.';
                else if (error.code === 3) msg += 'Waktu habis.';
                else msg += error.message;
                locationResultMessage.innerHTML = `<p>${msg}. Pastikan GPS aktif dan coba lagi, terima kasih.</p>`;
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
        locationResultMessage.innerHTML = '<p>Anda menolak izin lokasi! Fitur alarm adzan tidak akan berfungsi karena jadwal adzan belom dibuat. Anda dapat mengaktifkannya kembali dengan cara berpindah halaman atau refresh browser, terima kasih.</p>';
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

// Initialize prayer times on page load
document.addEventListener('DOMContentLoaded', initPrayerTimes);
