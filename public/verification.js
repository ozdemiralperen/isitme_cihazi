document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const verificationSection = document.createElement('div');
    verificationSection.className = 'verification-section';
    verificationSection.style.display = 'none';
    
    // Generate random verification code
    function generateVerificationCode() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Add verification section to the form
    function setupVerificationSection() {
      verificationSection.innerHTML = `
        <div class="form-group mt-4">
          <label for="verificationCode">Doğrulama Kodu:</label>
          <input type="text" class="form-control" id="verificationCode" placeholder="6 haneli kodu giriniz" required>
          <small class="text-muted">E-posta adresinize gönderilen 6 haneli kodu giriniz.</small>
        </div>
        <button type="button" id="verifyCodeBtn" class="btn btn-primary mt-2">Kodu Doğrula</button>
        <button type="button" id="resendCodeBtn" class="btn btn-secondary mt-2 ml-2">Kodu Tekrar Gönder</button>
      `;
      
      if (contactForm) {
        contactForm.appendChild(verificationSection);
      }
    }
    
    if (contactForm) {
      setupVerificationSection();
      let verificationCode = '';
      let userEmail = '';
      let userName = '';
      let userMessage = '';
      
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Gönderiliyor...';
        submitButton.disabled = true;
  
        // Get user input
        userEmail = this.querySelector('[name="email"]').value;
        userName = this.querySelector('[name="name"]').value;
        userMessage = this.querySelector('[name="message"]').value;
        
        // Generate a new verification code
        verificationCode = generateVerificationCode();
        
        const serviceID = 'service_u1ie1kb'; 
        const templateID = 'template_jr5kzhx'; // Doğrulama kodu için özel bir template oluşturmanız gerekebilir
        const userID = 'kCC8wQSKpJuMXbRlR';
  
        const templateParams = {
          email: userEmail,
          name: userName,
          verification_code: verificationCode, // Doğrulama kodunu template'e gönderiyoruz
          message: 'E-posta doğrulama kodunuz: ' + verificationCode
        };
  
        emailjs.send(serviceID, templateID, templateParams, userID)
          .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            alert('Doğrulama kodu e-posta adresinize gönderildi.');
            
            // Show verification section
            verificationSection.style.display = 'block';
            
            // Hide submit button temporarily
            submitButton.style.display = 'none';
          })
          .catch(function(error) {
            console.log('FAILED...', error);
            alert('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
          })
          .finally(function() {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          });
      });
      
      // Verify code button click handler
      document.getElementById('verifyCodeBtn').addEventListener('click', function() {
        const enteredCode = document.getElementById('verificationCode').value;
        
        if (enteredCode === verificationCode) {
          // Code is correct, send the actual message
          const serviceID = 'service_u1ie1kb'; 
          const templateID = 'template_jr5kzhx'; // Asıl mesaj için kullanılacak template
          const userID = 'kCC8wQSKpJuMXbRlR';
  
          const templateParams = {
            email: userEmail,
            name: userName,
            message: userMessage
          };
  
          emailjs.send(serviceID, templateID, templateParams, userID)
            .then(function(response) {
              console.log('MESSAGE SENT!', response.status, response.text);
              alert('Mesajınız başarıyla gönderildi.');
              contactForm.reset();
              verificationSection.style.display = 'none';
              document.querySelector('button[type="submit"]').style.display = 'block';
            })
            .catch(function(error) {
              console.log('FAILED...', error);
              alert('Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
            });
        } else {
          alert('Doğrulama kodu yanlış. Lütfen tekrar deneyiniz.');
        }
      });
      
      // Resend code button click handler
      document.getElementById('resendCodeBtn').addEventListener('click', function() {
        // Generate a new code
        verificationCode = generateVerificationCode();
        
        const serviceID = 'service_u1ie1kb'; 
        const templateID = 'template_jr5kzhx'; 
        const userID = 'kCC8wQSKpJuMXbRlR';
  
        const templateParams = {
          email: userEmail,
          name: userName,
          verification_code: verificationCode,
          message: 'E-posta doğrulama kodunuz: ' + verificationCode
        };
  
        emailjs.send(serviceID, templateID, templateParams, userID)
          .then(function(response) {
            console.log('CODE RESENT!', response.status, response.text);
            alert('Yeni doğrulama kodu e-posta adresinize gönderildi.');
          })
          .catch(function(error) {
            console.log('FAILED...', error);
            alert('Doğrulama kodu gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
          });
      });
    }
  });