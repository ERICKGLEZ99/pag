<?php
// Listar archivos multimedia
$mediaFiles = [];
$mediaDir = 'media/';
$allowedExtensions = ['mp3', 'mp4', 'ogg', 'webm', 'wav'];

if (is_dir($mediaDir)) {
    foreach (scandir($mediaDir) as $file) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions)) {
            $mediaFiles[] = [
                'name' => $file,
                'path' => $mediaDir . $file,
                'type' => in_array($ext, ['mp3', 'wav', 'ogg']) ? 'audio' : 'video'
            ];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reproductor Multimedia</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <!-- Visualizador dinámico -->
        <div id="visualizador" class="visualizador">
            <div class="audio-default">
                <h3>Reproductor Multimedia</h3>
                <div class="wave"></div>
                <p>Selecciona un archivo para reproducir</p>
            </div>
        </div>
        
        <!-- Controles -->
        <div class="controles">
            <button id="btnPlay">▶</button>
            <button id="btnPause">⏸</button>
            <button id="btnStop">⏹</button>
            <input type="range" id="volume" min="0" max="1" step="0.1" value="0.7">
            <div id="timeDisplay">00:00 / 00:00</div>
        </div>
        
        <!-- Lista de archivos -->
        <div class="playlist">
            <h3>Archivos disponibles</h3>
            <ul id="fileList">
                <?php foreach ($mediaFiles as $file): ?>
                <li data-path="<?= htmlspecialchars($file['path']) ?>" data-type="<?= $file['type'] ?>">
                    <span class="filename"><?= htmlspecialchars($file['name']) ?></span>
                    <div class="file-actions">
                        <button class="download-btn" data-file="<?= htmlspecialchars($file['path']) ?>">↓</button>
                        <button class="delete-btn" data-file="<?= htmlspecialchars($file['name']) ?>">✕</button>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>
        
        <!-- Subir archivos -->
        <div class="upload-section">
            <h3>Subir nuevo archivo</h3>
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" name="mediaFile" accept=".mp3,.mp4,.ogg,.webm,.wav" required>
                <button type="submit">Subir</button>
            </form>
            <div id="uploadStatus"></div>
        </div>
    </div>

    <script src="script.js"></script>
    <div class="theme-toggle">
    <button id="themeButton">🌓 Tema</button>
</div>
</body>
</html>