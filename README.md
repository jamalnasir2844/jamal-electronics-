# ⚡ Jamal Electronics

### 🏪 Smart Shop Management System

A modern **MERN Stack Shop Management System** built for **Jamal Electronics** to manage products, inventory, purchases, sales, customers, suppliers, PCO transactions, expenses, and business reports — all from one beautiful dashboard.

<br />

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Cloudinary-Images-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Completed-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Responsive-Yes-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Database-MongoDB-green?style=flat-square" />
  <img src="https://img.shields.io/badge/License-Private-lightgrey?style=flat-square" />
</p>

---

## ✨ Overview

**Jamal Electronics** is a full-stack business management application designed to simplify the daily operations of an electronics and PCO shop.

Instead of maintaining separate registers for products, sales, purchases, customers, expenses, and PCO transactions, everything can be managed through a single centralized system.

### 🎯 The system manages

* 📦 Products & Inventory
* 🛒 Purchases
* 💰 Sales
* 👥 Customers
* 🏢 Suppliers
* 🏧 PCO Withdrawals
* 💸 Expenses
* 📊 Profit & Loss
* 📈 Business Reports
* 🧾 Invoices & Receipts
* 👤 User Profiles
* 🔐 Authentication

---

# 🖥️ Dashboard

The dashboard provides a quick overview of the shop's business activity.

### Dashboard includes:

| 📊 Information  | Description                    |
| --------------- | ------------------------------ |
| 💰 Sales        | Today's and historical sales   |
| 🛒 Purchases    | Purchase activity              |
| 🏧 PCO          | Withdrawal and service charges |
| 💸 Expenses     | Shop expenses                  |
| 📈 Profit       | Gross and net profit           |
| 📦 Stock        | Current inventory              |
| ⚠️ Low Stock    | Products requiring restocking  |
| 🔥 Top Products | Best-selling products          |

---

# 🚀 Features

## 🔐 Authentication

Secure authentication powered by Firebase.

* Register
* Login
* Logout
* Protected routes
* Firebase ID token verification
* User profile
* Profile image
* Shop information

---

## 📦 Product Management

Complete inventory management.

### Features

```text
➕ Add Product
✏️ Edit Product
🗑️ Delete Product
🔍 Search Product
🏷️ Category Filter
📸 Product Image
📊 Stock Tracking
⚠️ Low Stock Alert
```

Product information includes:

```text
Name
SKU
Category
Description
Purchase Price
Selling Price
Stock
Minimum Stock
Unit
Supplier
Image
```

---

# 🛒 Purchase Management

Record products purchased from suppliers.

### Purchase Flow

```text
Supplier
    ↓
Select Products
    ↓
Quantity + Purchase Price
    ↓
Subtotal
    ↓
Discount
    ↓
Grand Total
    ↓
Payment
    ↓
Supplier Balance
    ↓
Stock Updated
```

Every purchase stores the historical purchase price so previous transactions remain accurate.

---

# 💰 Sales Management

Manage customer sales with automatic inventory updates.

### Sales Flow

```text
Customer
    ↓
Select Products
    ↓
Check Stock
    ↓
Quantity + Selling Price
    ↓
Discount
    ↓
Grand Total
    ↓
Payment
    ↓
Customer Balance
    ↓
Stock Decreased
    ↓
Profit Calculated
```

### 📈 Profit Formula

```text
Profit =
(Selling Price - Purchase Price) × Quantity
```

Example:

```text
Selling Price   = Rs. 2,000
Purchase Price  = Rs. 1,500
Quantity        = 2

Profit = (2000 - 1500) × 2

Profit = Rs. 1,000
```

---

# 🏧 PCO Management

A dedicated PCO transaction system is included.

### Default Charge

```text
Rs. 20 per Rs. 1,000
```

The rate is configurable from the shop settings.

### 💡 Calculation

```text
Service Charge =
(Withdrawal Amount / Charge Per) × Charge Rate
```

### Examples

| Withdrawal |  Charge |
| ---------: | ------: |
|  Rs. 1,000 |  Rs. 20 |
|  Rs. 5,000 | Rs. 100 |
| Rs. 10,000 | Rs. 200 |
| Rs. 25,000 | Rs. 500 |

### Customer Payment

```text
Customer Paid =
Withdrawal Amount + Service Charge
```

> 💡 The withdrawal amount itself is not counted as shop revenue. Only the service charge contributes to PCO income.

---

# 🧾 PCO Transaction History

Every PCO transaction is stored permanently.

```text
Customer
Phone
Withdrawal Amount
Service Charge
Customer Paid
Payment Method
Transaction Reference
Date
Created By
```

Example transaction reference:

```text
JE-WD-20260925-0001
```

### 🔒 Historical Rate Protection

If the PCO rate changes later:

```text
Old Transaction
      ↓
Old Charge Rate
      ↓
Remains Unchanged
```

This keeps historical transactions financially accurate.

---

# 👥 Customer Management

Manage all customers and their transaction history.

### Customer information

```text
Name
Phone
Email
Address
Notes
```

