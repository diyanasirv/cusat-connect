// Airtable configuration
const AIRTABLE_PAT = 'pat1f9IBdZOK9PU69.b407e0b96b16eff00333e04799ad4e40ba1356052be08336eb51591a3af02902';
const AIRTABLE_BASE_ID = 'appAN1TbPo89WT3mA';
const AIRTABLE_EVENTS_TABLE = 'Events';
const AIRTABLE_USERS_TABLE = 'Users';

// User data object
let user = {
    skills: [],
    interests: [],
    aspire: [],
    careerGoal: ''
};

let aiToggled = false;
let eventsData = []; // Store events globally to avoid refetching

// Fetch user profile from Airtable
async function loadUserProfile(uid) {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_USERS_TABLE}?filterByFormula={UID}="${uid}"`,
            { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } }
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        if (data.records.length > 0) {
            const record = data.records[0].fields;
            user = {
                name: record.Name || 'N/A',
                semester: record.Semester || 'N/A',
                department: record.Department || 'N/A',
                skills: record.Skills ? record.Skills.split(', ') : [],
                interests: record.Interests ? record.Interests.split(', ') : [],
                aspire: record.Passion ? [record.Passion] : [],
                careerGoal: record.Passion || ''
            };
            updateUserCard();
            updateProfileModal();
        } else {
            throw new Error('No user record found');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        updateUserCardWithError('Failed to load profile');
        updateProfileModalWithError('Failed to load profile');
    }
}

// Update user card
function updateUserCard() {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-details').textContent = `${user.department}, Semester ${user.semester}`;
    document.getElementById('skillsList').innerHTML = user.skills.length ? user.skills.map(skill => `<span>${skill}</span>`).join('') : '<span>No skills</span>';
    document.getElementById('interestsList').innerHTML = user.interests.length ? user.interests.map(interest => `<span>${interest}</span>`).join('') : '<span>No interests</span>';
    document.getElementById('aspireList').innerHTML = user.aspire.length ? user.aspire.map(aspire => `<span>${aspire}</span>`).join('') : '<span>No aspiration</span>';
}

function updateUserCardWithError(message) {
    document.getElementById('user-name').textContent = message;
    document.getElementById('user-details').textContent = '';
    document.getElementById('skillsList').innerHTML = '';
    document.getElementById('interestsList').innerHTML = '';
    document.getElementById('aspireList').innerHTML = '';
}

// Fetch events from Airtable
async function fetchEventsFromAirtable() {
    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_EVENTS_TABLE}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } }
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        eventsData = data.records.map(record => ({
            name: record.fields.Name || 'Untitled Event',
            date: record.fields.Date || 'No Date',
            keywords: record.fields.keywords ? (Array.isArray(record.fields.keywords) ? record.fields.keywords : record.fields.keywords.split(',')) : [],
            image: record.fields.Image && record.fields.Image[0] ? record.fields.Image[0].url : 'https://via.placeholder.com/300x140',
            link: record.fields.Link || '#'
        }));
        renderEvents();
        updateCategoryFilter();
    } catch (error) {
        console.error('Error fetching Airtable data:', error);
        document.getElementById("eventGrid").innerHTML = '<p>Failed to load events. Please try again later.</p>';
    }
}

// Render events
function renderEvents() {
    const eventGrid = document.getElementById("eventGrid");
    eventGrid.innerHTML = '';
    eventsData.forEach(event => {
        const eventCard = `
            <div class="event-card visible" data-category="${event.keywords.join(' ').toLowerCase()}">
                <img class="event-image" src="${event.image}" alt="${event.name}">
                <div class="event-content">
                    <h3 class="event-title">${event.name}</h3>
                    <div class="event-date"><i class="fas fa-calendar-alt"></i>${event.date}</div>
                    <div class="event-keywords">
                        ${event.keywords.map(keyword => `<span>${keyword.trim()}</span>`).join('')}
                    </div>
                    <a href="${event.link}" target="_blank" class="know-more">Know More</a>
                </div>
            </div>
        `;
        eventGrid.innerHTML += eventCard;
    });
}

// Update category filter dynamically
function updateCategoryFilter() {
    const categoryFilter = document.getElementById("categoryFilter");
    const allKeywords = new Set();
    eventsData.forEach(event => {
        event.keywords.forEach(keyword => allKeywords.add(keyword.trim().toLowerCase()));
    });

    categoryFilter.innerHTML = `<li data-category="all" class="active" tabindex="0" aria-label="All Categories">All</li>`;
    allKeywords.forEach(keyword => {
        categoryFilter.innerHTML += `<li data-category="${keyword}" tabindex="0" aria-label="${keyword} Category">${keyword.charAt(0).toUpperCase() + keyword.slice(1)}</li>`;
    });
}

// Tab highlight function
function updateTabHighlight() {
    const activeTab = document.querySelector(".tabs div.active");
    const highlight = document.querySelector(".tabs .highlight");
    highlight.style.width = `${activeTab.offsetWidth}px`;
    highlight.style.left = `${activeTab.offsetLeft}px`;
}

window.addEventListener("resize", updateTabHighlight);

// Filter events based on search input
function filterEvents() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const eventCards = document.querySelectorAll(".event-card");

    eventCards.forEach(card => {
        const title = card.querySelector(".event-title").textContent.toLowerCase();
        const keywords = card.querySelector(".event-keywords").textContent.toLowerCase();

        if (title.includes(searchValue) || keywords.includes(searchValue)) {
            card.style.display = "flex";
            card.classList.add("visible");
        } else {
            card.style.display = "none";
            card.classList.remove("visible");
        }
    });
}

const debouncedFilterEvents = debounce(filterEvents, 300);

// Category filter click handler
document.getElementById("categoryFilter").addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        const category = e.target.getAttribute("data-category");
        const eventCards = document.querySelectorAll(".event-card");

        document.querySelectorAll("#categoryFilter li").forEach(li => li.classList.remove("active"));
        e.target.classList.add("active");

        eventCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            if (category === "all" || cardCategory.includes(category)) {
                card.style.display = "flex";
                card.classList.add("visible");
            } else {
                card.style.display = "none";
                card.classList.remove("visible");
            }
        });

        if (aiToggled) untoggleAI();
    }
});

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll(".tabs div").forEach(tab => tab.classList.remove("active"));
    document.querySelector(`.tabs div[onclick="switchTab('${tab}')"]`).classList.add("active");
    updateTabHighlight();

    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    document.getElementById(`${tab}Tab`).classList.add("active");

    if (tab === "events" && eventsData.length > 0) {
        renderEvents(); // Re-render events instead of using cached HTML
    }
}

// Accessibility for tabs
document.querySelectorAll(".tabs div").forEach(item => {
    item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") item.click();
    });
});

// AI personalization
function personalizeSuggestions() {
    const eventCards = document.querySelectorAll(".event-card");
    eventCards.forEach(card => {
        const keywords = card.querySelector(".event-keywords").textContent.toLowerCase();
        const skillMatch = user.skills.some(skill => keywords.includes(skill.toLowerCase()));
        const goalMatch = keywords.includes(user.careerGoal.toLowerCase());

        if (skillMatch || goalMatch) {
            card.style.opacity = "1";
            card.style.border = "2px solid #1e3a8a";
        } else {
            card.style.opacity = "0.5";
            card.style.border = "none";
        }
    });
}

function toggleAIPersonalization() {
    const aiButton = document.getElementById("aiButton");
    if (!aiToggled) {
        personalizeSuggestions();
        aiButton.textContent = "Untoggle AI";
        aiButton.classList.add("toggled");
        aiToggled = true;
    } else {
        untoggleAI();
    }
}

function untoggleAI() {
    const eventCards = document.querySelectorAll(".event-card");
    eventCards.forEach(card => {
        card.style.opacity = "1";
        card.style.border = "none";
    });
    const aiButton = document.getElementById("aiButton");
    aiButton.textContent = "AI Personalize";
    aiButton.classList.remove("toggled");
    aiToggled = false;
}

// Modal functions
function openProfileModal() {
    document.getElementById("profileModal").style.display = "flex";
}

function closeProfileModal() {
    document.getElementById("profileModal").style.display = "none";
}

function updateProfileModal() {
    document.getElementById("profileModal-name").textContent = user.name;
    document.getElementById("profileModal-details").textContent = `${user.department}, Semester ${user.semester}`;
    document.getElementById("profileSkillsList").innerHTML = user.skills.length ? user.skills.map(skill => `<span>${skill}</span>`).join("") : '<span>No skills</span>';
    document.getElementById("profileInterestsList").innerHTML = user.interests.length ? user.interests.map(interest => `<span>${interest}</span>`).join("") : '<span>No interests</span>';
    document.getElementById("profileAspireList").innerHTML = user.aspire.length ? user.aspire.map(aspire => `<span>${aspire}</span>`).join("") : '<span>No aspiration</span>';
}

function updateProfileModalWithError(message) {
    document.getElementById("profileModal-name").textContent = message;
    document.getElementById("profileModal-details").textContent = '';
    document.getElementById("profileSkillsList").innerHTML = '';
    document.getElementById("profileInterestsList").innerHTML = '';
    document.getElementById("profileAspireList").innerHTML = '';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Modal click-to-close
document.getElementById("profileModal").addEventListener("click", function(e) {
    if (e.target === this) closeProfileModal();
});

// Remove desktop scroll behavior for search filter to avoid conflicts
// Keep mobile scroll behavior for tabs
if (window.innerWidth <= 768) {
    let lastScrollTopMobile = 0;
    window.addEventListener("scroll", function() {
        const tabs = document.getElementById("tabs");
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScrollTop > lastScrollTopMobile) {
            tabs.classList.add("hidden");
        } else {
            tabs.classList.remove("hidden");
        }
        lastScrollTopMobile = currentScrollTop <= 0 ? 0 : currentScrollTop;
    });
}