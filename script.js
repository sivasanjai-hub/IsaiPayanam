// Categories Definition
const ALL_CATEGORIES = [
    "Melody", "Love", "Kuthu", "Mass", "Gaana", "Folk", "Sad", "Romantic", "Devotional", "Rap", "BGM", "Dance",
    "Party", "Chill", "LoFi", "Motivational", "Friendship", "Village Folk", "Item Song", "Classical", "Retro Hits",
    "Trending", "Vijay Hits", "Ajith Hits", "Rajini Hits", "Dhanush Hits", "Anirudh Hits", "Yuvan Hits",
    "Harris Hits", "Rahman Hits", "90s Hits", "2000s Hits", "New Releases"
];

// Beautiful static imagery mapping for each category to guarantee real pictures
// Beautiful static imagery mapping for each category to guarantee real pictures
// 1. FOLDER/CATEGORY IMAGES: User Provided Local Images
const defaultCategoriesData = ALL_CATEGORIES.map((cat, index) => {
    // Maps exactly to the renamed .png files in the images folder
    const safeName = cat.replace(/[^a-zA-Z0-9]/g, '');
    const coverUrl = `./images/${safeName}.png`;



    return {
        id: cat.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: cat,
        description: `The perfect ${cat} vibe curated just for you.`,
        cover: coverUrl,
        songs: []
    };
});

// Load from Local Storage (so added songs persist!) or use defaults
let categoriesData = [];
const savedData = localStorage.getItem('isaiCategories');
if (savedData) {
    categoriesData = JSON.parse(savedData);
    // Force-update default covers to local .png images, but DO NOT overwrite custom user-uploaded base64 images!
    categoriesData.forEach((cat) => {
        if (!cat.cover || !cat.cover.startsWith('data:image')) {
            const safeName = cat.name.replace(/[^a-zA-Z0-9]/g, '');
            cat.cover = `./images/${safeName}.png`;
        }
    });
    // Resave the updated categories back to local storage
    localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));
} else {
    categoriesData = defaultCategoriesData;

    // 2. SONG IMAGES: These are DIFFERENT from the Folder Image.
    const massCat = categoriesData.find(c => c.name === "Mass");
    if (massCat) massCat.songs.push({
        id: 's1', title: "Raavana Mavandaa", artist: "Unknown Artist", album: "Single",
        src: "https://res.cloudinary.com/dx8u0vtm7/video/upload/v1778606998/Raavana_Mavandaa_opgdba.mp3",
        cover: "https://loremflickr.com/150/150/action,hero?random=1" // Unique Song Image
    });

    const anirudhCat = categoriesData.find(c => c.name === "Anirudh Hits");
    if (anirudhCat) anirudhCat.songs.push({
        id: 's2', title: "So Baby", artist: "Anirudh Ravichander", album: "Doctor",
        src: "https://res.cloudinary.com/dx8u0vtm7/video/upload/v1778607069/So_Baby_cvln5j.mp3",
        cover: "https://loremflickr.com/150/150/concert,singer?random=2" // Unique Song Image
    });

    const vijayCat = categoriesData.find(c => c.name === "Vijay Hits");
    if (vijayCat) vijayCat.songs.push({
        id: 's3', title: "Thalapathy Kacheri", artist: "Vijay", album: "Single",
        src: "https://res.cloudinary.com/dx8u0vtm7/video/upload/v1778607066/Thalapathy_Kacheri_cwwpkg.mp3",
        cover: "https://loremflickr.com/150/150/dance,actor?random=3" // Unique Song Image
    });

    const ajithCat = categoriesData.find(c => c.name === "Ajith Hits");
    if (ajithCat) ajithCat.songs.push({
        id: 's4', title: "Vilayaadu Mankatha", artist: "Yuvan Shankar Raja", album: "Mankatha",
        src: "https://res.cloudinary.com/dx8u0vtm7/video/upload/v1778607067/Vilayaadu_Mankatha_oullhk.mp3",
        cover: "https://loremflickr.com/150/150/bike,racing?random=4" // Unique Song Image
    });

    // Save defaults to storage initially
    localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));
}



// App State
let userPlaylists = [];
let likedSongs = [];
let currentCategory = null;
let currentSongList = [];
let currentSongIndex = 0;
let isPlaying = false;
let currentSongId = null;

