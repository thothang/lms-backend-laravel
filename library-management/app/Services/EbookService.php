<?php

namespace App\Services;

use App\Models\Ebook;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\EbookStatusChanged;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class EbookService
{
    /**
     * Upload a new ebook
     */
    public function uploadEbook(User $author, array $data, UploadedFile $file): array
    {
        // Validate file
        $maxSize = config('library.max_ebook_size', 52428800); // 50MB
        $allowedFormats = config('library.allowed_ebook_formats', ['pdf']);

        if ($file->getSize() > $maxSize) {
            return [
                'success' => false,
                'message' => 'File quá lớn (tối đa 50MB)',
            ];
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedFormats)) {
            return [
                'success' => false,
                'message' => 'Định dạng file không được hỗ trợ (chỉ chấp nhận PDF)',
            ];
        }

        // Store file privately
        $path = $file->store('ebooks/' . $author->id, 'private');

        // Create ebook record
        $ebook = Ebook::create([
            'title' => $data['title'],
            'author_id' => $author->id,
            'description' => $data['description'] ?? null,
            'price' => $data['price'] ?? 0,
            'file_path' => $path,
            'free_preview_pages' => $data['free_preview_pages'] ?? 0,
            'is_free' => $data['is_free'] ?? false,
            'status' => 'pending',
        ]);

        // Log action
        AuditLog::log(
            $author->id,
            'UPLOAD_EBOOK',
            'ebooks',
            $ebook->id,
            null,
            ['title' => $ebook->title]
        );

        return [
            'success' => true,
            'ebook_id' => $ebook->id,
        ];
    }

    /**
     * Approve an ebook
     */
    public function approveEbook(Ebook $ebook): void
    {
        $ebook->update(['status' => 'approved']);

        // Notify author
        Notification::create([
            'user_id' => $ebook->author_id,
            'title' => 'Ebook đã được duyệt',
            'content' => "Ebook '{$ebook->title}' đã được duyệt và sẵn sàng để bán.",
            'type' => 'web',
        ]);

        // Broadcast event
        broadcast(new EbookStatusChanged($ebook, 'approved'));
    }

    /**
     * Reject an ebook
     */
    public function rejectEbook(Ebook $ebook, string $reason): void
    {
        $ebook->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        // Notify author
        Notification::create([
            'user_id' => $ebook->author_id,
            'title' => 'Ebook bị từ chối',
            'content' => "Ebook '{$ebook->title}' đã bị từ chối. Lý do: {$reason}",
            'type' => 'web',
        ]);

        // Broadcast event
        broadcast(new EbookStatusChanged($ebook, 'rejected', $reason));
    }

    /**
     * Delete an ebook (soft delete)
     */
    public function deleteEbook(Ebook $ebook): void
    {
        // Delete file
        if ($ebook->file_path) {
            Storage::disk('private')->delete($ebook->file_path);
        }

        $ebook->delete();

        AuditLog::log(
            $ebook->author_id,
            'DELETE_EBOOK',
            'ebooks',
            $ebook->id,
            ['title' => $ebook->title],
            null
        );
    }
}
