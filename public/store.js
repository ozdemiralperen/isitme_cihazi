document.addEventListener('DOMContentLoaded', function() {
    // Global değişkenler
    let currentPage = 1;
    let totalPages = 1;
    let currentCategory = 'all';
    let currentSort = 'featured';
    const limit = 12;

    // DOM elementleri
    const productsContainer = document.getElementById('products-container');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const productModal = document.getElementById('product-modal');
    const modalContent = document.getElementById('modal-product-content');
    const closeModal = document.querySelector('.close-modal');

    // Kategorileri yükle
    fetchCategories();
    
    // Sayfa yüklendiğinde ürünleri getir
    fetchProducts();

    // Kategori filtresi değiştiğinde
    categoryFilter.addEventListener('change', function() {
        currentCategory = this.value;
        currentPage = 1;
        fetchProducts();
    });

    // Sıralama seçenekleri değiştiğinde
    sortFilter.addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        fetchProducts();
    });

    // Önceki sayfa butonuna tıklandığında
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            fetchProducts();
        }
    });

    // Sonraki sayfa butonuna tıklandığında
    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            fetchProducts();
        }
    });

    // Modal'ı kapatma
    closeModal.addEventListener('click', function() {
        productModal.style.display = 'none';
    });

    // Modal dışına tıklandığında kapanma
    window.addEventListener('click', function(event) {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Kategorileri getirme fonksiyonu
    function fetchCategories() {
        fetch('/api/categories')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.categories) {
                    populateCategoryFilter(data.categories);
                } else {
                    console.error('Kategoriler alınamadı:', data.message || 'Bilinmeyen hata');
                }
            })
            .catch(error => {
                console.error('Kategori getirme hatası:', error);
            });
    }

    // Kategori filtresini doldurma
    function populateCategoryFilter(categories) {
        // Mevcut "Tüm Kategoriler" seçeneğini koru
        let options = `<option value="all">Tüm Kategoriler</option>`;
        
        // Diğer kategorileri ekle
        categories.forEach(category => {
            options += `<option value="${category}">${category}</option>`;
        });
        
        categoryFilter.innerHTML = options;
    }

    // Ürünleri getirme fonksiyonu
    function fetchProducts() {
        // Loading durumunu göster
        productsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Ürünler yükleniyor...</p>
            </div>
        `;

        // API'den ürünleri getir
        fetch(`/api/products?category=${currentCategory}&sort=${currentSort}&page=${currentPage}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayProducts(data.products);
                    updatePagination(data.pagination);
                } else {
                    productsContainer.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>${data.message || 'Ürünler yüklenirken bir hata oluştu.'}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Ürün getirme hatası:', error);
                productsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
                    </div>
                `;
            });
    }

    // Ürünleri ekranda gösterme fonksiyonu
    function displayProducts(products) {
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <p>Bu kategoride ürün bulunamadı.</p>
                </div>
            `;
            return;
        }

        let html = '';
        products.forEach(product => {
            // İndirim yüzdesi hesaplama (discountPrice varsa)
            const discountBadge = product.discountPrice ? 
                `<span class="discount-badge">%${Math.round((1 - product.discountPrice / product.price) * 100)}</span>` : '';
            
            // Fiyat gösterimi (indirim varsa veya yoksa)
            const priceDisplay = product.discountPrice ? 
                `<span class="original-price">${product.price.toLocaleString('tr-TR')} ₺</span>
                 <span class="discount-price">${product.discountPrice.toLocaleString('tr-TR')} ₺</span>` : 
                `<span class="price">${product.price.toLocaleString('tr-TR')} ₺</span>`;

            html += `
                <div class="product-card" data-id="${product._id}">
                    ${discountBadge}
                    <div class="product-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.shortDescription}</p>
                        <div class="product-price">
                            ${priceDisplay}
                        </div>
                        <button class="btn view-details" data-id="${product._id}">Detayları Gör</button>
                    </div>
                </div>
            `;
        });

        productsContainer.innerHTML = html;

        // Ürün detayları butonlarına tıklama olayı ekle
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                fetchProductDetails(productId);
            });
        });
    }

    // Pagination bilgilerini güncelleme
    function updatePagination(pagination) {
        totalPages = pagination.totalPages;
        currentPage = pagination.currentPage;
        
        pageInfo.textContent = `Sayfa ${currentPage} / ${totalPages}`;
        
        prevPageBtn.disabled = !pagination.hasPrevPage;
        nextPageBtn.disabled = !pagination.hasNextPage;
    }

    // Ürün detaylarını getirme fonksiyonu
    function fetchProductDetails(productId) {
        modalContent.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Ürün detayları yükleniyor...</p>
            </div>
        `;
        
        productModal.style.display = 'block';

        fetch(`/api/products/${productId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayProductDetails(data.product);
                } else {
                    modalContent.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>${data.message || 'Ürün detayları yüklenirken bir hata oluştu.'}</p>
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Ürün detay hatası:', error);
                modalContent.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Ürün detayları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
                    </div>
                `;
            });
    }

    // Ürün detaylarını modal'da gösterme fonksiyonu
    function displayProductDetails(product) {
        // Ürün galerisi
        let galleryHtml = '';
        if (product.imageGallery && product.imageGallery.length > 0) {
            galleryHtml = `
                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${product.imageUrl}" alt="${product.name}" id="main-product-image">
                    </div>
                    <div class="thumbnail-images">
                        <img src="${product.imageUrl}" alt="${product.name}" class="thumbnail active" onclick="changeMainImage(this.src)">
                        ${product.imageGallery.map(img => `
                            <img src="${img}" alt="${product.name}" class="thumbnail" onclick="changeMainImage(this.src)">
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            galleryHtml = `
                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                </div>
            `;
        }

        // Ürün fiyatı
        const priceDisplay = product.discountPrice ? 
            `<span class="original-price">${product.price.toLocaleString('tr-TR')} ₺</span>
             <span class="discount-price">${product.discountPrice.toLocaleString('tr-TR')} ₺</span>` : 
            `<span class="price">${product.price.toLocaleString('tr-TR')} ₺</span>`;

        // Ürün teknik özellikleri
        let specificationsHtml = '';
        if (product.specifications && product.specifications.length > 0) {
            specificationsHtml = `
                <div class="product-specifications">
                    <h4>Teknik Özellikler</h4>
                    <ul>
                        ${product.specifications.map(spec => `
                            <li><strong>${spec.name}:</strong> ${spec.value}</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        // Stok durumu
        const stockStatus = product.stock > 0 ? 
            `<span class="in-stock">Stokta Var (${product.stock} adet)</span>` : 
            `<span class="out-of-stock">Stokta Yok</span>`;

        modalContent.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-left">
                    ${galleryHtml}
                </div>
                <div class="product-detail-right">
                    <h2>${product.name}</h2>
                    <div class="product-meta">
                        <span class="product-category">Kategori: ${product.category}</span>
                    </div>
                    <div class="product-price detail-price">
                        ${priceDisplay}
                    </div>
                    <div class="stock-status">
                        ${stockStatus}
                    </div>
                    <div class="product-description">
                        <p>${product.description}</p>
                    </div>
                    ${specificationsHtml}
                    <div class="product-actions">
                        <button class="btn add-to-cart" ${product.stock <= 0 ? 'disabled' : ''} data-id="${product._id}">
                            <i class="fas fa-shopping-cart"></i> Sepete Ekle
                        </button>
                        <button class="btn add-to-favorites" data-id="${product._id}">
                            <i class="far fa-heart"></i> Favorilere Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Thumbnail tıklama olayı için global fonksiyon
        window.changeMainImage = function(src) {
            document.getElementById('main-product-image').src = src;
            
            // Aktif thumbnail'i değiştir
            document.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
                if (thumb.src === src) {
                    thumb.classList.add('active');
                }
            });
        };

        // Sepete ekle butonu tıklama olayı
        document.querySelector('.add-to-cart').addEventListener('click', function() {
            if (product.stock <= 0) return;
            
            const productId = this.getAttribute('data-id');
            // Sepete ekleme fonksiyonunu burada çağırabilirsiniz
            // addToCart(productId);
            alert(`"${product.name}" ürünü sepete eklendi!`);
        });

        // Favorilere ekle butonu tıklama olayı
        document.querySelector('.add-to-favorites').addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            // Favorilere ekleme fonksiyonunu burada çağırabilirsiniz
            // addToFavorites(productId);
            alert(`"${product.name}" ürünü favorilere eklendi!`);
        });
    }
});