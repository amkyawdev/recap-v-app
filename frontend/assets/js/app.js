// frontend/assets/js/app.js
// Global App JavaScript - Navigation, Hamburger, Loader

document.addEventListener('DOMContentLoaded', function() {
    // Hamburger Menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(event.target) && 
                !hamburger.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Hide loader after page load
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.classList.remove('active');
        }, 500);
    }
    
    // Toast notification system
    window.showToast = function(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        switch(type) {
            case 'success': icon = '✅'; break;
            case 'error': icon = '❌'; break;
            case 'warning': icon = '⚠️'; break;
            default: icon = 'ℹ️';
        }
        
        toast.innerHTML = `${icon} ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };
    
    // Dialog system
    window.showDialog = function(title, content, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay active';
        
        overlay.innerHTML = `
            <div class="dialog">
                <div class="dialog-header">
                    <h3>${title}</h3>
                    <button class="close-dialog">&times;</button>
                </div>
                <div class="dialog-body">
                    ${content}
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary cancel-btn">Cancel</button>
                    <button class="btn btn-primary confirm-btn">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeBtn = overlay.querySelector('.close-dialog');
        const cancelBtn = overlay.querySelector('.cancel-btn');
        const confirmBtn = overlay.querySelector('.confirm-btn');
        
        const close = () => overlay.remove();
        
        closeBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            close();
        });
        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            close();
        });
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            close();
        });
        
        return overlay;
    };
    
    // Show/hide loader
    window.showLoader = function(show, message = 'Processing...') {
        const loader = document.getElementById('loader');
        if (loader) {
            if (show) {
                loader.querySelector('p').textContent = message;
                loader.classList.add('active');
            } else {
                loader.classList.remove('active');
            }
        }
    };
});

// Storage helpers
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(`movie_recap_${key}`, JSON.stringify(value));
        } catch(e) {}
    },
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(`movie_recap_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    },
    remove: (key) => {
        localStorage.removeItem(`movie_recap_${key}`);
    },
    clear: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('movie_recap_')) {
                localStorage.removeItem(key);
            }
        });
    }
};
