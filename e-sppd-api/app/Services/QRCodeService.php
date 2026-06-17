<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    public function __construct(
        private SupabaseStorageService $storage
    ) {}

    public function generate($checkpoint): array
    {
        // Generate unique token for checkpoint
        $token = (string) Str::uuid();

        // URL that will be opened when the QR code is scanned
        $scanUrl = env('FRONTEND_URL', 'http://localhost:5173')
            . '/scan/'
            . $token;

        // Generate QR code as SVG string
        $svg = QrCode::format('svg')
        // $svg = QrCode::format('png')
            ->size(800)
            ->errorCorrection('H')   // High error correction — lebih mudah dibaca kamera
            ->margin(4)
            ->generate($scanUrl);

        // Tulis SVG ke file temp agar bisa diupload via SupabaseStorageService
        $tempPath = sys_get_temp_dir() . '/qr_' . $token . '.svg';
        file_put_contents($tempPath, $svg);

        try {
            // Bungkus sebagai UploadedFile agar kompatibel dengan SupabaseStorageService
            $uploadedFile = new UploadedFile(
                path: $tempPath,
                originalName: $token . '.svg',
                mimeType: 'image/svg+xml',
                error: null,
                test: true   // skip is_uploaded_file() check
            );

            $upload = $this->storage->upload($uploadedFile, 'qr');

            return [
                'token' => $token,
                'url'   => $scanUrl,
                'image' => $upload['path'],   // path di Supabase, mis. "qr/uuid.svg"
                'image_url' => $upload['url'], // URL publik Supabase
            ];
        } finally {
            // Selalu hapus file temp meski upload gagal
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }
}
