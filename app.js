// --- CONSTANTS & CONFIG ---
const TEAMS = ['avia1', 'avia2', 'frauen'];
const ADMIN_EMAIL = 'admin@rar26.local';

// --- FIREBASE INIT ---
const firebaseConfig = {
    apiKey: "AIzaSyAzZUrgfZLXYQmNS3r5Z5zYZWmQIhW8VkI",
    authDomain: "rar26-a34c5.firebaseapp.com",
    databaseURL: "https://rar26-a34c5-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "rar26-a34c5",
    storageBucket: "rar26-a34c5.firebasestorage.app",
    messagingSenderId: "185052710717",
    appId: "1:185052710717:web:036421e11bde50700fa754"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// --- GLOBAL STATE ---
window.isAdminMode = false;
window.nextDrivers = [];
window.currentRiders = [];

// --- SECURITY HELPER ---
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// --- ADMIN AUTH (Firebase Email/Password, geteilter Admin-Account) ---
function toggleAdminMode(el) {
    const isChecked = el ? el.checked : false;

    if (isChecked && !window.isAdminMode) {
        const pw = prompt("Bitte Admin-Passwort eingeben:");
        if (!pw) {
            if (el) el.checked = false;
            return;
        }
        auth.signInWithEmailAndPassword(ADMIN_EMAIL, pw).catch(() => {
            alert("Falsches Passwort!");
            if (el) el.checked = false;
        });
        return; // onAuthStateChanged uebernimmt die UI-Aktualisierung bei Erfolg
    }

    if (!isChecked && window.isAdminMode) {
        auth.signOut();
    }
}

auth.onAuthStateChanged(user => {
    window.isAdminMode = !!user;

    document.querySelectorAll('.admin-toggle-checkbox').forEach(cb => cb.checked = window.isAdminMode);
    document.querySelectorAll('.label-lese').forEach(l => l.style.opacity = window.isAdminMode ? '0.5' : '1');
    document.querySelectorAll('.label-admin').forEach(l => l.style.opacity = window.isAdminMode ? '1' : '0.5');
    document.body.classList.toggle('view-only', !window.isAdminMode);

    if (window.isAdminMode) {
        // Falls die DB noch leer ist (erster Start / nach Reset), einmalig vollstaendigen Default-Stand seeden.
        // Bewusst NICHT die globale `data`-Variable verwenden: die kann beim Login noch den
        // initialen leeren Platzhalter enthalten, falls der Auth-Listener vor dem ersten
        // Datenbank-Snapshot feuert (Race Condition, hat schon zu leeren Runden gefuehrt).
        database.ref('raceData').once('value').then(snapshot => {
            if (!snapshot.exists()) database.ref('raceData').set(buildFullDefaultData());
        });
    }

    renderAll();
});

function getRaceStart() {
    if (!data.config) return new Date('2026-07-18T12:55:00').getTime();
    return new Date(`${data.config.startDate}T${data.config.startTime}:00`).getTime();
}

function getRaceCutoff() {
    // Cut-Off wird bewusst unabhaengig von der Startzeit manuell konfiguriert (eigenes Datum/Uhrzeit-Feld),
    // damit eine Aenderung der Startzeit nicht automatisch die Cut-Off-Zeit mitverschiebt.
    if (data.config && data.config.cutoffDate && data.config.cutoffTime) {
        return new Date(`${data.config.cutoffDate}T${data.config.cutoffTime}:00`).getTime();
    }
    return new Date('2026-07-19T12:15:00').getTime();
}

// --- STATE ---
function getDefaultData() {
    return {
        config: {
            startDate: '2026-07-18',
            startTime: '12:55',
            cutoffDate: '2026-07-19',
            cutoffTime: '12:15',
            warningMinutes: 15
        },
        drivers: [
            {id: 'avia1-1', team: 'avia1', name: 'Hagen', soll: '41:00'},
            {id: 'avia1-2', team: 'avia1', name: 'Timo', soll: '41:00'},
            {id: 'avia1-3', team: 'avia1', name: 'Tim', soll: '41:00'},
            {id: 'avia1-4', team: 'avia1', name: 'Rapha', soll: '41:00'},
            {id: 'avia1-5', team: 'avia1', name: 'Maik', soll: '41:00'},
            {id: 'avia1-6', team: 'avia1', name: 'Till', soll: '41:00'},
            {id: 'avia1-7', team: 'avia1', name: 'Kilian', soll: '41:00'},
            {id: 'avia1-8', team: 'avia1', name: 'Florian S.', soll: '41:00'},
            {id: 'avia2-1', team: 'avia2', name: 'Simon', soll: '41:00'},
            {id: 'avia2-2', team: 'avia2', name: 'Lukas', soll: '41:00'},
            {id: 'avia2-3', team: 'avia2', name: 'Stefan', soll: '41:00'},
            {id: 'avia2-4', team: 'avia2', name: 'Hauke', soll: '41:00'},
            {id: 'avia2-5', team: 'avia2', name: 'Marc', soll: '41:00'},
            {id: 'avia2-6', team: 'avia2', name: 'Julius', soll: '41:00'},
            {id: 'avia2-7', team: 'avia2', name: 'Tobi', soll: '41:00'},
            {id: 'avia2-8', team: 'avia2', name: 'Florian V.', soll: '41:00'},
            {id: 'frauen-1', team: 'frauen', name: 'Anna', soll: '50:00'},
            {id: 'frauen-2', team: 'frauen', name: 'Conny', soll: '50:00'},
            {id: 'frauen-3', team: 'frauen', name: 'Anne', soll: '50:00'},
            {id: 'frauen-4', team: 'frauen', name: 'Larissa', soll: '50:00'},
            {id: 'frauen-5', team: 'frauen', name: 'Marie', soll: '50:00'},
            {id: 'frauen-6', team: 'frauen', name: 'Kimberly', soll: '50:00'},
            {id: 'frauen-7', team: 'frauen', name: 'Emma', soll: '50:00'},
            {id: 'frauen-8', team: 'frauen', name: 'Amelie', soll: '50:00'}
        ],
        laps: {
            avia1: [],
            avia2: [],
            frauen: []
        }
    };
}

// Vollstaendiger Default-Stand inkl. 34 vorbefuellter Runden pro Team.
// Als eigene Funktion (statt sich auf die globale `data`-Variable zu verlassen), damit das Seeden
// einer leeren Datenbank nicht von Ladereihenfolge/Timing zwischen Auth- und DB-Listener abhaengt.
function buildFullDefaultData() {
    const d = getDefaultData();
    TEAMS.forEach(t => {
        while (d.laps[t].length < 34) {
            d.laps[t].push({ id: generateId(), driverId: autoSelectNextDriver(d, t), ist: '' });
        }
    });
    return d;
}

let data = getDefaultData();

// --- HELPERS ---
function generateId() { return Math.random().toString(36).substr(2, 9); }

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    return parseInt(timeStr) * 60 || 0;
}

