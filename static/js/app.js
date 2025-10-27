// POS Lite - Main Application JavaScript

let currentCart = [];
let products = [];
let customers = [];
let expenses = [];
let settings = {};
let currentEditingProduct = null;
let currentEditingCustomer = null;
let paymentChart = null;
let salesChart = null;

// Utility function to format numbers with thousand separators
function formatCurrency(amount) {
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'NGN': '₦'
    };
    const symbol = currencySymbols[settings.currency] || '$';
    const formatted = parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return `${symbol}${formatted}`;
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadProducts();
    loadCustomers();
    loadExpenses();
    loadReport('daily', document.querySelector('.tab-btn.active'));
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton();
});

// Section Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`section-${sectionName}`).classList.add('active');
    
    // Update title
    document.getElementById('sectionTitle').textContent = 
        sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    
    // Add active class to clicked nav link
    event.target.closest('.nav-link').classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

// Sidebar Toggle
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton();
}

function updateThemeButton() {
    const theme = document.documentElement.getAttribute('data-theme');
    document.getElementById('themeToggle').textContent = 
        theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
}

// Settings Management
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success) {
            settings = data.settings;
            document.getElementById('businessName').textContent = settings.business_name;
            document.getElementById('settingsBusinessName').value = settings.business_name;
            document.getElementById('settingsCurrency').value = settings.currency;
            document.getElementById('settingsVat').value = settings.vat_rate;
            document.getElementById('settingsRole').value = settings.user_role;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function saveSettings() {
    const updatedSettings = {
        business_name: document.getElementById('settingsBusinessName').value,
        currency: document.getElementById('settingsCurrency').value,
        vat_rate: parseFloat(document.getElementById('settingsVat').value),
        user_role: document.getElementById('settingsRole').value
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSettings)
        });
        
        const data = await response.json();
        if (data.success) {
            settings = data.settings;
            document.getElementById('businessName').textContent = settings.business_name;
            // Reload all displays to apply currency changes
            renderProductsTable();
            renderProductGrid();
            renderCart();
            renderCustomersTable();
            renderExpensesTable();
            const activeTab = document.querySelector('#section-reports .tab-btn.active');
            if (activeTab) {
                const reportType = activeTab.textContent.toLowerCase();
                loadReport(reportType, activeTab);
            }
            showInlineMessage('Settings saved successfully!', 'success');
        }
    } catch (error) {
        showInlineMessage('Error saving settings: ' + error.message, 'error');
    }
}

function showInlineMessage(message, type, targetSelector = '.settings-form') {
    // Remove existing message if any
    const existingMessage = document.getElementById('inlineMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'inlineMessage';
    messageDiv.textContent = message;
    messageDiv.style.padding = '12px 20px';
    messageDiv.style.marginTop = '15px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.fontWeight = '600';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.transition = 'opacity 0.3s ease';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#10b981';
        messageDiv.style.color = 'white';
    } else {
        messageDiv.style.backgroundColor = '#ef4444';
        messageDiv.style.color = 'white';
    }
    
    // Insert message
    const targetElement = document.querySelector(targetSelector) || document.querySelector('.settings-form');
    if (targetElement) {
        targetElement.appendChild(messageDiv);
    }
    
    // Auto-remove after 3 seconds with fade out
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// Products Management
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.success) {
            products = data.products;
            renderProductsTable();
            renderProductGrid();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.barcode || 'N/A'}</td>
            <td>${formatCurrency(product.cost_price)}</td>
            <td>${formatCurrency(product.sale_price)}</td>
            <td>${parseInt(product.quantity).toLocaleString('en-US')}</td>
            <td>
                <button class="btn-edit" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderProductGrid() {
    const grid = document.getElementById('productGrid');
    const filtered = products.filter(p => parseInt(p.quantity) > 0);
    
    grid.innerHTML = filtered.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <h4>${product.name}</h4>
            <div class="price">${formatCurrency(product.sale_price)}</div>
            <div class="stock">Stock: ${parseInt(product.quantity).toLocaleString('en-US')}</div>
        </div>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.category.toLowerCase().includes(search)
    );
    
    const grid = document.getElementById('productGrid');
    grid.innerHTML = filtered.map(product => `
        <div class="product-card" onclick="addToCart('${product.id}')">
            <h4>${product.name}</h4>
            <div class="price">${formatCurrency(product.sale_price)}</div>
            <div class="stock">Stock: ${parseInt(product.quantity).toLocaleString('en-US')}</div>
        </div>
    `).join('');
}

