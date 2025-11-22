/**
 * Mock API Service
 * Simulates backend interactions for User Authentication, Profile Data, and Cart Management.
 * Uses localStorage to persist data across page reloads.
 */

const ApiService = {
    // Simulate network delay
    _delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    // --- Authentication ---

    async login(email, password) {
        await this._delay();
        // Mock validation
        if (email && password) {
            const user = {
                id: 'u_' + Math.random().toString(36).substr(2, 9),
                name: 'عبد الصمد', // Mock Name
                email: email,
                avatar: null,
                token: 'mock_jwt_token_' + Date.now()
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    },

    async register(name, email, password) {
        await this._delay();
        const user = {
            id: 'u_' + Math.random().toString(36).substr(2, 9),
            name: name,
            email: email,
            avatar: null,
            token: 'mock_jwt_token_' + Date.now()
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
    },

    async logout() {
        await this._delay(200);
        localStorage.removeItem('currentUser');
        return { success: true };
    },

    async getCurrentUser() {
        await this._delay(200);
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    // --- Profile & Orders ---

    async getProfile() {
        await this._delay();
        const user = await this.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        // Mock extended profile data
        return {
            ...user,
            stats: {
                orders: 5,
                favorites: 12,
                balance: 0
            },
            addresses: [
                { id: 1, title: 'المنزل', details: 'الرياض، حي الملقا، شارع 15' }
            ]
        };
    },

    async getOrders() {
        await this._delay();
        // Mock Orders Data
        return [
            {
                id: '#10234',
                date: '2023-11-15',
                status: 'delivered', // delivered, processing, cancelled
                statusText: 'تم التوصيل',
                total: 450,
                items: [
                    { name: 'عسل السدر الفاخر', quantity: 2, price: 225 }
                ]
            },
            {
                id: '#10235',
                date: '2023-11-20',
                status: 'processing',
                statusText: 'قيد التجهيز',
                total: 120,
                items: [
                    { name: 'عسل الزهور البرية', quantity: 1, price: 120 }
                ]
            },
            {
                id: '#10236',
                date: '2023-11-22',
                status: 'shipped',
                statusText: 'تم الشحن',
                total: 850,
                items: [
                    { name: 'عسل المانوكا', quantity: 1, price: 850 }
                ]
            }
        ];
    },

    // --- Cart ---

    async getCart() {
        await this._delay(300);
        const cartStr = localStorage.getItem('shoppingCart');
        return cartStr ? JSON.parse(cartStr) : [];
    },

    async addToCart(product) {
        await this._delay(200);
        let cart = await this.getCart();
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        return cart;
    },

    async removeFromCart(productId) {
        await this._delay(200);
        let cart = await this.getCart();
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        return cart;
    },

    async updateCartQuantity(productId, change) {
        await this._delay(200);
        let cart = await this.getCart();
        const item = cart.find(item => item.id === productId);

        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId);
            }
        }

        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        return cart;
    },

    async clearCart() {
        await this._delay(200);
        localStorage.removeItem('shoppingCart');
        return [];
    }
};

// Export for module usage, or attach to window for simple script inclusion
window.ApiService = ApiService;
