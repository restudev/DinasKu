<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class SupabaseStorageService
{
    public function upload(
        UploadedFile $file,
        string $folder = 'spd'
    ) {
        $extension = $file->getClientOriginalExtension();
        $mimeType  = $file->getMimeType();
        $path      = $folder . '/' . uniqid() . '.' . $extension;

        $response = Http::withHeaders([
            'apikey'        => env('SUPABASE_SERVICE_KEY'),
            'Authorization' => 'Bearer ' . env('SUPABASE_SERVICE_KEY'),
            'Content-Type'  => $mimeType,
        ])->withBody(
            file_get_contents($file->getRealPath()),
            $mimeType
        )->post(
            env('SUPABASE_URL') . '/storage/v1/object/' . env('SUPABASE_BUCKET') . '/' . $path
        );

        if (!$response->successful()) {
            throw new \Exception($response->body());
        }

        return [
            'path' => $path,
            'url'  => $this->getPublicUrl($path),
        ];
    }

    public function getPublicUrl(string $path): string
    {
        return env('SUPABASE_URL')
            . '/storage/v1/object/public/'
            . env('SUPABASE_BUCKET')
            . '/'
            . $path;
    }

    /**
     * Download file dari Supabase menggunakan storage path (bukan URL penuh).
     * Contoh: "spd/abc123.pdf"
     */
    public function download(string $path): string
    {
        $url = $this->getPublicUrl($path);
        return $this->downloadFromUrl($url);
    }

    /**
     * Download file dari URL publik penuh (misalnya berita_acara_pdf).
     * Dipakai saat base PDF adalah hasil generate checkpoint sebelumnya.
     */
    public function downloadFromUrl(string $url): string
    {
        $contents = @file_get_contents($url);

        if ($contents === false) {
            throw new \Exception("Gagal mengunduh file dari URL: {$url}");
        }

        $ext      = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'pdf';
        $tempPath = storage_path('app/temp/' . uniqid('dl_') . '.' . $ext);

        if (!file_exists(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0777, true);
        }

        file_put_contents($tempPath, $contents);

        return $tempPath;
    }
}
