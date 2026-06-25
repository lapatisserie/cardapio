const prices = {
    base: {
        Tradicional: { PP: 50, P: 105, M: 170, G: 220, GG: 280 },
        Especial: { PP: 55, P: 115, M: 185, G: 240, GG: 300 },
        Premium: { PP: 0, P: 145, M: 220, G: 320, GG: 380 } // PP has no premium
    },
    perguntas: {
        mais_cor: { PP: 8, P: 8, M: 8, G: 12, GG: 12 },
        detalhes_artesanais: { PP: 10, P: 10, M: 10, G: 15, GG: 15 }
    },
    combos: {
        morango_e_brigadeiro: { PP: 20, P: 20, M: 25, G: 35, GG: 35 }
    },
    adicionais: {
        "Formato de Coração": { PP: 10, P: 10, M: 10, G: 20, GG: 20 },
        "Vintage Cake": { PP: 20, P: 20, M: 20, G: 30, GG: 30 },
        "Cobertura de Brigadeiro": { PP: 20, P: 20, M: 25, G: 35, GG: 35 },
        "Pó prata ou dourado": { PP: 10, P: 10, M: 15, G: 20, GG: 20 },
        "Crocante": { PP: 15, P: 15, M: 20, G: 30, GG: 30 },
        "Morango ou Cereja": { PP: 15, P: 15, M: 20, G: 30, GG: 30 },
        "Brigadeiro no topo": { PP: 15, P: 15, M: 20, G: 30, GG: 30 },
        "Granulados": { PP: 10, P: 10, M: 15, G: 20, GG: 20 },
        "Geleia de morango": { PP: 15, P: 15, M: 20, G: 30, GG: 30 },
        "Geleia de frutos vermelhos": { PP: 25, P: 25, M: 30, G: 40, GG: 40 },
    },
    andar: {
        "4kg-Trad": 350,
        "4kg-Esp": 400,
        "5kg-Trad": 430,
        "5kg-Esp": 490,
        "Falso-M-Trad": 200,
        "Falso-M-Esp": 215,
        "Falso-G-Trad": 270,
        "Falso-G-Esp": 290
    }
};

let cart = [];

function openModal(modalId) {
    const modalEl = document.getElementById(modalId + '-modal');
    modalEl.style.display = 'block';
    modalEl.scrollTo({ top: 0 });
    
    if(modalId === 'custom-cake') {
        renderAdicionais();
        updateCakePrice();
    } else if(modalId === 'andar') {
        renderAndarAdicionais();
        updateAndarPrice();
    } else if(modalId === 'doces') {
        updateDocesPrice();
    }
}

