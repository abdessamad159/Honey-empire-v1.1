class Store {
    constructor() {
        this.state = {
            products: [],
            cart: JSON.parse(localStorage.getItem('honeyEmpireCart')) || [],
            user: JSON.parse(localStorage.getItem('honeyEmpireUser')) || null,
            filters: {
                category: null,
                search: '',
                priceRange: { min: 0, max: 1000 },
                minRating: 0
            },
            loading: false,
            error: null
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
        this.persist();
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    persist() {
        localStorage.setItem('honeyEmpireCart', JSON.stringify(this.state.cart));
        if (this.state.user) {
            localStorage.setItem('honeyEmpireUser', JSON.stringify(this.state.user));
        } else {
            localStorage.removeItem('honeyEmpireUser');
        }
    }

    // Actions
    setProducts(products) {
        this.setState({ products });
    }

    addToCart(product) {
        const existingItem = this.state.cart.find(item => item.id === product.id);
        let newCart;

        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                newCart = this.state.cart.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                this.setError('الكمية المتاحة غير كافية');
                return;
            }
        } else {
            newCart = [...this.state.cart, { ...product, quantity: 1 }];
        }

        this.setState({ cart: newCart });
        this.setError(null); // Clear error on success
    }

    removeFromCart(productId) {
        const newCart = this.state.cart.filter(item => item.id !== productId);
        this.setState({ cart: newCart });
    }

    updateCartQuantity(productId, change) {
        const item = this.state.cart.find(item => item.id === productId);
        if (!item) return;

        const newQuantity = item.quantity + change;
        
        if (newQuantity > 0 && newQuantity <= item.stock) {
            const newCart = this.state.cart.map(item => 
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );
            this.setState({ cart: newCart });
        } else if (newQuantity === 0) {
            this.removeFromCart(productId);
        } else {
            this.setError('الكمية المتاحة غير كافية');
        }
    }

    setFilter(filterType, value) {
        this.setState({
            filters: {
                ...this.state.filters,
                [filterType]: value
            }
        });
    }

    login(user) {
        this.setState({ user });
    }

    logout() {
        this.setState({ user: null });
    }

    setLoading(loading) {
        this.setState({ loading });
    }

    setError(error) {
        this.setState({ error });
        // Auto-clear error after 3 seconds
        if (error) {
            setTimeout(() => {
                this.setState({ error: null });
            }, 3000);
        }
    }

    // Selectors
    getFilteredProducts() {
        return this.state.products.filter(product => {
            const matchesCategory = !this.state.filters.category || product.category === this.state.filters.category;
            const matchesSearch = !this.state.filters.search || 
                product.name.includes(this.state.filters.search) || 
                product.description.includes(this.state.filters.search);
            const matchesPrice = product.price >= this.state.filters.priceRange.min && 
                               product.price <= this.state.filters.priceRange.max;
            const matchesRating = product.rating >= this.state.filters.minRating;

            return matchesCategory && matchesSearch && matchesPrice && matchesRating;
        });
    }

    getCartTotal() {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartCount() {
        return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    }
}

export const store = new Store();
