import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import api from '../../services/api';
import { User, Phone, MapPin, Calendar, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';

const ProfileInfo = ({ currentUser, onUpdate }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    dob: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  useEffect(() => {
    // Fetch full profile info
    userService.getProfile()
      .then(res => {
        // Convert ISO date to yyyy-MM-dd format for date input
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        };

        setProfileData({
          name: res.name || '',
          phone: res.phone || '',
          address: res.address || '',
          dob: formatDate(res.dob)
        });
      })
      .catch(() => {});
  }, []);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordDataChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const res = await userService.updateProfile(profileData);
      showSuccess(res.message || 'Cập nhật thông tin thành công!');
      // Clear cache cho profile để reload dữ liệu mới nhất
      api.clearCacheByPattern('/profile');
      api.clearCacheByPattern('/balance');
      if (res.user) {
        onUpdate(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (err) {
      handleApiError(err, 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
       toast.error('Mật khẩu xác nhận không khớp!');
       return;
    }
    setIsLoadingPassword(true);
    try {
      const res = await userService.changePassword(passwordData);
      showSuccess(res.message || 'Đổi mật khẩu thành công!');
      // Clear cache cho balance để reload dữ liệu mới nhất
      api.clearCacheByPattern('/balance');
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      handleApiError(err, 'Lỗi đổi mật khẩu.');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cập nhật thông tin */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <User className="text-indigo-600" /> Thông tin cá nhân
        </h2>

        <form onSubmit={submitProfile} className="space-y-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <Input name="name" value={profileData.name} onChange={handleProfileChange} icon={User} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <Input name="phone" value={profileData.phone} onChange={handleProfileChange} icon={Phone} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <Input name="address" value={profileData.address} onChange={handleProfileChange} icon={MapPin} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                <Input type="date" name="dob" value={profileData.dob} onChange={handleProfileChange} icon={Calendar} />
              </div>
           </div>
           <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={isLoadingProfile} className="px-8">
                Lưu thông tin
              </Button>
           </div>
        </form>
      </div>

      {/* Đổi mật khẩu */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Lock className="text-indigo-600" /> Đổi mật khẩu
        </h2>

        <form onSubmit={submitPassword} className="space-y-5 max-w-lg">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
               <Input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordDataChange} icon={Lock} required />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
               <Input type="password" name="password" value={passwordData.password} onChange={handlePasswordDataChange} icon={Lock} required />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
               <Input type="password" name="password_confirmation" value={passwordData.password_confirmation} onChange={handlePasswordDataChange} icon={Lock} required />
            </div>
           <div className="pt-2">
              <Button type="submit" isLoading={isLoadingPassword} className="px-8 bg-slate-800 hover:bg-slate-900">
                Đổi mật khẩu
              </Button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileInfo;