function secondsToTime(sec, showSign = false) {
    if (isNaN(sec)) return '';
    const sign = sec < 0 ? '-' : (showSign && sec > 0 ? '+' : '');
    sec = Math.abs(sec);
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDateTime(ms) {
    const d = new Date(ms);
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const day = days[d.getDay()];
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    // Wochentag steckt in einem eigenen Span, damit er auf schmalen Bildschirmen per CSS
    // ausgeblendet werden kann (Tabelle passt dann ohne horizontales Scrollen aufs iPhone).
    return `<span class="weekday-label">${day} </span>${h}:${m}`;
}

function formatTime(ms) {
    const d = new Date(ms);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

// --- FIREBASE WRITE HELPER (Transaction statt full overwrite -> kein Lost Update) ---
function runTransaction(mutator) {
    return database.ref('raceData').transaction(current => {
        if (!current) current = getDefaultData();
        mutator(current);
        return current;
    });
}

// --- CORE LOGIC ---
function addDriver(team) {
    const nameInput = document.getElementById(`new-driver-name-${team}`);
    const sollInput = document.getElementById(`new-driver-soll-${team}`);
    const name = nameInput.value.trim();
    let soll = sollInput.value.trim() || (team === 'frauen' ? '50:00' : '41:00');

    if (!name) return alert('Bitte Namen eingeben');
    if (!soll.includes(':')) soll += ':00'; // Default to minutes if no colon

    runTransaction(d => {
        d.drivers.push({ id: generateId(), team, name, soll });
    });

    nameInput.value = '';
    sollInput.value = '';
}

function deleteDriver(id) {
    if (!confirm('Fahrer wirklich löschen?')) return;
    runTransaction(d => {
        d.drivers = d.drivers.filter(x => x.id !== id);
        TEAMS.forEach(t => {
            d.laps[t].forEach(l => { if (l.driverId === id) l.driverId = ''; });
        });
    });
}

function getDriverAverages() {
    let stats = {};
    data.drivers.forEach(d => stats[d.id] = { totalSec: 0, count: 0 });

    TEAMS.forEach(t => {
        data.laps[t].forEach(lap => {
            if (lap.driverId && lap.ist) {
                if (!stats[lap.driverId]) stats[lap.driverId] = { totalSec: 0, count: 0 };
                stats[lap.driverId].totalSec += timeToSeconds(lap.ist);
                stats[lap.driverId].count++;
            }
        });
    });
    return stats;
}

function updateDriverSoll(id, newSoll) {
    runTransaction(d => {
        const driver = d.drivers.find(x => x.id === id);
        if (driver) driver.soll = newSoll;
    });
}

function autoSelectNextDriver(d, team) {
    const teamDrivers = d.drivers.filter(x => x.team === team);
    if (teamDrivers.length === 0) return '';

    const laps = d.laps[team];
    if (laps.length === 0) return teamDrivers[0].id;

    const lastLap = laps[laps.length - 1];
    const idx = teamDrivers.findIndex(x => x.id === lastLap.driverId);

    if (idx === -1) return teamDrivers[0].id;
    return teamDrivers[(idx + 1) % teamDrivers.length].id;
}

function addLap(team) {
    runTransaction(d => {
        const nextDriverId = autoSelectNextDriver(d, team);
        d.laps[team].push({ id: generateId(), driverId: nextDriverId, ist: '' });
    });
}

function updateLapIst(team, lapId, istValue) {
    runTransaction(d => {
        const laps = d.laps[team];
        const lapIdx = laps.findIndex(l => l.id === lapId);
        if (lapIdx === -1) return;
        const lap = laps[lapIdx];
        lap.ist = istValue;

        if (!istValue) return; // Wert geloescht -> keine Weitergabe an die naechste Runde

        // Durchschnitt des Fahrers ueber alle bisher erfassten Runden (inkl. dieser) neu berechnen
        // und fest als SOLL-Zeit in dessen naechste noch offene Runde uebernehmen. Die SOLL-Zeit
        // bereits gefahrener/zugewiesener Runden bleibt dabei unangetastet stehen.
        const driverLaps = laps.filter(l => l.driverId === lap.driverId && l.ist);
        const totalSec = driverLaps.reduce((sum, l) => sum + timeToSeconds(l.ist), 0);
        const avgSollStr = secondsToTime(totalSec / driverLaps.length);

        const nextLap = laps.slice(lapIdx + 1).find(l => l.driverId === lap.driverId && !l.ist);
        if (nextLap) nextLap.soll = avgSollStr;
    });
}

function applyRotation(team) {
    if (!data.laps[team] || data.laps[team].length === 0) {
        alert('Für dieses Team sind noch keine Runden angelegt. Bitte zuerst über "+ Runde hinzufügen" in der Planungstabelle Runden anlegen.');
        return;
    }
    if (!confirm('Achtung: Dies überschreibt alle Fahrerzuweisungen in der Planungstabelle für dieses Team mit der neuen Reihenfolge. Fortfahren?')) return;

    runTransaction(d => {
        const teamDrivers = d.drivers.filter(x => x.team === team);
        if (teamDrivers.length === 0) return;
        d.laps[team].forEach((lap, index) => {
            lap.driverId = teamDrivers[index % teamDrivers.length].id;
            lap.soll = '';
        });
    });
}

function updateLapDriver(team, lapId, driverId) {
    runTransaction(d => {
        const lap = d.laps[team].find(l => l.id === lapId);
        if (lap) { lap.driverId = driverId; lap.soll = ''; }
    });
}

function updateLapSoll(team, lapId, newSoll) {
    runTransaction(d => {
        const lap = d.laps[team].find(l => l.id === lapId);
        if (lap) lap.soll = newSoll;
    });
}

function deleteLap(team, lapId) {
    if (!confirm('Runde wirklich komplett löschen?')) return;
    runTransaction(d => {
        d.laps[team] = d.laps[team].filter(l => l.id !== lapId);
    });
}

function resetLapTimes(team, lapId) {
    runTransaction(d => {
        const lap = d.laps[team].find(l => l.id === lapId);
        if (lap) { lap.ist = ''; lap.soll = ''; }
    });
}

// Reihenfolge per Pfeil-Buttons aendern (statt Drag&Drop, das auf Touch-Geraeten nicht funktioniert).
// direction: -1 = nach oben, +1 = nach unten.
function moveDriver(id, direction) {
    runTransaction(d => {
        const driver = d.drivers.find(x => x.id === id);
        if (!driver) return;
        const teamDrivers = d.drivers.filter(x => x.team === driver.team);
        const idx = teamDrivers.findIndex(x => x.id === id);
        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= teamDrivers.length) return;

        const globalIdxA = d.drivers.indexOf(teamDrivers[idx]);
        const globalIdxB = d.drivers.indexOf(teamDrivers[swapIdx]);
        [d.drivers[globalIdxA], d.drivers[globalIdxB]] = [d.drivers[globalIdxB], d.drivers[globalIdxA]];
    });
}

// --- RENDER LOGIC ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    const targetEl = document.getElementById(tabId);
    if (targetEl) targetEl.classList.add('active');

    const mobileDropdown = document.getElementById('mobile-tab-dropdown');
    if (mobileDropdown) mobileDropdown.value = tabId;

    const btn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if (btn) btn.classList.add('active');
}

