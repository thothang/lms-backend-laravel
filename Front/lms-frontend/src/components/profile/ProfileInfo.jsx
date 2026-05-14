import React, { useState, useEffect } from 'react';
import { useUserProfile, useUpdateProfile, useChangePassword } from '../../hooks/queries';
import { User, Phone, MapPin, Calendar, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

const ProfileInfo = ({ currentUser, onUpdate }) => {
  const { data: profile, isLoading: isLoadingProfileData } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

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

  useEffect(() => {
    if (profile) {
      // Convert ISO date to yyyy-MM-dd format for date input
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      setProfileData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        dob: formatDate(profile.dob)
      });
    }
  }, [profile]);

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
    try {
      const res = await updateProfileMutation.mutateAsync(profileData);
      const user = res.data?.data || res.data || res.user;
      if (user) {
        onUpdate(user);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      // Error handled by mutation
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync(passwordData);
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      // Error handled by mutation
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
            <Button type="submit" isLoading={updateProfileMutation.isPending} className="px-8">
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
            <Button type="submit" isLoading={changePasswordMutation.isPending} className="px-8 bg-slate-800 hover:bg-slate-900">
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileInfo;
