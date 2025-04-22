document.addEventListener('DOMContentLoaded', () => {
    const visualizador = document.getElementById('visualizador');
    const btnPlay = document.getElementById('btnPlay');
    const btnPause = document.getElementById('btnPause');
    const btnStop = document.getElementById('btnStop');
    const volumeControl = document.getElementById('volume');
    const timeDisplay = document.getElementById('timeDisplay');
    const fileList = document.getElementById('fileList');
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    
    let mediaElement = null;
    let audioContext = null;
    let analyser = null;
    
    // Cargar archivos desde la lista
    fileList.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            const filePath = item.getAttribute('data-path');
            const fileType = item.getAttribute('data-type');
            cargarMedia(filePath, fileType);
        });
    });
    
    // Controles
    btnPlay.addEventListener('click', () => {
        if (mediaElement) {
            mediaElement.play()
                .then(() => {
                    if (audioContext && audioContext.state === 'suspended') {
                        audioContext.resume();
                    }
                })
                .catch(error => {
                    console.error("Error al reproducir:", error);
                    showUploadStatus("Haz clic primero en el reproductor", false);
                });
        }
    });
    
    btnPause.addEventListener('click', () => mediaElement && mediaElement.pause());
    btnStop.addEventListener('click', detenerReproduccion);
    
    volumeControl.addEventListener('input', () => {
        if (mediaElement) mediaElement.volume = volumeControl.value;
    });
    
    // Descargar archivo
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filePath = btn.getAttribute('data-file');
            window.location.href = filePath;
        });
    });
    
    // Eliminar archivo
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const fileName = btn.getAttribute('data-file');
            
            if (confirm(`¿Eliminar permanentemente ${fileName}?`)) {
                try {
                    const response = await fetch(`delete.php?file=${encodeURIComponent(fileName)}`);
                    const result = await response.json();
                    
                    if (result.success) {
                        btn.closest('li').remove();
                        if (mediaElement && mediaElement.src.includes(fileName)) {
                            detenerReproduccion();
                            visualizador.innerHTML = `
                                <div class="audio-default">
                                    <h3>Reproductor Multimedia</h3>
                                    <div class="wave"></div>
                                    <p>Archivo eliminado, selecciona otro</p>
                                </div>
                            `;
                        }
                    } else {
                        showUploadStatus(result.message, false);
                    }
                } catch (error) {
                    console.error("Error al eliminar:", error);
                    showUploadStatus("Error al conectar con el servidor", false);
                }
            }
        });
    });
    
    // Subir archivo
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        
        try {
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showUploadStatus(result.message, true);
                addFileToList(result.file);
                uploadForm.reset();
            } else {
                showUploadStatus(result.message, false);
            }
        } catch (error) {
            console.error("Error al subir:", error);
            showUploadStatus("Error de conexión", false);
        }
    });
    
    function cargarMedia(filePath, fileType) {
        detenerReproduccion();
        visualizador.innerHTML = '';
        
        if (fileType === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.controls = true;
            visualizador.style.background = 'transparent';
            visualizador.appendChild(mediaElement);
        } else {
            mediaElement = document.createElement('audio');
            setupAudioVisualizer();
        }
        
        mediaElement.src = filePath;
        mediaElement.volume = volumeControl.value;
        visualizador.appendChild(mediaElement);
        
        mediaElement.addEventListener('timeupdate', updateTime);
        mediaElement.addEventListener('loadedmetadata', updateTime);
        mediaElement.addEventListener('play', setupAudioContext);
    }
    
    function setupAudioVisualizer() {
        const audioContainer = document.createElement('div');
        audioContainer.className = 'audio-container';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'audio-visualizer';
        
        audioContainer.appendChild(canvas);
        visualizador.appendChild(audioContainer);
        visualizador.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    }
    
    function setupAudioContext() {
        if (!window.AudioContext) return;
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioContext.createMediaElementSource(mediaElement);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        const canvas = document.querySelector('.audio-visualizer');
        if (canvas) {
            canvas.width = visualizador.clientWidth;
            canvas.height = 100;
            drawVisualizer(canvas, analyser);
        }
    }
    
    function drawVisualizer(canvas, analyser) {
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                const hue = i / bufferLength * 120 + 180;
                
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
        
        draw();
    }
    
    function updateTime() {
        if (!mediaElement) return;
        
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        };
        
        timeDisplay.textContent = 
            `${formatTime(mediaElement.currentTime)} / ${formatTime(mediaElement.duration)}`;
    }
    
    function addFileToList(fileInfo) {
        const li = document.createElement('li');
        li.setAttribute('data-path', fileInfo.path);
        li.setAttribute('data-type', fileInfo.type);
        
        li.innerHTML = `
            <span class="filename">${fileInfo.name}</span>
            <div class="file-actions">
                <button class="download-btn" data-file="${fileInfo.path}">↓</button>
                <button class="delete-btn" data-file="${fileInfo.name}">✕</button>
            </div>
        `;
        
        li.addEventListener('click', () => {
            cargarMedia(fileInfo.path, fileInfo.type);
        });
        
        li.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = fileInfo.path;
        });
        
        li.querySelector('.delete-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`¿Eliminar permanentemente ${fileInfo.name}?`)) {
                try {
                    const response = await fetch(`delete.php?file=${encodeURIComponent(fileInfo.name)}`);
                    const result = await response.json();
                    
                    if (result.success) {
                        li.remove();
                    } else {
                        showUploadStatus(result.message, false);
                    }
                } catch (error) {
                    console.error("Error al eliminar:", error);
                    showUploadStatus("Error de conexión", false);
                }
            }
        });
        
        fileList.prepend(li);
    }
    
    function detenerReproduccion() {
        if (mediaElement) {
            mediaElement.pause();
            mediaElement.currentTime = 0;
            mediaElement.src = '';
            mediaElement = null;
        }
        
        if (audioContext) {
            audioContext.close();
            audioContext = null;
            analyser = null;
        }
        
        timeDisplay.textContent = '00:00 / 00:00';
    }
    
    function showUploadStatus(message, isSuccess) {
        uploadStatus.textContent = message;
        uploadStatus.className = isSuccess ? 'success' : 'error';
        uploadStatus.style.display = 'block';
        
        setTimeout(() => {
            uploadStatus.style.opacity = '0';
            setTimeout(() => {
                uploadStatus.style.display = 'none';
                uploadStatus.style.opacity = '1';
            }, 300);
        }, 5000);
    
    }
    // Cambio de tema (añadir esto al final del archivo)