// Navigation History Stack
let viewHistory = ['homeView'];
let historyIndex = 0;

// DOM Elements
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const titleElem = document.getElementById('songTitle');
const artistElem = document.getElementById('artistName');
const coverElem = document.getElementById('cover');
const currentTimeElem = document.getElementById('currentTime');
const durationElem = document.getElementById('duration');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const volumeBar = document.getElementById('volumeBar');
const volumeContainer = document.getElementById('volumeContainer');
const playerLikeBtn = document.getElementById('playerLikeBtn');
const volumeIcon = document.getElementById('volumeIcon');

const views = {
    homeView: document.getElementById('homeView'),
    searchView: document.getElementById('searchView'),
    libraryView: document.getElementById('libraryView'),
    playlistView: document.getElementById('playlistView'),
    likedView: document.getElementById('likedView'),
    adminView: document.getElementById('adminView')
};

const categoryGrid = document.getElementById('categoryGrid');
const browseGrid = document.getElementById('browseGrid');
const libraryGrid = document.getElementById('libraryGrid');
const searchResultsList = document.getElementById('searchResultsList');
const searchInput = document.getElementById('searchInput');
const searchBarContainer = document.getElementById('searchBarContainer');

const songListContainer = document.getElementById('songList');
const likedSongListContainer = document.getElementById('likedSongList');
const playlistTitle = document.getElementById('playlistTitle');
const playlistCover = document.getElementById('playlistCover');
const playlistDesc = document.getElementById('playlistDesc');
const songCount = document.getElementById('songCount');
const likedSongCount = document.getElementById('likedSongCount');

function initApp() {
    renderGrid(categoriesData, categoryGrid);
    renderGrid(categoriesData, browseGrid);

    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (target) navigateTo(target);
        });
    });

    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('forwardBtn').addEventListener('click', goForward);

    document.getElementById('createPlaylistBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const name = prompt("Enter playlist name:");
        if (name) {
            const newPlaylist = {
                id: 'pl_' + Date.now(),
                name: name,
                description: "Created by You",
                cover: "https://image.pollinations.ai/prompt/custom%20music%20playlist%20abstract%20art?width=400&height=400&nologo=true",
                songs: []
            };
            userPlaylists.push(newPlaylist);
            if (views.libraryView.classList.contains('active')) renderLibrary();
            alert("Playlist created! Go to Your Library.");
        }
    });

    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    playerLikeBtn.addEventListener('click', () => {
        if (!currentSongId) return;
        const song = currentSongList[currentSongIndex];
        toggleLike(song);
    });

    // Modals
    const premiumModal = document.getElementById('premiumModal');
    const profileModal = document.getElementById('profileModal');

    document.getElementById('premiumBtn').addEventListener('click', () => {
        premiumModal.classList.add('show');
    });

    document.getElementById('profileBtn').addEventListener('click', () => {
        if (window.isAdminLoggedIn) {
            navigateTo('adminView');
        } else {
            profileModal.classList.add('show');
        }
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('show');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
        }
    });

    // ADMIN LOGIN LOGIC
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminUser = document.getElementById('adminUsername');
    const adminPass = document.getElementById('adminPassword');
    const adminError = document.getElementById('adminErrorMsg');

    adminLoginBtn.addEventListener('click', () => {
        if (adminUser.value === 'sanjai' && adminPass.value === 'IsaiPayanam@2026') {
            window.isAdminLoggedIn = true;
            profileModal.classList.remove('show');
            adminUser.value = '';
            adminPass.value = '';
            adminError.style.display = 'none';
            navigateTo('adminView');
            initAdminPanel();
        } else {
            adminError.style.display = 'block';
        }
    });

    // Admin Logout
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            window.isAdminLoggedIn = false;
            navigateTo('homeView');
            alert("Admin logged out successfully.");
        });
    }

    // Initial Volume Setup
    audio.volume = 1;
    updateVolumeUI(1);
    updateNavUI();
}

