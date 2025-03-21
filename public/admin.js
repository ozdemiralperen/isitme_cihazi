document.addEventListener('DOMContentLoaded', function() {
    // Admin token kontrolü
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
        window.location.href = 'login.html';
        return;
    }

    // Admin bilgilerini göster
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if (adminUser) {
        document.getElementById('admin-email').textContent = adminUser.email;
    }

    // Tab değiştirme işlevi
    const sidebarLinks = document.querySelectorAll('.admin-sidebar a[data-section]');
    const sections = document.querySelectorAll('.section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            
            // Aktif tab'ı değiştir
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Seksiyon görünürlüğünü değiştir
            sections.forEach(section => {
                if (section.id === sectionId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Seksiyon verilerini yükle
            switch(sectionId) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'products':
                    loadProducts();
                    break;
                case 'orders':
                    loadOrders();
                    break;
                case 'appointments':
                    loadAppointments();
                    break;
                case 'users':
                    loadUsers();
                    break;
            }
        });
    });

    // İlk yüklemede dashboard verilerini getir
    loadDashboardStats();

    // Çıkış işlevi
    document.getElementById('admin-logout').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
    });
});

// Dashboard istatistiklerini yükle
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard-stats', {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('total-users').textContent = data.stats.totalUsers;
            document.getElementById('total-orders').textContent = data.stats.totalOrders;
            document.getElementById('pending-appointments').textContent = data.stats.pendingAppointments;
            document.getElementById('total-products').textContent = data.stats.totalProducts;
            
            // Grafikleri çiz
            createSalesChart(data.stats.monthlySales);
            createProductsChart(data.stats.popularProducts);
        }
    } catch (error) {
        console.error('Dashboard stats yükleme hatası:', error);
    }
}

// Ürünleri yükle
async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products', {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#products-table tbody');
            tbody.innerHTML = data.products.map(product => `
                <tr>
                    <td>${product._id}</td>
                    <td><img src="${product.imageUrl}" alt="${product.name}" width="50"></td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.price.toLocaleString('tr-TR')} ₺</td>
                    <td>${product.stock}</td>
                    <td>${product.stock > 0 ? '<span class="badge success">Stokta</span>' : '<span class="badge danger">Tükendi</span>'}</td>
                    <td>
                        <button onclick="editProduct('${product._id}')" class="btn-icon"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteProduct('${product._id}')" class="btn-icon danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Ürünleri yükleme hatası:', error);
    }
}

// Status çevirisi için yardımcı fonksiyon
function getStatusText(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'processing': 'İşleniyor',
        'shipped': 'Kargoda',
        'delivered': 'Teslim Edildi',
        'cancelled': 'İptal Edildi',
        'active': 'Aktif',
        'inactive': 'Pasif',
        'confirmed': 'Onaylandı'
    };
    return statusMap[status] || status;
}

// Siparişleri yükle
async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders', {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#orders-table tbody');
            tbody.innerHTML = data.orders.map(order => `
                <tr>
                    <td>${order._id}</td>
                    <td>${order.customerInfo?.fullName || 'Misafir Kullanıcı'}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>${order.totalAmount.toLocaleString('tr-TR')} ₺</td>
                    <td><span class="badge ${order.status}">${getStatusText(order.status)}</span></td>
                    <td>
                        <button onclick="viewOrder('${order._id}')" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="updateOrderStatus('${order._id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteOrder('${order._id}')" class="btn-icon danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Siparişleri yükleme hatası:', error);
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Siparişler yüklenirken bir hata oluştu
                </td>
            </tr>
        `;
    }
}

// Randevuları yükle
async function loadAppointments() {
    try {
        const response = await fetch('/api/admin/appointments', {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#appointments-table tbody');
            tbody.innerHTML = data.appointments.map(appointment => `
                <tr>
                    <td>${appointment._id}</td>
                    <td>${appointment.userId.name}</td>
                    <td>${new Date(appointment.date).toLocaleDateString('tr-TR')}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.service}</td>
                    <td><span class="badge ${appointment.status}">${appointment.status}</span></td>
                    <td>
                        <button onclick="viewAppointment('${appointment._id}')" class="btn-icon">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="updateAppointmentStatus('${appointment._id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteAppointment('${appointment._id}')" class="btn-icon danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Randevuları yükleme hatası:', error);
    }
}

