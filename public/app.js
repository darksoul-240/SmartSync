// --- JQUERY SECTION (Unit III) ---
$(document).ready(function() {
    // Basic animation/moving elements
    $('#toggle-alerts').click(function() {
        $('#alerts-box').slideToggle(300);
        let btnText = $(this).text() === 'Hide' ? 'Show' : 'Hide';
        $(this).text(btnText);
    });
});

// --- VUE.JS SECTION (Unit IV) ---
const { createApp } = Vue;

createApp({
    data() {
        return {
            devices: [],
            alerts: [],
            newDevice: { name: '', type: '', ipAddress: '' },
            formError: ''
        }
    },
    mounted() {
        this.fetchDevices();
        this.fetchAlerts();
    },
    methods: {
        // Fetch devices from DB
        async fetchDevices() {
            try {
                const response = await fetch('/api/devices');
                this.devices = await response.json();
            } catch (error) { console.error("Error fetching devices:", error); }
        },
        
        // Fetch alerts from DB
        async fetchAlerts() {
            try {
                const response = await fetch('/api/alerts');
                this.alerts = await response.json();
            } catch (error) { console.error("Error fetching alerts:", error); }
        },

        // UNIT III: Regular Expressions
        validateIP(ip) {
            const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            return ipRegex.test(ip);
        },

        // Create new device
        async addNewDevice() {
            this.formError = '';

            if (!this.validateIP(this.newDevice.ipAddress)) {
                this.formError = "Invalid IP Address format! Must be like 192.168.1.10";
                return;
            }

            try {
                const response = await fetch('/api/devices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.newDevice)
                });
                
                if(response.ok) {
                    this.newDevice = { name: '', type: '', ipAddress: '' }; // Reset form
                    this.fetchDevices(); // Refresh lists
                    this.fetchAlerts();
                }
            } catch (error) {
                console.error("Failed to add device:", error);
            }
        },

        // Delete a device
        async deleteDevice(deviceId, index) {
            if(!confirm("Are you sure you want to delete this device?")) return;

            try {
                await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
                this.devices.splice(index, 1); // Remove from UI instantly
            } catch (error) {
                console.error("Failed to delete device:", error);
            }
        },

        // Toggle device state ON/OFF
        async toggleDevice(index) {
            const device = this.devices[index];
            const newState = !device.isOn;
            this.devices[index].isOn = newState; // Optimistic update
            
            try {
                await fetch('/api/devices/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        deviceId: device._id, 
                        newState: newState,
                        name: device.name
                    })
                });
                this.fetchAlerts(); // Refresh alerts to show the change
            } catch (error) {
                this.devices[index].isOn = !newState; // Revert if failed
                console.error("Failed to toggle:", error);
            }
        },

        // Dummy method for thermostat update alert
        updateDevice(device) {
            alert(`${device.name} temperature set to ${device.value}°C!`);
        }
    }
}).mount('#app');