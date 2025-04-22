<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$mediaDir = 'media/';
$allowedExtensions = ['mp3', 'mp4', 'ogg', 'webm', 'wav', 'vtt'];

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Método no permitido']));
}

if (!isset($_GET['file']) || empty($_GET['file'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Nombre de archivo no especificado']));
}

$fileName = basename($_GET['file']);
$filePath = $mediaDir . $fileName;
$fileType = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

// Validar tipo de archivo
if (!in_array($fileType, $allowedExtensions)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido']));
}

// Verificar existencia
if (!file_exists($filePath)) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'El archivo no existe']));
}

// Eliminar archivo
if (unlink($filePath)) {
    // Si era un archivo multimedia, intentar eliminar letras asociadas
    if (in_array($fileType, ['mp3', 'wav', 'ogg', 'mp4', 'webm'])) {
        $lyricsFile = $mediaDir . pathinfo($fileName, PATHINFO_FILENAME) . '.vtt';
        if (file_exists($lyricsFile)) {
            unlink($lyricsFile);
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'Archivo eliminado']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar el archivo']);
}
?>