/*================ Show Sidebar ========= */
const API_BASE = 'https://portfolio-production-a8ef.up.railway.app';


/*========= SKILLS TAB ======= */
const tabs = document.querySelectorAll('[data-target]'),
      tabContent = document.querySelectorAll('[data-content]')

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const target = document.querySelector(tab.dataset.target)

        tabContent.forEach(tc => tc.classList.remove('skills_active'))
        target.classList.add('skills_active')

        tabs.forEach(t => t.classList.remove('skills_active'))
        tab.classList.add('skills_active')
    })
})

/*============== MIXITUP FILTER PORTFOLIO =========*/
// MixItUp is initialized after projects load from API

/*========== LINK ACTIVE WORK =======*/
const linkWork = document.querySelectorAll('.work_item')

function activeWork() {
    linkWork.forEach(l => l.classList.remove('active_work'))
    this.classList.add('active_work')
}

linkWork.forEach(l => l.addEventListener("click", activeWork))

/*======== Work pop-up ============== */
function togglePortfolioPopup() {
    document.querySelector(".portfolio_popup").classList.toggle("open");
}

let _slideIndex = 0;
let _slides = [];

function setSlide(i) {
    _slideIndex = i;
    document.querySelector('.pp_slides').style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll('.pp_dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
    document.querySelector('.pp_prev').classList.toggle('hidden', i === 0);
    document.querySelector('.pp_next').classList.toggle('hidden', i === _slides.length - 1);
}

function portfolioItemDetails(portfolioItem) {
    _slides = Array.from(portfolioItem.querySelectorAll('.portfolio_item-details img.details_screenshot_thumb'))
                   .map(img => img.src);

    // fallback to work_img if no screenshots
    if (!_slides.length) _slides = [portfolioItem.querySelector('.work_img').src];

    const slidesEl  = document.querySelector('.pp_slides');
    const dotsEl    = document.querySelector('.pp_dots');

    slidesEl.innerHTML = _slides.map(src =>
        `<img src="${src}" class="pp_slide" alt="">`
    ).join('');

    dotsEl.innerHTML = _slides.length > 1
        ? _slides.map((_, i) => `<button class="pp_dot ${i===0?'active':''}" data-i="${i}"></button>`).join('')
        : '';

    dotsEl.querySelectorAll('.pp_dot').forEach(d =>
        d.addEventListener('click', () => setSlide(+d.dataset.i))
    );

    document.querySelector('.portfolio_popup-subtitle span').textContent =
        portfolioItem.querySelector('.work_title').textContent;
    document.querySelector('.portfolio_popup-body').innerHTML =
        portfolioItem.querySelector('.portfolio_item-details').innerHTML;

    setSlide(0);
}

document.addEventListener("click", (e) => {
    const btn = e.target.classList.contains("work_button") ? e.target : e.target.closest(".work_button");
    if (btn) { togglePortfolioPopup(); portfolioItemDetails(btn.parentElement); }
});

document.querySelector(".portfolio_popup-close").addEventListener("click", togglePortfolioPopup);
document.querySelector(".portfolio_popup").addEventListener("click", (e) => {
    if (e.target === document.querySelector(".portfolio_popup")) togglePortfolioPopup();
});

document.querySelector('.pp_prev').addEventListener('click', () => setSlide(_slideIndex - 1));
document.querySelector('.pp_next').addEventListener('click', () => setSlide(_slideIndex + 1));

// Zoom on slide click
document.querySelector('.pp_slides').addEventListener('click', (e) => {
    if (e.target.classList.contains('pp_slide')) {
        document.getElementById('zoom-img').src = e.target.src;
        document.getElementById('zoom-overlay').classList.add('open');
    }
});
document.getElementById('zoom-close').addEventListener('click', () =>
    document.getElementById('zoom-overlay').classList.remove('open'));
document.getElementById('zoom-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('zoom-overlay'))
        document.getElementById('zoom-overlay').classList.remove('open');
});

/*============= Services Modal ============= */
const modalViews = document.querySelectorAll('.services_modal'),
      modalBtns  = document.querySelectorAll('.services_button'),
      modalClose = document.querySelectorAll('.services_modal-close')

function openModal(i) {
    modalViews[i].classList.add('active-modal')
}
function closeModal(i) {
    modalViews[i].classList.remove('active-modal')
}

modalBtns.forEach((btn, i) => btn.addEventListener('click', () => openModal(i)))
modalClose.forEach((x, i) => x.addEventListener('click', () => closeModal(i)))

// Close modal on overlay click
modalViews.forEach((modal, i) => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(i)
    })
})

/*============== CONTACT FORM =========*/
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="uil uil-spinner-alt"></i> Sending...';
        btn.disabled = true;

        const data = Object.fromEntries(new FormData(contactForm));
        try {
            const res = await fetch(`${API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            btn.innerHTML = '<i class="uil uil-check"></i> Sent!';
            contactForm.reset();
            setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 3000);
        } catch (err) {
            btn.innerHTML = '<i class="uil uil-exclamation-triangle"></i> ' + err.message;
            btn.disabled = false;
            setTimeout(() => { btn.innerHTML = original; }, 4000);
        }
    });
}
const sections = document.querySelectorAll('section[id]')

function scrollActive() {
    const scrollY = window.scrollY
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 50
        const sectionHeight = section.offsetHeight
        const sectionId = section.getAttribute('id')
        const navLink = document.querySelector(`.nav_link[href="#${sectionId}"]`)
        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active-link')
            } else {
                navLink.classList.remove('active-link')
            }
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*============== SHOW SCROLL UP ========= */
function scrollUp() {
    const scrollUpBtn = document.getElementById('scroll-up')
    if (window.scrollY >= 400) scrollUpBtn.classList.add('show-scroll')
    else scrollUpBtn.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollUp)

/*============== LOAD PROJECTS FROM API =========*/
async function loadWorkProjects() {
    const container = document.getElementById('work-container');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/projects`);
        if (!res.ok) return;
        const projects = await res.json();

        container.innerHTML = projects.map(p => {
            const thumb = p.screenshots?.[0] || 'assets/img/work-1.png';
            const date = p.created_date ? new Date(p.created_date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
            return `
            <div class="work_card mix ${p.category}">
                <img src="${thumb}" alt="${p.title}" class="work_img">
                <h3 class="work_title">${p.title}</h3>
                <span class="work_button">Demo <i class="uil uil-arrow-right work_button-icon"></i></span>
                <div class="portfolio_item-details">
                    <h3 class="details_title">${p.title}</h3>
                    ${(p.screenshots||[]).length > 1 ? `<div class="details_screenshots">${p.screenshots.map(s=>`<img src="${s}" class="details_screenshot_thumb" alt="">`).join('')}</div>` : ''}
                    <p class="details_description">${p.description || ''}</p>
                    <ul class="details_info">
                        ${date ? `<li>Created - <span>${date}</span></li>` : ''}
                        ${p.technologies ? `<li>Technologies - <span>${p.technologies}</span></li>` : ''}
                        ${p.role ? `<li>Role - <span>${p.role}</span></li>` : ''}
                        ${p.live_url ? `<li>View - <span><a href="${p.live_url}" target="_blank">${p.live_url}</a></span></li>` : ''}
                    </ul>
                </div>
            </div>`;
        }).join('');

        try { window._mixer = mixitup(container, { selectors: { target: '.work_card' }, animation: { duration: 300 } }); } catch(me) {}
    } catch (e) { console.warn('Could not load projects:', e.message); }
}
loadWorkProjects();
