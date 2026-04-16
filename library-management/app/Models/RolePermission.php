<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RolePermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'librarian_id',
        'can_approve_ebook',
        'can_manage_finance',
        'can_manage_users',
        'can_manage_books',
        'can_manage_borrow_offline',
        'can_manage_reservations',
        'can_mark_lost_books',
        'can_view_reports',
        'can_manage_hot_books',
        'can_manage_messages',
    ];

    protected function casts(): array
    {
        return [
            'can_approve_ebook' => 'boolean',
            'can_manage_finance' => 'boolean',
            'can_manage_users' => 'boolean',
            'can_manage_books' => 'boolean',
            'can_manage_borrow_offline' => 'boolean',
            'can_manage_reservations' => 'boolean',
            'can_mark_lost_books' => 'boolean',
            'can_view_reports' => 'boolean',
            'can_manage_hot_books' => 'boolean',
            'can_manage_messages' => 'boolean',
        ];
    }

    // All permission columns
    public const PERMISSION_COLUMNS = [
        'can_approve_ebook',
        'can_manage_finance',
        'can_manage_users',
        'can_manage_books',
        'can_manage_borrow_offline',
        'can_manage_reservations',
        'can_mark_lost_books',
        'can_view_reports',
        'can_manage_hot_books',
        'can_manage_messages',
    ];

    // Relationships
    public function librarian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'librarian_id');
    }

    // Check if has a specific permission
    public function hasPermission(string $permission): bool
    {
        if (!in_array($permission, self::PERMISSION_COLUMNS)) {
            return false;
        }

        return $this->{$permission} ?? false;
    }

    // Get all permissions as array
    public function getAllPermissions(): array
    {
        $permissions = [];
        
        foreach (self::PERMISSION_COLUMNS as $column) {
            $permissions[$column] = $this->{$column} ?? false;
        }
        
        return $permissions;
    }

    // Set multiple permissions at once
    public function setPermissions(array $permissions): void
    {
        foreach (self::PERMISSION_COLUMNS as $column) {
            if (isset($permissions[$column])) {
                $this->{$column} = (bool) $permissions[$column];
            }
        }
        
        $this->save();
    }

    // Create default permissions (all false)
    public static function createDefault(int $librarianId): self
    {
        $data = ['librarian_id' => $librarianId];
        
        foreach (self::PERMISSION_COLUMNS as $column) {
            $data[$column] = false;
        }
        
        return self::create($data);
    }
}
