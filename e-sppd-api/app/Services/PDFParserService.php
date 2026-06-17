<?php

namespace App\Services;

use Smalot\PdfParser\Parser;

class PDFParserService
{
    public function extractText(string $pdfPath): string
    {
        $parser = new Parser();

        $pdf = $parser->parseFile($pdfPath);

        return $pdf->getText();
    }
}
