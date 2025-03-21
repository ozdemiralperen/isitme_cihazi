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

    // Tab değiştirme olayını güncelle
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
                    // Orders tab'ına geçildiğinde siparişleri yükle
                    if (tabId === 'orders') {
                        loadOrders();
                    }
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
    // Siparişleri yükle
    async function loadOrders() {
        const ordersContainer = document.getElementById('orders-container');
        const noOrdersDiv = document.getElementById('no-orders');

        try {
            ordersContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p class="mt-3">Siparişleriniz yükleniyor...</p>
                </div>
            `;

            const response = await fetch('/api/user-orders', {
                headers: {
                    'x-auth-token': token
                }
            });

            const data = await response.json();

            if (data.success) {
                if (data.orders.length === 0) {
                    noOrdersDiv.classList.remove('hidden');
                    ordersContainer.classList.add('hidden');
                } else {
                    noOrdersDiv.classList.add('hidden');
                    ordersContainer.classList.remove('hidden');
                    displayOrders(data.orders);
                }
            } else {
                throw new Error(data.message || 'Siparişler yüklenemedi');
            }
        } catch (error) {
            console.error('Siparişleri yükleme hatası:', error);
            ordersContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Siparişler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
                </div>
            `;
        }
    }

    // Siparişleri görüntüle
    function displayOrders(orders) {
        const ordersContainer = document.getElementById('orders-container');
        
        let html = '<div class="orders-list">';
        
        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString('tr-TR');
            
            html += `
                <div class="order-card mb-4">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>Sipariş No: ${order._id}</span>
                            <span class="badge ${order.status}">${getOrderStatusText(order.status)}</span>
                        </div>
                        <div class="card-body">
                            <!-- Sipariş Durumu Zaman Çizelgesi -->
                            <div class="order-timeline mb-3">
                                ${getOrderTimeline(order.status)}
                            </div>

                            <!-- Sipariş Bilgileri -->
                            <div class="order-details mb-3">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Teslimat Bilgileri</h6>
                                        <p class="mb-1"><strong>Ad Soyad:</strong> ${order.customerInfo.fullName}</p>
                                        <p class="mb-1"><strong>Telefon:</strong> ${order.customerInfo.phone}</p>
                                        <p class="mb-1"><strong>Adres:</strong> ${order.shippingAddress}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Ödeme Bilgileri</h6>
                                        <p class="mb-1"><strong>Ödeme Yöntemi:</strong> ${getPaymentMethodText(order.paymentMethod)}</p>
                                        <p class="mb-1"><strong>Ödeme Durumu:</strong> ${order.isPaid ? '<span class="text-success">Ödendi</span>' : '<span class="text-warning">Beklemede</span>'}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Ürün Listesi -->
                            <div class="order-items">
                                ${order.items.map(item => `
                                    <div class="order-item d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <h6 class="mb-0">${item.name}</h6>
                                            <small class="text-muted">${item.quantity} adet x ${item.price.toLocaleString('tr-TR')} ₺</small>
                                        </div>
                                        <div class="item-total">
                                            ${(item.quantity * item.price).toLocaleString('tr-TR')} ₺
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <hr>
                            <div class="d-flex justify-content-between">
                                <div>
                                    <p class="mb-0"><strong>Tarih:</strong> ${date}</p>
                                </div>
                                <div class="order-total">
                                    <h5>Toplam: ${order.totalAmount.toLocaleString('tr-TR')} ₺</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        ordersContainer.innerHTML = html;
    }

    // Ödeme yöntemi çevirisi
    function getPaymentMethodText(method) {
        const methodMap = {
            'credit_card': 'Kredi Kartı',
            'bank_transfer': 'Havale/EFT'
        };
        return methodMap[method] || method;
    }

    // Sipariş durumu çevirisi
    function getOrderStatusText(status) {
        const statusMap = {
            'pending': 'Onay Bekliyor',
            'processing': 'Hazırlanıyor',
            'shipped': 'Kargoda',
            'delivered': 'Teslim Edildi',
            'cancelled': 'İptal Edildi'
        };
        return statusMap[status] || status;
    }

    // Sipariş zaman çizelgesi
    function getOrderTimeline(status) {
        const steps = [
            { status: 'pending', text: 'Onay Bekliyor', icon: 'fa-clock' },
            { status: 'processing', text: 'Hazırlanıyor', icon: 'fa-box' },
            { status: 'shipped', text: 'Kargoda', icon: 'fa-truck' },
            { status: 'delivered', text: 'Teslim Edildi', icon: 'fa-check-circle' }
        ];

        if (status === 'cancelled') {
            return `
                <div class="timeline-cancelled">
                    <i class="fas fa-times-circle"></i>
                    Sipariş İptal Edildi
                </div>
            `;
        }

        let html = '<div class="timeline">';
        let currentFound = false;

        steps.forEach((step, index) => {
            const isActive = !currentFound && (
                status === step.status || 
                steps.findIndex(s => s.status === status) > index
            );
            
            if (status === step.status) currentFound = true;

            html += `
                <div class="timeline-step ${isActive ? 'active' : ''}">
                    <div class="timeline-icon">
                        <i class="fas ${step.icon}"></i>
                    </div>
                    <div class="timeline-text">${step.text}</div>
                </div>
                ${index < steps.length - 1 ? '<div class="timeline-line"></div>' : ''}
            `;
        });

        html += '</div>';
        return html;
    }
});
// Profile form submission
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Oturum süresi dolmuş görünüyor. Lütfen tekrar giriş yapın.');
                window.location.href = '/login.html';
                return;
            }

            // Şifre kontrolü
            const newPassword = document.getElementById('profile-password').value;
            const confirmPassword = document.getElementById('profile-password-confirm').value;
            
            if (newPassword && newPassword !== confirmPassword) {
                alert('Şifreler eşleşmiyor!');
                return;
            }

            // Form verilerini hazırla
            const updateData = {
                username: document.getElementById('profile-username').value,
                phone: document.getElementById('profile-phone').value,
                address: document.getElementById('profile-address').value
            };

            // Şifre sadece değiştirilmek isteniyorsa ekle
            if (newPassword) {
                updateData.password = newPassword;
            }

            try {
                // Güncelleme butonunu devre dışı bırak ve yükleniyor göster
                const submitButton = profileForm.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Güncelleniyor...';

                // API'ye güncelleme isteği gönder
                const response = await fetch('/api/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify(updateData)
                });

                const result = await response.json();

                // Butonu normal haline getir
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;

                if (result.success) {
                    // Başarılı mesajı göster
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-success mt-3';
                    alertDiv.textContent = 'Profil bilgileriniz başarıyla güncellendi!';
                    profileForm.appendChild(alertDiv);

                    // 3 saniye sonra başarı mesajını kaldır
                    setTimeout(() => {
                        alertDiv.remove();
                    }, 3000);

                    // Kullanıcı verisini güncelle
                    if (typeof loadUserProfile === 'function') {
                        loadUserProfile();
                    }
                } else {
                    // Hata mesajı göster
                    alert(result.message || 'Profil güncellenirken bir hata oluştu.');
                }
            } catch (error) {
                console.error('Profil güncelleme hatası:', error);
                alert('Profil güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            }
        });
    }
});