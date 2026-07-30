import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   Static data
   ============================================================ */
const INITIAL_CONTACTS = [
  { id: "c1", name: "Meera Shah", color: "#4C8C86" },
  { id: "c2", name: "Rohan Iyer", color: "#C9962C" },
  { id: "c3", name: "Priya Nair", color: "#D97575" },
  { id: "c4", name: "Dev Malhotra", color: "#6B7FD7" },
  { id: "c5", name: "Zara Khan", color: "#B27ED9" },
  { id: "c6", name: "Kabir Rao", color: "#4C8C86" },
  { id: "c7", name: "Anika Sen", color: "#C9962C" },
  { id: "c8", name: "Yusuf Ali", color: "#D97575" },
];

const INITIAL_CARDS = [
  {
    id: "card1",
    issuer: "Vaultline Metal",
    last4: "4821",
    holder: "AARAV KAPOOR",
    expiry: "09/28",
    frozen: false,
    gradient: "linear-gradient(135deg,#e3b85c,#c9962c 55%,#8a6416)",
  },
  {
    id: "card2",
    issuer: "Vaultline Slate",
    last4: "1190",
    holder: "AARAV KAPOOR",
    expiry: "02/27",
    frozen: false,
    gradient: "linear-gradient(135deg,#5c6b7c,#333c47 65%)",
  },
];

const MERCHANT_ICONS = ["🛒", "☕", "✈️", "🏠", "🎬", "📱", "🍽️", "⚡"];
const WALLET_ID = "VL-8842-AK";
const CARD_BRANDS = ["Vaultline Onyx", "Vaultline Copper", "Vaultline Frost"];
const CARD_GRADIENTS = [
  "linear-gradient(135deg,#3a3f4d,#181a22 65%)",
  "linear-gradient(135deg,#d98b5c,#a35a2e 60%)",
  "linear-gradient(135deg,#9fb4c7,#5c7286 65%)",
];

function seedTransactions() {
  const seed = [
    { name: "Meera Shah", type: "in", amount: 120.0, note: "Split dinner" },
    { name: "Grocery Mart", type: "out", amount: 64.32, note: "Weekly groceries" },
    { name: "Top-up · Vaultline Metal", type: "in", amount: 500.0, note: "Card top-up" },
    { name: "Rohan Iyer", type: "out", amount: 75.0, note: "Movie tickets" },
    { name: "Cloudline Hosting", type: "out", amount: 12.99, note: "Subscription" },
    { name: "Priya Nair", type: "in", amount: 220.0, note: "Freelance payment" },
    { name: "City Transit", type: "out", amount: 3.5, note: "Metro card" },
    { name: "Dev Malhotra", type: "out", amount: 45.0, note: "Concert split" },
  ];
  const now = Date.now();
  return seed.map((t, i) => ({
    id: "tx" + i,
    ...t,
    icon: MERCHANT_ICONS[i % MERCHANT_ICONS.length],
    date: new Date(now - i * 1000 * 60 * 60 * 20),
  }));
}

/* ============================================================
   Helpers
   ============================================================ */
function fmtMoney(n) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}
function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("");
}

/* Loads an external script once and reports when the global it exposes is ready */
function useScript(src, globalName) {
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && !!window[globalName]);
  useEffect(() => {
    if (loaded) return;
    if (typeof window !== "undefined" && window[globalName]) {
      setLoaded(true);
      return;
    }
    let existing = document.querySelector(`script[src="${src}"]`);
    if (!existing) {
      existing = document.createElement("script");
      existing.src = src;
      existing.async = true;
      document.head.appendChild(existing);
    }
    const onLoad = () => setLoaded(true);
    existing.addEventListener("load", onLoad);
    if (window[globalName]) setLoaded(true);
    return () => existing.removeEventListener("load", onLoad);
  }, [src, globalName, loaded]);
  return loaded;
}

/* ============================================================
   Small presentational pieces
   ============================================================ */
function QrCode({ payload, size = 176, loaded, className = "request-qr", style }) {
  const boxRef = useRef(null);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.innerHTML = "";
    if (!loaded || typeof window.QRCode === "undefined") {
      el.innerHTML =
        '<div style="font-size:11px;color:#666;padding:10px;text-align:center;">QR library unavailable — code: ' +
        payload +
        "</div>";
      return;
    }
    // eslint-disable-next-line no-new
    new window.QRCode(el, {
      text: payload,
      width: size,
      height: size,
      colorDark: "#14171F",
      colorLight: "#EDE6D6",
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  }, [payload, loaded, size]);
  return <div ref={boxRef} className={className} style={style} />;
}

function WalletCardVisual({ card }) {
  return (
    <div className={`wallet-card ${card.frozen ? "frozen" : ""}`} style={{ background: card.gradient }}>
      {card.frozen && <div className="frozen-badge">Frozen</div>}
      <div className="card-brand-row">
        <div className="card-issuer">{card.issuer}</div>
        <div className="chip" />
      </div>
      <div className="card-number">•••• •••• •••• {card.last4}</div>
      <div className="card-foot">
        <div className="card-holder">{card.holder}</div>
        <div className="card-expiry">{card.expiry}</div>
      </div>
    </div>
  );
}

function LedgerRow({ t }) {
  const sign = t.type === "in" ? "+" : "−";
  const cls = t.type === "in" ? "pos" : "neg";
  const bg = t.type === "in" ? "rgba(76,140,134,0.18)" : "rgba(217,117,117,0.18)";
  const color = t.type === "in" ? "var(--teal)" : "var(--coral)";
  return (
    <div className="ledger-row">
      <div className="tx-icon" style={{ background: bg, color }}>
        {t.icon}
      </div>
      <div className="tx-main">
        <div className="tx-name">{t.name}</div>
        <div className="tx-meta">
          {t.note} · {fmtDate(t.date)}
        </div>
      </div>
      <div className="tx-leader" />
      <div className={`tx-amount ${cls}`}>
        {sign}${fmtMoney(t.amount)}
      </div>
    </div>
  );
}

