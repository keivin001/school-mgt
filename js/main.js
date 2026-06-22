document.addEventListener("DOMContentLoaded", function () {
    // Sidebar Toggle for Mobile
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', function (event) {
        if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(event.target) && toggleSidebarBtn && !toggleSidebarBtn.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Auto-highlight active navigation link
    const path = window.location.pathname;
    const page = path.split("/").pop() || "dashboard.html";
    
    const navLinks = document.querySelectorAll("#sidebar .nav-link");
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === page || (page === "" && href === "dashboard.html")) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Theme Switcher Initialization
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
    } else {
        document.body.classList.remove("dark-theme");
    }

    // Font Size Initialization
    const savedFontSize = localStorage.getItem("system-font-size") || "md";
    document.documentElement.classList.remove("font-sz-sm", "font-sz-md", "font-sz-lg");
    document.documentElement.classList.add(`font-sz-${savedFontSize}`);

    // Dynamically Inject Theme Toggler in the Header
    const headerRight = document.querySelector(".main-header .d-flex.align-items-center.gap-3");
    if (headerRight) {
        const themeToggler = document.createElement("div");
        themeToggler.className = "position-relative cursor-pointer me-2";
        themeToggler.id = "themeToggler";
        themeToggler.title = "Toggle Theme";
        
        const isDark = document.body.classList.contains("dark-theme");
        themeToggler.innerHTML = `<i class="bi ${isDark ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-secondary'} fs-5"></i>`;
        
        headerRight.insertBefore(themeToggler, headerRight.firstChild);
        
        themeToggler.addEventListener("click", function() {
            const currentTheme = localStorage.getItem("theme") || "light";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            window.toggleSystemTheme(newTheme);
            
            const icon = themeToggler.querySelector("i");
            if (newTheme === "dark") {
                icon.className = "bi bi-sun-fill text-warning fs-5";
            } else {
                icon.className = "bi bi-moon-stars-fill text-secondary fs-5";
            }
            
            // Sync theme select dropdown on Settings page if present
            const settingsThemeSelect = document.getElementById("settingsThemeSelect");
            if (settingsThemeSelect) {
                settingsThemeSelect.value = newTheme;
            }
        });
    }

    // Dynamically Inject Admin Profile Dropdown Menu
    const profileContainer = document.querySelector(".main-header .border-start.ps-3");
    if (profileContainer) {
        profileContainer.classList.add("cursor-pointer");
        const parent = profileContainer.parentElement;
        
        // Wrap profile block in relative container
        const wrapper = document.createElement("div");
        wrapper.className = "profile-dropdown-container d-flex align-items-center";
        parent.replaceChild(wrapper, profileContainer);
        wrapper.appendChild(profileContainer);
        
        // Create dropdown menu
        const dropdownMenu = document.createElement("div");
        dropdownMenu.className = "profile-dropdown-menu";
        dropdownMenu.innerHTML = `
            <a href="settings.html" class="profile-dropdown-item"><i class="bi bi-gear"></i> Settings</a>
            <a href="settings.html?tab=profile" class="profile-dropdown-item"><i class="bi bi-person"></i> My Profile</a>
            <a href="settings.html?tab=maintenance" class="profile-dropdown-item"><i class="bi bi-shield-check"></i> Maintenance</a>
            <hr style="margin: 0.4rem 0; border-color: rgba(0,0,0,0.08); opacity: 1;">
            <a href="#" id="profileLogoutBtn" class="profile-dropdown-item text-danger"><i class="bi bi-box-arrow-left"></i> Logout</a>
        `;
        wrapper.appendChild(dropdownMenu);
        
        // Toggle menu visibility
        profileContainer.addEventListener("click", function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle("show");
        });
        
        // Close menu on outer click
        document.addEventListener("click", function(event) {
            if (!wrapper.contains(event.target)) {
                dropdownMenu.classList.remove("show");
            }
        });
        
        // Setup logout simulation
        const logoutBtn = dropdownMenu.querySelector("#profileLogoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function(e) {
                e.preventDefault();
                if (confirm("Are you sure you want to log out of the Bright Future Admin portal?")) {
                    alert("Logout simulated successfully! Redirecting to login page...");
                    window.location.href = "index.html";
                }
            });
        }
    }

    // Setup sidebar logout simulation for all pages
    const sidebarLogouts = document.querySelectorAll(".sidebar-logout-card");
    sidebarLogouts.forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm("Are you sure you want to log out of the Bright Future Admin portal?")) {
                alert("Logout simulated successfully! Redirecting to login page...");
                window.location.href = "index.html";
            }
        });
    });

    // Inject slideout panel structures if not present
    if (!document.getElementById("slideoutOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "slideoutOverlay";
        overlay.className = "slideout-overlay";
        document.body.appendChild(overlay);
        overlay.addEventListener("click", hideDrilldown);
    }

    if (!document.getElementById("slideoutPanel")) {
        const panel = document.createElement("div");
        panel.id = "slideoutPanel";
        panel.className = "slideout-panel";
        document.body.appendChild(panel);
    }

    // Connect page search bars
    const pageSearchInput = document.querySelector(".search-bar input");
    if (pageSearchInput) {
        pageSearchInput.addEventListener("keyup", function (e) {
            const query = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll(".table-custom tbody tr");
            tableRows.forEach(row => {
                const text = row.innerText.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            });
        });
    }

    // Dynamically Inject Header Notifications Dropdown
    const bellIcon = document.querySelector(".main-header .bi-bell");
    if (bellIcon) {
        const bellContainer = bellIcon.closest(".position-relative");
        if (bellContainer) {
            bellContainer.classList.add("hdr-dropdown-container");
            
            const notifMenu = document.createElement("div");
            notifMenu.className = "hdr-dropdown-menu";
            notifMenu.innerHTML = `
                <div class="hdr-dropdown-header">
                    <span>Notifications</span>
                    <span class="badge bg-danger rounded-pill">5 New</span>
                </div>
                <a href="students.html" class="hdr-dropdown-item">
                    <div class="hdr-dropdown-icon bg-success text-white"><i class="bi bi-person-plus-fill"></i></div>
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">New Student Admission</div>
                        <div class="text-muted">Sarah Jenkins was admitted to Class X-A.</div>
                        <div class="hdr-dropdown-time">10 mins ago</div>
                    </div>
                </a>
                <a href="fees.html" class="hdr-dropdown-item">
                    <div class="hdr-dropdown-icon bg-primary text-white"><i class="bi bi-wallet2"></i></div>
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Fee Deposit Invoiced</div>
                        <div class="text-muted">Invoice generated for Sarah Jenkins (₹18,500).</div>
                        <div class="hdr-dropdown-time">35 mins ago</div>
                    </div>
                </a>
                <a href="notice-board.html" class="hdr-dropdown-item">
                    <div class="hdr-dropdown-icon bg-warning text-dark"><i class="bi bi-megaphone-fill"></i></div>
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Exam Notice Published</div>
                        <div class="text-muted">Mid-term date sheet updated by Admin.</div>
                        <div class="hdr-dropdown-time">Today, 09:12 AM</div>
                    </div>
                </a>
                <a href="notice-board.html" class="hdr-dropdown-item">
                    <div class="hdr-dropdown-icon bg-danger text-white"><i class="bi bi-exclamation-triangle-fill"></i></div>
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Emergency Alert Notice</div>
                        <div class="text-muted">Severe weather holiday alert warning removed.</div>
                        <div class="hdr-dropdown-time">Yesterday, 04:22 PM</div>
                    </div>
                </a>
                <a href="settings.html?tab=maintenance" class="hdr-dropdown-item">
                    <div class="hdr-dropdown-icon bg-secondary text-white"><i class="bi bi-gear-fill"></i></div>
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">System Configurations</div>
                        <div class="text-muted">Theme and system defaults adjusted.</div>
                        <div class="hdr-dropdown-time">Just now</div>
                    </div>
                </a>
            `;
            bellContainer.appendChild(notifMenu);
            
            bellContainer.addEventListener("click", function(e) {
                e.stopPropagation();
                document.querySelectorAll(".hdr-dropdown-menu, .profile-dropdown-menu").forEach(menu => {
                    if (menu !== notifMenu) menu.classList.remove("show");
                });
                notifMenu.classList.toggle("show");
            });
        }
    }

    // Dynamically Inject Header Messages Dropdown
    const chatIcon = document.querySelector(".main-header .bi-chat-dots");
    if (chatIcon) {
        const chatContainer = chatIcon.closest(".position-relative");
        if (chatContainer) {
            chatContainer.classList.add("hdr-dropdown-container");
            
            const chatMenu = document.createElement("div");
            chatMenu.className = "hdr-dropdown-menu";
            chatMenu.innerHTML = `
                <div class="hdr-dropdown-header">
                    <span>Recent Messages</span>
                    <span class="badge bg-primary rounded-pill">3 New</span>
                </div>
                <a href="#" class="hdr-dropdown-item msg-item" data-sender="Principal" data-body="Please upload the Class X Mid-term schedule immediately so parents can access it.">
                    <img src="https://i.pravatar.cc/150?u=principal" class="hdr-dropdown-icon avatar m-0" alt="">
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Principal (Dr. Alok)</div>
                        <div class="text-muted text-truncate" style="max-width: 200px;">Please upload the Class X schedule...</div>
                        <div class="hdr-dropdown-time">5 mins ago</div>
                    </div>
                </a>
                <a href="#" class="hdr-dropdown-item msg-item" data-sender="Sarah Jenkins (Parent)" data-body="Hello, I received the SMS about the mid-term progress card. Could you check if my contact number is correct? Thank you.">
                    <img src="https://i.pravatar.cc/150?u=parent" class="hdr-dropdown-icon avatar m-0" alt="">
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Sarah Jenkins (Parent)</div>
                        <div class="text-muted text-truncate" style="max-width: 200px;">Hello, I received the SMS about...</div>
                        <div class="hdr-dropdown-time">2 hours ago</div>
                    </div>
                </a>
                <a href="#" class="hdr-dropdown-item msg-item" data-sender="Librarian (Mr. Das)" data-body="Three library books are overdue from Class IX. Let me know if we can send auto-SMS alerts.">
                    <img src="https://i.pravatar.cc/150?u=librarian" class="hdr-dropdown-icon avatar m-0" alt="">
                    <div class="hdr-dropdown-details">
                        <div class="fw-bold text-dark-theme-override">Librarian (Mr. Das)</div>
                        <div class="text-muted text-truncate" style="max-width: 200px;">Three library books are overdue...</div>
                        <div class="hdr-dropdown-time">Yesterday</div>
                    </div>
                </a>
            `;
            chatContainer.appendChild(chatMenu);
            
            chatContainer.addEventListener("click", function(e) {
                e.stopPropagation();
                document.querySelectorAll(".hdr-dropdown-menu, .profile-dropdown-menu").forEach(menu => {
                    if (menu !== chatMenu) menu.classList.remove("show");
                });
                chatMenu.classList.toggle("show");
            });
            
            chatMenu.querySelectorAll(".msg-item").forEach(item => {
                item.addEventListener("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    chatMenu.classList.remove("show");
                    const sender = this.getAttribute("data-sender");
                    const body = this.getAttribute("data-body");
                    
                    if (window.showDrilldown) {
                        window.showDrilldown(`Message from ${sender}`, `
                            <div class="card p-3 border-0 bg-light mb-3">
                                <p class="mb-0 text-dark small" style="white-space: pre-wrap;">"${body}"</p>
                            </div>
                            <div class="col-12 mt-3">
                                <label class="form-label small fw-semibold text-muted">Quick Reply</label>
                                <textarea class="form-control" rows="3" placeholder="Type your reply to ${sender}..."></textarea>
                                <button class="btn btn-sm btn-primary mt-2 float-end btn-primary-custom" onclick="alert('Reply sent successfully!'); hideDrilldown();">Send Reply</button>
                            </div>
                        `);
                    } else {
                        alert(`Message from ${sender}:\n\n"${body}"`);
                    }
                });
            });
        }
    }

    // Close all dropdowns on outer click
    document.addEventListener("click", function(event) {
        document.querySelectorAll(".hdr-dropdown-menu").forEach(menu => {
            if (!menu.parentElement.contains(event.target)) {
                menu.classList.remove("show");
            }
        });
    });

    // Handle tab direct links from query params (e.g. settings.html?tab=profile)
    const urlParams = new URLSearchParams(window.location.search);
    const tabName = urlParams.get('tab');
    if (tabName) {
        const tabTrigger = document.querySelector(`.settings-nav-pills .nav-link[data-tab-target="${tabName}"]`);
        if (tabTrigger) {
            // Click the tab trigger to switch tab
            tabTrigger.click();
        }
    }
});

