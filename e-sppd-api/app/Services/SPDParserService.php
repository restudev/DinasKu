<?php

namespace App\Services;

class SPDParserService
{
    private function clean(string $value): string
    {
        return preg_replace('/\s+/', ' ', trim($value));
    }

    private function parseTanggal(string $tanggal): ?string
    {
        $bulan = [
            'Januari'   => '01',
            'Februari'  => '02',
            'Maret'     => '03',
            'April'     => '04',
            'Mei'       => '05',
            'Juni'      => '06',
            'Juli'      => '07',
            'Agustus'   => '08',
            'September' => '09',
            'Oktober'   => '10',
            'November'  => '11',
            'Desember'  => '12',
        ];

        $tanggal = $this->clean($tanggal);

        if (preg_match('/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/', $tanggal, $m)) {
            $hari  = str_pad($m[1], 2, '0', STR_PAD_LEFT);
            $bulanNama = $m[2];
            $tahun = $m[3];

            if (isset($bulan[$bulanNama])) {
                return "{$tahun}-{$bulan[$bulanNama]}-{$hari}";
            }
        }

        return null;
    }

    private function tryPatterns(string $text, array $patterns): string
    {
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $value = $this->clean($m[1]);

                if ($value !== '') {
                    return $value;
                }
            }
        }

        return '';
    }

    private function detectKnownCity(string $text): string
    {
        $cities = [
            'Semarang',
            'Salatiga',
            'Surakarta',
            'Solo',
            'Yogyakarta',
            'Magelang',
            'Kudus',
            'Jepara',
            'Demak',
            'Tegal',
            'Pekalongan',
            'Purwokerto',
            'Boyolali',
            'Klaten',
            'Sragen',
            'Wonogiri',
            'Karanganyar',
            'Temanggung',
            'Wonosobo',
            'Banjarnegara',
            'Purbalingga',
            'Cilacap',
            'Kebumen',
            'Purworejo',
        ];

        foreach ($cities as $city) {
            if (preg_match('/\b' . preg_quote($city, '/') . '\b/i', $text)) {
                return $city;
            }
        }

        return '';
    }

    public function parse(string $text): array
    {
        $data = [];

        // Nomor SPD
        preg_match('/Nomor\s*:\s*([^\n]+)/i', $text, $nomor);

        $data['nomor_spd'] = $this->clean(
            $nomor[1] ?? ''
        );

        // Nama pegawai
        preg_match(
            '/melaksanakan perjalanan dinas\s+(.*?)\s+NIP\./is',
            $text,
            $pegawai
        );

        $data['pegawai_nama'] = $this->clean(
            $pegawai[1] ?? ''
        );

        // NIP
        preg_match('/NIP\.\s*([0-9 ]+)/i', $text, $nip);

        $data['pegawai_nip'] = preg_replace(
            '/\s+/',
            '',
            $nip[1] ?? ''
        );

        // Tempat berangkat
        $data['tempat_berangkat'] = 'Semarang';

        // Tempat tujuan
        $data['tempat_tujuan'] = $this->tryPatterns($text, [

            // Format SPD normal
            '/a\.\s*Semarang\s*b\.\s*(.*?)\s*(?:\n\s*7\.|\n\s*7\s|\s7\.)/is',

            // OCR multiline
            '/a\.\s*Semarang[\s\S]{0,15}b\.\s*([\w\s,.\-]+?)[\r\n]/i',

            // OCR dengan "Ke:"
            '/Ke\s*:?\s*([\w\s,.\-]+?)(?:\n|Pada|Tanggal)/i',

            // Ambil isi setelah b.
            '/\bb\.\s*([A-Za-z][^\n\r]{2,60})/i',
        ]);

        // Fallback kota
        if (empty($data['tempat_tujuan'])) {
            $data['tempat_tujuan'] = $this->detectKnownCity($text);
        }

        // Tanggal berangkat
        $data['tanggal_berangkat'] = $this->parseTanggal(
            $this->tryPatterns($text, [
                '/\bb\.\s*(\d{1,2}\s+\w+\s+\d{4})/i',
            ])
        );

        // Tanggal kembali
        $data['tanggal_kembali'] = $this->parseTanggal(
            $this->tryPatterns($text, [
                '/\bc\.\s*(\d{1,2}\s+\w+\s+\d{4})/i',
            ])
        );

        return $data;
    }
}
