<?php

use Illuminate\Support\Facades\Route;
use setasign\Fpdi\Fpdi;
use App\Services\SupabaseStorageService;
use App\Models\SpdDocument;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/test-fpdi', function () {

    $pdf = new Fpdi();

    return 'FPDI OK';
});

Route::get('/test-spd', function (
    SupabaseStorageService $storage
) {

    $document = SpdDocument::first();

    $tempPdf = $storage->download(
        $document->file_asli
    );

    $pdf = new Fpdi();

    $pages = $pdf->setSourceFile(
        $tempPdf
    );

    return [
        'pdf' => $tempPdf,
        'pages' => $pages
    ];
});
Route::get('/test-checkpoint', function () {
    return \App\Models\Checkpoint::first();
});


