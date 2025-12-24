
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
        let isFirebaseActive = false;
        let unsubscribe;
        let currentParticipantsTournamentId = null;
        let allUsers = [];

        document.addEventListener('DOMContentLoaded', function() {
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.getAttribute('data-tab');
                    
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(tabId).classList.add('active');
                    
                    if (tabId === 'manage-tournaments') {
                        loadTournaments();
                    } else if (tabId === 'manage-users') {
                        loadUsers();
                    } else if (tabId === 'statistics') {
                        updateStatistics();
                    } else if (tabId === 'coin-management') {
                        loadTopCoins();
                    }
                });
            });
            
            document.getElementById('refreshBtn').addEventListener('click', function() {
                const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
                
                if (activeTab === 'manage-tournaments') {
                    loadTournaments();
                } else if (activeTab === 'manage-users') {
                    loadUsers();
                } else if (activeTab === 'statistics') {
                    updateStatistics();
                } else if (activeTab === 'coin-management') {
                    loadTopCoins();
                }
            });
            
            document.getElementById('userSearch').addEventListener('input', function(e) {
                filterUsers(e.target.value);
            });
            
            setupFirebase();
        });
        
        async function setupFirebase() {
            try {
                firebase.initializeApp(firebaseConfig);
                db = firebase.firestore();
                auth = firebase.auth();
                isFirebaseActive = true;
                console.log("Firebase ga muvaffaqiyatli ulandik!");
                
                setupFormSubmission();
                loadTournaments();
                loadUsers();
                setupRealtimeUpdates();
                
            } catch (error) {
                console.error("Firebase inicializatsiyasida xatolik: ", error);
                isFirebaseActive = false;
                setupLocalStorageFallback();
                loadTournaments();
                loadUsers();
            }
        }
        
        function setupRealtimeUpdates() {
            if (isFirebaseActive && db) {
                if (unsubscribe) {
                    unsubscribe();
                }
                
                unsubscribe = db.collection('tournaments').onSnapshot((snapshot) => {
                    const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
                    
                    if (activeTab === 'manage-tournaments') {
                        loadTournaments();
                    } else if (activeTab === 'statistics') {
                        updateStatistics();
                    }
                });
                
                db.collection('users').onSnapshot((snapshot) => {
                    const activeTab = document.querySelector('.tab.active').getAttribute('data-tab');
                    
                    if (activeTab === 'manage-users') {
                        loadUsers();
                    } else if (activeTab === 'statistics') {
                        updateStatistics();
                    } else if (activeTab === 'coin-management') {
                        loadTopCoins();
                    }
                });
            }
        }
        
        function setupFormSubmission() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('tournamentDate').value = defaultDateTime;
            
            document.getElementById('tournamentForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const tournamentName = document.getElementById('tournamentName').value;
                const tournamentDate = document.getElementById('tournamentDate').value;
                const participationFee = document.getElementById('participationFee').value;
                const prize = document.getElementById('prize').value;
                
                const tournament = {
                    name: tournamentName,
                    date: tournamentDate,
                    fee: parseFloat(participationFee),
                    prize: prize,
                    created: new Date().toISOString(),
                    participants: []
                };
                
                if (isFirebaseActive && db) {
                    try {
                        await db.collection('tournaments').add(tournament);
                        showSuccessMessage('successMessage');
                    } catch (error) {
                        console.error("Turnir qo'shishda xatolik: ", error);
                        alert("Turnir qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
                    }
                } else {
                    let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                    tournament.id = Date.now();
                    tournaments.push(tournament);
                    localStorage.setItem('tournaments', JSON.stringify(tournaments));
                    showSuccessMessage('successMessage');
                }
                
                document.getElementById('tournamentForm').reset();
                document.getElementById('tournamentDate').value = defaultDateTime;
            });
        }
        
        function showSuccessMessage(messageId) {
            const successMessage = document.getElementById(messageId);
            successMessage.classList.add('show');
            
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 5000);
        }
        
        async function loadTournaments() {
            const tournamentsList = document.getElementById('tournamentsList');
            const loadingElement = document.getElementById('loadingTournaments');
            const noTournamentsMessage = document.getElementById('noTournamentsMessage');
            
            loadingElement.style.display = 'block';
            tournamentsList.innerHTML = '';
            noTournamentsMessage.style.display = 'none';
            
            try {
                let tournaments = [];
                
                if (isFirebaseActive && db) {
                    const querySnapshot = await db.collection('tournaments').get();
                    querySnapshot.forEach((doc) => {
                        const tournament = doc.data();
                        tournament.id = doc.id;
                        tournaments.push(tournament);
                    });
                } else {
                    tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                    
                    const now = new Date();
                    const activeTournaments = tournaments.filter(tournament => new Date(tournament.date) > now);
                    if (activeTournaments.length !== tournaments.length) {
                        localStorage.setItem('tournaments', JSON.stringify(activeTournaments));
                        tournaments = activeTournaments;
                    }
                }
                
                loadingElement.style.display = 'none';
                
                if (tournaments.length === 0) {
                    noTournamentsMessage.style.display = 'block';
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
                                    <span class="detail-label">ID:</span>
                                    <span style="font-size: 0.9rem; opacity: 0.8;">${tournament.id}</span>
                                </div>
                            </div>
                            
                            <div class="prize-container">
                                <div class="prize-label">
                                    <i class="fas fa-gift"></i> Sovg'a (Mukofot)
                                </div>
                                <div>${tournament.prize}</div>
                            </div>
                            
                            <div class="participants-info">
                                <div class="participants-count">
                                    <i class="fas fa-users"></i> ${participantsCount} ta qatnashchi
                                </div>
                                <button class="view-participants-btn" onclick="viewParticipants('${tournament.id}', '${tournament.name}')">
                                    <i class="fas fa-eye"></i> Qatnashchilarni Ko'rish
                                </button>
                            </div>
                            
                            <div class="card-footer">
                                <button class="delete-btn" onclick="deleteTournament('${tournament.id}')">
                                    <i class="fas fa-trash"></i> Turnirni O'chirish
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                console.error("Turnirlarni yuklashda xatolik: ", error);
                loadingElement.style.display = 'none';
                tournamentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Xatolik yuz berdi</h3>
                        <p>Turnirlarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.</p>
                    </div>
                `;
            }
        }
        
        async function loadUsers() {
            const usersList = document.getElementById('usersList');
            const loadingElement = document.getElementById('loadingUsers');
            const noUsersMessage = document.getElementById('noUsersMessage');
            
            loadingElement.style.display = 'block';
            usersList.innerHTML = '';
            noUsersMessage.style.display = 'none';
            
            try {
                if (isFirebaseActive && db) {
                    const querySnapshot = await db.collection('users').get();
                    allUsers = [];
                    
                    querySnapshot.forEach((doc) => {
                        const user = doc.data();
                        user.id = doc.id;
                        allUsers.push(user);
                    });
                    
                    displayUsers(allUsers);
                } else {
                    allUsers = JSON.parse(localStorage.getItem('users')) || [];
                    displayUsers(allUsers);
                }
                
                loadingElement.style.display = 'none';
                
                if (allUsers.length === 0) {
                    noUsersMessage.style.display = 'block';
                }
                
            } catch (error) {
                console.error("Userlarni yuklashda xatolik: ", error);
                loadingElement.style.display = 'none';
                usersList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Xatolik yuz berdi</h3>
                        <p>Userlarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.</p>
                    </div>
                `;
            }
        }
        
        function displayUsers(users) {
            const usersList = document.getElementById('usersList');
            
            if (users.length === 0) {
                document.getElementById('noUsersMessage').style.display = 'block';
                usersList.innerHTML = '';
                return;
            }
            
            document.getElementById('noUsersMessage').style.display = 'none';
            
            users.sort((a, b) => {
                const nameA = a.name || '';
                const nameB = b.name || '';
                return nameA.localeCompare(nameB);
            });
            
            usersList.innerHTML = users.map(user => {
                const name = user.name || 'Noma\'lum';
                const email = user.email || '';
                const telegram = user.telegram || '';
                const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : 'Noma\'lum';
                const coins = user.coins || 0;
                const coinHistory = user.coinHistory || [];
                
                const firstLetter = name.charAt(0).toUpperCase();
                
                const recentHistory = coinHistory.slice(-3).reverse();
                
                return `
                    <div class="user-card" data-id="${user.id}">
                        <div class="user-header">
                            <div class="user-avatar">${firstLetter}</div>
                            <div class="user-info">
                                <div class="user-name">${name}</div>
                                <div class="user-email">${email}</div>
                                ${telegram ? `<div class="telegram-badge"><i class="fab fa-telegram"></i> @${telegram}</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="user-details">
                            <div class="user-detail-row">
                                <span class="user-detail-label">Ro'yxatdan o'tgan:</span>
                                <span>${createdAt}</span>
                            </div>
                            <div class="user-detail-row">
                                <span class="user-detail-label">ID:</span>
                                <span style="font-size: 0.8rem; opacity: 0.7;">${user.id}</span>
                            </div>
                        </div>
                        
                        <div class="coin-container">
                            <div class="coin-label">
                                <i class="fas fa-coins"></i> Coins
                            </div>
                            <div class="coin-amount">${coins}</div>
                            <div class="coin-controls">
                                <div class="coin-input">
                                    <input type="number" id="coinAmount_${user.id}" placeholder="Coin miqdori" min="1" max="10000">
                                </div>
                                <button class="coin-btn" onclick="addCoins('${user.id}', true)">
                                    <i class="fas fa-plus"></i> Qo'shish
                                </button>
                                <button class="coin-btn minus" onclick="addCoins('${user.id}', false)">
                                    <i class="fas fa-minus"></i> Olib Tashlash
                                </button>
                            </div>
                            <button class="view-participants-btn" style="margin-top: 10px;" onclick="viewCoinHistory('${user.id}', '${name}')">
                                <i class="fas fa-history"></i> Coin Tarixi
                            </button>
                        </div>
                        
                        ${recentHistory.length > 0 ? `
                            <div class="coin-history">
                                <div class="history-title">
                                    <i class="fas fa-history"></i> So'nggi O'zgarishlar
                                </div>
                                ${recentHistory.map(history => `
                                    <div class="history-item ${history.amount > 0 ? 'history-positive' : 'history-negative'}">
                                        ${history.amount > 0 ? '+' : ''}${history.amount} coins - ${history.reason}
                                        <div class="history-admin">${new Date(history.date).toLocaleDateString('uz-UZ')}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        
        function filterUsers(searchTerm) {
            const filteredUsers = allUsers.filter(user => {
                const search = searchTerm.toLowerCase();
                return (
                    (user.name && user.name.toLowerCase().includes(search)) ||
                    (user.email && user.email.toLowerCase().includes(search)) ||
                    (user.telegram && user.telegram.toLowerCase().includes(search))
                );
            });
            
            displayUsers(filteredUsers);
        }
        
        async function addCoins(userId, isAdding) {
            const input = document.getElementById(`coinAmount_${userId}`);
            const amount = parseInt(input.value);
            
            if (!amount || amount <= 0) {
                alert("Iltimos, to'g'ri coin miqdorini kiriting!");
                return;
            }
            
            if (!isAdding && amount <= 0) {
                alert("Olib tashlash uchun musbat son kiriting!");
                return;
            }
            
            const reason = prompt("Coin o'zgartirish sababini kiriting:");
            if (!reason) return;
            
            const finalAmount = isAdding ? amount : -amount;
            
            try {
                if (isFirebaseActive && db) {
                    const userRef = db.collection('users').doc(userId);
                    const userDoc = await userRef.get();
                    
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const currentCoins = userData.coins || 0;
                        const newCoins = currentCoins + finalAmount;
                        
                        const coinHistory = userData.coinHistory || [];
                        coinHistory.push({
                            amount: finalAmount,
                            reason: reason,
                            date: new Date().toISOString(),
                            admin: "Admin"
                        });
                        
                        await userRef.update({
                            coins: newCoins,
                            coinHistory: coinHistory
                        });
                        
                        alert(`Coins muvaffaqiyatli ${isAdding ? 'qo\'shildi' : 'olib tashlandi'}! Yangi balans: ${newCoins}`);
                        input.value = '';
                        
                        loadUsers();
                        updateStatistics();
                        loadTopCoins();
                    }
                } else {
                    let users = JSON.parse(localStorage.getItem('users')) || [];
                    const userIndex = users.findIndex(u => u.id == userId);
                    
                    if (userIndex !== -1) {
                        const currentCoins = users[userIndex].coins || 0;
                        const newCoins = currentCoins + finalAmount;
                        
                        const coinHistory = users[userIndex].coinHistory || [];
                        coinHistory.push({
                            amount: finalAmount,
                            reason: reason,
                            date: new Date().toISOString(),
                            admin: "Admin"
                        });
                        
                        users[userIndex].coins = newCoins;
                        users[userIndex].coinHistory = coinHistory;
                        
                        localStorage.setItem('users', JSON.stringify(users));
                        
                        alert(`Coins muvaffaqiyatli ${isAdding ? 'qo\'shildi' : 'olib tashlandi'}! Yangi balans: ${newCoins}`);
                        input.value = '';
                        
                        loadUsers();
                        updateStatistics();
                        loadTopCoins();
                    }
                }
            } catch (error) {
                console.error("Coins qo'shishda xatolik: ", error);
                alert("Coins qo'shishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
        }
        
        async function addCoinsToAllUsers() {
            const amountInput = document.getElementById('coinAmount');
            const reasonInput = document.getElementById('coinReason');
            
            const amount = parseInt(amountInput.value);
            const reason = reasonInput.value.trim();
            
            if (!amount || amount <= 0) {
                alert("Iltimos, to'g'ri coin miqdorini kiriting!");
                return;
            }
            
            if (!reason) {
                alert("Iltimos, coin berish sababini kiriting!");
                return;
            }
            
            if (!confirm(`Barcha userlarga ${amount} coin berishni tasdiqlaysizmi?\n\nSabab: ${reason}`)) {
                return;
            }
            
            try {
                if (isFirebaseActive && db) {
                    const usersSnapshot = await db.collection('users').get();
                    
                    const updatePromises = [];
                    usersSnapshot.forEach((doc) => {
                        const userRef = db.collection('users').doc(doc.id);
                        const userData = doc.data();
                        
                        const currentCoins = userData.coins || 0;
                        const newCoins = currentCoins + amount;
                        
                        const coinHistory = userData.coinHistory || [];
                        coinHistory.push({
                            amount: amount,
                            reason: reason,
                            date: new Date().toISOString(),
                            admin: "Admin (Hammaga)"
                        });
                        
                        updatePromises.push(userRef.update({
                            coins: newCoins,
                            coinHistory: coinHistory
                        }));
                    });
                    
                    await Promise.all(updatePromises);
                    
                    alert(`Barcha ${usersSnapshot.size} ta userga ${amount} coin muvaffaqiyatli berildi!`);
                    
                    amountInput.value = '';
                    reasonInput.value = '';
                    
                    showSuccessMessage('coinSuccessMessage');
                    
                    loadUsers();
                    updateStatistics();
                    loadTopCoins();
                    
                } else {
                    let users = JSON.parse(localStorage.getItem('users')) || [];
                    
                    users.forEach(user => {
                        const currentCoins = user.coins || 0;
                        const newCoins = currentCoins + amount;
                        
                        const coinHistory = user.coinHistory || [];
                        coinHistory.push({
                            amount: amount,
                            reason: reason,
                            date: new Date().toISOString(),
                            admin: "Admin (Hammaga)"
                        });
                        
                        user.coins = newCoins;
                        user.coinHistory = coinHistory;
                    });
                    
                    localStorage.setItem('users', JSON.stringify(users));
                    
                    alert(`Barcha ${users.length} ta userga ${amount} coin muvaffaqiyatli berildi!`);
                    
                    amountInput.value = '';
                    reasonInput.value = '';
                    
                    showSuccessMessage('coinSuccessMessage');
                    
                    loadUsers();
                    updateStatistics();
                    loadTopCoins();
                }
            } catch (error) {
                console.error("Barcha userlarga coin berishda xatolik: ", error);
                alert("Coins berishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
        }
        
        async function loadTopCoins() {
            const topCoinsList = document.getElementById('topCoinsList');
            const loadingElement = document.getElementById('loadingTopCoins');
            
            loadingElement.style.display = 'block';
            topCoinsList.innerHTML = '';
            
            try {
                let users = [];
                
                if (isFirebaseActive && db) {
                    const querySnapshot = await db.collection('users').get();
                    querySnapshot.forEach((doc) => {
                        const user = doc.data();
                        user.id = doc.id;
                        users.push(user);
                    });
                } else {
                    users = JSON.parse(localStorage.getItem('users')) || [];
                }
                
                users.sort((a, b) => {
                    const coinsA = a.coins || 0;
                    const coinsB = b.coins || 0;
                    return coinsB - coinsA;
                });
                
                const top10 = users.slice(0, 10);
                
                loadingElement.style.display = 'none';
                
                if (top10.length === 0) {
                    topCoinsList.innerHTML = `
                        <div class="no-participants">
                            <i class="fas fa-users-slash"></i>
                            <p>Hozircha userlar mavjud emas</p>
                        </div>
                    `;
                    return;
                }
                
                topCoinsList.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: rgba(255, 255, 255, 0.1);">
                                    <th style="padding: 12px; text-align: left; color: #4fc3f7;">#</th>
                                    <th style="padding: 12px; text-align: left; color: #4fc3f7;">Ism</th>
                                    <th style="padding: 12px; text-align: left; color: #4fc3f7;">Telegram</th>
                                    <th style="padding: 12px; text-align: left; color: #4fc3f7;">Coins</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${top10.map((user, index) => `
                                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <td style="padding: 12px; font-weight: bold; color: #ffd700;">${index + 1}</td>
                                        <td style="padding: 12px;">${user.name || 'Noma\'lum'}</td>
                                        <td style="padding: 12px;">${user.telegram ? '@' + user.telegram : '-'}</td>
                                        <td style="padding: 12px; font-weight: bold; color: #FFD700;">${user.coins || 0}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
                
            } catch (error) {
                console.error("Top coins yuklashda xatolik: ", error);
                loadingElement.style.display = 'none';
                topCoinsList.innerHTML = `
                    <div class="no-participants">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Top 10 yuklashda xatolik yuz berdi</p>
                    </div>
                `;
            }
        }
        
        async function viewCoinHistory(userId, userName) {
            try {
                let user;
                
                if (isFirebaseActive && db) {
                    const userDoc = await db.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        user = userDoc.data();
                    }
                } else {
                    const users = JSON.parse(localStorage.getItem('users')) || [];
                    user = users.find(u => u.id == userId);
                }
                
                if (!user) {
                    alert("User topilmadi!");
                    return;
                }
                
                document.getElementById('coinHistoryTitle').innerHTML = `
                    <strong>${userName}</strong> coin tarixi
                `;
                
                const totalCoins = user.coins || 0;
                document.getElementById('totalCoins').textContent = `Jami coins: ${totalCoins}`;
                
                const historyList = document.getElementById('coinHistoryList');
                const coinHistory = user.coinHistory || [];
                
                if (coinHistory.length === 0) {
                    historyList.innerHTML = `
                        <div class="no-participants">
                            <i class="fas fa-history"></i>
                            <p>Coin tarixi bo'sh</p>
                        </div>
                    `;
                } else {
                    const sortedHistory = coinHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    historyList.innerHTML = sortedHistory.map(history => {
                        const date = new Date(history.date);
                        const formattedDate = date.toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        return `
                            <div class="history-item ${history.amount > 0 ? 'history-positive' : 'history-negative'}">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-weight: bold; font-size: 1.1rem;">
                                        ${history.amount > 0 ? '+' : ''}${history.amount} coins
                                    </div>
                                    <div class="history-admin">${formattedDate}</div>
                                </div>
                                <div style="margin-top: 5px;">${history.reason}</div>
                                <div style="margin-top: 2px; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6);">
                                    ${history.admin || 'Admin'}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
                
                document.getElementById('coinHistoryModal').style.display = 'flex';
                
            } catch (error) {
                console.error("Coin tarixini ko'rishda xatolik: ", error);
                alert("Coin tarixini yuklashda xatolik yuz berdi.");
            }
        }
        
        function closeCoinHistoryModal() {
            document.getElementById('coinHistoryModal').style.display = 'none';
        }
        
        async function viewParticipants(tournamentId, tournamentName) {
            currentParticipantsTournamentId = tournamentId;
            
            try {
                let tournament;
                
                if (isFirebaseActive && db) {
                    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
                    if (tournamentDoc.exists) {
                        tournament = tournamentDoc.data();
                    }
                } else {
                    const tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                    tournament = tournaments.find(t => t.id == tournamentId);
                }
                
                if (!tournament) {
                    alert("Turnir topilmadi!");
                    return;
                }
                
                document.getElementById('participantsModalTitle').innerHTML = `
                    <strong>${tournamentName}</strong> turniri qatnashchilari
                `;
                
                const participantsCount = tournament.participants ? tournament.participants.length : 0;
                document.getElementById('participantsCount').textContent = `Jami: ${participantsCount} kishi`;
                
                const participantsList = document.getElementById('participantsList');
                
                if (participantsCount === 0) {
                    participantsList.innerHTML = `
                        <div class="no-participants">
                            <i class="fas fa-users-slash"></i>
                            <p>Hozircha qatnashchilar yo'q</p>
                        </div>
                    `;
                } else {
                    participantsList.innerHTML = tournament.participants.map(participant => {
                        const joinDate = new Date(participant.joinedAt);
                        const formattedDate = joinDate.toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        return `
                            <div class="participant-item">
                                <div class="participant-info">
                                    <div class="participant-avatar">
                                        ${participant.userName ? participant.userName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div class="participant-details">
                                        <div class="participant-name">${participant.userName || 'Foydalanuvchi'}</div>
                                        <div class="participant-email">${participant.userEmail || ''}</div>
                                        ${participant.telegram ? `
                                            <div class="participant-telegram">
                                                <i class="fab fa-telegram"></i> @${participant.telegram}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="participant-date">${formattedDate}</div>
                            </div>
                        `;
                    }).join('');
                }
                
                document.getElementById('participantsModal').style.display = 'flex';
                
            } catch (error) {
                console.error("Qatnashchilarni ko'rishda xatolik: ", error);
                alert("Qatnashchilarni yuklashda xatolik yuz berdi.");
            }
        }
        
        function closeParticipantsModal() {
            document.getElementById('participantsModal').style.display = 'none';
            currentParticipantsTournamentId = null;
        }
        
        async function deleteTournament(tournamentId) {
            if (!confirm("Haqiqatan ham bu turnirni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.")) {
                return;
            }
            
            try {
                if (isFirebaseActive && db) {
                    await db.collection('tournaments').doc(tournamentId).delete();
                    console.log("Turnir Firestore dan o'chirildi");
                } else {
                    let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                    tournaments = tournaments.filter(t => t.id != tournamentId);
                    localStorage.setItem('tournaments', JSON.stringify(tournaments));
                    console.log("Turnir localStorage dan o'chirildi");
                }
                
                loadTournaments();
                updateStatistics();
                
                alert("Turnir muvaffaqiyatli o'chirildi!");
                
            } catch (error) {
                console.error("Turnirni o'chirishda xatolik: ", error);
                alert("Turnirni o'chirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
        }
        
        async function deleteAllTournaments() {
            if (!confirm("HAQIQATAN HAM BARCHA TURNIRLARNI O'CHIRMOQCHIMISIZ?\n\nBu amalni ORQAGA QAYTARIB BO'LMAYDI!")) {
                return;
            }
            
            try {
                if (isFirebaseActive && db) {
                    const querySnapshot = await db.collection('tournaments').get();
                    
                    const deletePromises = [];
                    querySnapshot.forEach((doc) => {
                        deletePromises.push(doc.ref.delete());
                    });
                    
                    await Promise.all(deletePromises);
                    console.log("Barcha turnirlar Firestore dan o'chirildi");
                    
                } else {
                    localStorage.removeItem('tournaments');
                    console.log("Barcha turnirlar localStorage dan o'chirildi");
                }
                
                loadTournaments();
                updateStatistics();
                
                alert("Barcha turnirlar muvaffaqiyatli o'chirildi!");
                
            } catch (error) {
                console.error("Barcha turnirlarni o'chirishda xatolik: ", error);
                alert("Barcha turnirlarni o'chirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
        }
        
        async function updateStatistics() {
            try {
                let tournaments = [];
                let users = [];
                
                if (isFirebaseActive && db) {
                    const tournamentsSnapshot = await db.collection('tournaments').get();
                    tournamentsSnapshot.forEach((doc) => {
                        tournaments.push(doc.data());
                    });
                    
                    const usersSnapshot = await db.collection('users').get();
                    usersSnapshot.forEach((doc) => {
                        users.push(doc.data());
                    });
                } else {
                    tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                    users = JSON.parse(localStorage.getItem('users')) || [];
                }
                
                const totalTournaments = tournaments.length;
                document.getElementById('totalTournaments').textContent = totalTournaments;
                
                const now = new Date();
                const upcomingTournaments = tournaments.filter(t => new Date(t.date) > now).length;
                document.getElementById('upcomingTournaments').textContent = upcomingTournaments;
                
                const totalUsers = users.length;
                document.getElementById('totalUsers').textContent = totalUsers;
                
                const totalCoins = users.reduce((sum, user) => sum + (user.coins || 0), 0);
                document.getElementById('totalCoinsStats').textContent = totalCoins;
                
            } catch (error) {
                console.error("Statistikani yangilashda xatolik: ", error);
            }
        }
        
        function setupLocalStorageFallback() {
            console.log("Firebase ishlamayapti. LocalStorage bilan ishlash rejimiga o'tildi.");
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            const form = document.getElementById('tournamentForm');
            form.onsubmit = null;
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const tournamentName = document.getElementById('tournamentName').value;
                const tournamentDate = document.getElementById('tournamentDate').value;
                const participationFee = document.getElementById('participationFee').value;
                const prize = document.getElementById('prize').value;
                
                const tournament = {
                    id: Date.now(),
                    name: tournamentName,
                    date: tournamentDate,
                    fee: parseFloat(participationFee),
                    prize: prize,
                    created: new Date().toISOString(),
                    participants: []
                };
                
                let tournaments = JSON.parse(localStorage.getItem('tournaments')) || [];
                tournaments.push(tournament);
                localStorage.setItem('tournaments', JSON.stringify(tournaments));
                
                showSuccessMessage('successMessage');
                form.reset();
                document.getElementById('tournamentDate').value = defaultDateTime;
                loadTournaments();
            });
            
            if (!localStorage.getItem('users')) {
                localStorage.setItem('users', JSON.stringify([]));
            }
        }

        window.onclick = function(event) {
            const participantsModal = document.getElementById('participantsModal');
            const coinHistoryModal = document.getElementById('coinHistoryModal');
            
            if (event.target === participantsModal) {
                closeParticipantsModal();
            }
            if (event.target === coinHistoryModal) {
                closeCoinHistoryModal();
            }
        };
  