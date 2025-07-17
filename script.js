// ======================
// MAIN APPLICATION CODE
// ======================

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load saved skills and settings
    loadSkills();
    checkDarkModePreference();
    setupEventListeners();
});

// ======================
// CORE FUNCTIONALITY
// ======================

// Add new skill to the portal
function addSkill(event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name').value.trim();
    const offer = document.getElementById('offer').value.trim();
    const want = document.getElementById('want').value.trim();
    const email = document.getElementById('email').value.trim();
    const category = document.getElementById('category').value;

    // Validate inputs
    if (!validateInputs(name, offer, want, email)) return;

    // Create and display skill card
    createSkillCard(name, offer, want, email, category);

    // Save skills and reset form
    saveSkills();
    document.getElementById('skillForm').reset();
}

// Search through skills
function performSearch() {
    const query = document.getElementById('searchSkill').value.trim().toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const cards = document.querySelectorAll('#skillCards > div');
    let matchFound = false;

    cards.forEach(card => {
        const teach = card.dataset.teach || '';
        const want = card.dataset.want || '';
        const cardCategory = card.dataset.category || '';

        // Check if card matches search criteria
        const matchesSearch = query === '' || teach.includes(query) || want.includes(query);
        const matchesCategory = categoryFilter === 'all' || cardCategory === categoryFilter;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
            matchFound = true;
        } else {
            card.style.display = 'none';
        }
    });

    // Show/hide "no matches" message
    toggleNoMatchesMessage(matchFound, query);
}

// ======================
// SKILL CARD MANAGEMENT
// ======================

// Create a new skill card element
function createSkillCard(name, offer, want, email, category) {
    const card = document.createElement('div');
    card.className = "bg-white dark:bg-gray-800 p-4 rounded-lg shadow border dark:border-gray-700 relative";
    
    // Store searchable data
    card.dataset.teach = offer.toLowerCase();
    card.dataset.want = want.toLowerCase();
    card.dataset.category = category;
    
    // Build card HTML
    card.innerHTML = `
        ${isVerifiedUser(email) ? '<span class="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-100">Verified</span>' : ''}
        <h2 class="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">${name}</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300 canTeach"><strong>Can Teach:</strong> ${offer}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300 wantsHelp"><strong>Wants Help In:</strong> ${want}</p>
        <p class="text-sm text-gray-600 dark:text-gray-300"><strong>Email:</strong> ${email}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400"><strong>Category:</strong> ${formatCategory(category)}</p>
        <div class="mt-2 flex items-center">
            <div class="rating-stars" data-rating="0">
                <span class="star" data-value="1">☆</span>
                <span class="star" data-value="2">☆</span>
                <span class="star" data-value="3">☆</span>
            </div>
            <span class="rating-count text-sm text-gray-500 dark:text-gray-400 ml-1">(0)</span>
        </div>
        <a href="mailto:${email}" class="text-blue-500 dark:text-blue-400 underline text-sm block mt-2">Send Email</a>
        <button onclick="this.parentElement.remove(); saveSkills()" class="absolute top-2 right-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl">×</button>
    `;

    document.getElementById('skillCards').appendChild(card);
    setupRatingStars(card);
}

// ======================
// DATA PERSISTENCE
// ======================

// Save all skills to localStorage
function saveSkills() {
    const skills = [];
    document.querySelectorAll('#skillCards > div').forEach(card => {
        skills.push({
            name: card.querySelector('h2').textContent,
            offer: card.querySelector('.canTeach').textContent.replace('Can Teach: ', ''),
            want: card.querySelector('.wantsHelp').textContent.replace('Wants Help In: ', ''),
            email: card.querySelector('p:nth-of-type(3)').textContent.replace('Email: ', ''),
            category: card.dataset.category,
            rating: parseInt(card.querySelector('.rating-stars').dataset.rating),
            ratingCount: parseInt(card.querySelector('.rating-count').textContent.match(/\d+/)[0])
        });
    });
    localStorage.setItem('skills', JSON.stringify(skills));
}

