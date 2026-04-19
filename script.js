const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const heroBg = document.querySelector('.hero-bg');
const gallery = document.getElementById('gallery');

function setCursorState(isActive) {
    if (!supportsFinePointer || !cursorOutline) {
        return;
    }

    cursorOutline.style.transform = isActive ? 'translate(-50%, -50%) scale(1.4)' : 'translate(-50%, -50%) scale(1)';
    cursorOutline.style.backgroundColor = isActive ? 'rgba(45, 206, 137, 0.14)' : 'transparent';
}

function bindCursorHover(root = document) {
    if (!supportsFinePointer) {
        return;
    }

    root.querySelectorAll('a, button, .project-card').forEach((element) => {
        if (element.dataset.cursorBound === 'true') {
            return;
        }

        element.dataset.cursorBound = 'true';
        element.addEventListener('mouseenter', () => setCursorState(true));
        element.addEventListener('mouseleave', () => setCursorState(false));
    });
}

if (supportsFinePointer && cursorDot && cursorOutline) {
    window.addEventListener('mousemove', (event) => {
        const posX = event.clientX;
        const posY = event.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate(
            {
                left: `${posX}px`,
                top: `${posY}px`
            },
            { duration: 350, fill: 'forwards' }
        );
    });

    bindCursorHover();
}

function closeNavMenu() {
    if (!navToggle || !navMenu) {
        return;
    }

    navToggle.setAttribute('aria-expanded', 'false');
    navMenu.classList.remove('is-open');
    document.body.classList.remove('nav-open');
}

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('nav-open', isOpen);
    });

    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => closeNavMenu());
    });
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
        closeNavMenu();
    }
});

function scrollRevealSetup() {
    const windowHeight = window.innerHeight;
    const revealPoint = 140;

    document.querySelectorAll('.scroll-reveal').forEach((element) => {
        const revealTop = element.getBoundingClientRect().top;
        if (revealTop < windowHeight - revealPoint) {
            element.classList.add('visible');
        }
    });
}

function handleScroll() {
    const scrollY = window.scrollY;

    if (navbar) {
        navbar.classList.toggle('scrolled', scrollY > 50);
    }

    if (heroBg && scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.28}px) scale(1.05)`;
    }

    scrollRevealSetup();
}

function getHomepageProjects(filterType) {
    const projects = getProjectsByType(filterType).slice();
    return projects.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'photo' ? -1 : 1;
        }

        return a.location.localeCompare(b.location);
    });
}

function renderGallery(filterType) {
    if (!gallery) {
        return;
    }

    const projects = getHomepageProjects(filterType);
    gallery.innerHTML = '';

    projects.forEach((project) => {
        const timeline = getProjectTimeline(project);
        const derivedCover =
            timeline.after[0]?.path ||
            timeline.process[timeline.process.length - 1]?.path ||
            timeline.before[0]?.path ||
            project.coverImage;

        const wrapper = document.createElement('a');
        wrapper.href = `project.html?id=${encodeURIComponent(project.id)}`;
        wrapper.className = 'portfolio-item-link';

        const card = document.createElement('article');
        card.className = 'project-card scroll-reveal';
        card.innerHTML = `
            <img src="${derivedCover}" alt="${project.title}" loading="lazy">
            <div class="project-overlay">
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p>${project.category}</p>
                </div>
            </div>
        `;

        wrapper.appendChild(card);
        gallery.appendChild(wrapper);
    });

    bindCursorHover(gallery);
    scrollRevealSetup();
}

renderGallery('all');

document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
        document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        renderGallery(event.currentTarget.dataset.filter);
    });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function handleAnchorClick(event) {
        const targetSelector = this.getAttribute('href');
        const target = document.querySelector(targetSelector);
        if (!target) {
            return;
        }

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    });
});

window.addEventListener('scroll', handleScroll);
scrollRevealSetup();
handleScroll();

// --- LEAFLET MAP LOGIC ---
function initMap() {
    const mapContainer = document.getElementById('project-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // Center roughly around Attica (Athens)
    const map = L.map('project-map', {
        zoomControl: false,
        scrollWheelZoom: false // Keep scrolling smooth for the page
    }).setView([37.9, 23.75], 9);

    // Add zoom controls to the bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // CartoDB Dark Matter URL
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Custom pulse icon styling
    const customIcon = L.divIcon({
        className: 'custom-map-icon',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10]
    });

    const bounds = [];

    // Loop through global portfolioProjects and place markers
    if (window.portfolioProjects) {
        window.portfolioProjects.forEach(project => {
            if (project.coords && project.coords.length === 2) {
                const marker = L.marker(project.coords, { icon: customIcon }).addTo(map);
                bounds.push(project.coords);

                // Build Popup Content
                const timeline = getProjectTimeline ? getProjectTimeline(project) : { after: [], process: [], before: [] };
                const dtImage = timeline.after[0]?.path || project.coverImage;
                
                const popupHTML = 
                    <div style="text-align:center;">
                        <h4>\</h4>
                        <p>\</p>
                        <a href="project.html?id=\" class="map-btn">View Case Study</a>
                    </div>
                ;

                marker.bindPopup(popupHTML);
            }
        });
    }

    // Fit map bounds to show all markers
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
}

// Initialize map on load
document.addEventListener('DOMContentLoaded', initMap);

