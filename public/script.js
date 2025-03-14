document.addEventListener('DOMContentLoaded', function() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    const mobileMenuButton = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('nav');
    
    if (mobileMenuButton && nav) {
        mobileMenuButton.addEventListener('click', function() {
            this.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenuButton && mobileMenuButton.classList.contains('active')) {
                mobileMenuButton.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    });

    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // E-posta adresinin geçerli olup olmadığını kontrol eden fonksiyon
    function isValidEmail(email) {
        // Basit bir e-posta regex kontrolü
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Form verilerini al
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            // E-posta doğrulaması yap
            if (!isValidEmail(formData.email)) {
                formStatus.textContent = 'Lütfen geçerli bir e-posta adresi giriniz.';
                formStatus.style.color = 'red';
                formStatus.style.display = 'block';
                
                setTimeout(() => {
                    formStatus.textContent = '';
                    formStatus.style.display = 'none';
                }, 5000);
                
                return; // İşlemi durdur
            }
            
            formStatus.textContent = 'Mesajınız gönderiliyor...';
            formStatus.style.color = '#0066cc';
            formStatus.style.display = 'block';
            
            try {
                // API'ye gönder (MongoDB ile bağlantılı backend)
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    formStatus.textContent = 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.';
                    formStatus.style.color = 'green';
                    contactForm.reset();
                } else {
                    formStatus.textContent = result.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
                    formStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('Form gönderme hatası:', error);
                formStatus.textContent = 'Bağlantı hatası. Lütfen daha sonra tekrar deneyin.';
                formStatus.style.color = 'red';
            }
            
            setTimeout(() => {
                formStatus.textContent = '';
                formStatus.style.display = 'none';
            }, 5000);
        });
    }

    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.2)';
            header.style.padding = '10px 0';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            header.style.padding = '15px 0';
        }
    });
    
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('touchstart', function() {
            this.classList.add('hover');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('hover');
            }, 300);
        });
    });
    
    const fadeElements = document.querySelectorAll('.fade-in');
    
    function checkFade() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight - 100) {
                element.classList.add('visible');
            }
        });
    }
    
    checkFade();
    
    window.addEventListener('scroll', checkFade);
    
    addScrollToTopButton();
});

window.addEventListener('load', function() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.style.width = '100%';
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 500);
    }
    
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        }, 500);
    }
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function addScrollToTopButton() {
    if (document.querySelector('.scroll-to-top')) return;
    
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-to-top';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = 'var(--primary-color)';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.fontSize = '24px';
    button.style.cursor = 'pointer';
    button.style.display = 'none';
    button.style.zIndex = '999';
    button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    button.addEventListener('click', scrollToTop);
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const modalSettings = [
      {
        linkText: 'Gizlilik Politikası',
        modalId: 'privacyModal'
      },
      {
        linkText: 'Kullanım Şartları',
        modalId: 'termsModal'
      },
      {
        linkText: 'Sıkça Sorulan Sorular',
        modalId: 'faqModal'
      }
    ];
    
    // Tüm linkleri bulalım
    const allLinks = document.querySelectorAll('a');
    
    // Her modal türü için işlemleri gerçekleştirelim
    modalSettings.forEach(setting => {
      // Linki bulalım
      let modalLink = null;
      allLinks.forEach(link => {
        if (link.textContent.includes(setting.linkText)) {
          modalLink = link;
          console.log(`${setting.linkText} linki bulundu:`, link);
        }
      });
      
      // Modal ve kapatma düğmesini bulalım
      const modal = document.getElementById(setting.modalId);
      const closeButton = modal ? modal.querySelector('.close-button') : null;
      
      if (modalLink && modal && closeButton) {
        // Linke tıklandığında modalı göster
        modalLink.addEventListener('click', function(e) {
          e.preventDefault();
          console.log(`Link tıklandı, ${setting.modalId} açılıyor...`);
          modal.style.display = 'block';
          document.body.style.overflow = 'hidden';
        });
        
        // Kapatma düğmesine tıklandığında modalı gizle
        closeButton.addEventListener('click', function() {
          console.log(`Kapatma düğmesi tıklandı, ${setting.modalId} kapanıyor...`);
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        });
        
        // Modal dışına tıklandığında modalı gizle
        window.addEventListener('click', function(e) {
          if (e.target === modal) {
            console.log(`Modal dışına tıklandı, ${setting.modalId} kapanıyor...`);
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
          }
        });
        
        // ESC tuşuna basıldığında modalı kapat
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && modal.style.display === 'block') {
            console.log(`ESC tuşuna basıldı, ${setting.modalId} kapanıyor...`);
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
          }
        });
        
        console.log(`${setting.linkText} modal sistemi başarıyla yüklendi.`);
      } else {
        console.error(`${setting.linkText} bileşenleri eksik:`, {
          'Link bulundu mu?': !!modalLink,
          'Modal bulundu mu?': !!modal,
          'Kapatma düğmesi bulundu mu?': !!closeButton
        });
      }
    });
    
    // Yıl bilgisini otomatik güncelleme
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
});
