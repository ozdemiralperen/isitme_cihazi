// Sepet işlemlerini yönetecek store.js dosyası
class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.updateCartCount();
    }

    // Sepete ürün ekleme
    addToCart(product, quantity = 1) {
        // Ürün zaten sepette var mı kontrolü
        const existingProductIndex = this.cart.findIndex(item => item.productId === product._id);

        if (existingProductIndex !== -1) {
            // Ürün varsa miktarı artır
            this.cart[existingProductIndex].quantity += quantity;
        } else {
            // Ürün yoksa sepete ekle
            this.cart.push({
                productId: product._id,
                name: product.name,
                price: product.discountPrice || product.price,
                originalPrice: product.price,
                imageUrl: product.imageUrl,
                quantity: quantity,
                stock: product.stock
            });
        }

        // Sepeti localStorage'a kaydet
        this.saveCart();

        // Sepet arayüzünü güncelle
        this.updateCartUI();
        
        return true;
    }

    // Sepetten ürün çıkarma
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    // Ürün adedini değiştirme
    updateQuantity(productId, quantity) {
        const productIndex = this.cart.findIndex(item => item.productId === productId);
        
        if (productIndex !== -1) {
            this.cart[productIndex].quantity = quantity;
            
            // Miktar 0 veya altına düşerse ürünü sepetten kaldır
            if (quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
            
            this.saveCart();
            this.updateCartUI();
        }
    }

    // Sepeti localStorage'a kaydetme
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
    }

    // Sepet sayısını güncelleme
    updateCartCount() {
        const cartCount = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = document.getElementById('cart-count');
        
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            
            // Sepet boş değilse göster, boşsa gizle
            if (cartCount > 0) {
                cartCountElement.style.display = 'block';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
    }

    // Sepet içeriğini temizleme
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartUI();
    }

    // Sepetin toplam tutarını hesaplama
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    // Sepet arayüzünü güncelleme
    updateCartUI() {
        const cartItemsElement = document.getElementById('cart-items');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (!cartItemsElement) return;
        
        // Sepet boşsa
        if (this.cart.length === 0) {
            cartItemsElement.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Sepetiniz boş</p>
                    <a href="store.html" class="btn">Alışverişe Başla</a>
                </div>
            `;
            if (cartTotalElement) {
                cartTotalElement.innerHTML = '0.00 ₺';
            }
            return;
        }
        
        // Sepette ürün varsa
        let html = '';
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            
            html += `
                <div class="cart-item" data-id="${item.productId}">
                    <div class="cart-item-image">
                        <img src="${item.imageUrl}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">
                            ${item.price.toLocaleString('tr-TR')} ₺
                        </div>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-id="${item.productId}">-</button>
                        <input type="number" min="1" max="${item.stock}" value="${item.quantity}" class="quantity-input" data-id="${item.productId}">
                        <button class="quantity-btn plus" data-id="${item.productId}">+</button>
                    </div>
                    <div class="cart-item-total">
                        ${itemTotal.toLocaleString('tr-TR')} ₺
                    </div>
                    <button class="remove-item" data-id="${item.productId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        cartItemsElement.innerHTML = html;
        
        // Toplam tutarı güncelle
        if (cartTotalElement) {
            const total = this.getCartTotal();
            cartTotalElement.innerHTML = `${total.toLocaleString('tr-TR')} ₺`;
        }
        
        // Butonlara olay dinleyicileri ekle
        this.addCartEventListeners();
    }

    // Sepet içi etkileşimleri için event listener'lar
    addCartEventListeners() {
        // Artı butonları
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                const productIndex = this.cart.findIndex(item => item.productId === productId);
                
                if (productIndex !== -1) {
                    const currentQuantity = this.cart[productIndex].quantity;
                    const maxStock = this.cart[productIndex].stock;
                    
                    if (currentQuantity < maxStock) {
                        this.updateQuantity(productId, currentQuantity + 1);
                    } else {
                        alert('Bu ürün için maksimum stok miktarına ulaştınız.');
                    }
                }
            });
        });
        
        // Eksi butonları
        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                const productIndex = this.cart.findIndex(item => item.productId === productId);
                
                if (productIndex !== -1) {
                    const currentQuantity = this.cart[productIndex].quantity;
                    if (currentQuantity > 1) {
                        this.updateQuantity(productId, currentQuantity - 1);
                    } else {
                        this.removeFromCart(productId);
                    }
                }
            });
        });
        
        // Miktar giriş alanları
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const productId = input.getAttribute('data-id');
                const quantity = parseInt(input.value);
                
                if (quantity > 0) {
                    this.updateQuantity(productId, quantity);
                } else {
                    this.removeFromCart(productId);
                }
            });
        });
        
        // Kaldır butonları
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.getAttribute('data-id');
                this.removeFromCart(productId);
            });
        });
    }

    // Ürün detayından sepete ekleme
    static handleAddToCart(product) {
        const cart = new ShoppingCart();
        const result = cart.addToCart(product);
        
        if (result) {
            // Mini sepet açılımını göster
            ShoppingCart.showMiniCart();
        }
    }

    // Mini sepet gösterimi
    static showMiniCart() {
        const miniCart = document.getElementById('mini-cart');
        if (miniCart) {
            miniCart.classList.add('show');
            
            // 3 saniye sonra otomatik kapat
            setTimeout(() => {
                miniCart.classList.remove('show');
            }, 3000);
        }
    }
}

// DOM yüklendikten sonra
document.addEventListener('DOMContentLoaded', function() {
    // Sepet nesnesini oluştur
    const cart = new ShoppingCart();
    
    // Sayfa yüklendiğinde sepet arayüzünü güncelle
    if (document.getElementById('cart-items')) {
        cart.updateCartUI();
    }
    
    // Sepete ekle butonlarına tıklama olayı
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.getAttribute('data-id');
            
            // Ürün detaylarını API'den al
            fetch(`/api/products/${productId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Ürünü sepete ekle
                        cart.addToCart(data.product);
                        
                        // Kullanıcıya bildirim göster
                        alert(`"${data.product.name}" ürünü sepete eklendi!`);
                        
                        // Mini sepet gösterimi
                        ShoppingCart.showMiniCart();
                    }
                })
                .catch(error => {
                    console.error('Ürün bilgisi alınamadı:', error);
                    alert('Ürün sepete eklenirken bir hata oluştu.');
                });
        }
    });
    
    // Mini sepet kapatma butonu
    const closeMiniCart = document.getElementById('close-mini-cart');
    if (closeMiniCart) {
        closeMiniCart.addEventListener('click', function() {
            const miniCart = document.getElementById('mini-cart');
            if (miniCart) {
                miniCart.classList.remove('show');
            }
        });
    }
    
    // Ödeme sayfası için sepet özetini göster
    const checkoutSummary = document.getElementById('checkout-summary');
    if (checkoutSummary) {
        const cartItems = cart.cart;
        const total = cart.getCartTotal();
        
        let html = '';
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

// Global olarak dışa aktar
window.ShoppingCart = ShoppingCart;