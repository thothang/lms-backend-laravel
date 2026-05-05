<?php

namespace App\Services;

use App\Models\Ebook;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\EbookStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use FilippoToso\PdfWatermarker\Support\Pdf;
use FilippoToso\PdfWatermarker\Support\Position;
use FilippoToso\PdfWatermarker\Watermarks\TextWatermark;
use FilippoToso\PdfWatermarker\Facades\TextWatermarker;

class EbookWatermarkService
{
    /**
     * Stream ebook with watermark (đường chéo từ góc trên trái xuống góc dưới phải)
     * Sử dụng FPDI để in watermark chéo nhiều lần trên mỗi trang
     */
    public function streamWithWatermark(Ebook $ebook, User $user)
    {
        $filePath = Storage::disk('local')->path($ebook->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File không tồn tại'], 404);
        }

        // Tạo watermark text với thông tin user
        $dateStr = now()->format('d/m/Y');
        $watermarkText = sprintf(
            '%s (%s) - %s',
            $user->name,
            $user->email,
            $dateStr
        );

        // Cache key based on ebook, user, and date (watermark changes daily)
        $cacheKey = 'watermarked_pdf_' . $ebook->id . '_' . $user->id . '_' . $dateStr;
        $cachedPath = storage_path('app/cache/' . $cacheKey . '.pdf');

        // Check if cached file exists and is not too old (24 hours)
        if (file_exists($cachedPath) && (time() - filemtime($cachedPath)) < 86400) {
            \Log::info('Using cached watermarked PDF', ['ebook_id' => $ebook->id, 'user_id' => $user->id]);

            // Log download
            AuditLog::log(
                $user->id,
                'READ_EBOOK',
                'ebooks',
                $ebook->id,
                null,
                ['watermarked' => true, 'method' => 'FPDI_diagonal', 'cached' => true]
            );

            return response()->download($cachedPath, $ebook->title . '.pdf', [
                'Content-Type' => 'application/pdf',
                'Cache-Control' => 'public, max-age=3600',
            ]);
        }

        // Tạo file tạm
        $outputPath = storage_path('app/temp/watermarked_' . $ebook->id . '_' . $user->id . '_' . time() . '.pdf');
        $this->ensureTempDirectory(dirname($outputPath));
        $this->ensureTempDirectory(dirname($cachedPath));

        // Luôn sử dụng FPDI để in watermark chéo (pdf-watermarker không hỗ trợ in chéo nhiều lần)
        try {
            $this->addDiagonalWatermarkWithFpdi($filePath, $outputPath, $watermarkText);

            // Save to cache for future use
            copy($outputPath, $cachedPath);
            \Log::info('Cached watermarked PDF', ['ebook_id' => $ebook->id, 'user_id' => $user->id]);
        } catch (\Exception $e) {
            \Log::error('Watermark error: ' . $e->getMessage());
            return response()->json(['error' => 'Không thể tạo file PDF với watermark'], 500);
        }

        // Log download
        AuditLog::log(
            $user->id,
            'READ_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['watermarked' => true, 'method' => 'FPDI_diagonal', 'cached' => false]
        );

        // Return stream response
        if (file_exists($outputPath)) {
            return response()->download($outputPath, $ebook->title . '.pdf', [
                'Content-Type' => 'application/pdf',
                'Cache-Control' => 'public, max-age=3600',
            ])->deleteFileAfterSend(true);
        }

        // Nếu file không tồn tại (lỗi), trả về lỗi JSON
        return response()->json(['error' => 'Không thể tạo file PDF với watermark'], 500);
    }

    /**
     * In watermark CHÉO từ góc trên bên trái xuống góc dưới bên phải
     * Sử dụng FPDI cơ bản (không alpha transparency để tránh lỗi)
     */
    protected function addDiagonalWatermarkWithFpdi(string $sourcePath, string $outputPath, string $watermarkText): void
    {
        // Sử dụng FPDI cơ bản (không dùng TCPDF vì vấn đề setAlpha)
        $pdf = new \setasign\Fpdi\Fpdi();
        
        // TẮT auto page break để tránh FPDI tự sinh trang trắng thừa
        $pdf->SetAutoPageBreak(false, 0);
        
        // Thêm trang từ file PDF gốc
        $pageCount = $pdf->setSourceFile($sourcePath);

        $config = config('library.watermark');
        $fontSize = $config['font_size'] ?? 10;
        $color = $config['color'] ?? '#808080';
        
        // Parse màu từ hex (bỏ qua alpha)
        $rgb = $this->parseHexColor($color);
        
        for ($page = 1; $page <= $pageCount; $page++) {
            // Import trang gốc trước để lấy kích thước
            $tplIdx = $pdf->importPage($page);
            $size = $pdf->getTemplateSize($tplIdx);
            
            // Tạo trang mới với kích thước khớp trang gốc
            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplIdx, 0, 0, $size['width'], $size['height']);

            $pageWidth = $size['width'];
            $pageHeight = $size['height'];
            
            $pdf->SetFont('helvetica', '', $fontSize);
            $pdf->SetTextColor($rgb['r'], $rgb['g'], $rgb['b']);

            // Đường chéo 1: từ góc trên bên trái xuống góc dưới bên phải
            $this->drawDiagonalLine($pdf, $watermarkText, 0, 0, $pageWidth, $pageHeight, $fontSize);
            
            // Đường chéo 2: từ góc trên bên phải xuống góc dưới bên trái
            $this->drawDiagonalLine($pdf, $watermarkText, $pageWidth, 0, 0, $pageHeight, $fontSize);
        }

