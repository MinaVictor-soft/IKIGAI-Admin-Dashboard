import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, Eye, EyeOff, Upload, FileText, Link, Tag } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import PasswordConfirmModal from '../components/PasswordConfirmModal';

export default function PublicationsPage() {
  const queryClient = useQueryClient();
  const { t, lang } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [deletePubId, setDeletePubId] = useState<string | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  const { data: publications, isLoading } = useQuery({
    queryKey: ['admin-publications'],
    queryFn: () => api.get('/publications/admin/all').then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['publication-categories'],
    queryFn: () => api.get('/publications/categories').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/publications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      setShowCreate(false);
      toast.success(lang === 'ar' ? 'تم إنشاء المنشور' : 'Publication created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/publications/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      setShowCreate(false);
      toast.success(lang === 'ar' ? 'تم رفع الملف' : 'File uploaded');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Upload failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/publications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      setEditItem(null);
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/publications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => api.post('/publications/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-categories'] });
      setShowCategoryModal(false);
      setEditCategory(null);
      toast.success(lang === 'ar' ? 'تم إنشاء التصنيف' : 'Category created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/publications/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-publications'] });
      setEditCategory(null);
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/publications/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-categories'] });
      toast.success(lang === 'ar' ? 'تم حذف التصنيف' : 'Category deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (uploadMode) {
      const file = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement)?.files?.[0];
      if (!file) { toast.error('Select a file'); return; }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.get('title') as string);
      formData.append('description', form.get('description') as string || '');
      formData.append('categoryId', form.get('categoryId') as string);
      formData.append('published', form.get('published') === 'on' ? 'true' : 'false');
      uploadMutation.mutate(formData);
    } else {
      createMutation.mutate({
        title: form.get('title'),
        description: form.get('description') || undefined,
        categoryId: form.get('categoryId'),
        contentUrl: form.get('contentUrl'),
        published: form.get('published') === 'on',
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editItem.id,
      data: {
        title: form.get('title'),
        description: form.get('description') || undefined,
        categoryId: form.get('categoryId'),
        contentUrl: form.get('contentUrl') || undefined,
        published: form.get('published') === 'on',
      },
    });
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name'),
      labelEn: form.get('labelEn'),
      labelAr: form.get('labelAr'),
      color: form.get('color'),
      order: Number(form.get('order')) || 0,
    };
    if (editCategory) {
      updateCategoryMutation.mutate({ id: editCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const getCategoryLabel = (pub: any) => {
    const cat = pub.category;
    if (!cat) return 'Unknown';
    return lang === 'ar' ? cat.labelAr : cat.labelEn;
  };

  const getCategoryColor = (pub: any) => {
    return pub.category?.color || '#6366F1';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'ar' ? 'المنشورات والمكتبة' : 'Publications & Library'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'ar' ? 'إدارة المجلات والصلوات والخلوات' : 'Manage magazines, prayers & khelwa docs'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCategoryModal(true); setEditCategory(null); }}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Tag size={18} />
            {lang === 'ar' ? 'التصنيفات' : 'Categories'}
          </button>
          <button
            onClick={() => { setShowCreate(true); setUploadMode(false); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            {lang === 'ar' ? 'إضافة منشور' : 'Add Publication'}
          </button>
        </div>
      </div>

      {/* Publications Table */}
      {isLoading ? (
        <p className="text-gray-500">{t('loading')}</p>
      ) : !publications?.length ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{lang === 'ar' ? 'لا توجد منشورات بعد' : 'No publications yet'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('name')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{t('status')}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {publications.map((pub: any) => (
                <tr key={pub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{pub.title}</div>
                    {pub.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{pub.description}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: getCategoryColor(pub) + '20', color: getCategoryColor(pub) }}>
                      {getCategoryLabel(pub)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pub.published ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <Eye size={14} /> {lang === 'ar' ? 'منشور' : 'Published'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                        <EyeOff size={14} /> {lang === 'ar' ? 'مسودة' : 'Draft'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {pub.publishedAt ? new Date(pub.publishedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ id: pub.id, data: { published: !pub.published } })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${pub.published ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        title={pub.published ? 'Unpublish' : 'Publish'}
                      >
                        {pub.published ? <><EyeOff size={14} /> {lang === 'ar' ? 'إيقاف' : 'Unpublish'}</> : <><Eye size={14} /> {lang === 'ar' ? 'نشر' : 'Publish'}</>}
                      </button>
                      <button
                        onClick={() => setEditItem(pub)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeletePubId(pub.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Publication Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {lang === 'ar' ? 'إضافة منشور جديد' : 'Add Publication'}
              </h2>

              {/* Toggle upload/link mode */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMode(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${!uploadMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Link size={16} /> {lang === 'ar' ? 'رابط' : 'URL Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode(true)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${uploadMode ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Upload size={16} /> {lang === 'ar' ? 'رفع ملف' : 'Upload File'}
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <input name="title" required placeholder={lang === 'ar' ? 'العنوان *' : 'Title *'} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <textarea name="description" placeholder={lang === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} />
                <select name="categoryId" required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">{lang === 'ar' ? 'اختر التصنيف *' : 'Select Category *'}</option>
                  {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{lang === 'ar' ? c.labelAr : c.labelEn}</option>)}
                </select>

                {uploadMode ? (
                  <input type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="w-full border rounded-lg px-3 py-2 text-sm" />
                ) : (
                  <input name="contentUrl" required placeholder={lang === 'ar' ? 'رابط الملف (URL) *' : 'File URL *'} type="url" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                )}

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="published" defaultChecked className="rounded" />
                  {lang === 'ar' ? 'نشر فوراً' : 'Publish immediately'}
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={createMutation.isPending || uploadMutation.isPending} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {createMutation.isPending || uploadMutation.isPending ? '...' : t('create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Publication Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {lang === 'ar' ? 'تعديل المنشور' : 'Edit Publication'}
              </h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input name="title" required defaultValue={editItem.title} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <textarea name="description" defaultValue={editItem.description || ''} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={2} />
                <select name="categoryId" required defaultValue={editItem.categoryId} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{lang === 'ar' ? c.labelAr : c.labelEn}</option>)}
                </select>
                <input name="contentUrl" defaultValue={editItem.contentUrl} placeholder="URL" type="url" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="published" defaultChecked={editItem.published} className="rounded" />
                  {lang === 'ar' ? 'منشور' : 'Published'}
                </label>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditItem(null)} className="flex-1 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {updateMutation.isPending ? '...' : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Modal */}
      {/* Delete Publication Confirm */}
      {deletePubId && (
        <PasswordConfirmModal
          title={lang === 'ar' ? 'حذف المنشور؟' : 'Delete Publication?'}
          description={lang === 'ar' ? 'سيتم حذف هذا المنشور نهائياً.' : 'This publication will be permanently deleted.'}
          confirmLabel={lang === 'ar' ? 'حذف' : 'Delete'}
          loading={deleteMutation.isPending}
          onClose={() => setDeletePubId(null)}
          onConfirm={() => {
            deleteMutation.mutate(deletePubId, {
              onSuccess: () => setDeletePubId(null),
            });
          }}
        />
      )}

      {/* Delete Category Confirm */}
      {deleteCatId && (
        <PasswordConfirmModal
          title={lang === 'ar' ? 'حذف التصنيف؟' : 'Delete Category?'}
          description={lang === 'ar' ? 'سيتم حذف هذا التصنيف نهائياً.' : 'This category will be permanently deleted.'}
          confirmLabel={lang === 'ar' ? 'حذف' : 'Delete'}
          loading={deleteCategoryMutation.isPending}
          onClose={() => setDeleteCatId(null)}
          onConfirm={() => {
            deleteCategoryMutation.mutate(deleteCatId, {
              onSuccess: () => setDeleteCatId(null),
            });
          }}
        />
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {lang === 'ar' ? 'إدارة التصنيفات' : 'Manage Categories'}
                </h2>
                <button onClick={() => { setShowCategoryModal(false); setEditCategory(null); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              {/* Category List */}
              <div className="space-y-2 mb-6">
                {(categories || []).map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <div>
                        <div className="text-sm font-medium">{lang === 'ar' ? cat.labelAr : cat.labelEn}</div>
                        <div className="text-xs text-gray-400">{cat.name}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditCategory(cat)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeleteCatId(cat.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {!(categories || []).length && (
                  <p className="text-sm text-gray-400 text-center py-4">{lang === 'ar' ? 'لا توجد تصنيفات' : 'No categories'}</p>
                )}
              </div>

              {/* Add/Edit Category Form */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {editCategory ? (lang === 'ar' ? 'تعديل التصنيف' : 'Edit Category') : (lang === 'ar' ? 'إضافة تصنيف جديد' : 'Add Category')}
                </h3>
                <form onSubmit={handleCategorySubmit} className="space-y-3">
                  <input name="name" required defaultValue={editCategory?.name || ''} placeholder={lang === 'ar' ? 'الاسم (مفتاح فريد)' : 'Name (unique key)'} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input name="labelEn" required defaultValue={editCategory?.labelEn || ''} placeholder="Label (EN)" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    <input name="labelAr" required defaultValue={editCategory?.labelAr || ''} placeholder="التسمية (عربي)" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input name="color" type="color" defaultValue={editCategory?.color || '#6366F1'} className="w-10 h-10 rounded border cursor-pointer" />
                      <span className="text-xs text-gray-500">{lang === 'ar' ? 'اللون' : 'Color'}</span>
                    </div>
                    <input name="order" type="number" defaultValue={editCategory?.order || 0} placeholder={lang === 'ar' ? 'الترتيب' : 'Order'} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="flex gap-3">
                    {editCategory && (
                      <button type="button" onClick={() => setEditCategory(null)} className="flex-1 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                        {t('cancel')}
                      </button>
                    )}
                    <button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                      {editCategory ? t('save') : t('create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
