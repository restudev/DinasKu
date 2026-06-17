<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\CheckpointController;
use setasign\Fpdi\Fpdi;

Route::post(
    '/documents',
    [DocumentController::class, 'store']
);

Route::get(
    '/documents/{id}',
    [DocumentController::class, 'show']
);

Route::get(
    '/documents/{id}/raw-text',
    [DocumentController::class, 'rawText']
);

Route::get(
    '/documents/{id}/parse',
    [DocumentController::class, 'parse']
);

Route::get(
    '/documents/{id}/summary',
    [DocumentController::class, 'summary']
);

Route::get(
    '/documents/{id}/checkpoints/preview',
    'App\Http\Controllers\CheckpointController@preview'
);

Route::post(
    '/documents/{id}/checkpoints/generate',
    'App\Http\Controllers\CheckpointController@generate'
);

Route::get(
    '/documents/{id}/checkpoints',
    'App\Http\Controllers\CheckpointController@list'
);

Route::post(
    '/checkpoints/scan',
    'App\Http\Controllers\CheckpointController@scan'
);

Route::post(
    '/checkpoints/{id}/generate-qr',
    'App\Http\Controllers\CheckpointController@generateQr'
);

Route::get(
    '/checkpoints/{id}',
    'App\Http\Controllers\CheckpointController@detail'
);

Route::get(
    '/documents',
    [DocumentController::class, 'index']
);

Route::get(
    '/checkpoints/token/{token}',
    [CheckpointController::class, 'findByToken']
);

Route::post(
    '/checkpoints/sign',
    [CheckpointController::class, 'sign']
);
Route::get(
    '/spd/{id}/final-pdf',
    [
        CheckpointController::class,
        'generateFinalPdf'
    ]
);
Route::get('/documents/{id}/checkpoints/{urutan}/pdf', [CheckpointController::class, 'generateFinalPdfByUrutan']);