// ADMIN PANEL LOGIC (CRUD)
function initAdminPanel() {
    const adminCategorySelect = document.getElementById('adminSongCategory');
    const adminSongList = document.getElementById('adminSongList');

    // Populate Categories Dropdown
    adminCategorySelect.innerHTML = '';
    categoriesData.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.innerText = cat.name;
        adminCategorySelect.appendChild(option);
    });

    // Read & Delete
    renderAdminSongs();
    renderAdminCategories();

    // Add New Category (Create)
    document.getElementById('adminAddCategoryBtn').onclick = () => {
        const catName = document.getElementById('adminCategoryName').value;
        const fileInput = document.getElementById('adminCategoryImage');
        
        if (!catName) {
            alert('Please enter a category name.');
            return;
        }

        const addCategory = (coverUrl) => {
            const newCat = {
                id: catName.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now(),
                name: catName,
                description: `The perfect ${catName} vibe curated just for you.`,
                cover: coverUrl,
                songs: []
            };
            categoriesData.push(newCat);
            localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));
            alert(`Category '${catName}' added!`);
            
            // Re-populate dropdown
            adminCategorySelect.innerHTML = '';
            categoriesData.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.innerText = cat.name;
                adminCategorySelect.appendChild(option);
            });
            
            document.getElementById('adminCategoryName').value = '';
            fileInput.value = '';
            
            renderAdminCategories();
            renderGrid(categoriesData, categoryGrid);
            renderGrid(categoriesData, browseGrid);
        };

        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                addCategory(e.target.result); // Base64 image
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            // Fallback unique image if no file uploaded
            const fallback = `https://loremflickr.com/400/400/${encodeURIComponent(catName.replace(/\s+/g, ''))},music/all?lock=${Date.now()}`;
            addCategory(fallback);
        }
    };

    // Admin Search Logic
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderAdminSongs(e.target.value);
        });
    }

    // Add new Song (Create)
    document.getElementById('adminAddSongBtn').onclick = () => {
        const title = document.getElementById('adminSongTitle').value;
        const artist = document.getElementById('adminSongArtist').value;
        const src = document.getElementById('adminSongSrc').value;
        const catId = document.getElementById('adminSongCategory').value;

        if (!title || !artist || !src) {
            alert('Please fill out all fields.');
            return;
        }

        const category = categoriesData.find(c => c.id === catId);
        if (category) {
            const newSong = {
                id: 's_' + Date.now(),
                title: title,
                artist: artist,
                album: category.name,
                src: src,
                cover: `https://loremflickr.com/150/150/music,${title.replace(/\s+/g, '')}?random=${Date.now()}` // Dynamic song cover
            };
            category.songs.push(newSong);
            alert(`Added '${title}' to ${category.name}!`);


            // Save to localStorage
            localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));

            // Clear inputs
            document.getElementById('adminSongTitle').value = '';
            document.getElementById('adminSongArtist').value = '';
            document.getElementById('adminSongSrc').value = '';

            renderAdminSongs();

            // Update UI grids if they are in home
            renderGrid(categoriesData, categoryGrid);
            renderGrid(categoriesData, browseGrid);
        }
    };
}

