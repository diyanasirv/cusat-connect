// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCY7QcrbnkQmMWfbmion01PAsu5_s5GUrM",
    authDomain: "cusat-connect-50e90.firebaseapp.com",
    projectId: "cusat-connect-50e90",
    storageBucket: "cusat-connect-50e90.firebasestorage.app",
    messagingSenderId: "255437667135",
    appId: "1:255437667135:web:5c0c6216744679c101718a"
};
firebase.initializeApp(firebaseConfig);

// Airtable Configuration
const AIRTABLE_PAT = 'pate5r7JSDV1BfXJR.cbe81f76c73b71ce8b399b2d71426cb7e0f89df7fefc4b8f9e2c97190381e191';
const AIRTABLE_BASE_ID = 'appAN1TbPo89WT3mA';
const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

// DOM Elements
const notesList = document.getElementById('notesList');
const searchBar = document.getElementById('searchBar');

// State
let userDepartment = null;
let allNotes = [];

// Fetch Data from Airtable
async function fetchFromAirtable(table, filter = '', offset = null) {
    let url = `${BASE_URL}/${table}${filter ? `?filterByFormula=${filter}` : ''}`;
    if (offset) url += `&offset=${offset}`;
    const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
    });
    return { records: response.data.records, offset: response.data.offset };
}

// Fetch User Department
async function fetchUserDepartment(uid) {
    try {
        const { records } = await fetchFromAirtable('Users', `{UID}="${uid}"`);
        if (records.length && records[0].fields.Department) {
            userDepartment = records[0].fields.Department;
            await fetchNotes();
        } else {
            notesList.innerHTML = '<p class="error-message">User or department not found.</p>';
        }
    } catch (error) {
        notesList.innerHTML = '<p class="error-message">Error loading user data.</p>';
        console.error('Fetch user error:', error);
    }
}

// Fetch Notes
async function fetchNotes() {
    try {
        const { records, offset } = await fetchFromAirtable('Notes', `{Department}="${userDepartment}"`);
        allNotes = records.map(record => ({
            name: record.fields.Name || 'Unnamed Note',
            fileUrl: record.fields.Notes && record.fields.Notes[0] ? record.fields.Notes[0].url : null,
            department: record.fields.Department || 'Unknown'
        }));
        if (offset) {
            const moreNotes = await fetchFromAirtable('Notes', `{Department}="${userDepartment}"`, offset);
            allNotes = allNotes.concat(moreNotes.records.map(record => ({
                name: record.fields.Name || 'Unnamed Note',
                fileUrl: record.fields.Notes && record.fields.Notes[0] ? record.fields.Notes[0].url : null,
                department: record.fields.Department || 'Unknown'
            })));
        }
        renderNotes(allNotes);
    } catch (error) {
        notesList.innerHTML = '<p class="error-message">Error loading notes.</p>';
        console.error('Fetch notes error:', error);
    }
}

// Render Notes
function renderNotes(notes) {
    notesList.innerHTML = notes.length ? notes.map(note => `
        <div class="notes-item">
            <div>
                <span class="notes-name">${note.name}</span>
                <div class="notes-department">Department: ${note.department}</div>
            </div>
            ${note.fileUrl ? `<button class="download-button" onclick="window.open('${note.fileUrl}', '_blank')">Download</button>` : '<p class="error-message">No PDF</p>'}
        </div>
    `).join('') : '<p class="error-message">No notes found.</p>';
}

// Search Notes
searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filteredNotes = allNotes.filter(note => 
        note.name.toLowerCase().includes(query)
    );
    renderNotes(query ? filteredNotes : allNotes);
});

// Firebase Auth Check
firebase.auth().onAuthStateChanged(user => {
    const uid = sessionStorage.getItem('uid');
    if (user && uid) {
        fetchUserDepartment(uid); // Load notes if authenticated and UID exists
    } else if (!user && !uid) {
        window.location.href = 'login.html'; // Redirect only if explicitly unauthenticated
    }
    // Do nothing if auth state is still loading or UID is present but user is null
});