<?php

namespace App\Http\Controllers;

use App\Models\Checkpoint;
use App\Models\SpdDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use App\Services\OCRService;
use App\Services\SPDParserService;
use App\Services\CheckpointDetectorService;
use App\Services\QRCodeService;
use App\Services\SupabaseStorageService;
use App\Services\PersonDetectorService;
use App\Services\SPDCheckpointPdfService;

class CheckpointController extends Controller
{
    public function preview(
        $id,
        OCRService $ocr,
        SPDParserService $parser,
        CheckpointDetectorService $detector
    ) {

        $document = SpdDocument::findOrFail($id);

        $pdfPath = storage_path(
            'app/private/' .
                $document->file_asli
        );

        $text = $ocr->extractFromPdf($pdfPath);

        $spd = $parser->parse($text);

        $checkpoint = $detector->generate(
            $spd['tempat_berangkat'],
            [
                $spd['tempat_tujuan']
            ]
        );

        return response()->json([
            'spd' => $spd,
            'checkpoint' => $checkpoint
        ]);
    }

    public function generate(
        $id,
        OCRService $ocr,
        SPDParserService $parser,
        CheckpointDetectorService $detector,
        QRCodeService $qrService
    ) {

        $document = SpdDocument::findOrFail($id);

        $pdfPath = storage_path(
            'app/private/' .
                $document->file_asli
        );

        $text = $ocr->extractFromPdf($pdfPath);

        $spd = $parser->parse($text);

        $checkpointData = $detector->generate(
            $spd['tempat_berangkat'],
            [
                $spd['tempat_tujuan']
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Hapus checkpoint lama
        |--------------------------------------------------------------------------
        */
        Checkpoint::where(
            'spd_document_id',
            $document->id
        )->delete();

        /*
        |--------------------------------------------------------------------------
        | Simpan checkpoint baru + generate QR
        |--------------------------------------------------------------------------
        */
        foreach ($checkpointData['checkpoints'] as $item) {

            $checkpoint = Checkpoint::create([

                'spd_document_id' => $document->id,

                'urutan' => $item['urutan'],

                'jenis' => $item['jenis'],

                'lokasi' => $item['lokasi'],

                'lokasi_tujuan'   => $item['lokasi_tujuan'] ?? null,

                'status' => 'pending'
            ]);

            $qr = $qrService->generate($checkpoint);

            $checkpoint->qr_token = $qr['token'];
            $checkpoint->qr_image = $qr['image'];

            $checkpoint->save();
        }

        /*
        |--------------------------------------------------------------------------
        | Update jumlah checkpoint dokumen
        |--------------------------------------------------------------------------
        */
        $document->update([

            'checkpoint_count' =>
            $checkpointData['checkpoint_count']
        ]);

        return response()->json([

            'success' => true,

            'checkpoint_count' =>
            $checkpointData['checkpoint_count']
        ]);
    }

    public function list($id)
    {
        return Checkpoint::where(
            'spd_document_id',
            $id
        )
            ->orderBy('urutan')
            ->get();
    }


    public function detail(
        $id,
        SupabaseStorageService $storage
    ) {
        $checkpoint = Checkpoint::findOrFail($id);

        if ($checkpoint->qr_image) {
            $checkpoint->qr_url =
                $storage->getPublicUrl(
                    $checkpoint->qr_image
                );
        }

        return response()->json($checkpoint);
    }

    // public function findByToken($token)
    // {
    //     $checkpoint = Checkpoint::where(
    //         'qr_token',
    //         $token
    //     )->first();

    //     if (!$checkpoint) {

    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Checkpoint tidak ditemukan'
    //         ], 404);
    //     }

    //     if ($checkpoint->qr_image) {
    //         $checkpoint->qr_url = asset(
    //             'storage/' . $checkpoint->qr_image
    //         );
    //     }

    //     return response()->json(
    //         $checkpoint
    //     );
    // }

    public function findByToken($token, SupabaseStorageService $storage)
    {
        $checkpoint = Checkpoint::where('qr_token', $token)
            ->with('document')
            ->first();

        if (!$checkpoint) {
            return response()->json([
                'success' => false,
                'message' => 'Checkpoint tidak ditemukan'
            ], 404);
        }

        if ($checkpoint->qr_image) {
            $checkpoint->qr_url =
                $storage->getPublicUrl(
                    $checkpoint->qr_image
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Sertakan berita_acara_pdf dari checkpoint sebelumnya (urutan N-1)
        | agar frontend Step 3 (Rangkuman) bisa menampilkan preview PDF dasar.
        |
        | urutan 1 → tidak ada pendahulu → gunakan file_asli dari SpdDocument
        |            file_asli adalah storage path (bukan URL), generate URL
        |            Supabase via SupabaseStorageService::getPublicUrl()
        | urutan N → ambil berita_acara_pdf checkpoint urutan N-1
        |            (sudah berupa URL Supabase penuh, langsung pakai)
        |--------------------------------------------------------------------------
        */
        if ((int) $checkpoint->urutan <= 1) {
            $checkpoint->prev_berita_acara_pdf = $checkpoint->document
                ? $storage->getPublicUrl($checkpoint->document->file_asli)
                : null;
        } else {
            $previous = Checkpoint::where('spd_document_id', $checkpoint->spd_document_id)
                ->where('urutan', (int) $checkpoint->urutan - 1)
                ->first();

            $checkpoint->prev_berita_acara_pdf = $previous?->berita_acara_pdf ?? null;
        }

        return response()->json($checkpoint);
    }

    public function generateQr(
        $id,
        QRCodeService $qrService
    ) {

        Log::info(
            'Generate QR dipanggil',
            [
                'checkpoint_id' => $id
            ]
        );

        $checkpoint = Checkpoint::findOrFail($id);

        $qr = $qrService->generate($checkpoint);

        $checkpoint->update([

            'qr_token' => $qr['token'],

            'qr_image' => $qr['image']
        ]);

        return response()->json([

            'success' => true,

            'message' => 'QR berhasil dibuat',

            'checkpoint' => $checkpoint->fresh()
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | uploadQr — simpan foto fisik QR Code dari surat ke Supabase
    | Route: POST /api/checkpoints/upload-qr
    | Body:  token (string), qr_image (image file)
    |--------------------------------------------------------------------------
    */
    public function uploadQr(
        Request $request,
        SupabaseStorageService $storage
    ) {
        $request->validate([
            'token'    => 'required|string',
            'qr_image' => 'required|image|max:5120',
        ]);

        $checkpoint = Checkpoint::where('qr_token', $request->token)->first();

        if (!$checkpoint) {
            return response()->json([
                'success' => false,
                'message' => 'Checkpoint tidak ditemukan',
            ], 404);
        }

        $upload = $storage->upload(
            $request->file('qr_image'),
            'qr-scan'
        );

        $checkpoint->update([
            'qr_scan_image' => $upload['path'],
            'qr_scan_url'   => $upload['url'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Foto QR berhasil diunggah',
            'qr_url'  => $upload['url'],
            'checkpoint' => $checkpoint->fresh(),
        ]);
    }

    public function scan(
        Request $request,
        SupabaseStorageService $storage,
        PersonDetectorService $detector
    ) {

        $request->validate([

            'token' => 'required|string',

            'nama' => 'required|string',

            'nip' => 'required|string',

            'jabatan'  => 'nullable|string',

            'foto' => 'required|image',

            'latitude' => 'nullable',

            'longitude' => 'nullable',

            'catatan' => 'nullable|string',

        ]);

        $checkpoint = Checkpoint::where(
            'qr_token',
            $request->token
        )->first();

        if (!$checkpoint) {

            return response()->json([
                'success' => false,
                'message' => 'Checkpoint tidak ditemukan'
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Upload photo
        |--------------------------------------------------------------------------
        */
        $upload = $storage->upload(
            $request->file('foto')
        );

        /*
        |--------------------------------------------------------------------------
        | Update checkpoint
        |--------------------------------------------------------------------------
        */
        $jumlahOrang =
            $detector->detect(
                $upload['url']
            );

        Log::info(
            'YOLO RESULT',
            [
                'jumlah_orang' =>
                $jumlahOrang
            ]
        );

        $checkpoint->update([

            'nama' => $request->nama,

            'nip' => $request->nip,

            'jabatan'     => $request->jabatan,

            'foto_url' => $upload['url'],

            'jumlah_orang' => $jumlahOrang,

            'latitude' => $request->latitude,

            'longitude' => $request->longitude,

            'catatan' => $request->catatan,

            'waktu_scan' => now(),

            'status' => 'completed'
        ]);

        return response()->json([

            'success' => true,

            'message' => 'Checkpoint berhasil disimpan',

            'checkpoint' => $checkpoint->fresh()
        ]);
    }

    public function sign(
        Request $request,
        SupabaseStorageService $storage,
        SPDCheckpointPdfService $pdfService
    ) {
        $request->validate([
            'checkpoint_id' => 'required',
            'signature'     => 'required|image',
            'stamp'         => 'required|image',
        ]);

        $checkpoint = Checkpoint::findOrFail($request->checkpoint_id);

        /*
        |--------------------------------------------------------------------------
        | Upload TTD & Stempel
        |--------------------------------------------------------------------------
        */
        $signatureUpload = $storage->upload($request->file('signature'), 'signature');
        $stampUpload     = $storage->upload($request->file('stamp'), 'stamp');

        /*
        |--------------------------------------------------------------------------
        | Simpan TTD & stempel SEBELUM generate PDF
        | (PDF service membaca tanda_tangan_url & stempel_url dari DB)
        |--------------------------------------------------------------------------
        */
        $checkpoint->update([
            'tanda_tangan_url' => $signatureUpload['url'],
            'stempel_url'      => $stampUpload['url'],
            'signed_at'        => now(),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Generate PDF — base diambil dari berita_acara_pdf checkpoint sebelumnya
        | (urutan N-1). Jika urutan 1 atau belum ada, pakai file_asli.
        |--------------------------------------------------------------------------
        */
        $pdfPath = $pdfService->generate(
            $checkpoint->document,
            $checkpoint->fresh(),
            $storage,
            (int) $checkpoint->urutan
        );

        /*
        |--------------------------------------------------------------------------
        | Upload PDF ke Supabase & simpan URL
        |--------------------------------------------------------------------------
        */
        $pdfUpload = $storage->upload(
            new \Illuminate\Http\UploadedFile(
                $pdfPath,
                basename($pdfPath),
                'application/pdf',
                null,
                true
            ),
            'berita-acara'
        );

        $checkpoint->update([
            'berita_acara_pdf' => $pdfUpload['url'],
        ]);

        return response()->json([
            'success'    => true,
            'pdf_url'    => $pdfUpload['url'],
            'checkpoint' => $checkpoint->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | generateFinalPdf — render SEMUA checkpoint (download PDF final lengkap)
    |--------------------------------------------------------------------------
    */
    public function generateFinalPdf(
        $id,
        SPDCheckpointPdfService $service,
        SupabaseStorageService $storage
    ) {

        $document =
            SpdDocument::findOrFail($id);

        $checkpoint =
            Checkpoint::where(
                'spd_document_id',
                $id
            )
            ->where(
                'status',
                'completed'
            )
            ->latest()
            ->firstOrFail();

        // urutanTarget = null → render semua checkpoint sekaligus
        $pdfPath =
            $service->generate(
                $document,
                $checkpoint,
                $storage,
                null
            );

        return response()->download(
            $pdfPath
        );
    }

    /*
    |--------------------------------------------------------------------------
    | generateFinalPdfByUrutan — render SATU urutan saja
    | Route: GET /api/documents/{id}/checkpoints/{urutan}/pdf
    |--------------------------------------------------------------------------
    */
    public function generateFinalPdfByUrutan(
        $id,
        $urutan,
        SPDCheckpointPdfService $service,
        SupabaseStorageService $storage
    ) {

        $document =
            SpdDocument::findOrFail($id);

        $checkpoint =
            Checkpoint::where(
                'spd_document_id',
                $id
            )
            ->where(
                'urutan',
                $urutan
            )
            ->firstOrFail();

        $pdfPath =
            $service->generate(
                $document,
                $checkpoint,
                $storage,
                (int) $urutan
            );

        return response()->download(
            $pdfPath
        );
    }
}
