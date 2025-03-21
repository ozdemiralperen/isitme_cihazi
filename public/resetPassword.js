document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('resetPasswordModal');
    const closeButton = document.querySelector('.close-button');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const step1 = document.getElementById('reset-step-1');
    const step2 = document.getElementById('reset-step-2');
    const sendCodeBtn = document.getElementById('send-reset-code');
    let verificationCode = '';
    let resetEmail = '';

    // Modal açma/kapama
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        resetForm();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            resetForm();
        }
    });

    // Doğrulama kodu gönderme
    sendCodeBtn.addEventListener('click', async () => {
        resetEmail = document.getElementById('reset-email').value;
        
        if (!resetEmail) {
            alert('Lütfen e-posta adresinizi girin');
            return;
        }

        // Butonu yükleniyor durumuna getir
        const originalText = sendCodeBtn.textContent;
        sendCodeBtn.disabled = true;
        sendCodeBtn.innerHTML = `
            <span class="spinner"></span>
            Kod Gönderiliyor...
        `;

        try {
            // Önce e-posta adresinin sistemde kayıtlı olup olmadığını kontrol et
            const checkResponse = await fetch('/api/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: resetEmail })
            });

            const checkResult = await checkResponse.json();

            if (!checkResult.exists) {
                alert('Bu e-posta adresi sistemde kayıtlı değil.');
                sendCodeBtn.disabled = false;
                sendCodeBtn.innerHTML = originalText;
                return;
            }

            // E-posta kayıtlıysa doğrulama kodunu gönder
            verificationCode = generateVerificationCode();

            const templateParams = {
                email: resetEmail,
                verification_code: verificationCode
            };

            const response = await emailjs.send(
                'service_u1ie1kb',
                'template_jr5kzhx',
                templateParams,
                'kCC8wQSKpJuMXbRlR'
            );

            if (response.status === 200) {
                step1.style.display = 'none';
                step2.style.display = 'block';
                alert('Doğrulama kodu e-posta adresinize gönderildi.');
            }
        } catch (error) {
            console.error('Kod gönderme hatası:', error);
            alert('Doğrulama kodu gönderilirken bir hata oluştu.');
        } finally {
            // Butonu normal durumuna getir
            sendCodeBtn.disabled = false;
            sendCodeBtn.innerHTML = originalText;
        }
    });

    // Şifre sıfırlama
    document.getElementById('reset-password').addEventListener('click', async () => {
        const enteredCode = document.getElementById('reset-code').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('Şifreler eşleşmiyor');
            return;
        }

        if (enteredCode !== verificationCode) {
            alert('Doğrulama kodu hatalı');
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: resetEmail,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Şifreniz başarıyla güncellendi.');
                modal.style.display = 'none';
                resetForm();
            } else {
                alert(data.message || 'Şifre güncelleme başarısız.');
            }
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            alert('Şifre sıfırlanırken bir hata oluştu.');
        }
    });

    // Yardımcı fonksiyonlar
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function resetForm() {
        document.getElementById('reset-email').value = '';
        document.getElementById('reset-code').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        step1.style.display = 'block';
        step2.style.display = 'none';
        verificationCode = '';
        resetEmail = '';
    }
});