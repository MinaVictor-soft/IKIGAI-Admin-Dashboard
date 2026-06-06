import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function CMSPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [appName, setAppName] = useState('');
  const [appNameAr, setAppNameAr] = useState('');
  const [infoPageTitle, setInfoPageTitle] = useState('');
  const [infoPageContent, setInfoPageContent] = useState('');
  const [infoPageTitleAr, setInfoPageTitleAr] = useState('');
  const [infoPageContentAr, setInfoPageContentAr] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['cms-config'],
    queryFn: () => api.get('/admin/config').then((r) => r.data),
    onSuccess: (data) => {
      if (data?.appName) setAppName(data.appName);
      if (data?.appNameAr) setAppNameAr(data.appNameAr);
      if (data?.infoPageTitle) setInfoPageTitle(data.infoPageTitle);
      if (data?.infoPageContent) setInfoPageContent(data.infoPageContent);
      if (data?.infoPageTitleAr) setInfoPageTitleAr(data.infoPageTitleAr);
      if (data?.infoPageContentAr) setInfoPageContentAr(data.infoPageContentAr);
    },
  });

  const updateConfig = useMutation({
    mutationFn: (data: any) => api.patch('/admin/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-config'] });
      toast.success('CMS updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update CMS'),
  });

  const handleSave = () => {
    updateConfig.mutate({
      appName,
      appNameAr,
      infoPageTitle,
      infoPageContent,
      infoPageTitleAr,
      infoPageContentAr,
    });
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Management</h2>
        <button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save size={16} />
          {updateConfig.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* App Name */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">App Name</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">English</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="App Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العربية</label>
              <input
                type="text"
                value={appNameAr}
                onChange={(e) => setAppNameAr(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="اسم التطبيق"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Info Page */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Info Page</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title (English)</label>
            <input
              type="text"
              value={infoPageTitle}
              onChange={(e) => setInfoPageTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Info Page Title"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Content (English)</label>
            <textarea
              value={infoPageContent}
              onChange={(e) => setInfoPageContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Info Page Content"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">العنوان (العربية)</label>
            <input
              type="text"
              value={infoPageTitleAr}
              onChange={(e) => setInfoPageTitleAr(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="عنوان صفحة المعلومات"
              dir="rtl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">المحتوى (العربية)</label>
            <textarea
              value={infoPageContentAr}
              onChange={(e) => setInfoPageContentAr(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="محتوى صفحة المعلومات"
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
