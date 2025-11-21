import { store } from './state.js';

export function renderPagination(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { totalPages, currentPage } = store.getPaginatedProducts();

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';
    
    // Previous Button (سابق)
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="window.changePage(${currentPage - 1})">سابق</button>`;

    // Logic to show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start if we are near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="window.changePage(${i})">${i}</button>`;
    }

    // Next Button (تالي)
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changePage(${currentPage + 1})">تالي</button>`;
    
    html += '</div>';
    container.innerHTML = html;
}

// Expose changePage globally
window.changePage = (page) => {
    store.setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
