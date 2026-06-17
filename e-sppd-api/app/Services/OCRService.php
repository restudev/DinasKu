<?php

namespace App\Services;

class OCRService
{
    public function extractFromPdf(string $pdfPath): string
    {
        $parser = new \Smalot\PdfParser\Parser();

        $pdf = $parser->parseFile($pdfPath);

        return $pdf->getText();
    }
}