function ContactPick({ contact, selected, onClick }) {
  return (
    <div className={`contact-pick ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="contact-avatar" style={{ background: contact.color }}>
        {initials(contact.name)}
      </div>
      <div>{contact.name.split(" ")[0]}</div>
    </div>
  );
}

/* ============================================================
   Main App
   ============================================================ */
export default function App() {
  const qrLoaded = useScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", "QRCode");
  const jsQrLoaded = useScript("https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js", "jsQR");

  // Load the Google Fonts stylesheet once
  useEffect(() => {
    if (document.getElementById("vaultline-fonts")) return;
    const link = document.createElement("link");
    link.id = "vaultline-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  /* ---------------- Core state ---------------- */
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

  const [view, setView] = useState("dashboard");

  const [balance, setBalance] = useState(4231.87);
  const [displayedBalance, setDisplayedBalance] = useState(0);
  const prevBalanceRef = useRef(0);
  const balRafRef = useRef(null);

  const [contacts] = useState(INITIAL_CONTACTS);
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [transactions, setTransactions] = useState(() => seedTransactions());

  const [toast, setToast] = useState({ message: "", show: false });
  const toastTimerRef = useRef(null);

  function showToast(msg) {
    setToast({ message: msg, show: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  }

  function addTransaction(tx) {
    setTransactions((prev) => [{ id: "tx" + Date.now() + Math.random(), date: new Date(), ...tx }, ...prev]);
  }

  /* ---------------- Balance odometer ---------------- */
  useEffect(() => {
    const from = prevBalanceRef.current;
    const to = balance;
    const duration = 700;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = from + (to - from) * eased;
      setDisplayedBalance(Math.max(0, val));
      if (p < 1) {
        balRafRef.current = requestAnimationFrame(tick);
      } else {
        prevBalanceRef.current = to;
      }
    }
    balRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(balRafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);
  const [balInt, balDec] = fmtMoney(displayedBalance).split(".");

  /* ---------------- Login / logout ---------------- */
  function handleLogin() {
    const email = loginEmailRef.current.value.trim();
    const password = loginPasswordRef.current.value;
    if (!email || !password) {
      setLoginError("Enter both email and password to continue.");
      return;
    }
    setLoginError("");
    setLoggedIn(true);
    loginPasswordRef.current.value = "";
    showToast("Welcome back, Aarav");
  }
  function handleLoginKeydown(e) {
    if (e.key === "Enter") handleLogin();
  }
  function handleLogout() {
    setLoggedIn(false);
    setView("dashboard");
    setLoginError("");
    showToast("Logged out");
  }

  function navigate(v) {
    setView(v);
  }

  /* ---------------- Cards ---------------- */
  function toggleFreeze(id) {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const frozen = !c.frozen;
        showToast(frozen ? `${c.issuer} frozen` : `${c.issuer} unfrozen`);
        return { ...c, frozen };
      })
    );
  }
  function removeCard(id) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    showToast("Card removed");
  }
  function handleAddCard() {
    setCards((prev) => {
      const idx = prev.length % CARD_BRANDS.length;
      const last4 = String(Math.floor(1000 + Math.random() * 9000));
      const card = {
        id: "card" + Date.now(),
        issuer: CARD_BRANDS[idx],
        last4,
        holder: "AARAV KAPOOR",
        expiry: "11/29",
        frozen: false,
        gradient: CARD_GRADIENTS[idx],
      };
      return [...prev, card];
    });
    showToast("New card added");
  }

  /* ---------------- Transactions view ---------------- */
  const [txFilter, setTxFilter] = useState("all");
  const [txSearch, setTxSearch] = useState("");
  const filteredTransactions = transactions.filter((t) => {
    if (txFilter === "in" && t.type !== "in") return false;
    if (txFilter === "out" && t.type !== "out") return false;
    const q = txSearch.toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.note.toLowerCase().includes(q)) return false;
    return true;
  });

  /* ---------------- Send money ---------------- */
  const [selectedContact, setSelectedContact] = useState(null);
  const sendAmountRef = useRef(null);
  const sendNoteRef = useRef(null);
  function handleSend() {
    const amount = parseFloat(sendAmountRef.current.value);
    const note = sendNoteRef.current.value.trim() || "Sent money";
    const contact = contacts.find((c) => c.id === selectedContact);
    if (!contact) {
      showToast("Pick a contact first");
      return;
    }
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    if (amount > balance) {
      showToast("Insufficient balance");
      return;
    }
    setBalance((b) => b - amount);
    addTransaction({ name: contact.name, type: "out", amount, note, icon: "👤" });
    showToast(`Sent $${fmtMoney(amount)} to ${contact.name.split(" ")[0]}`);
    sendAmountRef.current.value = "";
    sendNoteRef.current.value = "";
    setSelectedContact(null);
    navigate("dashboard");
  }

  /* ---------------- Add / Request money ---------------- */
  const [requestTab, setRequestTab] = useState("add");
  const addSourceRef = useRef(null);
  const addAmountRef = useRef(null);
  const requestFromRef = useRef(null);
  const [requestAmount, setRequestAmount] = useState("");

  function handleAddMoney() {
    const amount = parseFloat(addAmountRef.current.value);
    const sourceId = addSourceRef.current.value;
    const card = cards.find((c) => c.id === sourceId);
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    if (!card) {
      showToast("Add a card first");
      return;
    }
    setBalance((b) => b + amount);
    addTransaction({ name: `Top-up · ${card.issuer}`, type: "in", amount, note: "Card top-up", icon: "💳" });
    showToast(`Added $${fmtMoney(amount)} to your balance`);
    addAmountRef.current.value = "";
    navigate("dashboard");
  }

  const requestAmountNum = parseFloat(requestAmount) || 0;
  const requestPayload = JSON.stringify({
    type: "request",
    to: WALLET_ID,
    amount: requestAmountNum || undefined,
    note: "Payment request",
  });

  function handleRequest() {
    const amount = parseFloat(requestAmount);
    const fromId = requestFromRef.current.value;
    const contact = contacts.find((c) => c.id === fromId);
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    showToast(`Request for $${fmtMoney(amount)} sent to ${contact.name.split(" ")[0]}`);
    setRequestAmount("");
  }

  /* ---------------- Receive ---------------- */
  const [receiveAmount, setReceiveAmount] = useState("");
  const receiveAmountNum = parseFloat(receiveAmount) || 0;
  const receivePayload = JSON.stringify({ type: "pay", to: WALLET_ID, amount: receiveAmountNum || undefined });

  function copyWalletId() {
    navigator.clipboard?.writeText(WALLET_ID).catch(() => {});
    showToast("Wallet ID copied");
  }
  function simulateIncoming() {
    const amount = parseFloat(receiveAmount) || Math.round(Math.random() * 8000) / 100 + 5;
    const payer = contacts[Math.floor(Math.random() * contacts.length)];
    setBalance((b) => b + amount);
    addTransaction({ name: payer.name, type: "in", amount, note: "Scanned your code", icon: "📥" });
    showToast(`${payer.name.split(" ")[0]} paid you $${fmtMoney(amount)}`);
  }

  /* ---------------- Scan & pay ---------------- */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerStreamRef = useRef(null);
  const scannerRafRef = useRef(null);
  const [scannerRunning, setScannerRunning] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Camera not started yet.");
  const manualScanRef = useRef(null);
  const [scanResult, setScanResult] = useState(null); // { to, amount }

  function stopScanner() {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((t) => t.stop());
      scannerStreamRef.current = null;
    }
    if (scannerRafRef.current) cancelAnimationFrame(scannerRafRef.current);
    setScannerRunning(false);
    setScannerStatus("Camera stopped.");
  }

  function scanLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!scannerStreamRef.current || !video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA && typeof window.jsQR !== "undefined") {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imgData.data, imgData.width, imgData.height);
      if (code && code.data) {
        handleScannedPayload(code.data);
        stopScanner();
        return;
      }
    }
    scannerRafRef.current = requestAnimationFrame(scanLoop);
  }

  async function toggleScanner() {
    if (scannerStreamRef.current) {
      stopScanner();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      scannerStreamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      setScannerRunning(true);
      setScannerStatus("Point your camera at a Vaultline code.");
      scanLoop();
    } catch (err) {
      setScannerStatus('Camera unavailable in this browser/context — try "Simulate a scan" or paste a code below.');
    }
  }

  function handleScannedPayload(raw) {
    let to = "Unknown recipient";
    let amount = "";
    try {
      const parsed = JSON.parse(raw);
      to = parsed.to || to;
      amount = parsed.amount || "";
    } catch (e) {
      to = raw.slice(0, 40);
    }
    setScanResult({ to, amount: String(amount) });
    setScannerStatus("Code recognized — confirm the payment below.");
    showToast("Code scanned");
  }
  function simulateScan() {
    const demo = JSON.stringify({ type: "pay", to: "VL-5521-MS", amount: 32.5, note: "Meera Shah — coffee" });
    handleScannedPayload(demo);
  }
  function processManualScan() {
    const raw = manualScanRef.current.value.trim();
    if (!raw) {
      showToast("Paste a code first");
      return;
    }
    handleScannedPayload(raw);
  }
  function confirmScanPayment() {
    const to = scanResult?.to;
    const amount = parseFloat(scanResult?.amount);
    if (!amount || amount <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    if (amount > balance) {
      showToast("Insufficient balance");
      return;
    }
    setBalance((b) => b - amount);
    addTransaction({ name: to, type: "out", amount, note: "Paid via scan", icon: "📷" });
    showToast(`Paid $${fmtMoney(amount)} to ${to}`);
    setScanResult(null);
    if (manualScanRef.current) manualScanRef.current.value = "";
    navigate("dashboard");
  }

  // Stop the camera whenever we leave the scan view
  useEffect(() => {
    if (view !== "scan" && scannerStreamRef.current) {
      stopScanner();
    }
    if (view === "scan") {
      setScanResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  /* ---------------- Split bill ---------------- */
  const splitDescRef = useRef(null);
  const [splitTotal, setSplitTotal] = useState("");
  const [splitSelected, setSplitSelected] = useState(() => new Set());
  const [splitMode, setSplitMode] = useState("equal");
  const [splitCustom, setSplitCustom] = useState({}); // {contactId: string}
  const [splits, setSplits] = useState([]);

  const splitTotalNum = parseFloat(splitTotal) || 0;
  const splitIds = Array.from(splitSelected);
  const splitEqualShare = splitIds.length ? splitTotalNum / splitIds.length : 0;

  function toggleSplitContact(id) {
    setSplitSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function setSplitCustomAmount(id, value) {
    setSplitCustom((prev) => ({ ...prev, [id]: value }));
  }
  function createSplit() {
    const desc = splitDescRef.current.value.trim() || "Shared expense";
    if (!splitTotalNum || splitTotalNum <= 0) {
      showToast("Enter a total amount");
      return;
    }
    if (splitIds.length === 0) {
      showToast("Pick at least one person");
      return;
    }
    const shares = splitIds.map((id) => {
      const amount =
        splitMode === "equal" ? splitTotalNum / splitIds.length : parseFloat(splitCustom[id]) || 0;
      return { contactId: id, amount, settled: false };
    });
    setSplits((prev) => [
      { id: "split" + Date.now(), desc, total: splitTotalNum, date: new Date(), shares },
      ...prev,
    ]);
    showToast(`Split "${desc}" sent to ${splitIds.length} ${splitIds.length === 1 ? "person" : "people"}`);
    splitDescRef.current.value = "";
    setSplitTotal("");
    setSplitSelected(new Set());
    setSplitCustom({});
  }
  function settleSplit(splitId, contactId) {
    let settledAmount = null;
    let contactName = null;
    setSplits((prev) =>
      prev.map((split) => {
        if (split.id !== splitId) return split;
        return {
          ...split,
          shares: split.shares.map((s) => {
            if (s.contactId !== contactId || s.settled) return s;
            settledAmount = s.amount;
            contactName = contacts.find((c) => c.id === contactId)?.name;
            return { ...s, settled: true };
          }),
        };
      })
    );
    if (settledAmount != null) {
      setBalance((b) => b + settledAmount);
      addTransaction({
        name: contactName,
        type: "in",
        amount: settledAmount,
        note: `Settled: ${splits.find((s) => s.id === splitId)?.desc || "split"}`,
        icon: "🤝",
      });
      showToast(`${contactName.split(" ")[0]} settled $${fmtMoney(settledAmount)}`);
    }
  }

  /* ============================================================
     Render
     ============================================================ */
  return (
    <div className="vaultline-app">
      <style>{CSS}</style>

      {/* LOGIN SCREEN */}
      <div className={`login-screen ${loggedIn ? "hidden" : ""}`}>
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">V</div>
            <div className="brand-name">Vaultline</div>
          </div>
          <p className="login-tagline">Log in to your wallet</p>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              ref={loginEmailRef}
              placeholder="you@email.com"
              defaultValue="aarav.kapoor@email.com"
              autoComplete="username"
              onKeyDown={handleLoginKeydown}
            />
          </div>
          <div className="field" style={{ marginBottom: "6px" }}>
            <label>Password</label>
            <input
              type="password"
              ref={loginPasswordRef}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={handleLoginKeydown}
            />
          </div>
          <p className="login-error">{loginError}</p>
          <button className="btn btn-brass btn-block" onClick={handleLogin}>
            Log in
          </button>
          <p className="login-hint">Demo account — enter any password to continue</p>
        </div>
      </div>

      <nav className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div className="brand-name">Vaultline</div>
        </div>
        <button className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          Dashboard
        </button>
        <button className={`nav-item ${view === "send" ? "active" : ""}`} onClick={() => navigate("send")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Send Money
        </button>
        <button className={`nav-item ${view === "request" ? "active" : ""}`} onClick={() => navigate("request")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
          Request / Add
        </button>
        <button className={`nav-item ${view === "receive" ? "active" : ""}`} onClick={() => navigate("receive")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <line x1="14" y1="14" x2="14" y2="21" />
            <line x1="21" y1="14" x2="21" y2="21" />
            <line x1="14" y1="17.5" x2="21" y2="17.5" />
          </svg>
          Receive
        </button>
        <button className={`nav-item ${view === "scan" ? "active" : ""}`} onClick={() => navigate("scan")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
            <rect x="9" y="9" width="6" height="6" />
          </svg>
          Scan &amp; Pay
        </button>
        <button className={`nav-item ${view === "split" ? "active" : ""}`} onClick={() => navigate("split")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="9" r="3" />
            <circle cx="17" cy="9" r="3" />
            <path d="M2 21c0-3.5 2.7-6 6-6s6 2.5 6 6M11 21c0-3.5 2.7-6 6-6s5 2.5 5 6" />
          </svg>
          Split Bill
        </button>
        <button className={`nav-item ${view === "cards" ? "active" : ""}`} onClick={() => navigate("cards")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="5" width="22" height="14" rx="2.5" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          Cards
        </button>
        <button
          className={`nav-item ${view === "transactions" ? "active" : ""}`}
          onClick={() => navigate("transactions")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Transactions
        </button>
        <div className="nav-divider" />
        <button className={`nav-item ${view === "profile" ? "active" : ""}`} onClick={() => navigate("profile")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
          Profile
        </button>
        <div className="sidebar-footer">
          <div className="identity">
            <div className="avatar-sm">AK</div>
            <div>
              <div className="name">Aarav Kapoor</div>
              <div className="role">Personal account</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </nav>

      <main className="main">
        {/* DASHBOARD */}
        <section className={`view ${view === "dashboard" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Good to see you, Aarav</h1>
              <p>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>
            <div className="topbar-actions">
              <button className="btn btn-ghost" onClick={() => navigate("transactions")}>
                View ledger
              </button>
              <button className="btn btn-brass" onClick={() => navigate("send")}>
                Send money
              </button>
            </div>
          </div>

          <div className="dash-grid">
            <div className="balance-hero">
              <div className="balance-label">Total balance</div>
              <div className="balance-value">
                ${balInt}
                <span className="cents">.{balDec}</span>
              </div>
              <div className="balance-sub">↑ steady this week</div>
              <div className="hero-actions">
                <button
                  className="btn btn-brass btn-sm"
                  onClick={() => {
                    navigate("request");
                    setRequestTab("add");
                  }}
                >
                  + Add money
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("send")}>
                  Send
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate("request")}>
                  Request
                </button>
              </div>
            </div>

            <div className="quick-actions">
              <div className="qa-card" onClick={() => navigate("send")}>
                <div className="qa-icon" style={{ background: "rgba(76,140,134,0.18)", color: "var(--teal)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Send to a contact</div>
                  <div className="qa-desc">Instant transfer, no fees</div>
                </div>
              </div>
              <div className="qa-card" onClick={() => navigate("cards")}>
                <div className="qa-icon" style={{ background: "rgba(201,150,44,0.18)", color: "var(--brass-light)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="5" width="22" height="14" rx="2.5" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Manage cards</div>
                  <div className="qa-desc">Freeze, add or remove</div>
                </div>
              </div>
              <div className="qa-card" onClick={() => navigate("receive")}>
                <div className="qa-icon" style={{ background: "rgba(217,117,117,0.18)", color: "var(--coral)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Get your receive code</div>
                  <div className="qa-desc">Show your QR to get paid</div>
                </div>
              </div>
              <div className="qa-card" onClick={() => navigate("split")}>
                <div className="qa-icon" style={{ background: "rgba(107,127,215,0.18)", color: "#6B7FD7" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="8" cy="9" r="3" />
                    <circle cx="17" cy="9" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Split a bill</div>
                  <div className="qa-desc">Divide an expense with friends</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-head">
            <h2>Your cards</h2>
            <span className="link" onClick={() => navigate("cards")}>
              Manage all →
            </span>
          </div>
          <div className="card-row">
            {cards.map((c) => (
              <WalletCardVisual key={c.id} card={c} />
            ))}
          </div>

          <div className="section-head">
            <h2>Recent activity</h2>
            <span className="link" onClick={() => navigate("transactions")}>
              See all →
            </span>
          </div>
          <div className="ledger">
            {transactions.length === 0 ? (
              <div className="empty-state">No activity yet.</div>
            ) : (
              transactions.slice(0, 5).map((t) => <LedgerRow key={t.id} t={t} />)
            )}
          </div>
        </section>

        {/* SEND MONEY */}
        <section className={`view ${view === "send" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Send money</h1>
              <p>Transfers post instantly to a contact's wallet.</p>
            </div>
          </div>
          <div className="panel">
            <div className="field">
              <label>Choose a contact</label>
              <div className="contact-grid">
                {contacts.map((c) => (
                  <ContactPick
                    key={c.id}
                    contact={c}
                    selected={selectedContact === c.id}
                    onClick={() => setSelectedContact(c.id)}
                  />
                ))}
              </div>
            </div>
            <div className="field">
              <label>Amount</label>
              <div className="amount-input">
                <span>$</span>
                <input type="number" ref={sendAmountRef} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
            <div className="field">
              <label>Note (optional)</label>
              <input type="text" ref={sendNoteRef} placeholder="What's it for?" />
            </div>
            <button className="btn btn-brass btn-block" onClick={handleSend}>
              Send money
            </button>
          </div>
        </section>

        {/* REQUEST / ADD MONEY */}
        <section className={`view ${view === "request" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Request &amp; add money</h1>
              <p>Pull funds from a linked card or request from someone.</p>
            </div>
          </div>
          <div className="filter-bar">
            <button
              className={`chip-filter ${requestTab === "add" ? "active" : ""}`}
              onClick={() => setRequestTab("add")}
            >
              Add money
            </button>
            <button
              className={`chip-filter ${requestTab === "request" ? "active" : ""}`}
              onClick={() => setRequestTab("request")}
            >
              Request money
            </button>
          </div>

          {requestTab === "add" && (
            <div className="panel">
              <div className="field">
                <label>Funding source</label>
                <select ref={addSourceRef} defaultValue={cards[0]?.id || ""}>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.frozen}>
                      {c.issuer} •••• {c.last4}
                      {c.frozen ? " (frozen)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Amount</label>
                <div className="amount-input">
                  <span>$</span>
                  <input type="number" ref={addAmountRef} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <button className="btn btn-brass btn-block" onClick={handleAddMoney}>
                Add to balance
              </button>
            </div>
          )}

          {requestTab === "request" && (
            <div className="panel">
              <QrCode payload={requestPayload} loaded={qrLoaded} />
              <div className="field">
                <label>Amount to request</label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>From</label>
                <select ref={requestFromRef} defaultValue={contacts[0]?.id || ""}>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-brass btn-block" onClick={handleRequest}>
                Send request
              </button>
            </div>
          )}
        </section>

        {/* RECEIVE */}
        <section className={`view ${view === "receive" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Receive money</h1>
              <p>Share your code so anyone can pay you directly.</p>
            </div>
          </div>
          <div className="dash-grid">
            <div className="panel" style={{ maxWidth: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <QrCode
                  payload={receivePayload}
                  loaded={qrLoaded}
                  size={176}
                  style={{ width: "200px", height: "200px" }}
                />
                <div className="wallet-id-tag">{WALLET_ID}</div>
              </div>
              <div className="field" style={{ marginTop: "22px" }}>
                <label>Request a specific amount (optional)</label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={receiveAmount}
                    onChange={(e) => setReceiveAmount(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-ghost btn-block" onClick={copyWalletId}>
                  Copy wallet ID
                </button>
                <button className="btn btn-brass btn-block" onClick={simulateIncoming}>
                  Simulate incoming payment
                </button>
              </div>
            </div>
            <div className="quick-actions">
              <div className="qa-card">
                <div className="qa-icon" style={{ background: "rgba(76,140,134,0.18)", color: "var(--teal)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Code refreshes live</div>
                  <div className="qa-desc">Updates instantly when you set an amount</div>
                </div>
              </div>
              <div className="qa-card">
                <div className="qa-icon" style={{ background: "rgba(201,150,44,0.18)", color: "var(--brass-light)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Safe to share</div>
                  <div className="qa-desc">Only your wallet ID is encoded, never card details</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SCAN & PAY */}
        <section className={`view ${view === "scan" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Scan &amp; pay</h1>
              <p>Scan someone's receive code to pay them instantly.</p>
            </div>
          </div>
          <div className="panel" style={{ maxWidth: "460px" }}>
            <div className="scanner-frame">
              <video ref={videoRef} playsInline muted />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className="scanner-reticle" />
            </div>
            <p className="scanner-status">{scannerStatus}</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button className="btn btn-brass btn-block" onClick={toggleScanner}>
                {scannerRunning ? "Stop camera" : "Start camera"}
              </button>
              <button className="btn btn-ghost btn-block" onClick={simulateScan}>
                Simulate a scan
              </button>
            </div>
            <div className="field" style={{ marginTop: "18px" }}>
              <label>Or paste a code manually</label>
              <input type="text" ref={manualScanRef} placeholder='e.g. {"to":"VL-8842-AK","amount":25}' />
            </div>
            <button className="btn btn-ghost btn-block" onClick={processManualScan}>
              Use this code
            </button>
          </div>

          {scanResult && (
            <div className="panel" style={{ maxWidth: "460px", marginTop: "18px" }}>
              <div className="section-head" style={{ marginBottom: "14px" }}>
                <h2>Confirm payment</h2>
              </div>
              <div className="field">
                <label>Paying</label>
                <input type="text" value={scanResult.to} disabled readOnly />
              </div>
              <div className="field">
                <label>Amount</label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={scanResult.amount}
                    onChange={(e) => setScanResult({ ...scanResult, amount: e.target.value })}
                  />
                </div>
              </div>
              <button className="btn btn-brass btn-block" onClick={confirmScanPayment}>
                Confirm &amp; pay
              </button>
            </div>
          )}
        </section>

        {/* SPLIT BILL */}
        <section className={`view ${view === "split" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Split a bill</h1>
              <p>Divide an expense across your contacts and track who's paid.</p>
            </div>
          </div>
          <div className="dash-grid">
            <div className="panel" style={{ maxWidth: "100%" }}>
              <div className="field">
                <label>What's this for?</label>
                <input type="text" ref={splitDescRef} placeholder="e.g. Dinner at Sundown" />
              </div>
              <div className="field">
                <label>Total amount</label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={splitTotal}
                    onChange={(e) => setSplitTotal(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Split with</label>
                <div className="contact-grid">
                  {contacts.map((c) => (
                    <ContactPick
                      key={c.id}
                      contact={c}
                      selected={splitSelected.has(c.id)}
                      onClick={() => toggleSplitContact(c.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="filter-bar" style={{ marginBottom: "14px" }}>
                <button
                  className={`chip-filter ${splitMode === "equal" ? "active" : ""}`}
                  onClick={() => setSplitMode("equal")}
                >
                  Split equally
                </button>
                <button
                  className={`chip-filter ${splitMode === "custom" ? "active" : ""}`}
                  onClick={() => setSplitMode("custom")}
                >
                  Custom amounts
                </button>
              </div>
              <div>
                {splitIds.length === 0 ? (
                  <div className="empty-state" style={{ padding: "24px" }}>
                    Pick who's splitting this with you.
                  </div>
                ) : (
                  splitIds.map((id) => {
                    const c = contacts.find((x) => x.id === id);
                    const val =
                      splitMode === "equal" ? splitEqualShare.toFixed(2) : splitCustom[id] ?? "0.00";
                    return (
                      <div className="split-share-row" key={id}>
                        <div className="contact-avatar" style={{ background: c.color }}>
                          {initials(c.name)}
                        </div>
                        <div className="share-name">{c.name}</div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={val}
                          disabled={splitMode === "equal"}
                          onChange={(e) => setSplitCustomAmount(id, e.target.value)}
                        />
                      </div>
                    );
                  })
                )}
              </div>
              <button className="btn btn-brass btn-block" style={{ marginTop: "18px" }} onClick={createSplit}>
                Request from everyone
              </button>
            </div>
            <div className="quick-actions">
              <div className="qa-card">
                <div className="qa-icon" style={{ background: "rgba(217,117,117,0.18)", color: "var(--coral)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <div className="qa-title">Your share is covered</div>
                  <div className="qa-desc">You're automatically excluded from the request total</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-head">
            <h2>Split history</h2>
          </div>
          <div className="ledger">
            {splits.length === 0 ? (
              <div className="empty-state">No splits yet — create one above.</div>
            ) : (
              splits.map((split) => (
                <React.Fragment key={split.id}>
                  <div className="ledger-row" style={{ background: "var(--ink-elevated)", fontWeight: 600 }}>
                    <div className="tx-icon" style={{ background: "rgba(201,150,44,0.18)", color: "var(--brass-light)" }}>
                      🧾
                    </div>
                    <div className="tx-main">
                      <div className="tx-name">{split.desc}</div>
                      <div className="tx-meta">
                        {fmtDate(split.date)} · total ${fmtMoney(split.total)}
                      </div>
                    </div>
                  </div>
                  {split.shares.map((s) => {
                    const contact = contacts.find((c) => c.id === s.contactId);
                    return (
                      <div className="ledger-row" style={{ paddingLeft: "52px" }} key={s.contactId}>
                        <div
                          className="tx-icon"
                          style={{
                            width: "26px",
                            height: "26px",
                            fontSize: "10px",
                            background: contact.color + "22",
                            color: contact.color,
                          }}
                        >
                          {initials(contact.name)}
                        </div>
                        <div className="tx-main">
                          <div className="tx-name" style={{ fontWeight: 500 }}>
                            {contact.name}
                          </div>
                        </div>
                        <div className="tx-leader" />
                        <span
                          className={`split-status ${s.settled ? "settled" : "pending"}`}
                          style={{ marginRight: "10px" }}
                        >
                          {s.settled ? "Settled" : "Pending"}
                        </span>
                        <div className="tx-amount" style={{ width: "70px", textAlign: "right" }}>
                          ${fmtMoney(s.amount)}
                        </div>
                        {!s.settled && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ marginLeft: "10px" }}
                            onClick={() => settleSplit(split.id, contact.id)}
                          >
                            Mark paid
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </section>

        {/* CARDS */}
        <section className={`view ${view === "cards" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Your cards</h1>
              <p>Manage linked and virtual cards.</p>
            </div>
            <button className="btn btn-brass" onClick={handleAddCard}>
              + Add card
            </button>
          </div>
          <div className="card-row" style={{ flexWrap: "wrap" }}>
            {cards.map((c) => (
              <div key={c.id}>
                <WalletCardVisual card={c} />
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleFreeze(c.id)}>
                    {c.frozen ? "Unfreeze" : "Freeze"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeCard(c.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="wallet-card add-card" onClick={handleAddCard}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add a card
            </div>
          </div>
        </section>

        {/* TRANSACTIONS */}
        <section className={`view ${view === "transactions" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Transaction ledger</h1>
              <p>Every credit and debit on your wallet.</p>
            </div>
          </div>
          <div className="filter-bar">
            <button className={`chip-filter ${txFilter === "all" ? "active" : ""}`} onClick={() => setTxFilter("all")}>
              All
            </button>
            <button className={`chip-filter ${txFilter === "in" ? "active" : ""}`} onClick={() => setTxFilter("in")}>
              Money in
            </button>
            <button className={`chip-filter ${txFilter === "out" ? "active" : ""}`} onClick={() => setTxFilter("out")}>
              Money out
            </button>
            <input
              type="text"
              className="search-input"
              placeholder="Search transactions"
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
            />
          </div>
          <div className="ledger">
            {filteredTransactions.length === 0 ? (
              <div className="empty-state">Nothing matches that filter.</div>
            ) : (
              filteredTransactions.map((t) => <LedgerRow key={t.id} t={t} />)
            )}
          </div>
        </section>

        {/* PROFILE */}
        <section className={`view ${view === "profile" ? "active" : ""}`}>
          <div className="topbar">
            <div>
              <h1>Profile</h1>
              <p>Your account details.</p>
            </div>
          </div>
          <div className="panel">
            <div className="field">
              <label>Full name</label>
              <input type="text" defaultValue="Aarav Kapoor" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="text" defaultValue="aarav.kapoor@email.com" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="text" defaultValue="+91 98765 43210" />
            </div>
            <div className="field">
              <label>Wallet ID</label>
              <input type="text" defaultValue={WALLET_ID} disabled readOnly />
            </div>
            <button
              className="btn btn-ghost btn-block"
              style={{ marginTop: "8px", color: "var(--coral)", borderColor: "rgba(217,117,117,0.3)" }}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </section>
      </main>

      <div className={`toast ${toast.show ? "show" : ""}`}>{toast.message}</div>
    </div>
  );
}

/* ============================================================
   Styles (ported 1:1 from the original stylesheet, scoped
   under .vaultline-app so it can live inside any page)
   ============================================================ */
const CSS = `
.vaultline-app{
  --ink:#12141C;
  --ink-soft:#1B1E29;
  --ink-elevated:#232733;
  --brass:#C9962C;
  --brass-light:#E3B85C;
  --parchment:#EDE6D6;
  --parchment-dim:#D9D0BB;
  --teal:#4C8C86;
  --teal-soft:#3A6C67;
  --coral:#D97575;
  --text:#F5F3EE;
  --text-muted:#9B9BA8;
  --text-faint:#666B7A;
  --border:rgba(245,243,238,0.09);
  --border-strong:rgba(245,243,238,0.16);
  --radius:14px;
  background:var(--ink);
  color:var(--text);
  font-family:'IBM Plex Sans', sans-serif;
  min-height:100vh;
  display:flex;
  -webkit-font-smoothing:antialiased;
  position:relative;
}
.vaultline-app *{box-sizing:border-box;}
.vaultline-app ::selection{background:var(--brass); color:var(--ink);}
.vaultline-app button{font-family:inherit; cursor:pointer;}
.vaultline-app input, .vaultline-app select{font-family:inherit;}
.vaultline-app a{color:inherit; text-decoration:none;}

/* ---------- Sidebar ---------- */
.vaultline-app .sidebar{
  width:236px;
  flex-shrink:0;
  background:var(--ink-soft);
  border-right:1px solid var(--border);
  padding:28px 18px;
  display:flex;
  flex-direction:column;
  gap:6px;
  position:sticky;
  top:0;
  height:100vh;
}
.vaultline-app .brand{
  display:flex;
  align-items:center;
  gap:10px;
  padding:0 10px 26px 10px;
}
.vaultline-app .brand-mark{
  width:34px; height:34px;
  border-radius:9px;
  background:linear-gradient(135deg, var(--brass-light), var(--brass) 60%, #9c7220);
  display:flex; align-items:center; justify-content:center;
  font-family:'Fraunces', serif;
  font-weight:700;
  font-size:17px;
  color:var(--ink);
  box-shadow:0 4px 14px rgba(201,150,44,0.25);
}
.vaultline-app .brand-name{
  font-family:'Fraunces', serif;
  font-size:19px;
  font-weight:600;
  letter-spacing:0.2px;
}
.vaultline-app .nav-item{
  display:flex;
  align-items:center;
  gap:12px;
  padding:11px 12px;
  border-radius:10px;
  color:var(--text-muted);
  font-size:14.5px;
  font-weight:500;
  border:none;
  background:none;
  text-align:left;
  width:100%;
  transition:background .15s ease, color .15s ease;
}
.vaultline-app .nav-item svg{width:18px; height:18px; flex-shrink:0; opacity:0.85;}
.vaultline-app .nav-item:hover{background:var(--ink-elevated); color:var(--text);}
.vaultline-app .nav-item.active{background:var(--ink-elevated); color:var(--brass-light);}
.vaultline-app .nav-item.active svg{opacity:1;}
.vaultline-app .nav-divider{height:1px; background:var(--border); margin:14px 4px;}
.vaultline-app .sidebar-footer{
  margin-top:auto;
  padding:12px 10px 0 10px;
  border-top:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:10px;
}
.vaultline-app .sidebar-footer .identity{display:flex; align-items:center; gap:10px; flex:1; min-width:0;}
.vaultline-app .avatar-sm{
  width:32px; height:32px; border-radius:50%;
  background:var(--teal);
  display:flex; align-items:center; justify-content:center;
  font-size:12.5px; font-weight:600;
  flex-shrink:0;
}
.vaultline-app .sidebar-footer .name{font-size:13.5px; font-weight:600;}
.vaultline-app .sidebar-footer .role{font-size:11.5px; color:var(--text-faint);}
.vaultline-app .logout-btn{
  width:32px; height:32px; border-radius:9px;
  background:transparent; border:1px solid var(--border-strong);
  display:flex; align-items:center; justify-content:center;
  color:var(--text-faint); flex-shrink:0;
  transition:background .15s ease, color .15s ease, border-color .15s ease;
}
.vaultline-app .logout-btn svg{width:15px; height:15px;}
.vaultline-app .logout-btn:hover{background:rgba(217,117,117,0.14); color:var(--coral); border-color:rgba(217,117,117,0.3);}

/* ---------- Main ---------- */
.vaultline-app .main{flex:1; padding:32px 40px 60px 40px; max-width:1180px;}
.vaultline-app .view{display:none; animation:vaultlineFadeIn .35s ease;}
.vaultline-app .view.active{display:block;}
@keyframes vaultlineFadeIn{from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);}}

.vaultline-app .topbar{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:30px;
}
.vaultline-app .topbar h1{
  font-family:'Fraunces', serif;
  font-size:26px;
  font-weight:600;
}
.vaultline-app .topbar p{color:var(--text-muted); font-size:13.5px; margin-top:3px;}
.vaultline-app .topbar-actions{display:flex; gap:10px;}

.vaultline-app .btn{
  border-radius:10px;
  padding:10px 16px;
  font-size:13.5px;
  font-weight:600;
  border:1px solid var(--border-strong);
  background:var(--ink-elevated);
  color:var(--text);
  display:inline-flex; align-items:center; gap:8px;
  transition:transform .12s ease, background .15s ease, border-color .15s ease;
}
.vaultline-app .btn:hover{background:#2A2F3D; border-color:rgba(245,243,238,0.24);}
.vaultline-app .btn:active{transform:scale(0.97);}
.vaultline-app .btn-brass{
  background:linear-gradient(135deg, var(--brass-light), var(--brass));
  color:var(--ink);
  border:none;
}
.vaultline-app .btn-brass:hover{filter:brightness(1.06); background:linear-gradient(135deg, var(--brass-light), var(--brass));}
.vaultline-app .btn-ghost{background:transparent; border:1px solid var(--border-strong);}
.vaultline-app .btn-block{width:100%; justify-content:center;}
.vaultline-app .btn-sm{padding:7px 12px; font-size:12.5px;}
.vaultline-app .btn svg{width:15px; height:15px;}

/* ---------- Dashboard grid ---------- */
.vaultline-app .dash-grid{display:grid; grid-template-columns:1.15fr 0.85fr; gap:22px; margin-bottom:24px;}

.vaultline-app .balance-hero{
  background:radial-gradient(circle at 15% 20%, #232838, var(--ink-soft) 70%);
  border:1px solid var(--border);
  border-radius:20px;
  padding:30px 32px;
  position:relative;
  overflow:hidden;
}
.vaultline-app .balance-hero::after{
  content:"";
  position:absolute; right:-60px; top:-60px;
  width:220px; height:220px; border-radius:50%;
  background:radial-gradient(circle, rgba(201,150,44,0.16), transparent 70%);
}
.vaultline-app .balance-label{
  font-size:12.5px; text-transform:uppercase; letter-spacing:1.2px;
  color:var(--text-faint); font-weight:600; margin-bottom:10px;
}
.vaultline-app .balance-value{
  font-family:'Fraunces', serif;
  font-size:52px;
  font-weight:600;
  letter-spacing:-1px;
  display:flex; align-items:baseline; gap:2px;
}
.vaultline-app .balance-value .cents{font-size:26px; color:var(--text-muted); font-family:'IBM Plex Mono', monospace;}
.vaultline-app .balance-sub{
  margin-top:10px; font-size:13px; color:var(--teal); font-weight:500;
  display:flex; align-items:center; gap:6px;
}
.vaultline-app .hero-actions{display:flex; gap:10px; margin-top:26px;}

.vaultline-app .quick-actions{display:flex; flex-direction:column; gap:12px;}
.vaultline-app .qa-card{
  background:var(--ink-soft);
  border:1px solid var(--border);
  border-radius:16px;
  padding:16px 18px;
  display:flex; align-items:center; gap:14px;
  transition:border-color .15s ease, transform .12s ease;
  cursor:pointer;
}
.vaultline-app .qa-card:hover{border-color:var(--border-strong); transform:translateX(2px);}
.vaultline-app .qa-icon{
  width:38px; height:38px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.vaultline-app .qa-icon svg{width:18px; height:18px;}
.vaultline-app .qa-title{font-size:13.5px; font-weight:600;}
.vaultline-app .qa-desc{font-size:11.5px; color:var(--text-faint); margin-top:2px;}

/* ---------- Cards carousel ---------- */
.vaultline-app .section-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;}
.vaultline-app .section-head h2{font-family:'Fraunces', serif; font-size:18px; font-weight:600;}
.vaultline-app .section-head .link{font-size:12.5px; color:var(--brass-light); font-weight:600; cursor:pointer;}

.vaultline-app .card-row{display:flex; gap:16px; overflow-x:auto; padding-bottom:8px; margin-bottom:30px;}
.vaultline-app .wallet-card{
  min-width:290px; height:172px;
  border-radius:16px;
  padding:20px 22px;
  position:relative;
  color:var(--ink);
  flex-shrink:0;
  display:flex; flex-direction:column; justify-content:space-between;
  box-shadow:0 10px 30px rgba(0,0,0,0.35);
  overflow:hidden;
}
.vaultline-app .wallet-card.frozen{filter:grayscale(0.85) brightness(0.7);}
.vaultline-app .wallet-card::before{
  content:"";
  position:absolute; inset:0;
  background:repeating-linear-gradient(115deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 6px);
  mix-blend-mode:overlay;
}
.vaultline-app .card-brand-row{display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1;}
.vaultline-app .card-issuer{font-family:'Fraunces', serif; font-weight:700; font-size:15px;}
.vaultline-app .chip{width:34px; height:24px; border-radius:5px; background:linear-gradient(135deg, #ffe9b8, #c9962c);}
.vaultline-app .card-number{
  font-family:'IBM Plex Mono', monospace;
  font-size:16.5px; letter-spacing:2px; font-weight:500;
  position:relative; z-index:1;
}
.vaultline-app .card-foot{display:flex; justify-content:space-between; align-items:flex-end; position:relative; z-index:1;}
.vaultline-app .card-holder{font-size:11px; text-transform:uppercase; letter-spacing:0.8px; font-weight:600;}
.vaultline-app .card-expiry{font-family:'IBM Plex Mono', monospace; font-size:12px;}
.vaultline-app .frozen-badge{
  position:absolute; top:18px; right:18px; z-index:2;
  background:rgba(18,20,28,0.75); color:var(--text);
  font-size:10px; font-weight:700; letter-spacing:0.5px;
  padding:4px 8px; border-radius:6px; text-transform:uppercase;
}
.vaultline-app .wallet-card.add-card{
  background:var(--ink-soft);
  border:1.5px dashed var(--border-strong);
  color:var(--text-muted);
  align-items:center; justify-content:center;
  flex-direction:row; gap:8px;
  font-size:13px; font-weight:600;
  cursor:pointer;
}
.vaultline-app .wallet-card.add-card:hover{border-color:var(--brass); color:var(--brass-light);}

/* ---------- Ledger / Transactions ---------- */
.vaultline-app .ledger{
  background:var(--ink-soft);
  border:1px solid var(--border);
  border-radius:16px;
  overflow:hidden;
}
.vaultline-app .ledger-row{
  display:flex; align-items:center; gap:14px;
  padding:14px 20px;
  border-bottom:1px solid var(--border);
}
.vaultline-app .ledger-row:last-child{border-bottom:none;}
.vaultline-app .tx-icon{
  width:36px; height:36px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; font-size:14px; font-weight:700;
}
.vaultline-app .tx-main{flex:1; min-width:0;}
.vaultline-app .tx-name{font-size:13.5px; font-weight:600;}
.vaultline-app .tx-meta{font-size:11.5px; color:var(--text-faint); margin-top:2px;}
.vaultline-app .tx-leader{
  flex:1; border-bottom:1px dotted var(--border-strong);
  margin:0 10px; min-width:20px; height:1px; align-self:center;
}
.vaultline-app .tx-amount{
  font-family:'IBM Plex Mono', monospace;
  font-size:14px; font-weight:600; white-space:nowrap;
}
.vaultline-app .tx-amount.pos{color:var(--teal);}
.vaultline-app .tx-amount.neg{color:var(--coral);}

.vaultline-app .filter-bar{display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap; align-items:center;}
.vaultline-app .chip-filter{
  padding:7px 14px; border-radius:20px; font-size:12.5px; font-weight:600;
  background:var(--ink-soft); border:1px solid var(--border); color:var(--text-muted);
}
.vaultline-app .chip-filter.active{background:var(--brass); color:var(--ink); border-color:var(--brass);}
.vaultline-app .search-input{
  margin-left:auto;
  background:var(--ink-soft); border:1px solid var(--border);
  border-radius:20px; padding:8px 16px; font-size:12.5px; color:var(--text);
  width:220px;
}
.vaultline-app .search-input:focus{outline:none; border-color:var(--brass);}

/* ---------- Forms / panels ---------- */
.vaultline-app .panel{
  background:var(--ink-soft);
  border:1px solid var(--border);
  border-radius:18px;
  padding:28px 30px;
  max-width:460px;
}
.vaultline-app .field{margin-bottom:18px;}
.vaultline-app .field label{
  display:block; font-size:12px; font-weight:600; color:var(--text-muted);
  margin-bottom:7px; text-transform:uppercase; letter-spacing:0.6px;
}
.vaultline-app .field input, .vaultline-app .field select, .vaultline-app .field textarea{
  width:100%; background:var(--ink-elevated); border:1px solid var(--border-strong);
  border-radius:10px; padding:12px 14px; font-size:14px; color:var(--text);
}
.vaultline-app .field input:focus, .vaultline-app .field select:focus, .vaultline-app .field textarea:focus{outline:none; border-color:var(--brass);}
.vaultline-app .amount-input{position:relative;}
.vaultline-app .amount-input span{position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-family:'IBM Plex Mono',monospace;}
.vaultline-app .amount-input input{padding-left:28px; font-family:'IBM Plex Mono', monospace; font-size:20px; font-weight:600;}

.vaultline-app .contact-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px;}
.vaultline-app .contact-pick{
  background:var(--ink-elevated); border:1.5px solid transparent; border-radius:12px;
  padding:12px 8px; display:flex; flex-direction:column; align-items:center; gap:8px;
  font-size:11px; text-align:center; cursor:pointer;
}
.vaultline-app .contact-pick.selected{border-color:var(--brass);}
.vaultline-app .contact-avatar{
  width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:var(--ink);
}

.vaultline-app .toast{
  position:fixed; bottom:26px; left:50%; transform:translateX(-50%) translateY(20px);
  background:var(--brass); color:var(--ink); font-weight:600; font-size:13.5px;
  padding:13px 22px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.4);
  opacity:0; pointer-events:none; transition:all .3s ease; z-index:300;
}
.vaultline-app .toast.show{opacity:1; transform:translateX(-50%) translateY(0);}

.vaultline-app .request-qr{
  width:180px; height:180px; margin:0 auto 18px auto; border-radius:14px;
  background:var(--parchment); padding:12px; display:flex; align-items:center; justify-content:center;
}
.vaultline-app .request-qr img, .vaultline-app .request-qr canvas, .vaultline-app .request-qr table{border-radius:6px; max-width:100%; height:auto;}
.vaultline-app .wallet-id-tag{
  font-family:'IBM Plex Mono', monospace; font-size:13px; letter-spacing:1.5px;
  color:var(--brass-light); margin-top:12px; font-weight:600;
}

/* ---------- Scanner ---------- */
.vaultline-app .scanner-frame{
  position:relative; width:100%; aspect-ratio:1/1; max-height:320px;
  background:#000; border-radius:14px; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}
.vaultline-app .scanner-frame video{width:100%; height:100%; object-fit:cover;}
.vaultline-app .scanner-reticle{
  position:absolute; inset:14%; border:2px solid var(--brass-light);
  border-radius:16px; box-shadow:0 0 0 2000px rgba(0,0,0,0.35);
  pointer-events:none;
}
.vaultline-app .scanner-status{
  margin-top:12px; font-size:12.5px; color:var(--text-faint); text-align:center;
}

/* ---------- Split bill ---------- */
.vaultline-app .split-share-row{
  display:flex; align-items:center; gap:12px;
  padding:10px 0; border-bottom:1px solid var(--border);
}
.vaultline-app .split-share-row:last-child{border-bottom:none;}
.vaultline-app .split-share-row .contact-avatar{width:30px; height:30px; font-size:11px;}
.vaultline-app .split-share-row .share-name{flex:1; font-size:13.5px; font-weight:600;}
.vaultline-app .split-share-row input{
  width:96px; background:var(--ink-elevated); border:1px solid var(--border-strong);
  border-radius:8px; padding:8px 10px; font-family:'IBM Plex Mono', monospace; font-size:13px; color:var(--text);
  text-align:right;
}
.vaultline-app .split-status{
  font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;
  padding:4px 9px; border-radius:20px;
}
.vaultline-app .split-status.pending{background:rgba(217,117,117,0.18); color:var(--coral);}
.vaultline-app .split-status.settled{background:rgba(76,140,134,0.18); color:var(--teal);}

.vaultline-app .empty-state{
  text-align:center; padding:50px 20px; color:var(--text-faint);
}
.vaultline-app .empty-state svg{width:38px; height:38px; margin-bottom:12px; opacity:0.5;}

/* ---------- Login ---------- */
.vaultline-app .login-screen{
  position:fixed; inset:0; z-index:500;
  background:radial-gradient(circle at 20% 15%, #1c2130, var(--ink) 65%);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
}
.vaultline-app .login-screen.hidden{display:none;}
.vaultline-app .login-card{
  width:100%; max-width:380px;
  background:var(--ink-soft);
  border:1px solid var(--border);
  border-radius:20px;
  padding:36px 32px 30px 32px;
  box-shadow:0 24px 60px rgba(0,0,0,0.45);
}
.vaultline-app .login-brand{display:flex; align-items:center; gap:10px; margin-bottom:22px;}
.vaultline-app .login-tagline{color:var(--text-muted); font-size:13.5px; margin-bottom:24px;}
.vaultline-app .login-error{
  color:var(--coral); font-size:12.5px; font-weight:600;
  min-height:16px; margin:-6px 0 12px 0;
}
.vaultline-app .login-hint{
  text-align:center; color:var(--text-faint); font-size:11.5px;
  margin-top:16px;
}

@media(max-width:900px){
  .vaultline-app .sidebar{display:none;}
  .vaultline-app .main{padding:22px;}
  .vaultline-app .dash-grid{grid-template-columns:1fr;}
  .vaultline-app .contact-grid{grid-template-columns:repeat(3,1fr);}
}
`;