function renderAdminCategories() {
    const adminCategoryList = document.getElementById('adminCategoryList');
    if (!adminCategoryList) return;
    adminCategoryList.innerHTML = '';

    categoriesData.forEach(cat => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.background = 'rgba(255,255,255,0.05)';
        div.style.padding = '12px';
        div.style.borderRadius = '6px';

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="${cat.cover}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                <strong>${cat.name}</strong> <span style="color:var(--text-secondary); font-size: 12px;">(${cat.songs.length} songs)</span>
            </div>
            <button style="background:#ff4d4d; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">Delete</button>
        `;

        // Delete Category Logic
        div.querySelector('button').onclick = () => {
            if (confirm(`Are you sure you want to delete the category '${cat.name}' AND all of its songs?`)) {
                categoriesData = categoriesData.filter(c => c.id !== cat.id);
                localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));
                initAdminPanel(); // re-init to update dropdowns and both lists
                renderGrid(categoriesData, categoryGrid);
                renderGrid(categoriesData, browseGrid);
            }
        };
        adminCategoryList.appendChild(div);
    });
}

function renderAdminSongs(searchQuery = '') {
    const adminSongList = document.getElementById('adminSongList');
    adminSongList.innerHTML = '';
    const query = searchQuery.toLowerCase();

    categoriesData.forEach(cat => {
        cat.songs.forEach(song => {
            // Search Filtering
            if (query && 
                !song.title.toLowerCase().includes(query) && 
                !song.artist.toLowerCase().includes(query) && 
                !cat.name.toLowerCase().includes(query)) {
                return;
            }

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.padding = '12px';
            div.style.borderRadius = '6px';

            div.innerHTML = `
                <div>
                    <strong>${song.title}</strong> by ${song.artist} <br>
                    <span style="font-size: 12px; color: var(--text-secondary);">Folder: ${cat.name}</span>
                </div>
                <button style="background:#ff4d4d; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">Delete</button>
            `;

            // Delete Logic
            div.querySelector('button').onclick = () => {
                if (confirm(`Are you sure you want to delete ${song.title}?`)) {
                    cat.songs = cat.songs.filter(s => s.id !== song.id);
                    localStorage.setItem('isaiCategories', JSON.stringify(categoriesData));
                    renderAdminSongs();
                    renderGrid(categoriesData, categoryGrid);
                    renderGrid(categoriesData, browseGrid);
                }
            };

            adminSongList.appendChild(div);
        });
    });
}

// History Navigation
function navigateTo(viewId, category = null) {
    viewHistory = viewHistory.slice(0, historyIndex + 1);
    viewHistory.push({ id: viewId, category: category });
    historyIndex++;
    executeNavigation({ id: viewId, category: category });
}

function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        executeNavigation(viewHistory[historyIndex]);
    }
}

function goForward() {
    if (historyIndex < viewHistory.length - 1) {
        historyIndex++;
        executeNavigation(viewHistory[historyIndex]);
    }
}

function executeNavigation(state) {
    if (typeof state === 'string') state = { id: state, category: null };

    Object.values(views).forEach(v => {
        if (v) {
            v.classList.remove('active');
            v.style.display = 'none';
        }
    });

    searchBarContainer.style.display = 'none';

    const targetView = views[state.id];
    if (targetView) {
        targetView.style.display = 'block';
        setTimeout(() => targetView.classList.add('active'), 50);
    }

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-target="${state.id}"]`).forEach(el => el.classList.add('active'));

    if (state.id === 'searchView') {
        searchBarContainer.style.display = 'flex';
        searchInput.focus();
    } else if (state.id === 'libraryView') {
        renderLibrary();
    } else if (state.id === 'playlistView' && state.category) {
        openCategory(state.category, false);
    } else if (state.id === 'likedView') {
        renderLikedSongs();
    }

    updateNavUI();
}

function updateNavUI() {
    document.getElementById('backBtn').style.opacity = historyIndex > 0 ? '1' : '0.5';
    document.getElementById('backBtn').style.cursor = historyIndex > 0 ? 'pointer' : 'not-allowed';

    document.getElementById('forwardBtn').style.opacity = historyIndex < viewHistory.length - 1 ? '1' : '0.5';
    document.getElementById('forwardBtn').style.cursor = historyIndex < viewHistory.length - 1 ? 'pointer' : 'not-allowed';
}

function renderGrid(dataArray, container) {
    container.innerHTML = '';
    dataArray.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('category-card');

        // Fallback to a generic music picture just in case
        const fallback = `https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop`;
        card.innerHTML = `
            <img src="${item.cover}" onerror="this.src='${fallback}'" alt="${item.name}" class="category-img" loading="lazy">
            <div class="category-name">${item.name}</div>
            <div class="category-desc">${item.description}</div>
        `;
        card.addEventListener('click', () => {
            navigateTo('playlistView', item);
        });
        container.appendChild(card);
    });
}

function renderLibrary() {
    if (userPlaylists.length === 0) {
        libraryGrid.innerHTML = '<div style="color:var(--text-secondary); grid-column: 1/-1;">You haven\'t created any playlists yet. Click "Create Playlist" in the sidebar!</div>';
    } else {
        renderGrid(userPlaylists, libraryGrid);
    }
}

