<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'cccd_number',
        'cccd_image',
        'dob',
        'balance',
        'earnings_balance',
        'total_earned',
        'total_debt',
        'status',
        'role',
        'last_withdrawal_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'cccd_number',
    ];

    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'balance' => 'decimal:2',
            'earnings_balance' => 'decimal:2',
            'total_earned' => 'decimal:2',
            'total_debt' => 'decimal:2',
            'last_withdrawal_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
            'status' => $this->status,
        ];
    }

    // Relationships
    public function borrowRecords()
    {
        return $this->hasMany(BorrowRecord::class);
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function ebookPurchases()
    {
        return $this->hasMany(EbookPurchase::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'from_user_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'to_user_id');
    }

    public function ebooks()
    {
        return $this->hasMany(Ebook::class, 'author_id');
    }

    public function libraryTickets()
    {
        return $this->hasMany(LibraryTicket::class);
    }

    public function withdrawalRequests()
    {
        return $this->hasMany(WithdrawalRequest::class, 'author_id');
    }

    public function debts()
    {
        return $this->hasMany(UserDebt::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function rolePermission()
    {
        return $this->hasOne(RolePermission::class, 'librarian_id');
    }

    // Balance Management with Transaction Safety
    public function addBalance(float $amount): void
    {
        DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            $this->increment('balance', $amount);
        });
    }

    public function subtractBalance(float $amount): bool
    {
        return DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            
            if ($this->balance < $amount) {
                return false;
            }
            
            $this->decrement('balance', $amount);
            return true;
        });
    }

    // Earnings Management
    public function addEarnings(float $amount): void
    {
        DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            $this->increment('earnings_balance', $amount);
            $this->increment('total_earned', $amount);
        });
    }

    public function subtractEarnings(float $amount): bool
    {
        return DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            
            if ($this->earnings_balance < $amount) {
                return false;
            }
            
            $this->decrement('earnings_balance', $amount);
            return true;
        });
    }

    // Debt Management
    public function addDebt(float $amount): void
    {
        DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            $this->increment('total_debt', $amount);
        });
    }

    public function payDebt(float $amount): bool
    {
        return DB::transaction(function () use ($amount) {
            $this->lockForUpdate();
            
            if ($this->total_debt < $amount) {
                $amount = $this->total_debt;
            }
            
            $this->decrement('total_debt', $amount);
            return true;
        });
    }

    // Eligibility Check
    public function canBorrow(): array
    {
        // Check if account is active
        if ($this->status !== 'active') {
            return [false, 'Tài khoản chưa được kích hoạt hoặc đã bị khóa'];
        }

        // Check if has debt
        if ($this->total_debt > 0) {
            return [false, 'Bạn đang có nợ chưa thanh toán'];
        }

        // Check borrow limit
        $maxBorrow = config('library.max_borrow_per_user', 3);
        $currentBorrows = $this->borrowRecords()
            ->whereIn('status', ['active', 'overdue'])
            ->count();

        if ($currentBorrows >= $maxBorrow) {
            return [false, "Bạn đã mượn tối đa {$maxBorrow} cuốn sách"];
        }

        return [true, 'Có thể mượn sách'];
    }

    // Check if user is admin
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Check if user is librarian
    public function isLibrarian(): bool
    {
        return $this->role === 'librarian';
    }

    // Check if user is author
    public function isAuthor(): bool
    {
        return $this->role === 'author';
    }

    // Check permission for librarian
    public function hasPermission(string $permission): bool
    {
        // Admin has all permissions
        if ($this->isAdmin()) {
            return true;
        }

        // Only librarians have role_permissions
        if (!$this->isLibrarian()) {
            return false;
        }

        $rolePermission = $this->rolePermission;
        
        if (!$rolePermission) {
            return false;
        }

        return $rolePermission->{$permission} ?? false;
    }

    // Get decrypted CCCD number (for admin only)
    public function getDecryptedCccdNumber(): ?string
    {
        if (!$this->cccd_number) {
            return null;
        }

        try {
            return Crypt::decryptString($this->cccd_number);
        } catch (\Exception $e) {
            return $this->cccd_number;
        }
    }

    // Set encrypted CCCD number
    public function setCccdNumberAttribute(string $value): void
    {
        $this->attributes['cccd_number'] = Crypt::encryptString($value);
    }
}
