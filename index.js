   // Firebase konfiguratsiyasi
   const firebaseConfig = {
    apiKey: "AIzaSyDwATvxtZn26JXm3c_raQc-TRCuTGpkcSw",
    authDomain: "sertprep-c552c.firebaseapp.com",
    projectId: "sertprep-c552c",
    storageBucket: "sertprep-c552c.firebasestorage.com",
    messagingSenderId: "75836357408",
    appId: "1:75836357408:web:186740130480c0e855b545",
    measurementId: "G-SPRX3CVX9F"
};

let db;
let auth;
let currentUser = null;
let currentUserData = null;
let currentTournamentId = null;

// Coin modal o'zgaruvchilari
let selectedCoinAmount = 0;
let selectedPaymentMethod = '';
const coinPrices = {
    100: 1.00,
    500: 4.50,
    1000: 8.00,
    5000: 35.00
};

document.addEventListener('DOMContentLoaded', function() {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        console.log("Firebase ga ulandik!");
        
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                currentUserData = await getUserData(user.uid);
                updateUserUI(user, currentUserData);
                loadTournaments();
            } else {
                currentUser = null;
                currentUserData = null;
                updateUserUI(null, null);
                loadTournaments();
            }
        });
        
        setupAuthForms();
        loadTournaments();
            setupSidebarToggle();
            setupSidebarNav();
        
    } catch (error) {
        console.error("Firebase inicializatsiyasida xatolik: ", error);
        document.getElementById('loading').innerHTML = `
            <p style="color: #ffd700;">Firebase ga ulanilmadi. Offline rejimda ishlayapmiz...</p>
        `;
        loadTournamentsOffline();
        setupSidebarToggle();
    }
});

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const appLayout = document.getElementById('appLayout'); // Get the new app-layout element
    const overlay = document.getElementById('sidebarOverlay');

    function openSidebar() {
        appLayout.classList.add('sidebar-open');
        sidebarToggle.innerHTML = '<i class="fas fa-times"></i>';
        if (overlay) {
            overlay.style.display = 'block';
            // allow CSS transition if any (opacity) — ensure visible quickly
            setTimeout(() => { overlay.style.opacity = '1'; }, 20);
        }
    }

    function closeSidebar() {
        appLayout.classList.remove('sidebar-open');
        sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 250);
        }
    }

    sidebarToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        if (appLayout.classList.contains('sidebar-open')) closeSidebar();
        else openSidebar();
    });

    // Clicking the overlay closes the sidebar
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Close sidebar if clicked outside and it's open on mobile (but ignore clicks inside sidebar)
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 1024 && appLayout.classList.contains('sidebar-open')) {
            if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target) && ! (overlay && overlay.contains(event.target))) {
                closeSidebar();
            }
        }
    });

    // Open sidebar when user clicks/taps on the left edge (within 40px)
    document.addEventListener('click', function(event) {
        try {
            if (window.innerWidth <= 1024 && !appLayout.classList.contains('sidebar-open')) {
                const x = (event.touches && event.touches[0]) ? event.touches[0].clientX : event.clientX;
                if (typeof x === 'number' && x <= 40) {
                    // Avoid opening if user actually clicked the sidebar toggle or other control
                    if (!sidebarToggle.contains(event.target) && !sidebar.contains(event.target)) {
                        openSidebar();
                    }
                }
            }
        } catch (err) {
            // ignore
        }
    });
}