        $pdf->Output('F', $outputPath);
    }
    
    /**
     * Vẽ một đường chéo các watermark trên trang PDF (FPDI cơ bản - không xoay vì FPDI cơ bản không hỗ trợ)
     */
    protected function drawDiagonalLine($pdf, string $text, float $x1, float $y1, float $x2, float $y2, float $fontSize): void
    {
        $diagonal = sqrt(pow($x2 - $x1, 2) + pow($y2 - $y1, 2));
        $spacing = $fontSize * 6;  // Khoảng cách vừa phải giữa các dòng watermark
        $count = max(1, (int) ceil($diagonal / $spacing));
        
        $pageWidth = $pdf->GetPageWidth();
        $pageHeight = $pdf->GetPageHeight();
        
        // Tính chiều rộng cần thiết cho text
        $textWidth = $pdf->GetStringWidth($text) + 4;
        
        for ($i = 0; $i <= $count; $i++) {
            $ratio = $i / $count;
            $x = $x1 + $ratio * ($x2 - $x1);
            $y = $y1 + $ratio * ($y2 - $y1);
            
            // Giới hạn tọa độ trong vùng trang (cắt bỏ nếu vượt ra ngoài)
            if ($x < 0 || $x > $pageWidth - 5 || $y < 0 || $y > $pageHeight - 3) {
                continue;
            }
            
            $pdf->SetXY($x, $y);
            $pdf->Cell($textWidth, $fontSize, $text, 0, 0, 'L');
        }
    }
    
    /**
     * Parse hex color (hỗ trợ #RRGGBB hoặc #RRGGBBAA)
     */
    protected function parseHexColor(string $hex): array
    {
        $hex = ltrim($hex, '#');
        
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        return ['r' => $r, 'g' => $g, 'b' => $b];
    }

    /**
     * Stream ebook preview (không watermark, giới hạn số trang)
     */
    public function streamPreview(Ebook $ebook)
    {
        $filePath = Storage::disk('local')->path($ebook->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File không tồn tại'], 404);
        }

        $maxPages = $ebook->free_preview_pages ?? 5;

        // Giới hạn số trang preview
        $previewPath = storage_path('app/temp/preview_' . $ebook->id . '_' . time() . '.pdf');
        $this->ensureTempDirectory(dirname($previewPath));

        try {
            Pdf::input($filePath)
                ->output($previewPath)
                ->pageRange(1, $maxPages)
                ->save();
        } catch (\Exception $e) {
            // Fallback: copy trực tiếp hoặc dùng FPDI
            \Log::warning('Preview PDF error: ' . $e->getMessage());
            $this->extractPreviewPages($filePath, $previewPath, $maxPages);
        }

        return response()->download($previewPath, $ebook->title . '_preview.pdf', [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Extract preview pages using FPDI
     */
    protected function extractPreviewPages(string $sourcePath, string $outputPath, int $maxPages): void
    {
        $pdf = new \setasign\Fpdi\Fpdi();
        $pageCount = min($pdf->setSourceFile($sourcePath), $maxPages);

        for ($page = 1; $page <= $pageCount; $page++) {
            $pdf->AddPage();
            $tplIdx = $pdf->importPage($page);
            $pdf->useTemplate($tplIdx, 0, 0);
        }

        $pdf->Output('F', $outputPath);
    }

    /**
     * Thêm watermark với logo (image watermark)
     * LƯU Ý: Logo watermark nên dùng ->asBackground() vì PNG có nền trong suốt
     * Nhưng text watermark phải đặt LÊN TRÊN mới nhìn thấy được
     */
    public function streamWithLogoWatermark(Ebook $ebook, User $user, string $logoPath)
    {
        $filePath = Storage::disk('local')->path($ebook->file_path);
        
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'File không tồn tại'], 404);
        }

        // Tạo watermark text
        $watermarkText = sprintf(
            '%s (%s)',
            $user->name,
            now()->format('d/m/Y')
        );

        $outputPath = storage_path('app/temp/watermarked_logo_' . $ebook->id . '_' . $user->id . '_' . time() . '.pdf');
        $this->ensureTempDirectory(dirname($outputPath));

        try {
            // Sử dụng cả text và logo watermark
            $textWatermark = new TextWatermark($watermarkText);
            $textWatermark
                ->position(Position::BOTTOM_CENTER, 0, -30)
                ->size(10)
                ->color('#8080807F')
                ->angle(0);

            $imageWatermark = new \FilippoToso\PdfWatermarker\Watermarks\ImageWatermark($logoPath);
            $imageWatermark
                ->position(Position::MIDDLE_CENTER)
                ->opacity(0.2)
                ->asBackground();

            $pdf = new Pdf($filePath);
            $watermarker = new \FilippoToso\PdfWatermarker\PdfWatermarker($pdf, $textWatermark);
            $watermarker->addWatermark($imageWatermark);
            $watermarker->save($outputPath);
        } catch (\Exception $e) {
            \Log::warning('Logo watermark error: ' . $e->getMessage());
            // Fallback về text watermark
            return $this->streamWithWatermark($ebook, $user);
        }

        AuditLog::log(
            $user->id,
            'READ_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['watermarked' => true, 'type' => 'logo']
        );

        return response()->download($outputPath, $ebook->title . '.pdf', [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Lấy Position constant từ string config
     */
    protected function getPositionConstant(string $position): string
    {
        return match ($position) {
            'bottom_left' => Position::BOTTOM_LEFT,
            'bottom_right' => Position::BOTTOM_RIGHT,
            'top_left' => Position::TOP_LEFT,
            'top_right' => Position::TOP_RIGHT,
            'center' => Position::CENTER,
            default => Position::BOTTOM_RIGHT,
        };
    }

    /**
     * Đảm bảo thư mục temp tồn tại
     */
    protected function ensureTempDirectory(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}
