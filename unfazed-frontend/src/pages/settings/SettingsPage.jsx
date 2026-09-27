import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { getProfileAPI, updateProfileAPI, updateAvatarAPI } from '../../api/profile';
import { updatePasswordAPI } from '../../api/auth';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const toast = useToast();

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { isSubmitting: savingProfile },
  } = useForm();

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { isSubmitting: savingPassword },
  } = useForm();

  useEffect(() => {
    getProfileAPI()
      .then(({ data }) => {
        setProfile(data.data.profile);
        const p = data.data.profile;
        resetProfile({
          firstName:             p.user?.firstName || '',
          lastName:              p.user?.lastName  || '',
          phone:                 p.user?.phone     || '',
          bio:                   p.bio             || '',
          licenseNumber:         p.licenseNumber   || '',
          licenseType:           p.licenseType     || '',
          yearsExperience:       p.yearsExperience || '',
          practiceName:          p.practiceName    || '',
          timezone:              p.timezone        || 'Asia/Kolkata',
          currency:              p.currency        || 'INR',
          defaultSessionDuration:p.defaultSessionDuration || 50,
          defaultSessionRate:    p.defaultSessionRate     || 0,
          specializations:       (p.specializations || []).join(', '),
          languages:             (p.languages      || []).join(', '),
          website:               p.website         || '',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const onSaveProfile = async (data) => {
    try {
      const payload = {
        ...data,
        specializations: data.specializations ? data.specializations.split(',').map((s) => s.trim()).filter(Boolean) : [],
        languages:        data.languages       ? data.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
        yearsExperience:  Number(data.yearsExperience) || 0,
        defaultSessionDuration: Number(data.defaultSessionDuration) || 50,
        defaultSessionRate:     Number(data.defaultSessionRate)     || 0,
      };
      await updateProfileAPI(payload);
      await refreshUser();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    }
  };

  const onChangePassword = async (data) => {
    try {
      await updatePasswordAPI({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password updated');
      resetPassword();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setAvatarLoading(true);
    try {
      await updateAvatarAPI(formData);
      await refreshUser();
      toast.success('Avatar updated');
    } catch { toast.error('Failed to upload avatar'); }
    finally { setAvatarLoading(false); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>

      {/* Avatar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Profile photo</h3>
        <div className="flex items-center gap-5">
          <Avatar src={user?.avatar} name={`${user?.firstName} ${user?.lastName}`} size="xl" />
          <div>
            <label className="cursor-pointer">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors ${avatarLoading ? 'opacity-50' : ''}`}>
                {avatarLoading ? <Spinner size="sm" /> : null}
                {avatarLoading ? 'Uploading…' : 'Change photo'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarLoading} />
            </label>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Personal & practice info</h3>
        <form onSubmit={handleProfile(onSaveProfile)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input id="firstName" label="First name" {...regProfile('firstName', { required: true })} />
            <Input id="lastName"  label="Last name"  {...regProfile('lastName', { required: true })} />
          </div>
          <Input id="phone"        label="Phone"           {...regProfile('phone')} />
          <Input id="practiceName" label="Practice name"   {...regProfile('practiceName')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Bio</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              {...regProfile('bio')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="licenseNumber" label="License number" {...regProfile('licenseNumber')} />
            <Input id="licenseType"   label="License type"   {...regProfile('licenseType')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="yearsExperience"        label="Years of experience"   type="number" {...regProfile('yearsExperience')} />
            <Input id="defaultSessionDuration" label="Default duration (min)"type="number" {...regProfile('defaultSessionDuration')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="defaultSessionRate" label="Default session rate (₹)" type="number" {...regProfile('defaultSessionRate')} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Timezone</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...regProfile('timezone')}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>
          <Input id="specializations" label="Specializations (comma-separated)" placeholder="Anxiety, Depression, CBT" {...regProfile('specializations')} />
          <Input id="languages"       label="Languages (comma-separated)"        placeholder="English, Hindi"         {...regProfile('languages')} />
          <Input id="website"         label="Website"  type="url"                                                      {...regProfile('website')} />

          <div className="flex justify-end">
            <Button type="submit" loading={savingProfile}>Save profile</Button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Change password</h3>
        <form onSubmit={handlePassword(onChangePassword)} noValidate className="space-y-4">
          <Input id="currentPassword" label="Current password" type="password" autoComplete="current-password" {...regPassword('currentPassword', { required: true })} />
          <Input id="newPassword"     label="New password"     type="password" autoComplete="new-password"     {...regPassword('newPassword', { required: true, minLength: 6 })} />
          <div className="flex justify-end">
            <Button type="submit" loading={savingPassword}>Update password</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
