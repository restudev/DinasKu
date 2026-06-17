<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;
use App\Models\SpdDocument;
use App\Models\Checkpoint;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * SPDCheckpointPdfService
 *
 * Setiap urutan di-overlay di atas PDF hasil urutan sebelumnya:
 *   urutan 1 → base: file_asli           → output: berita_acara_pdf cp-1
 *   urutan 2 → base: berita_acara_pdf cp-1 → output: berita_acara_pdf cp-2
 *   urutan 3 → base: berita_acara_pdf cp-2 → output: berita_acara_pdf cp-3
 *   dst.
 *
 * Jika urutanTarget = null (generateFinalPdf), semua checkpoint di-overlay
 * secara berantai mulai dari file_asli.
 */
class SPDCheckpointPdfService
{
    // ── Batas kolom (mm) ──────────────────────────────────────────────────
    private const LEFT_X  = 16.04;
    private const LEFT_W  = 87.32;
    private const RIGHT_X = 103.53;
    private const RIGHT_W = 92.35;

    private const LEFT_CX  = self::LEFT_X  + self::LEFT_W  / 2;
    private const RIGHT_CX = self::RIGHT_X + self::RIGHT_W / 2;

    // ── Ukuran gambar ─────────────────────────────────────────────────────
    private const STEMPEL_W = 34.0;
    private const STEMPEL_H = 34.0;
    private const TTD_W     = 44.0;
    private const TTD_H     = 28.0;

    private const STEMPEL_X_LEFT  = self::LEFT_CX  - 20;
    private const TTD_X_LEFT      = self::STEMPEL_X_LEFT  + 12;
    private const STEMPEL_X_RIGHT = self::RIGHT_CX - 20;
    private const TTD_X_RIGHT     = self::STEMPEL_X_RIGHT + 12;

    // ── Posisi nilai teks ─────────────────────────────────────────────────
    private const VAL_X_LEFT  = 56.0;
    private const VAL_X_RIGHT = 148.0;
    private const VAL_W_LEFT  = 45.0;
    private const VAL_W_RIGHT = 46.0;

    private const NAMA_NIP_H = 12.0;

    // ── ROWS ──────────────────────────────────────────────────────────────
    // Format: [y_top, y_bot, y_tiba_kiri, y_tgl_kiri, y_brgkt_kanan, y_ke_kanan, y_tgl_kanan]
    // null = kolom tersebut tidak dirender untuk checkpoint ini
    //
    // urutan 1 → Section I  kolom KANAN  (Berangkat dari KPA)
    // urutan 2 → Section II kolom KIRI   (Tiba di tujuan pertama)
    // urutan 3 → Section II kolom KANAN  (Berangkat dari tujuan pertama)
    // urutan 4 → Section III kolom KIRI  (Tiba di tujuan kedua)
    // urutan 5 → Section III kolom KANAN (Berangkat dari tujuan kedua)
    // urutan 6 → Section IV kolom KIRI   (Tiba di tempat kedudukan)
    private const ROWS = [
        0 => [11.41,  77.03,  null,   null,   11.41,  19.53, 23.56],   // kanan saja
        1 => [77.03,  133.99, 77.03,  81.10,  null,   null,  null],    // kiri saja
        2 => [77.03,  133.99, null,   null,   77.03,  82.62, 88.21],   // kanan saja
        3 => [133.99, 190.94, 133.99, 138.05, null,   null,  null],    // kiri saja
        4 => [133.99, 190.94, null,   null,   133.99, 139.57, 145.16], // kanan saja
        5 => [190.94, 255.97, 190.94, 199.06, null,   null,  null],    // kiri saja
    ];

