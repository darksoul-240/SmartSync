document.addEventListener('DOMContentLoaded', () => {
    const toastContainer = document.getElementById('toast-container');

    // --- Toast Notification ---
    function showToast(message, type = 'success') {
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

    // --- Logging ---
    function addLogEntry(event, device) {
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        const newLog = {
            timestamp: new Date().toISOString(),
            event: event,
            device: device
        };
        logs.unshift(newLog); // Add to the beginning of the array
        localStorage.setItem('smartSyncLogs', JSON.stringify(logs.slice(0, 20))); // Keep last 20 logs
    }

    function renderLogs() {
        const logTable = document.getElementById('log-table');
        if (!logTable) return;

        const logBody = logTable.querySelector('tbody');
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        logBody.innerHTML = ''; // Clear existing logs

        if (logs.length === 0) {
            logBody.innerHTML = '<tr><td colspan="3">No log entries found.</td></tr>';
            return;
        }

        logs.forEach(log => {
            const row = document.createElement('tr');
            const eventFormatted = log.event.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${eventFormatted}</td>
                <td>${log.device}</td>
            `;
            logBody.appendChild(row);
        });
    }

    // --- Device Status ---
    function updateDeviceStatus(deviceElement, newStatus, isActive) {
        const statusElement = deviceElement.querySelector('[data-status]');
        if (statusElement) {
            statusElement.textContent = newStatus;
            statusElement.classList.toggle('active', isActive);
            statusElement.classList.toggle('inactive', !isActive);
        }
    }

    // --- Event Handling ---
    document.body.addEventListener('click', (e) => {
        const button = e.target;
        const deviceElement = button.closest('[data-device]');
        if (!deviceElement) return;

        const deviceType = deviceElement.dataset.device;
        let event, deviceName;

        if (button.classList.contains('btn-on')) {
            updateDeviceStatus(deviceElement, 'Active', true);
            [eventName, deviceName] = ['Turned On', 'Security Camera'];
        } else if (button.classList.contains('btn-off')) {
            updateDeviceStatus(deviceElement, 'Inactive', false);
            [eventName, deviceName] = ['Turned Off', 'Security Camera'];
        } else if (button.classList.contains('btn-lock')) {
            updateDeviceStatus(deviceElement, 'Locked', true);
            [eventName, deviceName] = ['Locked', 'Smart Lock'];
        } else if (button.classList.contains('btn-unlock')) {
            updateDeviceStatus(deviceElement, 'Unlocked', false);
            [eventName, deviceName] = ['Unlocked', 'Smart Lock'];
        } else if (button.classList.contains('btn-set-temp')) {
            const temp = deviceElement.querySelector('.temp-input').value;
            updateDeviceStatus(deviceElement, `${temp}°C`, true);
            [eventName, deviceName] = [`Set to ${temp}°C`, 'Thermostat'];
        } else if (button.classList.contains('btn-light-on')) {
            updateDeviceStatus(deviceElement, 'On', true);
            [eventName, deviceName] = ['Turned On', 'Smart Light'];
        } else if (button.classList.contains('btn-light-off')) {
            updateDeviceStatus(deviceElement, 'Off', false);
            [eventName, deviceName] = ['Turned Off', 'Smart Light'];
        }

        if (eventName) {
            showToast(`${deviceName} ${eventName}.`);
            addLogEntry(eventName, deviceName);
        }
    });

    // --- Form Validation ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            const errorDiv = document.getElementById('form-error');

            if (name === '' || email === '' || message === '') {
                errorDiv.textContent = 'All fields are required.'; return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorDiv.textContent = 'Please enter a valid email address.'; return;
            }

            errorDiv.textContent = '';
            showToast('Thank you for your message!');
            contactForm.reset();
        });
    }

    // --- Page-specific initializations ---
    if (document.getElementById('log-table')) {
        renderLogs();
    }
});
