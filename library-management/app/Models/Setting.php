<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            // Try to get from config
            $configKey = 'library.' . $key;
            if (config()->has($configKey)) {
                return config($configKey);
            }
            return $default;
        }

        return $setting->value;
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value): void
    {
        self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Get multiple settings at once
     */
    public static function getMany(array $keys): array
    {
        $settings = self::whereIn('key', $keys)->pluck('value', 'key')->toArray();
        
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $settings[$key] ?? config('library.' . $key);
        }
        
        return $result;
    }
}
