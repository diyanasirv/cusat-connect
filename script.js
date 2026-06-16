// Airtable Configuration
const AIRTABLE_PAT = 'pat1f9IBdZOK9PU69.b407e0b96b16eff00333e04799ad4e40ba1356052be08336eb51591a3af02902';
const AIRTABLE_BASE_ID = 'appAN1TbPo89WT3mA';
const AIRTABLE_TABLE_NAME = 'Users';
//HI
// Google Sign-In
function continueWithGoogle() {
    if (!window.firebase) {
        console.error('Firebase not loaded');
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .catch(error => console.error('Sign-In Error:', error));
}

// Check if user exists in Airtable
function checkUserExists(uid, autoRedirect) {
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={UID}="${uid}"`, {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.records.length > 0) {
            window.location.href = 'home.html';
        } else if (!autoRedirect) {
            document.getElementById('signup-form').style.display = 'block';
            document.querySelector('.google-signin').style.display = 'none';
        }
    })
    .catch(error => console.error('Airtable Check Error:', error.message));
}

// Hardcode Dropdowns
function populateDropdowns() {
    const semesterSelect = document.getElementById('semester');
    const deptSelect = document.getElementById('department');
    const skillsSelect = document.getElementById('skills');
    const interestsSelect = document.getElementById('interests');
    const passionSelect = document.getElementById('passion');

    const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
    semesters.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.textContent = sem;
        semesterSelect.appendChild(option);
    });

    const departments = [
        'Computer Science',
        'Electronics and Communication',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electrical Engineering',
        'Information Technology',
        'Marine Engineering',
        'Safety and Fire Engineering'
    ];
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });

    const skills = [
        'AI Literacy', 'Data Analysis', 'Cybersecurity', 'Cloud Computing', 'Programming',
        'Creativity', 'Problem Solving', 'Leadership', 'Communication', 'Resilience',
        'Digital Marketing', 'UX/UI Design', 'Blockchain', 'Sustainability', 'Emotional Intelligence'
    ];
    skills.forEach(skill => {
        const option = document.createElement('option');
        option.value = skill;
        option.textContent = skill;
        skillsSelect.appendChild(option);
    });

    const interests = [
        'Technology', 'Innovation', 'Sustainability', 'Entrepreneurship', 'Gaming',
        'Fitness', 'Travel', 'Music', 'Art', 'Photography',
        'Social Impact', 'Food', 'Fashion', 'Education', 'Wellness'
    ];
    interests.forEach(interest => {
        const option = document.createElement('option');
        option.value = interest;
        option.textContent = interest;
        interestsSelect.appendChild(option);
    });

    const passions = [
        'Software Engineer', 'Data Scientist', 'Cybersecurity Specialist', 'Cloud Architect',
        'AI Specialist', 'Digital Marketer', 'UX/UI Designer', 'Product Manager',
        'Sustainability Consultant', 'Content Creator', 'Entrepreneur', 'Healthcare Professional',
        'Educator', 'Graphic Designer', 'Blockchain Developer'
    ];
    passions.forEach(passion => {
        const option = document.createElement('option');
        option.value = passion;
        option.textContent = passion;
        passionSelect.appendChild(option);
    });
}

// Form Navigation
function nextStep(step) {
    const current = document.getElementById(`form-step-${step}`);
    const input = step === 1 || step === 2 ? current.querySelector('input').value.trim() : current.querySelector('select').selectedOptions;
    let isValid = false;

    if (step === 1) isValid = /^[A-Za-z\s]+$/.test(input) && input.length > 0; // Name
    else if (step === 2) isValid = /^[A-Za-z0-9]+$/.test(input) && input.length > 0; // RegNo
    else if (step === 3 || step === 4 || step === 7) isValid = input[0].value !== ''; // Semester, Department, Passion
    else if (step === 5 || step === 6) isValid = input.length > 0 && input[0].value !== ''; // Skills, Interests

    if (isValid) {
        current.classList.remove('active');
        const next = document.getElementById(`form-step-${step + 1}`);
        if (next) next.classList.add('active');
    } else {
        alert(step === 1 ? 'Please enter a valid name (letters only).' :
              step === 2 ? 'Please enter a valid registration number (alphanumeric).' :
              'Please select at least one option.');
    }
}

function prevStep(step) {
    const current = document.getElementById(`form-step-${step}`);
    const prev = document.getElementById(`form-step-${step - 1}`);
    current.classList.remove('active');
    prev.classList.add('active');
}

function completeRegistration() {
    const name = document.getElementById('name').value.trim();
    const regno = document.getElementById('regno').value.trim();
    const semester = document.getElementById('semester').value;
    const department = document.getElementById('department').value;
    const skills = Array.from(document.getElementById('skills').selectedOptions).map(opt => opt.value).join(', ');
    const interests = Array.from(document.getElementById('interests').selectedOptions).map(opt => opt.value).join(', ');
    const passion = document.getElementById('passion').value;

    if (!/^[A-Za-z\s]+$/.test(name) || name.length === 0) {
        alert('Please enter a valid name (letters only).');
        return;
    }
    if (!/^[A-Za-z0-9]+$/.test(regno) || regno.length === 0) {
        alert('Please enter a valid registration number (alphanumeric).');
        return;
    }
    if (!semester) {
        alert('Please select a semester.');
        return;
    }
    if (!department) {
        alert('Please select a department.');
        return;
    }
    if (!skills) {
        alert('Please select at least one skill.');
        return;
    }
    if (!interests) {
        alert('Please select at least one interest.');
        return;
    }
    if (!passion) {
        alert('Please select a passion.');
        return;
    }

    const user = firebase.auth().currentUser;
    if (user) {
        const userData = {
            fields: {
                UID: user.uid,
                Name: name,
                RegNo: regno,
                Email: user.email,
                Semester: semester,
                Department: department,
                Skills: skills,
                Interests: interests,
                Passion: passion
            }
        };

        console.log('Sending to Airtable:', JSON.stringify(userData, null, 2));

        fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${AIRTABLE_PAT}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(`Registration Failed: ${response.status} - ${JSON.stringify(err)}`); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Airtable Response:', data);
            window.location.href = 'home.html';
        })
        .catch(error => {
            console.error('Airtable Write Error:', error.message);
            alert('Failed to register. Check console for details.');
        });
    }
}

// Load Profile Data
function loadProfile(uid) {
    fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula={UID}="${uid}"`, {
        headers: { Authorization: `Bearer ${AIRTABLE_PAT}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.records.length > 0) {
            const record = data.records[0].fields;
            document.getElementById('profile-name').textContent = record.Name || 'N/A';
            document.getElementById('profile-email').textContent = record.Email || 'N/A';
            document.getElementById('profile-regno').textContent = record.RegNo || 'N/A';
            document.getElementById('profile-semester').textContent = record.Semester || 'N/A';
            document.getElementById('profile-department').textContent = record.Department || 'N/A';
            document.getElementById('profile-skills').textContent = record.Skills || 'N/A';
            document.getElementById('profile-interests').textContent = record.Interests || 'N/A';
            document.getElementById('profile-passion').textContent = record.Passion || 'N/A';
        }
    })
    .catch(error => console.error('Profile Load Error:', error.message));
}

// Sign Out
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            localStorage.removeItem('uid');
            window.location.href = 'index.html';
        })
        .catch(error => console.error('Sign Out Error:', error));
}