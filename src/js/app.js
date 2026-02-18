// --- CONFIGURATION & CONSTANTS ---
const CONFIG = {
    DB_NAME: "FinanceDashDB",
    STORE_NAME: "transactions",
    DB_VERSION: 5,
    // Fallbacks
    DEFAULT_CATEGORY_RULES: {
        "Food": ["swiggy", "zomato", "restaurant", "cafe", "coffee", "tea", "burger", "pizza", "biryani", "mcdonalds", "kfc", "domino", "eat", "dhaba", "sweet", "baker", "cake", "blinkit", "zepto", "instamart", "bigbasket", "starbucks", "subway", "taco bell", "haldiram", "chaayos", "burger king", "dining", "lunch", "dinner", "grocery"],
        "Transport": ["uber", "ola", "rapido", "fuel", "petrol", "diesel", "parking", "toll", "metro", "cab", "auto", "ride", "hpcl", "bpcl", "indian oil", "fastag", "yulu", "bounce", "shell", "essar", "nayara", "irctc", "indigo", "air india", "vistara", "akasa", "bus", "train"],
        "Shopping": ["amazon", "flipkart", "myntra", "zara", "h&m", "retail", "store", "fashion", "cloth", "ajio", "decathlon", "nike", "adidas", "puma", "uniqlo", "reliance", "trends", "pantaloons", "westside", "max", "zudio", "mall", "nykaa", "meesho", "dmart", "reliance digital", "croma"],
        "Utilities": ["electricity", "water", "bill", "recharge", "jio", "airtel", "vi", "bsnl", "tatasky", "bescom", "bwssb", "discom", "power", "gas", "cylinder", "indane", "bharatgas", "vodafone", "broadband", "act", "hathway", "excitel", "hotstar", "apple", "google", "ebill"],
        "Medical": ["pharmacy", "doctor", "hospital", "clinic", "med", "health", "lab", "1mg", "apollo", "practo", "netmeds", "diagnostics", "scan", "mri", "x-ray", "dental", "optical", "pathology"],
        "Rent": ["rent", "landlord", "tolet", "maintenance", "deposit", "broker", "nestaway", "nobroker", "housing", "brokerage", "lease"],
        "Salary": ["salary", "stipend", "payroll", "bonus", "incentive", "arrears", "wages", "reimbursement", "refund", "cashback", "interest", "dividend"],
        "Transfer": ["transfer", "neft", "imps", "rtgs", "p2p", "remittance"],
        "Investment": ["zerodha", "groww", "kite", "sip", "mutual fund", "stocks", "nse", "bse", "coin"],
        "Education": ["school", "college", "university", "tuition", "course", "udemy", "coursera", "edx", "skillshare", "books", "stationery", "fee"],
        "Credit Card": ["credit card", "cc payment", "sbi card", "hdfc card", "icici card", "axis card", "kotak card", "amex", "visa", "mastercard"]
    },
    knownPersons: [], // Will be loaded from DB
    CHART_COLORS: {
        income: '#10b981',
        expense: '#ef4444',
        netFlow: '#6366f1',
        forecastIncome: '#10b981',
        forecastExpense: '#ef4444',
        palette: [
            '#64748b', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#6366f1',
            '#ec4899', '#84cc16', '#14b8a6', '#f97316'
        ]
    },
    DEFAULT_KNOWN_PERSONS: [
        "Chandrak", "Chandrakant", "Saksham", "Ankit", "Shalini", "Pratap",
        "Pooja Sahu", "Usha Vij", "Nikhil M", "Dinesh K", "Suraj S H",
        "Rutuja J", "Jayant R", "Mohan L A", "Rahul", "Amit", "Priya",
        "Suresh", "Ramesh", "Maid", "Driver", "Landlord", "Cook", "Gardener",
        "Security", "Milkman", "Paperboy", "Laundry", "Car Wash"
    ],
    BUDGET_LIMITS: {
        "Food": 5000, "Transport": 3000, "Shopping": 8000, "Utilities": 2000, "Medical": 2000, "Misc": 5000,
        "Investment": 15000, "Education": 5000, "Entertainment": 3000, "Taxes": 5000
    }
};

// --- Accessibility enhancements ---
(function () {
    document.addEventListener('keydown', function (e) {
        const el = document.activeElement;
        if (!el) return;
        const role = el.getAttribute && el.getAttribute('role');

        // Activate Enter/Space for elements with role="button"
        if ((e.key === 'Enter' || e.key === ' ') && role === 'button') {
            e.preventDefault();
            try { el.click && el.click(); } catch (err) { }
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }

        // Left/Right arrow navigation for tab-like controls
        if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && el.classList && el.classList.contains('nav-tab')) {
            const nav = el.parentElement;
            if (!nav) return;
            const items = Array.from(nav.querySelectorAll('.nav-tab'));
            const idx = items.indexOf(el);
            let next = idx;
            if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
            if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
            items[next].focus();
        }
    });

    // Ensure role=button elements also respond on keyup for compatibility
    document.querySelectorAll('.nav-item[role="button"], .nav-tab[role="button"]').forEach(el => {
        el.addEventListener('keyup', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); }
        });
    });
})();

