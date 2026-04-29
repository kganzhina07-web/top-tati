// === ДАННЫЕ ===
const bouquets = [
    { id: 1, name: "Лунная соната", desc: "Эустома, маттиола, гипсофила", price: 4350, image: "https://images.pexels.com/photos/1083822/pexels-photo-1083822.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 2, name: "Изумрудный мох", desc: "Хризантемы, эвкалипт", price: 5200, image: "https://images.pexels.com/photos/858353/pexels-photo-858353.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 3, name: "Полночный сад", desc: "Тёмные розы, гортензия", price: 5980, image: "https://images.pexels.com/photos/1142820/pexels-photo-1142820.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 4, name: "Нежный беж", desc: "Пионы, лаванда, фрезии", price: 4850, image: "https://images.pexels.com/photos/736532/pexels-photo-736532.jpeg?auto=compress&cs=tinysrgb&w=600" },
    { id: 5, name: "Мшистый лес", desc: "Зелень, герберы, анемоны", price: 5620, image: "https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=600" }
];

const gifts = [
    { id: 101, name: "Элитный шоколад", price: 1890, image: "https://placehold.co/600x500/839958/F7F4D5?text=Chocolate", category: "chocolate" },
    { id: 102, name: "Свеча Мшистый аромат", price: 1350, image: "https://placehold.co/600x500/839958/F7F4D5?text=Candle", category: "candle" },
    { id: 103, name: "Открытка с гербарием", price: 290, image: "https://placehold.co/600x500/839958/F7F4D5?text=Card", category: "card" },
    { id: 104, name: "Набор шаров 5 шт", price: 990, image: "https://placehold.co/600x500/839958/F7F4D5?text=Balloons", category: "balloon" },
    { id: 105, name: "Праздничный бокс", price: 3250, image: "https://placehold.co/600x500/839958/F7F4D5?text=Gift+Set", category: "holiday" },
    { id: 106, name: "Трюфели ручной работы", price: 2250, image: "https://placehold.co/600x500/839958/F7F4D5?text=Truffles", category: "chocolate" }
];

// === СОСТОЯНИЕ ===
let cart = JSON.parse(localStorage.getItem('tatiCart')) || [];
let discountPercent = 0;
let selectedSavedCard = null;
let notificationTimeout = null;

const promoCodes = { 'WELCOME10': 10, 'MOON20': 20, 'FLOWER15': 15 };

// === ФУНКЦИИ КОРЗИНЫ ===
function saveCart() {
    localStorage.setItem('tatiCart', JSON.stringify(cart));
}

function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showNotification(`${name} добавлен в корзину`);
}

function removeFromCart(id) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    // Анимация удаления
    const itemEl = document.querySelector(`.cart-item:nth-child(${cart.indexOf(item) + 1})`);
    if (itemEl) {
        itemEl.classList.add('removing');
        setTimeout(() => {
            cart = cart.filter(item => item.id !== id);
            saveCart();
            updateCartUI();
        }, 200);
    } else {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartUI();
    }
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function getSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getDiscountAmount() {
    return getSubtotal() * discountPercent / 100;
}

function getDeliveryFee() {
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value;
    return deliveryMethod === 'delivery' ? 350 : 0;
}

function getFinalTotal() {
    return getSubtotal() - getDiscountAmount() + getDeliveryFee();
}

