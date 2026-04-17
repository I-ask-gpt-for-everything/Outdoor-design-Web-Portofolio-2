const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const cursorDot = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const heroBg = document.getElementById('hero-bg-image');

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

function renderGroup(groupId, images, sectionId, label) {
    const container = document.getElementById(groupId);
    const section = document.getElementById(sectionId);

    if (!container || !section) {
        return;
    }

    if (!images.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    images.forEach((image, index) => {
        const card = document.createElement('article');
        card.className = 'project-card scroll-reveal';
        card.innerHTML = `<img src="${image.path}" alt="${label} image ${index + 1}" loading="lazy">`;
        container.appendChild(card);
    });

    bindCursorHover(container);
}

function loadProjectPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const project = getProjectById(projectId);

    const titleElement = document.getElementById('project-title');
    const categoryElement = document.getElementById('project-category');
    const descriptionElement = document.getElementById('project-description');

    if (!project || !titleElement || !categoryElement || !descriptionElement) {
        document.title = 'Project Not Found | Outdoor Design Portfolio';
        if (descriptionElement) {
            descriptionElement.textContent = 'Project not found. Please return to the portfolio overview.';
        }
        const timelineContainer = document.getElementById('timeline-container');
        if (timelineContainer) {
            timelineContainer.style.display = 'none';
        }
        return;
    }

    titleElement.textContent = project.title;
    categoryElement.textContent = project.category;
    descriptionElement.textContent = project.description;
    document.title = `${project.title} | Outdoor Design Portfolio`;

    const timeline = getProjectTimeline(project);
    const heroImage =
        timeline.after[0]?.path ||
        timeline.process[timeline.process.length - 1]?.path ||
        timeline.before[0]?.path ||
        project.coverImage;

    if (heroBg) {
        heroBg.style.backgroundImage = `url('${heroImage}')`;
    }

    renderGroup('before-gallery', timeline.before, 'before-section', `${project.title} before`);
    renderGroup('process-gallery', timeline.process, 'process-section', `${project.title} process`);
    renderGroup('after-gallery', timeline.after, 'after-section', `${project.title} after`);

    scrollRevealSetup();
}

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (heroBg && scrollY < window.innerHeight) {
        heroBg.style.transform = `translateY(${scrollY * 0.28}px) scale(1.05)`;
    }

    scrollRevealSetup();
});

loadProjectPage();
scrollRevealSetup();
