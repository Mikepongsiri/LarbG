// Global State Placeholder
let currentUserRole = null;
let currentUsername = null;

// Persistence Logic
function loadData(key, defaultData) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
}
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Mock Database
const defaultUsersDB = {
    'staff': { role: 'staff', pass: 'admin123', name: 'Sarah (Admin Staff)' },
    'mechanic': { role: 'mechanic', pass: 'wrench123', name: 'Mike (Head Mechanic)' },
    'customer': { role: 'customer', pass: 'cust123', name: 'Alex (Customer)' }
};
let usersDB = loadData('larbyaso_users', defaultUsersDB);

const defaultWorkOrdersDB = [
    {
        id: "WO-1001",
        customer: "customer",
        vehicle: "Toyota Corolla (XYZ-1234)",
        date: "2026-04-20",
        time: "Morning",
        towing: true,
        issue: "Engine making rattling noise.",
        status: "Pending Check-in",
        mechanic: null,
        chatLog: [{ sender: "staff", name: "Sarah (Admin Staff)", time: "10:00 AM", message: "We saw your request for towing. Could you confirm your exact address?" }]
    },
    {
        id: "WO-0945",
        customer: "customer",
        vehicle: "Honda Civic (ABC-9876)",
        date: "2026-04-18",
        time: "Afternoon",
        towing: false,
        issue: "Oil Change & General Check",
        status: "In Progress",
        mechanic: "mechanic",
        chatLog: []
    }
];
let workOrdersDB = loadData('larbyaso_workorders', defaultWorkOrdersDB);

const defaultVehiclesDB = [
    { owner: 'customer', brand: 'Toyota Corolla', plate: 'XYZ-1234', year: '2019', color: 'White' },
    { owner: 'customer', brand: 'Honda Civic', plate: 'ABC-9876', year: '2021', color: 'Black' }
];
let vehiclesDB = loadData('larbyaso_vehicles', defaultVehiclesDB);

// Auto Login Check
window.onload = () => {
    const savedUser = localStorage.getItem('larbyaso_currentUser');
    if (savedUser && usersDB[savedUser]) {
        currentUsername = savedUser;
        loginAs(usersDB[savedUser].role, usersDB[savedUser].name);
    }
};

// Use Case UI Renderers
const renderers = {
    customer: renderCustomerDashboard,
    staff: renderStaffDashboard,
    mechanic: renderMechanicDashboard
};
// Navigation / Auth Logic
function toggleAuthView(view) {
    if (view === 'register') {
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('register-panel').style.display = 'block';
    } else {
        document.getElementById('login-panel').style.display = 'block';
        document.getElementById('register-panel').style.display = 'none';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    if(dropdown.style.display === 'block') {
        document.getElementById('notif-badge').style.display = 'none'; // mark as read
    }
}

function populateNotifications() {
    const list = document.getElementById('notif-list');
    list.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid var(--accent);">
            <strong>Quotation Ready</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted)">Your quotation for WO-0945 is pending approval.</span>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
            <strong>Appointment Confirmed</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted)">Your service on Apr 20th is confirmed.</span>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; border-left: 3px solid var(--border);">
            <strong>Service Completed</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted)">WO-0940 (Brake Pad Replacement) is complete.</span>
        </div>
    `;
    document.getElementById('notif-badge').innerText = '1';
    document.getElementById('notif-badge').style.display = 'flex';
}

function performGlobalSearch() {
    const term = document.getElementById('global-search-input').value.toUpperCase().trim();
    if (!term) return;
    
    const existing = document.getElementById('search-modal');
    if (existing) existing.remove();

    const modalHTML = `
        <div id="search-modal" class="modal-overlay active">
            <div class="glass-panel modal-content" style="max-width: 650px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <h3>Vehicle Dossier: ${term}</h3>
                    <button class="btn secondary" style="padding: 4px 8px;" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <p class="subtitle" style="margin-top: 4px;">Registered Owner: Alex (Customer)</p>
                <div style="margin-top: 16px;">
                    <h4 style="color: var(--primary); margin-bottom: 8px;">Repair History</h4>
                    <table style="width: 100%; font-size: 0.9rem;">
                        <thead><tr style="text-align: left; opacity: 0.7;"><th>WO#</th><th>Date</th><th>Service</th><th>Assigned</th></tr></thead>
                        <tbody>
                            <tr><td style="padding: 8px 0;">WO-0940</td><td>Feb 15, 2026</td><td>Brake Pad Replace</td><td>Mike</td></tr>
                            <tr><td style="padding: 8px 0;">WO-0821</td><td>Nov 10, 2025</td><td>10,000km Maint</td><td>Mike</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('global-search-input').value = '';
}

function processLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const errorEl = document.getElementById('login-error');
    
    if (usersDB[user] && usersDB[user].pass === pass) {
        errorEl.style.display = 'none';
        currentUsername = user;
        localStorage.setItem('larbyaso_currentUser', user);
        loginAs(usersDB[user].role, usersDB[user].name);
    } else {
        errorEl.style.display = 'block';
    }
}

function processRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const user = document.getElementById('reg-user').value.trim();
    const pass = document.getElementById('reg-pass').value;
    
    // Add to mock DB
    usersDB[user] = { role: 'customer', pass: pass, name: name + ' (Customer)' };
    saveData('larbyaso_users', usersDB);
    
    // Auto login
    currentUsername = user;
    localStorage.setItem('larbyaso_currentUser', user);
    loginAs('customer', usersDB[user].name);
    
    // Reset forms
    document.getElementById('reg-user').value = '';
    document.getElementById('reg-pass').value = '';
    document.getElementById('reg-name').value = '';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    toggleAuthView('login'); // reset view for next time
}

