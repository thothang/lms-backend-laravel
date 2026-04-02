<?php

namespace App\Services;

use App\Models\Ebook;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\EbookStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class EbookWatermarkService
{
    /**
     * Stream ebook with watermark
     */
    public function streamWithWatermark(Ebook $ebook, User $user)
    {
        $filePath = Storage::disk('private')->path($ebook->file_path);
        
        if (!file_exists($filePath)) {
            abort(404, 'File not found');
        }

        // Create temporary watermarked PDF
        $outputPath = storage_path('app/temp/watermarked_' . $ebook->id . '_' . $user->id . '_' . time() . '.pdf');
        
        // Ensure temp directory exists
        if (!is_dir(dirname($outputPath))) {
            mkdir(dirname($outputPath), 0755, true);
        }

        $this->addWatermarkToPdf($filePath, $outputPath, $user);

        // Log download
        AuditLog::log(
            $user->id,
            'READ_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['watermarked' => true]
        );

        // Return stream response
        return response()->download($outputPath, $ebook->title . '.pdf', [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
            'Pragma' => 'no-cache',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Add watermark to PDF
     */
    protected function addWatermarkToPdf(string $sourcePath, string $outputPath, User $user): void
    {
        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($sourcePath);

        $watermarkText = sprintf(
            'Doc boi: %s (%s) - Ngay: %s',
            $user->name,
            $user->email,
            now()->format('d/m/Y')
        );

        for ($page = 1; $page <= $pageCount; $page++) {
            $pdf->AddPage();
            $tplIdx = $pdf->importPage($page);
            $pdf->useTemplate($tplIdx, 0, 0);

            // Add watermark at bottom right
            $pdf->SetFont('helvetica', 'I', 8);
            $pdf->SetTextColor(128, 128, 128);
            $pdf->SetXY(10, $pdf->GetPageHeight() - 15);
            $pdf->Cell(0, 10, $watermarkText, 0, 0, 'R');
        }

        $pdf->Output('F', $outputPath);
    }
}
