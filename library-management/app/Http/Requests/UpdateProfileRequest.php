<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'cccd_number' => 'nullable|string|max:20',
            'cccd_image' => 'nullable|file|image|mimes:jpg,jpeg,png|max:5120',
            'dob' => 'nullable|date|before:today',
        ];
    }

    public function messages(): array
    {
        return [
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay',
        ];
    }
}
