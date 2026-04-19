const enterBtn = document.getElementById('enter-btn');
const enterScreen = document.getElementById('enter-screen');
const container = document.getElementById('main-container');
const playBtn = document.getElementById('play-btn');
const progressArea = document.getElementById('progress-area');
const progressBar = document.getElementById('progress-bar');
const bgVideo = document.getElementById('bg-video');

// Playlist audio
const playlist = [
    {
        title: "Caramelo | Ramos",
        artist: "707 Brvzil",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRantIzgCDj5TKgEAg903EKXylratSzwiYLcA&s",
        src: "music.mp3"
    },
    {
        title: "Gamberge | Ramos",
        artist: "707 Brvzil",
        cover: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRantIzgCDj5TKgEAg903EKXylratSzwiYLcA&s",
        src: "music1.mp3"
    }
];

let trackIndex = 0;
let audio = new Audio();
audio.volume = 0.5;

// === CONFIGURATION DISCORD - VOTRE ID ===
const DISCORD_USER_ID = '742341212253585428';

// Fonction pour récupérer le statut Discord via l'API REST
function fetchDiscordStatus() {
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateDiscordStatus(data.data);
            } else {
                showOfflineStatus();
            }
        })
        .catch(error => {
            console.error('Erreur de connexion à l\'API Discord:', error);
            showOfflineStatus();
        });
}

// Fonction pour afficher le statut hors ligne
function showOfflineStatus() {
    document.getElementById('status-indicator').className = 'status-indicator offline';
    document.getElementById('status-text').textContent = 'Hors ligne';
    document.getElementById('activity-container').style.display = 'none';
}

// Fonction pour mettre à jour l'affichage avec les données Discord
function updateDiscordStatus(presence) {
    // Mettre à jour l'indicateur de statut
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-indicator ' + presence.discord_status;
    
    // Mettre à jour le nom d'utilisateur
    document.getElementById('discord-username').textContent = presence.discord_user.username;
    
    // Gérer le statut personnalisé
    const customStatus = presence.activities.find(activity => activity.type === 4);
    const statusText = document.getElementById('status-text');
    
    if (customStatus) {
        statusText.innerHTML = ''; // Vider le contenu
        
        // Ajouter l'emoji si présent
        if (customStatus.emoji) {
            if (customStatus.emoji.id) {
                // Emoji personnalisé
                const emojiImg = document.createElement('img');
                emojiImg.src = `https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? 'gif' : 'png'}`;
                emojiImg.style.width = '18px';
                emojiImg.style.height = '18px';
                emojiImg.style.marginRight = '5px';
                emojiImg.style.verticalAlign = 'middle';
                statusText.appendChild(emojiImg);
            } else {
                // Emoji Unicode
                statusText.appendChild(document.createTextNode(customStatus.emoji.name + ' '));
            }
        }
        
        // Ajouter le texte du statut
        if (customStatus.state) {
            statusText.appendChild(document.createTextNode(customStatus.state));
        }
    } else {
        // Pas de statut personnalisé, afficher le statut Discord
        const statusMap = {
            'online': 'En ligne',
            'idle': 'Inactif',
            'dnd': 'Ne pas déranger',
            'offline': 'Hors ligne'
        };
        statusText.textContent = statusMap[presence.discord_status] || 'Hors ligne';
    }
    
    // Afficher les activités (sauf le statut personnalisé)
    const activities = presence.activities.filter(activity => activity.type !== 4);
    const activityContainer = document.getElementById('activity-container');
    
    if (activities.length > 0) {
        activityContainer.style.display = 'block';
        activityContainer.innerHTML = '';
        
        activities.forEach(activity => {
            if (activity.name === 'Spotify') {
                // Activité Spotify
                const spotifyEl = document.createElement('div');
                spotifyEl.className = 'spotify-status';
                
                // Extraire l'URL de l'image Spotify
                let imageUrl = '';
                if (activity.assets && activity.assets.large_image) {
                    imageUrl = activity.assets.large_image.replace('spotify:', 'https://i.scdn.co/image/');
                }
                
                spotifyEl.innerHTML = `
                    <div class="spotify-cover" style="background-image: url('${imageUrl}')"></div>
                    <div class="spotify-info">
                        <div class="spotify-song">${activity.details || 'Titre inconnu'}</div>
                        <div class="spotify-artist">${activity.state || 'Artiste inconnu'}</div>
                    </div>
                `;
                activityContainer.appendChild(spotifyEl);
            } else {
                // Autre activité (jeu, etc.)
                const activityEl = document.createElement('div');
                activityEl.className = 'activity-details';
                
                // Calculer le temps écoulé
                let timestampText = '';
                if (activity.timestamps && activity.timestamps.start) {
                    const elapsed = Math.floor((Date.now() - activity.timestamps.start) / 1000);
                    const hours = Math.floor(elapsed / 3600);
                    const minutes = Math.floor((elapsed % 3600) / 60);
                    
                    if (hours > 0) {
                        timestampText = `Depuis ${hours}h ${minutes}min`;
                    } else {
                        timestampText = `Depuis ${minutes}min`;
                    }
                }
                
                activityEl.innerHTML = `
                    <div class="activity-icon">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <div class="activity-text">
                        <div class="activity-name">${activity.name}</div>
                        <div class="activity-state">${activity.details || ''} ${activity.state ? '• ' + activity.state : ''}</div>
                        ${timestampText ? `<div class="activity-timestamp">${timestampText}</div>` : ''}
                    </div>
                `;
                activityContainer.appendChild(activityEl);
            }
        });
    } else {
        activityContainer.style.display = 'none';
    }
}

