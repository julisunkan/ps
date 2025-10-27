"""
POS Lite Web App - Flask Backend
A modern Point of Sale system for small businesses with multi-user support
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import json
import uuid
import os
import io

app = Flask(__name__)

# Configure Flask session
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
Session(app)

# Data storage for all users
# Structure: { 'user_id': { 'credentials': {...}, 'data': {...} } }
USER_DATABASES = {}
DATA_FILE = 'pos_data.json'

def load_data_from_file():
    """Load user databases from JSON file"""
    global USER_DATABASES
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                USER_DATABASES = json.load(f)
            print(f"Loaded {len(USER_DATABASES)} user databases from file")
        except Exception as e:
            print(f"Error loading data: {e}")
            USER_DATABASES = {}
    else:
        USER_DATABASES = {}

def save_data_to_file():
    """Save user databases to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(USER_DATABASES, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")

# Load existing data on startup
load_data_from_file()

def generate_credentials():
    """Generate random username and password for new POS"""
    username = f"pos_{uuid.uuid4().hex[:8]}"
    password = uuid.uuid4().hex[:12]
    return username, password

def create_new_pos():
    """Create a new POS system with unique credentials and demo data"""
    user_id = str(uuid.uuid4())
    username, password = generate_credentials()
    
    # Create demo products
    demo_products = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Laptop',
            'category': 'Electronics',
            'barcode': '123456789',
            'cost_price': 800,
            'sale_price': 1200,
            'quantity': 15,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Mouse',
            'category': 'Electronics',
            'barcode': '987654321',
            'cost_price': 10,
            'sale_price': 25,
            'quantity': 50,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Keyboard',
            'category': 'Electronics',
            'barcode': '456789123',
            'cost_price': 30,
            'sale_price': 60,
            'quantity': 30,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Coffee Mug',
            'category': 'Accessories',
            'barcode': '321654987',
            'cost_price': 3,
            'sale_price': 10,
            'quantity': 100,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Notebook',
            'category': 'Stationery',
            'barcode': '789123456',
            'cost_price': 2,
            'sale_price': 5,
            'quantity': 200,
            'created_at': datetime.now().isoformat()
        }
    ]
    
    # Create demo customers
    demo_customers = [
        {
            'id': str(uuid.uuid4()),
            'name': 'John Doe',
            'phone': '+1234567890',
            'balance': 0,
            'created_at': datetime.now().isoformat()
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Jane Smith',
            'phone': '+1987654321',
            'balance': 50,
            'created_at': datetime.now().isoformat()
        }
    ]
    
    USER_DATABASES[user_id] = {
        'credentials': {
            'username': username,
            'password_hash': generate_password_hash(password),
            'created_at': datetime.now().isoformat()
        },
        'data': {
            'settings': {
                'business_name': 'My Business',
                'currency': 'USD',
                'vat_rate': 0,
                'logo': '',
                'user_role': 'owner'
            },
            'products': demo_products,
            'sales': [],
            'customers': demo_customers,
            'expenses': [],
            'users': [{
                'id': '1',
                'username': username,
                'role': 'owner',
                'created_at': datetime.now().isoformat()
            }]
        }
    }
    
    save_data_to_file()
    return user_id, username, password

def authenticate_user(username, password):
    """Authenticate user and return user_id if valid"""
    for user_id, user_data in USER_DATABASES.items():
        if user_data['credentials']['username'] == username:
            if check_password_hash(user_data['credentials']['password_hash'], password):
                return user_id
    return None

def get_user_data(user_id):
    """Get user's POS data"""
    if user_id in USER_DATABASES:
        return USER_DATABASES[user_id]['data']
    return None

def set_user_data(user_id, data):
    """Update user's POS data"""
    if user_id in USER_DATABASES:
        USER_DATABASES[user_id]['data'] = data
        save_data_to_file()
        return True
    return False

# Routes

@app.route('/')
def index():
    """Main landing page with Create/Export/Import options"""
    return render_template('index.html')

@app.route('/api/create-pos', methods=['POST'])
def create_pos():
    """Create a new POS system and return credentials"""
    user_id, username, password = create_new_pos()
    return jsonify({
        'success': True,
        'user_id': user_id,
        'username': username,
        'password': password,
        'message': 'POS created successfully! Please save your credentials.'
    })

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and authentication"""
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        user_id = authenticate_user(username, password)
        if user_id:
            session['user_id'] = user_id
            session['username'] = username
            return jsonify({'success': True, 'redirect': '/dashboard'})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'})
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout current user"""
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    """Main POS dashboard - requires authentication"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

# API Endpoints for POS Operations

@app.route('/api/settings', methods=['GET', 'POST'])
def settings():
    """Get or update business settings"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'POST':
        data = request.get_json()
        user_data['settings'].update(data)
        set_user_data(user_id, user_data)
        return jsonify({'success': True, 'settings': user_data['settings']})
    
    return jsonify({'success': True, 'settings': user_data['settings']})

@app.route('/api/products', methods=['GET', 'POST'])
def products():
    """Get all products or add a new product"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'POST':
        product = request.get_json()
        product['id'] = str(uuid.uuid4())
        product['created_at'] = datetime.now().isoformat()
        user_data['products'].append(product)
        set_user_data(user_id, user_data)
        return jsonify({'success': True, 'product': product})
    
    return jsonify({'success': True, 'products': user_data['products']})

@app.route('/api/products/<product_id>', methods=['PUT', 'DELETE'])
def product_detail(product_id):
    """Update or delete a specific product"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'PUT':
        updated_product = request.get_json()
        for i, product in enumerate(user_data['products']):
            if product['id'] == product_id:
                user_data['products'][i].update(updated_product)
                set_user_data(user_id, user_data)
                return jsonify({'success': True, 'product': user_data['products'][i]})
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    elif request.method == 'DELETE':
        user_data['products'] = [p for p in user_data['products'] if p['id'] != product_id]
        set_user_data(user_id, user_data)
        return jsonify({'success': True})

