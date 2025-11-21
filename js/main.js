import { store } from './state.js';
import { products } from './products-data.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Initialize Store
    store.setProducts(products);

    // Subscribe to state changes
    store.subscribe(state => {
        updateCartUI(state);
        updateNotification(state);
        // Only update products if we are on a page that displays them
        if (document.getElementById('products-container')) {
            renderProducts(store.getFilteredProducts());
        }
    });

    // Initial Render
    updateCartUI(store.state);
    if (document.getElementById('products-container')) {
        renderProducts(store.getFilteredProducts());
    }

    // Setup Global Event Listeners
    setupEventListeners();
    
    // Hide loading screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, 1000);
}

function setupEventListeners() {
    // Cart Toggles
    const cartBtn = document.getElementById('cart-btn');
    const closeCartBtn = document.querySelector('.close-cart');
    
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);

    // Search
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            store.setFilter('search', e.target.value);
        });
    }

    // Auth Modals (Simplified for now)
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeBtns = document.querySelectorAll('.close-btn');

    if (loginBtn) loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'flex';
    });

    if (registerBtn) registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'flex';
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.auth-container').forEach(c => c.style.display = 'none');
        });
    });

    // Expose functions to global scope for HTML onclick attributes
    window.addToCart = (id) => {
        const product = products.find(p => p.id === id);
        if (product) store.addToCart(product);
    };

    window.removeFromCart = (id) => store.removeFromCart(id);
    window.updateQuantity = (id, change) => store.updateCartQuantity(id, change);
    window.filterProducts = (category) => store.setFilter('category', category);
    window.checkout = () => alert('جاري تحويلك لصفحة الدفع...');
}

function renderProducts(productsToRender) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            <div class="product-img" onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor: pointer;">
                <i class="${product.image}"></i>
            </div>
            <div class="product-info">
                <h3 onclick="window.location.href='product-details.html?id=${product.id}'" style="cursor: pointer;">${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">
                    <div>
                        <span class="price">${product.price} ر.س</span>
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ر.س</span>` : ''}
                    </div>
                    <div class="rating">
                        ${generateStarRating(product.rating)}
                    </div>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        أضف إلى السلة
                    </button>
                    <button class="wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateCartUI(state) {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) cartCount.textContent = store.getCartCount();

    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    if (!cartItemsContainer) return;

    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">السلة فارغة</p>';
        if (subtotalEl) subtotalEl.textContent = '0 ر.س';
        if (shippingEl) shippingEl.textContent = '0 ر.س';
        if (totalEl) totalEl.textContent = '0 ر.س';
        return;
    }

    cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img">
                <i class="${item.image}"></i>
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${item.price} ر.س</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i> إزالة
                </button>
            </div>
        </div>
    `).join('');

    const subtotal = store.getCartTotal();
    const shipping = subtotal > 200 ? 0 : 25;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `${subtotal} ر.س`;
    if (shippingEl) shippingEl.textContent = `${shipping} ر.س`;
    if (totalEl) totalEl.textContent = `${total} ر.س`;
}

function updateNotification(state) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (!notification || !notificationText) return;

    if (state.error) {
        notification.className = 'notification error show';
        notificationText.textContent = state.error;
    } else if (state.loading) {
        // Handle loading state if needed
    } else {
        // Check if we just added to cart (this logic is a bit simplified, ideally we'd have a specific event)
        // For now, let's just hide it if no error
        // notification.classList.remove('show');
    }
}

// Helper Functions
function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}
