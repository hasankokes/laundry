# Task ID: 4 - Overdue Alerts Agent

## Task: Add overdue balance alerts on Dashboard and payment reminder features

## Work Completed

### 1. OverdueAlerts Component (`dashboard.tsx`)
- Added after stat cards, before weekly comparison card
- Only visible when there are customers with outstanding balance (balance > 0)
- Uses `useBalanceOverview` for debtor data + `usePayments` for last payment dates
- Color-coded severity:
  - **Red** (>30 days since last payment) - critical overdue
  - **Amber** (>15 days) - warning
  - **Muted** (<15 days) - normal
- Each row displays: customer name, balance amount, days since last payment, last payment date
- Header shows "X müşteri" badge with customer count
- Loading shimmer state while data loads
- framer-motion staggered animations

### 2. WhatsApp Payment Reminder
- "Hatırlat" button on each overdue customer row
- Pre-filled Turkish message: "Merhaba {name}, çamaşırhane hesabınızda ₺{balance} tutarında ödeme bulunmaktadır. Ödemenizi yapmanızı rica ederiz."
- Uses wa.me link format:
  - With phone: `https://wa.me/90{phone}?text=...`
  - Without phone: `https://wa.me/?text=...`
- Phone number cleaned (non-digits stripped, leading 0 removed, country code 90 prepended)

### 3. RecentPayments Component (`dashboard.tsx`)
- Shows last 5 payments across all customers
- Each entry: customer name, amount, date, payment method badge
- Method badges: Nakit (emerald), Kredi Kartı (sky), Havale (amber), EFT (purple)
- "Tümünü Gör" button navigates to Customers tab
- Empty state with Wallet icon
- Loading shimmer state

### 4. Changes Made
- **Imports**: Added `usePayments`, `AlertTriangle`, `MessageCircle`, `ArrowRight` to dashboard.tsx
- **Dashboard hook**: Added `const { data: payments } = usePayments()`
- **OverdueAlerts**: Inserted `<OverdueAlerts payments={payments ?? []} />` after stat cards
- **RecentPayments**: Inserted `<RecentPayments />` after Balance Overview section

### 5. Verification
- ESLint: 0 errors
- Dev server: compiling successfully, all APIs returning data
- No new API routes or schema changes needed
