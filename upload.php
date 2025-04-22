<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$targetDir = "media/";
$allowedTypes = ['mp3', 'mp4', 'ogg', 'webm', 'wav', 'vtt'];
$maxFileSize = 50 * 1024 * 1024; // 50MB

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Método no permitido']));
}

if (!isset($_FILES['mediaFile']) || $_FILES['mediaFile']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Error en la subida del archivo']));
}

$file = $_FILES['mediaFile'];
$fileName = basename($file['name']);
$targetFile = $targetDir . $fileName;
$fileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));

// Validaciones
if (!in_array($fileType, $allowedTypes)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido']));
}

if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'El archivo excede el límite de 50MB']));
}

// Crear directorio si no existe
if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0777, true)) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'No se pudo crear el directorio']));
    }
}

// Mover archivo
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    $response = [
        'success' => true,
        'message' => 'Archivo subido correctamente',
        'file' => [
            'name' => $fileName,
            'path' => $targetFile,
            'type' => in_array($fileType, ['mp3', 'wav', 'ogg']) ? 'audio' : 'video'
        ]
    ];
    
    // Si es un archivo multimedia, verificar si hay letras
    if (in_array($fileType, ['mp3', 'wav', 'ogg', 'mp4', 'webm'])) {
        $lyricsFile = $targetDir . pathinfo($fileName, PATHINFO_FILENAME) . '.vtt';
        if (file_exists($lyricsFile)) {
            $response['file']['lyrics'] = $lyricsFile;
        }
    }
    
    echo json_encode($response);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al mover el archivo']);
}
?>