// Kullanıcıları yükle
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.querySelector('#users-table tbody');
            tbody.innerHTML = data.users.map(user => `
                <tr>
                    <td>${user._id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td>
                        <span class="badge ${user.status}">${user.status === 'active' ? 'Aktif' : 'Pasif'}</span>
                    </td>
                    <td>
                        <button onclick="toggleUserStatus('${user._id}')" class="btn-icon">
                            <i class="fas fa-power-off"></i>
                        </button>
                        <button onclick="editUser('${user._id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteUser('${user._id}')" class="btn-icon danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Kullanıcıları yükleme hatası:', error);
    }
}

// Ürün düzenleme fonksiyonu
async function editProduct(productId) {
    try {
        // Ürün detaylarını getir
        const response = await fetch(`/api/admin/products/${productId}`, {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });

        if (!response.ok) {
            throw new Error('Ürün detayları alınamadı');
        }
        
        const data = await response.json();
        
        if (data.success) {
            const product = data.product;
            const modal = document.getElementById('edit-product-modal');
            
            // Modal içeriğini hazırla
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Ürün Düzenle</h2>
                    <form id="edit-product-form">
                        <input type="hidden" name="productId" value="${product._id}">
                        <div class="form-group">
                            <label>Ürün Adı</label>
                            <input type="text" name="name" value="${product.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Kategori</label>
                            <select name="category" required>
                                <option value="hearing-aids" ${product.category === 'hearing-aids' ? 'selected' : ''}>İşitme Cihazları</option>
                                <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Aksesuarlar</option>
                                <option value="batteries" ${product.category === 'batteries' ? 'selected' : ''}>Piller</option>
                                <option value="ear-molds" ${product.category === 'ear-molds' ? 'selected' : ''}>Kulak Kalıpları</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Fiyat</label>
                            <input type="number" name="price" value="${product.price}" required>
                        </div>
                        <div class="form-group">
                            <label>İndirimli Fiyat</label>
                            <input type="number" name="discountPrice" value="${product.discountPrice || ''}">
                        </div>
                        <div class="form-group">
                            <label>Stok</label>
                            <input type="number" name="stock" value="${product.stock}" required>
                        </div>
                        <div class="form-group">
                            <label>Açıklama</label>
                            <textarea name="description" required>${product.description}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Güncelle</button>
                            <button type="button" class="btn-secondary close-modal">İptal</button>
                        </div>
                    </form>
                </div>
            `;

            // Modal'ı göster
            modal.style.display = 'block';

            // Form submit olayını dinle
            const form = document.getElementById('edit-product-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const updateData = Object.fromEntries(formData.entries());

                try {
                    const updateResponse = await fetch(`/api/admin/products/${productId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': localStorage.getItem('adminToken')
                        },
                        body: JSON.stringify(updateData)
                    });

                    const updateResult = await updateResponse.json();
                    if (updateResult.success) {
                        alert('Ürün başarıyla güncellendi');
                        modal.style.display = 'none';
                        loadProducts(); // Ürün listesini yenile
                    } else {
                        alert(updateResult.message || 'Güncelleme başarısız');
                    }
                } catch (error) {
                    console.error('Ürün güncelleme hatası:', error);
                    alert('Ürün güncellenirken bir hata oluştu');
                }
            });

            // Kapatma işlemleri
            const closeButtons = modal.querySelectorAll('.close-button, .close-modal');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            });

            // Modal dışına tıklanınca kapat
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error('Ürün detayları yükleme hatası:', error);
        alert('Ürün detayları yüklenirken bir hata oluştu');
    }
}

// Ürün silme fonksiyonu
async function deleteProduct(productId) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken')
                }
            });
            
            const data = await response.json();
            if (data.success) {
                loadProducts(); // Tabloyu yenile
                alert('Ürün başarıyla silindi');
            }
        } catch (error) {
            console.error('Ürün silme hatası:', error);
            alert('Ürün silinirken bir hata oluştu');
        }
    }
}

// Sipariş durumu güncelleme
async function updateOrderStatus(orderId) {
    const newStatus = prompt('Yeni durumu girin (pending, processing, shipped, delivered, cancelled):');
    if (newStatus) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('adminToken')
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            if (data.success) {
                loadOrders(); // Tabloyu yenile
                alert('Sipariş durumu güncellendi');
            }
        } catch (error) {
            console.error('Sipariş güncelleme hatası:', error);
            alert('Sipariş güncellenirken bir hata oluştu');
        }
    }
}

// Sipariş silme fonksiyonu
async function deleteOrder(orderId) {
    if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken')
                }
            });
            
            const data = await response.json();
            if (data.success) {
                loadOrders(); // Tabloyu yenile
                alert('Sipariş başarıyla silindi');
            } else {
                alert(data.message || 'Sipariş silinirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Sipariş silme hatası:', error);
            alert('Sipariş silinirken bir hata oluştu');
        }
    }
}

// Randevu durumu güncelleme
async function updateAppointmentStatus(appointmentId) {
    const newStatus = prompt('Yeni durumu girin (beklemede, onaylandı, iptal edildi):');
    if (newStatus) {
        try {
            const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('adminToken')
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            if (data.success) {
                loadAppointments(); // Tabloyu yenile
                alert('Randevu durumu güncellendi');
            }
        } catch (error) {
            console.error('Randevu güncelleme hatası:', error);
            alert('Randevu güncellenirken bir hata oluştu');
        }
    }
}

// Kullanıcı durumu değiştirme fonksiyonu
async function toggleUserStatus(userId) {
    await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('adminToken')
        }
    });
    
    // Direkt olarak tabloyu yenile
    loadUsers();
}

// Kullanıcı düzenleme fonksiyonu
async function editUser(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        if (data.success) {
            const user = data.user;
            const modal = document.getElementById('edit-user-modal');
            const form = document.getElementById('edit-user-form');
            
            // Form içeriğini güncelle
            form.innerHTML = `
                <input type="hidden" name="userId" value="${user._id}">
                <div class="form-group">
                    <label>Kullanıcı Adı</label>
                    <input type="text" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>E-posta</label>
                    <input type="email" name="email" value="${user.email}" readonly>
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input type="tel" name="phone" value="${user.phone || ''}" required>
                </div>
                <div class="form-group">
                    <label>Adres</label>
                    <textarea name="address" required>${user.address || ''}</textarea>
                </div>
                <button type="submit" class="btn-primary">Güncelle</button>
            `;

            // Modal'ı göster
            modal.style.display = 'block';

            // Önceki event listener'ları temizle
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);

            // Yeni form submit olayını ekle
            newForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(newForm);
                const updateData = {
                    username: formData.get('username'),
                    phone: formData.get('phone'),
                    address: formData.get('address')
                };

                try {
                    const updateResponse = await fetch(`/api/admin/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': localStorage.getItem('adminToken')
                        },
                        body: JSON.stringify(updateData)
                    });

                    const updateResult = await updateResponse.json();
                    if (updateResult.success) {
                        alert('Kullanıcı bilgileri güncellendi');
                        modal.style.display = 'none';
                        loadUsers(); // Tabloyu yenile
                    } else {
                        alert(updateResult.message || 'Güncelleme başarısız');
                    }
                } catch (error) {
                    console.error('Kullanıcı güncelleme hatası:', error);
                    alert('Güncelleme sırasında bir hata oluştu');
                }
            });
        }
    } catch (error) {
        console.error('Kullanıcı detayları yükleme hatası:', error);
        alert('Kullanıcı bilgileri yüklenirken bir hata oluştu');
    }
}

