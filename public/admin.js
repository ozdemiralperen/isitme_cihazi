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
                    <td>${order.userId?.name || 'Misafir Kullanıcı'}</td>
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
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Siparişleri yükleme hatası:', error);
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
                    <td><span class="badge ${user.status}">${getStatusText(user.status)}</span></td>
                    <td>
                        <button onclick="editUser('${user._id}')" class="btn-icon">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleUserStatus('${user._id}')" class="btn-icon">
                            <i class="fas fa-power-off"></i>
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

// Kullanıcı durumu değiştirme
async function toggleUserStatus(userId) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'x-auth-token': localStorage.getItem('adminToken')
            }
        });
        
        const data = await response.json();
        if (data.success) {
            loadUsers(); // Tabloyu yenile
            alert('Kullanıcı durumu güncellendi');
        }
    } catch (error) {
        console.error('Kullanıcı durumu güncelleme hatası:', error);
        alert('Kullanıcı durumu güncellenirken bir hata oluştu');
    }
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
            // Modal'ı aç
            document.getElementById('edit-user-modal').style.display = 'block';
            // Form içeriğini doldur
            document.getElementById('edit-user-form').innerHTML = `
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
                <div class="form-group">
                    <label>Durum</label>
                    <select name="status">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Aktif</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Güncelle</button>
            `;

            // Form submit olayını dinle
            document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateData = Object.fromEntries(formData.entries());

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
                        document.getElementById('edit-user-modal').style.display = 'none';
                        loadUsers(); // Tabloyu yenile
                    } else {
                        alert(updateResult.message || 'Güncelleme başarısız');
                    }
                } catch (error) {
                    console.error('Kullanıcı güncelleme hatası:', error);
                    alert('Kullanıcı güncellenirken bir hata oluştu');
                }
            });
        }
    } catch (error) {
        console.error('Kullanıcı detayları yükleme hatası:', error);
        alert('Kullanıcı bilgileri yüklenirken bir hata oluştu');
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
    
    // Eğer önceden oluşturulmuş bir grafik varsa yok et
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const labels = monthlySales.map(sale => `${monthNames[sale._id.month - 1]} ${sale._id.year}`);
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
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Aylık Satış Grafiği'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('tr-TR') + ' ₺';
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
    
    // Eğer önceden oluşturulmuş bir grafik varsa yok et
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
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'En Çok Satan Ürünler'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}