### Customer statistics

* Total purchases
* Total paid
* Remaining balance
* PCO withdrawals
* PCO charges
* Transaction history

---

# 🏢 Supplier Management

Track suppliers and outstanding balances.

```text
Supplier
   ↓
Purchases
   ↓
Total Amount
   ↓
Paid Amount
   ↓
Remaining Balance
```

---

# 💸 Expense Management

Record all shop expenses.

### Expense Categories

```text
🏠 Rent
⚡ Electricity
🚗 Transport
👨‍💼 Salary
🔧 Maintenance
🌐 Internet
📦 Other
```

---

# 📊 Reports

The reporting system provides useful business information.

### Available Reports

* Daily Sales
* Weekly Sales
* Monthly Sales
* Purchases
* PCO Withdrawals
* PCO Charges
* Expenses
* Gross Profit
* Net Profit
* Stock Report
* Low Stock Report
* Customer Report
* Supplier Report

---

# 🧮 Business Calculations

### Gross Profit

```text
Gross Profit =
Sales Revenue - Cost of Goods Sold
```

### Net Profit

```text
Net Profit =
Gross Profit + PCO Charges - Expenses
```

### Stock Value

```text
Stock Value =
Current Stock × Purchase Price
```

### Low Stock

```text
Stock <= Minimum Stock
```

### Out of Stock

```text
Stock === 0
```

---

# 🧾 Invoices

Printable documents are available for:

```text
🧾 Sales
🛒 Purchases
🏧 PCO Withdrawals
```

Invoices contain transaction information and can be printed for customers and shop records.

---

# 🛠️ Tech Stack

## Frontend

<p>
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
</p>

## Backend

<p>
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white" />
</p>

## Database & Services

<p>
<img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
</p>

---

# 🏗️ Architecture

```text
                  ┌─────────────────────┐
                  │    React Frontend   │
                  │      + Vite         │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Firebase Auth       │
                  │ Login / Register    │
                  └──────────┬──────────┘
                             │
                       ID Token
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Express Server    │
                  │   Node.js Backend   │
                  └──────────┬──────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
          ┌───────────────┐     ┌───────────────┐
          │   Mongoose    │     │   Cloudinary  │
          └───────┬───────┘     └───────────────┘
                  │
                  ▼
          ┌─────────────────┐
          │   MongoDB Atlas │
          └─────────────────┘
```

---

# 📁 Project Structure

```text
jamal-electronics/
│
├── client/
│   ├── public/
│   │
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── firebase.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── .gitignore
├── README.md
└── package.json
```

---

# ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone YOUR_REPOSITORY_URL
```

```bash
cd jamal-electronics
```

### 2️⃣ Install Backend

```bash
cd server
npm install
```

### 3️⃣ Configure Environment Variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4️⃣ Start Backend

```bash
npm run dev
```

### 5️⃣ Start Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

---

# 🔒 Security

Sensitive information is never stored directly inside the source code.

The project uses:

* 🔐 Firebase Authentication
* 🛡️ Protected API routes
* 🔑 Firebase Admin verification
* 🔒 Environment variables
* 🌐 CORS configuration
* ✅ Server-side financial calculations
* 🗄️ MongoDB security
* ☁️ Cloudinary secure credentials

> **Important:** Never commit your `.env` file or private API credentials to GitHub.

---

# 📱 Responsive Design

The application is designed for:

```text
🖥️ Desktop
💻 Laptop
📱 Tablet
📲 Mobile
```

---

# 🧪 Testing Checklist

```text
☑ Authentication
☑ Product CRUD
☑ Category CRUD
☑ Supplier Management
☑ Customer Management
☑ Purchase System
☑ Stock Increase
☑ Sales System
☑ Stock Decrease
☑ Profit Calculation
☑ PCO Transactions
☑ PCO Charge Calculation
☑ Expense Management
☑ Dashboard
☑ Reports
☑ Invoice Printing
☑ Cloudinary Upload
☑ Firebase Authentication
☑ MongoDB Connection
☑ Responsive UI
```

---

# 🔮 Future Improvements

Possible future additions:

* 📱 WhatsApp invoice sharing
* 🧾 Thermal printer support
* 📷 Barcode scanner
* 📊 Advanced analytics
* 📄 PDF/Excel reports
* 🔔 Customer payment reminders
* 🔔 Supplier payment reminders
* 👨‍💼 Staff accounts
* 🔐 Role-based permissions
* 🏪 Multiple shop branches
* 💾 Automated backups
* 📲 Progressive Web App
* 🌙 Dark Mode

---

# 👨‍💻 Developer

## Muhammad Jamal Nasir

**Computer Engineering Student | Full-Stack Developer**

### Skills

```text
React
JavaScript
Node.js
Express.js
MongoDB
Firebase
Cloudinary
REST APIs
Git & GitHub
```

---

## ⭐ Project

If you find this project useful, consider giving the repository a ⭐ on GitHub.

<p align="center">

### ⚡ Built with passion for Jamal Electronics

**© 2026 Muhammad Jamal Nasir**

</p>