function loadPopularTemplate(template) {
    closeModal('populares-modal');
    openModal('custom-cake');
    
    // Reset form to clear previous selections (this also resets size to PP)
    document.getElementById('cake-form').reset();
    
    // Uncheck all filling checkboxes manually just in case
    document.querySelectorAll('input[name="recheio"]').forEach(cb => cb.checked = false);
    
    if (template === 'red-velvet') {
        document.querySelector('input[name="cakeType"][value="Naked Cake"]').checked = true;
        // Premium fillings are not allowed on PP, so we bump the default size to P for this template
        document.querySelector('input[name="size"][value="P"]').checked = true; 
        document.querySelector('input[name="massa"][value="Red Velvet"]').checked = true;
        
        const recheio = document.querySelector('input[name="recheio"][value="Cream cheese com frutas vermelhas"]');
        if (recheio) recheio.checked = true;
    } else if (template === 'vintage') {
        document.querySelector('input[name="cakeType"][value="Chantilly"]').checked = true;
        document.querySelector('input[name="size"][value="P"]').checked = true; 
        document.querySelector('input[name="massa"][value="Baunilha"]').checked = true;
        
        const recheio = document.querySelector('input[name="recheio"][value="Bem-casado"]');
        if (recheio) recheio.checked = true;
        
        document.querySelector('input[name="mais_cor"][value="Sim"]').checked = true;
        document.querySelector('input[name="detalhes_artesanais"][value="Sim"]').checked = true;
        
        const add = document.querySelector('input[name="adicional"][value="Vintage Cake"]');
        if (add) add.checked = true;
    }
    
    updateCakePrice();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openCartModal() {
    renderCart();
    document.getElementById('cart-modal').style.display = 'block';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ----------------- CUSTOM CAKE LOGIC -----------------

function renderAdicionais() {
    const container = document.getElementById('adicionais-container');
    container.innerHTML = '';
    for (const add in prices.adicionais) {
        container.innerHTML += `
            <label>
                <input type="checkbox" name="adicional" value="${add}" onchange="updateCakePrice()"> 
                ${add}
            </label>
        `;
    }
}

function handleRecheioLimit(checkbox) {
    const checked = document.querySelectorAll('input[name="recheio"]:checked');
    if (checked.length > 2) {
        checkbox.checked = false;
        scrollToError(checkbox, "Você pode escolher no máximo 2 sabores de recheio.");
        return;
    }
    
    // Check PP premium restriction
    const sizeEl = document.querySelector('input[name="size"]:checked');
    if (sizeEl && sizeEl.value === 'PP' && checkbox.dataset.category === 'Premium' && checkbox.checked) {
        checkbox.checked = false;
        scrollToError(checkbox, "Recheios Premium não estão disponíveis para o tamanho PP.");
        return;
    }

    updateCakePrice();
}

function getHighestRecheioCategory() {
    const checked = document.querySelectorAll('input[name="recheio"]:checked');
    if (checked.length === 0) return 'Tradicional'; // Default base price

    let highest = 'Tradicional';
    checked.forEach(cb => {
        const cat = cb.dataset.category;
        if (cat === 'Premium') highest = 'Premium';
        else if (cat === 'Especial' && highest !== 'Premium') highest = 'Especial';
    });
    return highest;
}

function calculateCakePrice() {
    const sizeEl = document.querySelector('input[name="size"]:checked');
    if (!sizeEl) return 0;
    const size = sizeEl.value;
    const recheioCategory = getHighestRecheioCategory();
    
    // If PP and somehow Premium is selected, fallback to Especial (handled in UI mostly)
    let finalCategory = recheioCategory;
    if (size === 'PP' && finalCategory === 'Premium') finalCategory = 'Especial';

    let total = prices.base[finalCategory][size];

    let hasMorangoCereja = false;
    let hasBrigadeiro = false;

    // Adicionais Checkboxes
    document.querySelectorAll('input[name="adicional"]:checked').forEach(cb => {
        const addName = cb.value;
        if (addName === "Morango ou Cereja") {
            hasMorangoCereja = true;
        } else if (addName === "Brigadeiro no topo") {
            hasBrigadeiro = true;
        } else {
            total += prices.adicionais[addName][size];
        }
    });

    if (hasMorangoCereja && hasBrigadeiro) {
        total += prices.combos.morango_e_brigadeiro[size];
    } else if (hasMorangoCereja) {
        total += prices.adicionais["Morango ou Cereja"][size];
    } else if (hasBrigadeiro) {
        total += prices.adicionais["Brigadeiro no topo"][size];
    }

    // Perguntas (Yes/No)
    const maisCor = document.querySelector('input[name="mais_cor"]:checked');
    if (maisCor && maisCor.value === 'Sim') {
        total += prices.perguntas.mais_cor[size];
    }
    
    const detalhesArtesanais = document.querySelector('input[name="detalhes_artesanais"]:checked');
    if (detalhesArtesanais && detalhesArtesanais.value === 'Sim') {
        total += prices.perguntas.detalhes_artesanais[size];
    }

    return total;
}

function checkCakeValidity() {
    const typeEl = document.querySelector('input[name="cakeType"]:checked');
    const sizeEl = document.querySelector('input[name="size"]:checked');
    const massaEl = document.querySelector('input[name="massa"]:checked');
    const maisCor = document.querySelector('input[name="mais_cor"]:checked');
    const detalhesArtesanais = document.querySelector('input[name="detalhes_artesanais"]:checked');
    const recheios = document.querySelectorAll('input[name="recheio"]:checked');
    
    const btn = document.getElementById('btn-add-cake');
    if (!btn) return;

    if (typeEl && sizeEl && massaEl && recheios.length > 0 && maisCor && detalhesArtesanais) {
        btn.classList.remove('btn-disabled');
    } else {
        btn.classList.add('btn-disabled');
    }
}

function updateCakePrice() {
    // Re-validate Premium with PP
    const sizeEl = document.querySelector('input[name="size"]:checked');
    if(sizeEl && sizeEl.value === 'PP') {
        const premiums = document.querySelectorAll('input[name="recheio"][data-category="Premium"]:checked');
        if(premiums.length > 0) {
            scrollToError('size', "Tamanho PP selecionado. Recheios Premium foram desmarcados.");
            premiums.forEach(p => p.checked = false);
        }
    }

    const price = calculateCakePrice();
    document.getElementById('cake-live-price').innerText = `R$ ${price.toFixed(2).replace('.', ',')}`;
    checkCakeValidity();
}

// Helper: scroll to the first missing required field inside the modal
let lastErrorField = null;
let errorCount = 0;

function scrollToError(field, message) {
    let el;
    let fieldIdentifier;
    if (typeof field === 'string') {
        el = document.querySelector(`[name="${field}"]`) || document.querySelector(`[data-field="${field}"]`);
        fieldIdentifier = field;
    } else {
        el = field;
        fieldIdentifier = el.name || el.id || el.className || 'unknown_field';
    }

    if (lastErrorField === fieldIdentifier) {
        errorCount++;
    } else {
        lastErrorField = fieldIdentifier;
        errorCount = 1;
    }

    if (errorCount >= 3) {
        alert(message);
        errorCount = 0; // Reset after showing the alert
    }

    if (!el) return;

    // Walk up to the nearest .form-group
    const group = el.closest('.form-group') || el.parentElement;
    if (!group) return;

    // Remove any existing error message
    const existingMsg = group.querySelector('.field-error-msg');
    if (existingMsg) existingMsg.remove();

    // Add error class (triggers shake + outline)
    group.classList.remove('field-error'); // reset so animation re-triggers
    void group.offsetWidth;               // force reflow
    group.classList.add('field-error');

    // Add inline error message
    const msg = document.createElement('span');
    msg.className = 'field-error-msg';
    msg.textContent = message;
    group.appendChild(msg);

    // Scroll the modal to bring the group into view
    const modal = group.closest('.modal');
    if (modal) {
        const groupTop = group.getBoundingClientRect().top
                       - modal.getBoundingClientRect().top
                       + modal.scrollTop
                       - 20; // small offset so label isn't right at the edge
        modal.scrollTo({ top: groupTop, behavior: 'smooth' });
    }

    // Clear error state when the user interacts with this group
    const clearError = () => {
        group.classList.add('fading');
        if (msg) msg.classList.add('fading');
        setTimeout(() => {
            group.classList.remove('field-error', 'fading');
            if (msg && msg.parentNode) msg.remove();
        }, 500); // 0.5s transition
        group.removeEventListener('change', clearError);
        group.removeEventListener('input', clearError);
    };
    group.addEventListener('change', clearError);
    group.addEventListener('input', clearError);
}

function addCakeToCart() {
    const typeEl = document.querySelector('input[name="cakeType"]:checked');
    const sizeEl = document.querySelector('input[name="size"]:checked');
    const massaEl = document.querySelector('input[name="massa"]:checked');
    const maisCor = document.querySelector('input[name="mais_cor"]:checked');
    const detalhesArtesanais = document.querySelector('input[name="detalhes_artesanais"]:checked');

    if (!typeEl) {
        scrollToError('cakeType', '⚠ Por favor, selecione o tipo de bolo.');
        return;
    }
    if (!sizeEl) {
        scrollToError('size', '⚠ Por favor, selecione o tamanho do bolo.');
        return;
    }
    if (!massaEl) {
        scrollToError('massa', '⚠ Por favor, selecione a massa do bolo.');
        return;
    }
    const recheios = Array.from(document.querySelectorAll('input[name="recheio"]:checked')).map(cb => cb.value);
    if (recheios.length === 0) {
        scrollToError('recheio', '⚠ Por favor, selecione pelo menos 1 recheio.');
        return;
    }
    if (!maisCor) {
        scrollToError('mais_cor', '⚠ Por favor, responda se o bolo terá mais de uma cor.');
        return;
    }
    if (!detalhesArtesanais) {
        scrollToError('detalhes_artesanais', '⚠ Por favor, responda se o bolo terá detalhes artesanais.');
        return;
    }

    const type = typeEl.value;
    const size = sizeEl.value;
    const massa = massaEl.value;

    const adicionais = Array.from(document.querySelectorAll('input[name="adicional"]:checked')).map(cb => cb.value);
    
    if (maisCor.value === 'Sim') adicionais.push('Mais de uma cor');
    if (detalhesArtesanais.value === 'Sim') adicionais.push('Detalhes Artesanais');

    const obs = document.getElementById('cake-obs').value;
    const price = calculateCakePrice();

    const item = {
        id: Date.now(),
        type: 'Bolo Personalizado',
        title: `${type} - Tamanho ${size}`,
        tamanho: size,
        massa: massa,
        recheio: recheios.join(', '),
        adicionais: adicionais.length ? adicionais.join(', ') : '',
        obs: obs,
        details: `Massa: ${massa} | Recheios: ${recheios.join(', ')} ${adicionais.length ? '| Adicionais: ' + adicionais.join(', ') : ''} ${obs ? '| Obs: ' + obs : ''}`,
        price: price
    };

    cart.push(item);
    updateCartUI();
    closeModal('custom-cake-modal');
    document.getElementById('cake-form').reset();
    updateCakePrice();
}

// ----------------- BOLO ANDAR LOGIC -----------------
function renderAndarAdicionais() {
    const container = document.getElementById('andar-adicionais-container');
    if(!container) return;
    container.innerHTML = '';
    for (const add in prices.adicionais) {
        container.innerHTML += `
            <label>
                <input type="checkbox" name="andar_adicional" value="${add}" onchange="updateAndarPrice()"> 
                ${add}
            </label>
        `;
    }
}

function checkAndarValidity() {
    const sizeEl = document.querySelector('input[name="andar_size"]:checked');
    const massaEl = document.querySelector('input[name="andar_massa"]:checked');
    const recheios = document.querySelectorAll('input[name="andar_recheio"]:checked');
    
    const btn = document.getElementById('btn-add-andar');
    if (!btn) return;

    if (sizeEl && massaEl && recheios.length > 0) {
        btn.classList.remove('btn-disabled');
    } else {
        btn.classList.add('btn-disabled');
    }
}

function updateAndarPrice() {
    const sizeEl = document.querySelector('input[name="andar_size"]:checked');
    if (!sizeEl) {
        document.getElementById('andar-live-price').innerText = `R$ 0,00`;
        checkAndarValidity();
        return;
    }
    
    const size = sizeEl.value; // "4kg", "5kg", "Falso M", "Falso G"
    let category = "Trad";
    
    // Check if any Especial filling is selected
    const especiais = document.querySelectorAll('input[name="andar_recheio"][data-category="Especial"]:checked');
    if (especiais.length > 0) {
        category = "Esp";
    }
    
    const key = `${size.replace(' ', '-')}-${category}`;
    let price = prices.andar[key] || 0;

    // Map Bolo de Andar size to Custom Cake size for adicionais pricing
    let mappedSize = "GG";
    if (size === "Falso M") mappedSize = "M";
    if (size === "Falso G") mappedSize = "G";
    
    let hasMorangoCereja = false;
    let hasBrigadeiro = false;

    // Adicionais Checkboxes
    document.querySelectorAll('input[name="andar_adicional"]:checked').forEach(cb => {
        const addName = cb.value;
        if (addName === "Morango ou Cereja") {
            hasMorangoCereja = true;
        } else if (addName === "Brigadeiro no topo") {
            hasBrigadeiro = true;
        } else {
            price += prices.adicionais[addName][mappedSize];
        }
    });

    if (hasMorangoCereja && hasBrigadeiro) {
        price += prices.combos.morango_e_brigadeiro[mappedSize];
    } else if (hasMorangoCereja) {
        price += prices.adicionais["Morango ou Cereja"][mappedSize];
    } else if (hasBrigadeiro) {
        price += prices.adicionais["Brigadeiro no topo"][mappedSize];
    }
    
    document.getElementById('andar-live-price').innerText = `R$ ${price.toFixed(2).replace('.', ',')}`;
    checkAndarValidity();
}

function handleAndarRecheio(checkbox) {
    const checked = document.querySelectorAll('input[name="andar_recheio"]:checked');
    if (checked.length > 2) {
        scrollToError(checkbox, "Você pode escolher no máximo 2 recheios.");
        checkbox.checked = false;
    }
    updateAndarPrice();
}

function addAndarToCart() {
    const sizeEl = document.querySelector('input[name="andar_size"]:checked');
    const massaEl = document.querySelector('input[name="andar_massa"]:checked');
    const recheios = Array.from(document.querySelectorAll('input[name="andar_recheio"]:checked'));
    
    if (!sizeEl) {
        scrollToError('andar_size', '⚠ Selecione o tamanho.');
        return;
    }
    if (!massaEl) {
        scrollToError('andar_massa', '⚠ Selecione a massa.');
        return;
    }
    if (recheios.length === 0) {
        scrollToError('andar_recheio', '⚠ Selecione pelo menos 1 recheio.');
        return;
    }
    
    const size = sizeEl.value;
    const massa = massaEl.value;
    const recheiosText = recheios.map(cb => cb.value).join(', ');
    const adicionais = Array.from(document.querySelectorAll('input[name="andar_adicional"]:checked')).map(cb => cb.value);
    const obs = document.getElementById('andar-obs').value;
    
    let category = "Trad";
    if (document.querySelectorAll('input[name="andar_recheio"][data-category="Especial"]:checked').length > 0) {
        category = "Esp";
    }
    
    // Recalculate full price via updateAndarPrice logic to be safe, or just parse the displayed price
    const livePriceText = document.getElementById('andar-live-price').innerText.replace('R$ ', '').replace(',', '.');
    const price = parseFloat(livePriceText);

    cart.push({
        id: Date.now(),
        type: 'Bolo de Andar',
        title: `Bolo de Andar ${size} (${category === 'Esp' ? 'Especial' : 'Tradicional'})`,
        tamanho: size,
        massa: massa,
        recheio: recheiosText,
        adicionais: adicionais.length ? adicionais.join(', ') : '',
        obs: obs,
        details: `Massa: ${massa} | Recheios: ${recheiosText} ${adicionais.length ? '| Adicionais: ' + adicionais.join(', ') : ''} ${obs ? '| Obs: ' + obs : ''}`,
        price: price
    });

    updateCartUI();
    closeModal('andar-modal');
    document.getElementById('andar-form').reset();
    updateAndarPrice();
}

// ----------------- DOCES LOGIC -----------------
function updateDoceCardPrice(inputElement) {
    const card = inputElement.closest('.doce-product-card');
    const pricePerUnit = parseFloat(card.dataset.price);
    const minQty = parseInt(card.dataset.min);
    
    let qty = parseInt(card.querySelector('.doce-qty').value) || 0;
    
    // Show total
    const total = qty * pricePerUnit;
    const totalElement = card.querySelector('.doce-total');
    if (card.dataset.category === 'Modelagens tematicas') {
        totalElement.innerText = `Total (Base): R$ ${total.toFixed(2).replace('.', ',')}`;
    } else {
        totalElement.innerText = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
    }
}

function addDoceCardToCart(buttonElement) {
    const card = buttonElement.closest('.doce-product-card');
    
    const category = card.dataset.category;
    const pricePerUnit = parseFloat(card.dataset.price);
    const minQty = parseInt(card.dataset.min);
    const title = card.dataset.title;
    
    const qtyInput = card.querySelector('.doce-qty');
    const qty = parseInt(qtyInput.value) || 0;
    const obsInput = card.querySelector('.doce-obs');
    const obs = obsInput ? obsInput.value : '';
    
    if (obsInput && !obs) {
        scrollToError(obsInput, "Por favor, escolha ou digite o sabor/detalhe do doce.");
        return;
    }
    
    const customTextInput = card.querySelector('.doce-custom-text');
    const customText = customTextInput ? customTextInput.value : '';

    if (qty < minQty) {
        qtyInput.value = minQty;
        scrollToError(qtyInput, `A quantidade mínima para esta categoria é ${minQty} unidades.`);
        updateDoceCardPrice(qtyInput);
        return;
    }

    const price = qty * pricePerUnit;
    
    let detailsText = obs ? `Detalhes/Sabores: ${obs}` : 'Sem detalhes específicos';
    if (customText) {
        detailsText += ` | Texto/Inicial: ${customText}`;
    }

    cart.push({
        id: Date.now(),
        type: 'Doces',
        title: `${qty}x ${title}`,
        details: detailsText,
        price: price
    });

    updateCartUI();
    
    // Show success message inside the card instead of closing the modal
    const successMsg = card.querySelector('.doce-success-msg');
    const addBtn = card.querySelector('.btn-add-sm');
    
    addBtn.style.display = 'none';
    successMsg.style.display = 'flex';
    
    setTimeout(() => {
        addBtn.style.display = 'block';
        successMsg.style.display = 'none';
    }, 2000);

    // Reset card inputs
    qtyInput.value = minQty;
    if (obsInput) obsInput.value = '';
    if (customTextInput) customTextInput.value = '';
    updateDoceCardPrice(qtyInput);
}

// ----------------- CART LOGIC -----------------
function updateCartUI() {
    const bar = document.getElementById('cart-bar');
    if (cart.length > 0) {
        bar.classList.remove('hidden');
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('cart-count').innerText = `${cart.length} item(s)`;
        document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    } else {
        bar.classList.add('hidden');
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        cart.forEach(item => {
            total += item.price;
            container.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-details">${item.details}</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remover</button>
                </div>
            `;
        });
    }

    document.getElementById('cart-subtotal').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-final-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    renderCart();
}

function checkDateWarning() {
    const dateVal = document.getElementById('pickup-date').value;
    const warningEl = document.getElementById('date-warning');
    if(!dateVal) {
        warningEl.style.display = 'none';
        return;
    }
    
    // Safely parse date ignoring local timezone offset issues
    const pickupDate = new Date(dateVal + 'T00:00:00');
    
    // Bloquear Domingos (0)
    if (pickupDate.getDay() === 0) {
        document.getElementById('pickup-date').value = '';
        scrollToError('pickup-date', "Não realizamos entregas ou retiradas aos domingos. Por favor, escolha outra data.");
        warningEl.style.display = 'none';
        return;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = pickupDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays >= 0 && diffDays < 3) {
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
    }
}

function checkoutWhatsapp() {
    if(cart.length === 0) {
        scrollToError(document.querySelector('.btn-whatsapp'), "Seu carrinho está vazio.");
        return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const date = document.getElementById('pickup-date').value;
    const time = document.getElementById('pickup-time').value;
    const payment = document.getElementById('payment-method').value;

    if(!name) {
        scrollToError('customer-name', '⚠ Por favor, preencha o seu nome.');
        return;
    }
    if(!date) {
        scrollToError('pickup-date', '⚠ Por favor, escolha a data de retirada.');
        return;
    }
    if(!time) {
        scrollToError('pickup-time', '⚠ Por favor, escolha o horário de retirada.');
        return;
    }
    if(!payment) {
        scrollToError('payment-method', '⚠ Por favor, selecione a forma de pagamento.');
        return;
    }

    // Check date valid (at least today)
    const pickupDate = new Date(date + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if(pickupDate < today) {
        scrollToError('pickup-date', '⚠ A data não pode estar no passado.');
        return;
    }
    
    if(pickupDate.getDay() === 0) {
        scrollToError('pickup-date', '⚠ Não abrimos aos domingos. Escolha outra data.');
        return;
    }

    // Time validation
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Limits
    const startMins = 10 * 60; // 10:00
    const endWeekdayMins = 17 * 60; // 17:00
    const endSaturdayMins = 14 * 60; // 14:00
    
    const dayOfWeek = pickupDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Segunda a Sexta
        if (totalMinutes < startMins || totalMinutes > endWeekdayMins) {
            scrollToError('pickup-time', '⚠ Horário de segunda a sexta é das 10:00 às 17:00.');
            return;
        }
    } else if (dayOfWeek === 6) { // Sábado
        if (totalMinutes < startMins || totalMinutes > endSaturdayMins) {
            scrollToError('pickup-time', '⚠ Horário aos sábados é das 10:00 às 14:00.');
            return;
        }
    }

    // Format date nicely
    const dateArr = date.split('-');
    const formattedDate = `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;

    // Build Message
    let msg = `Registro da Encomenda\n\n`;
    msg += `Nome: ${name}\n\n`;
    msg += `Retirada\n`;
    msg += `Data: ${formattedDate}\n`;
    msg += `Horário: ${time}\n\n`;

    let otherItems = '';
    let total = 0;
    let hasCustomCake = false;

    cart.forEach((item, index) => {
        total += item.price;
        if ((item.type === 'Bolo Personalizado' || item.type === 'Bolo de Andar') && !hasCustomCake) {
            hasCustomCake = true;
            msg += `Detalhes do bolo\n`;
            if (item.type === 'Bolo de Andar') msg += `Tipo: ${item.title}\n`;
            msg += `Tamanho: ${item.tamanho}\n`;
            msg += `Massa: ${item.massa}\n`;
            msg += `Recheio: ${item.recheio}\n\n`;
            
            if (item.adicionais || item.obs) {
                msg += `Extras do Bolo:\n`;
                if (item.adicionais) msg += `- Adicionais: ${item.adicionais}\n`;
                if (item.obs) msg += `- Obs: ${item.obs}\n`;
                msg += `\n`;
            }
        } else if ((item.type === 'Bolo Personalizado' || item.type === 'Bolo de Andar') && hasCustomCake) {
            // Second custom cake
            otherItems += `${item.type} 2\n`;
            otherItems += `Tamanho: ${item.tamanho} | Massa: ${item.massa} | Recheio: ${item.recheio}\n`;
            if (item.adicionais) otherItems += `Adicionais: ${item.adicionais}\n`;
            if (item.obs) otherItems += `Obs: ${item.obs}\n\n`;
        } else {
            otherItems += `${item.title}\n`;
            otherItems += `Detalhes: ${item.details}\n\n`;
        }
    });

    if (otherItems) {
        msg += `Outros Itens:\n${otherItems}`;
    }

    msg += `Valor Total: R$ ${total.toFixed(2).replace('.', ',')}\n\n`;
    msg += `Forma de pagamento: ${payment}`;

    const encodedMsg = encodeURIComponent(msg);
    const phone = "558187140549"; // Updated WhatsApp number
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
}