// Reusable Drilldown panel handlers
window.showDrilldown = function (titleHtml, bodyContentHtml) {
    const panel = document.getElementById("slideoutPanel");
    const overlay = document.getElementById("slideoutOverlay");
    if (panel && overlay) {
        panel.innerHTML = `
            <div class="slideout-header">
                <h5 class="fw-bold mb-0">${titleHtml}</h5>
                <button class="slideout-close" onclick="hideDrilldown()"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="slideout-body">
                ${bodyContentHtml}
            </div>
        `;
        panel.classList.add("active");
        overlay.classList.add("active");
    }
};

window.hideDrilldown = function () {
    const panel = document.getElementById("slideoutPanel");
    const overlay = document.getElementById("slideoutOverlay");
    if (panel && overlay) {
        panel.classList.remove("active");
        overlay.classList.remove("active");
    }
};

// Toggle Theme programmatically
window.toggleSystemTheme = function (themeMode) {
    if (themeMode === "dark") {
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");
    }
};

// Update System Font Size scale dynamically
window.updateSystemFontSize = function(size) {
    document.documentElement.classList.remove("font-sz-sm", "font-sz-md", "font-sz-lg");
    document.documentElement.classList.add(`font-sz-${size}`);
    localStorage.setItem("system-font-size", size);
};
