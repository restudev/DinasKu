<?php
namespace App\Services;

class CheckpointDetectorService
{
    public function generate(
        string $asal,
        array $tujuan
    ): array {
        $checkpoints = [];
        $urutan = 1;
        $lokasiSaatIni = $asal;

        foreach ($tujuan as $kota) {
            // Berangkat dari asal → ke tujuan
            $checkpoints[] = [
                'urutan'        => $urutan++,
                'jenis'         => 'berangkat',
                'lokasi'        => $lokasiSaatIni,
                'lokasi_tujuan' => $kota,          // ← tujuan pergi
            ];

            // Tiba di tujuan
            $checkpoints[] = [
                'urutan'        => $urutan++,
                'jenis'         => 'tiba',
                'lokasi'        => $kota,
                'lokasi_tujuan' => $lokasiSaatIni, // ← asal (untuk referensi)
            ];

            $lokasiSaatIni = $kota;
        }

        // Berangkat pulang dari tujuan → ke asal
        $checkpoints[] = [
            'urutan'        => $urutan++,
            'jenis'         => 'berangkat_pulang',
            'lokasi'        => $lokasiSaatIni,
            'lokasi_tujuan' => $asal,              // ← tujuan pulang
        ];

        // Tiba kembali di asal
        $checkpoints[] = [
            'urutan'        => $urutan++,
            'jenis'         => 'tiba_kembali',
            'lokasi'        => $asal,
            'lokasi_tujuan' => $lokasiSaatIni,     // ← dari mana pulang
        ];

        return [
            'checkpoint_count' => count($checkpoints),
            'checkpoints'      => array_slice($checkpoints, 0, 6),
        ];
    }
}