function loadTrack(index) {
    const track = playlist[index];
    document.getElementById('track-title').innerText = track.title;
    document.getElementById('track-artist').innerText = track.artist;
    document.getElementById('track-art').src = track.cover;
    audio.src = track.src;
}

// Initial Load
loadTrack(trackIndex);

// Configuration vidéo
bgVideo.loop = true;
bgVideo.muted = true;
bgVideo.playsInline = true;

// Tentative de lecture automatique
bgVideo.play().catch(e => console.log("Autoplay prévenu:", e));

// Gestion de l'écran d'entrée
enterBtn.addEventListener('click', () => {
    enterScreen.classList.add('hidden');
    container.classList.add('visible');
    
    // Initialiser le statut Discord
    fetchDiscordStatus(); // Appel immédiat
    setInterval(fetchDiscordStatus, 15000); // Rafraîchir toutes les 15 secondes
    
    // Démarrer la musique
    audio.play().catch(() => console.log("Audio en attente"));
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    
    // Activer le son de la vidéo
    bgVideo.muted = false;
});

// Contrôles audio
playBtn.addEventListener('click', () => {
    if(audio.paused) {
        audio.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

audio.addEventListener('timeupdate', (e) => {
    const { duration, currentTime } = e.srcElement;
    if (duration) {
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
    }
});

progressArea.addEventListener('click', (e) => {
    const width = progressArea.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
});

progressArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const width = progressArea.clientWidth;
    const clickX = touch.clientX - progressArea.getBoundingClientRect().left;
    const duration = audio.duration;
    if (duration) {
        audio.currentTime = (clickX / width) * duration;
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    trackIndex = (trackIndex + 1) % playlist.length;
    loadTrack(trackIndex);
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
});

document.getElementById('prev-btn').addEventListener('click', () => {
    trackIndex = (trackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(trackIndex);
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
});

audio.addEventListener('ended', () => {
    trackIndex = (trackIndex + 1) % playlist.length;
    loadTrack(trackIndex);
    audio.play();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        audio.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// Empêcher le zoom
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Effets tactiles
document.querySelectorAll('.social-item').forEach(item => {
    let touchTimer;
    
    item.addEventListener('touchstart', function() {
        touchTimer = setTimeout(() => {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 20px rgba(255, 255, 255, 0.15)';
        }, 50);
    });
    
    item.addEventListener('touchend', function() {
        clearTimeout(touchTimer);
        setTimeout(() => {
            this.style.transform = '';
            this.style.boxShadow = '';
        }, 200);
    });
    
    item.addEventListener('touchcancel', function() {
        clearTimeout(touchTimer);
        this.style.transform = '';
        this.style.boxShadow = '';
    });
});