function renderMasterData() {
    const disableProp = !window.isAdminMode;
    if (data.config) {
        const sd = document.getElementById('config-start-date');
        const st = document.getElementById('config-start-time');
        const wm = document.getElementById('config-warning-min');
        const cd = document.getElementById('config-cutoff-date');
        const ct = document.getElementById('config-cutoff-time');
        sd.value = data.config.startDate;
        sd.disabled = disableProp;
        st.value = data.config.startTime;
        st.disabled = disableProp;
        wm.value = data.config.warningMinutes;
        wm.disabled = disableProp;
        cd.value = data.config.cutoffDate || '';
        cd.disabled = disableProp;
        ct.value = data.config.cutoffTime || '';
        ct.disabled = disableProp;
    }

    const stats = getDriverAverages();
    TEAMS.forEach(team => {
        const tbody = document.getElementById(`drivers-${team}`);
        const teamDrivers = data.drivers.filter(d => d.team === team);

        tbody.innerHTML = teamDrivers.map((d, idx) => {
            const avgStr = stats[d.id].count > 0 ? secondsToTime(stats[d.id].totalSec / stats[d.id].count) : '-';
            const disabledAttr = window.isAdminMode ? '' : 'disabled';
            const isFirst = idx === 0;
            const isLast = idx === teamDrivers.length - 1;
            return `
                <tr>
                    <td><strong>${escapeHtml(d.name)}</strong></td>
                    <td><input type="text" value="${escapeHtml(d.soll)}" onchange="updateDriverSoll('${d.id}', this.value)" style="width:70px" ${disabledAttr}></td>
                    <td>${avgStr} <small>(${stats[d.id].count} Rnd)</small></td>
                    <td class="col-action" style="white-space: nowrap;">
                        <button class="action-btn admin-only" onclick="moveDriver('${d.id}', -1)" title="Nach oben verschieben" style="color: var(--text-muted);" ${isFirst ? 'disabled' : ''}>▲</button>
                        <button class="action-btn admin-only" onclick="moveDriver('${d.id}', 1)" title="Nach unten verschieben" style="color: var(--text-muted);" ${isLast ? 'disabled' : ''}>▼</button>
                        <button class="action-btn admin-only" onclick="deleteDriver('${d.id}')" title="Fahrer löschen" style="margin-left: 5px;">🗑</button>
                    </td>
                </tr>
            `;
        }).join('');
    });
}