// Load skills from localStorage
function loadSkills() {
    const savedSkills = JSON.parse(localStorage.getItem('skills')) || [];
    savedSkills.forEach(skill => {
        createSkillCard(skill.name, skill.offer, skill.want, skill.email, skill.category);
        
        // Set rating if it exists
        const cards = document.querySelectorAll('#skillCards > div');
        const lastCard = cards[cards.length - 1];
        if (skill.rating && skill.ratingCount) {
            lastCard.querySelector('.rating-stars').dataset.rating = skill.rating;
            lastCard.querySelector('.rating-count').textContent = `(${skill.ratingCount})`;
            updateStarDisplay(lastCard, skill.rating);
        }
    });
}

// ======================
// ADDITIONAL FEATURES
// ======================

// Dark mode functionality
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    document.getElementById('darkModeToggle').textContent = 
        document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
}

// Check for saved dark mode preference
function checkDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

// Export skills to JSON file
function exportSkills() {
    const skills = JSON.parse(localStorage.getItem('skills')) || [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skills, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'skills_export.json');
    downloadAnchor.click();
}

// Import skills from JSON file
function importSkills(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const skills = JSON.parse(e.target.result);
            if (Array.isArray(skills)) {
                // Clear current skills
                document.getElementById('skillCards').innerHTML = '';
                // Save and load new skills
                localStorage.setItem('skills', JSON.stringify(skills));
                loadSkills();
                alert(`${skills.length} skills imported successfully!`);
            } else {
                alert('Invalid file format. Expected an array of skills.');
            }
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Rating system for skills
function setupRatingStars(card) {
    const stars = card.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const container = this.parentElement;
            const rating = parseInt(this.dataset.value);
            const ratingCount = container.nextElementSibling;
            
            // Update rating display
            container.dataset.rating = rating;
            const currentCount = parseInt(ratingCount.textContent.match(/\d+/)[0]);
            ratingCount.textContent = `(${currentCount + 1})`;
            
            // Update star display
            updateStarDisplay(card, rating);
            
            // Save updated skills
            saveSkills();
        });
    });
}

// Update star display based on rating
function updateStarDisplay(card, rating) {
    const stars = card.querySelectorAll('.star');
    stars.forEach(star => {
        const value = parseInt(star.dataset.value);
        star.textContent = value <= rating ? '★' : '☆';
        star.className = value <= rating ? 'star text-yellow-500' : 'star text-yellow-300';
    });
}

// ======================
// HELPER FUNCTIONS
// ======================

// Validate form inputs
function validateInputs(name, offer, want, email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !offer || !want || !email) {
        alert("Please fill in all fields.");
        return false;
    }

    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    return true;
}

// Check if user is verified (simple example)
function isVerifiedUser(email) {
    return email.endsWith('.edu') || email.endsWith('.ac.uk');
}

// Format category for display
function formatCategory(category) {
    const categories = {
        programming: 'Programming',
        design: 'Design',
        language: 'Language',
        music: 'Music',
        other: 'Other'
    };
    return categories[category] || 'Other';
}

// Toggle "no matches" message
function toggleNoMatchesMessage(matchFound, query) {
    const noMatchMsgId = "noMatchMessage";
    let existingMsg = document.getElementById(noMatchMsgId);

    if (!matchFound && query !== '') {
        if (!existingMsg) {
            const msg = document.createElement("p");
            msg.id = noMatchMsgId;
            msg.className = "text-center text-gray-500 dark:text-gray-400 mt-4 col-span-full";
            msg.textContent = "No matching skills found.";
            document.getElementById("skillCards").appendChild(msg);
        }
    } else if (existingMsg) {
        existingMsg.remove();
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('skillForm').addEventListener('submit', addSkill);
    
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchSkill').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('categoryFilter').addEventListener('change', performSearch);
    
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Export/import functionality
    document.getElementById('exportBtn').addEventListener('click', exportSkills);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importSkills);
    
    // Clear search button
    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('searchSkill').value = '';
        document.getElementById('categoryFilter').value = 'all';
        performSearch();
    });
}

// Initial search to display all cards
performSearch();