function showProductModal() {
    currentEditingProduct = null;
    document.getElementById('productModalTitle').textContent = 'Add Product';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productBarcode').value = '';
    document.getElementById('productCost').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQuantity').value = '';
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        currentEditingProduct = product;
        document.getElementById('productModalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productBarcode').value = product.barcode || '';
        document.getElementById('productCost').value = product.cost_price;
        document.getElementById('productPrice').value = product.sale_price;
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productModal').classList.add('active');
    }
}

async function saveProduct(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        barcode: document.getElementById('productBarcode').value,
        cost_price: parseFloat(document.getElementById('productCost').value),
        sale_price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value)
    };
    
    try {
        const productId = document.getElementById('productId').value;
        const url = productId ? `/api/products/${productId}` : '/api/products';
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        if (data.success) {
            await loadProducts();
            closeProductModal();
        }
    } catch (error) {
        alert('❌ Error saving product: ' + error.message);
    }
}

async function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Show inline confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'deleteConfirmation';
    confirmDiv.innerHTML = `
        <div style="padding: 15px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin: 10px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Delete "${product.name}"?</p>
            <button id="confirmDelete" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: 600;">Delete</button>
            <button id="cancelDelete" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
        </div>
    `;
    
    const tableContainer = document.querySelector('#section-products .table-container');
    const existingConfirm = document.getElementById('deleteConfirmation');
    if (existingConfirm) existingConfirm.remove();
    
    tableContainer.insertBefore(confirmDiv, tableContainer.firstChild);
    
    document.getElementById('confirmDelete').onclick = async () => {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.success) {
                confirmDiv.remove();
                await loadProducts();
                showInlineMessage('Product deleted successfully!', 'success');
            }
        } catch (error) {
            confirmDiv.remove();
            showInlineMessage('Error deleting product: ' + error.message, 'error');
        }
    };
    
    document.getElementById('cancelDelete').onclick = () => {
        confirmDiv.remove();
    };
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || parseInt(product.quantity) <= 0) {
        alert('❌ Product out of stock!');
        return;
    }
    
    const existingItem = currentCart.find(item => item.product_id === productId);
    if (existingItem) {
        if (existingItem.quantity < parseInt(product.quantity)) {
            existingItem.quantity++;
        } else {
            alert('❌ Not enough stock!');
            return;
        }
    } else {
        currentCart.push({
            product_id: productId,
            name: product.name,
            price: parseFloat(product.sale_price),
            quantity: 1
        });
    }
    
    renderCart();
}

