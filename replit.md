# POS Lite - Point of Sale Web Application

## Overview
A modern, offline-first Point of Sale system for small businesses built with Flask (Python) and vanilla JavaScript. The app features multi-user support, comprehensive sales tracking, inventory management, customer management, expense tracking, and detailed reporting with visualizations.

## Recent Changes
- **2025-10-27**: Initial MVP created with full POS functionality
  - Multi-user system with auto-generated credentials
  - Complete product management (CRUD operations)
  - Sales processing with multiple payment methods
  - Customer and expense tracking
  - Reports with Chart.js visualizations
  - PWA support for offline capability
  - Light/Dark mode theme toggle

## Project Architecture

### Backend (Flask)
- **app.py**: Main Flask application with all API endpoints
  - JSON file-based persistent storage (user-specific isolated databases)
  - Automatic save/load on startup and data changes
  - Session-based authentication
  - RESTful API endpoints for all operations
  - Export/Import functionality for data backup

### Frontend
- **templates/**: HTML templates
  - `index.html`: Landing page with Create/Export/Import POS
  - `login.html`: Authentication page
  - `dashboard.html`: Main POS interface with all features
  
- **static/**: Static assets
  - `css/style.css`: Complete styling with light/dark mode support
  - `js/app.js`: Main application logic
  - `js/sw.js`: Service worker for PWA/offline functionality
  - `manifest.json`: PWA manifest for installation

## Features Implemented

### ✅ Multi-User POS System
- Auto-generation of unique credentials (username/password) per POS
- Isolated data storage per user
- Session-based authentication

### ✅ Product Management
- Add/Edit/Delete products
- Fields: name, category, barcode, cost price, sale price, quantity
- Stock tracking with automatic deduction on sales

### ✅ Sales Processing
- Interactive cart with quantity controls
- Multiple payment methods (cash, card, transfer)
- VAT calculation
- Receipt generation and printing
- Automatic inventory updates

### ✅ Customer Management
- Customer database with name, phone, balance
- Full CRUD operations

### ✅ Expense Tracking
- Record expenses with title, category, amount
- Categories: utilities, rent, salaries, supplies, other

### ✅ Reports & Analytics
- Daily, weekly, and monthly reports
- Revenue, sales count, expenses, and profit calculations
- Chart.js visualizations:
  - Payment methods breakdown (pie chart)
  - Sales trend over time (line chart)

### ✅ Business Settings
- Configurable business name
- Currency selection (USD, EUR, GBP, NGN)
- VAT rate settings
- User role management (owner, manager, cashier)

### ✅ Export/Import
- Full data backup to JSON
- Secure restore with credential verification
- Preserves all data: products, sales, customers, expenses, settings

### ✅ PWA Features
- Service worker for offline caching
- Installable on Windows, Android, iOS
- Works offline after initial load

### ✅ UI/UX
- Responsive design (mobile-friendly)
- Light/Dark mode toggle
- Modern gradient design
- Intuitive navigation
- Modal-based forms

## How to Use

### First Time Setup
1. Visit the home page
2. Click "Create New POS" to generate credentials
3. Save the displayed username and password
4. Login with your credentials

### Daily Operations
1. **Sales**: Click products to add to cart, select payment method, complete sale
2. **Products**: Manage inventory, add new products, update stock
3. **Customers**: Track customer information and balances
4. **Expenses**: Record business expenses
5. **Reports**: View sales analytics and trends
6. **Settings**: Configure business details

### Data Management
- **Export**: Download complete POS data as JSON backup
- **Import**: Restore data from JSON file (requires login)

## Technical Stack
- **Backend**: Python 3.11, Flask, Flask-Session
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Charts**: Chart.js
- **Storage**: JSON file-based persistence (pos_data.json)
- **PWA**: Service Worker API, Web App Manifest

## Environment Variables
- `SESSION_SECRET`: Flask session secret key (auto-configured)

## File Structure
```
├── app.py                 # Flask backend
├── templates/
│   ├── index.html        # Landing page
│   ├── login.html        # Login page
│   └── dashboard.html    # Main POS dashboard
├── static/
│   ├── css/
│   │   └── style.css     # Styles with theme support
│   ├── js/
│   │   ├── app.js        # Main application logic
│   │   └── sw.js         # Service worker
│   └── manifest.json     # PWA manifest
└── replit.md             # This file
```

## Security Features
- Password hashing with Werkzeug
- Session-based authentication
- Isolated user data
- Credential verification for export/import

## Future Enhancements (Next Phase)
- Persistent database (PostgreSQL) instead of in-memory storage
- Barcode scanner integration
- Low stock alerts
- Multi-location support
- Advanced analytics dashboard
- Email receipts
- SMS notifications
- API for third-party integrations

## Notes
- Data is automatically saved to pos_data.json and persists across server restarts
- Each user has completely isolated data stored in the same file
- Use Export feature to create portable backups
- Mobile-responsive design works on all devices
- PWA can be installed on any device for offline use
