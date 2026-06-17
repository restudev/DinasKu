<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PersonDetectorService
{
    public function detect(string $imageUrl): int
    {
        Log::info('YOLO REQUEST', [
            'image_url' => $imageUrl
        ]);

        $response = Http::timeout(60)->post(
            'http://127.0.0.1:5000/detect-person',
            [
                'image_url' => $imageUrl
            ]
        );

        Log::info('YOLO RESPONSE', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);

        if (!$response->successful()) {
            return 0;
        }

        return (int) $response->json(
            'jumlah_orang'
        );
    }
}