function updateCartItemQty(productId, change) {
    const item = currentCart.find(i => i.product_id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item) {
        const newQty = item.quantity + change;
        if (newQty <= 0) {
            currentCart = currentCart.filter(i => i.product_id !== productId);
        } else if (newQty <= parseInt(product.quantity)) {
            item.quantity = newQty;
        } else {
            alert('❌ Not enough stock!');
            return;
        }
    }
    
    renderCart();
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (currentCart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #6b7280;">Cart is empty</p>';
    } else {
        cartItems.innerHTML = currentCart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div>${formatCurrency(item.price)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateCartItemQty('${item.product_id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartItemQty('${item.product_id}', 1)">+</button>
                </div>
            </div>
        `).join('');
    }
    
    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vatRate = settings.vat_rate || 0;
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;
    
    document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cartVat').textContent = formatCurrency(vat);
    document.getElementById('cartTotal').textContent = formatCurrency(total);
}

function clearCart() {
    if (currentCart.length > 0 && confirm('Clear all items from cart?')) {
        currentCart = [];
        renderCart();
    }
}

async function completeSale() {
    if (currentCart.length === 0) {
        alert('❌ Cart is empty!');
        return;
    }
    
    const subtotal = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vatRate = settings.vat_rate || 0;
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;
    
    const saleData = {
        items: currentCart,
        subtotal: subtotal,
        vat: vat,
        total: total,
        payment_method: document.getElementById('paymentMethod').value
    };
    
    try {
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        
        const data = await response.json();
        if (data.success) {
            showReceipt(data.sale);
            currentCart = [];
            renderCart();
            await loadProducts();
        }
    } catch (error) {
        alert('❌ Error completing sale: ' + error.message);
    }
}

function showReceipt(sale) {
    const receipt = `
        <div class="receipt-header">
            <h2>${settings.business_name}</h2>
            <p>Receipt #${sale.id.substring(0, 8)}</p>
            <p>${new Date(sale.created_at).toLocaleString()}</p>
        </div>
        <div class="receipt-items">
            ${sale.items.map(item => `
                <div class="receipt-item">
                    <span>${item.name} (${item.quantity})</span>
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
            `).join('')}
        </div>
        <div class="receipt-footer">
            <div class="receipt-item"><strong>Subtotal:</strong> <strong>${formatCurrency(sale.subtotal)}</strong></div>
            <div class="receipt-item"><strong>VAT:</strong> <strong>${formatCurrency(sale.vat)}</strong></div>
            <div class="receipt-item" style="font-size: 1.2rem; margin-top: 10px;">
                <strong>TOTAL:</strong> <strong>${formatCurrency(sale.total)}</strong>
            </div>
            <p style="margin-top: 20px;">Payment: ${sale.payment_method.toUpperCase()}</p>
            <p style="margin-top: 20px;">Thank you for your business!</p>
        </div>
    `;
    
    document.getElementById('receiptContent').innerHTML = receipt;
    document.getElementById('receiptModal').classList.add('active');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
}

function printReceipt() {
    window.print();
}

// Customers Management
async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        const data = await response.json();
        if (data.success) {
            customers = data.customers;
            renderCustomersTable();
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

function renderCustomersTable() {
    const tbody = document.getElementById('customersTable');
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${formatCurrency(customer.balance || 0)}</td>
            <td>
                <button class="btn-edit" onclick="editCustomer('${customer.id}')">Edit</button>
                <button class="btn-danger" onclick="deleteCustomer('${customer.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showCustomerModal() {
    currentEditingCustomer = null;
    document.getElementById('customerModalTitle').textContent = 'Add Customer';
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerBalance').value = '0';
    document.getElementById('customerModal').classList.add('active');
}

function closeCustomerModal() {
    document.getElementById('customerModal').classList.remove('active');
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        currentEditingCustomer = customer;
        document.getElementById('customerModalTitle').textContent = 'Edit Customer';
        document.getElementById('customerId').value = customer.id;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerBalance').value = customer.balance || 0;
        document.getElementById('customerModal').classList.add('active');
    }
}

async function saveCustomer(event) {
    event.preventDefault();
    
    const customerData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        balance: parseFloat(document.getElementById('customerBalance').value)
    };
    
    try {
        const customerId = document.getElementById('customerId').value;
        const url = customerId ? `/api/customers/${customerId}` : '/api/customers';
        const method = customerId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
        
        const data = await response.json();
        if (data.success) {
            await loadCustomers();
            closeCustomerModal();
        }
    } catch (error) {
        alert('❌ Error saving customer: ' + error.message);
    }
}

async function deleteCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    // Show inline confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'deleteCustomerConfirmation';
    confirmDiv.innerHTML = `
        <div style="padding: 15px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin: 10px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Delete customer "${customer.name}"?</p>
            <button id="confirmDeleteCustomer" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: 600;">Delete</button>
            <button id="cancelDeleteCustomer" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
        </div>
    `;
    
    const tableContainer = document.querySelector('#section-customers .table-container');
    const existingConfirm = document.getElementById('deleteCustomerConfirmation');
    if (existingConfirm) existingConfirm.remove();
    
    tableContainer.insertBefore(confirmDiv, tableContainer.firstChild);
    
    document.getElementById('confirmDeleteCustomer').onclick = async () => {
        try {
            const response = await fetch(`/api/customers/${customerId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.success) {
                confirmDiv.remove();
                await loadCustomers();
                showInlineMessage('Customer deleted successfully!', 'success');
            }
        } catch (error) {
            confirmDiv.remove();
            showInlineMessage('Error deleting customer: ' + error.message, 'error');
        }
    };
    
    document.getElementById('cancelDeleteCustomer').onclick = () => {
        confirmDiv.remove();
    };
}

// Expenses Management
async function loadExpenses() {
    try {
        const response = await fetch('/api/expenses');
        const data = await response.json();
        if (data.success) {
            expenses = data.expenses;
            renderExpensesTable();
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

function renderExpensesTable() {
    const tbody = document.getElementById('expensesTable');
    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${expense.title}</td>
            <td>${expense.category}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${new Date(expense.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showExpenseModal() {
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseCategory').value = 'utilities';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseModal').classList.add('active');
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
}

async function saveExpense(event) {
    event.preventDefault();
    
    const expenseData = {
        title: document.getElementById('expenseTitle').value,
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value)
    };
    
    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        if (data.success) {
            await loadExpenses();
            closeExpenseModal();
        }
    } catch (error) {
        alert('❌ Error saving expense: ' + error.message);
    }
}

async function deleteExpense(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Show inline confirmation
    const confirmDiv = document.createElement('div');
    confirmDiv.id = 'deleteExpenseConfirmation';
    confirmDiv.innerHTML = `
        <div style="padding: 15px; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin: 10px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600;">Delete expense "${expense.title}"?</p>
            <button id="confirmDeleteExpense" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px; font-weight: 600;">Delete</button>
            <button id="cancelDeleteExpense" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
        </div>
    `;
    
    const tableContainer = document.querySelector('#section-expenses .table-container');
    const existingConfirm = document.getElementById('deleteExpenseConfirmation');
    if (existingConfirm) existingConfirm.remove();
    
    tableContainer.insertBefore(confirmDiv, tableContainer.firstChild);
    
    document.getElementById('confirmDeleteExpense').onclick = async () => {
        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.success) {
                confirmDiv.remove();
                await loadExpenses();
                showInlineMessage('Expense deleted successfully!', 'success');
            }
        } catch (error) {
            confirmDiv.remove();
            showInlineMessage('Error deleting expense: ' + error.message, 'error');
        }
    };
    
    document.getElementById('cancelDeleteExpense').onclick = () => {
        confirmDiv.remove();
    };
}

// Reports
async function loadReport(reportType, clickedElement) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    try {
        const response = await fetch(`/api/reports/${reportType}`);
        const data = await response.json();
        
        if (data.success) {
            const report = data.report;
            
            // Update report cards
            document.getElementById('reportRevenue').textContent = formatCurrency(report.total_revenue);
            document.getElementById('reportSales').textContent = report.total_sales.toLocaleString('en-US');
            document.getElementById('reportExpenses').textContent = formatCurrency(report.total_expenses);
            document.getElementById('reportProfit').textContent = formatCurrency(report.net_profit);
            
            // Update charts
            updatePaymentChart(report.payment_methods);
            updateSalesChart(report.sales);
        }
    } catch (error) {
        console.error('Error loading report:', error);
    }
}

function updatePaymentChart(paymentMethods) {
    const ctx = document.getElementById('paymentChart');
    
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    
    paymentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.map(l => l.toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: ['#667eea', '#10b981', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

function updateSalesChart(sales) {
    const ctx = document.getElementById('salesChart');
    
    if (salesChart) {
        salesChart.destroy();
    }
    
    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + parseFloat(sale.total);
    });
    
    const labels = Object.keys(salesByDate).slice(-7);
    const data = Object.values(salesByDate).slice(-7);
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales Revenue',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
