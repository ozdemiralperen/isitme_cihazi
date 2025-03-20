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
// E-posta sağlayıcı kontrolü fonksiyonu
function checkEmailProvider(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Domain yoksa geçersiz e-posta
  if (!domain) return { isPopularProvider: false, provider: 'Geçersiz' };
  
  // Popüler e-posta sağlayıcıları
  const popularProviders = {
    'gmail.com': 'Gmail',
    'outlook.com': 'Outlook',
    'hotmail.com': 'Hotmail',
    'yahoo.com': 'Yahoo',
    'icloud.com': 'iCloud',
    'protonmail.com': 'ProtonMail',
    'yandex.com': 'Yandex',
    'aol.com': 'AOL',
    'zoho.com': 'Zoho',
    
    // Microsoft hizmetleri
    'outlook.co.uk': 'Outlook',
    'outlook.fr': 'Outlook',
    'outlook.de': 'Outlook',
    'outlook.jp': 'Outlook',
    'outlook.com.tr': 'Outlook',
    'hotmail.co.uk': 'Hotmail',
    'hotmail.fr': 'Hotmail',
    'hotmail.de': 'Hotmail',
    'live.com': 'Microsoft Live',
    'msn.com': 'MSN',
    
    // Google hizmetleri
    'googlemail.com': 'Gmail',
    
    // Apple hizmetleri
    'me.com': 'iCloud',
    'mac.com': 'iCloud',
    
    // Yahoo hizmetleri
    'yahoo.co.uk': 'Yahoo',
    'yahoo.fr': 'Yahoo',
    'yahoo.de': 'Yahoo',
    'yahoo.co.jp': 'Yahoo Japan',
    'ymail.com': 'Yahoo',
    'rocketmail.com': 'Yahoo',
  };
  
  // Sağlayıcı kontrolü
  if (popularProviders[domain]) {
    return {
      isPopularProvider: true,
      provider: popularProviders[domain]
    };
  }
  
  return {
    isPopularProvider: false,
    provider: 'Diğer'
  };
}

