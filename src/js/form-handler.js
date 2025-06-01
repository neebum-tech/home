document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    
    if (!form) {
        console.error('Formulário não encontrado!');
        return;
    }
    
    // Detectar se estamos em localhost
    const isLocalhost = window.location.protocol === 'file:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
    
    if (isLocalhost && window.location.protocol === 'file:') {
        console.warn('⚠️ Formulário funcionando em modo básico. Para teste completo, use um servidor local.');
        // Em modo file://, deixa o formulário funcionar normalmente (sem AJAX)
        return; 
    }
    
    // Interceptar envio apenas se não for file://
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
        
        try {
            const formData = new FormData(form);
            
            console.log('📤 Enviando lead via Web3Forms...');
            
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showMessage('✅ Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
                form.reset();
                console.log('✅ Lead enviado com sucesso!');
            } else {
                throw new Error(result.message || 'Erro no envio');
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            
            // Fallback: submeter o formulário normalmente
            console.log('🔄 Tentando envio direto...');
            form.submit();
            return;
        }
        
        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
    
    function validateForm() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name || !email) {
            showMessage('⚠️ Por favor, preencha pelo menos o nome e e-mail.', 'warning');
            return false;
        }
        
        if (!isValidEmail(email)) {
            showMessage('❌ Por favor, insira um e-mail válido.', 'error');
            return false;
        }
        
        return true;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showMessage(message, type) {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) existingMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message form-message-${type}`;
        messageDiv.textContent = message;
        
        form.parentNode.insertBefore(messageDiv, form);
        
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
        }, 6000);
    }
});