function renderLaps() {
    const now = Date.now();
    window.nextDrivers = [];
    window.currentRiders = [];

    TEAMS.forEach(team => {
        const tbody = document.getElementById(`tbody-${team}`);
        const teamDrivers = data.drivers.filter(d => d.team === team);

        let currentStartTime = getRaceStart();
        let foundNext = false;
        let html = '';

        data.laps[team].forEach((lap, index) => {
            const driver = data.drivers.find(d => d.id === lap.driverId);
            // Statische SOLL-Zeit aus der Fahrerverwaltung ist nur der Startwert fuer die allererste
            // Runde eines Fahrers. Fuer alle folgenden Runden wird lap.soll beim Eintragen der IST-Zeit
            // der Vorrunde automatisch auf den dann aktuellen Durchschnitt gesetzt (siehe updateLapIst)
            // und bleibt danach fest stehen.
            const defaultSollStr = driver ? driver.soll : '00:00';
            const sollStr = lap.soll || defaultSollStr;
            const sollSec = timeToSeconds(sollStr);
            const istSec = timeToSeconds(lap.ist);
            const durationSec = istSec > 0 ? istSec : sollSec;

            const lapStart = currentStartTime;
            const lapEnd = lapStart + durationSec * 1000;
            // "Aktuell auf der Strecke" wird anhand der verstrichenen Zeit ermittelt (nicht anhand
            // fehlender IST-Zeit) - sonst bliebe Runde 1 fuer immer "aktuell", solange niemand die
            // IST-Zeit eintraegt, obwohl laengst die naechste Runde faellig waere.
            const isCurrentLap = now >= lapStart && now < lapEnd;
            if (isCurrentLap) {
                window.currentRiders.push({ team, driverName: driver ? driver.name : 'Unbekannt' });
            }

            if (!foundNext && lapStart > now) {
                foundNext = true;
                window.nextDrivers.push({
                    team: team,
                    driverName: driver ? driver.name : 'Unbekannt',
                    startTime: lapStart
                });
            }

            // Check Cutoff
            const isCutoff = lapStart > getRaceCutoff();

            // Calculate Diff - wird direkt unter der IST-Zeit angezeigt statt in einer eigenen
            // Spalte, damit die Tabelle auf dem Handy ohne horizontales Scrollen passt.
            let diffHtml = '';
            if (istSec > 0 && sollSec > 0) {
                const diffSec = istSec - sollSec;
                const signClass = diffSec > 0 ? 'diff-pos' : 'diff-neg';
                diffHtml = `<span class="diff-badge ${signClass}">${secondsToTime(diffSec, true)}</span>`;
            }

            // Driver options
            const options = `<option value="">-- Fahrer --</option>` +
                teamDrivers.map(d => `<option value="${d.id}" ${d.id === lap.driverId ? 'selected' : ''}>${escapeHtml(d.name)}</option>`).join('');

            const disabledAttr = window.isAdminMode ? '' : 'disabled';
            const rowClass = isCurrentLap ? 'row-current' : (isCutoff ? 'row-cutoff' : '');
            html += `
                <tr class="${rowClass}">
                    <td>${index + 1}</td>
                    <td>${isCurrentLap ? '🚴 ' : ''}<select onchange="updateLapDriver('${team}', '${lap.id}', this.value)" ${disabledAttr}>${options}</select></td>
                    <td><strong>${formatDateTime(lapStart)}</strong></td>
                    <td><input type="text" value="${escapeHtml(lap.soll || sollStr)}" placeholder="${escapeHtml(defaultSollStr)}" onchange="updateLapSoll('${team}', '${lap.id}', this.value)" style="width:70px" ${disabledAttr}></td>
                    <td class="ist-cell"><input type="text" value="${escapeHtml(lap.ist)}" placeholder="mm:ss" onchange="updateLapIst('${team}', '${lap.id}', this.value)" ${disabledAttr}>${diffHtml}</td>
                    <td class="col-action">
                        <button class="action-btn admin-only" onclick="resetLapTimes('${team}', '${lap.id}')" title="Zeiten dieser Runde leeren" style="color: var(--warning); font-size: 1.1rem; margin-right: 5px;">🔄</button>
                        <button class="action-btn admin-only" onclick="deleteLap('${team}', '${lap.id}')" title="Ganze Runde löschen">🗑</button>
                    </td>
                </tr>
            `;

            // Advance time
            currentStartTime = lapEnd;
        });

        // Cut-Off Preview for the NEXT (potential) lap
        const cutoffTime = getRaceCutoff();
        const diffToCutoffMs = cutoffTime - currentStartTime;
        const diffToCutoffMin = Math.floor(diffToCutoffMs / 60000);

        if (diffToCutoffMin < 90) { // Warn if less than 90 mins left
            const isTooLate = diffToCutoffMin < 0;
            const bgColor = isTooLate ? 'rgba(227, 0, 15, 0.08)' : 'rgba(241, 196, 15, 0.15)';
            const textColor = isTooLate ? 'var(--avia-red)' : '#d39e00';
            const icon = isTooLate ? '🛑' : '⚠️';
            const msg = isTooLate
                ? `CUT-OFF: Jede weitere Runde würde NACH dem Cut-Off starten (${Math.abs(diffToCutoffMin)} Min zu spät)!`
                : `CUT-OFF GEFAHR: Nur noch ${diffToCutoffMin} Min. Puffer für eine zusätzliche Runde!`;

            html += `
                <tr style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold; border-top: 2px solid ${textColor};">
                    <td colspan="6" style="text-align: center; padding: 12px; font-size: 0.95rem;">
                        ${icon} ${msg}
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    });
}

function updateConfig(key, value) {
    runTransaction(d => {
        if (!d.config) d.config = {};
        d.config[key] = value;
    });
}

// --- TICKER (Warnungen) ---
let currentWarnings = [];
let warningIndex = 0;

function updateTicker() {
    const now = new Date().getTime();
    currentWarnings = [];
    const warnMin = data.config ? parseInt(data.config.warningMinutes, 10) || 15 : 15;

    window.nextDrivers.forEach(nd => {
        const diffMs = nd.startTime - now;
        const diffMin = Math.floor(diffMs / 60000);
        const teamName = nd.team.toUpperCase();

        // Nur im Fenster (0, warnMin] anzeigen: bei Erreichen der Startzeit (0) ausblenden,
        // eine "überfällig"-Meldung gibt es bewusst nicht mehr.
        if (diffMin > 0 && diffMin <= warnMin) {
            currentWarnings.push(`⚠️ ${teamName}: ${escapeHtml(nd.driverName)} startet um ${formatTime(nd.startTime)} Uhr (in ${diffMin} Min)`);
        }
    });

    renderTickerDisplay();
    renderCurrentRidersBar();
}

function renderTickerDisplay() {
    const tickerEl = document.getElementById('driver-ticker');
    if (currentWarnings.length > 0) {
        if (warningIndex >= currentWarnings.length) {
            warningIndex = 0;
        }
        tickerEl.innerHTML = currentWarnings[warningIndex];
        tickerEl.classList.remove('hidden');
    } else {
        tickerEl.classList.add('hidden');
    }
}

setInterval(updateTicker, 10000);
setInterval(() => {
    if (currentWarnings.length > 1) {
        warningIndex = (warningIndex + 1) % currentWarnings.length;
        renderTickerDisplay();
    }
}, 3000);

// --- "Aktuell auf der Strecke" Anzeige ---
function renderCurrentRidersBar() {
    const bar = document.getElementById('current-riders-bar');
    if (!bar) return;
    const current = window.currentRiders;

    if (current.length === 0) {
        bar.classList.add('hidden');
        return;
    }

    bar.innerHTML = '🚴 Aktuell auf der Strecke: ' + current
        .map(nd => `<strong>${nd.team.toUpperCase()}</strong>: ${escapeHtml(nd.driverName)}`)
        .join(' &nbsp;|&nbsp; ');
    bar.classList.remove('hidden');
}

// --- Cut-Off Countdown (Header) ---
function updateCutoffCountdown() {
    const el = document.getElementById('cutoff-indicator');
    if (!el) return;

    const diffMs = getRaceCutoff() - Date.now();
    const totalSec = Math.floor(Math.abs(diffMs) / 1000);
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSec % 60).toString().padStart(2, '0');

    el.textContent = diffMs < 0
        ? `Cut-Off überschritten seit ${h}:${m}:${s}`
        : `Cut-Off in ${h}:${m}:${s}`;
    el.classList.toggle('danger', diffMs < 15 * 60 * 1000);
}

// --- Screen Wake Lock (Handy soll waehrend des Renntags nicht einschlafen) ---
let wakeLock = null;

async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {
        // z.B. Akkusparmodus oder Tab im Hintergrund - kein Blocker
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});

// --- Verbindungsstatus ---
database.ref('.info/connected').on('value', snapshot => {
    const banner = document.getElementById('connection-banner');
    if (!banner) return;
    banner.classList.toggle('hidden', snapshot.val() === true);
});

function renderAll() {
    renderMasterData();
    renderLaps();
    updateTicker();
    updateCutoffCountdown();
}

// --- PERSISTENCE (Firebase) ---
function loadFromFirebase() {
    database.ref('raceData').on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
            data = val;
            if (!data.laps) data.laps = { avia1: [], avia2: [], frauen: [] };
            renderAll();
        } else {
            // Firebase leer -> lokale Defaults + 34 Runden aufbauen (Upload erfolgt erst beim Admin-Login)
            data = buildFullDefaultData();
            renderAll();
        }
    });
}

function resetData() {
    if (!confirm('Achtung: Alle Rundenzeiten und -zuweisungen für ALLE Nutzer in Echtzeit löschen (Einstellungen und Fahrerliste bleiben erhalten)? Dies kann nicht rückgängig gemacht werden.')) return;
    if (!window.isAdminMode) {
        alert('Nur im Admin-Modus möglich.');
        return;
    }
    database.ref('backups/' + Date.now()).set(data)
        .then(() => runTransaction(d => {
            TEAMS.forEach(t => {
                d.laps[t] = [];
                while (d.laps[t].length < 34) {
                    d.laps[t].push({ id: generateId(), driverId: autoSelectNextDriver(d, t), ist: '' });
                }
            });
        }))
        .catch(() => alert('Fehler beim Zurücksetzen.'));
}

// --- INIT ---
window.onload = () => {
    loadFromFirebase();
    updateCutoffCountdown();
    setInterval(updateCutoffCountdown, 1000);
    requestWakeLock();
};
