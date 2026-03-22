document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    function initializeDeviceState() {
        if (localStorage.getItem('smartSyncDeviceState')) return;

        const defaultState = {
            camera: { name: 'Security Camera', status: 'Active', isActive: true },
            lock: { name: 'Smart Lock', status: 'Locked', isActive: true },
            thermostat: { name: 'Thermostat', status: '21°C', temp: 21 },
            light: { name: 'Smart Light', status: 'Off', isActive: false }
        };
        localStorage.setItem('smartSyncDeviceState', JSON.stringify(defaultState));
    }

    function getDeviceState() {
        return JSON.parse(localStorage.getItem('smartSyncDeviceState'));
    }

    function setDeviceState(newState) {
        localStorage.setItem('smartSyncDeviceState', JSON.stringify(newState));
    }

    function renderDeviceStates() {
        const state = getDeviceState();
        if (!state) return;

        document.querySelectorAll('[data-device]').forEach(deviceElement => {
            const deviceId = deviceElement.dataset.device;
            const device = state[deviceId];
            if (!device) return;

            const statusElement = deviceElement.querySelector('[data-status]');
            if (statusElement) {
                statusElement.textContent = device.status;
                statusElement.classList.toggle('active', device.isActive);
                statusElement.classList.toggle('inactive', !device.isActive);
            }
            if (deviceId === 'thermostat') {
                const tempInput = deviceElement.querySelector('.temp-input');
                if (tempInput) tempInput.value = device.temp;
            }
        });
    }

    // --- Logging ---
    function addLogEntry(event, device) {
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        logs.unshift({
            timestamp: new Date().toISOString(),
            device: device,
            event: event,
            source: 'User'
        });
        localStorage.setItem('smartSyncLogs', JSON.stringify(logs.slice(0, 20)));
    }

    function renderLogs() {
        const logTable = document.getElementById('log-table');
        if (!logTable) return;
        const logBody = logTable.querySelector('tbody');
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        logBody.innerHTML = logs.length === 0
            ? '<tr><td colspan="4">No log entries found.</td></tr>'
            : logs.map(log => `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${log.device.replace(/</g, "&lt;")}</td>
                    <td>${log.event.replace(/</g, "&lt;")}</td>
                    <td>${log.source.replace(/</g, "&lt;")}</td>
                </tr>
            `).join('');
    }

    // --- UI Feedback ---
    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toastContainer.removeChild(toast), 300);
        }, 3000);
    }

    // --- Event Handling ---
    document.body.addEventListener('click', (e) => {
        const button = e.target;
        const deviceElement = button.closest('[data-device]');
        if (!deviceElement) return;
        
        const deviceId = deviceElement.dataset.device;
        const state = getDeviceState();
        const device = state[deviceId];

        let event, toastType, toastMessage;

        // --- Camera and Light ---
        if (button.matches('.btn-on, .btn-light-on')) {
            if (device.isActive) {
                toastMessage = `${device.name} is already on.`;
                toastType = 'neutral';
            } else {
                device.isActive = true;
                device.status = deviceId === 'camera' ? 'Active' : 'On';
                event = 'Turned On';
                toastType = 'success';
            }
        } else if (button.matches('.btn-off, .btn-light-off')) {
            if (!device.isActive) {
                toastMessage = `${device.name} is already off.`;
                toastType = 'neutral';
            } else {
                device.isActive = false;
                device.status = deviceId === 'camera' ? 'Inactive' : 'Off';
                event = 'Turned Off';
                toastType = 'error';
            }
        // --- Lock ---
        } else if (button.matches('.btn-lock')) {
            if (device.status === 'Locked') {
                toastMessage = 'Smart Lock is already locked.';
                toastType = 'neutral';
            } else {
                device.status = 'Locked';
                device.isActive = true;
                event = 'Locked';
                toastType = 'success';
            }
        } else if (button.matches('.btn-unlock')) {
             if (device.status !== 'Locked') {
                toastMessage = 'Smart Lock is already unlocked.';
                toastType = 'neutral';
            } else {
                device.status = 'Unlocked';
                device.isActive = false;
                event = 'Unlocked';
                toastType = 'error';
            }
        // --- Thermostat ---
        } else if (button.matches('.btn-set-temp')) {
            const newTemp = parseFloat(deviceElement.querySelector('.temp-input').value);
            if (newTemp === device.temp) {
                toastMessage = `Temperature is already at ${device.temp}°C.`;
                toastType = 'neutral';
            } else {
                toastType = newTemp > device.temp ? 'error' : 'info';
                event = `Set to ${newTemp}°C`;
                device.temp = newTemp;
                device.status = `${newTemp}°C`;
            }
        }

        // --- Finalize ---
        if (event) { // An action occurred
            setDeviceState(state);
            renderDeviceStates();
            addLogEntry(event, device.name);
            if (document.getElementById('log-table')) {
                renderLogs();
            }
            showToast(`${device.name} ${event}.`, toastType);
        } else if (toastMessage) { // A no-op action
            showToast(toastMessage, toastType);
        }
    });

    // --- Form Validation ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name');
            const email = document.getElementById('email');
            const message = document.getElementById('message');
            const errorDiv = document.getElementById('form-error');
            let isValid = true;

            [name, email, message].forEach(input => {
                if (input.value.trim() === '') {
                    input.classList.add('invalid');
                    isValid = false;
                } else {
                    input.classList.remove('invalid');
                }
            });

            if (!isValid) {
                errorDiv.textContent = 'All fields are required.';
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                email.classList.add('invalid');
                errorDiv.textContent = 'Please enter a valid email address.';
                return;
            }

            errorDiv.textContent = '';
            showToast('Thank you for your message!');
            contactForm.reset();
        });
    }

    // --- Initial Load ---
    initializeDeviceState();
    renderDeviceStates();
    renderLogs();
});