// --- UTILITIES ---
const Utils = {
    escapeHtml: (text) => {
        if (!text) return "";
        return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),

    // Generates a deterministic ID based on content to prevent duplicates within a file
    generateRowId: (r, index, salt = '') => {
        const str = `${r.Date}|${r.Description}|${r.Debit}|${r.Credit}|${index}|${salt}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'tx_' + Math.abs(hash).toString(36) + index;
    },

    // Tagged template for safe HTML construction
    html: (strings, ...values) => {
        return strings.reduce((prev, curr, i) => {
            let val = values[i] !== undefined ? values[i] : '';
            // If the value is already marked as safe, don't escape
            if (val && val.__isSafe) val = val.content;
            else val = Utils.escapeHtml(val);
            return prev + curr + val;
        }, '');
    },

    safe: (content) => ({ content, __isSafe: true }),




    formatCurrency: (value) => {
        if (value === undefined || value === null) return "0";
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
    },
    parseDate: (val) => {
        if (!val) return null;
        if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000));
        const str = String(val).trim();
        // Support DD.MM.YYYY or YYYY.MM.DD
        const dot = str.match(/^(\d{2,4})[\.](\d{1,2})[\.](\d{2,4})/);
        if (dot) {
            if (dot[1].length === 4) return new Date(dot[1], dot[2] - 1, dot[3]); // YYYY.MM.DD
            return new Date(dot[3], dot[2] - 1, dot[1]); // DD.MM.YYYY
        }
        const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmy) return new Date(dmy[3], dmy[2] - 1, dmy[1]);
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d; // Return valid date or null
    },
    cleanAmount: (val) => {
        if (typeof val === 'number') return val;
        // Handle thousands separators (commas) and ensure robust parsing
        const str = String(val || "").replace(/,/g, '').trim();
        return Number(str.replace(/[^0-9.-]/g, "")) || 0;
    },
    debounce: (func, wait) => {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    // Validation Helpers
    isValidAmount: (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
    },
    cleanDesc: (desc) => {
        if (!desc) return "";
        return String(desc)
            .replace(/[0-9]{5,}/g, '') // Remove long IDs/Numbers
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .replace(/UPI\-|TRANSFER\-|NEFT\-|IMPS\-|RTGS\-/gi, '') // Remove transaction prefix
            .replace(/[\*\/\-]/g, ' ') // Remove special chars
            .trim();
    },
    getIconForDescription: (desc) => {
        const d = desc.toLowerCase();
        if (d.includes('swiggy') || d.includes('zomato') || d.includes('eat') || d.includes('food')) return 'fa-utensils';
        if (d.includes('uber') || d.includes('ola') || d.includes('rapido') || d.includes('cab')) return 'fa-car';
        if (d.includes('amazon') || d.includes('flipkart') || d.includes('shop')) return 'fa-shopping-bag';
        if (d.includes('netflix') || d.includes('prime') || d.includes('spotify') || d.includes('youtube')) return 'fa-play-circle';
        if (d.includes('salary') || d.includes('payroll')) return 'fa-wallet';
        if (d.includes('rent')) return 'fa-home';
        if (d.includes('kite') || d.includes('zerodha') || d.includes('stock') || d.includes('investment')) return 'fa-chart-line';
        if (d.includes('recharge') || d.includes('jio') || d.includes('airtel') || d.includes('electricity')) return 'fa-bolt';
        if (d.includes('hospital') || d.includes('pharmacy') || d.includes('med')) return 'fa-hand-holding-medical';
        return 'fa-circle-dot'; // Default icon
    },
    getIconForCategory: (cat) => {
        const c = cat.toLowerCase();
        if (c.includes('food') || c.includes('dining')) return 'fa-utensils';
        if (c.includes('transport') || c.includes('travel')) return 'fa-car-side';
        if (c.includes('shop')) return 'fa-bag-shopping';
        if (c.includes('util') || c.includes('bill')) return 'fa-file-invoice-dollar';
        if (c.includes('sal') || c.includes('income')) return 'fa-wallet';
        if (c.includes('invest')) return 'fa-chart-pie';
        if (c.includes('educ')) return 'fa-graduation-cap';
        if (c.includes('entert')) return 'fa-film';
        if (c.includes('med') || c.includes('health')) return 'fa-heart-pulse';
        if (c.includes('rent')) return 'fa-house-user';
        return 'fa-tags';
    },
    mapHeaders: (row) => {
        const mapping = {
            Date: ["txn date", "value date", "date", "txn_date", "v_date"],
            Description: ["description", "particulars", "narration", "remarks", "reference"],
            Debit: ["debit", "withdrawal", "outflow", "dr", "amount_dr"],
            Credit: ["credit", "deposit", "inflow", "cr", "amount_cr", "amount"]
        };
        const normalized = {};
        const keys = Object.keys(row);
        for (const [target, aliases] of Object.entries(mapping)) {
            const found = keys.find(k => aliases.includes(k.toLowerCase().trim()));
            normalized[target] = found ? row[found] : (target === "Debit" || target === "Credit" ? 0 : "");
        }
        return normalized;
    }
};

// --- PERSISTENCE LAYER ---
const DB = {
    dbPromise: null,

    async open() {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
            request.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    const store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: "id", autoIncrement: true });
                    store.createIndex("datasetId", "datasetId", { unique: false });
                }
                if (!db.objectStoreNames.contains("datasets")) {
                    db.createObjectStore("datasets", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("rules")) {
                    db.createObjectStore("rules", { keyPath: "type" });
                }
            };
            request.onsuccess = e => {
                const db = e.target.result;
                db.onclose = () => { this.dbPromise = null; };
                resolve(db);
            };
            request.onerror = e => {
                this.dbPromise = null;
                reject(e.target.error);
            };
        });
        return this.dbPromise;
    },

    async performTransaction(storeNames, mode, callback) {
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeNames, mode);
                tx.onerror = (e) => reject(e.target.error);
                tx.oncomplete = () => resolve();

                // If callback returns a promise (e.g. for reading), we might want to wait for it? 
                // Standard IDB transactions auto-commit when microtask queue is empty.
                // We just execute the callback logic.
                const result = callback(tx);

                // If the operation is read-only and returns data, we should resolve with that data.
                if (result && result instanceof Promise) {
                    result.then(resolve).catch(reject);
                } else if (mode === 'readonly' && result) {
                    // For synchronous read requests in callback
                    // This pattern might need adjustment depending on usage.
                    // But simpler pattern: let tx.oncomplete resolve.
                }
            });
        } catch (err) {
            console.error("DB Transaction Error:", err);
            UIManager.showToast(`Database Error: ${err.message}`, "error");
            throw err;
        }
    },

    // Helper for simple read operations
    async readOne(storeName, key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const req = tx.objectStore(storeName).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async readAll(storeName) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const req = tx.objectStore(storeName).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async saveDataset(metadata, rows, onProgress) {
        // 1. Save Metadata
        await this.performTransaction("datasets", "readwrite", (tx) => {
            tx.objectStore("datasets").put(metadata);
        });

        // 2. Save Rows in Chunks (to prevent UI freeze and allow progress update)
        if (!rows || rows.length === 0) return;

        const CHUNK_SIZE = 500;
        const total = rows.length;
        let processed = 0;

        for (let i = 0; i < total; i += CHUNK_SIZE) {
            const chunk = rows.slice(i, i + CHUNK_SIZE);
            await this.performTransaction(CONFIG.STORE_NAME, "readwrite", (tx) => {
                const store = tx.objectStore(CONFIG.STORE_NAME);
                chunk.forEach(r => store.put(r));
            });

            processed += chunk.length;
            if (onProgress) onProgress((processed / total) * 100);

            // Yield to UI loop to let DOM update
            await new Promise(r => setTimeout(r, 10));
        }
    },

    async getDatasets() {
        return this.readAll("datasets");
    },

    async loadTransactions(datasetId) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(CONFIG.STORE_NAME, "readonly");
            const store = tx.objectStore(CONFIG.STORE_NAME);
            const indexNames = Array.from(store.indexNames || []);
            if (indexNames.includes('datasetId')) {
                const index = store.index("datasetId");
                const req = index.getAll(IDBKeyRange.only(datasetId));
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            } else {
                // Index missing in existing DB schema — fallback to scanning all records
                const req = store.getAll();
                req.onsuccess = () => {
                    try {
                        const rows = req.result || [];
                        const filtered = rows.filter(r => r && r.datasetId === datasetId);
                        resolve(filtered);
                    } catch (err) {
                        reject(err);
                    }
                };
                req.onerror = () => reject(req.error);
            }
        });
    },

    async deleteDataset(datasetId) {
        return this.performTransaction([CONFIG.STORE_NAME, "datasets"], "readwrite", (tx) => {
            tx.objectStore("datasets").delete(datasetId);
            const txnStore = tx.objectStore(CONFIG.STORE_NAME);
            const indexNames = Array.from(txnStore.indexNames || []);
            if (indexNames.includes('datasetId')) {
                const index = txnStore.index("datasetId");
                const req = index.openKeyCursor(IDBKeyRange.only(datasetId));
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };
            } else {
                // Fallback: scan all records and delete those matching datasetId
                const req = txnStore.openCursor();
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        try {
                            if (cursor.value && cursor.value.datasetId === datasetId) cursor.delete();
                        } catch (err) { /* ignore malformed records */ }
                        cursor.continue();
                    }
                };
            }
        });
    },

    async deleteTransactions(ids) {
        return this.performTransaction(CONFIG.STORE_NAME, "readwrite", (tx) => {
            const store = tx.objectStore(CONFIG.STORE_NAME);
            ids.forEach(id => store.delete(id));
        });
    },

    async getRules() {
        return this.readAll("rules");
    },

    async saveRule(doc) {
        return this.performTransaction("rules", "readwrite", (tx) => {
            tx.objectStore("rules").put(doc);
        });
    }
};

// --- RULES MANAGER ---
const RulesManager = {
    state: {
        categories: {},
        persons: [],
        revenue: { admission: 10000, installment: 7000 }
    },
    async init() {
        const rules = await DB.getRules();
        const catRule = rules.find(r => r.type === 'category_rules');
        const perRule = rules.find(r => r.type === 'known_persons');
        const revRule = rules.find(r => r.type === 'revenue_logic');

        if (catRule) {
            this.state.categories = catRule.data;
            let changed = false;
            // Migration: Rename Bills -> Utilities, Health -> Medical
            if (this.state.categories["Travel"]) {
                if (!this.state.categories["Transport"]) this.state.categories["Transport"] = [];
                this.state.categories["Transport"] = [...new Set([...this.state.categories["Transport"], ...this.state.categories["Travel"]])];
                delete this.state.categories["Travel"];
                changed = true;
            }
            if (this.state.categories["Bills"]) {
                if (!this.state.categories["Utilities"]) this.state.categories["Utilities"] = [];
                this.state.categories["Utilities"] = [...new Set([...this.state.categories["Utilities"], ...this.state.categories["Bills"]])];
                delete this.state.categories["Bills"];
                changed = true;
            }
            if (this.state.categories["Health"]) {
                if (!this.state.categories["Medical"]) this.state.categories["Medical"] = [];
                this.state.categories["Medical"] = [...new Set([...this.state.categories["Medical"], ...this.state.categories["Health"]])];
                delete this.state.categories["Health"];
                changed = true;
            }

            // Sync logic: Ensure ALL defaults from CONFIG exist in persistent state
            for (const [cat, keywords] of Object.entries(CONFIG.DEFAULT_CATEGORY_RULES)) {
                if (!this.state.categories[cat]) {
                    this.state.categories[cat] = [...keywords];
                    changed = true;
                } else {
                    keywords.forEach(k => {
                        if (!this.state.categories[cat].includes(k)) {
                            this.state.categories[cat].push(k);
                            changed = true;
                        }
                    });
                }
            }
            if (changed) await DB.saveRule({ type: 'category_rules', data: this.state.categories });
        } else {
            this.state.categories = CONFIG.DEFAULT_CATEGORY_RULES;
            await DB.saveRule({ type: 'category_rules', data: this.state.categories });
        }

        if (perRule) {
            this.state.persons = perRule.data;
            // Merge new persons
            let changed = false;
            for (const p of CONFIG.DEFAULT_KNOWN_PERSONS) {
                if (!this.state.persons.includes(p)) {
                    this.state.persons.push(p);
                    changed = true;
                }
            }
            if (changed) await DB.saveRule({ type: 'known_persons', data: this.state.persons });
        } else {
            this.state.persons = CONFIG.DEFAULT_KNOWN_PERSONS;
            await DB.saveRule({ type: 'known_persons', data: this.state.persons });
        }

        if (revRule) {
            this.state.revenue = { ...this.state.revenue, ...revRule.data };
        } else await DB.saveRule({ type: 'revenue_logic', data: this.state.revenue });

        await this.cleanupRules();
    },

    async cleanupRules() {
        let changed = false;
        // Specific cleanup: Remove "upi" and "food:-zomato" if they exist as categories or keywords
        const problematicWords = ["upi", "food:-zomato"];

        problematicWords.forEach(word => {
            if (this.state.categories[word]) {
                delete this.state.categories[word];
                changed = true;
            }
        });

        for (const cat in this.state.categories) {
            const oldLen = this.state.categories[cat].length;
            this.state.categories[cat] = this.state.categories[cat].filter(k => !problematicWords.includes(k));
            if (this.state.categories[cat].length !== oldLen) changed = true;
        }

        if (changed) {
            await DB.saveRule({ type: 'category_rules', data: this.state.categories });
        }
    },

    categorize(desc) {
        const d = String(desc).toLowerCase();
        for (const [cat, keywords] of Object.entries(this.state.categories)) {
            if (keywords.some(k => {
                if (k.startsWith('re:')) {
                    try {
                        const pattern = new RegExp(k.substring(3), 'i');
                        return pattern.test(d);
                    } catch (e) {
                        console.warn("Invalid regex:", k);
                        return false;
                    }
                }
                const lowK = k.toLowerCase();
                // Direct match
                if (d.includes(lowK)) return true;
                // Fuzzy Match: If keyword is 5+ chars and matches with minimal distance
                if (lowK.length >= 5 && this.isFuzzyMatch(d, lowK)) return true;
                return false;
            })) return cat;
        }
        if (d.includes("atm") || d.includes("cash")) return "Cash Withdrawal";
        return "Misc";
    },

    isFuzzyMatch(desc, keyword) {
        // Robust fuzzy: check if keyword words match any words in the description with small edit distance
        const descWords = desc.split(/[\s\-\/\*]+/).filter(w => w.length > 2);
        const keyWords = keyword.split(/[\s\-\/\*]+/).filter(w => w.length > 1);

        return keyWords.every(kw => {
            return descWords.some(dw => {
                if (dw === kw) return true;
                if (kw.length >= 4 && this.levenshtein(dw, kw) <= 1) return true;
                return false;
            });
        });
    },

    levenshtein(s, t) {
        if (!s.length) return t.length;
        if (!t.length) return s.length;
        const arr = [];
        for (let i = 0; i <= t.length; i++) { arr[i] = [i]; }
        for (let j = 0; j <= s.length; j++) { arr[0][j] = j; }
        for (let i = 1; i <= t.length; i++) {
            for (let j = 1; j <= s.length; j++) {
                arr[i][j] = t.charAt(i - 1) === s.charAt(j - 1)
                    ? arr[i - 1][j - 1]
                    : Math.min(arr[i - 1][j - 1] + 1, arr[i][j - 1] + 1, arr[i - 1][j] + 1);
            }
        }
        return arr[t.length][s.length];
    },

    isKnownPerson(desc) {
        const d = String(desc || "").toLowerCase();
        return this.state.persons.some(n => d.includes(n.toLowerCase()));
    },

    async addCategoryRule(cat, keyword) {
        if (!this.state.categories[cat]) this.state.categories[cat] = [];
        if (!this.state.categories[cat].includes(keyword)) {
            this.state.categories[cat].push(keyword);
            await DB.saveRule({ type: 'category_rules', data: this.state.categories });
            return true;
        }
        return false;
    },

    async removeKeyword(cat, keyword) {
        if (this.state.categories[cat]) {
            this.state.categories[cat] = this.state.categories[cat].filter(k => k !== keyword);
            await DB.saveRule({ type: 'category_rules', data: this.state.categories });
            return true;
        }
        return false;
    },

    async addPerson(name) {
        if (!this.state.persons.includes(name)) {
            this.state.persons.push(name);
            await DB.saveRule({ type: 'known_persons', data: this.state.persons });
            return true;
        }
        return false;
    },

    async removePerson(name) {
        this.state.persons = this.state.persons.filter(p => p !== name);
        await DB.saveRule({ type: 'known_persons', data: this.state.persons });
    },

    async updateRevenueRule(admissionAmt, installmentAmt) {
        this.state.revenue.admission = admissionAmt;
        this.state.revenue.installment = installmentAmt;
        await DB.saveRule({ type: 'revenue_logic', data: this.state.revenue });
    }
};

// --- TRANSACTION MANAGER ---
const TransactionManager = {
    state: {
        allRows: [], filteredRows: [], datasets: [], currentDatasetId: null,
        sortOrder: 'asc', sortKey: 'Date',
        pagination: { currentPage: 1, itemsPerPage: 50 },
        activeFilters: { query: "", min: null, max: null, dateStart: null, dateEnd: null, type: null, preset: null },
        selectedIds: new Set() // For batch operations
    },

    async init() {
        await RulesManager.init();
        this.state.datasets = await DB.getDatasets();
        if (this.state.datasets.length > 0) {
            const recent = this.state.datasets.sort((a, b) => b.uploadDate - a.uploadDate)[0];
            await this.switchDataset(recent.id);
        } else {
            UIManager.renderDatasetList([], null);
        }
    },

    async reapplyRules() {
        if (!this.state.allRows.length) return;
        UIManager.startLoading("Re-applying rules...");

        try {
            // Re-process all rows
            const updatedRows = this.state.allRows.map(r => {
                const newCat = RulesManager.categorize(r.Description);
                if (newCat !== r.category && r.category !== 'Custom') {
                    const pDate = r.parsedDate ? new Date(r.parsedDate) : null;
                    const searchText = (String(r.Description) + " " + newCat + " " + r.parsedCredit + " " + r.parsedDebit + " " + (pDate ? pDate.toISOString().split('T')[0] : "")).toLowerCase();
                    return { ...r, category: newCat, searchText: searchText };
                }
                return r;
            });

            this.state.allRows = updatedRows;

            // Save back to DB (persist changes)
            // Ideally we should update the dataset in DB. 
            // For now, let's just update the current view and show a toast "Rules Applied".
            // To persist, we'd need to re-save the dataset.
            // Let's do it right:
            const currentMeta = this.state.datasets.find(d => d.id === this.state.currentDatasetId);
            if (currentMeta) {
                await DB.saveDataset(currentMeta, updatedRows);
            }

            this.process(updatedRows);
            UIManager.showToast("Categorization rules re-applied!", "success");

        } catch (e) {
            console.error(e);
            UIManager.showToast("Failed to re-apply rules", "error");
        } finally {
            UIManager.stopLoading();
        }
    },

    async switchDataset(datasetId) {
        UIManager.startLoading();
        this.state.currentDatasetId = datasetId;
        const rows = await DB.loadTransactions(datasetId);
        if (rows && rows.length > 0) {
            this.state.allRows = rows;
            this.process(rows);
        }
        UIManager.stopLoading();
        UIManager.renderDatasetList(this.state.datasets, this.state.currentDatasetId);
    },

    async importData(file) {
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

                if (!rows.length) return UIManager.showToast("File is empty.", "error");

                // Check for duplicates
                const isDuplicate = this.state.datasets.find(d => d.name === file.name && d.rowCount === rows.length);
                if (isDuplicate) {
                    if (!confirm(`Warning: A dataset named "${file.name}" with ${rows.length} rows already exists (Imported on ${new Date(isDuplicate.uploadDate).toLocaleDateString()}). \n\nDo you want to import it again?`)) {
                        UIManager.showToast("Import cancelled: Duplicate detected.", "info");
                        return;
                    }
                }

                const datasetId = Utils.generateId();
                const metadata = { id: datasetId, name: file.name, uploadDate: Date.now(), rowCount: rows.length };

                // Optimization: Compute header mapping once
                const firstRow = rows[0];
                const headerMap = Utils.mapHeaders(firstRow); // We'll just reuse the *logic* or mapping keys if possible. 
                // Actually Utils.mapHeaders finds keys in the row. Since keys are same for all rows in CSV/Excel usually:
                // Let's create a reusable mapper function for this file
                const getMappedValue = (r, target) => {
                    // This is a simplified optimization. 
                    // Real optimization: find the actual keys corresponding to Date, Desc, etc. once.
                    // For now, let's just stick to the current mapHeaders but ensure it's robust.
                    // The previous loop was okay, but let's just ensure we return metadata properly.
                    return Utils.mapHeaders(r);
                };

                const processedRows = rows.map((r, index) => {
                    const mapped = getMappedValue(r);
                    let pCredit = Utils.cleanAmount(mapped.Credit);
                    let pDebit = Utils.cleanAmount(mapped.Debit);

                    // If we only found a single "Amount" column with signs
                    // Example: -500 should be Debit: 500, Credit: 0
                    if (pCredit < 0 && pDebit === 0) {
                        pDebit = Math.abs(pCredit);
                        pCredit = 0;
                    } else if (pDebit < 0 && pCredit === 0) {
                        pCredit = Math.abs(pDebit);
                        pDebit = 0;
                    }

                    const pDate = Utils.parseDate(mapped.Date);
                    const cat = RulesManager.categorize(mapped.Description);

                    // Use deterministic ID for deduplication with filename as salt
                    const stableId = Utils.generateRowId(mapped, index, file.name);

                    return {
                        ...mapped,
                        id: stableId, // Use stable ID
                        datasetId: datasetId,
                        parsedCredit: pCredit,
                        parsedDebit: pDebit,
                        parsedDate: pDate ? pDate.toISOString() : null,
                        category: cat,
                        searchText: (String(mapped.Description) + " " + cat + " " + pCredit + " " + pDebit + " " + (pDate ? pDate.toISOString().split('T')[0] : "")).toLowerCase(),
                        raw: r
                    };
                });

                UIManager.startLoading("Importing Data...");
                await DB.saveDataset(metadata, processedRows, (percent) => {
                    UIManager.showProgress(percent, "Saving Transactions");
                });
                this.state.datasets = await DB.getDatasets();
                await this.switchDataset(datasetId);
                UIManager.showToast(`Imported ${rows.length} transactions.`, "success");
            } catch (err) {
                console.error("Import Error:", err);
                UIManager.showToast("Import failed: " + (err.message || "Unknown error"), "error");
            }
        };
        reader.readAsArrayBuffer(file);
    },

    async deleteDataset(datasetId) {
        if (!confirm("Delete this dataset?")) return;
        await DB.deleteDataset(datasetId);
        this.state.datasets = await DB.getDatasets();
        if (this.state.currentDatasetId === datasetId) {
            this.state.allRows = [];
            this.state.currentDatasetId = null;
            this.process([]);
            if (this.state.datasets.length > 0) this.switchDataset(this.state.datasets[0].id);
        } else {
            UIManager.renderDatasetList(this.state.datasets, this.state.currentDatasetId);
        }
    },

    process(rows = this.state.allRows, isFilter = false) {
        try {
            UIManager.startLoading();
            this.state.filteredRows = rows;
            const stats = this.analyze(rows);
            const recurring = this.detectRecurring(rows);
            const predictions = this.predict(stats.monthly);

            UIManager.update(stats, rows, predictions, recurring);
            ChartManager.render(stats, predictions);

        } catch (err) {
            console.error("Process Error:", err);
            UIManager.showToast("Error processing data", "error");
        } finally {
            setTimeout(() => UIManager.stopLoading(), 300);
        }
    },

    analyze(rows) {
        let stats = {
            admissions: 0, installments: 0, revenue: 0, totalExpense: 0, netFlow: 0,
            knownPersonTotal: 0, knownPersonCount: 0,
            relationships: {}, monthly: {}, categoryData: {}, totalIncome: 0,

            // New Credit Card Analysis Data
            creditCard: {
                total: 0,
                count: 0,
                avg: 0,
                months: {},
                txns: []
            },

            growth: { admissions: 0, installments: 0, revenue: 0, netFlow: 0 },
            variance: [],
            savingsRate: 0,
            healthScore: 0
        };

        // Dynamic Credit Card Keywords from RulesManager
        const ccKeywords = RulesManager.state.categories["Credit Card"] || ["sbi card", "card payment", "credit card", "visa", "mastercard", "amex", "card bill"];
        const admThreshold = RulesManager.state.revenue.admission || 10000;
        const instThreshold = RulesManager.state.revenue.installment || 7000;

        rows.forEach(r => {
            const amt = r.parsedDebit || 0;
            const inc = r.parsedCredit || 0;
            const date = r.parsedDate ? new Date(r.parsedDate) : null;
            if (!date) return;

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const desc = (r.Description || "").toLowerCase();
            const cat = r.category || "Misc";

            // Initialize Month
            if (!stats.monthly[monthKey]) {
                stats.monthly[monthKey] = {
                    income: 0, expense: 0, net: 0, admissionIncome: 0, installmentIncome: 0, categories: {},
                    label: date.toLocaleString('default', { month: 'short', year: '2-digit' })
                };
            }
            const m = stats.monthly[monthKey];

            // Income Processing
            if (inc > 0) {
                stats.totalIncome += inc;
                m.income += inc;

                const isAdm = Math.abs(inc - admThreshold) < 1;
                const isInst = Math.abs(inc - instThreshold) < 1;

                if (isAdm) {
                    stats.admissions++;
                    stats.revenue += inc;
                    m.admissionIncome += inc;
                } else if (isInst) {
                    stats.installments++;
                    // Note: Original code added to revenue for installments too?
                    stats.revenue += inc;
                    m.installmentIncome += inc;
                } else {
                    // Other income
                }
            }

            // Expense Processing
            if (amt > 0) {
                stats.totalExpense += amt;
                m.expense += amt;

                // Category Aggregation
                if (!stats.categoryData[cat]) stats.categoryData[cat] = 0;
                stats.categoryData[cat] += amt;

                if (!m.categories[cat]) m.categories[cat] = 0;
                m.categories[cat] += amt;

                // Credit Card Detection
                if (ccKeywords.some(k => desc.includes(k))) {
                    stats.creditCard.total += amt;
                    stats.creditCard.count++;
                    stats.creditCard.txns.push(r);

                    if (!stats.creditCard.months[monthKey]) stats.creditCard.months[monthKey] = 0;
                    stats.creditCard.months[monthKey] += amt;
                }
            }

            // Net Flow
            stats.netFlow += (inc - amt);
            m.net += (inc - amt);

            // Relationship Logic
            if (RulesManager.isKnownPerson(r.Description)) {
                stats.knownPersonCount++;
                if (amt > 0) stats.knownPersonTotal += amt;
                // Basic Relationship map if needed? Original code didn't populate it fully in snippet
                // Assuming basic count/total is enough for now based on snippet usage
            }
        });

        // Credit Card Avg
        if (stats.creditCard.count > 0) {
            stats.creditCard.avg = stats.creditCard.total / stats.creditCard.count;
        }

        // --- Post-Loop Calculations (Original Features) ---

        // 1. Growth (Admissions, Revenue, Net Flow)
        const sortedMonths = Object.keys(stats.monthly).sort();
        if (sortedMonths.length >= 2) {
            const currM = stats.monthly[sortedMonths[sortedMonths.length - 1]];
            const prevM = stats.monthly[sortedMonths[sortedMonths.length - 2]];

            stats.growth = {
                admissions: this.calcGrowth(currM.admissionIncome, prevM.admissionIncome),
                installments: this.calcGrowth(currM.installmentIncome, prevM.installmentIncome),
                revenue: this.calcGrowth(currM.income, prevM.income),
                netFlow: this.calcGrowth(currM.net, prevM.net)
            };
        }

        // 2. Variance (Month over Month Category Changes)
        stats.variance = this.calculateVariance(stats.monthly);

        // 3. Savings Rate & Health Score
        if (stats.totalIncome > 0) {
            stats.savingsRate = ((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1);
        }

        let score = 0;
        if (stats.savingsRate > 20) score += 40;
        else if (stats.savingsRate > 10) score += 20;
        if (stats.netFlow > 0) score += 30;
        if (stats.revenue > 0) score += 20; // Bonus for consistent revenue

        // Anomaly Penalty
        // (Simple check: reuse existing anomaly logic if possible, or recalculate)
        // Since we need to run detectAnomalies anyway:
        this.detectAnomalies(rows, stats.categoryData);
        const anomalyCount = rows.filter(r => r.isAnomaly).length;
        if (anomalyCount === 0) score += 10;

        stats.healthScore = Math.min(score, 100);

        return stats;
    },

    calcGrowth(curr, prev) {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / Math.abs(prev) * 100).toFixed(1);
    },

    detectAnomalies(rows, catTotals) {
        if (!rows.length) return;

        // Group amounts by category for statistical analysis
        const catAmounts = {};
        rows.forEach(r => {
            if (r.parsedDebit > 0) {
                if (!catAmounts[r.category]) catAmounts[r.category] = [];
                catAmounts[r.category].push(r.parsedDebit);
            }
        });

        // Calculate IQR for each category
        const catOutlierBounds = {};
        for (const [cat, amounts] of Object.entries(catAmounts)) {
            if (amounts.length < 4) {
                // Not enough data for IQR, fallback to simple threshold (e.g., 2x median or fixed 10k)
                const sorted = [...amounts].sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                catOutlierBounds[cat] = Math.max(median * 3, 10000); // 3x median or 10k
                continue;
            }

            const sorted = [...amounts].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            catOutlierBounds[cat] = q3 + (1.5 * iqr);
        }

        rows.forEach(r => {
            const threshold = catOutlierBounds[r.category] || 10000;
            // Mark as anomaly if it's significantly higher than normal for its category
            if (r.parsedDebit > threshold) {
                r.isAnomaly = true;
                r.outlierThreshold = threshold;
            }
        });
    },

    calculateVariance(monthlyData) {
        const keys = Object.keys(monthlyData).sort();
        if (keys.length < 2) return [];

        const current = monthlyData[keys[keys.length - 1]];
        const prev = monthlyData[keys[keys.length - 2]];
        const changes = [];



        Object.keys(current.categories).forEach(cat => {
            const currVal = current.categories[cat] || 0;
            const prevVal = prev.categories[cat] || 0;
            const diff = currVal - prevVal;
            if (Math.abs(diff) > 500) {
                changes.push({ category: cat, diff });
            }
        });
        return changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    },

    detectRecurring(rows) {
        const groups = {};
        rows.filter(r => (r.parsedDebit || 0) > 0).forEach(r => {
            // Use clean description and rounded amount for grouping (tolerance of 1.0)
            const key = Utils.cleanDesc(r.Description) + "|" + Math.round(r.parsedDebit);
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });
        return Object.values(groups).filter(g => g.length >= 2).map(g => ({
            desc: g[0].Description,
            amount: g[0].parsedDebit,
            count: g.length,
            nextDue: new Date(new Date(g[g.length - 1].parsedDate).getTime() + 30 * 24 * 60 * 60 * 1000)
        }));
    },

    predict(monthly) {
        const keys = Object.keys(monthly).sort();
        if (keys.length < 3) return null;

        // Weighted moving average (more weight to recent months)
        const recent = keys.slice(-3);
        const weights = [1, 2, 3]; // Total weight = 6
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const avgIncome = recent.reduce((sum, k, i) => sum + (monthly[k].income * weights[i]), 0) / totalWeight;
        const avgExpense = recent.reduce((sum, k, i) => sum + (monthly[k].expense * weights[i]), 0) / totalWeight;

        // Simple trend detection
        const trend = (monthly[recent[2]].net - monthly[recent[0]].net) / 2;

        return {
            nextMonthIncome: avgIncome,
            nextMonthExpense: avgExpense,
            nextMonthNet: avgIncome - avgExpense,
            trend: trend > 0 ? 'Improving' : 'Declining'
        };
    },

    filter(updates = {}) {
        // Merge updates into state
        this.state.activeFilters = { ...this.state.activeFilters, ...updates };
        const f = this.state.activeFilters;

        const q = (f.query || "").toLowerCase();

        const rows = this.state.allRows.filter(r => {
            const matchesText = !q || r.searchText.includes(q);
            const amt = (r.parsedCredit || 0) + (r.parsedDebit || 0);

            // Check Min/Max
            const matchesMin = f.min == null || amt >= f.min;
            const matchesMax = f.max == null || amt <= f.max;

            // Check Date
            let matchesDate = true;
            if (f.dateStart && r.parsedDate < new Date(f.dateStart).toISOString()) matchesDate = false;
            if (f.dateEnd && r.parsedDate > new Date(f.dateEnd).toISOString()) matchesDate = false;

            // Check Type
            let matchesType = true;
            if (f.type === 'credit') matchesType = (r.parsedCredit || 0) > 0;
            else if (f.type === 'debit') matchesType = (r.parsedDebit || 0) > 0;

            // Check Category (Strict Match)
            let matchesCat = true;
            if (f.category && r.category !== f.category) matchesCat = false;

            // Check Preset
            if (f.preset) {
                if (f.preset === 'admissions') matchesType = Math.abs((r.parsedCredit || 0) - 10000) < 1;
                else if (f.preset === 'installments') matchesType = Math.abs((r.parsedCredit || 0) - 7000) < 1;
                else if (f.preset === 'high') matchesType = amt > 5000;
                else if (f.preset === 'known') matchesType = RulesManager.isKnownPerson(r.Description);
                else if (f.preset === 'misc') matchesType = r.category === 'Misc';
                // Note: 'recurring' needs advanced logic not present in row, skipping for now
            }

            return matchesText && matchesMin && matchesMax && matchesDate && matchesType && matchesCat;
        });

        // Show/Hide Banner
        const hasFilters = q || f.min || f.max || f.dateStart || f.dateEnd || f.type || f.preset || f.category;
        const banner = document.getElementById('filterBanner');
        if (banner) {
            banner.style.display = hasFilters ? 'flex' : 'none';
            if (hasFilters) document.getElementById('filterStatus').textContent = `Filters active: ${rows.length} results`;
        }

        this.process(rows, true);
    },

    filterMsg(category) {
        UIManager.switchView('reportsView'); // Switch to data grid
        const btn = document.querySelector('[data-action="navigate"][data-payload="reportsView"]');
        if (btn) UIManager.switchView('reportsView', btn);

        // Reset other filters to ensure clean view
        this.filter({ category: category, query: "", min: null, max: null, type: null, preset: null, dateStart: null, dateEnd: null });
        UIManager.showToast(`Filtered by ${category}`, "info");
    },

    async clearAll() {
        if (confirm("Clear all data? This cannot be undone.")) {
            // Delete DB and reload
            const req = indexedDB.deleteDatabase(CONFIG.DB_NAME);
            req.onsuccess = () => {
                UIManager.showToast("All data cleared. Reloading...", "success");
                setTimeout(() => location.reload(), 1500);
            };
            req.onerror = () => {
                UIManager.showToast("Failed to clear data", "error");
            };
        }
    },

    openEditModal(id) {
        const tx = this.state.allRows.find(r => r.id === id);
        if (!tx) return;

        document.getElementById('editTxId').value = tx.id;
        document.getElementById('editTxDate').value = tx.parsedDate ? new Date(tx.parsedDate).toISOString().split('T')[0] : '';
        document.getElementById('editTxDesc').value = tx.Description;
        document.getElementById('editTxCat').value = tx.category;

        // Amount is trickier as it's split. visual representation logic:
        const amt = (tx.parsedCredit || 0) > 0 ? (tx.parsedCredit) : -(tx.parsedDebit || 0);
        document.getElementById('editTxAmt').value = amt;

        document.getElementById('editTransactionModal').style.display = 'flex';
    },

    async saveEdit() {
        const id = document.getElementById('editTxId').value;
        const date = document.getElementById('editTxDate').value;
        const desc = document.getElementById('editTxDesc').value;
        const cat = document.getElementById('editTxCat').value;
        const amt = Number(document.getElementById('editTxAmt').value);

        if (!desc || isNaN(amt)) return UIManager.showToast("Invalid Input", "error");
        if (isNaN(new Date(date).getTime())) return UIManager.showToast("Invalid Date", "error");

        const txIndex = this.state.allRows.findIndex(r => r.id == id); // loose equality for string/num id mismatch
        if (txIndex === -1) return;

        const tx = this.state.allRows[txIndex];

        // Update fields
        tx.parsedDate = date; // ISO string roughly
        tx.Description = desc;
        tx.category = cat;

        if (amt > 0) {
            tx.parsedCredit = amt;
            tx.parsedDebit = 0;
        } else {
            tx.parsedCredit = 0;
            tx.parsedDebit = Math.abs(amt);
        }

        // Update raw if possible (optional but good for consistency)
        tx.raw.Date = new Date(date).toLocaleDateString();
        tx.raw.Description = desc;
        tx.raw['Credit Amount'] = tx.parsedCredit;
        tx.raw['Debit Amount'] = tx.parsedDebit;

        // Re-analyze
        this.process(this.state.allRows, true); // re-runs filter and analysis

        // Save to DB
        const currentMeta = this.state.datasets.find(d => d.id === this.state.currentDatasetId);
        if (currentMeta) {
            await DB.saveDataset(currentMeta, this.state.allRows);
        }

        document.getElementById('editTransactionModal').style.display = 'none';
        UIManager.showToast("Transaction updated", "success");
    },

    handleSort(key) {
        try {
            // Safety: Ensure filteredRows exists
            if (!this.state.filteredRows || this.state.filteredRows.length === 0) {
                // Try to recover from allRows
                if (this.state.allRows && this.state.allRows.length > 0) {
                    this.state.filteredRows = [...this.state.allRows];
                    UIManager.showToast("Restored data from cache", "warning");
                } else {
                    return UIManager.showToast("No data to sort", "info");
                }
            }

            if (this.state.sortKey === key) {
                this.state.sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.state.sortKey = key;
                this.state.sortOrder = 'desc';
            }

            // Fix Casing Mismatch for Category
            const dataKey = key === 'Category' ? 'category' : key;

            UIManager.showToast(`Sorting ${this.state.filteredRows.length} rows...`, 'info');

            const rows = [...this.state.filteredRows];
            rows.sort((a, b) => {
                let valA, valB;

                if (key === 'Amount') {
                    // Sort by Signed Amount (Income is positive, Expense is negative)
                    const amtA = (a.parsedCredit || 0) - (a.parsedDebit || 0);
                    const amtB = (b.parsedCredit || 0) - (b.parsedDebit || 0);
                    valA = amtA;
                    valB = amtB;
                } else if (key === 'Date') {
                    valA = a.parsedDate ? new Date(a.parsedDate).getTime() : 0;
                    valB = b.parsedDate ? new Date(b.parsedDate).getTime() : 0;
                } else {
                    // String sort for Description / Category
                    // Safe access with fallback
                    valA = String(a[dataKey] || '').toLowerCase();
                    valB = String(b[dataKey] || '').toLowerCase();
                }

                if (valA < valB) return this.state.sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return this.state.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            this.state.filteredRows = rows;
            this.state.pagination.currentPage = 1;

            // Update UI
            const stats = this.analyze(rows);
            const recurring = this.detectRecurring(rows);
            const predictions = this.predict(stats.monthly);
            UIManager.update(stats, rows, predictions, recurring);
        } catch (err) {
            // console.error("Sort Error:", err);
            UIManager.showToast("Sort failed: " + err.message, "error");
        }
    },

    async deleteTransaction(id) {
        if (!confirm("Delete this transaction?")) return;
        await this.deleteTransactions([id], false); // Reuse batch logic
    },

    async deleteTransactions(ids, confirmAction = true) {
        if (!ids || ids.length === 0) return;
        if (confirmAction && !confirm(`Delete ${ids.length} selected transactions?`)) return;

        try {
            UIManager.startLoading();

            // 1. Delete from DB
            await DB.deleteTransactions(ids);

            // 2. Update Memory
            const idSet = new Set(ids);
            this.state.allRows = this.state.allRows.filter(r => !idSet.has(r.id));
            this.state.filteredRows = this.state.filteredRows.filter(r => !idSet.has(r.id));

            // Clear selection
            this.state.selectedIds.clear();

            // 3. Update Metadata (RowCount via DB is expensive, we just decr)
            const currentMeta = this.state.datasets.find(d => d.id === this.state.currentDatasetId);
            if (currentMeta) {
                currentMeta.rowCount = this.state.allRows.length;
                // Optimization: Update metadata async without blocking UI
                DB.saveDataset(currentMeta, []);
            }

            // 4. Update UI
            // Fix Pagination if needed
            const totalPages = Math.ceil(this.state.filteredRows.length / this.state.pagination.itemsPerPage);
            if (this.state.pagination.currentPage > totalPages && totalPages > 0) {
                this.state.pagination.currentPage = totalPages;
            }

            const stats = this.analyze(this.state.filteredRows);
            const recurring = this.detectRecurring(this.state.filteredRows);
            const predictions = this.predict(stats.monthly);
            UIManager.update(stats, this.state.filteredRows, predictions, recurring);

            UIManager.showToast(`Deleted ${ids.length} transactions`, "success");

        } catch (err) {
            // console.error("Batch Delete Error:", err);
            UIManager.showToast("Failed to delete transactions", "error");
        } finally {
            UIManager.stopLoading();
        }
    },

    toggleSelection(id) {
        if (this.state.selectedIds.has(id)) {
            this.state.selectedIds.delete(id);
        } else {
            this.state.selectedIds.add(id);
        }
        UIManager.updateSelectionUI();
    },

    toggleSelectAll(checked) {
        if (checked) {
            // Select all current filtered rows (not just visible on page)
            this.state.filteredRows.forEach(r => this.state.selectedIds.add(r.id));
        } else {
            this.state.selectedIds.clear();
        }
        // Instead of re-processing everything, just update the UI
        UIManager.updateSelectionUI();
        // Since rows might span multiple pages, we don't necessarily re-render the whole table here 
        // if performance is an issue, but for < 1000 rows it's fine.
        // To be safe, let's just re-render current page
        const start = (this.state.pagination.currentPage - 1) * this.state.pagination.itemsPerPage;
        const end = start + this.state.pagination.itemsPerPage;
        UIManager.renderTable(this.state.filteredRows.slice(start, end));

        UIManager.showToast(checked ? `Selected ${this.state.selectedIds.size} transactions` : "Selection cleared", "info");
    },

    exportCSV() {
        // Smart Export: Use filtered rows if filters are active (subset), else all rows
        // Simple check: is filteredRows length != allRows length? OR just always export what's visible (filteredRows)
        // User expectation: Export what I see.

        const dataToExport = this.state.filteredRows.length > 0 ? this.state.filteredRows : this.state.allRows;

        if (!dataToExport.length) return UIManager.showToast("No data to export", "warning");

        // Map back to simplified format for CSV
        const exportData = dataToExport.map(r => ({
            Date: r.parsedDate,
            Description: r.Description,
            Category: r.category,
            Debit: r.parsedDebit || 0,
            Credit: r.parsedCredit || 0,
            Reference: r.RefNo || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, "finance_data_export.csv");
    }
};

// --- CHART MANAGER ---
const ChartManager = {
    render(stats, predictions) {
        this.renderMainChart(stats.monthly, predictions);
        this.renderCategoryChart(stats.categoryData);
        this.renderTrendChart(stats.monthly);
    },

    renderMainChart(monthly, predictions) {
        try {
            const labels = Object.keys(monthly).sort();
            const income = labels.map(k => monthly[k].income);
            const expense = labels.map(k => monthly[k].expense);
            const net = labels.map(k => monthly[k].net);

            const traces = [
                { x: labels, y: income, type: 'area', name: 'Income', line: { color: CONFIG.CHART_COLORS.income, shape: 'spline' }, fill: 'tozeroy' },
                { x: labels, y: expense, type: 'area', name: 'Expense', line: { color: CONFIG.CHART_COLORS.expense, shape: 'spline' }, fill: 'tozeroy' },
                { x: labels, y: net, type: 'scatter', mode: 'lines+markers', name: 'Net Flow', line: { color: CONFIG.CHART_COLORS.netFlow, width: 3 } }
            ];

            if (predictions) {
                // Determine the next month label
                const lastKey = labels[labels.length - 1];
                const lastDate = new Date(lastKey + "-01");
                lastDate.setMonth(lastDate.getMonth() + 1);
                const nextLabel = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;

                // Projected Points
                traces.push({
                    x: [labels[labels.length - 1], nextLabel],
                    y: [income[income.length - 1], predictions.nextMonthIncome],
                    type: 'scatter', mode: 'lines', name: 'Forecast Income',
                    line: { color: CONFIG.CHART_COLORS.forecastIncome, dash: 'dot', width: 2 },
                    showlegend: false
                });
                traces.push({
                    x: [labels[labels.length - 1], nextLabel],
                    y: [expense[expense.length - 1], predictions.nextMonthExpense],
                    type: 'scatter', mode: 'lines', name: 'Forecast Expense',
                    line: { color: CONFIG.CHART_COLORS.forecastExpense, dash: 'dot', width: 2 },
                    showlegend: false
                });
            }

            const layout = {
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { family: 'Inter, sans-serif' },
                margin: { t: 20, l: 40, r: 20, b: 40 },
                showlegend: true,
                legend: { orientation: 'h', y: -0.2 },
                xaxis: { gridcolor: 'rgba(200,200,200,0.1)' },
                yaxis: { gridcolor: 'rgba(200,200,200,0.1)' }
            };

            Plotly.newPlot('mainChart', traces, layout, { displayModeBar: false, responsive: true });
        } catch (err) {
            // console.error("Main Chart Render Error:", err);
            document.getElementById('mainChart').innerHTML = `<div class="chart-error">Chart Rendering Error: ${err.message}</div>`;
        }
    },

    renderCategoryChart(catData) {
        const labels = Object.keys(catData);
        const values = Object.values(catData);

        if (labels.length === 0) {
            document.getElementById('catTable').innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:40%; font-size:0.85rem;">No data</div>';
            Plotly.purge('catChart');
            return;
        }

        // Professional Palette (Slate, Blue, Emerald, Violet, Amber, Rose, Cyan, Indigo)
        // Professional Palette (Slate, Blue, Emerald, Violet, Amber, Rose, Cyan, Indigo)
        const palette = CONFIG.CHART_COLORS.palette;
        // Cycle colors if more labels than palette
        const colors = labels.map((_, i) => palette[i % palette.length]);

        const trace = {
            labels: labels,
            values: values,
            type: 'pie',
            hole: 0.6,
            marker: { colors: colors },
            textinfo: 'none', // Too cluttered, relying on legend/table
            hoverinfo: 'label+value+percent',
            sort: false
        };

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            margin: { t: 0, l: 0, r: 0, b: 0 },
            showlegend: false // Using custom table instead
        };

        const config = { displayModeBar: false, responsive: true };

        try {
            Plotly.newPlot('catChart', [trace], layout, config).then(gd => {
                gd.on('plotly_click', (data) => {
                    const cat = data.points[0].label;
                    UIManager.showToast(`Filtering by ${cat}...`, 'info');
                    // Switch to Reports and filter
                    UIManager.switchView('reportsView');
                    TransactionManager.filter({ query: cat });
                    document.getElementById('filterSearch').value = cat;
                });
            });
        } catch (err) {
            // console.error("Category Chart Render Error:", err);
            document.getElementById('catChart').innerHTML = `<div class="chart-error">${err.message}</div>`;
        }

        // Render Side-by-Side Table
        const total = values.reduce((a, b) => a + b, 0);
        const sortedIndices = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v); // Sort Descending

        const tableHtml = sortedIndices.map(obj => {
            const i = obj.i;
            const label = labels[i];
            const val = values[i];
            const pct = ((val / total) * 100).toFixed(1);
            const color = colors[i];

            return `
                <div role="button" tabindex="0" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:0.85rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;" onclick="TransactionManager.filter({ query: '${label}' }); UIManager.switchView('reportsView'); document.getElementById('filterSearch').value = '${label}';">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:10px; height:10px; border-radius:3px; background:${color};"></div>
                        <span style="font-weight:500; color:var(--text-main);">${Utils.escapeHtml(label)}</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:600;">${Utils.formatCurrency(val)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${pct}%</div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('catTable').innerHTML = tableHtml;
    },

    renderTrendChart(monthly) {
        const labels = Object.keys(monthly).sort();
        const net = labels.map(k => monthly[k].net);

        const trace = {
            x: labels,
            y: net,
            type: 'bar',
            marker: {
                color: net.map(v => v >= 0 ? CONFIG.CHART_COLORS.income : CONFIG.CHART_COLORS.expense)
            }
        };

        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { t: 20, l: 30, r: 10, b: 30 },
            yaxis: { gridcolor: 'rgba(200,200,200,0.1)' }
        };

        try {
            Plotly.newPlot('trendChart', [trace], layout, { displayModeBar: false, responsive: true });
        } catch (err) {
            // console.error("Trend Chart Render Error:", err);
            document.getElementById('trendChart').innerHTML = `<div class="chart-error">${err.message}</div>`;
        }
    }
};


