document.addEventListener('DOMContentLoaded', () => {
    const toastContainer = document.getElementById('toast-container');

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

    function addLogEntry(event, device) {
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        const newLog = {
            timestamp: new Date().toISOString(),
            event: event,
            device: device
        };
        logs.unshift(newLog);
        localStorage.setItem('smartSyncLogs', JSON.stringify(logs.slice(0, 20)));
    }

    function renderLogs() {
        const logTable = document.getElementById('log-table');
        if (!logTable) return;

        const logBody = logTable.querySelector('tbody');
        const logs = JSON.parse(localStorage.getItem('smartSyncLogs')) || [];
        logBody.innerHTML = '';

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

    function updateDeviceStatus(deviceElement, newStatus, isActive) {
        const statusElement = deviceElement.querySelector('[data-status]');
        if (statusElement) {
            statusElement.textContent = newStatus;
            statusElement.classList.toggle('active', isActive);
            statusElement.classList.toggle('inactive', !isActive);
        }
    }

    document.body.addEventListener('click', (e) => {
        const button = e.target;
        const deviceElement = button.closest('[data-device]');
        if (!deviceElement) return;

        let event, deviceName, toastType = 'success';

        if (button.classList.contains('btn-on') || button.classList.contains('btn-light-on')) {
            const isActive = true;
            const status = button.classList.contains('btn-on') ? 'Active' : 'On';
            deviceName = button.classList.contains('btn-on') ? 'Security Camera' : 'Smart Light';
            updateDeviceStatus(deviceElement, status, isActive);
            event = 'Turned On';
            toastType = 'success';
        } else if (button.classList.contains('btn-off') || button.classList.contains('btn-light-off')) {
            const isActive = false;
            const status = button.classList.contains('btn-off') ? 'Inactive' : 'Off';
            deviceName = button.classList.contains('btn-off') ? 'Security Camera' : 'Smart Light';
            updateDeviceStatus(deviceElement, status, isActive);
            event = 'Turned Off';
            toastType = 'error';
        } else if (button.classList.contains('btn-lock')) {
            updateDeviceStatus(deviceElement, 'Locked', true);
            [eventName, deviceName, toastType] = ['Locked', 'Smart Lock', 'success'];
        } else if (button.classList.contains('btn-unlock')) {
            updateDeviceStatus(deviceElement, 'Unlocked', false);
            [eventName, deviceName, toastType] = ['Unlocked', 'Smart Lock', 'error'];
        } else if (button.classList.contains('btn-set-temp')) {
            const tempInput = deviceElement.querySelector('.temp-input');
            const statusElement = deviceElement.querySelector('[data-status]');
            if (tempInput && statusElement) {
                const newTemp = parseFloat(tempInput.value);
                const currentTemp = parseFloat(statusElement.textContent);
                
                if (newTemp > currentTemp) {
                    toastType = 'error'; // Red for increase
                } else if (newTemp < currentTemp) {
                    toastType = 'info'; // Blue for decrease
                }
                
                updateDeviceStatus(deviceElement, `${newTemp}°C`, true);
                [eventName, deviceName] = [`Set to ${newTemp}°C`, 'Thermostat'];
            }
        }

        if (eventName) {
            showToast(`${deviceName} ${eventName}.`, toastType);
            addLogEntry(eventName, deviceName);
        }
    });

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

    if (document.getElementById('log-table')) {
        renderLogs();
    }
});