// E-posta format kontrolü
function validateEmail(email) {
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

// Global bir değişken, e-posta geçerliliğini takip etmek için
let isEmailValid = false;

// Form durumunu kontrol et ve butonun durumunu güncelle
function checkFormValidity() {
  const submitButton = registerForm.querySelector('button[type="submit"]');
  if (!submitButton) return;
  
  // E-posta geçerliyse butonu aktif et, değilse devre dışı bırak
  submitButton.disabled = !isEmailValid;
  
  // Görsel geri bildirim için stil değişikliği
  if (!isEmailValid) {
    submitButton.style.opacity = '0.5';
    submitButton.style.cursor = 'not-allowed';
  } else {
    submitButton.style.opacity = '1';
    submitButton.style.cursor = 'pointer';
  }
}

// Kayıt işlemi
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const emailInput = document.getElementById('email');
  let isEmailValid = false;
  let verificationCode = '';
  
  // Doğrulama alanı için HTML elementini bul
  const verificationContainer = document.getElementById('verification-container');
  
  // E-posta geri bildirim elementi oluştur
  if (emailInput && registerForm) {
    const emailFeedback = document.createElement('div');
    emailFeedback.className = 'email-feedback';
    emailFeedback.style.marginTop = '5px';
    emailFeedback.style.fontSize = '14px';
    
    // Mevcut bir feedback elementi varsa kaldır, yoksa ekle
    const existingFeedback = emailInput.parentNode.querySelector('.email-feedback');
    if (existingFeedback) {
      emailInput.parentNode.replaceChild(emailFeedback, existingFeedback);
    } else {
      emailInput.parentNode.insertBefore(emailFeedback, emailInput.nextSibling);
    }

    // E-posta girişi değiştiğinde doğrulama
    emailInput.addEventListener('input', () => {
      const email = emailInput.value.trim();
      
      if (!email) {
        emailFeedback.textContent = '';
        isEmailValid = false;
        checkFormValidity();
        return;
      }
      
      if (!validateEmail(email)) {
        emailFeedback.textContent = 'Geçersiz e-posta formatı';
        emailFeedback.style.color = 'red';
        isEmailValid = false;
        checkFormValidity();
        return;
      }
      
      const providerInfo = checkEmailProvider(email);
      if (providerInfo.isPopularProvider) {
        emailFeedback.textContent = `${providerInfo.provider} hesabı tespit edildi`;
        emailFeedback.style.color = 'green';
        isEmailValid = true;
      } else {
        emailFeedback.textContent = 'Geçersiz e-posta';
        emailFeedback.style.color = 'orange';
        isEmailValid = false; // Bilinmeyen sağlayıcı olsa da format geçerliyse kabul et
      }
      
      checkFormValidity();
    });
    
    // Sayfa yüklendiğinde butonun durumunu ayarla
    checkFormValidity();
    
    // Sayfa yüklendiğinde mevcut içeriği doğrula
    if (emailInput.value) {
      emailInput.dispatchEvent(new Event('input'));
    }

    // Form doğrulama fonksiyonu
    function checkFormValidity() {
      const submitButton = registerForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = !isEmailValid;
      }
    }

    // Rastgele doğrulama kodu oluştur
    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Formun normal gönderimini engelle
      
      // Form zaten submit butonunu devre dışı bırakarak gönderilmesini engelleyecek,
      // ancak yine de çift kontrol yapalım
      if (!isEmailValid) {
        return false;
      }
      
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      // E-posta sağlayıcı kontrolü
      const providerInfo = checkEmailProvider(email);
      
      // Form gönderme butonunu devre dışı bırak
      const submitButton = registerForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Doğrulama Kodu Gönderiliyor...';
      }

      // Doğrulama kodu oluştur
      verificationCode = generateVerificationCode();

      // EmailJS ile doğrulama kodunu gönder
      const serviceID = 'service_u1ie1kb'; 
      const templateID = 'template_jr5kzhx'; // Doğrulama kodu için uygun template
      const userID = 'kCC8wQSKpJuMXbRlR';

      const templateParams = {
        email: email,
        name: username,
        verification_code: verificationCode,
        message: 'Kayıt için doğrulama kodunuz: ' + verificationCode
      };

      try {
        const response = await emailjs.send(serviceID, templateID, templateParams, userID);
        console.log('Doğrulama kodu gönderildi:', response.status, response.text);
        
        // Doğrulama bölümünü HTML içinde oluştur
        verificationContainer.innerHTML = `
          <div class="verification-section">
            <div class="form-group">
              <label for="verificationCode">Doğrulama Kodu:</label>
              <input type="text" class="form-control" id="verificationCode" name="verificationCode" 
                     placeholder="6 haneli kodu giriniz" required>
              <small class="text-muted">E-posta adresinize gönderilen 6 haneli kodu giriniz.</small>
            </div>
            <button type="button" id="verifyCodeBtn" class="btn btn-primary">Kodu Doğrula</button>
            <button type="button" id="resendCodeBtn" class="btn btn-secondary">Kodu Tekrar Gönder</button>
          </div>
        `;
        
        // Doğrulama bölümünü göster
        verificationContainer.style.display = 'block';
        
        // Kayıt butonunu gizle
        submitButton.style.display = 'none';
        
        // Doğrulama kodu işleyicileri ekle
        setupVerificationHandlers(username, email, password, providerInfo);
        
      } catch (error) {
        console.error('Doğrulama kodu gönderme hatası:', error);
        alert('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Kayıt Ol';
        }
      }
      
      return false; // Formun normal gönderimini engelle
    });
  }

  // Doğrulama koduna ilişkin olay işleyicilerini ayarlar
  function setupVerificationHandlers(username, email, password, providerInfo) {
    // Doğrulama butonu tıklama
    document.getElementById('verifyCodeBtn').addEventListener('click', async function() {
      const enteredCode = document.getElementById('verificationCode').value;
      
      if (enteredCode === verificationCode) {
        // Doğrulama başarılı, gerçek kayıt işlemini yap
        try {
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              username, 
              email, 
              password,
              emailProvider: providerInfo.provider,
              isPopularProvider: providerInfo.isPopularProvider,
              emailVerified: true // E-posta doğrulandı
            })
          });
          
          const data = await response.json();
          
          if (data.success) {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            window.location.href = 'login.html';
          } else {
            alert(data.message || 'Kayıt başarısız');
            // Doğrulama bölümünü gizle ve normal butonu tekrar göster
            verificationContainer.style.display = 'none';
            const submitButton = registerForm.querySelector('button[type="submit"]');
            if (submitButton) {
              submitButton.style.display = 'block';
              submitButton.disabled = false;
              submitButton.textContent = 'Kayıt Ol';
            }
          }
        } catch (error) {
          console.error('Kayıt hatası:', error);
          alert('Kayıt işlemi sırasında bir hata oluştu');
          // Doğrulama bölümünü gizle ve normal butonu tekrar göster
          verificationContainer.style.display = 'none';
          const submitButton = registerForm.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.style.display = 'block';
            submitButton.disabled = false;
            submitButton.textContent = 'Kayıt Ol';
          }
        }
      } else {
        alert('Doğrulama kodu yanlış. Lütfen tekrar deneyiniz.');
      }
    });
    
    // Yeniden kod gönderme butonu tıklama
    document.getElementById('resendCodeBtn').addEventListener('click', async function() {
      // Yeni bir doğrulama kodu oluştur
      verificationCode = generateVerificationCode();
      
      const serviceID = 'service_u1ie1kb'; 
      const templateID = 'template_jr5kzhx';
      const userID = 'kCC8wQSKpJuMXbRlR';

      const templateParams = {
        email: email,
        name: username,
        verification_code: verificationCode,
        message: 'Kayıt için doğrulama kodunuz: ' + verificationCode
      };

      try {
        const response = await emailjs.send(serviceID, templateID, templateParams, userID);
        console.log('Yeni doğrulama kodu gönderildi:', response.status, response.text);
        alert('Yeni doğrulama kodu e-posta adresinize gönderildi.');
      } catch (error) {
        console.error('Doğrulama kodu gönderme hatası:', error);
        alert('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    });
  }
  
  // E-posta formatı doğrulama fonksiyonu (kodda var olduğunu varsayıyoruz)
  function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }
  
  // E-posta sağlayıcı kontrolü fonksiyonu (kodda var olduğunu varsayıyoruz)
  function checkEmailProvider(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) return { provider: 'Bilinmiyor', isPopularProvider: false };
    
    const providers = {
      'gmail.com': 'Gmail',
      'hotmail.com': 'Hotmail',
      'outlook.com': 'Outlook',
      'yahoo.com': 'Yahoo',
      'icloud.com': 'iCloud',
      'aol.com': 'AOL',
      'protonmail.com': 'ProtonMail',
      'mail.com': 'Mail.com',
      'yandex.com': 'Yandex',
      'zoho.com': 'Zoho'
    };
    
    return {
      provider: providers[domain] || 'Diğer',
      isPopularProvider: domain in providers
    };
  }
});
// Login işlemi 
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Önce admin girişini kontrol et
            const adminResponse = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const adminData = await adminResponse.json();
            
            if (adminData.success) {
                // Admin girişi başarılı
                localStorage.setItem('adminToken', adminData.token);
                localStorage.setItem('adminUser', JSON.stringify(adminData.admin));
                window.location.href = 'admin.html';
                return;
            }
            
            // Admin girişi başarısız olduysa normal kullanıcı girişini dene
            const userResponse = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const userData = await userResponse.json();
            
            if (userData.success) {
                localStorage.setItem('token', userData.token);
                localStorage.setItem('user', JSON.stringify(userData.user));
                window.location.href = 'store.html';
            } else {
                alert(userData.message || 'Giriş başarısız');
            }
        } catch (error) {
            console.error('Giriş hatası:', error);
            alert('Giriş işlemi sırasında bir hata oluştu');
        }
    });
}
// Kullanıcı durumunu kontrol et ve menüyü güncelle
function updateNavigation() {
    const userToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const loginElement = document.getElementById('login-link');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (userToken && userData && loginElement) {
      // Kullanıcı giriş yapmışsa "Profilim" olarak değiştir
      const user = JSON.parse(userData);
      loginElement.textContent = 'Profilim';
      loginElement.href = '#'; // Link'i # olarak değiştiriyoruz çünkü tıklamayı dropdown için kullanacağız
      
      // Dropdown toggle ekleyelim
      loginElement.addEventListener('click', (e) => {
        e.preventDefault();
        if (userDropdown) {
          // Display değerini toggle et
          userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
        }
      });
      
      // Dropdown dışına tıklandığında dropdown'ı kapatma
      document.addEventListener('click', (e) => {
        if (userDropdown && e.target !== loginElement && !userDropdown.contains(e.target)) {
          userDropdown.style.display = 'none';
        }
      });
    }
  }
  
  // Çıkış fonksiyonu
  function setupLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Local storage'dan token ve kullanıcı bilgilerini temizle
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Sayfayı yenile veya ana sayfaya yönlendir
        window.location.href = 'index.html';
        
        // Alternatif olarak sadece sayfayı yenileyebilirsiniz
        // window.location.reload();
      });
    }
  }
  
  // Sayfa yüklendiğinde her iki fonksiyonu da çalıştır
  document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    setupLogout();
  });