    // ─────────────────────────────────────────────────────────────────────
    /**
     * Generate PDF.
     *
     * @param int|null $urutanTarget  1-based. null = render semua (chained).
     *
     * Mode urutan tunggal (sign endpoint):
     *   - Cari checkpoint urutan (urutanTarget - 1) untuk mendapat base PDF.
     *   - Jika tidak ada (urutan 1), gunakan file_asli.
     *
     * Mode semua (generateFinalPdf):
     *   - Loop semua checkpoint ordered by urutan, chain satu per satu.
     */
    public function generate(
        SpdDocument            $document,
        Checkpoint             $checkpoint,   // checkpoint yang baru saja di-sign
        SupabaseStorageService $storage,
        ?int                   $urutanTarget = null
    ): string {

        if ($urutanTarget !== null) {
            // ── Mode tunggal ──────────────────────────────────────────
            $basePdfPath = $this->resolveBasePdf($document, $urutanTarget, $storage);

            $cp = Checkpoint::where('spd_document_id', $document->id)
                ->where('urutan', $urutanTarget)
                ->firstOrFail();

            return $this->renderOne($basePdfPath, $cp);
        } else {
            // ── Mode semua (chain) ────────────────────────────────────
            $checkpoints = Checkpoint::where('spd_document_id', $document->id)
                ->whereNotNull('tanda_tangan_url')   // hanya yang sudah sign
                ->orderBy('urutan')
                ->get();

            $currentBase = $storage->download($document->file_asli);

            foreach ($checkpoints as $cp) {
                $rowIdx = (int) $cp->urutan - 1;
                if (!isset(self::ROWS[$rowIdx])) continue;
                $currentBase = $this->renderOne($currentBase, $cp);
            }

            return $currentBase;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    /**
     * Tentukan PDF base untuk urutan tertentu:
     *   - urutan 1 → file_asli
     *   - urutan N → berita_acara_pdf checkpoint urutan N-1
     *     (jika belum ada, fallback ke file_asli)
     */
    private function resolveBasePdf(
        SpdDocument            $document,
        int                    $urutanTarget,
        SupabaseStorageService $storage
    ): string {

        if ($urutanTarget <= 1) {
            // Tidak ada pendahulu — pakai PDF asli
            return $storage->download($document->file_asli);
        }

        $previous = Checkpoint::where('spd_document_id', $document->id)
            ->where('urutan', $urutanTarget - 1)
            ->first();

        if ($previous && $previous->berita_acara_pdf) {
            // Unduh PDF hasil checkpoint sebelumnya
            return $storage->downloadFromUrl($previous->berita_acara_pdf);
        }

        // Fallback — checkpoint sebelumnya belum punya PDF
        Log::warning("SPDPdf: checkpoint urutan " . ($urutanTarget - 1) . " belum memiliki berita_acara_pdf. Fallback ke file_asli.");
        return $storage->download($document->file_asli);
    }

    // ─────────────────────────────────────────────────────────────────────
    /**
     * Overlay satu checkpoint ke PDF base, return path file output.
     */
    private function renderOne(string $sourcePdfPath, Checkpoint $cp): string
    {
        $rowIdx = (int) $cp->urutan - 1;
        if (!isset(self::ROWS[$rowIdx])) {
            return $sourcePdfPath; // tidak ada row → kembalikan as-is
        }

        $pdf = new Fpdi();
        $pdf->SetAutoPageBreak(false);
        $pageCount = $pdf->setSourceFile($sourcePdfPath);

        for ($p = 1; $p < $pageCount; $p++) {
            $tpl  = $pdf->importPage($p);
            $size = $pdf->getTemplateSize($tpl);
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tpl);
        }

        // Halaman terakhir — tempat overlay checkpoint
        $tpl  = $pdf->importPage($pageCount);
        $size = $pdf->getTemplateSize($tpl);
        $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
        $pdf->useTemplate($tpl);

        $this->overlayRow($pdf, $cp, self::ROWS[$rowIdx]);

        $dir = storage_path('app/temp');
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $output = $dir . '/spd-cp' . $cp->urutan . '-' . time() . '.pdf';
        $pdf->Output('F', $output);

        return $output;
    }

    // =========================================================================
    private function overlayRow(Fpdi $pdf, Checkpoint $cp, array $row): void
    {
        [$yTop, $yBot, $yTibaKiri, $yTglKiri, $yBrgktKanan, $yKeKanan, $yTglKanan] = $row;

        $tanggal = $cp->waktu_scan
            ? Carbon::parse($cp->waktu_scan)->translatedFormat('d F Y')
            : '-';
        $tanggalKembali = $cp->waktu_scan
            ? Carbon::parse($cp->waktu_scan)->addDay()->translatedFormat('d F Y')
            : '-';

        $pdf->SetTextColor(0, 0, 0);

        if ($yTibaKiri !== null) {
            $this->renderKolom(
                $pdf,
                $cp,
                $yBot,
                self::LEFT_X,
                self::LEFT_W,
                self::STEMPEL_X_LEFT,
                self::TTD_X_LEFT,
                self::VAL_X_LEFT,
                self::VAL_W_LEFT,
                $yTibaKiri,
                $yTglKiri,
                $tanggal
            );
        }

        if ($yBrgktKanan !== null) {
            $this->renderKolom(
                $pdf,
                $cp,
                $yBot,
                self::RIGHT_X,
                self::RIGHT_W,
                self::STEMPEL_X_RIGHT,
                self::TTD_X_RIGHT,
                self::VAL_X_RIGHT,
                self::VAL_W_RIGHT,
                $yBrgktKanan,
                $yTglKanan,
                $tanggalKembali,
                $yKeKanan
            );
        }
    }

    // =========================================================================
    private function renderKolom(
        Fpdi       $pdf,
        Checkpoint $cp,
        float      $yBot,
        float $colX,
        float $colW,
        float $stempelX,
        float $ttdX,
        float $valX,
        float $valW,
        float $yNilai,
        float $yTgl,
        string $tanggal,
        ?float $yKe = null
    ): void {
        $pdf->SetFont('Arial', '', 8.5);
        Log::info('PDF DEBUG', [
            'checkpoint_id' => $cp->id,
            'urutan' => $cp->urutan,
            'lokasi' => $cp->lokasi,
            'lokasi_tujuan' => $cp->lokasi_tujuan,
        ]);
        $pdf->SetXY($valX, $yNilai);
        $pdf->Cell($valW, 4.5, $cp->lokasi ?? '-', 0, 0, 'L');

        if ($yKe !== null) {
            $pdf->SetXY($valX, $yKe);
            $pdf->Cell($valW, 4.5, $cp->lokasi_tujuan ?? '-', 0, 0, 'L');
        }

        $pdf->SetXY($valX, $yTgl);
        $pdf->Cell($valW, 4.5, $tanggal, 0, 0, 'L');

        $yJab = $yTgl + 7.0;
        $pdf->SetFont('Arial', '', 7.5);
        $pdf->SetXY($colX + 2, $yJab);
        $jabatan = $cp->jabatan ?? 'Kasubbag TU Pimpinan dan Kepegawaian Sekretariat';
        $pdf->MultiCell($colW - 4, 3.8, $jabatan . "\n" . 'Setda ' . ($cp->lokasi ?? ''), 0, 'C');

        $ySetelahJab = $yJab + 7.6;
        $yImg = $ySetelahJab + 1.0;
        if ($yImg + self::STEMPEL_H + self::NAMA_NIP_H > $yBot) {
            $yImg = $yBot - self::STEMPEL_H - self::NAMA_NIP_H;
        }

        $this->placeImage($pdf, $cp->stempel_url, $stempelX, $yImg, self::STEMPEL_W, self::STEMPEL_H);

        $yTtd = $yImg + (self::STEMPEL_H - self::TTD_H) / 2;
        $this->placeImage($pdf, $cp->tanda_tangan_url, $ttdX, $yTtd, self::TTD_W, self::TTD_H);

        $yNama = $yImg + self::STEMPEL_H + 1.0;
        $pdf->SetFont('Arial', 'U', 8.5);
        $pdf->SetXY($colX + 5, $yNama);
        $pdf->MultiCell($colW - 10, 3.5, strtoupper($cp->nama ?? '-'), 0, 'C');

        $yNip = $yNama + 4.5;
        $pdf->SetFont('Arial', '', 8.0);
        $pdf->SetXY($colX, $yNip);
        $pdf->Cell($colW, 4.5, 'NIP. ' . ($cp->nip ?? '-'), 0, 0, 'C');
    }

    // =========================================================================
    private function placeImage(Fpdi $pdf, ?string $url, float $x, float $y, float $w, float $h): void
    {
        if (!$url) return;
        try {
            $content = @file_get_contents($url);
            if (!$content) return;
            $ext = preg_match('/\.(jpe?g)(\?|$)/i', $url) ? 'jpg' : 'png';
            $tmp = storage_path('app/temp/img_' . uniqid() . '.' . $ext);
            file_put_contents($tmp, $content);
            $pdf->Image($tmp, $x, $y, $w, $h);
            @unlink($tmp);
        } catch (\Throwable $e) {
            Log::warning('SPDPdf image error: ' . $e->getMessage());
        }
    }
}