function setupSidebarNav() {
    // Add data-label attributes to nav buttons if missing and wire active behavior
    const navButtons = document.querySelectorAll('.sidebar-nav-btn');
    navButtons.forEach(btn => {
        // ensure data-label for tooltip
        if (!btn.hasAttribute('data-label')) {
            const span = btn.querySelector('span');
            if (span) btn.setAttribute('data-label', span.textContent.trim());
        }

        btn.addEventListener('click', function(e) {
            // set active class on click
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Mark first nav as active by default
    if (navButtons.length > 0 && !document.querySelector('.sidebar-nav-btn.active')) {
        navButtons[0].classList.add('active');
    }
}

async function getUserData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Foydalanuvchi ma'lumotlarini olishda xatolik:", error);
        return null;
    }
}

function setupAuthForms() {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        clearErrors('login');
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log("Foydalanuvchi kirdi:", userCredential.user.email);
            
            document.getElementById('loginSuccess').textContent = "Muvaffaqiyatli kirdingiz!";
            document.getElementById('loginSuccess').classList.add('show');
            
            setTimeout(() => {
                closeAuthModal();
                document.getElementById('loginSuccess').classList.remove('show');
                document.getElementById('loginForm').reset();
            }, 1500);
            
        } catch (error) {
            console.error("Kirishda xatolik:", error);
            handleAuthError(error, 'login');
        }
    });
    
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const telegram = document.getElementById('registerTelegram').value.trim().replace('@', '');
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        clearErrors('register');
        
        if (!telegram) {
            document.getElementById('registerTelegramError').textContent = "Telegram username kiritishingiz kerak!";
            document.getElementById('registerTelegramError').classList.add('show');
            return;
        }
        
        const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
        if (!telegramRegex.test(telegram)) {
            document.getElementById('registerTelegramError').textContent = "Noto'g'ri format! Faqat harflar, raqamlar va _ ishlatish mumkin.";
            document.getElementById('registerTelegramError').classList.add('show');
            return;
        }
        
        if (password !== confirmPassword) {
            document.getElementById('registerConfirmError').textContent = "Parollar mos kelmadi!";
            document.getElementById('registerConfirmError').classList.add('show');
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('registerPasswordError').textContent = "Parol kamida 6 ta belgidan iborat bo'lishi kerak!";
            document.getElementById('registerPasswordError').classList.add('show');
            return;
        }
        
        try {
            const telegramSnapshot = await db.collection('users')
                .where('telegram', '==', telegram)
                .get();
            
            if (!telegramSnapshot.empty) {
                document.getElementById('registerTelegramError').textContent = "Bu Telegram username allaqachon band!";
                document.getElementById('registerTelegramError').classList.add('show');
                return;
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                telegram: telegram,
                createdAt: new Date().toISOString(),
                tournaments: [],
                coins: 0,
                coinHistory: []
            });
            
            console.log("Foydalanuvchi ro'yxatdan o'tdi:", userCredential.user.email);
            
            document.getElementById('registerSuccess').textContent = "Muvaffaqiyatli ro'yxatdan o'tdingiz!";
            document.getElementById('registerSuccess').classList.add('show');
            
            setTimeout(() => {
                document.getElementById('registerForm').reset();
                document.getElementById('registerSuccess').classList.remove('show');
                showLoginForm();
            }, 1500);
            
        } catch (error) {
            console.error("Ro'yxatdan o'tishda xatolik:", error);
            handleAuthError(error, 'register');
        }
    });
}

function handleAuthError(error, formType) {
    const errorCode = error.code;
    let errorMessage = "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
    
    switch(errorCode) {
        case 'auth/invalid-email':
            errorMessage = "Noto'g'ri email formati!";
            document.getElementById(`${formType}EmailError`).textContent = errorMessage;
            document.getElementById(`${formType}EmailError`).classList.add('show');
            break;
        case 'auth/user-not-found':
            errorMessage = "Bu email bilan foydalanuvchi topilmadi!";
            document.getElementById(`${formType}EmailError`).textContent = errorMessage;
            document.getElementById(`${formType}EmailError`).classList.add('show');
            break;
        case 'auth/wrong-password':
            errorMessage = "Noto'g'ri parol!";
            document.getElementById(`${formType}PasswordError`).textContent = errorMessage;
            document.getElementById(`${formType}PasswordError`).classList.add('show');
            break;
        case 'auth/email-already-in-use':
            errorMessage = "Bu email allaqachon ro'yxatdan o'tgan!";
            document.getElementById(`${formType}EmailError`).textContent = errorMessage;
            document.getElementById(`${formType}EmailError`).classList.add('show');
            break;
        case 'auth/weak-password':
            errorMessage = "Parol juda oddiy, kuchliroq parol tanlang!";
            document.getElementById(`${formType}PasswordError`).textContent = errorMessage;
            document.getElementById(`${formType}PasswordError`).classList.add('show');
            break;
        default:
            alert(errorMessage);
    }
}

function clearErrors(formType) {
    const errors = document.querySelectorAll(`#${formType}Form .error-message`);
    errors.forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });
    
    const successMessages = document.querySelectorAll(`#${formType}Form .success-message`);
    successMessages.forEach(msg => {
        msg.classList.remove('show');
    });
}

