document.addEventListener('DOMContentLoaded', function() {
    const cart = new ShoppingCart();
    const checkoutForm = document.getElementById('checkout-form');
    const paymentMethodSelect = document.querySelector('select[name="paymentMethod"]');
    const paymentDetailsContainer = document.getElementById('payment-details');

    // JWT token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Lütfen önce giriş yapın');
        window.location.href = 'login.html';
        return;
    }

    // Sepet boşsa mağazaya yönlendir
    if (cart.cart.length === 0) {
        window.location.href = 'store.html';
        return;
    }

    // Sipariş özetini yükle
    updateCheckoutSummary();

    // Ödeme yöntemi değiştiğinde
    paymentMethodSelect.addEventListener('change', function(e) {
        const selectedMethod = e.target.value;
        updatePaymentForm(selectedMethod);
    });

    // İlk yüklemede varsayılan ödeme formunu göster
    updatePaymentForm(paymentMethodSelect.value);

    // Form gönderimi
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Form verilerini topla
        const formData = new FormData(checkoutForm);
        const orderData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            items: cart.cart,
            totalAmount: cart.getCartTotal(),
            paymentMethod: formData.get('paymentMethod'),
            paymentDetails: getPaymentDetails(formData)
        };

        try {
            // Demo ödeme modalını göster
            showDemoPaymentModal(orderData);
        } catch (error) {
            console.error('Sipariş oluşturma hatası:', error);
            alert('Sipariş işlemi sırasında bir hata oluştu');
        }
    });

    // Ödeme detaylarını toplayan yardımcı fonksiyon
    function getPaymentDetails(formData) {
        const paymentMethod = formData.get('paymentMethod');
        if (paymentMethod === 'credit_card') {
            return {
                cardHolderName: formData.get('cardHolderName'),
                cardNumber: formData.get('cardNumber'),
                expiry: formData.get('expiry'),
                cvv: formData.get('cvv')
            };
        } else if (paymentMethod === 'bank_transfer') {
            return {
                transferReference: formData.get('transferReference')
            };
        }
        return {};
    }

    // Demo ödeme modalı
    function showDemoPaymentModal(orderData) {
        const modal = document.createElement('div');
        modal.className = 'demo-payment-modal';
        modal.innerHTML = `
            <div class="demo-payment-content">
                <h2>Demo Ödeme Ekranı</h2>
                <p>Toplam Tutar: ${orderData.totalAmount.toLocaleString('tr-TR')} ₺</p>
                <div class="payment-options">
                    <button onclick="completeDemoPayment(true)" class="btn-success">Ödemeyi Tamamla</button>
                    <button onclick="completeDemoPayment(false)" class="btn-danger">İptal Et</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Global ödeme tamamlama fonksiyonu
        window.completeDemoPayment = async function(success) {
            if (success) {
                try {
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(orderData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        cart.clearCart();
                        alert('Siparişiniz başarıyla oluşturuldu!');
                        window.location.href = 'profile.html#orders';
                    } else {
                        alert(result.message || 'Sipariş oluşturulurken bir hata oluştu');
                    }
                } catch (error) {
                    console.error('Sipariş oluşturma hatası:', error);
                    alert('Sipariş oluşturulurken bir hata oluştu');
                }
            } else {
                alert('Ödeme iptal edildi');
            }
            modal.remove();
        };
    }

    // Ödeme formunu güncelleme
    function updatePaymentForm(method) {
        let formHTML = '';
        
        switch(method) {
            case 'credit_card':
                formHTML = `
                    <div class="form-section payment-details">
                        <h3>Kredi Kartı Bilgileri</h3>
                        <div class="form-group">
                            <label>Kart Üzerindeki İsim</label>
                            <input type="text" name="cardHolderName" required>
                        </div>
                        <div class="form-group">
                            <label>Kart Numarası</label>
                            <input type="text" name="cardNumber" maxlength="19" required>
                        </div>
                        <div class="card-extra">
                            <div class="form-group">
                                <label>Son Kullanma Tarihi</label>
                                <input type="text" name="expiry" placeholder="AA/YY" maxlength="5" required>
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="text" name="cvv" maxlength="3" required>
                            </div>
                        </div>
                    </div>`;
                break;

            case 'bank_transfer':
                formHTML = `
                    <div class="form-section payment-details">
                        <h3>Banka Hesap Bilgileri</h3>
                        <div class="bank-info">
                            <p><strong>Banka:</strong> XYZ Bank</p>
                            <p><strong>Hesap Sahibi:</strong> İşitTech Ltd. Şti.</p>
                            <p><strong>IBAN:</strong> TR12 3456 7890 1234 5678 9012 34</p>
                            <div class="notice">
                                <i class="fas fa-info-circle"></i>
                                <p>Havale/EFT işleminizi gerçekleştirdikten sonra dekont bilgilerini girmeniz gerekmektedir.</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Dekont Numarası</label>
                            <input type="text" name="transferReference" required>
                        </div>
                    </div>`;
                break;
        }
        
        paymentDetailsContainer.innerHTML = formHTML;
    }

    // Sipariş özetini güncelleme
    function updateCheckoutSummary() {
        const checkoutSummary = document.getElementById('checkout-summary');
        const cartItems = cart.cart;
        const total = cart.getCartTotal();
        
        let html = '<h3>Sipariş Özeti</h3>';
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            html += `
                <div class="checkout-item">
                    <div class="checkout-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.quantity} adet x ${item.price.toLocaleString('tr-TR')} ₺</p>
                    </div>
                    <div class="checkout-item-total">
                        ${itemTotal.toLocaleString('tr-TR')} ₺
                    </div>
                </div>
            `;
        });
        
        html += `
            <div class="checkout-total">
                <h3>Toplam Tutar:</h3>
                <h3>${total.toLocaleString('tr-TR')} ₺</h3>
            </div>
        `;
        
        checkoutSummary.innerHTML = html;
    }
});