document.getElementById('themeButton').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    // Guardar preferencia en localStorage
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// Cargar tema guardado al iniciar
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
}
// Previsualización de archivos
function setupFilePreview() {
    const fileInput = document.querySelector('input[type="file"]');
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';
    uploadForm.prepend(previewContainer);

    fileInput.addEventListener('change', (e) => {
        previewContainer.innerHTML = '';
        if (fileInput.files[0].type.includes('image')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(fileInput.files[0]);
            img.style.maxHeight = '100px';
            previewContainer.appendChild(img);
        }
    });
}

// Sistema de rating
function initRatingSystem() {
    const ratingHTML = `
        <div class="rating">
            ${[1,2,3,4,5].map(i => `<span data-value="${i}">☆</span>`).join('')}
        </div>`;
    visualizador.insertAdjacentHTML('beforeend', ratingHTML);

    document.querySelectorAll('.rating span').forEach(star => {
        star.addEventListener('click', function() {
            const value = this.dataset.value;
            localStorage.setItem(`rating_${currentFile}`, value);
            updateStars(value);
        });
    });
}

function updateStars(rating) {
    document.querySelectorAll('.rating span').forEach((star, i) => {
        star.textContent = i < rating ? '★' : '☆';
    });
}
// Atajos de teclado
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') togglePlay();
        if (e.key === 'ArrowRight') seek(5);
        if (e.key === 'ArrowLeft') seek(-5);
        if (e.key === 'f') toggleFullscreen();
    });
}

// Sleep Timer
function setupSleepTimer() {
    const timerHTML = `
        <div class="sleep-timer">
            <select id="timerSelect">
                <option value="0">Off</option>
                <option value="5">5 min</option>
                <option value="30">30 min</option>
            </select>
        </div>`;
    document.querySelector('.controles').insertAdjacentHTML('beforeend', timerHTML);

    document.getElementById('timerSelect').addEventListener('change', function() {
        if (this.value > 0) {
            setTimeout(() => {
                mediaElement.pause();
                showNotification(`Sleep timer: Player stopped`);
            }, this.value * 60000);
        }
    });
}
// Visualizador de ondas
function initWaveformVisualizer() {
    const canvas = document.createElement('canvas');
    canvas.className = 'waveform';
    visualizador.appendChild(canvas);

    // Implementación similar al equalizador pero para forma de onda
    // usando analyser.getByteTimeDomainData()
}

// Sincronización de letras
function loadLyrics() {
    if (!currentFile) return;
    
    const lrcFile = currentFile.replace(/\.[^/.]+$/, '.lrc');
    fetch(lrcFile)
        .then(response => response.text())
        .then(parseLRCFile);
}

function parseLRCFile(text) {
    // Implementación del parser de archivos .lrc
}
    
 
});
