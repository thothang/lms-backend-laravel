<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Tymon\JWTAuth\Facades\JWTAuth;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        try {
            JWTAuth::parseToken()->authenticate();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function rules(): array
    {
        $userId = JWTAuth::parseToken()->authenticate()->id;

        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $userId,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'dob' => 'nullable|date|before:today',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email đã được sử dụng',
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay',
        ];
    }
}
