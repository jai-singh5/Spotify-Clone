const player = {
    currentSong: new Audio(),
    songs: [],
    currFolder: null,
    previousVolume: 0.5,

    async getSongs(folder) {
        try {
            this.currFolder = folder;
            let response = await fetch('/songs.json');
            let data = await response.json();
            let album = data.albums.find(album => album.folder === folder);
            this.songs = album ? album.songs : [];

            // Show all the songs in the playlist
            let songUL = document.querySelector(".songList ul");
            songUL.innerHTML = "";
            for (const song of this.songs) {
                songUL.innerHTML += `<li>
                    <img class="invert" width="34" src="img/music.svg" alt=""/>
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Jai</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img  src="img/play.svg" alt=""/>
                    </div>
                </li>`;
            }

            // Attach click events to songs
            Array.from(document.querySelectorAll(".songList li")).forEach((e, index) => {
                e.addEventListener("click", () => {
                    this.playMusic(this.songs[index]);
                });
            });
        } catch (error) {
            console.error("Error fetching songs:", error);
            alert("Failed to load songs. Please try again later.");
        }
    },

    playMusic(track, pause = false) {
        this.currentSong.src = `/songs/${this.currFolder}/${track}`;
        if (!pause) {
            this.currentSong.play();
            document.querySelector("#play").src = "img/pause.svg";
        }
        document.querySelector(".songinfo").textContent = decodeURI(track);
        document.querySelector(".songtime").textContent = "00:00 / 00:00";
    },

    togglePlayPause() {
        const playButton = document.querySelector("#play");
        if (this.currentSong.paused) {
            this.currentSong.play();
            playButton.src = "img/pause.svg";
        } else {
            this.currentSong.pause();
            playButton.src = "img/play.svg";
        }
    },

    updateTimeAndSeekbar() {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(this.currentSong.currentTime)} / ${secondsToMinutesSeconds(this.currentSong.duration)}`;
        document.querySelector(".circle").style.left = (this.currentSong.currentTime / this.currentSong.duration) * 100 + "%";
        document.querySelector(".seekbar").style.background = `linear-gradient(to right, #1fdf64 ${(this.currentSong.currentTime / this.currentSong.duration) * 100}%, #ddd ${(this.currentSong.currentTime / this.currentSong.duration) * 100}%)`;
    },

    seek(e) {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        player.currentSong.currentTime = (player.currentSong.duration * percent) / 100;
    },

    toggleMute(e) {
        const volumeIcon = e.target;
        if (volumeIcon.src.includes("volume.svg")) {
            // Muting the volume
            volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
            this.previousVolume = this.currentSong.volume;
            this.currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
            
            // Change the range slider color to reflect muted state
            document.querySelector(".range input").style.background = `linear-gradient(to right, #ddd 0%, #ddd 100%)`;
        } else {
            // Restoring the volume
            volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
            this.currentSong.volume = this.previousVolume || 0.5;
            document.querySelector(".range input").value = this.previousVolume * 100;
            
            // Change the range slider color back to green
            document.querySelector(".range input").style.background = `linear-gradient(to right, green ${this.currentSong.volume * 100}%, #ddd ${this.currentSong.volume * 100}%)`;
        }
    }
    
};

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function displayAlbums() {
    try {
        let response = await fetch('/songs.json');
        let data = await response.json();

        let cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";
        data.albums.forEach(album => {
            let card = document.createElement("div");
            card.classList.add("card");
            card.dataset.folder = album.folder;

            card.innerHTML = `
                <div class="play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
                    </svg>
                </div>
                <img src="/songs/${album.folder}/${album.cover}" alt="">
                <h2>${album.title}</h2>
                <p>${album.description}</p>`;

            card.addEventListener("click", async () => {
                await player.getSongs(album.folder);
                if (player.songs.length > 0) {
                    player.playMusic(player.songs[0]);
                }
            });

            cardContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
        alert("Failed to load albums. Please try again later.");
    }
}

async function main() {
    try {
        // Initialize playlist with a default folder
        await player.getSongs("defaultFolder");
        if (player.songs.length > 0) {
            player.playMusic(player.songs[0], true);
        }

        // Display albums
        await displayAlbums();

        // Attach global event listeners
        document.querySelector("#play").addEventListener("click", () => player.togglePlayPause());
        player.currentSong.addEventListener("timeupdate", () => player.updateTimeAndSeekbar());
        document.querySelector(".seekbar").addEventListener("click", (e) => player.seek(e));
        document.querySelector(".volume>img").addEventListener("click", (e) => player.toggleMute(e));

        // Previous and Next buttons
        document.querySelector("#previous").addEventListener("click", () => {
            let index = player.songs.indexOf(player.currentSong.src.split("/").pop());
            if (index > 0) {
                player.playMusic(player.songs[index - 1]);
            }
        });

        document.querySelector("#next").addEventListener("click", () => {
            let index = player.songs.indexOf(player.currentSong.src.split("/").pop());
            if (index < player.songs.length - 1) {
                player.playMusic(player.songs[index + 1]);
            }
        });

        // Volume control
        document.querySelector(".range input").addEventListener("change", (e) => {
            player.currentSong.volume = parseInt(e.target.value, 10) / 100;
            if (player.currentSong.volume > 0) {
                document.querySelector(".volume>img").src = "img/volume.svg";
            }
        });
    } catch (error) {
        console.error("Initialization error:", error);
        alert("Failed to initialize the music player.");
    }
}

main();
