document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          const submitButton = this.querySelector('button[type="submit"]');
          const originalButtonText = submitButton.textContent;
          submitButton.textContent = 'Gönderiliyor...';
          submitButton.disabled = true;

          const serviceID = 'service_u1ie1kb'; 
          const templateID = 'template_jr5kzhx'; 
          const userID = 'kCC8wQSKpJuMXbRlR';

          // Form alanlarından değerleri alıyoruz
          const userEmail = this.querySelector('[name="email"]').value;
          const userName = this.querySelector('[name="name"]').value;
          const userMessage = this.querySelector('[name="message"]').value;

          const templateParams = {
              email: userEmail,
              name: userName,
              message: userMessage
          };

          emailjs.send(serviceID, templateID, templateParams, userID)
              .then(function(response) {
                  console.log('SUCCESS!', response.status, response.text);
                  alert('Mesajınız başarıyla gönderildi.');
                  contactForm.reset();
              })
              .catch(function(error) {
                  console.log('FAILED...', error);
                  alert('Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
              })
              .finally(function() {
                  submitButton.textContent = originalButtonText;
                  submitButton.disabled = false;
              });
      });
  }
});
