import { store } from './state.js';
import { products } from './products-data.js';
import { renderPagination } from './pagination.js';
function getRandomProductImage() {
  const imgs = ['images/product-3.jpg', 'images/product-4.jpg'];
  return imgs[Math.floor(Math.random() * imgs.length)];
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Initialize Store
    store.setProducts(products);

    // Check URL parameters for filters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const filterParam = urlParams.get('filter');

    if (categoryParam) {
        store.setFilter('category', categoryParam);
    }
    
    if (filterParam === 'offers') {
        store.setFilter('offersOnly', true);
        // Update page title or UI if needed
        const sectionTitle = document.querySelector('.section-title h2');
        if (sectionTitle) sectionTitle.textContent = 'عروض خاصة';
    }

    // Dropdown Toggle Logic
    const dropdownToggles = document.querySelectorAll('.nav-item .nav-link');
    
    dropdownToggles.forEach(toggle => {
        if (toggle.nextElementSibling && toggle.nextElementSibling.classList.contains('dropdown-menu')) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const dropdownMenu = toggle.nextElementSibling;
                dropdownMenu.classList.toggle('show');
            });
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdowns = document.querySelectorAll('.dropdown-menu.show');
        dropdowns.forEach(dropdown => {
            if (!dropdown.parentElement.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    });

    // Subscribe to state changes
    store.subscribe(state => {
        updateCartUI(state);
        updateNotification(state);
        // Only update products if we are on a page that displays them
        if (document.getElementById('products-container')) {
            renderProducts();
        }
    });

    // Initial Render
    updateCartUI(store.state);
    if (document.getElementById('products-container')) {
        renderProducts();
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
    // The login/register buttons now navigate to account.html, so we don't need these listeners here.
    // Keeping the close logic just in case we use modals elsewhere, or removing if strictly not needed.
    // For now, removing the specific login/register button listeners to avoid errors if elements are missing.
    
    const closeBtns = document.querySelectorAll('.close-btn');
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

function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const { products: productsToRender } = store.getPaginatedProducts();

    if (productsToRender.length === 0) {
        container.innerHTML = '<div class="no-products">لا توجد منتجات تطابق بحثك</div>';
        renderPagination('pagination-container');
        return;
    }

    container.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
            <div class="product-img" onclick="openProductModal(${product.id})" style="cursor:pointer; background-image: url('${getRandomProductImage()}'); background-size:cover; background-position:center;"></div>
            <div class="product-info">
                <h3 onclick="openProductModal(${product.id})" style="cursor:pointer;">${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">
                    <div>
                        <span class="price">${product.price} ر.س</span>
                        ${product.oldPrice ? `<span class="old-price">${product.oldPrice} ر.س</span>` : ''}
                    </div>
                    <div class="rating">${generateStarRating(product.rating)}</div>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart" onclick="addToCart(${product.id})">أضف إلى السلة</button>
                    <button class="wishlist"><i class="far fa-heart"></i></button>
                </div>
            </div>
        </div>`).join('');

    renderPagination('pagination-container');
}

// Modal functions
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-description').textContent = product.description;
    document.getElementById('modal-price').textContent = `${product.price} ر.س`;
    // static images as requested
    const imgs = document.querySelectorAll('.modal-img');
    imgs.forEach((img, i) => {
        img.src = i % 2 === 1 ? 'images/product-4.jpg' : 'images/product-3.jpg';
    });
    document.getElementById('product-modal').classList.remove('hidden');
}
function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}
window.addToCartFromModal = () => {
    const title = document.getElementById('modal-title').textContent;
    const prod = products.find(p => p.name === title);
    if (prod) addToCart(prod.id);
    closeProductModal();
};

function updateCartUI(state) {
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
                <div style="width: 100%; height: 100%; background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${item.price} ر.س</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i> إزالة</button>
            </div>
        </div>`).join('');

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
