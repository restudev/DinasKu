<?php

namespace App\Http\Controllers;

use App\Models\SpdDocument;
use App\Services\OCRService;
use App\Services\SPDParserService;
use Illuminate\Http\Request;
use App\Services\SupabaseStorageService;
use App\Services\CheckpointDetectorService;
use App\Models\Checkpoint;
use App\Services\QRCodeService;

class DocumentController extends Controller
{
    public function index()
    {
        return SpdDocument::latest()->get();
    }
    public function store(
        Request $request,
        SupabaseStorageService $supabase,
        OCRService $ocr,
        SPDParserService $parser,
        CheckpointDetectorService $detector,
        QRCodeService $qrService
    ) {
        $request->validate([
            'pdf' => 'required|mimes:pdf|max:20480'
        ]);

        /*
    |--------------------------------------------------------------------------
    | Upload PDF ke Supabase
    |--------------------------------------------------------------------------
    */
        $upload = $supabase->upload(
            $request->file('pdf'),
            'spd'
        );

        /*
    |--------------------------------------------------------------------------
    | Download sementara untuk OCR
    |--------------------------------------------------------------------------
    */
        $pdfPath = $supabase->download(
            $upload['path']
        );

        /*
    |--------------------------------------------------------------------------
    | OCR PDF
    |--------------------------------------------------------------------------
    */
        $text = $ocr->extractFromPdf(
            $pdfPath
        );

        /*
    |--------------------------------------------------------------------------
    | Parse SPD
    |--------------------------------------------------------------------------
    */
        $data = $parser->parse(
            $text
        );

        /*
    |--------------------------------------------------------------------------
    | Simpan Dokumen SPD
    |--------------------------------------------------------------------------
    */
        $document = SpdDocument::create([

            'nomor_spd' =>
            $data['nomor_spd'] ?? null,

            'pegawai_nama' =>
            $data['pegawai_nama'] ?? null,

            'pegawai_nip' =>
            $data['pegawai_nip'] ?? null,

            'tempat_berangkat' =>
            $data['tempat_berangkat'] ?? null,

            'tempat_tujuan' =>
            $data['tempat_tujuan'] ?? null,

            'tanggal_berangkat' =>
            $data['tanggal_berangkat'] ?? null,

            'tanggal_kembali' =>
            $data['tanggal_kembali'] ?? null,

            'file_asli' =>
            $upload['path'],

            'status' =>
            'uploaded'
        ]);

        /*
    |--------------------------------------------------------------------------
    | Generate Checkpoint
    |--------------------------------------------------------------------------
    */
        $checkpointData = $detector->generate(
            $document->tempat_berangkat,
            [
                $document->tempat_tujuan
            ]
        );

        /*
    |--------------------------------------------------------------------------
    | Simpan Checkpoint + Generate QR
    |--------------------------------------------------------------------------
    */
        foreach (
            $checkpointData['checkpoints']
            as $item
        ) {

            $checkpoint = Checkpoint::create([

                'spd_document_id' =>
                $document->id,

                'urutan' =>
                $item['urutan'],

                'jenis' =>
                $item['jenis'],

                'lokasi' =>
                $item['lokasi'],

                'status' =>
                'pending'
            ]);

            $qr = $qrService->generate(
                $checkpoint
            );

            $checkpoint->update([

                'qr_token' =>
                $qr['token'],

                'qr_image' =>
                $qr['image']
            ]);
        }

        /*
    |--------------------------------------------------------------------------
    | Update jumlah checkpoint
    |--------------------------------------------------------------------------
    */
        $document->update([

            'checkpoint_count' =>
            $checkpointData['checkpoint_count']
        ]);

        return response()->json([

            'success' => true,

            'document' =>
            $document->fresh(),

            'checkpoint_count' =>
            $checkpointData['checkpoint_count'],

            'file_url' =>
            $upload['url']
        ]);
    }

    public function show($id, SupabaseStorageService $storage)
    {
        $document = SpdDocument::findOrFail($id);

        $document->file_url =
            $storage->getPublicUrl(
                $document->file_asli
            );

        return response()->json($document);
    }

    public function rawText(
        $id,
        OCRService $ocr
    ) {

        $document = SpdDocument::findOrFail($id);

        $pdfPath = storage_path(
            'app/private/' .
                $document->file_asli
        );

        return [
            'text' => $ocr->extractFromPdf(
                $pdfPath
            )
        ];
    }

    public function parse(
        $id,
        OCRService $ocr,
        SPDParserService $parser
    ) {

        $document = SpdDocument::findOrFail($id);

        $pdfPath = storage_path(
            'app/private/' .
                $document->file_asli
        );

        $text = $ocr->extractFromPdf(
            $pdfPath
        );

        $data = $parser->parse($text);

        $document->update([

            'nomor_spd' => $data['nomor_spd'] ?? null,

            'pegawai_nama' => $data['pegawai_nama'] ?? null,

            'pegawai_nip' => $data['pegawai_nip'] ?? null,

            'tempat_berangkat' => $data['tempat_berangkat'] ?? null,

            'tempat_tujuan' => $data['tempat_tujuan'] ?? null,

            'tanggal_berangkat' => $data['tanggal_berangkat'] ?? null,

            'tanggal_kembali' => $data['tanggal_kembali'] ?? null

        ]);

        return $document->fresh();
    }

    public function summary($id)
    {
        $document = SpdDocument::with(
            'checkpoints'
        )->findOrFail($id);

        return [

            'document' => $document,

            'checkpoint_total' =>
            $document->checkpoints
                ->count(),

            'completed' =>
            $document->checkpoints
                ->where(
                    'status',
                    'completed'
                )
                ->count()
        ];
    }
}
