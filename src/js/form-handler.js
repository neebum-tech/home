document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    
    // URL do Google Apps Script (SUBSTITUA pela sua URL após deploy)
    const APPS_SCRIPT_URL = 'COLE_AQUI_SUA_URL_DO_APPS_SCRIPT';
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // UI Loading
        const submitBtn = document.querySelector('.submit-button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        
        // Coleta dados
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim()
        };
        
        // Validação
        if (!formData.name || !formData.email || !formData.message) {
            showMessage('❌ Por favor, preencha todos os campos obrigatórios.', 'error');
            restoreButton(submitBtn, originalText);
            return;
        }
        
        if (!isValidEmail(formData.email)) {
            showMessage('❌ Por favor, insira um email válido.', 'error');
            restoreButton(submitBtn, originalText);
            return;
        }
        
        try {
            console.log('📤 Enviando lead para Google Sheets...');
            
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            console.log('📥 Resposta recebida:', result);
            
            if (result.success) {
                showMessage('✅ Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
                form.reset();
                
                // Analytics
                trackEvent('generate_lead', 'success', formData.name);
                
                console.log('✅ Lead salvo com ID:', result.leadId);
                
            } else {
                throw new Error(result.error || 'Erro desconhecido no servidor');
            }
            
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            
            // Backup local
            saveToLocalStorage(formData);
            showMessage('⚠️ Erro no envio. Dados salvos localmente. Entraremos em contato!', 'warning');
            
            trackEvent('form_error', 'google_sheets_failed', error.message);
        }
        
        restoreButton(submitBtn, originalText);
    });
    
    // Funções auxiliares
    function restoreButton(button, text) {
        button.textContent = text;
        button.disabled = false;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function saveToLocalStorage(data) {
        try {
            let leads = JSON.parse(localStorage.getItem('neebum-leads') || '[]');
            leads.push({
                ...data,
                id: Date.now(),
                timestamp: new Date().toLocaleString('pt-BR'),
                status: 'backup_local'
            });
            localStorage.setItem('neebum-leads', JSON.stringify(leads));
            console.log('💾 Backup local salvo. Total:', leads.length);
        } catch (error) {
            console.error('❌ Erro ao salvar backup:', error);
        }
    }
    
    function showMessage(message, type = 'success') {
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) existingMessage.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message form-message-${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
        
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
        }, 8000);
    }
    
    function trackEvent(action, category, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
        
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead');
        }
    }
});

// Função para exportar backup local
function exportLocalLeads() {
    const leads = JSON.parse(localStorage.getItem('neebum-leads') || '[]');
    
    if (leads.length === 0) {
        alert('Nenhum lead encontrado no backup local!');
        return;
    }
    
    const csvHeader = 'Data/Hora,Nome,Email,Telefone,Mensagem,Status\n';
    const csvRows = leads.map(lead => 
        `"${lead.timestamp}","${lead.name}","${lead.email}","${lead.phone || 'Não informado'}","${lead.message.replace(/"/g, '""')}","${lead.status || 'local'}"`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `neebum-leads-backup-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ ${leads.length} leads exportados!`);
}

function clearLocalBackup() {
    if (confirm('Tem certeza que deseja limpar o backup local?')) {
        localStorage.removeItem('neebum-leads');
        alert('✅ Backup local limpo!');
    }
}