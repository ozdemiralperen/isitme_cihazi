document.addEventListener('DOMContentLoaded', function () {
    // Kullanıcı kimliği doğrulama
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Değişkenler
    let selectedDate = null;
    let selectedTime = null;
    let appointmentToCancel = null;
    let userData = null;
    let availableTimes = [];

    // DOM Elementleri
    const tabButtons = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const appointmentsContainer = document.getElementById('appointments-container');
    const noAppointmentsDiv = document.getElementById('no-appointments');
    const dateInput = document.getElementById('appointment-date');
    const timeSlots = document.getElementById('time-slots');
    const appointmentForm = document.getElementById('appointment-form');
    const createFirstAppointmentBtn = document.getElementById('create-first-appointment');
    const refreshAppointmentsBtn = document.getElementById('refresh-appointments');
    const cancelAppointmentBtn = document.getElementById('cancel-appointment');
    const cancelAppointmentModal = new bootstrap.Modal(document.getElementById('cancelAppointmentModal'));
    const confirmCancelAppointmentBtn = document.getElementById('confirm-cancel-appointment');
    const logoutBtn = document.getElementById('logout-btn');

    // Kullanıcı bilgilerini yükle
    loadUserProfile();

    // Randevuları yükle
    loadAppointments();

    // Tarih seçici için flatpickr
    const fp = flatpickr(dateInput, {
        dateFormat: "Y-m-d",
        minDate: "today",
        locale: "tr",
        disableMobile: true,
        onChange: function (selectedDates, dateStr, instance) {
            selectedDate = dateStr;
            loadAvailableTimes(dateStr);
        }
    });

    // Tab değiştirme işlevi
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Aktif tab'ı değiştir
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Tab içeriğini göster/gizle
            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // Yeni randevuya git butonu
    createFirstAppointmentBtn.addEventListener('click', () => {
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === 'new-appointment') {
                btn.click();
            }
        });
    });

    // Randevuları yenile butonu
    refreshAppointmentsBtn.addEventListener('click', loadAppointments);

    // Randevu iptal butonu
    cancelAppointmentBtn.addEventListener('click', () => {
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === 'appointments') {
                btn.click();
            }
        });
    });

    // Randevu formu gönderme
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const serviceSelect = document.getElementById('appointment-service');
        const notesTextarea = document.getElementById('appointment-notes');

        if (!selectedDate || !selectedTime || serviceSelect.value === '') {
            alert('Lütfen tarih, saat ve hizmet seçin.');
            return;
        }

        createAppointment({
            date: selectedDate,
            time: selectedTime,
            service: serviceSelect.value,
            notes: notesTextarea.value
        });
    });

    // Çıkış butonu
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });

    // Randevu iptal onay butonu
    confirmCancelAppointmentBtn.addEventListener('click', () => {
        if (appointmentToCancel) {
            cancelAppointment(appointmentToCancel);
        }
    });

    // Kullanıcı profilini yükle
    async function loadUserProfile() {
        try {
            const response = await fetch('/api/user-profile', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (data.success) {
                userData = data.user;

                // Kullanıcı adını ve e-posta bilgisini göster
                document.getElementById('user-name').textContent = userData.username;
                document.getElementById('user-email').textContent = userData.email;

                // Profil formunu doldur
                if (document.getElementById('profile-username')) {
                    document.getElementById('profile-username').value = userData.username;
                }
                if (document.getElementById('profile-email')) {
                    document.getElementById('profile-email').value = userData.email;
                }
                if (document.getElementById('profile-phone') && userData.phone) {
                    document.getElementById('profile-phone').value = userData.phone;
                }
                if (document.getElementById('profile-address') && userData.address) {
                    document.getElementById('profile-address').value = userData.address;
                }
            } else {
                alert('Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.');
                localStorage.removeItem('token');
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Profil yükleme hatası:', error);
            alert('Profil bilgileri yüklenirken bir hata oluştu.');
        }
    }

    // Randevuları yükle
    async function loadAppointments() {
        try {
            appointmentsContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p class="mt-3">Randevularınız yükleniyor...</p>
                </div>
            `;

            const response = await fetch('/api/appointments', {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (data.success) {
                if (data.appointments.length === 0) {
                    noAppointmentsDiv.classList.remove('hidden');
                    appointmentsContainer.classList.add('hidden');
                } else {
                    noAppointmentsDiv.classList.add('hidden');
                    appointmentsContainer.classList.remove('hidden');
                    displayAppointments(data.appointments);
                }
            } else {
                throw new Error(data.message || 'Randevular yüklenemedi');
            }
        } catch (error) {
            console.error('Randevuları yükleme hatası:', error);
            appointmentsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> Randevular yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
                </div>
            `;
        }
    }

    // Randevuları görüntüle
    function displayAppointments(appointments) {
        const groupedAppointments = groupAppointmentsByMonth(appointments);

        let html = '';

        for (const [month, monthAppointments] of Object.entries(groupedAppointments)) {
            html += `
                <div class="mb-4">
                    <h4 class="mb-3">${month}</h4>
                    <div class="row">
            `;

            for (const appointment of monthAppointments) {
                const date = new Date(appointment.date);
                const formattedDate = date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

                let statusClass = '';
                let statusText = '';

                switch (appointment.status) {
                    case 'beklemede':
                        statusClass = 'badge-pending';
                        statusText = 'Beklemede';
                        break;
                    case 'onaylandı':
                        statusClass = 'badge-confirmed';
                        statusText = 'Onaylandı';
                        break;
                    case 'iptal edildi':
                        statusClass = 'badge-canceled';
                        statusText = 'İptal Edildi';
                        break;
                }

                html += `
                    <div class="col-md-6 mb-3">
                        <div class="card appointment-card ${appointment.status}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h5 class="card-title">${appointment.service}</h5>
                                    <span class="badge badge-appointment ${statusClass}">${statusText}</span>
                                </div>
                                <p class="card-text mb-1"><i class="far fa-calendar-alt"></i> ${formattedDate}</p>
                                <p class="card-text mb-2"><i class="far fa-clock"></i> ${appointment.time}</p>
                                
                                ${appointment.notes ? `<p class="card-text text-muted"><small>${appointment.notes}</small></p>` : ''}
                                
                                <div class="d-flex justify-content-end mt-3">
                                    ${appointment.status !== 'iptal edildi' ? `
                                        <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${appointment._id}">
                                            <i class="fas fa-times"></i> İptal Et
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        appointmentsContainer.innerHTML = html;

        // İptal butonlarına olay dinleyicileri ekle
        document.querySelectorAll('.cancel-btn').forEach(button => {
            button.addEventListener('click', () => {
                appointmentToCancel = button.getAttribute('data-id');
                cancelAppointmentModal.show();
            });
        });
    }

    // Randevuları aylara göre grupla
    function groupAppointmentsByMonth(appointments) {
        const grouped = {};

        for (const appointment of appointments) {
            const date = new Date(appointment.date);
            const month = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

            if (!grouped[month]) {
                grouped[month] = [];
            }

            grouped[month].push(appointment);
        }

        return grouped;
    }

    // Müsait saatleri yükle
    async function loadAvailableTimes(date) {
        try {
            timeSlots.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary spinner-border-sm" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p class="mt-2 mb-0">Müsait saatler yükleniyor...</p>
                </div>
            `;

            const response = await fetch(`/api/available-times?date=${date}`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (data.success) {
                availableTimes = data.availableTimes;
                displayAvailableTimes(availableTimes);
            } else {
                throw new Error(data.message || 'Müsait saatler yüklenemedi');
            }
        } catch (error) {
            console.error('Müsait saatleri yükleme hatası:', error);
            timeSlots.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> Müsait saatler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
                </div>
            `;
        }
    }

    // Müsait saatleri görüntüle
    function displayAvailableTimes(times) {
        if (times.length === 0) {
            timeSlots.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-circle"></i> Seçilen tarihte müsait saat bulunmuyor. Lütfen başka bir tarih seçin.
                </div>
            `;
            return;
        }

        let html = '';

        for (const time of times) {
            html += `
                <div class="time-slot" data-time="${time}">${time}</div>
            `;
        }

        timeSlots.innerHTML = html;

        // Saat seçimi için olay dinleyicileri ekle
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                selectedTime = slot.getAttribute('data-time');
            });
        });
    }

    // Randevu oluştur
    async function createAppointment(appointmentData) {
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Randevunuz başarıyla oluşturuldu.');

                // Formu temizle
                appointmentForm.reset();
                selectedDate = null;
                selectedTime = null;
                timeSlots.innerHTML = '<p class="text-muted">Lütfen önce bir tarih seçiniz.</p>';

                // Randevular sekmesine git ve yenile
                tabButtons.forEach(btn => {
                    if (btn.getAttribute('data-tab') === 'appointments') {
                        btn.click();
                    }
                });

                loadAppointments();
            } else {
                throw new Error(data.message || 'Randevu oluşturulamadı');
            }
        } catch (error) {
            console.error('Randevu oluşturma hatası:', error);
            alert('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    }
    // Randevu iptal et
    async function cancelAppointment(appointmentId) {
        try {
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (data.success) {
                cancelAppointmentModal.hide();
                alert('Randevunuz başarıyla iptal edildi.');
                loadAppointments();
            } else {
                throw new Error(data.message || 'Randevu iptal edilemedi');
            }
        } catch (error) {
            console.error('Randevu iptal hatası:', error);
            alert('Randevu iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.');
            cancelAppointmentModal.hide();
        }
    }
});
