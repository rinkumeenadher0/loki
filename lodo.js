/* ===========================================================
   FIREBASE SETUP
   Yaha apna Firebase project ka config daalo.
   Firebase Console -> Project Settings -> General -> Your apps -> SDK setup
   =========================================================== */
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// APP STATE
let currentUser = null; // null = Not Logged In
let isLoggedInWithSocial = false;
let isGuest = false;
let currentTurn = 'USER'; // 'USER' or 'BOT'
let diceVal = 1;
let canRoll = true;

// UI SCREEN NAVIGATOR
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function setLoginBusy(isBusy) {
    document.getElementById('login-loading').style.display = isBusy ? 'block' : 'none';
    document.querySelectorAll('.btn-social, .btn-guest').forEach(btn => btn.disabled = isBusy);
}

function showLoginError(message) {
    const errEl = document.getElementById('login-error');
    errEl.innerText = message;
    errEl.style.display = 'block';
}

function clearLoginError() {
    document.getElementById('login-error').style.display = 'none';
}

/* ===========================================================
   AUTHENTICATION LOGIC (REAL FIREBASE)
   =========================================================== */
function handleGoogleLogin() {
    clearLoginError();
    setLoginBusy(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error("Google Login Error:", error.code, error.message);
            showLoginError("Google login fail hua: " + error.message);
        })
        .finally(() => setLoginBusy(false));
}

function handleFacebookLogin() {
    clearLoginError();
    setLoginBusy(true);
    const provider = new firebase.auth.FacebookAuthProvider();
    auth.signInWithPopup(provider)
        .catch((error) => {
            console.error("Facebook Login Error:", error.code, error.message);
            showLoginError("Facebook login fail hua: " + error.message);
        })
        .finally(() => setLoginBusy(false));
}

function handleGuestLogin() {
    clearLoginError();
    isGuest = true;
    localStorage.setItem('ludo_isGuest', 'true');
    currentUser = { name: "Guest Player", email: null, avatar: "G" };
    isLoggedInWithSocial = false;
    updateUIState();
    showScreen('menu-screen');
}

function handleLogout() {
    isGuest = false;
    localStorage.removeItem('ludo_isGuest');
    if (isLoggedInWithSocial) {
        auth.signOut().catch(err => console.error("Sign out error:", err));
        // onAuthStateChanged listener will finish the cleanup + screen change
    } else {
        currentUser = null;
        isLoggedInWithSocial = false;
        updateUIState();
        toggleSettings();
        showScreen('login-screen');
    }
}

// This fires automatically on page load AND whenever auth state changes,
// so a logged-in user stays logged in after a refresh instead of losing
// their session (the old code had no persistence at all).
auth.onAuthStateChanged((user) => {
    if (user) {
        isGuest = false;
        localStorage.removeItem('ludo_isGuest');
        currentUser = {
            name: user.displayName || "Player",
            email: user.email,
            avatar: user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"
        };
        isLoggedInWithSocial = true;
        updateUIState();
        showScreen('menu-screen');
    } else if (localStorage.getItem('ludo_isGuest') === 'true') {
        isGuest = true;
        currentUser = { name: "Guest Player", email: null, avatar: "G" };
        isLoggedInWithSocial = false;
        updateUIState();
        showScreen('menu-screen');
    } else {
        currentUser = null;
        isLoggedInWithSocial = false;
        isGuest = false;
        updateUIState();
        toggleSettings(true); // force-close settings modal if it was open
        showScreen('login-screen');
    }
});

function updateUIState() {
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const statusEl = document.getElementById('user-status');
    const authContainer = document.getElementById('auth-action-container');

    if (currentUser) {
        avatarEl.innerText = currentUser.avatar;
        nameEl.innerText = currentUser.name;
        statusEl.innerText = isLoggedInWithSocial ? "Logged In" : "Playing as Guest";

        if (isLoggedInWithSocial) {
            authContainer.innerHTML = `<button class="btn-action-auth btn-logout" onclick="handleLogout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>`;
        } else {
            authContainer.innerHTML = `<button class="btn-action-auth btn-login-modal" onclick="toggleSettings(); showScreen('login-screen');"><i class="fa-solid fa-right-to-bracket"></i> Login / Register</button>`;
        }
    } else {
        avatarEl.innerText = "?";
        nameEl.innerText = "Not Logged In";
        statusEl.innerText = "Please Login";
        authContainer.innerHTML = `<button class="btn-action-auth btn-login-modal" onclick="toggleSettings(); showScreen('login-screen');"><i class="fa-solid fa-right-to-bracket"></i> Login</button>`;
    }
}

// SETTINGS MODAL TOGGLE
function toggleSettings(forceClose) {
    const modal = document.getElementById('settings-modal');
    if (forceClose) {
        modal.style.display = 'none';
        return;
    }
    modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
}

/* ===========================================================
   GAME LOGIC (VS COMPUTER) - unchanged from your original
   =========================================================== */
function startVsComputer() {
    showScreen('game-screen');
    currentTurn = 'USER';
    document.getElementById('turn-text').innerText = "Your Turn!";
    document.getElementById('turn-text').style.color = "#00e676";
    canRoll = true;
}

function rollDice() {
    if (!canRoll) return;

    const diceEl = document.getElementById('dice');
    diceEl.style.transform = "rotate(360deg)";

    setTimeout(() => {
        diceVal = Math.floor(Math.random() * 6) + 1;
        diceEl.innerText = diceVal;
        diceEl.style.transform = "rotate(0deg)";

        if (currentTurn === 'USER') {
            canRoll = false;
            setTimeout(switchTurnToBot, 1000);
        }
    }, 300);
}

function switchTurnToBot() {
    currentTurn = 'BOT';
    document.getElementById('turn-text').innerText = "Computer's Turn...";
    document.getElementById('turn-text').style.color = "#ff1744";

    setTimeout(() => {
        const diceEl = document.getElementById('dice');
        diceVal = Math.floor(Math.random() * 6) + 1;
        diceEl.innerText = diceVal;

        setTimeout(() => {
            currentTurn = 'USER';
            document.getElementById('turn-text').innerText = "Your Turn!";
            document.getElementById('turn-text').style.color = "#00e676";
            canRoll = true;
        }, 1000);

    }, 1200);
}

// NOTE: no manual updateUIState() call here anymore -
// auth.onAuthStateChanged() above runs on load and decides
// the correct screen (login / menu) by itself.