function updateUserUI(user, userData) {
    const userSidebarInfo = document.getElementById('userSidebarInfo');
    const sidebarAuthBtn = document.getElementById('sidebarAuthBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    
    if (user && userData) {
        userSidebarInfo.style.display = 'block';
        sidebarAuthBtn.style.display = 'none';
        sidebarLogoutBtn.style.display = 'flex';
        
        const displayName = user.displayName || user.email.split('@')[0];
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        document.getElementById('userSidebarName').textContent = displayName;
        document.getElementById('userSidebarAvatar').textContent = firstLetter;
        
        if (userData.telegram) {
            document.getElementById('userSidebarTelegramText').textContent = userData.telegram;
            document.getElementById('userSidebarTelegram').style.display = 'flex';
        } else {
            document.getElementById('userSidebarTelegram').style.display = 'none';
        }
        
        const userCoins = userData.coins || 0;
        document.getElementById('userCoinsSidebar').textContent = userCoins;
        
    } else {
        userSidebarInfo.style.display = 'none';
        sidebarAuthBtn.style.display = 'flex';
        sidebarLogoutBtn.style.display = 'none';
        
        // Default values for logged out state
        document.getElementById('userCoinsSidebar').textContent = '12';
        document.getElementById('userSidebarName').textContent = 'kamoliddin';
        document.getElementById('userSidebarAvatar').textContent = 'K';
        document.getElementById('userSidebarTelegramText').textContent = 'kamolfrontdev';
        document.getElementById('userSidebarTelegram').style.display = 'flex';
    }
}

function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    showLoginForm();
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    clearErrors('login');
    clearErrors('register');
}

function showLoginForm() {
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-form').forEach(form => form.classList.remove('active'));
    
    document.querySelector('.modal-tab:nth-child(1)').classList.add('active');
    document.getElementById('loginForm').classList.add('active');
}

function showRegisterForm() {
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-form').forEach(form => form.classList.remove('active'));
    
    document.querySelector('.modal-tab:nth-child(2)').classList.add('active');
    document.getElementById('registerForm').classList.add('active');
}

async function logout() {
    if (confirm("Chiqishni istaysizmi?")) {
        try {
            await auth.signOut();
            console.log("Foydalanuvchi chiqdi");
        } catch (error) {
            console.error("Chiqishda xatolik:", error);
        }
    }
}

async function loadTournaments() {
    const tournamentsList = document.getElementById('tournamentsList');
    const loadingElement = document.getElementById('loading');
    
    loadingElement.style.display = 'block';
    tournamentsList.innerHTML = '';
    
    try {
        const querySnapshot = await db.collection('tournaments').get();
        const tournaments = [];
        
        querySnapshot.forEach((doc) => {
            const tournament = doc.data();
            tournament.id = doc.id;
            tournaments.push(tournament);
        });
        
        loadingElement.style.display = 'none';
        displayTournaments(tournaments);
        
        db.collection('tournaments').onSnapshot((snapshot) => {
            const updatedTournaments = [];
            snapshot.forEach((doc) => {
                const tournament = doc.data();
                tournament.id = doc.id;
                updatedTournaments.push(tournament);
            });
            displayTournaments(updatedTournaments);
        });
        
    } catch (error) {
        console.error("Turnirlarni yuklashda xatolik: ", error);
        loadingElement.style.display = 'none';
        loadTournamentsOffline();
    }
}

function loadTournamentsOffline() {
    const tournamentsList = document.getElementById('tournamentsList');
    let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
    
    const now = new Date();
    const activeTournaments = tournaments.filter(tournament => new Date(tournament.date) > now);
    if (activeTournaments.length !== tournaments.length) {
        localStorage.setItem('tournaments', JSON.stringify(activeTournaments));
        tournaments = activeTournaments;
    }
    
    displayTournaments(tournaments);
}

