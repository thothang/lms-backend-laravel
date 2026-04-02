<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'cccd_number' => 'nullable|string|max:20',
            'cccd_image' => 'nullable|file|image|mimes:jpg,jpeg,png|max:5120', // max 5MB
            'dob' => 'nullable|date|before:today',
            'use_ocr' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email đã được sử dụng',
            'password.min' => 'Mật khẩu phải có ít nhất 8 ký tự',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp',
            'cccd_image.image' => 'File CCCD phải là hình ảnh',
            'cccd_image.max' => 'Hình CCCD không được vượt quá 5MB',
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay',
        ];
    }
}