@app.route('/api/sales', methods=['GET', 'POST'])
def sales():
    """Get all sales or create a new sale"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'POST':
        sale = request.get_json()
        sale['id'] = str(uuid.uuid4())
        sale['created_at'] = datetime.now().isoformat()
        
        # Deduct stock for each item in the sale
        for item in sale['items']:
            for product in user_data['products']:
                if product['id'] == item['product_id']:
                    product['quantity'] = int(product['quantity']) - int(item['quantity'])
                    break
        
        user_data['sales'].append(sale)
        set_user_data(user_id, user_data)
        return jsonify({'success': True, 'sale': sale})
    
    return jsonify({'success': True, 'sales': user_data['sales']})

@app.route('/api/customers', methods=['GET', 'POST'])
def customers():
    """Get all customers or add a new customer"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'POST':
        customer = request.get_json()
        customer['id'] = str(uuid.uuid4())
        customer['created_at'] = datetime.now().isoformat()
        user_data['customers'].append(customer)
        set_user_data(user_id, user_data)
        return jsonify({'success': True, 'customer': customer})
    
    return jsonify({'success': True, 'customers': user_data['customers']})

@app.route('/api/customers/<customer_id>', methods=['PUT', 'DELETE'])
def customer_detail(customer_id):
    """Update or delete a specific customer"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'PUT':
        updated_customer = request.get_json()
        for i, customer in enumerate(user_data['customers']):
            if customer['id'] == customer_id:
                user_data['customers'][i].update(updated_customer)
                set_user_data(user_id, user_data)
                return jsonify({'success': True, 'customer': user_data['customers'][i]})
        return jsonify({'success': False, 'message': 'Customer not found'}), 404
    
    elif request.method == 'DELETE':
        user_data['customers'] = [c for c in user_data['customers'] if c['id'] != customer_id]
        set_user_data(user_id, user_data)
        return jsonify({'success': True})

@app.route('/api/expenses', methods=['GET', 'POST'])
def expenses():
    """Get all expenses or add a new expense"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    if request.method == 'POST':
        expense = request.get_json()
        expense['id'] = str(uuid.uuid4())
        expense['created_at'] = datetime.now().isoformat()
        user_data['expenses'].append(expense)
        set_user_data(user_id, user_data)
        return jsonify({'success': True, 'expense': expense})
    
    return jsonify({'success': True, 'expenses': user_data['expenses']})

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def expense_detail(expense_id):
    """Delete a specific expense"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    user_data['expenses'] = [e for e in user_data['expenses'] if e['id'] != expense_id]
    set_user_data(user_id, user_data)
    return jsonify({'success': True})

@app.route('/api/export', methods=['POST'])
def export_data():
    """Export POS data as JSON - requires authentication"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user_id = authenticate_user(username, password)
    if not user_id:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    user_data = get_user_data(user_id)
    export_data = {
        'exported_at': datetime.now().isoformat(),
        'username': username,
        'data': user_data
    }
    
    return jsonify({'success': True, 'data': export_data})

@app.route('/api/import', methods=['POST'])
def import_data():
    """Import POS data from JSON - requires authentication"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    import_data = data.get('data')
    
    user_id = authenticate_user(username, password)
    if not user_id:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    if import_data and 'data' in import_data:
        set_user_data(user_id, import_data['data'])
        return jsonify({'success': True, 'message': 'Data imported successfully'})
    
    return jsonify({'success': False, 'message': 'Invalid import data'}), 400

@app.route('/api/reports/<report_type>')
def reports(report_type):
    """Generate reports (daily, weekly, monthly)"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_data = get_user_data(user_id)
    
    now = datetime.now()
    sales = user_data['sales']
    
    # Filter sales based on report type
    if report_type == 'daily':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif report_type == 'weekly':
        start_date = now - timedelta(days=7)
    elif report_type == 'monthly':
        start_date = now - timedelta(days=30)
    else:
        return jsonify({'success': False, 'message': 'Invalid report type'}), 400
    
    filtered_sales = [
        s for s in sales 
        if datetime.fromisoformat(s['created_at']) >= start_date
    ]
    
    # Calculate totals
    total_revenue = sum(float(s.get('total', 0)) for s in filtered_sales)
    total_sales_count = len(filtered_sales)
    
    # Calculate by payment method
    payment_methods = {}
    for sale in filtered_sales:
        method = sale.get('payment_method', 'cash')
        payment_methods[method] = payment_methods.get(method, 0) + float(sale.get('total', 0))
    
    # Get expenses in the same period
    filtered_expenses = [
        e for e in user_data['expenses']
        if datetime.fromisoformat(e['created_at']) >= start_date
    ]
    total_expenses = sum(float(e.get('amount', 0)) for e in filtered_expenses)
    
    return jsonify({
        'success': True,
        'report': {
            'type': report_type,
            'start_date': start_date.isoformat(),
            'end_date': now.isoformat(),
            'total_revenue': total_revenue,
            'total_sales': total_sales_count,
            'total_expenses': total_expenses,
            'net_profit': total_revenue - total_expenses,
            'payment_methods': payment_methods,
            'sales': filtered_sales,
            'expenses': filtered_expenses
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
