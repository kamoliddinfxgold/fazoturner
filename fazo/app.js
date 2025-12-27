// DOM elementlari
document.addEventListener('DOMContentLoaded', function() {
    // Asosiy sahifa elementlari
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const jcBalance = document.getElementById('jcBalance');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const buyJcModal = document.getElementById('buyJcModal');
    const closeButtons = document.querySelectorAll('.close');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('#navLinks a');
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('navLinks');
    const homeLink = document.getElementById('homeLink');
    const tournamentsLink = document.getElementById('tournamentsLink');
    const adminLink = document.getElementById('adminLink');
    // Hide admin link by default until we verify the user's role
    if (adminLink) adminLink.style.display = 'none';
    const viewTournamentsBtn = document.getElementById('viewTournamentsBtn');
    const buyJcBtn = document.getElementById('buyJcBtn');
    
    // Admin sahifasi elementlari
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const addTournamentForm = document.getElementById('addTournamentForm');
    const giveJcForm = document.getElementById('giveJcForm');
    const userSelect = document.getElementById('userSelect');
    const telegramJcBtn = document.getElementById('telegramJcBtn');
    const telegramJcModal = document.getElementById('telegramJcModal');
    
    // Qatnashuvchilar tafsilotlari uchun elementlar
    const selectTournamentForPlayers = document.getElementById('selectTournamentForPlayers');
    const tournamentPlayersBody = document.getElementById('tournamentPlayersBody');
    
    // Statistikalar
    const tournamentCount = document.getElementById('tournamentCount');
    const userCount = document.getElementById('userCount');
    const totalJc = document.getElementById('totalJc');
    
    // Admin statistikalar
    const adminUserCount = document.getElementById('adminUserCount');
    const adminTournamentCount = document.getElementById('adminTournamentCount');
    const adminTotalJc = document.getElementById('adminTotalJc');
    
    // JC sotib olish paketlari
    const jcPackages = document.getElementById('jcPackages');
    
    // Navbarni ochish/yopish (only if elements exist)
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            if (mobileNav) mobileNav.classList.toggle('active');
        });
    }
    
    // Modalni yopish
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            buyJcModal.style.display = 'none';
            if (telegramJcModal) telegramJcModal.style.display = 'none';
        });
    });
    
    // Modal tashqarisini bosganda yopish
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (event.target === buyJcModal) {
            buyJcModal.style.display = 'none';
        }
        if (telegramJcModal && event.target === telegramJcModal) {
            telegramJcModal.style.display = 'none';
        }
    });
    
    // Login modalini ochish
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.style.display = 'flex';
        });
    }
    
    // Register modalini ochish
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            registerModal.style.display = 'flex';
        });
    }

    // JC sotib olish modalini ochish
    if (buyJcBtn) {
        buyJcBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!auth.currentUser) {
                showMessage('Avval tizimga kiring!', 'error');
                loginModal.style.display = 'flex';
                return;
            }
            buyJcModal.style.display = 'flex';
        });
    }

    // Telegram JC modalini ochish
    if (telegramJcBtn) {
        telegramJcBtn.addEventListener('click', function() {
            telegramJcModal.style.display = 'flex';
        });
    }
    
    // JC paketlarini sotib olish
    if (jcPackages) {
        jcPackages.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn')) {
                e.preventDefault();
                const packageDiv = e.target.closest('.jc-package');
                const amount = packageDiv.dataset.amount;
                
                // Tez kunda xabarini ko'rsatish
                showMessage('Tez kunda JC sotib olish imkoniyati ishga tushadi!', 'info');
                buyJcModal.style.display = 'none';
            }
        });
    }
    
    // Login formasi
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    loginModal.style.display = 'none';
                    loginForm.reset();
                    showMessage('Muvaffaqiyatli kirildi!', 'success');
                })
                .catch((error) => {
                    showMessage('Xatolik: ' + error.message, 'error');
                });
        });
    }
    
    // Register formasi
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const phone = document.getElementById('registerPhone') ? document.getElementById('registerPhone').value : '';
            const pubgId = document.getElementById('registerPubgId') ? document.getElementById('registerPubgId').value : '';
            
            // Create the user, update profile.displayName, then save user doc
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Update the Auth user profile so displayName is available
                    return user.updateProfile({ displayName: name })
                        .then(() => user);
                })
                .then((user) => {
                    // Save user info in Firestore
                    return db.collection('users').doc(user.uid).set({
                        name: name,
                        email: email,
                        phone: phone,
                        pubgId: pubgId,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        role: 'user',
                        jcBalance: 0,
                        totalJcEarned: 0
                    });
                })
                .then(() => {
                    registerModal.style.display = 'none';
                    registerForm.reset();
                    showMessage('Muvaffaqiyatli ro\'yxatdan o\'tildi!', 'success');
                })
                .catch((error) => {
                    showMessage('Xatolik: ' + error.message, 'error');
                });
        });
    }
    
    // Chiqish
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut().then(() => {
                showMessage('Muvaffaqiyatli chiqildi!', 'success');
            });
        });
    }
    
    // Admin chiqish
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });
    }
    
    // Auth holatini kuzatish
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Foydalanuvchi kirdi
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
            
            // Admin tekshiruvi
            checkAdminStatus(user.uid);
            
            // Foydalanuvchi ma'lumotlarini olish
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userName && userData.name) {
                            userName.textContent = userData.name;
                        }
                        
                        // JC balansini yangilash
                        if (jcBalance) {
                            jcBalance.textContent = (userData.jcBalance || 0) + ' JC';
                        }
                    }
                });
        } else {
            // Foydalanuvchi chiqdi
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
            
            // Asosiy sahifaga qaytish
            if (window.location.pathname.includes('admin.html')) {
                window.location.href = 'index.html';
            }
        }
    });
    
    // Admin statusini tekshirish
    function checkAdminStatus(userId) {
        db.collection('users').doc(userId).get()
            .then((doc) => {
                if (doc.exists && doc.data().role === 'admin') {
                    if (adminLink) adminLink.style.display = 'block';
                } else {
                    if (adminLink) adminLink.style.display = 'none';
                }
            });
    }
    
    // Yangi turner qo'shish
    if (addTournamentForm) {
        addTournamentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('tournamentName').value;
            const date = document.getElementById('tournamentDate').value;
            const description = document.getElementById('tournamentDescription').value;
            const entryFee = parseInt(document.getElementById('tournamentEntryFee').value);
            const maxPlayers = parseInt(document.getElementById('tournamentMaxPlayers').value);
            
            db.collection('tournaments').add({
                name: name,
                date: date,
                description: description,
                entryFee: entryFee,
                maxPlayers: maxPlayers,
                currentPlayers: 0,
                players: [],
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: auth.currentUser.uid
            })
            .then(() => {
                addTournamentForm.reset();
                showMessage('Turner muvaffaqiyatli qo\'shildi!', 'success');
                loadAdminTournaments();
                updateStats();
            })
            .catch((error) => {
                showMessage('Xatolik: ' + error.message, 'error');
            });
        });
    }
    
    // JC berish
    if (giveJcForm) {
        giveJcForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userId = userSelect.value;
            const amount = parseInt(document.getElementById('jcAmount').value);
            const reason = document.getElementById('jcReason').value;
            const comment = document.getElementById('jcComment').value;
            
            // JC tranzaksiyasini saqlash
            db.collection('transactions').add({
                userId: userId,
                amount: amount,
                type: 'credit',
                reason: reason,
                comment: comment,
                givenBy: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'completed'
            })
            .then(() => {
                // Foydalanuvchining JC balansini yangilash
                return db.collection('users').doc(userId).get();
            })
            .then((doc) => {
                if (doc.exists) {
                    const currentBalance = doc.data().jcBalance || 0;
                    const totalEarned = doc.data().totalJcEarned || 0;
                    return db.collection('users').doc(userId).update({
                        jcBalance: currentBalance + amount,
                        totalJcEarned: totalEarned + amount
                    });
                }
            })
            .then(() => {
                giveJcForm.reset();
                showMessage(`${amount} JC muvaffaqiyatli berildi!`, 'success');
                loadAdminUsers();
                updateStats();
            })
            .catch((error) => {
                showMessage('Xatolik: ' + error.message, 'error');
            });
        });
    }
    
    // Yordamchi: timestamp yoki string/sana maydonlarini xavfsiz formatlash
    function formatDate(dateField) {
        if (!dateField) return '';
        try {
            let d;
            // Firestore timestamp
            if (dateField.toDate && typeof dateField.toDate === 'function') {
                d = dateField.toDate();
            } else {
                d = new Date(dateField);
            }

            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('uz-UZ');
        } catch (e) {
            return '';
        }
    }

    // Turnerlarni yuklash (asosiy sahifa)
    function loadTournaments() {
        const tournamentsContainer = document.getElementById('tournamentsContainer');
        if (!tournamentsContainer) return;
        
        db.collection('tournaments')
            .orderBy('date', 'desc')
            .get()
            .then((querySnapshot) => {
                tournamentsContainer.innerHTML = '';
                
                if (querySnapshot.empty) {
                    tournamentsContainer.innerHTML = `
                        <div class="no-tournaments">
                            <i class="far fa-calendar-times"></i>
                            <p>Hozircha turnirlar mavjud emas</p>
                        </div>
                    `;
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const tournament = doc.data();
                    const tournamentId = doc.id;
                    
                    const tournamentCard = document.createElement('div');
                    tournamentCard.className = 'tournament-card';
                    tournamentCard.innerHTML = `
                        <div class="tournament-header">
                            <h3>${tournament.name}</h3>
                            <div class="tournament-date">
                                <i class="far fa-calendar"></i>
                                <span>${formatDate(tournament.date)}</span>
                            </div>
                        </div>
                        <div class="tournament-body">
                            <p class="tournament-description">${tournament.description}</p>
                            <div class="tournament-details">
                                <div class="detail-item">
                                    <i class="fas fa-coins"></i>
                                    <span>Kirish to'lovi: ${tournament.entryFee || 0} JC</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-users"></i>
                                    <span>Qatnashuvchilar: ${tournament.currentPlayers || 0}/${tournament.maxPlayers || 10}</span>
                                </div>
                            </div>
                        </div>
                        <div class="tournament-footer">
                            <div class="tournament-jc-info">
                                <i class="fas fa-coins"></i>
                                <span>JC mukofotlari mavjud</span>
                            </div>
                            <button class="btn btn-primary join-tournament-btn" data-id="${tournamentId}" data-fee="${tournament.entryFee || 0}">
                                <i class="fas fa-sign-in-alt"></i> Qatnashish
                            </button>
                        </div>
                    `;
                    
                    tournamentsContainer.appendChild(tournamentCard);
                });
                
                // Qatnashish tugmalariga hodisa qo'shish
                document.querySelectorAll('.join-tournament-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const tournamentId = this.dataset.id;
                        const entryFee = parseInt(this.dataset.fee);
                        
                        // Foydalanuvchi tizimga kirmagan bo'lsa
                        if (!auth.currentUser) {
                            showMessage('Qatnashish uchun avval tizimga kiring!', 'error');
                            loginModal.style.display = 'flex';
                            return;
                        }
                        
                        // Turnirga qatnashish funksiyasi
                        joinTournament(tournamentId, entryFee);
                    });
                });
            })
            .catch((error) => {
                console.error('Turnerlarni yuklashda xatolik:', error);
            });
    }
    
    // Turner selectorini yuklash (qatnashuvchilar tafsilotlari uchun)
    function loadTournamentSelector() {
        if (!selectTournamentForPlayers) return;
        
        db.collection('tournaments')
            .orderBy('createdAt', 'desc')
            .get()
            .then((querySnapshot) => {
                selectTournamentForPlayers.innerHTML = '<option value="">Turnerni tanlang</option>';
                
                querySnapshot.forEach((doc) => {
                    const tournament = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = `${tournament.name} (${formatDate(tournament.date)}) - ${tournament.currentPlayers || 0} qatnashuvchi`;
                    selectTournamentForPlayers.appendChild(option);
                });
            })
            .catch((error) => {
                console.error('Turner selector yuklashda xatolik:', error);
            });
    }
    
    // Qatnashuvchilarni yuklash
    if (selectTournamentForPlayers) {
        selectTournamentForPlayers.addEventListener('change', function() {
            const tournamentId = this.value;
            if (tournamentId) {
                loadTournamentPlayers(tournamentId);
            } else {
                tournamentPlayersBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            Turnerni tanlang yoki qatnashuvchilar mavjud emas
                        </td>
                    </tr>
                `;
            }
        });
    }
    
    // Turner qatnashuvchilarini yuklash (YANGILANGAN FUNKSIYA)
    function loadTournamentPlayers(tournamentId) {
        if (!tournamentPlayersBody) return;
        
        // Turner ma'lumotlarini olish
        db.collection('tournaments').doc(tournamentId).get()
            .then((tournamentDoc) => {
                if (!tournamentDoc.exists) {
                    tournamentPlayersBody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 2rem;">
                                Turner topilmadi
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                const tournament = tournamentDoc.data();
                const playerIds = tournament.players || [];
                
                if (playerIds.length === 0) {
                    tournamentPlayersBody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 2rem;">
                                Bu turnirga hali qatnashuvchilar yo'q
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Qatnashuvchilarning ma'lumotlarini olish
                tournamentPlayersBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 1rem;">
                            <i class="fas fa-spinner fa-spin"></i> Qatnashuvchilar yuklanmoqda...
                        </td>
                    </tr>
                `;
                
                // Har bir qatnashuvchi uchun ma'lumot olish
                const userPromises = playerIds.map((userId, index) => {
                    return db.collection('users').doc(userId).get()
                        .then((userDoc) => {
                            if (userDoc.exists) {
                                const userData = userDoc.data();
                                // Tranzaksiya ma'lumotlarini olish (qatnashish vaqti uchun)
                                return db.collection('transactions')
                                    .where('userId', '==', userId)
                                    .where('tournamentId', '==', tournamentId)
                                    .where('type', '==', 'debit')
                                    .orderBy('createdAt', 'desc')
                                    .limit(1)
                                    .get()
                                    .then((transactionSnapshot) => {
                                        let joinDate = 'Noma\'lum';
                                        if (!transactionSnapshot.empty) {
                                            const transaction = transactionSnapshot.docs[0].data();
                                            joinDate = formatDate(transaction.createdAt);
                                        }
                                        
                                        return {
                                            index: index + 1,
                                            userId: userId,
                                            name: userData.name || 'Noma\'lum',
                                            email: userData.email || 'Noma\'lum',
                                            phone: userData.phone || 'Noma\'lum',
                                            pubgId: userData.pubgId || 'Noma\'lum',
                                            jcBalance: userData.jcBalance || 0,
                                            joinDate: joinDate
                                        };
                                    });
                            }
                            return null;
                        })
                        .catch(() => null);
                });
                
                Promise.all(userPromises)
                    .then((players) => {
                        const validPlayers = players.filter(p => p !== null);
                        
                        if (validPlayers.length === 0) {
                            tournamentPlayersBody.innerHTML = `
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 2rem;">
                                        Qatnashuvchilar ma'lumotlari topilmadi
                                    </td>
                                </tr>
                            `;
                            return;
                        }
                        
                        // Jadvalni to'ldirish
                        tournamentPlayersBody.innerHTML = '';
                        validPlayers.forEach((player) => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${player.index}</td>
                                <td>${player.userId.substring(0, 8)}...</td>
                                <td>${player.name}</td>
                                <td>${player.email}</td>
                                <td>
                                    <div class="player-contact-info">
                                        <i class="fas fa-phone"></i>
                                        <span class="player-phone">${player.phone}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="player-contact-info">
                                        <i class="fas fa-gamepad"></i>
                                        <span class="player-pubg">${player.pubgId}</span>
                                    </div>
                                </td>
                                <td>${player.jcBalance} JC</td>
                                <td>${player.joinDate}</td>
                            `;
                            tournamentPlayersBody.appendChild(row);
                        });
                    })
                    .catch((error) => {
                        console.error('Qatnashuvchilar yuklashda xatolik:', error);
                        tournamentPlayersBody.innerHTML = `
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 2rem;">
                                    Qatnashuvchilar yuklashda xatolik yuz berdi
                                </td>
                            </tr>
                        `;
                    });
            })
            .catch((error) => {
                console.error('Turner yuklashda xatolik:', error);
                tournamentPlayersBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            Turner yuklashda xatolik yuz berdi
                        </td>
                    </tr>
                `;
            });
    }
    
    // Admin turnerlarini yuklash
    function loadAdminTournaments() {
        const adminTournamentsList = document.getElementById('adminTournamentsList');
        if (!adminTournamentsList) return;
        
        db.collection('tournaments')
            .orderBy('createdAt', 'desc')
            .get()
            .then((querySnapshot) => {
                adminTournamentsList.innerHTML = '';
                
                if (querySnapshot.empty) {
                    adminTournamentsList.innerHTML = '<p>Turnirlar mavjud emas</p>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const tournament = doc.data();
                    const tournamentId = doc.id;
                    
                    const tournamentItem = document.createElement('div');
                    tournamentItem.className = 'tournament-admin-item';
                    tournamentItem.innerHTML = `
                        <div class="tournament-info">
                            <h4>${tournament.name} 
                                <span class="tournament-status status-${tournament.status || 'active'}">
                                    ${tournament.status || 'active'}
                                </span>
                            </h4>
                            <p>${formatDate(tournament.date)} | Kirish: ${tournament.entryFee || 0} JC | Qatnashuvchilar: ${tournament.currentPlayers || 0}/${tournament.maxPlayers || 10}</p>
                        </div>
                        <div class="tournament-actions">
                            <span class="tournament-id">ID: ${tournamentId.substring(0, 8)}...</span>
                            <button class="btn btn-primary btn-sm view-players-btn" data-id="${tournamentId}" data-name="${tournament.name}">
                                <i class="fas fa-users"></i> Qatnashuvchilar
                            </button>
                            <button class="btn btn-danger btn-sm delete-tournament-btn" data-id="${tournamentId}">O'chirish</button>
                        </div>
                    `;
                    
                    adminTournamentsList.appendChild(tournamentItem);
                });

                // Delete button handler
                adminTournamentsList.querySelectorAll('.delete-tournament-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.dataset.id;
                        if (!confirm('Turnirni va unga tegishli transaksiyalarni o`chirmoqchimisiz?')) return;

                        // Delete associated transactions first
                        db.collection('transactions').where('tournamentId', '==', id).get()
                            .then((qs) => {
                                const batch = db.batch();
                                qs.forEach(d => batch.delete(d.ref));
                                return batch.commit();
                            })
                            .catch(() => Promise.resolve())
                            .then(() => {
                                // Delete the tournament
                                return db.collection('tournaments').doc(id).delete();
                            })
                            .then(() => {
                                showMessage('Turnir o`chirildi', 'success');
                                loadAdminTournaments();
                                updateStats();
                            })
                            .catch((err) => {
                                showMessage('Xatolik: ' + err.message, 'error');
                            });
                    });
                });
                
                // Qatnashuvchilarni ko'rish tugmasi
                adminTournamentsList.querySelectorAll('.view-players-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const tournamentId = this.dataset.id;
                        const tournamentName = this.dataset.name;
                        
                        // Turner selectorini o'rnatish
                        if (selectTournamentForPlayers) {
                            selectTournamentForPlayers.value = tournamentId;
                            loadTournamentPlayers(tournamentId);
                            
                            // Scroll qilish
                            document.querySelector('.players-details-container').scrollIntoView({
                                behavior: 'smooth'
                            });
                            
                            showMessage(`${tournamentName} turniri qatnashuvchilari yuklandi`, 'info');
                        }
                    });
                });
            });
    }
    
    // Foydalanuvchilarni yuklash (admin)
    function loadAdminUsers() {
        const adminUsersList = document.getElementById('adminUsersList');
        if (!adminUsersList) return;
        
        db.collection('users')
            .orderBy('createdAt', 'desc')
            .get()
            .then((querySnapshot) => {
                adminUsersList.innerHTML = '';
                userSelect.innerHTML = '<option value="">Foydalanuvchini tanlang</option>';
                
                if (querySnapshot.empty) {
                    adminUsersList.innerHTML = '<p>Foydalanuvchilar mavjud emas</p>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const user = doc.data();
                    const userId = doc.id;
                    
                    // Adminlarni chiqarmaslik
                    if (user.role === 'admin') return;
                    
                    // User select uchun
                    const option = document.createElement('option');
                    option.value = userId;
                    option.textContent = `${user.name} (${user.email}) - ${user.jcBalance || 0} JC`;
                    userSelect.appendChild(option);
                    
                    // User list uchun
                    const userItem = document.createElement('div');
                    userItem.className = 'user-admin-item';
                    userItem.innerHTML = `
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p>${user.email}</p>
                        </div>
                        <div class="user-jc">
                            <i class="fas fa-coins"></i>
                            <span>${user.jcBalance || 0} JC</span>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-primary btn-sm promote-user-btn" data-id="${userId}">Adminga aylantirish</button>
                        </div>
                    `;
                    
                    adminUsersList.appendChild(userItem);
                });

                // Attach promote button handlers
                adminUsersList.querySelectorAll('.promote-user-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.dataset.id;
                        if (!confirm('Foydalanuvchini admin qilishni tasdiqlaysizmi?')) return;

                        db.collection('users').doc(id).update({ role: 'admin' })
                            .then(() => {
                                showMessage('Foydalanuvchi admin qilindi', 'success');
                                loadAdminUsers();
                                updateStats();
                            })
                            .catch((err) => {
                                showMessage('Xatolik: ' + err.message, 'error');
                            });
                    });
                });
            });
    }

    // Turnirga qatnashish funksiyasi
    function joinTournament(tournamentId, entryFee) {
        const user = auth.currentUser;
        
        if (!user) {
            showMessage('Qatnashish uchun tizimga kiring!', 'error');
            return;
        }
        
        // Foydalanuvchi ma'lumotlarini olish
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists) {
                    showMessage('Foydalanuvchi topilmadi!', 'error');
                    return;
                }
                
                const userData = doc.data();
                const currentBalance = userData.jcBalance || 0;
                
                // Balansni tekshirish
                if (currentBalance < entryFee) {
                    showMessage(`Balansingizda yetarli JC mavjud emas! Sizda: ${currentBalance} JC, kerak: ${entryFee} JC`, 'error');
                    buyJcModal.style.display = 'flex';
                    return;
                }
                
                // Turnir ma'lumotlarini olish
                return db.collection('tournaments').doc(tournamentId).get()
                    .then((tournamentDoc) => {
                        if (!tournamentDoc || !tournamentDoc.exists) {
                            showMessage('Turnir topilmadi!', 'error');
                            return;
                        }
                        
                        const tournament = tournamentDoc.data();
                        
                        // Turnirga qatnashuvchilar soni chegarasini tekshirish
                        if (tournament.currentPlayers >= tournament.maxPlayers) {
                            showMessage('Turnirga qatnashuvchilar soni to\'lgan!', 'error');
                            return;
                        }
                        
                        // Foydalanuvchi allaqachon qatnashganligini tekshirish
                        if (tournament.players && tournament.players.includes(user.uid)) {
                            showMessage('Siz allaqachon bu turnirga qatnashgansiz!', 'error');
                            return;
                        }
                        
                        // 1. Foydalanuvchi balansidan JC yechish
                        return db.collection('users').doc(user.uid).update({
                            jcBalance: currentBalance - entryFee
                        })
                        .then(() => {
                            // 2. Turnirga qatnashuvchi qo'shish
                            const updatedPlayers = [...(tournament.players || []), user.uid];
                            return db.collection('tournaments').doc(tournamentId).update({
                                players: updatedPlayers,
                                currentPlayers: updatedPlayers.length
                            });
                        })
                        .then(() => {
                            // 3. Tranzaksiyani saqlash
                            return db.collection('transactions').add({
                                userId: user.uid,
                                tournamentId: tournamentId,
                                amount: entryFee,
                                type: 'debit',
                                reason: 'turner_qatnashish',
                                comment: `${tournament.name} turniriga qatnashish`,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                status: 'completed'
                            });
                        })
                        .then(() => {
                            // 4. Foydalanuvchi balansini yangilash
                            if (jcBalance) {
                                jcBalance.textContent = (currentBalance - entryFee) + ' JC';
                            }
                            
                            showMessage(`Turnirga muvaffaqiyatli qo'shildingiz! ${entryFee} JC hisobingizdan yechildi.`, 'success');
                            loadTournaments();
                        });
                    });
            })
            .catch((error) => {
                console.error('Turnirga qatnashishda xatolik:', error);
                showMessage('Xatolik: ' + error.message, 'error');
            });
    }
    
    // Statistikani yangilash
    function updateStats() {
        // Turnirlar soni
        db.collection('tournaments').get()
            .then((querySnapshot) => {
                if (tournamentCount) tournamentCount.textContent = querySnapshot.size;
                if (adminTournamentCount) adminTournamentCount.textContent = querySnapshot.size;
            });
        
        // Foydalanuvchilar soni
        db.collection('users').get()
            .then((querySnapshot) => {
                if (userCount) userCount.textContent = querySnapshot.size;
                if (adminUserCount) adminUserCount.textContent = querySnapshot.size;
            });
        
        // Umumiy JC miqdori
        db.collection('users').get()
            .then((querySnapshot) => {
                let totalJcCount = 0;
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    totalJcCount += userData.totalJcEarned || 0;
                });
                
                if (totalJc) totalJc.textContent = totalJcCount;
                if (adminTotalJc) adminTotalJc.textContent = totalJcCount;
            });
    }
    
    // Xabarlarni ko'rsatish
    function showMessage(message, type) {
        // Mavjud xabarlarni olib tashlash
        const existingMessage = document.querySelector('.message');
        if (existingMessage) existingMessage.remove();
        
        // Yangi xabar yaratish
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Stil berish
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            color: white;
            font-weight: 600;
            z-index: 1000;
            box-shadow: var(--shadow);
            animation: slideIn 0.3s;
        `;
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = 'var(--success-color)';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = 'var(--danger-color)';
        } else if (type === 'info') {
            messageDiv.style.backgroundColor = 'var(--primary-color)';
        } else {
            messageDiv.style.backgroundColor = 'var(--warning-color)';
        }
        
        document.body.appendChild(messageDiv);
        
        // 3 sekunddan keyin olib tashlash
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }
    
    // CSS animatsiyalari qo'shish
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Sahifa bo'limlarini o'zgartirish
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
        
        // Navbarni yopish (mobil uchun)
        if (mobileNav && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
        }
    }
    
    // Navigation linklariga hodisa qo'shish
    if (homeLink) {
        homeLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('homeSection');
        });
    }
    
    if (tournamentsLink) {
        tournamentsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('tournamentsSection');
            loadTournaments();
        });
    }
    
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    }
    
    if (viewTournamentsBtn) {
        viewTournamentsBtn.addEventListener('click', function() {
            showSection('tournamentsSection');
            loadTournaments();
        });
    }
    
    // Sahifa yuklanganda
    window.addEventListener('load', function() {
        // Asosiy sahifada
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            showSection('homeSection');
            loadTournaments();
            updateStats();
        }
        
        // Admin sahifasida
        if (window.location.pathname.includes('admin.html')) {
            // Admin tekshiruvi
            auth.onAuthStateChanged((user) => {
                if (user) {
                    checkAdminStatus(user.uid);
                }
            });
            
            loadAdminTournaments();
            loadTournamentSelector();
            loadAdminUsers();
            updateStats();
        }
    });
});