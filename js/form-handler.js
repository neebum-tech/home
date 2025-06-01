document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    
    if (!form) {
        console.error('Formulário não encontrado!');
        return;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-button');
        const originalText = submitBtn.textContent;
        
        // Validação antes do envio
        if (!validateForm()) {
            return;
        }
        
        // UI Loading
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        try {
            const formData = new FormData(form);
            
            // Adicionar informações extras
            formData.append('timestamp', new Date().toLocaleString('pt-BR'));
            formData.append('user_agent', navigator.userAgent);
            formData.append('page_url', window.location.href);
            
            console.log('📤 Enviando lead via Web3Forms...');
            
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('✅ Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
                form.reset();
                
                // Analytics (se configurado)
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'generate_lead', {
                        'event_category': 'form',
                        'event_label': 'contact_form_web3forms',
                        'value': 1
                    });
                }
                
                console.log('✅ Lead enviado com sucesso via Web3Forms!');
                
            } else {
                throw new Error(result.message || 'Erro no envio');
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            
            // Salvar localmente como backup
            saveToLocalStorage();
            showMessage('❌ Erro ao enviar mensagem. Dados salvos localmente. Tente novamente em alguns minutos.', 'error');
        }
        
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    });
    
    // Funções auxiliares
    function validateForm() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        
        if (!name || !email) {
            showMessage('⚠️ Por favor, preencha pelo menos o nome e e-mail.', 'warning');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showMessage('❌ Por favor, insira um e-mail válido.', 'error');
            return false;
        }
        
        if (name.length < 2) {
            showMessage('⚠️ Nome deve ter pelo menos 2 caracteres.', 'warning');
            return false;
        }
        
        return true;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showMessage(message, type) {
        // Remove mensagem anterior
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        
        // Inserir antes do formulário
        form.parentNode.insertBefore(messageDiv, form);
        
        // Auto-remover após 6 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 6000);
        
        // Scroll suave para a mensagem
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function saveToLocalStorage() {
        try {
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value,
                timestamp: new Date().toISOString(),
                status: 'pending_sync'
            };
            
            const leads = JSON.parse(localStorage.getItem('neebum-leads-backup')) || [];
            leads.push(formData);
            localStorage.setItem('neebum-leads-backup', JSON.stringify(leads));
            
            console.log('💾 Lead salvo localmente como backup');
        } catch (error) {
            console.error('Erro ao salvar backup local:', error);
        }
    }
    
    // Validação em tempo real
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('name');
    
    emailInput.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '';
        }
    });
    
    nameInput.addEventListener('blur', function() {
        if (this.value && this.value.length < 2) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '';
        }
    });
});