<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    public function generate($checkpoint)
    {
        // Generate unique token for checkpoint
        $token = (string) Str::uuid();

        // URL that will be opened when the QR code is scanned
        $scanUrl =
            env('FRONTEND_URL', 'http://localhost:5173')
            . '/scan/'
            . $token;

        // QR image file path
        $fileName = 'qr/' . $token . '.svg';

        // Generate QR code containing the scan URL
        $svg = QrCode::format('svg')
            ->size(300)
            ->generate($scanUrl);

        // Store QR image in storage/app/public/qr
        Storage::disk('public')->put(
            $fileName,
            $svg
        );

        return [
            'token' => $token,
            'url'   => $scanUrl,
            'image' => $fileName
        ];
    }
}