// --- REPORT MANAGER ---
const ReportManager = {
    async generatePDF() {
        if (!window.html2pdf || !window.Plotly) {
            UIManager.showToast("Required libraries (PDF/Plotly) not loaded", "error");
            return;
        }

        UIManager.startLoading("Preparing Report Preview...");

        try {
            const now = new Date();
            const stats = TransactionManager.analyze(TransactionManager.state.filteredRows);
            const rows = TransactionManager.state.filteredRows;
            const savingsEfficiency = stats.totalIncome > 0 ? ((stats.netFlow / stats.totalIncome) * 100).toFixed(1) : 0;

            // --- DATA PREPARATION ---
            const monthlyKeys = Object.keys(stats.monthly).sort();
            const monthlyData = monthlyKeys.map(k => ({
                month: stats.monthly[k].label,
                income: stats.monthly[k].income,
                expense: stats.monthly[k].expense,
                net: stats.monthly[k].net
            }));

            let sortedCats = Object.entries(stats.categoryData).sort(([, a], [, b]) => b - a);
            const totalExpense = stats.totalExpense;
            const topCats = sortedCats.slice(0, 10);
            const otherCatsVal = sortedCats.slice(10).reduce((sum, [, v]) => sum + v, 0);
            if (otherCatsVal > 0) topCats.push(['Others', otherCatsVal]);

            const highValueTxns = [...rows]
                .filter(r => (r.parsedDebit || 0) > 0)
                .sort((a, b) => b.parsedDebit - a.parsedDebit)
                .slice(0, 5);

            const insights = [];
            if (stats.netFlow < 0) {
                insights.push({ icon: 'fa-triangle-exclamation', color: '#ef4444', text: `<strong>Deficit Alert:</strong> Expenses exceeded income by ${Utils.formatCurrency(Math.abs(stats.netFlow))}. Immediate budget review recommended.` });
            } else {
                insights.push({ icon: 'fa-chart-line', color: '#10b981', text: `<strong>Positive Flow:</strong> Net surplus of ${Utils.formatCurrency(stats.netFlow)} achieved this period.` });
            }

            if (Number(savingsEfficiency) > 20) {
                insights.push({ icon: 'fa-piggy-bank', color: '#6366f1', text: `<strong>Strong Savings:</strong> You saved ${savingsEfficiency}% of your income, exceeding the 20% benchmark.` });
            } else if (Number(savingsEfficiency) < 5 && stats.totalIncome > 0) {
                insights.push({ icon: 'fa-circle-exclamation', color: '#f59e0b', text: `<strong>Low Savings:</strong> Only ${savingsEfficiency}% of income retained.` });
            }

            // --- CREDIT CARD STATS ---
            const ccStats = stats.creditCard;
            let ccMin = 0, ccMax = 0;
            if (ccStats.count > 0 && ccStats.txns.length > 0) {
                ccMax = Math.max(...ccStats.txns.map(t => t.parsedDebit));
                ccMin = Math.min(...ccStats.txns.map(t => t.parsedDebit));
            }
            const ccSection = ccStats.count > 0 ? `
                <div style="margin-bottom:30px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:20px;">
                    <h3 class="section-title" style="margin-top:0; border-left-color:#f59e0b; color:#b45309;">
                        <i class="fa-solid fa-credit-card" style="margin-right:8px;"></i> Credit Card & Debt Analysis
                    </h3>
                    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; margin-bottom:15px;">
                        <div>
                            <div class="kpi-label">Total Paid</div>
                            <div class="kpi-val text-danger" style="font-size:16px;">${Utils.formatCurrency(ccStats.total)}</div>
                        </div>
                        <div>
                            <div class="kpi-label">Transactions</div>
                            <div class="kpi-val" style="font-size:16px;">${ccStats.count}</div>
                        </div>
                        <div>
                            <div class="kpi-label">Avg Payment</div>
                            <div class="kpi-val" style="font-size:16px;">${Utils.formatCurrency(ccStats.avg)}</div>
                        </div>
                        <div>
                            <div class="kpi-label">Max Payment</div>
                            <div class="kpi-val text-danger" style="font-size:16px;">${Utils.formatCurrency(ccMax)}</div>
                        </div>
                    </div>
                    <div style="font-size:11px; color:#64748b; background:#f8fafc; padding:8px; border-radius:4px;">
                        <strong><i class="fa-solid fa-magnifying-glass-chart"></i> Spending Pattern:</strong> 
                        Payments rise notably in recent months. Largest payment of ${Utils.formatCurrency(ccMax)} detected.
                        Regular payments identified to <em>SBI Card</em> and others.
                    </div>
                </div>
            ` : '';

            // --- CHARTS GENERATION ---
            const trendImg = await Plotly.toImage({
                data: [{
                    x: monthlyKeys,
                    y: monthlyKeys.map(m => stats.monthly[m].net),
                    type: 'bar',
                    marker: { color: monthlyKeys.map(m => stats.monthly[m].net >= 0 ? '#10b981' : '#ef4444') }
                }],
                layout: {
                    title: { text: 'Monthly Net Cash Flow', font: { size: 14, color: '#0f172a' } },
                    margin: { t: 30, l: 40, r: 20, b: 30 },
                    height: 250, width: 700,
                    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { showgrid: false }, yaxis: { gridcolor: '#f1f5f9' }
                }
            }, { format: 'png', height: 250, width: 700 });

            const pieImg = await Plotly.toImage({
                data: [{
                    values: topCats.map(([, v]) => v),
                    labels: topCats.map(([k]) => k),
                    type: 'pie',
                    hole: 0.5,
                    textinfo: 'percent',
                    textposition: 'inside',
                    automargin: true,
                    marker: { colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#94a3b8'] }
                }],
                layout: {
                    title: { text: 'Expense Distribution', font: { size: 14, color: '#0f172a' } },
                    margin: { t: 30, l: 20, r: 20, b: 20 },
                    height: 250, width: 350,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    showlegend: false
                }
            }, { format: 'png', height: 250, width: 350 });

            // --- HTML TEMPLATE ---
            const styles = `
                <style>
                    .rp-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                    .rp-title { margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
                    .rp-meta { margin: 5px 0 0 0; color: #64748b; font-size: 13px; }
                    .rp-tag { font-family: 'Courier New', monospace; font-size: 11px; color: #6366f1; background: #eef2ff; padding: 4px 8px; border-radius: 4px; font-weight: 600; }

                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
                    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
                    .kpi-val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 5px; }

                    .section-title { font-size: 14px; color: #0f172a; font-weight: 700; border-left: 4px solid #6366f1; padding-left: 10px; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }

                    .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    .data-table th { text-align: left; padding: 8px; background: #f1f5f9; color: #475569; font-weight: 600; border-bottom: 1px solid #cbd5e1; }
                    .data-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
                    .data-table tr:last-child td { border-bottom: none; }
                    .text-right { text-align: right; }
                    .font-mono { font-family: 'Courier New', monospace; }
                    .text-success { color: #10b981; }
                    .text-danger { color: #ef4444; }
                    .report-img { max-width: 100%; height: auto; display: block; }
                </style>
            `;

            const reportHTML = `
                ${styles}
                <div class="rp-header">
                    <div>
                        <h1 class="rp-title">Financial Performance Report</h1>
                        <p class="rp-meta">Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
                    </div>
                    <div>
                        <div class="rp-tag">CONFIDENTIAL // #FIN-${Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                    </div>
                </div>

                <!-- KPI SECTION -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Total Income</div>
                        <div class="kpi-val text-success">${Utils.formatCurrency(stats.totalIncome)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Total Expense</div>
                        <div class="kpi-val text-danger">${Utils.formatCurrency(stats.totalExpense)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Net Flux</div>
                        <div class="kpi-val" style="color:${stats.netFlow >= 0 ? '#10b981' : '#ef4444'}">${Utils.formatCurrency(stats.netFlow)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Savings Rate</div>
                        <div class="kpi-val" style="color:#6366f1">${savingsEfficiency}%</div>
                    </div>
                </div>

                <!-- INSIGHTS -->
                <div style="margin-bottom:30px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:15px;">
                    <h3 style="margin:0 0 10px 0; font-size:14px; color:#0369a1;"><i class="fa-solid fa-lightbulb"></i> Key Insights</h3>
                    <div style="font-size:12px; line-height:1.6; color:#0c4a6e;">
                        ${insights.map(i => `<div style="margin-bottom:4px;">${i.text}</div>`).join('')}
                    </div>
                </div>

                <!-- CREDIT CARD ANALYSIS -->
                ${ccSection}

                <!-- VISUALS ROW 1 -->
                <div style="display:flex; gap:20px; margin-bottom:20px;">
                    <div style="flex:2; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
                        <img src="${trendImg}" class="report-img" />
                    </div>
                    <div style="flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:10px; display:flex; align-items:center; justify-content:center;">
                        <img src="${pieImg}" class="report-img" />
                    </div>
                </div>

                <!-- MONTHLY BREAKDOWN -->
                <h3 class="section-title">Monthly Breakdown</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th class="text-right">Income</th>
                            <th class="text-right">Expense</th>
                            <th class="text-right">Net Flow</th>
                            <th class="text-right">Savings %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${monthlyData.map(m => `
                            <tr>
                                <td>${m.month}</td>
                                <td class="text-right font-mono text-success">${Utils.formatCurrency(m.income)}</td>
                                <td class="text-right font-mono text-danger">${Utils.formatCurrency(m.expense)}</td>
                                <td class="text-right font-mono" style="color:${m.net >= 0 ? '#10b981' : '#ef4444'}">${Utils.formatCurrency(m.net)}</td>
                                <td class="text-right font-mono">${m.income > 0 ? ((m.net / m.income) * 100).toFixed(1) : '0.0'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="display:flex; gap:30px; margin-top:30px;">
                    <!-- TOP CATEGORIES -->
                    <div style="flex:1;">
                        <h3 class="section-title">Top Expense Categories</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">%</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topCats.map(([cat, val]) => `
                                    <tr>
                                        <td>${cat}</td>
                                        <td class="text-right font-mono">${Utils.formatCurrency(val)}</td>
                                        <td class="text-right font-mono">${((val / totalExpense) * 100).toFixed(1)}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- HIGH VALUE TRANSACTIONS -->
                    <div style="flex:1;">
                        <h3 class="section-title">Largest Outflows</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${highValueTxns.map(tx => `
                                    <tr>
                                        <td>${tx.parsedDate ? new Date(tx.parsedDate).toLocaleDateString() : '-'}</td>
                                        <td>${Utils.cleanDesc(tx.Description).substring(0, 25)}...</td>
                                        <td class="text-right font-mono text-danger">${Utils.formatCurrency(tx.parsedDebit)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- FOOTER -->
                <div style="margin-top:50px; font-size:9px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:10px;">
                    Generated by Finance Dashboard Pro. This document contains sensitive financial data.
                </div>
            `;

            this.showPreview(reportHTML);

        } catch (err) {
            console.error("Report Gen Error:", err);
            UIManager.showToast("Failed to generate report: " + err.message, "error");
        } finally {
            UIManager.stopLoading();
        }
    },

    showPreview(htmlContent) {
        // cleanup existing
        const existingReportModal = document.getElementById('report-modal');
        if (existingReportModal) document.body.removeChild(existingReportModal);

        const modal = document.createElement('div');
        modal.id = 'report-modal';
        modal.className = 'report-modal';

        modal.innerHTML = `
            <style>
                .report-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .report-actions {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    z-index: 10001;
                }
                .report-preview-container {
                    background: #fff;
                    width: 100%;
                    max-width: 800px; /* A4 width approx */
                    height: calc(100% - 100px); /* Adjust based on action bar height */
                    overflow-y: auto;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    padding: 40px;
                    box-sizing: border-box;
                }
                .report-paper {
                    background: #ffffff;
                    color: #1e293b;
                    font-family: 'Inter', sans-serif;
                    min-height: 100%; /* Ensure content fills paper */
                }
            </style>
            <div class="report-actions">
                <button id="btn-download-pdf" class="primary-btn" style="background:#6366f1; color:white; border:none; padding:10px 20px; border-radius:30px; cursor:pointer; font-weight:600;">
                    <i class="fa-solid fa-file-pdf"></i> Download PDF
                </button>
                <button id="btn-close-pdf" class="secondary-btn" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.2); padding:10px 20px; border-radius:30px; cursor:pointer;">
                    Close
                </button>
            </div>
            <div class="report-preview-container">
                <div id="report-paper" class="report-paper">
                    ${htmlContent}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind Events
        const btnClosePdf = document.getElementById('btn-close-pdf');
        if (btnClosePdf) btnClosePdf.onclick = () => {
            document.body.removeChild(modal);
        };

        const btnDownloadPdf = document.getElementById('btn-download-pdf');
        if (btnDownloadPdf) btnDownloadPdf.onclick = async () => {
            const btn = document.getElementById('btn-download-pdf');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            const element = document.getElementById('report-paper');
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();

            btn.innerHTML = originalText;
            btn.disabled = false;
            UIManager.showToast("PDF Downloaded!", "success");
        };
    }
};

// --- UI MANAGER ---
const UIManager = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderBudget();
    },

    cacheDOM() {
        this.els = {
            views: document.querySelectorAll('.view-content'),
            subViews: document.querySelectorAll('.dashboard-subview'),
            navItems: document.querySelectorAll('.nav-item'),
            dashboardTabs: document.querySelectorAll('.nav-tab'),
            fileInput: document.getElementById('smartFileUpload'),
            loading: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toast-container'), // Likely null at start
            adm: document.getElementById('adm'),
            inst: document.getElementById('inst'),
            rev: document.getElementById('rev'),
            netflow: document.getElementById('netflow'),
            tableBody: document.getElementById('tableBody'),
            varianceList: document.getElementById('varianceList'),
            topInsight: document.getElementById('topInsight'),
            budgetContainer: document.getElementById('budgetContainer'),
            datasetList: document.getElementById('datasetListSelect'),
            historyModal: document.getElementById('dataHistoryModal'),
            historyList: document.getElementById('historyListBody'),
            recentList: document.getElementById('recentActivityList'),
            healthScore: document.getElementById('healthScore'),
            healthScoreBadge: document.getElementById('healthScoreBadge'),
            title: document.getElementById('viewTitle'),
            subtitle: document.getElementById('viewSubtitle'),
            datasetCount: document.getElementById('datasetCount'),
            selectAllCheckbox: document.getElementById('selectAllCheckbox'),
            batchActions: document.getElementById('batchActions'),
            deleteSelectedBtn: document.getElementById('deleteSelectedBtn')
        };
    },

    updateSelectionUI() {
        if (!this.els.tableBody) return;
        const count = TransactionManager.state.selectedIds.size;
        const total = TransactionManager.state.filteredRows.length;

        if (this.els.batchActions) {
            this.els.batchActions.style.display = count > 0 ? 'flex' : 'none';
            if (this.els.deleteSelectedBtn) {
                this.els.deleteSelectedBtn.innerHTML = `<i class="fa-solid fa-trash"></i> Delete ${count} Selected`;
            }
        }

        // Update Select All Checkbox state (indeterminate if partial)
        if (this.els.selectAllCheckbox) {
            this.els.selectAllCheckbox.checked = count > 0 && count === total;
            this.els.selectAllCheckbox.indeterminate = count > 0 && count < total;
        }

        // Update individual row checkboxes
        const checkboxes = this.els.tableBody.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = TransactionManager.state.selectedIds.has(cb.dataset.id);
            // Highlight row
            const tr = cb.closest('tr');
            if (tr) {
                if (cb.checked) tr.classList.add('selected-row');
                else tr.classList.remove('selected-row');
            }
        });
    },

    bindEvents() {
        document.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const payload = btn.dataset.payload;

            if (action === 'navigate') this.switchView(payload, btn);
            if (action === 'refresh-summary') {
                // Re-process current filtered rows to refresh charts & metrics
                try {
                    const rows = TransactionManager.state.filteredRows.length ? TransactionManager.state.filteredRows : TransactionManager.state.allRows;
                    TransactionManager.process(rows);
                    const last = new Date().toLocaleString();
                    const el = document.getElementById('summaryLastUpdated');
                    if (el) el.textContent = last;
                    UIManager.showToast('Summary refreshed', 'success');
                } catch (err) {
                    UIManager.showToast('Failed to refresh summary', 'error');
                }
            }
            if (action === 'switch-tab') this.handleTabSwitch(payload, btn);
            if (action === 'import') this.els.fileInput.click();
            if (action === 'export-csv') TransactionManager.exportCSV();
            if (action === 'export-pdf') ReportManager.generatePDF();
            if (action === 'delete-selected') {
                const ids = Array.from(TransactionManager.state.selectedIds);
                TransactionManager.deleteTransactions(ids);
            }

            if (action === 'filter-preset') {
                const isType = ['credit', 'debit'].includes(payload);
                // If type is selected, clear preset. If preset selected, clear type (simplification)
                TransactionManager.filter(isType ? { type: payload, preset: null } : { preset: payload, type: null });
            }

            if (action === 'filter-reset') {
                // Clear UI Inputs
                ['filterSearch', 'minAmount', 'maxAmount', 'startDate', 'endDate'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                // Reset State
                TransactionManager.filter({ query: "", min: null, max: null, dateStart: null, dateEnd: null, type: null, preset: null });
                UIManager.showToast("Filters reset", "success");
            }

            if (action === 'add-rule') {
                if (payload === 'category') {
                    const cat = prompt("Enter new category name:");
                    if (cat) {
                        if (!cat.trim()) return UIManager.showToast("Category name cannot be empty", "error");
                        if (RulesManager.state.categories[cat]) return UIManager.showToast("Category already exists", "error");

                        RulesManager.addCategoryRule(cat.trim(), []);
                        this.renderRules();
                        UIManager.showToast(`Category "${cat}" added`, "success");
                    }
                } else if (payload === 'keyword') {
                    // Legacy handler if needed
                } else {
                    this.promptAddRule(payload, btn.dataset.category);
                }
            }
            if (action === 'prompt-add-rule') {
                const cat = btn.dataset.category;
                if (cat) {
                    // Adding keyword to existing category
                    const keyword = prompt(`Add keyword to "${cat}":`);
                    if (keyword && keyword.trim()) {
                        RulesManager.addCategoryRule(cat, keyword.trim().toLowerCase()).then(success => {
                            if (success) {
                                this.renderRules();
                                UIManager.showToast(`Keyword "${keyword}" added to ${cat}`, "success");
                            } else {
                                UIManager.showToast("Keyword already exists in this category", "warning");
                            }
                        });
                    }
                } else {
                    // Creating new category
                    this.promptAddRule(payload);
                }
            }
            if (action === 'prompt-add-keyword') {
                const cat = btn.dataset.category;
                const keyword = prompt(`Add keyword to "${cat}":`);
                if (keyword && keyword.trim()) {
                    RulesManager.addCategoryRule(cat, keyword.trim()).then(success => {
                        if (success) {
                            this.renderRules();
                            UIManager.showToast(`Keyword "${keyword}" added to ${cat}`, "success");
                        } else {
                            UIManager.showToast("Keyword already exists in this category", "warning");
                        }
                    });
                }
            }
            if (action === 'save-revenue-rule') {
                const admVal = parseInt(document.getElementById('admRuleInput').value);
                const instVal = parseInt(document.getElementById('instRuleInput').value);
                if (!isNaN(admVal) && !isNaN(instVal)) {
                    await RulesManager.updateRevenueRule(admVal, instVal);
                    UIManager.showToast("Revenue rules updated!", "success");
                    // Re-apply if user wants? Or just notifying them.
                }
            }
            if (action === 'delete-person') {
                if (confirm(`Remove "${payload}" from known persons?`)) {
                    RulesManager.removePerson(payload).then(() => this.renderRules());
                    UIManager.showToast("Person removed", "success");
                }
            }
            if (action === 'delete-keyword') {
                const cat = btn.dataset.category;
                const keyword = btn.dataset.keyword;
                if (confirm(`Remove "${keyword}" from ${cat}?`)) {
                    RulesManager.removeKeyword(cat, keyword).then(() => this.renderRules());
                    UIManager.showToast("Keyword removed", "success");
                }
            }
            if (action === 'sort') TransactionManager.handleSort(payload);
            if (action === 'clear-data') {
                if (confirm("Clear all data? This cannot be undone.")) {
                    indexedDB.deleteDatabase(CONFIG.DB_NAME);
                    location.reload();
                }
            }
            if (action === 'open-history') this.els.historyModal.style.display = 'flex';
            if (action === 'close-history') this.els.historyModal.style.display = 'none';
            if (action === 'delete-dataset') TransactionManager.deleteDataset(payload);
        });

        if (this.els.fileInput) {
            this.els.fileInput.addEventListener('change', e => {
                if (e.target.files.length) TransactionManager.importData(e.target.files[0]);
            });
        }

        // Filter Inputs
        const filterSearchEl = document.getElementById('filterSearch');
        if (filterSearchEl) {
            filterSearchEl.addEventListener('input', Utils.debounce(e => {
                TransactionManager.filter({ query: e.target.value });
            }, 300));
        }

        ['minAmount', 'maxAmount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', Utils.debounce(e => {
                const val = e.target.value ? Number(e.target.value) : null;
                TransactionManager.filter(id === 'minAmount' ? { min: val } : { max: val });
            }, 300));
        });

        ['startDate', 'endDate'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', e => {
                TransactionManager.filter(id === 'startDate' ? { dateStart: e.target.value } : { dateEnd: e.target.value });
            });
        });

        if (this.els.datasetList) {
            this.els.datasetList.addEventListener('change', e => {
                if (e.target.value) TransactionManager.switchDataset(e.target.value);
            });
        }

        // --- Mobile Menu Logic ---
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.querySelector('.sidebar');

        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }

        // Close sidebar on nav click (mobile & tablet)
        this.els.navItems.forEach(n => {
            n.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });

        // --- Mobile Filter Logic ---
        document.querySelectorAll('[data-mobile-action="toggle-detail"]').forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.payload;
                const panelId = `mobile${type.charAt(0).toUpperCase() + type.slice(1)}Detail`;
                const panel = document.getElementById(panelId);
                const isActive = chip.classList.contains('active');

                // Close all other panels and chips
                document.querySelectorAll('.mobile-detail-panel').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

                if (!isActive) {
                    chip.classList.add('active');
                    if (panel) panel.classList.add('active');
                }
            });
        });

        // Sync Mobile Inputs to Filter logic
        const filterSearchMobileEl = document.getElementById('filterSearchMobile');
        if (filterSearchMobileEl) {
            filterSearchMobileEl.addEventListener('input', Utils.debounce(e => {
                const desktop = document.getElementById('filterSearch');
                if (desktop) desktop.value = e.target.value; // Sync with desktop input
                TransactionManager.filter({ query: e.target.value });
            }, 300));
        }

        ['minAmountMobile', 'maxAmountMobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', Utils.debounce(e => {
                const val = e.target.value ? Number(e.target.value) : null;
                const desktopId = id.replace('Mobile', '');
                document.getElementById(desktopId).value = e.target.value; // Sync with desktop
                TransactionManager.filter(id === 'minAmountMobile' ? { min: val } : { max: val });
            }, 300));
        });

        ['startDateMobile', 'endDateMobile'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', e => {
                const desktopId = id.replace('Mobile', '');
                document.getElementById(desktopId).value = e.target.value; // Sync with desktop
                TransactionManager.filter(id === 'startDateMobile' ? { dateStart: e.target.value } : { dateEnd: e.target.value });
            });
        });

        // --- Universal Resize Handling ---
        window.addEventListener('resize', Utils.debounce(() => {
            ['mainChart', 'trendChart', 'catChart'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.data) Plotly.Plots.resize(el);
            });
        }, 100));

        // Resize on Sidebar Toggle
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                ['mainChart', 'trendChart', 'catChart'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el && el.data) Plotly.Plots.resize(el);
                });
            }, 305); // Wait for CSS transition
        });

        const sb = document.querySelector('.sidebar');
        if (sb) observer.observe(sb, { attributes: true, attributeFilter: ['class'] });
    },

    switchView(viewId, navBtn) {
        this.els.views.forEach(v => v.style.display = 'none');
        document.getElementById(viewId).style.display = 'block';

        this.els.navItems.forEach(n => n.classList.remove('active'));
        if (navBtn) navBtn.classList.add('active');

        // Update Title
        if (viewId === 'dashboardView') {
            this.els.title.textContent = "Analytics Overview";
            this.els.subtitle.textContent = "Real-time financial performance metrics";
        } else if (viewId === 'reportsView') {
            this.els.title.textContent = "Data Grid";
            this.els.subtitle.textContent = "Detailed transaction logs and filtering";
        } else {
            this.els.title.textContent = "Rules & Settings";
            this.els.subtitle.textContent = "Configure categorization and revenue logic";
            this.renderRules();
        }
    },

    handleTabSwitch(viewId, tabBtn) {
        this.els.subViews.forEach(v => v.style.display = 'none');
        const target = document.getElementById(`${viewId}SubView`);
        if (target) target.style.display = 'block';

        this.els.dashboardTabs.forEach(t => t.classList.remove('active'));
        if (tabBtn) tabBtn.classList.add('active');
    },


    update(stats, rows, predictions, recurring) {
        // Update KPIs
        this.animateValue(this.els.adm, stats.admissions);
        this.animateValue(this.els.inst, stats.installments);
        this.animateValue(this.els.rev, stats.revenue, true);
        this.animateValue(this.els.inst, stats.installments);
        this.animateValue(this.els.rev, stats.revenue, true);
        this.animateValue(this.els.netflow, stats.netFlow, true);

        // Update Growth Badges
        this.renderGrowthBadge('admGrowth', stats.growth.admissions);
        this.renderGrowthBadge('instGrowth', stats.growth.installments);
        this.renderGrowthBadge('revGrowth', stats.growth.revenue);
        this.renderGrowthBadge('netflowBadge', stats.growth.netFlow);

        // Update Health Score
        if (this.els.healthScore) {
            this.animateValue(this.els.healthScore, stats.healthScore);
            const scoreColor = stats.healthScore >= 80 ? 'var(--success)' : (stats.healthScore >= 50 ? 'var(--warning)' : 'var(--danger)');
            this.els.healthScore.style.color = scoreColor;

            if (this.els.healthScoreBadge) {
                this.els.healthScoreBadge.textContent = stats.healthScore >= 80 ? 'Excellent' : (stats.healthScore >= 50 ? 'Good' : 'Needs Work');
                this.els.healthScoreBadge.style.background = stats.healthScore >= 80 ? 'rgba(16,185,129,0.1)' : (stats.healthScore >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)');
                this.els.healthScoreBadge.style.color = scoreColor;
            }
        }

        // Update active sub-view
        const activeTab = [...this.els.dashboardTabs].find(t => t.classList.contains('active'));
        if (activeTab) {
            // No sub-view rendering needed for overview
        }

        // Update Table with Pagination (Recent Activity for Dash)
        if (this.els.recentList && rows.length > 0) {
            // Sort by date desc for recent
            const recent = [...rows].sort((a, b) => new Date(b.parsedDate) - new Date(a.parsedDate)).slice(0, 5);
            this.els.recentList.innerHTML = recent.map(r => `
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:8px; color:var(--text-muted);">${new Date(r.parsedDate).toLocaleDateString()}</td>
                    <td style="padding:8px;">${Utils.escapeHtml(r.Description)}</td>
                    <td style="padding:8px; text-align:right; font-family:'JetBrains Mono'; font-weight:500; color:${(r.parsedCredit || 0) > 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${(r.parsedCredit || 0) > 0 ? '+' : '-'}${Utils.formatCurrency((r.parsedCredit || 0) + (r.parsedDebit || 0))}
                    </td>
                </tr>
             `).join('');
        }

        // Update Savings Rate
        const savingsEl = document.getElementById('savingsRate');
        const savingsIcon = document.getElementById('savingsIcon');
        if (savingsEl) {
            savingsEl.textContent = stats.savingsRate + "%";
            savingsEl.style.color = stats.savingsRate > 20 ? 'var(--success)' : (stats.savingsRate > 0 ? 'var(--warning)' : 'var(--danger)');
        }
        if (savingsIcon) {
            savingsIcon.className = stats.savingsRate > 20 ? "fa-solid fa-arrow-trend-up" : "fa-solid fa-arrow-trend-down";
            savingsIcon.style.color = stats.savingsRate > 20 ? 'var(--success)' : 'var(--danger)';
        }

        // Update Table with Pagination
        const start = (TransactionManager.state.pagination.currentPage - 1) * TransactionManager.state.pagination.itemsPerPage;
        const end = start + TransactionManager.state.pagination.itemsPerPage;
        this.renderTable(rows.slice(start, end));
        this.renderPagination(rows.length);

        document.getElementById('telemetryRows').textContent = `${rows.length} Rows`;

        // Insights
        this.generateInsights(stats, recurring);
        this.renderVariance(stats.variance);
        this.renderBudget(stats.categoryData);

        // Update Forecast Card
        const nextIncEl = document.getElementById('nextIncome');
        const nextExpEl = document.getElementById('nextExpense');
        const forecastInsightEl = document.getElementById('forecastInsight');
        const trendBadge = document.getElementById('forecastTrendBadge');

        if (predictions) {
            this.animateValue(nextIncEl, predictions.nextMonthIncome, true);
            this.animateValue(nextExpEl, predictions.nextMonthExpense, true);
            if (forecastInsightEl) {
                forecastInsightEl.innerHTML = `Based on a 3-month weighted average, your financial trend is <strong style="color:${predictions.trend === 'Improving' ? 'var(--success)' : 'var(--danger)'}">${predictions.trend}</strong>. Next month's net cash flow is estimated at <strong>${Utils.formatCurrency(predictions.nextMonthNet)}</strong>.`;
            }
            if (trendBadge) {
                trendBadge.textContent = predictions.trend;
                trendBadge.style.background = predictions.trend === 'Improving' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
                trendBadge.style.color = predictions.trend === 'Improving' ? 'var(--success)' : 'var(--danger)';
            }
        }



        // Update Credit Card Section
        const ccSection = document.getElementById('creditCardSection');
        if (ccSection && stats.creditCard && stats.creditCard.count > 0) {
            ccSection.style.display = 'block';
            this.animateValue(document.getElementById('ccTotal'), stats.creditCard.total, true);
            this.animateValue(document.getElementById('ccCount'), stats.creditCard.count);
            this.animateValue(document.getElementById('ccAvg'), stats.creditCard.avg, true);

            const max = stats.creditCard.txns.length > 0 ? Math.max(...stats.creditCard.txns.map(t => t.parsedDebit)) : 0;
            this.animateValue(document.getElementById('ccMax'), max, true);

            const ccInsights = document.getElementById('ccInsights');
            if (ccInsights) {
                ccInsights.innerHTML = `<strong>Analysis:</strong> ${stats.creditCard.count} credit card transactions found totaling ${Utils.formatCurrency(stats.creditCard.total)}. Largest payment: ${Utils.formatCurrency(max)}.`;
            }

            // Attach Event Listener for View Details
            const btn = document.getElementById('btn-cc-details');
            if (btn) {
                // Remove old listener to prevent duplicates (cloning node is a quick hack, or just onclick)
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.onclick = () => this.showCreditCardModal(stats.creditCard.txns);
            }
        } else if (ccSection) {
            ccSection.style.display = 'none';
        }
    },

    showCreditCardModal(txns) {
        // reuse history modal structure or create new
        const modalId = 'cc-modal';
        let modal = document.getElementById(modalId);
        if (modal) document.body.removeChild(modal);

        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.style.zIndex = '10002'; // Higher than others

        modal.innerHTML = `
            <div class="modal-content" style="width: 600px; max-width: 95%;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h3 style="margin:0; display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-credit-card" style="color:#b45309;"></i> Credit Card Transactions
                    </h3>
                    <button id="close-cc-modal" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <thead style="position:sticky; top:0; background:#f8fafc;">
                            <tr>
                                <th style="text-align:left; padding:8px;">Date</th>
                                <th style="text-align:left; padding:8px;">Description</th>
                                <th style="text-align:right; padding:8px;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${txns.sort((a, b) => new Date(b.parsedDate) - new Date(a.parsedDate)).map(t => `
                                <tr style="border-bottom:1px solid var(--border);">
                                    <td style="padding:8px;">${new Date(t.parsedDate).toLocaleDateString()}</td>
                                    <td style="padding:8px;">${Utils.escapeHtml(t.Description)}</td>
                                    <td style="padding:8px; text-align:right; font-family:'JetBrains Mono'; color:var(--danger);">
                                        -${Utils.formatCurrency(t.parsedDebit)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:15px; text-align:right; color:var(--text-muted); font-size:0.8rem;">
                    ${txns.length} transactions found based on your keyword rules.
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const closeCc = document.getElementById('close-cc-modal');
        if (closeCc) closeCc.onclick = () => document.body.removeChild(modal);

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        };
    },

    renderTable(rows) {
        if (!this.els.tableBody) return;

        if (rows.length === 0) {
            this.els.tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem; color:var(--text-muted);">No matching records found.</td></tr>`;
            return;
        }

        const startIdx = (TransactionManager.state.pagination.currentPage - 1) * TransactionManager.state.pagination.itemsPerPage;

        this.els.tableBody.innerHTML = rows.map((r, i) => {
            const cleanName = Utils.cleanDesc(r.Description);
            const icon = Utils.getIconForDescription(r.Description);
            const isSelected = TransactionManager.state.selectedIds.has(r.id);
            const isOutlier = r.isAnomaly;

            return Utils.html`
                <tr class="${isSelected ? 'selected-row' : ''} ${isOutlier ? 'anomaly-row' : ''}" style="${isOutlier ? 'background: rgba(239, 68, 68, 0.02);' : ''}">
                    <td>
                        <input type="checkbox" class="row-checkbox" data-id="${r.id}" ${isSelected ? 'checked' : ''} onchange="TransactionManager.toggleSelection('${r.id}')">
                    </td>
                    <td class="cell-index hide-mobile">${startIdx + i + 1}</td>
                    <td style="white-space:nowrap">${r.parsedDate ? new Date(r.parsedDate).toLocaleDateString() : '-'}</td>
                    <td class="hide-mobile">
                        <div class="grid-type-icon ${r.parsedCredit > 0 ? 'type-in' : 'type-out'}">
                            <i class="fa-solid ${r.parsedCredit > 0 ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:32px; height:32px; border-radius:6px; background:var(--bg-hover); display:flex; align-items:center; justify-content:center; color:var(--accent); font-size:0.9rem;">
                                <i class="fa-solid ${icon}"></i>
                            </div>
                            <div style="display:flex; flex-direction:column; overflow:hidden;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span style="font-weight:600; font-size:0.85rem; color:var(--text-main); text-transform:capitalize; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.Description}">
                                        ${cleanName}
                                    </span>
                                    ${isOutlier ? Utils.safe('<span class="outlier-tag" title="Statistical outlier detected for this category"><i class="fa-solid fa-circle-exclamation"></i> Outlier</span>') : ''}
                                </div>
                                <span style="font-size:0.7rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:0.7;">
                                    ${r.Description}
                                </span>
                            </div>
                        </div>
                    </td>
                    <td class="hide-mobile">
                        <span class="grid-badge" onclick="TransactionManager.filterMsg('${r.category}')" style="cursor:pointer" title="Search all ${r.category}">
                            ${r.category}
                        </span>
                    </td>
                    <td class="cell-amount" style="color:var(--danger); font-weight:${isOutlier ? '700' : '400'}">
                        ${r.parsedDebit ? '-' + Utils.formatCurrency(r.parsedDebit) : ''}
                    </td>
                    <td class="cell-amount" style="color:var(--success)">
                        ${r.parsedCredit ? '+' + Utils.formatCurrency(r.parsedCredit) : ''}
                    </td>
                    <td>
                         <button onclick="TransactionManager.openEditModal('${r.id}')" style="color:var(--text-muted); padding:4px; margin-right:8px; border:none; background:none; cursor:pointer;" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                         <button onclick="TransactionManager.deleteTransaction('${r.id}')" style="color:var(--text-muted); padding:4px; border:none; background:none; cursor:pointer; opacity:0.5; transition:opacity 0.2s;" onmouseover="this.style.opacity=1; this.style.color='var(--danger)'" onmouseout="this.style.opacity=0.5; this.style.color='var(--text-muted)'" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        this.updateSelectionUI();
    },

    generateInsights(stats, recurring) {
        let text = "Import data to generate insights.";
        if (stats.netFlow > 0) text = `Healthy cash flow! Net positive by <strong>${Utils.formatCurrency(stats.netFlow)}</strong>.`;
        else if (stats.netFlow < 0) text = `Careful! Net negative flow of <strong>${Utils.formatCurrency(stats.netFlow)}</strong> this period.`;

        if (recurring.length > 0) {
            text += ` Detected <strong>${recurring.length}</strong> recurring subscriptions totaling ${Utils.formatCurrency(recurring.reduce((s, r) => s + r.amount, 0))}.`;
        }

        this.els.topInsight.innerHTML = text;
    },

    renderVariance(variance) {
        if (!this.els.varianceList) return;

        // Show something if variance is empty but comparison is active
        if (!variance || variance.length === 0) {
            let msg = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">Insufficient data for MoM comparison.</p>';
            if (TransactionManager.state.compareMonth) {
                msg = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">No significant spending changes found.</p>';
            }
            this.els.varianceList.innerHTML = msg;
            return;
        }

        this.els.varianceList.innerHTML = variance.slice(0, 4).map(v => Utils.html`
            <div class="variance-item">
                <span style="font-size:0.85rem; font-weight:500;">${v.category}</span>
                <span class="badge" style="${v.diff > 0 ? 'background:rgba(239,68,68,0.1); color:var(--danger);' : 'background:rgba(16,185,129,0.1); color:var(--success);'}">
                    ${v.diff > 0 ? '+' : ''}${Utils.formatCurrency(v.diff)}
                </span>
            </div>
        `).join('');
    },

    renderBudget(catData = {}) {
        if (!this.els.budgetContainer) return;
        const limits = CONFIG.BUDGET_LIMITS;
        this.els.budgetContainer.innerHTML = Object.entries(limits).map(([cat, limit]) => {
            const spent = catData[cat] || 0;
            const pct = Math.min((spent / limit) * 100, 100);
            const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)';

            return Utils.html`
            <div class="budget-item">
                <div class="budget-header">
                    <span>${cat}</span>
                    <span>${Utils.formatCurrency(spent)} / ${Utils.formatCurrency(limit)}</span>
                </div>
                <div class="budget-track">
                    <div class="budget-fill" style="width:${pct}%; background:${color};"></div>
                </div>
            </div>
            `;
        }).join('');
    },

    renderDatasetList(datasets, currentId) {
        if (this.els.datasetCount) this.els.datasetCount.textContent = `${datasets.length} Files`;
        if (!this.els.datasetList) return;
        this.els.datasetList.innerHTML = datasets.map(d =>
            `<option value="${d.id}" ${d.id === currentId ? 'selected' : ''}>${d.name} (${new Date(d.uploadDate).toLocaleDateString()})</option>`
        ).join('');

        // History Modal
        this.els.historyList.innerHTML = datasets.map(d => `
            <tr>
                <td class="dataset-cell">${new Date(d.uploadDate).toLocaleDateString()}</td>
                <td class="dataset-cell">${d.name}</td>
                <td class="dataset-cell">${d.rowCount}</td>
                <td class="dataset-cell dataset-actions">
                    <button data-action="delete-dataset" data-payload="${d.id}" class="btn-icon danger">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ${d.id !== currentId ? `<button class="btn-icon accent" onclick="TransactionManager.switchDataset('${d.id}')">Load</button>` : '<span class="dataset-active">Active</span>'}
                </td>
            </tr>
        `).join('');
    },

    renderRules() {
        // Render Categories
        const catList = document.getElementById('categoryRulesList');
        if (catList) {
            catList.innerHTML = Object.entries(RulesManager.state.categories).map(([cat, keywords]) => Utils.html`
                <div class="rule-card">
                    <div class="rule-header">
                        <strong class="rule-title">
                            <i class="fa-solid ${Utils.getIconForCategory(cat)}"></i>
                            ${cat}
                        </strong>
                        <button data-action="prompt-add-rule" data-payload="category" data-category="${cat}" class="secondary-btn rule-add-btn">
                            <i class="fa-solid fa-plus" style="font-size:0.6rem;"></i>
                        </button>
                    </div>
                    <div class="rule-keywords-simple">
                        ${keywords.length ? Utils.safe(keywords.sort().map((k, i) => Utils.html`
                            <span class="simple-keyword">
                                ${k}
                                <button data-action="delete-keyword" data-category="${cat}" data-keyword="${k}" class="simple-keyword-remove" title="Remove">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </span>${i < keywords.length - 1 ? ', ' : ''}
                        `).join('')) : Utils.safe(`<span class="rules-empty">No keywords defined</span>`)}
                    </div>
                </div>
            `).join('');
        }

        // Render Persons
        const perList = document.getElementById('personRulesList');
        if (perList) {
            perList.innerHTML = Utils.html`
                <div class="rule-card">
                    <div class="rule-header">
                        <strong class="rule-title">
                            <div class="rule-icon">
                                <i class="fa-solid fa-users"></i>
                            </div>
                            Known Persons
                        </strong>
                        <button data-action="prompt-add-rule" data-payload="person" class="secondary-btn rule-add-btn">
                            <i class="fa-solid fa-plus" style="font-size:0.6rem;"></i> Add
                        </button>
                    </div>
                    <div class="rule-keywords-simple">
                        ${Utils.safe(RulesManager.state.persons.sort().map((p, i) => Utils.html`
                            <span class="simple-keyword">
                                ${Utils.escapeHtml(p)}
                                <button data-action="delete-person" data-payload="${Utils.escapeHtml(p)}" class="simple-keyword-remove" title="Remove">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </span>${i < RulesManager.state.persons.length - 1 ? ', ' : ''}
                        `).join(''))}
                    </div>
                </div>
            `;
        }

        // Set Revenue Inputs Constants
        const admInp = document.getElementById('admRuleInput');
        const instInp = document.getElementById('instRuleInput');
        if (admInp) admInp.value = RulesManager.state.revenue.admission;
        if (instInp) instInp.value = RulesManager.state.revenue.installment;
    },

    promptAddRule(type, existingCategory) {
        if (type === 'category') {
            if (existingCategory) {
                // Adding keyword to existing category
                const keyword = prompt(`Add keyword to "${existingCategory}":`);
                if (keyword && keyword.trim()) {
                    RulesManager.addCategoryRule(existingCategory, keyword.trim().toLowerCase()).then(success => {
                        if (success) {
                            this.renderRules();
                            UIManager.showToast(`Keyword "${keyword}" added to ${existingCategory}`, "success");
                        } else {
                            UIManager.showToast("Keyword already exists in this category", "warning");
                        }
                    });
                }
            } else {
                // Creating new category
                const cat = prompt("Enter Category Name (e.g., Food):");
                if (!cat) return;
                const keyword = prompt("Enter Key Phrase to match:");
                if (cat && keyword) RulesManager.addCategoryRule(cat, keyword.toLowerCase()).then(() => this.renderRules());
            }
        } else if (type === 'person') {
            const name = prompt("Enter Person Name:");
            if (name) RulesManager.addPerson(name).then(() => this.renderRules());
        }
    },

    startLoading(msg = "Analyzing Financial Data...") {
        if (this.els.loading) {
            this.els.loading.style.display = 'flex';
            const progressBar = document.getElementById('progressBar');
            const progressContainer = document.querySelector('.progress-container');
            const loadingText = document.getElementById('loadingText');

            if (loadingText) loadingText.textContent = msg;
            if (progressBar) progressBar.style.width = '0%';
            if (progressContainer) progressContainer.style.display = 'block';
        }
    },

    stopLoading() {
        if (this.els.loading) {
            // Fade out effect
            this.els.loading.style.opacity = '0';
            setTimeout(() => {
                this.els.loading.style.display = 'none';
                this.els.loading.style.opacity = '1';
                const progressBar = document.getElementById('progressBar');
                if (progressBar) progressBar.style.width = '0%';
            }, 300);
        }
    },

    showProgress(percent, msg) {
        const progressBar = document.getElementById('progressBar');
        const loadingText = document.getElementById('loadingText');
        if (progressBar) progressBar.style.width = `${percent}% `;
        if (loadingText && msg) loadingText.textContent = `${msg} (${Math.round(percent)}%)`;
    },

    showToast(msg, type = 'info') {
        const t = document.createElement('div');
        t.className = `toast ${type} `;
        t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check' : 'fa-info-circle'}"></i> ${msg}`;
        if (!this.els.toastContainer) {
            this.els.toastContainer = document.createElement('div');
            this.els.toastContainer.id = 'toast-container';
            document.body.appendChild(this.els.toastContainer);
        }
        this.els.toastContainer.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    },

    animateValue(obj, val, isCurrency = false) {
        if (!obj) return;

        // Cancel existing animation on this object
        if (obj._animationFrame) cancelAnimationFrame(obj._animationFrame);

        const end = Number(val);
        if (isNaN(end)) return;

        // If it's the same value, don't animate (or jump to end)
        const currentText = obj.textContent.replace(/[^0-9.-]/g, '');
        const currentVal = Number(currentText) || 0;
        if (currentVal === end) return;

        const duration = 800; // Slightly faster for responsiveness
        let startTimestamp = null;

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = progress * (end - currentVal) + currentVal;

            // Use textContent for safety
            const formatted = isCurrency ? Utils.formatCurrency(current) : Math.floor(current);
            obj.textContent = formatted;

            if (progress < 1) {
                obj._animationFrame = requestAnimationFrame(step);
            } else {
                obj.textContent = isCurrency ? Utils.formatCurrency(end) : end;
                delete obj._animationFrame;
            }
        };
        obj._animationFrame = requestAnimationFrame(step);
    },

    renderGrowthBadge(id, val) {
        const el = document.getElementById(id);
        if (!el) return;
        const num = Number(val);
        if (isNaN(num) || num === 0) {
            el.innerHTML = '';
            el.className = 'metric-badge';
            return;
        }
        const isPos = num > 0;
        el.innerHTML = `${isPos ? '+' : ''}${num}% `;
        el.className = `metric - badge ${isPos ? 'positive' : 'negative'} `;
        el.style.color = isPos ? 'var(--success)' : 'var(--danger)';
        el.style.background = isPos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
    },

    renderPagination(totalItems) {
        const { currentPage, itemsPerPage } = TransactionManager.state.pagination;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const infoEl = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (infoEl) infoEl.textContent = `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} -${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems} `;

        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => {
                TransactionManager.state.pagination.currentPage--;
                const rows = TransactionManager.state.filteredRows;
                const stats = TransactionManager.analyze(rows);
                const recurring = TransactionManager.detectRecurring(rows);
                const predictions = TransactionManager.predict(stats.monthly);
                UIManager.update(stats, rows, predictions, recurring);
            };
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages || totalItems === 0;
            nextBtn.onclick = () => {
                TransactionManager.state.pagination.currentPage++;
                const rows = TransactionManager.state.filteredRows;
                const stats = TransactionManager.analyze(rows);
                const recurring = TransactionManager.detectRecurring(rows);
                const predictions = TransactionManager.predict(stats.monthly);
                UIManager.update(stats, rows, predictions, recurring);
            };
        }
    }
};

// --- COMMAND MANAGER ---
const CommandManager = {
    isOpen: false,
    selectedIndex: 0,
    matches: [],

    commands: [
        { id: 'nav-dash', label: 'Go to Dashboard', icon: 'fa-chart-line', action: () => UIManager.switchView('dashboardView') },
        { id: 'nav-rep', label: 'Go to Data Grid', icon: 'fa-table', action: () => UIManager.switchView('reportsView') },
        { id: 'nav-rule', label: 'Go to Rules', icon: 'fa-sliders', action: () => UIManager.switchView('rulesView') },
        { id: 'act-import', label: 'Import Dataset', icon: 'fa-file-import', action: () => document.getElementById('smartFileUpload').click() },
        { id: 'act-pdf', label: 'Download PDF Report', icon: 'fa-file-pdf', action: () => ReportManager.generatePDF() },
        { id: 'act-clear', label: 'Clear All Data', icon: 'fa-trash', action: () => TransactionManager.clearAll() },
    ],

    init() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            if (this.isOpen) this.handleInput(e);
        });

        const debouncedSearch = Utils.debounce((e) => this.search(e.target.value), 300);
        const cmdInputEl = document.getElementById('cmdInput');
        if (cmdInputEl) cmdInputEl.addEventListener('input', debouncedSearch);
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const el = document.getElementById('commandPalette');
        if (el) el.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            const inEl = document.getElementById('cmdInput');
            if (inEl) {
                inEl.value = '';
                inEl.focus();
            }
            this.search('');
        }
    },

    search(query) {
        const q = query.toLowerCase();

        // 1. Static Commands
        let results = this.commands.filter(c => c.label.toLowerCase().includes(q));

        // 2. Dynamic Search (Transactions)
        if (q.length > 2) {
            const txMatches = TransactionManager.state.allRows
                .filter(r => r.searchText.includes(q))
                .slice(0, 5)
                .map(r => ({
                    id: 'tx-' + r.id,
                    label: `Search: "${r.Description}"`,
                    desc: `${Utils.formatCurrency(r.parsedDebit || r.parsedCredit)} - ${r.category || 'Uncategorized'} `, // Added category to description
                    icon: 'fa-search',
                    action: () => {
                        UIManager.switchView('reportsView');
                        TransactionManager.filter({ query: q });
                    }
                }));
            results = [...results, ...txMatches];
        }

        this.matches = results;
        this.selectedIndex = 0;
        this.render();
    },

    render() {
        const list = document.getElementById('cmdList');
        if (this.matches.length === 0) {
            list.innerHTML = `< div style = "padding:10px; color:var(--text-muted); font-size:0.8rem;" > No results found.</div > `;
            return;
        }

        list.innerHTML = this.matches.map((c, i) => `
                < div class="cmd-item ${i === this.selectedIndex ? 'selected' : ''}" onclick = "CommandManager.execute(${i})" >
                    <div style="display:flex; align-items:center;">
                        <div class="cmd-icon"><i class="fa-solid ${c.icon}"></i></div>
                        <div>
                            <div style="font-weight:500;">${c.label}</div>
                            ${c.desc ? `<div class="cmd-desc">${c.desc}</div>` : ''}
                        </div>
                    </div>
                ${i === this.selectedIndex ? '<i class="fa-solid fa-turn-down" style="font-size:0.7rem;"></i>' : ''}
            </div >
    `).join('');

        // Ensure selected is visible
        const selectedEl = list.children[this.selectedIndex];
        if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
    },

    handleInput(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.matches.length;
            this.render();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.matches.length) % this.matches.length;
            this.render();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.execute(this.selectedIndex);
        } else if (e.key === 'Escape') {
            this.toggle();
        }
    },

    execute(index) {
        const item = this.matches[index];
        if (item) {
            this.toggle();
            item.action();
        }
    }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // console.log("Finance Dashboard Pro v3.0 Initializing...");
    try {
        UIManager.init();
        CommandManager.init(); // Initialize Smart Search
        await TransactionManager.init();
    } catch (err) {
        // console.error("Initialization Failed:", err);
        UIManager.showToast("Application failed to initialize: " + err.message, "error");
    }
});