function displayTournaments(tournaments) {
    const tournamentsList = document.getElementById('tournamentsList');
    const now = new Date();
    
    updateStats(tournaments);
    
    if (tournaments.length === 0) {
        tournamentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <h3>Hozircha turnirlar mavjud emas</h3>
                <p>Yangi turnir qo'shish uchun admin paneliga o'ting.</p>
            </div>
        `;
        return;
    }
    
    tournaments.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    tournamentsList.innerHTML = tournaments.map(tournament => {
        const date = new Date(tournament.date);
        const formattedDate = date.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const createdDate = new Date(tournament.created);
        const formattedCreatedDate = createdDate.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const participantsCount = tournament.participants ? tournament.participants.length : 0;
        
        let alreadyParticipated = false;
        if (currentUser && tournament.participants) {
            alreadyParticipated = tournament.participants.some(p => p.userId === currentUser.uid);
        }
        
        return `
            <div class="tournament-card" data-id="${tournament.id}">
                <div class="tournament-header">
                    <div class="tournament-name">${tournament.name}</div>
                    <div class="tournament-date">${formattedDate}</div>
                </div>
                
                <div class="tournament-details">
                    <div class="detail-row">
                        <span class="detail-label">Qo'shilgan sana:</span>
                        <span>${formattedCreatedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Qatnashish narxi:</span>
                        <span><strong>${tournament.fee.toFixed(2)}$</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Qatnashchilar soni:</span>
                        <span>${participantsCount} kishi</span>
                    </div>
                </div>
                
                <div class="prize-container">
                    <div class="prize-label">
                        <i class="fas fa-gift"></i> Sovg'a (Mukofot)
                    </div>
                    <div>${tournament.prize}</div>
                </div>
                
                
                <div class="card-footer">
                    ${alreadyParticipated ? `
                        <div class="already-participated">
                            <i class="fas fa-check-circle"></i> Siz allaqachon qatnashdingiz!
                        </div>
                    ` : `
                        <button class="participate-btn" 
                            onclick="participateInTournament('${tournament.id}')"
                            ${!currentUser ? 'disabled' : ''}>
                            ${!currentUser ? 'Qatnashish uchun kiring' : 'Qatnashish'}
                        </button>
                    `}
                    
                    <div class="participants-count">
                        <i class="fas fa-users"></i> ${participantsCount} kishi qatnashmoqda
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function participateInTournament(tournamentId) {
    if (!currentUser) {
        currentTournamentId = tournamentId;
        openAuthModal();
        return;
    }
    
    if (!currentUserData) {
        currentUserData = await getUserData(currentUser.uid);
    }
    
    try {
        const tournamentRef = db.collection('tournaments').doc(tournamentId);
        const tournamentDoc = await tournamentRef.get();
        
        if (!tournamentDoc.exists) {
            alert("Turnir topilmadi!");
            return;
        }
        
        const tournament = tournamentDoc.data();
        
        const participants = tournament.participants || [];
        const alreadyParticipated = participants.some(p => p.userId === currentUser.uid);
        
        if (alreadyParticipated) {
            alert("Siz allaqachon bu turnirga qatnashgansiz!");
            return;
        }
        
        const newParticipant = {
            userId: currentUser.uid,
            userName: currentUser.displayName || currentUser.email,
            userEmail: currentUser.email,
            telegram: currentUserData.telegram || '',
            joinedAt: new Date().toISOString()
        };
        
        participants.push(newParticipant);
        
        await tournamentRef.update({ participants });
        
        alert(`Tabriklaymiz, ${newParticipant.userName}! Siz turnirga muvaffaqiyatli qo'shildingiz.`);
        
        await updateUserTournaments(tournamentId);
        
    } catch (error) {
        console.error("Qatnashishda xatolik:", error);
        alert("Qatnashishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    }
}

async function updateUserTournaments(tournamentId) {
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const userTournaments = userData.tournaments || [];
            
            if (!userTournaments.includes(tournamentId)) {
                userTournaments.push(tournamentId);
                await userRef.update({ tournaments: userTournaments });
                
                // UI ni yangilash
                currentUserData = await getUserData(currentUser.uid);
                updateUserUI(currentUser, currentUserData);
            }
        }
    } catch (error) {
        console.error("Foydalanuvchi turnirlarini yangilashda xatolik:", error);
    }
}

function updateStats(tournaments) {
    const total = tournaments.length;
    const now = new Date();
    const upcoming = tournaments.filter(t => new Date(t.date) > now).length;
    let averageFee = 0;
    
    if (total > 0) {
        const totalFee = tournaments.reduce((sum, t) => sum + t.fee, 0);
        averageFee = totalFee / total;
    }
    
    // Sidebar stats
    document.getElementById('sidebarTotalTournaments').textContent = total;
    document.getElementById('sidebarUpcomingTournaments').textContent = upcoming;
    document.getElementById('sidebarAverageFee').textContent = averageFee.toFixed(2) + "$";
}

auth.onAuthStateChanged((user) => {
    if (user && currentTournamentId) {
        setTimeout(() => {
            participateInTournament(currentTournamentId);
            currentTournamentId = null;
        }, 1000);
    }
});

// ==============================
// COIN SOTIB OLISH FUNCTIONS
// ==============================

function openCoinModal() {
    if (!currentUser) {
        alert("Coin sotib olish uchun avval tizimga kiring!");
        openAuthModal();
        return;
    }
    
    // Reset selections
    selectedCoinAmount = 0;
    selectedPaymentMethod = '';
    
    // Remove all selected classes
    document.querySelectorAll('.coin-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelectorAll('.payment-method').forEach(method => {
        method.classList.remove('selected');
    });
    
    // Hide payment action initially
    document.getElementById('paymentAction').innerHTML = '';
    
    document.getElementById('coinModal').style.display = 'flex';
}

function closeCoinModal() {
    document.getElementById('coinModal').style.display = 'none';
}

function selectCoinOption(amount) {
    selectedCoinAmount = amount;

    // Remove selected class from all options
    document.querySelectorAll('.coin-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Add selected class to clicked option (use event when available)
    const el = (typeof event !== 'undefined' && event && event.target) ? event.target.closest('.coin-option') : null;
    if (el) el.classList.add('selected');

    // Update payment action button if payment method is already selected
    if (selectedPaymentMethod) {
        updatePaymentActionButton();
    }
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Remove selected class from all methods
    document.querySelectorAll('.payment-method').forEach(m => {
        m.classList.remove('selected');
    });

    // Add selected class to clicked method (use event when available)
    const el = (typeof event !== 'undefined' && event && event.target) ? event.target.closest('.payment-method') : null;
    if (el) el.classList.add('selected');

    // Update payment action button
    updatePaymentActionButton();
}

function updatePaymentActionButton() {
    const paymentAction = document.getElementById('paymentAction');
    
    if (!selectedCoinAmount || !selectedPaymentMethod) {
        paymentAction.innerHTML = '';
        return;
    }
    
    const price = coinPrices[selectedCoinAmount];
    
    if (selectedPaymentMethod === 'admin') {
        paymentAction.innerHTML = `
            <button class="proceed-btn" onclick="proceedWithAdminPayment()">
                <i class="fas fa-paper-plane"></i> Admin ga Murojaat Qilish ($${price.toFixed(2)})
            </button>
        `;
    } else if (selectedPaymentMethod === 'click') {
        paymentAction.innerHTML = `
            <button class="proceed-btn" onclick="alert('Click to\'lov: funksionallik tez orada qo\'shiladi')">
                <i class="fas fa-mouse-pointer"></i> Click orqali to'lov ($${price.toFixed(2)})
            </button>
        `;
    }
}

function proceedWithAdminPayment() {
    if (!selectedCoinAmount) {
        alert("Iltimos, avval coin miqdorini tanlang!");
        return;
    }
    
    const price = coinPrices[selectedCoinAmount];
    const telegramUsername = "kamolfrontdev";
    const message = `Assalomu alaykum! Men ${selectedCoinAmount} star sotib olmoqchiman ($${price.toFixed(2)}). Qanday to'lov qilishim kerak?`;
    
    // Telegram link yaratish
    const telegramLink = `https://t.me/${telegramUsername}?text=${encodeURIComponent(message)}`;
    
    // Linkni ochish
    window.open(telegramLink, '_blank');
    
    // Modalni yopish
    closeCoinModal();
    
    // Foydalanuvchiga xabar berish
    alert(`Telegramda @${telegramUsername} ga murojaat qilindingiz. U siz bilan bog'lanadi va to'lov tartibini tushuntiradi.`);
}

window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const coinModal = document.getElementById('coinModal');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const appLayout = document.getElementById('appLayout');
    
    if (event.target === authModal) {
        closeAuthModal();
    }
    if (event.target === coinModal) {
        closeCoinModal();
    }
    // Close sidebar if clicked outside and it's open on mobile
    if (window.innerWidth <= 1024 && appLayout.classList.contains('sidebar-open')) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            appLayout.classList.remove('sidebar-open');
            sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>'; // Reset icon
        }
    }
};