function updateCartUI() {
    const cartBody = document.getElementById('cartBody');
    const cartFooter = document.getElementById('cartFooter');
    const checkoutSection = document.getElementById('checkoutSection');
    const cartCount = document.getElementById('cartCount');

    if (cart.length === 0) {
        cartBody.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-bag" style="font-size: 3rem;" aria-hidden="true"></i><p>Ваша корзина пуста</p><button onclick="closeCart()" style="background: #0A3323; color: white; border: none; padding: 0.5rem 1.2rem; border-radius: 30px; margin-top: 1rem; cursor: pointer;">Продолжить покупки</button></div>';
        cartFooter.style.display = 'none';
        if (checkoutSection) checkoutSection.style.display = 'none';
        if (cartCount) cartCount.innerText = '0';
        return;
    }

    cartFooter.style.display = 'block';
    if (checkoutSection) checkoutSection.style.display = 'block';

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.innerText = totalItems;

    const itemsHtml = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-info">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-price">${item.price.toLocaleString()} ₽ / шт</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${item.id}, -1)" aria-label="Уменьшить количество">−</button>
                <span aria-live="polite">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" aria-label="Увеличить количество">+</button>
            </div>
            <div class="cart-item-total">${(item.price * item.quantity).toLocaleString()} ₽</div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Удалить ${escapeHtml(item.name)}"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>
        </div>
    `).join('');

    cartBody.innerHTML = `<div class="cart-items">${itemsHtml}</div>`;
    updateTotals();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateTotals() {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const delivery = getDeliveryFee();
    const total = subtotal - discount + delivery;

    document.getElementById('cartSubtotal').innerHTML = subtotal.toLocaleString() + ' ₽';
    document.getElementById('cartTotal').innerHTML = total.toLocaleString() + ' ₽';
    document.getElementById('deliveryCost').innerHTML = delivery === 0 ? 'бесплатно' : delivery.toLocaleString() + ' ₽';

    if (discount > 0) {
        document.getElementById('discountLine').style.display = 'flex';
        document.getElementById('discountAmount').innerHTML = '-' + discount.toLocaleString() + ' ₽';
    } else {
        document.getElementById('discountLine').style.display = 'none';
    }
}

function updateDeliveryFields() {
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value;
    const addressGroup = document.getElementById('addressGroup');
    if (deliveryMethod === 'delivery') {
        addressGroup.style.display = 'block';
    } else {
        addressGroup.style.display = 'none';
    }
    updateTotals();
}

function togglePaymentFields() {
    const isNewCard = document.querySelector('input[name="payment"]:checked')?.value === 'new';
    document.getElementById('newCardBlock').style.display = isNewCard ? 'block' : 'none';
    document.getElementById('savedCardBlock').style.display = isNewCard ? 'none' : 'block';
}

function selectSavedCard(cardNumber) {
    selectedSavedCard = cardNumber;
    document.getElementById('selectedCardInfo').innerHTML = 'Выбрана карта: ' + escapeHtml(cardNumber);
    document.querySelectorAll('.saved-card').forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
        if (card.innerText.includes(cardNumber)) {
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');
        }
    });
}

function applyPromoCode() {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();
    const applyBtn = document.querySelector('.apply-promo');

    if (!code) {
        showNotification('Введите промокод');
        return;
    }

    if (promoCodes[code]) {
        discountPercent = promoCodes[code];
        applyBtn.disabled = true;
        applyBtn.textContent = '✓ Применено';
        showNotification(`Промокод ${code} активирован! Скидка ${discountPercent}%`);
        updateTotals();
        setTimeout(() => {
            applyBtn.disabled = false;
            applyBtn.textContent = 'Применить';
        }, 2000);
    } else {
        showNotification('Неверный промокод');
        input.value = '';
    }
}

function validateCardData() {
    const cardNum = document.getElementById('cardNumber')?.value.trim();
    const expiry = document.getElementById('cardExpiry')?.value.trim();
    const cvv = document.getElementById('cardCvv')?.value.trim();

    if (!/^\d{16,19}$/.test(cardNum.replace(/\s/g, ''))) {
        showNotification('Неверный номер карты');
        return false;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        showNotification('Неверный срок действия (ММ/ГГ)');
        return false;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
        showNotification('Неверный CVV');
        return false;
    }
    return true;
}

function processOrder() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }

    const deliveryMethod = document.querySelector('input[name="delivery"]:checked')?.value;
    const address = document.getElementById('addressInput')?.value.trim();

    if (deliveryMethod === 'delivery' && !address) {
        showNotification('Введите адрес доставки');
        document.getElementById('addressInput')?.focus();
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    let paymentInfo = '';

    if (paymentMethod === 'new') {
        if (!validateCardData()) return;
        const cardNum = document.getElementById('cardNumber').value.trim();
        paymentInfo = 'Карта ****' + cardNum.slice(-4);
    } else {
        if (!selectedSavedCard) {
            showNotification('Выберите сохранённую карту');
            return;
        }
        paymentInfo = selectedSavedCard;
    }

    const total = getFinalTotal();
    let orderSummary = '✅ ЗАКАЗ ОФОРМЛЕН!\n\n';
    orderSummary += '📦 Товары:\n' + cart.map(item => `  • ${item.name} x${item.quantity} = ${(item.price * item.quantity).toLocaleString()} ₽`).join('\n') + '\n\n';

    if (discountPercent > 0) orderSummary += `🎁 Скидка: ${discountPercent}% (-${getDiscountAmount().toLocaleString()} ₽)\n`;
    orderSummary += `🚚 Доставка: ${deliveryMethod === 'delivery' ? 'на дом (+350 ₽)' : 'самовывоз'}\n`;
    if (deliveryMethod === 'delivery') orderSummary += `📍 Адрес: ${address}\n`;
    orderSummary += `💳 Оплата: ${paymentInfo}\n`;
    orderSummary += `\n💰 ИТОГО: ${total.toLocaleString()} ₽\n\n`;
    orderSummary += 'Спасибо за покупку! Наш флорист свяжется с вами в ближайшее время. 🌸';

    alert(orderSummary);

    // Очистка
    cart = [];
    discountPercent = 0;
    selectedSavedCard = null;
    saveCart();

    // Сброс форм
    const promoInput = document.getElementById('promoInput');
    if (promoInput) promoInput.value = '';
    const addressInput = document.getElementById('addressInput');
    if (addressInput) addressInput.value = '';
    ['cardNumber', 'cardExpiry', 'cardCvv'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const cardInfo = document.getElementById('selectedCardInfo');
    if (cardInfo) cardInfo.innerHTML = '';

    // Сброс кнопок
    const applyBtn = document.querySelector('.apply-promo');
    if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Применить';
    }

    updateCartUI();
    closeCart();
}

function openCart() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('cart-open');
    updateCartUI();
    updateDeliveryFields();
    togglePaymentFields();
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('cart-open');
}

function showNotification(message) {
    // Удаляем предыдущее уведомление, если есть
    if (notificationTimeout) {
        const old = document.querySelector('.notification');
        if (old) old.remove();
        clearTimeout(notificationTimeout);
    }

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.setAttribute('role', 'alert');
    notif.textContent = message;
    document.body.appendChild(notif);

    notificationTimeout = setTimeout(() => {
        notif.remove();
        notificationTimeout = null;
    }, 2000);
}

// === ОТРИСОВКА СТРАНИЦ ===
let currentGiftFilter = "all";
let selectedFlowerId = bouquets[0]?.id;
let selectedGiftId = null;

function renderBouquets() {
    const grid = document.getElementById("bouquetsGrid");
    if (!grid) return;
    grid.innerHTML = bouquets.map(item => `
        <article class="product-card">
            <div class="card-img" style="background-image: url('${item.image}');" role="img" aria-label="${escapeHtml(item.name)}">
                <div class="curtain-overlay">
                    <button class="curtain-btn" onclick="addToCart(${item.id}, '${escapeHtml(item.name)}', ${item.price})" aria-label="Добавить ${escapeHtml(item.name)} в корзину">
                        <i class="fas fa-shopping-bag" aria-hidden="true"></i> В корзину
                    </button>
                </div>
            </div>
            <div class="card-info">
                <div class="product-title">${escapeHtml(item.name)}</div>
                <div class="product-price">${item.price.toLocaleString()} ₽</div>
            </div>
        </article>
    `).join("");
}

function renderGifts() {
    const grid = document.getElementById("giftsGrid");
    if (!grid) return;
    let filtered = currentGiftFilter === "all" ? gifts : gifts.filter(g => g.category === currentGiftFilter);
    if (!filtered.length) {
        grid.innerHTML = '<div class="not-found">Ничего не найдено в этой категории</div>';
        return;
    }
    grid.innerHTML = filtered.map(item => `
        <article class="product-card">
            <div class="card-img" style="background-image: url('${item.image}');" role="img" aria-label="${escapeHtml(item.name)}">
                <div class="curtain-overlay">
                    <button class="curtain-btn" onclick="addToCart(${item.id}, '${escapeHtml(item.name)}', ${item.price})" aria-label="Добавить ${escapeHtml(item.name)} в корзину">
                        <i class="fas fa-shopping-bag" aria-hidden="true"></i> В корзину
                    </button>
                </div>
            </div>
            <div class="card-info">
                <div class="product-title">${escapeHtml(item.name)}</div>
                <div class="product-price">${item.price.toLocaleString()} ₽</div>
            </div>
        </article>
    `).join("");
}

function updateConstructorUI() {
    const flowerContainer = document.getElementById("constructorFlowers");
    const giftContainer = document.getElementById("constructorGifts");
    if (!flowerContainer) return;

    flowerContainer.innerHTML = bouquets.map(f => `
        <div class="flower-option ${selectedFlowerId === f.id ? 'selected' : ''}" 
             data-id="${f.id}" 
             role="radio" 
             tabindex="0"
             aria-checked="${selectedFlowerId === f.id}"
             onclick="selectConstructorFlower(${f.id})">
            <span>${escapeHtml(f.name)}</span> <span>${f.price.toLocaleString()} ₽</span>
        </div>
    `).join("");

    giftContainer.innerHTML = `<div class="gift-option ${selectedGiftId === null ? 'selected' : ''}" data-id="none" role="radio" tabindex="0" aria-checked="${selectedGiftId === null}" onclick="selectConstructorGift(null)"><span>Без подарка</span><span>0 ₽</span></div>` +
        gifts.map(g => `
        <div class="gift-option ${selectedGiftId === g.id ? 'selected' : ''}" 
             data-id="${g.id}" 
             role="radio" 
             tabindex="0"
             aria-checked="${selectedGiftId === g.id}"
             onclick="selectConstructorGift(${g.id})">
            <span>${escapeHtml(g.name)}</span> <span>${g.price.toLocaleString()} ₽</span>
        </div>
    `).join("");

    const flower = bouquets.find(f => f.id === selectedFlowerId);
    const gift = gifts.find(g => g.id === selectedGiftId);
    const total = (flower?.price || 0) + (gift?.price || 0);

    document.getElementById("constructorTotal").innerText = total.toLocaleString() + " ₽";
    document.getElementById("constructorPreview").innerHTML =
        (flower?.name ? escapeHtml(flower.name) : "не выбран") +
        (gift ? ' + ' + escapeHtml(gift.name) : '');

    // Обработка клавиатуры для опций
    document.querySelectorAll(".flower-option, .gift-option").forEach(el => {
        el.addEventListener("keydown", (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                el.click();
            }
        });
    });
}

function selectConstructorFlower(id) {
    selectedFlowerId = id;
    updateConstructorUI();
}

function selectConstructorGift(id) {
    selectedGiftId = id;
    updateConstructorUI();
}

// === НАВИГАЦИЯ ===
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) targetPage.classList.add('active-page');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector('.nav-item[data-page="' + pageId + '"]');
    if (activeNav) activeNav.classList.add('active');

    if (pageId === 'bouquets') renderBouquets();
    if (pageId === 'gifts') renderGifts();
    if (pageId === 'constructor') updateConstructorUI();
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    // Навигация
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.addEventListener('click', () => {
            const page = nav.dataset.page;
            showPage(page);
        });
        nav.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                nav.click();
            }
        });
    });

    // Табы подарков
    document.querySelectorAll('.gift-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentGiftFilter = tab.dataset.cat;
            document.querySelectorAll('.gift-tab').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            renderGifts();
        });
    });

    // Кнопка конструктора
    document.getElementById("orderConstructorBtn")?.addEventListener("click", () => {
        const flower = bouquets.find(f => f.id === selectedFlowerId);
        const gift = gifts.find(g => g.id === selectedGiftId);
        const total = (flower?.price || 0) + (gift?.price || 0);

        if (!flower) {
            showNotification('Выберите цветы для букета');
            return;
        }

        const confirmOrder = confirm(`Собран букет: ${flower.name}${gift ? ' + ' + gift.name : ''}\nСтоимость: ${total.toLocaleString()} ₽\n\nДобавить в корзину?`);
        if (confirmOrder) {
            addToCart(flower.id, flower.name, flower.price);
            if (gift) addToCart(gift.id, gift.name, gift.price);
            showPage('bouquets');
        }
    });

    // Добавляем иконку корзины в меню
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.getElementById('cartNavItem')) {
        const cartNav = document.createElement('div');
        cartNav.className = 'nav-item';
        cartNav.id = 'cartNavItem';
        cartNav.setAttribute('role', 'button');
        cartNav.setAttribute('tabindex', '0');
        cartNav.innerHTML = '<i class="fas fa-shopping-cart" aria-hidden="true"></i> <span>Корзина</span> <span class="cart-badge" id="cartCount" aria-label="товаров в корзине">0</span>';
        cartNav.onclick = openCart;
        cartNav.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCart();
            }
        };
        navMenu.appendChild(cartNav);
    }

    // Закрытие модального окна по клику вне его
    document.getElementById('cartModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') closeCart();
    });

    // Закрытие по Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
        }
    });

    // Инициализация
    renderBouquets();
    renderGifts();
    updateConstructorUI();
    updateCartUI(); // Показываем актуальное количество в корзине при загрузке
});