function loginAs(role, displayName) {
    currentUserRole = role;
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('app-layout').classList.add('active');
    
    // Update user info
    const avatars = { customer: displayName.charAt(0).toUpperCase(), staff: 'S', mechanic: 'M' };
    
    document.getElementById('user-name').innerText = displayName;
    
    const userAvatarEl = document.getElementById('user-avatar');
    if (currentUsername && usersDB[currentUsername] && usersDB[currentUsername].avatarUrl) {
        userAvatarEl.innerHTML = `<img src="${usersDB[currentUsername].avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        userAvatarEl.style.background = 'transparent';
    } else {
        userAvatarEl.innerHTML = avatars[role];
        userAvatarEl.style.background = '';
    }
    
    // Toggle Role-specific Topbar elements
    const globalSearch = document.getElementById('global-search-container');
    const notifBell = document.getElementById('notification-bell');
    
    if (role === 'staff' || role === 'mechanic') {
        globalSearch.style.display = 'block';
        notifBell.style.display = 'none';
    } else if (role === 'customer') {
        globalSearch.style.display = 'none';
        notifBell.style.display = 'block';
        populateNotifications();
    }
    
    // Load default view
    renderers[role]();
}

function logout() {
    currentUserRole = null;
    currentUsername = null;
    localStorage.removeItem('larbyaso_currentUser');
    document.getElementById('app-layout').classList.remove('active');
    document.getElementById('login-view').classList.add('active');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-error').style.display = 'none';
}

function setNav(html) {
    document.getElementById('sidebar-nav').innerHTML = html;
}

function overrideTitle(title) {
    document.getElementById('page-title').innerText = title;
}

function renderMockView(title, description) {
    overrideTitle(title);
    // Keep nav active state unchanged or minimally update, just replacing main content
    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 40px auto; text-align: center;">
            <div class="icon" style="font-size: 3rem; margin-bottom: 16px; color: var(--text-muted);">🚧</div>
            <h2>Work in Progress</h2>
            <p class="subtitle" style="margin-top: 8px;">${description}</p>
            <button class="btn secondary" style="margin-top: 24px;" onclick="renderers[currentUserRole]()">Back to Dashboard</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

// ============================================
// UC2: Customer - Book Appointment
// ============================================
function renderCustomerDashboard(forceNewVehicle = false) {
    overrideTitle("Book Appointment");
    setNav(`
        <li><a href="#" onclick="renderCustomerDashboard()" class="active">📅 Book Service</a></li>
        <li><a href="#" onclick="renderActiveRepairs()">📍 Active Repairs</a></li>
        <li><a href="#" onclick="renderMyVehicles()">🚗 My Vehicles</a></li>
        <li><a href="#" onclick="renderCustomerHistory()">📜 History</a></li>
        <li style="margin-top: 16px;"><a href="#" onclick="renderCustomerProfile()">⚙️ Account Settings</a></li>
    `);
    
    const myCars = vehiclesDB.filter(v => v.owner === currentUsername);
    let content = '';

    if (myCars.length === 0 || forceNewVehicle) {
        content = `
            <div class="glass-panel card" style="max-width: 600px; margin: 0 auto;">
                <div class="card-title">${myCars.length === 0 ? 'Welcome to LarbYaso Garage!' : 'Register Additional Vehicle'}</div>
                <p class="subtitle" style="margin-bottom: 24px;">${myCars.length === 0 ? 'To book a service, please register your first vehicle into the system.' : 'Enter the details of your new car below.'}</p>
                <form onsubmit="event.preventDefault(); submitNewVehicle();">
                    <div class="form-group">
                        <label>Vehicle Brand & Model</label>
                        <input id="veh-brand" type="text" class="form-control" placeholder="e.g. Toyota Camry" required>
                    </div>
                    <div class="form-group">
                        <label>License Plate Number</label>
                        <input id="veh-plate" type="text" class="form-control" placeholder="e.g. XYZ-1234" required>
                    </div>
                    <div class="grid" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group">
                            <label>Year of Manufacture</label>
                            <input id="veh-year" type="number" class="form-control" placeholder="e.g. 2020" required>
                        </div>
                        <div class="form-group">
                            <label>Color</label>
                            <input id="veh-color" type="text" class="form-control" placeholder="e.g. Silver" required>
                        </div>
                    </div>
                    ${myCars.length > 0 ? `<button type="button" class="btn secondary" style="width: 100%; margin-top: 16px;" onclick="renderCustomerDashboard()">Cancel</button>` : ''}
                    <button type="submit" class="btn primary" style="width: 100%; margin-top: ${myCars.length > 0 ? '8px' : '16px'};">Save Vehicle</button>
                </form>
            </div>
        `;
    } else {
        let vehicleOptions = myCars.map(v => `<option value="${v.brand} (${v.plate})">${v.brand} (${v.plate})</option>`).join('');
        
        content = `
            <div class="glass-panel card" style="max-width: 600px; margin: 0 auto;">
                <div class="card-title">Schedule New Service</div>
                <p class="subtitle">Select your vehicle and preferred time slot for service.</p>
                
                <form onsubmit="event.preventDefault(); showCustomerConfirmation();" id="booking-form">
                    <div class="form-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                            <label style="margin-bottom: 0;">Select Vehicle explicitly</label>
                            <a href="#" style="color:var(--accent); font-size:0.8rem; text-decoration:none;" onclick="renderCustomerDashboard(true)">+ Add New Vehicle</a>
                        </div>
                        <select id="booking-vehicle" class="form-control" required>
                            <option value="">-- Choose a Vehicle --</option>
                            ${vehicleOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Date</label>
                        <input id="booking-date" type="date" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred Time Slot</label>
                        <select id="booking-time" class="form-control" required>
                            <option value="">-- Choose Time --</option>
                            <option value="Morning">Morning (09:00 - 12:00)</option>
                            <option value="Afternoon">Afternoon (13:00 - 17:00)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Service Details (Optional)</label>
                        <textarea class="form-control" rows="3" placeholder="Describe the issue..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Upload Multimedia Evidence (Photos/Videos/Audio)</label>
                        <input type="file" id="cust-evidence" accept="image/*,video/*,audio/*" style="display: none;" onchange="handleCustEvidence(event)">
                        <div id="cust-upload-zone" style="border: 2px dashed var(--border); padding: 24px; text-align: center; border-radius: 8px; cursor: pointer; background: rgba(0,0,0,0.1); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'" onclick="document.getElementById('cust-evidence').click()">
                            <div id="cust-upload-icon" style="font-size: 1.5rem; margin-bottom: 8px;">📎</div>
                            <p id="cust-upload-text" style="color: var(--text-muted); font-size: 0.9rem;">Click to attach files describing the issue...</p>
                        </div>
                    </div>
                    <div class="form-group" style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px; border-left: 3px solid var(--accent);">
                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; color: var(--text-main);">
                            <input type="checkbox" id="booking-towing" style="width: 18px; height: 18px; accent-color: var(--accent);">
                            Request Emergency Towing Service
                        </label>
                    </div>
                    
                    <button type="submit" class="btn primary" style="width: 100%; margin-top: 16px;">Confirm Booking</button>
                </form>
            </div>
        `;
    }
    document.getElementById('main-content').innerHTML = content;
}

function submitNewVehicle() {
    let brand = document.getElementById('veh-brand').value;
    let plate = document.getElementById('veh-plate').value;
    let year = document.getElementById('veh-year').value;
    let color = document.getElementById('veh-color').value;

    vehiclesDB.push({ owner: currentUsername, brand, plate, year, color });
    saveData('larbyaso_vehicles', vehiclesDB);

    renderCustomerDashboard(); // Kick them back to booking
}

function showCustomerConfirmation() {
    // Generate mock WO-ID
    const woId = "WO-" + Math.floor(1000 + Math.random() * 9000);
    const vehicle = document.getElementById('booking-vehicle') ? document.getElementById('booking-vehicle').options[document.getElementById('booking-vehicle').selectedIndex].text : "Toyota Corolla (XYZ-1234)";
    const date = document.getElementById('booking-date') ? document.getElementById('booking-date').value : "TBD";
    const time = document.getElementById('booking-time') ? document.getElementById('booking-time').value : "TBD";
    const towing = document.getElementById('booking-towing') ? document.getElementById('booking-towing').checked : false;
    
    workOrdersDB.push({
        id: woId,
        customer: currentUsername,
        vehicle: vehicle,
        date: date,
        time: time,
        towing: towing,
        issue: "Standard Service",
        status: "Pending Check-in",
        mechanic: null,
        chatLog: []
    });
    saveData('larbyaso_workorders', workOrdersDB);

    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 40px auto; text-align: center;">
            <div class="icon" style="font-size: 3rem; margin-bottom: 16px; color: var(--accent);">✅</div>
            <h2>Booking Confirmed!</h2>
            <p class="subtitle" style="margin-top: 8px;">Your appointment has been successfully scheduled.</p>
            <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; margin: 24px 0; text-align: left;">
                <p><strong>Tracking ID:</strong> ${woId}</p>
                <p><strong>Vehicle:</strong> ${vehicle}</p>
                <p><strong>Status:</strong> Pending Check-in</p>
                <p><strong>Towing:</strong> ${towing ? '<span class="badge warning">Requested</span>' : 'No'}</p>
            </div>
            <button class="btn secondary" onclick="renderActiveRepairs()">View My Repairs</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function handleCustEvidence(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('cust-upload-icon').innerText = '✅';
        document.getElementById('cust-upload-icon').style.color = 'var(--accent)';
        document.getElementById('cust-upload-text').innerHTML = `<strong>${file.name}</strong><br><span style="font-size:0.8rem">Attached successfully</span>`;
        document.getElementById('cust-upload-zone').style.borderColor = 'var(--accent)';
    }
}

function renderActiveRepairs() {
    overrideTitle("Active Repairs & Tracking");
    setNav(`
        <li><a href="#" onclick="renderCustomerDashboard()">📅 Book Service</a></li>
        <li><a href="#" onclick="renderActiveRepairs()" class="active">📍 Active Repairs</a></li>
        <li><a href="#" onclick="renderMyVehicles()">🚗 My Vehicles</a></li>
        <li><a href="#" onclick="renderCustomerHistory()">📜 History</a></li>
        <li style="margin-top: 16px;"><a href="#" onclick="renderCustomerProfile()">⚙️ Account Settings</a></li>
    `);

    const userWOs = workOrdersDB.filter(w => w.customer === currentUsername);

    let woHtml = userWOs.map(wo => {
        let chatBtn = `<button class="btn secondary" style="font-size: 0.8rem; padding: 4px 12px; margin-top: 12px; width: 100%;" onclick="openChatModal('${wo.id}')">💬 Message Garage</button>`;
        let actions = '';
        
        // Allowed to reschedule/cancel if not yet actively worked on.
        if (wo.status === 'Pending Check-in' || wo.status === 'Quoted') {
            actions = `
                <div style="display:flex; gap: 8px; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 16px;">
                    <button class="btn warning" style="flex: 1; background: rgba(245, 158, 11, 0.2); color: #fcd34d; font-size: 0.8rem;" onclick="rescheduleBooking('${wo.id}')">📆 Reschedule</button>
                    <button class="btn danger" style="flex: 1; background: rgba(239, 68, 68, 0.2); color: #fca5a5; font-size: 0.8rem;" onclick="cancelBooking('${wo.id}')">❌ Cancel</button>
                </div>
            `;
        }

        // Detailed Progress Visualization
        let progress = '';
        if (wo.status !== 'Cancelled') {
            let p1 = ['In Progress', 'Diagnostic Submitted', 'Quoted', 'Approved', 'Repairing', 'Completed'].includes(wo.status) ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
            let p2 = ['Approved', 'Repairing', 'Completed'].includes(wo.status) ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
            let p3 = wo.status === 'Completed' ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
            progress = `
                <div style="margin-top: 24px; margin-bottom: 16px;">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">Repair Lifecycle Tracking</p>
                    <div style="display: flex; gap: 8px;">
                        <div style="flex: 1; height: 6px; background: ${p1}; border-radius: 3px;" title="Diagnostic Phase"></div>
                        <div style="flex: 1; height: 6px; background: ${p2}; border-radius: 3px;" title="Approval Phase"></div>
                        <div style="flex: 1; height: 6px; background: ${p3}; border-radius: 3px;" title="Repair Phase"></div>
                    </div>
                </div>
            `;
        }

        let quoteCard = '';
        if (wo.status === 'Quoted' && wo.quotation) {
            quoteCard = `
                <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 8px; border: 1px solid var(--accent); margin-top: 16px; margin-bottom: 16px;">
                    <h4 style="margin-top:0; margin-bottom: 12px; color: var(--accent);">Repair Quotation Provided</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom: 12px;">The garage has priced your repair based on the mechanic's findings. Please review below.</p>
                    <ul style="list-style: none; font-size: 0.9rem; margin-bottom: 16px; color: var(--text-main); padding:0;">
                        <li style="display: flex; justify-content: space-between;"><span>Estimated Parts</span><span>$${wo.quotation.partsTotal.toFixed(2)}</span></li>
                        <li style="display: flex; justify-content: space-between; margin-top: 4px;"><span>Assessed Labor</span><span>$${wo.quotation.laborTotal.toFixed(2)}</span></li>
                        <li style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 8px; margin-top: 8px; font-weight: bold; font-size: 1.1rem;"><span>Total Amount</span><span style="color:var(--accent);">$${wo.quotation.total.toFixed(2)}</span></li>
                    </ul>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn danger" style="flex: 1;" onclick="handleQuoteAction('${wo.id}', false)">Reject</button>
                        <button class="btn success" style="flex: 1;" onclick="handleQuoteAction('${wo.id}', true)">Authorize Repair</button>
                    </div>
                </div>
            `;
        }
        
        let isDone = wo.status === 'Completed' ? 'success' : (wo.status === 'Cancelled' ? 'danger' : 'warning');
        
        return `
            <div class="glass-panel card" style="position: relative; overflow: hidden; ${wo.status==='Cancelled' ? 'opacity: 0.5;' : ''}">
                <div style="position: absolute; top:0; left:0; width: 100%; height: 4px; background: var(--${isDone});"></div>
                <div style="display:flex; justify-content: space-between; margin-bottom: 12px;">
                    <strong>${wo.id}</strong>
                    <span class="badge ${isDone}">${wo.status}</span>
                </div>
                <p style="margin-bottom: 4px;"><strong>Vehicle:</strong> ${wo.vehicle}</p>
                <p style="margin-bottom: 4px; font-size: 0.9rem;"><strong>Appt:</strong> ${wo.date} / ${wo.time}</p>
                ${wo.towing ? '<p style="margin-bottom: 4px; font-size: 0.9rem;"><strong style="color:var(--danger);">Towing Requested</strong></p>' : ''}
                ${progress}
                ${quoteCard}
                ${chatBtn}
                ${actions}
            </div>
        `;
    }).reverse().join('');

    if(!woHtml) woHtml = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No active repairs or scheduled appointments currently.</div>';

    const content = `
        <div class="grid">
            ${woHtml}
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function handleQuoteAction(woId, isApproved) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo && wo.quotation) {
        if(isApproved) {
            wo.status = 'Approved';
            wo.quotation.approved = true;
            saveData('larbyaso_workorders', workOrdersDB);
            renderActiveRepairs();
            alert("Repair Authorized! The assigned mechanic has been notified to commence the repair cycle.");
        } else {
            if(confirm("Are you sure you want to reject this quotation? The repair process will be immediately halted and the ticket closed.")) {
                wo.status = 'Cancelled';
                wo.quotation.approved = false;
                saveData('larbyaso_workorders', workOrdersDB);
                renderActiveRepairs();
            }
        }
    }
}

function cancelBooking(woId) {
    if(confirm("Are you sure you want to cancel this appointment?")) {
        let wo = workOrdersDB.find(w => w.id === woId);
        if(wo) {
            wo.status = 'Cancelled';
            saveData('larbyaso_workorders', workOrdersDB);
            renderActiveRepairs();
        }
    }
}

function rescheduleBooking(woId) {
    let oldWo = workOrdersDB.find(w => w.id === woId);
    let newDate = prompt("Enter new preferred date (YYYY-MM-DD):", oldWo.date !== "TBD" ? oldWo.date : "2026-04-25");
    if(newDate) {
        if(oldWo) {
            oldWo.date = newDate;
            saveData('larbyaso_workorders', workOrdersDB);
            alert("Appointment successfully rescheduled to: " + newDate);
            renderActiveRepairs();
        }
    }
}

function renderCustomerProfile() {
    overrideTitle("Account Settings");
    
    // Highlight the nav securely
    setNav(`
        <li><a href="#" onclick="renderCustomerDashboard()">📅 Book Service</a></li>
        <li><a href="#" onclick="renderActiveRepairs()">📍 Active Repairs</a></li>
        <li><a href="#" onclick="renderMyVehicles()">🚗 My Vehicles</a></li>
        <li><a href="#" onclick="renderCustomerHistory()">📜 History</a></li>
        <li style="margin-top: 16px;"><a href="#" onclick="renderCustomerProfile()" class="active">⚙️ Account Settings</a></li>
    `);

    const user = usersDB[currentUsername];
    let displayName = user.name.replace(' (Customer)', ''); // Strip tag for editing

    const currentAvatarDisplay = user.avatarUrl 
        ? `<img src="${user.avatarUrl}" style="width:100%; height:100%; object-fit:cover;">` 
        : displayName.charAt(0).toUpperCase();

    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-title">Manage Personal Profile</div>
            
            <form onsubmit="event.preventDefault(); updateCustomerProfile();">
                <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 24px;">
                    <input type="file" id="profile-pic-upload" accept="image/*" style="display: none;" onchange="previewProfilePic(event)">
                    <div id="profile-pic-preview" style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer; overflow: hidden; border: 2px solid var(--border); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'" onclick="document.getElementById('profile-pic-upload').click()">
                        ${currentAvatarDisplay}
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 8px;">Click to change avatar</p>
                </div>
                
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" class="form-control" value="${currentUsername}" disabled>
                </div>
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="prof-name" class="form-control" value="${displayName}" required>
                </div>
                <div class="form-group">
                    <label>Update Password</label>
                    <input type="password" id="prof-pass" class="form-control" value="${user.pass}" required>
                </div>
                <!-- Success mock token -->
                <p id="prof-success" style="color: var(--accent); font-size: 0.85rem; display: none; margin-bottom: 12px;">✅ Profile Updated</p>
                
                <div style="display: flex; gap: 16px; margin-top: 24px;">
                    <button type="submit" class="btn success" style="flex-grow: 1;">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function previewProfilePic(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        document.getElementById('profile-pic-preview').innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
        window.tempProfilePicUrl = url;
    }
}

function updateCustomerProfile() {
    const newName = document.getElementById('prof-name').value.trim() + ' (Customer)';
    const newPass = document.getElementById('prof-pass').value;
    
    usersDB[currentUsername].name = newName;
    usersDB[currentUsername].pass = newPass;

    if (window.tempProfilePicUrl) {
        usersDB[currentUsername].avatarUrl = window.tempProfilePicUrl;
        document.getElementById('user-avatar').innerHTML = `<img src="${window.tempProfilePicUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        document.getElementById('user-avatar').style.background = 'transparent';
        delete window.tempProfilePicUrl;
    } else if (!usersDB[currentUsername].avatarUrl) {
        document.getElementById('user-avatar').innerHTML = newName.charAt(0).toUpperCase();
    }
    
    saveData('larbyaso_users', usersDB);

    // Show success
    document.getElementById('prof-success').style.display = 'block';
    
    // Update global avatar/name top right immediately
    document.getElementById('user-name').innerText = newName;

    setTimeout(() => {
        document.getElementById('prof-success').style.display = 'none';
    }, 3000);
}

function renderMyVehicles() {
    overrideTitle("My Vehicles");
    setNav(`
        <li><a href="#" onclick="renderCustomerDashboard()">📅 Book Service</a></li>
        <li><a href="#" onclick="renderActiveRepairs()">📍 Active Repairs</a></li>
        <li><a href="#" onclick="renderMyVehicles()" class="active">🚗 My Vehicles</a></li>
        <li><a href="#" onclick="renderCustomerHistory()">📜 History</a></li>
        <li style="margin-top: 16px;"><a href="#" onclick="renderCustomerProfile()">⚙️ Account Settings</a></li>
    `);

    const myCars = vehiclesDB.filter(v => v.owner === currentUsername);

    let carsHtml = myCars.map(car => `
        <div class="glass-panel card" style="background: rgba(0,0,0,0.2);">
            <div style="display:flex; justify-content: space-between; margin-bottom: 12px; align-items: start;">
                <div>
                    <h3 style="margin-bottom: 4px; color: var(--primary);">${car.brand}</h3>
                    <p class="subtitle" style="font-size: 0.9rem;">${car.year} | ${car.color}</p>
                </div>
                <div class="icon" style="font-size: 2rem; opacity: 0.8;">🚗</div>
            </div>
            <p style="margin-bottom: 16px;"><strong>License Plate:</strong> ${car.plate}</p>
            <div style="display: flex; gap: 8px;">
                <button class="btn primary" style="flex: 1;" onclick="renderCustomerDashboard()">Book Service</button>
            </div>
        </div>
    `).join('');

    if(!carsHtml) carsHtml = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No vehicles found.</div>';

    const content = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="card-title" style="margin-bottom: 0;">Registered Vehicles</div>
            <button class="btn success" onclick="renderCustomerDashboard(true)">+ Add New Car</button>
        </div>
        <div class="grid">
            ${carsHtml}
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function renderCustomerHistory() {
    overrideTitle("Service History");
    setNav(`
        <li><a href="#" onclick="renderCustomerDashboard()">📅 Book Service</a></li>
        <li><a href="#" onclick="renderActiveRepairs()">📍 Active Repairs</a></li>
        <li><a href="#" onclick="renderMyVehicles()">🚗 My Vehicles</a></li>
        <li><a href="#" onclick="renderCustomerHistory()" class="active">📜 History</a></li>
        <li style="margin-top: 16px;"><a href="#" onclick="renderCustomerProfile()">⚙️ Account Settings</a></li>
    `);

    const myHistory = workOrdersDB.filter(w => w.customer === currentUsername && w.status === 'Completed');

    let historyHtml = myHistory.map(wo => {
        return `<tr><td><strong>${wo.id}</strong></td><td>${wo.date}</td><td>${wo.vehicle}</td><td>${wo.quotation ? '$'+wo.quotation.total : 'N/A'}</td><td><button class="btn primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="openFeedbackModal('${wo.id}')">Feedback</button></td></tr>`;
    }).reverse().join('');

    if(!historyHtml) historyHtml = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">No past repair history found.</td></tr>';

    const content = `
        <div class="glass-panel card">
            <div class="card-title">Past Repairs & Services</div>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Work Order</th>
                            <th>Date</th>
                            <th>Vehicle</th>
                            <th>Total Billed</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyHtml}
                    </tbody>
                </table>
            </div>
            <button class="btn secondary" style="margin-top: 24px;" onclick="renderCustomerDashboard()">Back to Book Service</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function openFeedbackModal(wo) {
    const modalHTML = `
        <div id="feedback-modal" class="modal-overlay active">
            <div class="glass-panel modal-content" style="max-width: 500px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <h3>Submit Service Feedback</h3>
                    <button class="btn secondary" style="padding: 4px 8px;" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <p class="subtitle">For Work Order: ${wo}</p>
                <div class="form-group" style="margin-top: 24px;">
                    <label>Rating (1-5)</label>
                    <div style="font-size: 2rem; cursor: pointer; color: #fcd34d;">
                        ★★★★★
                    </div>
                </div>
                <div class="form-group">
                    <label>Review Optional Details</label>
                    <textarea class="form-control" rows="3" placeholder="Tell us how we did..."></textarea>
                </div>
                <button class="btn success" style="width: 100%; margin-top: 16px;" onclick="this.closest('.modal-overlay').remove(); alert('Thank you for your feedback!')">Submit Feedback</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ============================================
// Global Chat Module for Work Orders
// ============================================
function openChatModal(woId) {
    const wo = workOrdersDB.find(w => w.id === woId);
    if (!wo) return;
    
    let messagesHtml = wo.chatLog.map(msg => {
        let align = msg.sender === currentUserRole ? 'align-self: flex-end; background: var(--primary); text-align: right;' : 'align-self: flex-start; background: rgba(255,255,255,0.1); text-align: left;';
        return `
            <div style="display: flex; flex-direction: column; max-width: 80%; ${align} padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <span style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-bottom: 4px;">${msg.name} • ${msg.time}</span>
                <span>${msg.message}</span>
            </div>
        `;
    }).join('') || '<div style="text-align: center; color: var(--text-muted); font-style: italic; margin-top: 24px;">No messages yet. Start the discussion!</div>';

    const modalHTML = `
        <div id="chat-modal" class="modal-overlay active" style="z-index: 100000;">
            <div class="glass-panel modal-content" style="max-width: 600px; padding: 24px; display: flex; flex-direction: column; height: 80vh;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0;">Discussion: ${wo.id}</h3>
                        <p class="subtitle" style="margin: 4px 0 0 0; font-size: 0.85rem;">Vehicle: ${wo.vehicle}</p>
                    </div>
                    <button class="btn secondary" style="padding: 4px 8px;" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                
                <div id="chat-history" style="flex-grow: 1; display: flex; flex-direction: column; overflow-y: auto; padding-right: 8px; margin-bottom: 16px;">
                    ${messagesHtml}
                </div>
                
                <div style="display: flex; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px;">
                    <input type="text" id="chat-input" class="form-control" style="flex-grow: 1;" placeholder="Type a message..." onkeypress="if(event.key === 'Enter') sendChatMessage('${wo.id}')">
                    <button class="btn primary" onclick="sendChatMessage('${wo.id}')">Send</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const historyDiv = document.getElementById('chat-history');
    if (historyDiv) historyDiv.scrollTop = historyDiv.scrollHeight;
    setTimeout(() => { document.getElementById('chat-input').focus(); }, 100);
}

function sendChatMessage(woId) {
    const input = document.getElementById('chat-input');
    const msgText = input.value.trim();
    if (!msgText) return;
    
    const wo = workOrdersDB.find(w => w.id === woId);
    if (wo) {
        let timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        let currentName = usersDB[currentUsername] ? usersDB[currentUsername].name : currentUsername;
        wo.chatLog.push({ sender: currentUserRole, name: currentName, time: timestamp, message: msgText });
        saveData('larbyaso_workorders', workOrdersDB);
        
        document.getElementById('chat-modal').remove();
        openChatModal(woId);
    }
}

// ============================================
// UC23: Staff - Manage Spare Parts Inventory
// ============================================
const defaultInventory = [
    { code: 'B-001', name: 'Brake Pads (Front)', qty: 12, threshold: 5 },
    { code: 'O-023', name: 'Synthetic Engine Oil 5W-30', qty: 4, threshold: 10 },
    { code: 'F-011', name: 'Air Filter', qty: 25, threshold: 10 }
];
let inventory = loadData('larbyaso_inventory', defaultInventory);

function renderStaffDashboard() {
    overrideTitle("Inventory Management");
    setNav(`
        <li><a href="#" onclick="renderStaffDashboard()" class="active">📦 Inventory</a></li>
        <li><a href="#" onclick="renderSupplierOrders()">🚚 Supplier Orders</a></li>
        <li><a href="#" onclick="renderCustomerManagement()">👥 Customer Mgt</a></li>
        <li><a href="#" onclick="renderStaffRepairs()">🛠️ Repair Orders</a></li>
    `);
    
    let tableRows = inventory.map(item => {
        let isLow = item.qty <= item.threshold;
        let badge = isLow ? '<span class="badge warning">Low Stock</span>' : '<span class="badge success">In Stock</span>';
        return `
            <tr>
                <td><strong>${item.code}</strong></td>
                <td>${item.name}</td>
                <td>${item.qty} units</td>
                <td>${badge}</td>
                <td>
                    <button class="btn secondary" style="padding: 6px 12px; font-size: 0.8rem;" onclick="addStock('${item.code}')">+ Add Stock</button>
                </td>
            </tr>
        `;
    }).join('');

    const content = `
        <div class="glass-panel card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div class="card-title" style="margin: 0;">Spare Parts Inventory</div>
                <button class="btn primary" onclick="showNewPartForm()">+ Register New Part</button>
            </div>
            
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Part Code</th>
                            <th>Part Name</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Add Stock Modal (Mockup) -->
        <div id="stock-modal" class="modal-overlay">
            <div class="glass-panel modal-content">
                <h3>Update Stock Level</h3>
                <p class="subtitle" style="margin-top: 8px;">Enter the amount of units to add.</p>
                <div class="form-group" style="margin-top: 16px;">
                    <label>Units Arrived</label>
                    <input type="number" id="restock-qty" class="form-control" value="10" min="1">
                </div>
                <div class="modal-actions">
                    <button class="btn secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn primary" onclick="confirmRestock()">Update</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

let activeRestockCode = null;
function addStock(code) {
    activeRestockCode = code;
    document.getElementById('stock-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('stock-modal').classList.remove('active');
    activeRestockCode = null;
}

function confirmRestock() {
    let qtyToAdd = parseInt(document.getElementById('restock-qty').value, 10);
    let item = inventory.find(i => i.code === activeRestockCode);
    if(item) {
        item.qty += qtyToAdd;
        saveData('larbyaso_inventory', inventory);
    }
    closeModal();
    renderStaffDashboard(); // re-render
}

function showNewPartForm() {
    // Navigates to alternative flow part 2 of UC23 (add new part)
    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-title">Register New Part</div>
            
            <form onsubmit="event.preventDefault(); saveNewPart();">
                <div class="form-group">
                    <label>Product Code</label>
                    <input type="text" id="new-code" class="form-control" placeholder="e.g. S-101" required>
                </div>
                <div class="form-group">
                    <label>Part Name</label>
                    <input type="text" id="new-name" class="form-control" placeholder="e.g. Spark Plug" required>
                </div>
                <div class="form-group">
                    <label>Initial Quantity</label>
                    <input type="number" id="new-qty" class="form-control" min="0" value="0" required>
                </div>
                <div class="form-group">
                    <label>Low Stock Threshold (Alert Level)</label>
                    <input type="number" id="new-threshold" class="form-control" min="1" value="5" required>
                </div>
                <div style="display: flex; gap: 16px; margin-top: 24px;">
                    <button type="button" class="btn secondary" onclick="renderStaffDashboard()">Cancel</button>
                    <button type="submit" class="btn primary" style="flex-grow: 1;">Save Part</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function saveNewPart() {
    let code = document.getElementById('new-code').value;
    let name = document.getElementById('new-name').value;
    let qty = parseInt(document.getElementById('new-qty').value, 10);
    let threshold = parseInt(document.getElementById('new-threshold').value, 10);
    
    inventory.push({ code, name, qty, threshold });
    saveData('larbyaso_inventory', inventory);
    
    renderStaffDashboard();
}

function renderSupplierOrders() {
    overrideTitle("Supplier Orders");
    setNav(`
        <li><a href="#" onclick="renderStaffDashboard()">📦 Inventory</a></li>
        <li><a href="#" onclick="renderSupplierOrders()" class="active">🚚 Supplier Orders</a></li>
        <li><a href="#" onclick="renderCustomerManagement()">👥 Customer Mgt</a></li>
        <li><a href="#" onclick="renderStaffRepairs()">🛠️ Repair Orders</a></li>
    `);

    const content = `
        <div class="glass-panel card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div class="card-title" style="margin: 0;">Pending Incoming Parts</div>
                <button class="btn primary" onclick="alert('Open New Order Form')">+ Place New Order</button>
            </div>
            
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Part</th>
                            <th>Quantity</th>
                            <th>Supplier</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>PO-1004</strong></td><td>Synthetic Eng Oil (O-023)</td><td>20 units</td><td>GlobalParts Inc.</td><td><span class="badge warning">In Transit</span></td><td><button class="btn success" style="padding: 4px 12px; font-size:0.8rem;" onclick="receiveSupplyOrder(this, 'O-023', 20)">Mark Delivered</button></td></tr>
                        <tr><td><strong>PO-1002</strong></td><td>Brake Pads (B-001)</td><td>50 units</td><td>AutoPlus</td><td><span class="badge success">Delivered</span></td><td><button class="btn secondary" style="padding: 4px 12px; font-size:0.8rem;" disabled>Completed</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function receiveSupplyOrder(btn, code, qty) {
    let item = inventory.find(i => i.code === code);
    if(item) {
        item.qty += qty;
        saveData('larbyaso_inventory', inventory);
    }
    btn.className = "btn secondary";
    btn.disabled = true;
    btn.innerText = "Completed";
    btn.parentElement.previousElementSibling.innerHTML = '<span class="badge success">Delivered</span>';
    alert(`Received ${qty} units of ${code}. Inventory successfully updated!`);
}

function renderCustomerManagement() {
    overrideTitle("Customer Management");
    setNav(`
        <li><a href="#" onclick="renderStaffDashboard()">📦 Inventory</a></li>
        <li><a href="#" onclick="renderSupplierOrders()">🚚 Supplier Orders</a></li>
        <li><a href="#" onclick="renderCustomerManagement()" class="active">👥 Customer Mgt</a></li>
        <li><a href="#" onclick="renderStaffRepairs()">🛠️ Repair Orders</a></li>
    `);

    const content = `
        <div class="glass-panel card">
            <div class="card-title">Customer Loyalty & Usage</div>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th>Username</th>
                            <th>Total Visits</th>
                            <th>Loyalty Tier</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Alex</strong></td>
                            <td>customer</td>
                            <td>12</td>
                            <td><span class="badge" style="background: gold; color: #000;">Gold Member</span></td>
                            <td><button class="btn success" style="padding: 4px 12px; font-size:0.8rem;" onclick="alert('Applied 10% Gold Discount to next invoice.')">Apply 10% Discount</button></td>
                        </tr>
                        <tr>
                            <td><strong>Emma</strong></td>
                            <td>emma_c</td>
                            <td>4</td>
                            <td><span class="badge" style="background: silver; color: #000;">Silver Member</span></td>
                            <td><button class="btn success" style="padding: 4px 12px; font-size:0.8rem;" onclick="alert('Applied 5% Silver Discount to next invoice.')">Apply 5% Discount</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function renderStaffRepairs() {
    overrideTitle("Repair Orders");
    setNav(`
        <li><a href="#" onclick="renderStaffDashboard()">📦 Inventory</a></li>
        <li><a href="#" onclick="renderSupplierOrders()">🚚 Supplier Orders</a></li>
        <li><a href="#" onclick="renderCustomerManagement()">👥 Customer Mgt</a></li>
        <li><a href="#" onclick="renderStaffRepairs()" class="active">🛠️ Repair Orders</a></li>
    `);

    let mechanicOptions = Object.keys(usersDB)
        .filter(k => usersDB[k].role === 'mechanic')
        .map(k => `<option value="${k}">${usersDB[k].name}</option>`)
        .join('');

    let tableRows = workOrdersDB.map(wo => {
        let isDone = wo.status === 'Completed' ? 'success' : (wo.status === 'Cancelled' ? 'danger' : 'warning');
        
        let assignmentHtml = wo.mechanic ? 
            `<span style="color:var(--accent);">${usersDB[wo.mechanic] ? usersDB[wo.mechanic].name : wo.mechanic}</span>` : 
            `<select class="form-control" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(255,255,255,0.05);" onchange="assignMechanic('${wo.id}', this.value)">
                <option value="">Assign Mechanic</option>
                ${mechanicOptions}
            </select>`;
            
        let chatBtn = `<button class="btn secondary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="openChatModal('${wo.id}')">💬 Chat</button>`;
        let actions = chatBtn;

        if (wo.status === 'Diagnostic Submitted') {
            actions += `<button class="btn success" style="padding: 4px 8px; font-size: 0.8rem; margin-left: 8px;" onclick="generateQuotation('${wo.id}')">Generate Quote</button>`;
        }

        let towFlag = wo.towing ? '<br><span class="badge warning" style="font-size:0.6rem; padding: 2px 6px; margin-top: 4px;">Towing Requested</span>' : '';

        return `
            <tr>
                <td><strong>${wo.id}</strong></td>
                <td>${usersDB[wo.customer] ? usersDB[wo.customer].name : wo.customer}</td>
                <td>${wo.vehicle}${towFlag}</td>
                <td>${assignmentHtml}</td>
                <td><span class="badge ${isDone}">${wo.status}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    }).reverse().join('');

    if(!tableRows) tableRows = '<tr><td colspan="6" style="text-align:center;">No active work orders.</td></tr>';

    const content = `
        <div class="glass-panel card">
            <div class="card-title">All Active Work Orders</div>
            <div style="overflow-x: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>WO#</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Assigned Mechanic</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function assignMechanic(woId, mechanicUsername) {
    if(!mechanicUsername) return;
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo) {
        wo.mechanic = mechanicUsername;
        if(wo.status === 'Pending Check-in') {
            wo.status = 'In Progress';
        }
        saveData('larbyaso_workorders', workOrdersDB);
        renderStaffRepairs();
    }
}

function generateQuotation(woId) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(!wo) return;
    
    let partsCost = (wo.requiredParts || []).length * 75; 
    let laborCost = (wo.estimatedLabor || 1.0) * 85; 
    
    let partsListHTML = (wo.requiredParts || []).map(p => `<li>${p} - $75.00</li>`).join('');
    
    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-title">Generate Quotation (${woId})</div>
            
            <form onsubmit="event.preventDefault(); submitQuotation('${woId}', ${partsCost}, ${laborCost});">
                <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">
                    <p class="subtitle" style="margin-bottom: 8px; color: var(--text-main);">Mechanic Findings:</p>
                    <p style="font-size:0.9rem; color:var(--text-muted); font-style:italic; margin-bottom: 12px;">"${wo.diagnosticNotes || 'N/A'}"</p>
                    
                    <p class="subtitle" style="margin-bottom: 8px; color: var(--text-main);">Required Parts Reference:</p>
                    <ul style="font-size:0.9rem; color:var(--text-muted); margin-bottom: 12px; list-style-position: inside;">
                        ${partsListHTML || '<li>None</li>'}
                    </ul>
                    
                    <p class="subtitle" style="margin-bottom: 8px; color: var(--text-main);">Labor Details:</p>
                    <p style="font-size:0.9rem; color:var(--text-muted);">${wo.estimatedLabor || 0} Hours</p>
                </div>

                <div class="form-group">
                    <label>Quoted Parts Cost ($)</label>
                    <input type="number" class="form-control" value="${partsCost}" disabled>
                </div>
                
                <div class="form-group">
                    <label>Quoted Labor Cost ($)</label>
                    <input type="number" class="form-control" value="${laborCost}" disabled>
                </div>
                
                <h3 style="margin-top: 16px; text-align: right;">Total: <span style="color: var(--accent);">$${partsCost + laborCost}</span></h3>

                <div style="display: flex; gap: 16px; margin-top: 32px;">
                    <button type="button" class="btn secondary" onclick="renderStaffRepairs()">Cancel</button>
                    <button type="submit" class="btn primary" style="flex-grow: 1;">Send Quote to Customer</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function submitQuotation(woId, pCost, lCost) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo) {
        wo.status = 'Quoted';
        wo.quotation = { partsTotal: pCost, laborTotal: lCost, total: pCost + lCost, approved: null };
        saveData('larbyaso_workorders', workOrdersDB);
    }

    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 40px auto; text-align: center;">
            <div class="icon" style="font-size: 3rem; margin-bottom: 16px; color: var(--accent);">✅</div>
            <h2>Quotation Sent!</h2>
            <p class="subtitle" style="margin-top: 8px;">The quotation for ${woId} is awaiting customer approval.</p>
            <button class="btn secondary" style="margin-top: 24px;" onclick="renderStaffRepairs()">Back to Orders</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}


// ============================================
// UC17: Mechanic - Record Inspection
// ============================================
function renderMechanicDashboard() {
    overrideTitle("Assigned Jobs");
    setNav(`
        <li><a href="#" onclick="renderMechanicDashboard()" class="active">📋 Work Orders</a></li>
        <li><a href="#" onclick="renderMockView('Manuals', 'Digital repair manuals and specs.')">🔧 Manuals</a></li>
    `);

    let assignedWOs = workOrdersDB.filter(w => w.mechanic === currentUsername);

    let htmlJobs = assignedWOs.map(wo => {
        let isDone = wo.status === 'Completed' ? 'success' : 'warning';
        let actionBtn = '';

        if (wo.status === 'In Progress') { // Staff assigned it newly
            actionBtn = `<button class="btn primary" style="width: 100%;" onclick="startDiagnostic('${wo.id}')">🔍 Start Diagnostic</button>`;
        } else if (wo.status === 'Diagnostic Submitted') {
            actionBtn = `<button class="btn secondary" style="width: 100%;" disabled>⏳ Pending Staff Quote</button>`;
        } else if (wo.status === 'Quoted') {
            actionBtn = `<button class="btn secondary" style="width: 100%;" disabled>⏳ Pending Cust. Approval</button>`;
        } else if (wo.status === 'Approved') {
            actionBtn = `<button class="btn success" style="width: 100%;" onclick="beginRepair('${wo.id}')">🛠️ Begin Repair</button>`;
            isDone = 'success';
        } else if (wo.status === 'Repairing') {
            actionBtn = `<button class="btn warning" style="width: 100%; color: #000;" onclick="finishRepair('${wo.id}')">✅ Finish Job</button>`;
        } else if (wo.status === 'Completed') {
            actionBtn = `<button class="btn secondary" style="width: 100%;" onclick="renderMockView('Inspection Report - ${wo.id}', 'Diagnostic summary constraints are immutable.')">View Report</button>`;
        }

        let chatBtn = `<button class="btn secondary" style="width: 100%; margin-top: 8px;" onclick="openChatModal('${wo.id}')">💬 Communication</button>`;
        
        return `
            <div class="glass-panel card" style="background: rgba(0,0,0,0.2); ${(wo.status === 'Completed' || wo.status === 'Cancelled') ? 'opacity: 0.7;' : ''}">
                <div style="display:flex; justify-content: space-between; margin-bottom: 12px;">
                    <strong>${wo.id}</strong>
                    <span class="badge ${isDone}">${wo.status}</span>
                </div>
                <p style="margin-bottom: 8px;"><strong>Vehicle:</strong> ${wo.vehicle}</p>
                <p class="subtitle" style="margin-bottom: 16px;">Task info locked to tracking progression.</p>
                ${actionBtn}
                ${chatBtn}
            </div>
        `;
    }).reverse().join('');

    if(!htmlJobs) htmlJobs = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No jobs assigned to your queue currently.</div>';

    const content = `
        <div class="glass-panel card">
            <div class="card-title">Current Assignments</div>
            <div class="grid">
                ${htmlJobs}
            </div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function startDiagnostic(jobId) {
    overrideTitle("Inspection Report - " + jobId);
    const content = `
        <div class="glass-panel card" style="max-width: 700px; margin: 0 auto;">
            <div class="card-title">Record Findings</div>
            
            <form onsubmit="event.preventDefault(); submitDiagnostic('${jobId}');">
                <div class="form-group">
                    <label>Inspection Results / Faults Found</label>
                    <textarea id="diag-notes" class="form-control" rows="4" placeholder="Describe mechanical issues identified..." required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Required Parts</label>
                    <input id="diag-parts" type="text" class="form-control" placeholder="e.g. B-001, O-023">
                </div>
                
                <div class="form-group">
                    <label>Estimated Labor Time (Hours)</label>
                    <input id="diag-labor" type="number" class="form-control" min="0.5" step="0.5" value="1.0" required>
                </div>
                
                <div style="display: flex; gap: 16px; margin-top: 32px;">
                    <button type="button" class="btn secondary" onclick="renderMechanicDashboard()">Back</button>
                    <button type="submit" class="btn success" style="flex-grow: 1;">Submit Diagnostic</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function submitDiagnostic(woId) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo) {
        wo.status = 'Diagnostic Submitted';
        wo.diagnosticNotes = document.getElementById('diag-notes').value;
        wo.requiredParts = document.getElementById('diag-parts').value.split(',').map(s=>s.trim()).filter(Boolean);
        wo.estimatedLabor = parseFloat(document.getElementById('diag-labor').value);
        saveData('larbyaso_workorders', workOrdersDB);
    }

    const content = `
        <div class="glass-panel card" style="max-width: 600px; margin: 40px auto; text-align: center;">
            <div class="icon" style="font-size: 3rem; margin-bottom: 16px; color: var(--accent);">✅</div>
            <h2>Diagnostic Submitted!</h2>
            <p class="subtitle" style="margin-top: 8px;">The diagnostic report for ${woId} has been sent to Staff for quotation generation.</p>
            <button class="btn secondary" style="margin-top: 24px;" onclick="renderMechanicDashboard()">Back to Jobs List</button>
        </div>
    `;
    document.getElementById('main-content').innerHTML = content;
}

function beginRepair(woId) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo) {
        wo.status = 'Repairing';
        saveData('larbyaso_workorders', workOrdersDB);
        renderMechanicDashboard();
    }
}

function finishRepair(woId) {
    let wo = workOrdersDB.find(w => w.id === woId);
    if(wo) {
        if(confirm("Mark this vehicle repair as fully completed and ready for pickup?")) {
            wo.status = 'Completed';
            saveData('larbyaso_workorders', workOrdersDB);
            renderMechanicDashboard();
        }
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('upload-icon').innerText = '✅';
        document.getElementById('upload-icon').style.color = 'var(--accent)';
        document.getElementById('upload-text').innerHTML = `<strong>${file.name}</strong><br><span style="font-size:0.8rem">Ready for attachment</span>`;
        document.getElementById('upload-zone').style.borderColor = 'var(--accent)';
        document.getElementById('upload-zone').style.background = 'rgba(16, 185, 129, 0.1)';
    }
}