// Kullanıcı silme fonksiyonu 
async function deleteUser(userId) {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken')
                }
            });
            
            const data = await response.json();
            if (data.success) {
                loadUsers(); // Kullanıcı listesini yenile
                alert('Kullanıcı başarıyla silindi');
            } else {
                alert(data.message || 'Kullanıcı silinirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Kullanıcı silme hatası:', error);
            alert('Kullanıcı silinirken bir hata oluştu');
        }
    }
}

// Kullanıcı düzenleme modal'ını kapat
document.querySelector('.close-button')?.addEventListener('click', () => {
    document.getElementById('edit-user-modal').style.display = 'none';
});

// Modal dışına tıklandığında kapat
window.addEventListener('click', (e) => {
    const modal = document.getElementById('edit-user-modal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Aylık satışlar grafiği
function createSalesChart(monthlySales) {
    const ctx = document.getElementById('sales-chart').getContext('2d');
    
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    
    const labels = monthlySales.map(sale => `${monthNames[sale._id.month - 1]}`);
    const data = monthlySales.map(sale => sale.total);
    
    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aylık Satış (TL)',
                data: data,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Aylık Satış Grafiği',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M ₺';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K ₺';
                            }
                            return value + ' ₺';
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Popüler ürünler grafiği
function createProductsChart(popularProducts) {
    const ctx = document.getElementById('products-chart').getContext('2d');
    
    if (window.productsChart) {
        window.productsChart.destroy();
    }
    
    const labels = popularProducts.map(product => product._id);
    const data = popularProducts.map(product => product.totalSold);
    
    window.productsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Satış Adedi',
                data: data,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'En Çok Satan Ürünler',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 11
                        },
                        stepSize: 1
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Randevu detaylarını görüntüle
async function viewAppointment(appointmentId) {
    try {
        const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const appointment = data.appointment;
            const modal = document.getElementById('edit-appointment-modal');
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Randevu Detayları</h2>
                    <div class="appointment-info">
                        <div class="info-group">
                            <label>Randevu ID:</label>
                            <span>${appointment._id}</span>
                        </div>
                        <div class="info-group">
                            <label>Müşteri:</label>
                            <span>${appointment.userId.name}</span>
                        </div>
                        <div class="info-group">
                            <label>E-posta:</label>
                            <span>${appointment.userId.email}</span>
                        </div>
                        <div class="info-group">
                            <label>Tarih:</label>
                            <span>${new Date(appointment.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div class="info-group">
                            <label>Saat:</label>
                            <span>${appointment.time}</span>
                        </div>
                        <div class="info-group">
                            <label>Hizmet:</label>
                            <span>${appointment.service}</span>
                        </div>
                        <div class="info-group">
                            <label>Durum:</label>
                            <span class="badge ${appointment.status}">${appointment.status}</span>
                        </div>
                        ${appointment.notes ? `
                            <div class="info-group">
                                <label>Notlar:</label>
                                <p>${appointment.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-actions">
                        <button onclick="updateAppointmentStatus('${appointment._id}')" class="btn-primary">
                            <i class="fas fa-edit"></i> Durumu Güncelle
                        </button>
                        <button onclick="deleteAppointment('${appointment._id}')" class="btn-danger">
                            <i class="fas fa-trash"></i> Randevuyu Sil
                        </button>
                    </div>
                </div>
            `;
            
            modal.style.display = 'block';
            
            // Modal kapatma işlemleri
            const closeButton = modal.querySelector('.close-button');
            closeButton.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error('Randevu detayları yükleme hatası:', error);
        alert('Randevu detayları yüklenirken bir hata oluştu');
    }
}

// Randevu silme fonksiyonu
async function deleteAppointment(appointmentId) {
    if (confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': localStorage.getItem('adminToken')
                }
            });
            
            const data = await response.json();
            if (data.success) {
                loadAppointments(); // Tabloyu yenile
                document.getElementById('edit-appointment-modal').style.display = 'none';
                alert('Randevu başarıyla silindi');
            } else {
                alert(data.message || 'Randevu silinirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Randevu silme hatası:', error);
            alert('Randevu silinirken bir hata oluştu');
        }
    }
}

// Form HTML'inde görsel URL alanı yerine dosya yükleme alanı ekleyelim
const imageUploadHtml = `
    <div class="form-group">
        <label>Ürün Görseli</label>
        <div class="image-upload-container">
            <div class="image-upload-area" id="imageDropArea">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Görseli sürükleyip bırakın veya seçin</p>
                <input type="file" id="imageInput" accept="image/*" style="display: none">
                <button type="button" class="btn-secondary" onclick="document.getElementById('imageInput').click()">
                    Görsel Seç
                </button>
            </div>
            <div id="imagePreview" class="image-preview" style="display: none">
                <img id="uploadedImage" src="" alt="Yüklenen görsel">
                <button type="button" class="btn-icon danger remove-image" onclick="removeImage()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="form-group">
        <label>Görsel Galerisi</label>
        <div class="gallery-upload-container">
            <div class="gallery-upload-area" id="galleryDropArea">
                <i class="fas fa-images"></i>
                <p>Galeri görsellerini sürükleyip bırakın veya seçin</p>
                <input type="file" id="galleryInput" accept="image/*" multiple style="display: none">
                <button type="button" class="btn-secondary" onclick="document.getElementById('galleryInput').click()">
                    Görseller Seç
                </button>
            </div>
            <div id="galleryPreview" class="gallery-preview">
                <!-- Yüklenen görseller buraya eklenecek -->
            </div>
        </div>
    </div>
`;

// Yeni ürün ekleme fonksiyonunda form içeriğini güncelle
function addNewProduct() {
    const modal = document.getElementById('edit-product-modal');
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Yeni Ürün Ekle</h2>
            <form id="add-product-form">
                <div class="form-group">
                    <label>Ürün Adı</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Kategori</label>
                    <select name="category" required>
                        <option value="hearing-aids">İşitme Cihazları</option>
                        <option value="accessories">Aksesuarlar</option>
                        <option value="batteries">Piller</option>
                        <option value="ear-molds">Kulak Kalıpları</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Kısa Açıklama</label>
                    <input type="text" name="shortDescription" required>
                </div>
                <div class="form-group">
                    <label>Detaylı Açıklama</label>
                    <textarea name="description" required></textarea>
                </div>
                <div class="form-group">
                    <label>Fiyat</label>
                    <input type="number" name="price" required>
                </div>
                <div class="form-group">
                    <label>İndirimli Fiyat (Opsiyonel)</label>
                    <input type="number" name="discountPrice">
                </div>
                <div class="form-group">
                    <label>Stok</label>
                    <input type="number" name="stock" required>
                </div>
                ${imageUploadHtml}
                <div class="form-group">
                    <label>Görsel Galerisi (Virgülle ayırın)</label>
                    <input type="text" name="imageGallery">
                </div>
                <div class="form-group">
                    <label>Öne Çıkan Ürün</label>
                    <input type="checkbox" name="featured">
                </div>
                <div id="specifications-container">
                    <h3>Teknik Özellikler</h3>
                    <div class="specifications-list"></div>
                    <button type="button" onclick="addSpecification()" class="btn-secondary">
                        <i class="fas fa-plus"></i> Özellik Ekle
                    </button>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Ürünü Kaydet</button>
                    <button type="button" class="btn-secondary close-modal">İptal</button>
                </div>
            </form>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // Form submit işlemi
    const form = document.getElementById('add-product-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        // Görsel URL'sini imagePreview'dan al
        const uploadedImage = document.getElementById('uploadedImage');
        const imageUrl = uploadedImage ? uploadedImage.src : null;
        
        // Galeri görsellerini topla
        const galleryImages = Array.from(document.querySelectorAll('#galleryPreview img')).map(img => img.src);
        
        const productData = {
            name: formData.get('name'),
            category: formData.get('category'),
            shortDescription: formData.get('shortDescription'),
            description: formData.get('description'),
            price: Number(formData.get('price')),
            discountPrice: formData.get('discountPrice') ? Number(formData.get('discountPrice')) : null,
            stock: Number(formData.get('stock')),
            imageUrl: imageUrl, // Yüklenen görselin URL'si
            imageGallery: galleryImages, // Galeri görsellerinin URL'leri
            featured: formData.get('featured') === 'on',
            specifications: []
        };
    
        // Zorunlu alan kontrolü
        if (!productData.imageUrl) {
            alert('Lütfen bir ürün görseli yükleyin');
            return;
        }
    
        // Teknik özellikleri topla
        const specNames = form.querySelectorAll('input[name="spec-name[]"]');
        const specValues = form.querySelectorAll('input[name="spec-value[]"]');
        for (let i = 0; i < specNames.length; i++) {
            if (specNames[i].value && specValues[i].value) {
                productData.specifications.push({
                    name: specNames[i].value,
                    value: specValues[i].value
                });
            }
        }
    
        try {
            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('adminToken')
                },
                body: JSON.stringify(productData)
            });
    
            if (!response.ok) {
                throw new Error('Sunucu hatası');
            }
    
            const result = await response.json();
            if (result.success) {
                alert('Ürün başarıyla eklendi');
                modal.style.display = 'none';
                loadProducts(); // Ürün listesini yenile
            } else {
                alert(result.message || 'Ürün eklenirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Ürün ekleme hatası:', error);
            alert('Ürün eklenirken bir hata oluştu');
        }
    });
    
    // Modal kapatma işlemleri
    const closeButtons = modal.querySelectorAll('.close-button, .close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Sürükle-bırak olaylarını ekle
    const imageDropArea = document.getElementById('imageDropArea');
    const galleryDropArea = document.getElementById('galleryDropArea');
    const imageInput = document.getElementById('imageInput');
    const galleryInput = document.getElementById('galleryInput');
    
    // Tekil görsel için sürükle-bırak
    imageDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageDropArea.classList.add('drag-over');
    });
    
    imageDropArea.addEventListener('dragleave', () => {
        imageDropArea.classList.remove('drag-over');
    });
    
    imageDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageDropArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });
    
    // Tekil görsel için dosya seçici
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    });
    
    // Galeri görselleri için sürükle-bırak
    galleryDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        galleryDropArea.classList.add('drag-over');
    });
    
    galleryDropArea.addEventListener('dragleave', () => {
        galleryDropArea.classList.remove('drag-over');
    });
    
    galleryDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        galleryDropArea.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        handleGalleryUpload(files);
    });
    
    // Galeri görselleri için dosya seçici
    galleryInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleGalleryUpload(files);
    });
}