function handleSearch(query) {
    query = query.toLowerCase().trim();
    searchResultsList.innerHTML = '';

    if (!query) return;

    let results = [];
    categoriesData.forEach(cat => {
        cat.songs.forEach(song => {
            if (song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)) {
                results.push(song);
            }
        });
    });

    if (results.length === 0) {
        searchResultsList.innerHTML = '<div style="padding: 16px; color:var(--text-secondary);">No results found.</div>';
    } else {
        renderSongHTML(results, searchResultsList);
    }
}

function openCategory(category, pushNav = true) {
    currentCategory = category;
    playlistTitle.innerText = category.name;
    playlistDesc.innerText = category.description;
    // Fallback logic for cover image
    playlistCover.onerror = () => { playlistCover.src = 'https://loremflickr.com/400/400/music'; };
    playlistCover.src = category.cover;
    songCount.innerText = `${category.songs.length} songs`;

    renderSongHTML(category.songs, songListContainer);

    if (pushNav) navigateTo('playlistView', category);
}

function renderLikedSongs() {
    likedSongCount.innerText = `${likedSongs.length} songs`;
    renderSongHTML(likedSongs, likedSongListContainer);
}

function renderSongHTML(songs, container) {
    container.innerHTML = '';
    if (songs.length === 0) {
        container.innerHTML = '<div style="padding: 16px; color: var(--text-secondary);">No songs here yet! Add songs to this category later.</div>';
        return;
    }

    songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.classList.add('song-item');

        if (currentSongId === song.id) {
            item.classList.add('active');
            if (isPlaying) item.querySelector('.song-play-icon')?.classList.replace('fa-play', 'fa-pause');
        }

        item.innerHTML = `
            <div class="song-index">
                <span class="song-index-num">${index + 1}</span>
                <i class="fa-solid fa-play song-play-icon"></i>
            </div>
            <div class="song-info-col">
                <img src="${song.cover}" onerror="this.src='https://loremflickr.com/150/150/music?random=${Math.random()}'" alt="cover" class="song-img">
                <div>
                    <div class="song-name">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                </div>
            </div>
            <div class="song-album desktop-only">${song.album}</div>
            <div class="song-duration">-:--</div>
        `;

        item.addEventListener('click', () => {
            currentSongList = songs;
            currentSongIndex = index;
            loadSong(song);
            playSong();
        });

        container.appendChild(item);
    });
}

function toggleLike(song) {
    const index = likedSongs.findIndex(s => s.id === song.id);
    if (index > -1) {
        likedSongs.splice(index, 1);
        playerLikeBtn.classList.remove('liked');
        playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    } else {
        likedSongs.push(song);
        playerLikeBtn.classList.add('liked');
        playerLikeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    }
    if (views.likedView.classList.contains('active')) renderLikedSongs();
}

function checkLikedStatus() {
    if (!currentSongId) return;
    const isLiked = likedSongs.some(s => s.id === currentSongId);
    if (isLiked) {
        playerLikeBtn.classList.add('liked');
        playerLikeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    } else {
        playerLikeBtn.classList.remove('liked');
        playerLikeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    }
}

function loadSong(song) {
    if (!song) return;
    currentSongId = song.id;
    titleElem.innerText = song.title;
    artistElem.innerText = song.artist;
    coverElem.src = song.cover;
    audio.src = song.src;
    checkLikedStatus();
}

function playSong() {
    if (currentSongList.length === 0) return;
    isPlaying = true;
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    audio.play();
    updateAllSongUIs();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    audio.pause();
    updateAllSongUIs();
}

playBtn.addEventListener('click', () => {
    if (isPlaying) pauseSong();
    else playSong();
});

function updateAllSongUIs() {
    document.querySelectorAll('.song-item').forEach((item) => {
        item.classList.remove('active');
        item.querySelector('.song-play-icon')?.classList.replace('fa-pause', 'fa-play');

        const titleNode = item.querySelector('.song-name');
        if (titleNode && currentSongList[currentSongIndex] && titleNode.innerText === currentSongList[currentSongIndex].title) {
            item.classList.add('active');
            if (isPlaying) {
                item.querySelector('.song-play-icon')?.classList.replace('fa-play', 'fa-pause');
            }
        }
    });
}

