# Vaultline — Digital Wallet (React)

A React + Vite port of the Vaultline digital wallet demo. All the original
functionality is preserved — dashboard, send money, request/add money,
receive (QR code), scan & pay (camera QR scanning), split bill, card
management, transaction ledger, and profile — rebuilt as componentized
React state instead of vanilla DOM manipulation.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
vaultline-react/
├── index.html              # entry HTML, loads QRCode.js and jsQR from CDN
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx             # React root
│   ├── App.jsx               # app state + view router
│   ├── index.css             # global styles (design system)
│   ├── utils.js               # money/date/initials helpers
│   ├── data/
│   │   └── seed.js            # seed contacts, cards, transactions
│   └── components/
│       ├── Login.jsx
│       ├── Sidebar.jsx
│       ├── Dashboard.jsx
│       ├── SendMoney.jsx
│       ├── RequestAdd.jsx
│       ├── Receive.jsx
│       ├── ScanPay.jsx
│       ├── SplitBill.jsx
│       ├── Cards.jsx
│       ├── Transactions.jsx
│       ├── Profile.jsx
│       ├── WalletCard.jsx
│       ├── LedgerRow.jsx
│       ├── QrBox.jsx
│       ├── Toast.jsx
│       └── Icons.jsx
```

## Notes

- This is a front-end demo only — all data (balance, cards, transactions,
  splits) lives in React state and resets on page reload. There is no
  backend or persistence layer.
- Login accepts any password for the demo account.
- QR generation uses `qrcodejs` and scanning uses `jsQR`, both loaded via
  CDN `<script>` tags in `index.html` and accessed off `window`.
- Camera access (Scan & Pay → Start camera) requires a secure context
  (`https://` or `localhost`) and browser permission.