// Görsel yükleme işleyicisi
async function handleImageUpload(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadedImage').src = data.imageUrl;
            document.getElementById('imageDropArea').style.display = 'none';
        }
    } catch (error) {
        console.error('Görsel yükleme hatası:', error);
        alert('Görsel yüklenirken bir hata oluştu');
    }
}

// Galeri görsellerini yükleme işleyicisi
async function handleGalleryUpload(files) {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('gallery', file);
    });

    try {
        const response = await fetch('/api/admin/upload-gallery', {
            method: 'POST',
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            const galleryPreview = document.getElementById('galleryPreview');
            data.imageUrls.forEach(url => {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'gallery-image-container';
                imageContainer.innerHTML = `
                    <img src="${url}" alt="Galeri görseli">
                    <button type="button" class="btn-icon danger remove-gallery-image" onclick="removeGalleryImage(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                galleryPreview.appendChild(imageContainer);
            });
        }
    } catch (error) {
        console.error('Galeri yükleme hatası:', error);
        alert('Görseller yüklenirken bir hata oluştu');
    }
}

// Görsel kaldırma fonksiyonu
function removeImage() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imageDropArea').style.display = 'block';
    document.getElementById('uploadedImage').src = '';
}

// Galeri görseli kaldırma fonksiyonu
function removeGalleryImage(button) {
    button.parentElement.remove();
}

// Teknik özellik ekleme fonksiyonu
function addSpecification() {
    const specList = document.querySelector('.specifications-list');
    const specRow = document.createElement('div');
    specRow.className = 'spec-row';
    specRow.innerHTML = `
        <div class="form-group">
            <input type="text" placeholder="Özellik Adı" name="spec-name[]" required>
            <input type="text" placeholder="Değer" name="spec-value[]" required>
            <button type="button" class="btn-icon danger" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    specList.appendChild(specRow);
}

// Yeni ürün ekleme butonuna tıklama olayı ekle
document.getElementById('add-product').addEventListener('click', addNewProduct);