document.getElementById('mainPlayBtn').addEventListener('click', () => {
    if (currentCategory && currentCategory.songs.length > 0) {
        if (currentSongList !== currentCategory.songs) {
            currentSongList = currentCategory.songs;
            currentSongIndex = 0;
            loadSong(currentSongList[0]);
        }
        if (isPlaying) pauseSong(); else playSong();
    }
});

document.getElementById('likedPlayBtn').addEventListener('click', () => {
    if (likedSongs.length > 0) {
        if (currentSongList !== likedSongs) {
            currentSongList = likedSongs;
            currentSongIndex = 0;
            loadSong(likedSongs[0]);
        }
        if (isPlaying) pauseSong(); else playSong();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentSongList.length === 0) return;
    currentSongIndex--;
    if (currentSongIndex < 0) currentSongIndex = currentSongList.length - 1;
    loadSong(currentSongList[currentSongIndex]);
    playSong();
});

nextBtn.addEventListener('click', () => {
    if (currentSongList.length === 0) return;
    currentSongIndex++;
    if (currentSongIndex > currentSongList.length - 1) currentSongIndex = 0;
    loadSong(currentSongList[currentSongIndex]);
    playSong();
});

function formatTime(sec) {
    let min = Math.floor(sec / 60);
    let remainingSec = Math.floor(sec % 60);
    if (remainingSec < 10) remainingSec = `0${remainingSec}`;
    return `${min}:${remainingSec}`;
}

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if (duration) {
        progressBar.style.width = `${(currentTime / duration) * 100}%`;
        currentTimeElem.innerText = formatTime(currentTime);
        durationElem.innerText = formatTime(duration);
    }
});

// PROGRESS BAR DRAG & CLICK
let isDraggingProgress = false;

function getClientX(e) {
    return e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
}

progressContainer.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    updateProgressFromEvent(e);
});
progressContainer.addEventListener('touchstart', (e) => {
    isDraggingProgress = true;
    updateProgressFromEvent(e);
}, { passive: true });

document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) updateProgressFromEvent(e);
});
document.addEventListener('touchmove', (e) => {
    if (isDraggingProgress) updateProgressFromEvent(e);
}, { passive: true });

document.addEventListener('mouseup', () => {
    if (isDraggingProgress) isDraggingProgress = false;
});
document.addEventListener('touchend', () => {
    if (isDraggingProgress) isDraggingProgress = false;
});

function updateProgressFromEvent(e) {
    if (!audio.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    let clickX = getClientX(e) - rect.left;
    let width = rect.width;
    let percent = clickX / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    audio.currentTime = percent * audio.duration;
}

// VOLUME CONTROL DRAG & CLICK
let isDraggingVolume = false;
let previousVolume = 1;

volumeContainer.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    updateVolumeFromEvent(e);
});
volumeContainer.addEventListener('touchstart', (e) => {
    isDraggingVolume = true;
    updateVolumeFromEvent(e);
}, { passive: true });

document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) updateVolumeFromEvent(e);
});
document.addEventListener('touchmove', (e) => {
    if (isDraggingVolume) updateVolumeFromEvent(e);
}, { passive: true });

document.addEventListener('mouseup', () => {
    if (isDraggingVolume) isDraggingVolume = false;
});
document.addEventListener('touchend', () => {
    if (isDraggingVolume) isDraggingVolume = false;
});

function updateVolumeFromEvent(e) {
    const rect = volumeContainer.getBoundingClientRect();
    let clickX = getClientX(e) - rect.left;
    let width = rect.width;
    let vol = clickX / width;
    if (vol < 0.05) vol = 0;
    if (vol > 0.95) vol = 1;

    updateVolumeUI(vol);
}

function updateVolumeUI(vol) {
    audio.volume = vol;
    volumeBar.style.width = `${vol * 100}%`;

    if (vol === 0) {
        volumeIcon.className = "fa-solid fa-volume-xmark";
    } else if (vol < 0.5) {
        volumeIcon.className = "fa-solid fa-volume-low";
    } else {
        volumeIcon.className = "fa-solid fa-volume-high";
    }
}

// Mute/Unmute toggle
volumeIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
        previousVolume = audio.volume;
        updateVolumeUI(0);
    } else {
        updateVolumeUI(previousVolume || 1);
    }
});

audio.addEventListener('ended', () => nextBtn.click());

initApp();
