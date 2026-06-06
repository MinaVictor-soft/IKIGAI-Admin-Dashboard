import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Play, Square, PlusCircle, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';

export default function QuizzesPage() {
  const queryClient = useQueryClient();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [addQuestionTo, setAddQuestionTo] = useState<any>(null);
  const [detailQuizId, setDetailQuizId] = useState<string | null>(null);

  const { data: quizzes, isLoading, isError } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: () => api.get('/admin/quizzes').then((r) => r.data),
  });

  const createQuiz = useMutation({
    mutationFn: (data: any) => api.post('/quizzes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      setShowCreate(false);
      toast.success('Quiz created');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/quizzes/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success('Quiz status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const addQuestion = useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: any }) =>
      api.post(`/quizzes/${quizId}/questions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-detail'] });
      toast.success('Question added');
      setAddQuestionTo(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-700',
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('quizzes')}</h2>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> {t('create')}
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">{t('loading')}</div>
        ) : isError ? (
          <div className="text-center py-8 text-red-400">Failed to load quizzes. Please check your connection and try again.</div>
        ) : quizzes?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">{t('noQuizzesYet')}</div>
        ) : (
          quizzes?.map((q: any) => (
            <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setDetailQuizId(q.id)}>
                  <h3 className="font-semibold text-gray-900">{q.title}</h3>
                  {q.description && <p className="text-sm text-gray-500 mt-0.5">{q.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status]}`}>{q.status}</span>
                    <span className="text-xs text-gray-500">{q._count?.questions ?? q.questionCount ?? 0} {t('questions')}</span>
                    <span className="text-xs text-gray-500">XP: {q.xpReward}</span>
                    <span className="text-xs text-gray-500">{t('pass')}: {q.passingScore}%</span>
                    {q.timeLimitSeconds && <span className="text-xs text-gray-500">{q.timeLimitSeconds}s</span>}
                    <span className="text-xs text-indigo-600 font-medium underline">{q._count?.submissions ?? 0} {t('submissions')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setDetailQuizId(q.id)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title={t('viewDetails')}>
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setAddQuestionTo(q)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title={t('addQuestion')}>
                    <PlusCircle size={16} />
                  </button>
                  {q.status === 'DRAFT' && (
                    <button onClick={() => updateStatus.mutate({ id: q.id, status: 'ACTIVE' })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title={t('activate')}>
                      <Play size={16} />
                    </button>
                  )}
                  {q.status === 'ACTIVE' && (
                    <button onClick={() => updateStatus.mutate({ id: q.id, status: 'CLOSED' })} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg" title={t('close')}>
                      <Square size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && <CreateQuizModal onClose={() => setShowCreate(false)} onSubmit={(d) => createQuiz.mutate(d)} loading={createQuiz.isPending} />}
      {addQuestionTo && <AddQuestionModal quiz={addQuestionTo} onClose={() => setAddQuestionTo(null)} onSubmit={(d) => addQuestion.mutate({ quizId: addQuestionTo.id, data: d })} loading={addQuestion.isPending} />}
      {detailQuizId && <QuizDetailModal quizId={detailQuizId} onClose={() => setDetailQuizId(null)} />}
    </div>
  );
}

/* ============ QUIZ DETAIL MODAL ============ */
function QuizDetailModal({ quizId, onClose }: { quizId: string; onClose: () => void }) {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'questions' | 'results'>('results');

  const { data: detail } = useQuery({
    queryKey: ['quiz-detail', quizId],
    queryFn: () => api.get(`/admin/quizzes/${quizId}`).then((r) => r.data),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) => api.delete(`/admin/quizzes/${quizId}/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-detail', quizId] });
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success('Question deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed'),
  });

  if (!detail) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6"><p className="text-center text-gray-400">{t('loading')}</p></div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">{detail.title}</h3>
          {detail.description && <p className="text-sm text-gray-500">{detail.description}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-700">{detail.stats.total}</div>
            <div className="text-xs text-blue-600">{t('submissions')}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-700">{detail.stats.passed}</div>
            <div className="text-xs text-green-600">{t('passed')}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-red-700">{detail.stats.failed}</div>
            <div className="text-xs text-red-600">{t('failed')}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-700">{detail.stats.avgScore}%</div>
            <div className="text-xs text-purple-600">{t('avgScore')}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-4">
          <button onClick={() => setTab('results')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'results' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            Results ({detail.submissions?.length})
          </button>
          <button onClick={() => setTab('questions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'questions' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            Questions ({detail.questions?.length})
          </button>
        </div>

        {tab === 'results' && (
          <div className="space-y-2">
            {detail.submissions?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noQuizzesYet')}</p>
            ) : (
              detail.submissions?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {s.passed ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.user?.name}</p>
                      <p className="text-xs text-gray-500">{s.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className={`text-sm font-bold ${s.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {s.score}/{s.maxScore} ({Number(s.percentage).toFixed(0)}%)
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.timeTakenSeconds ? `${s.timeTakenSeconds}s` : ''} {s.xpAwarded > 0 ? `• +${s.xpAwarded} XP` : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-3">
            {detail.questions?.length === 0 ? (
              <p className="text-center text-gray-400 py-4">{t('noQuestionsYet')}</p>
            ) : (
              detail.questions?.map((q: any, i: number) => (
                <div key={q.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        <span className="text-gray-400 font-bold me-2">Q{i + 1}.</span>
                        {q.questionText}
                      </p>
                      {q.options?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.options.map((opt: any) => (
                            <span
                              key={opt.id}
                              className={`px-2 py-0.5 rounded text-xs ${opt.id === q.correctAnswer ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {opt.id}) {opt.text}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Answer: <span className="font-bold text-green-700">{q.correctAnswer}</span>
                        {q.explanation && <span> • {q.explanation}</span>}
                        <span> • {q.points} pts</span>
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this question?')) deleteQuestion.mutate(q.id); }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-sm">{t('close')}</button>
      </div>
    </div>
  );
}

/* ============ CREATE QUIZ MODAL ============ */
function CreateQuizModal({ onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ title: '', description: '', xpReward: 20, passingScore: 70, timeLimitSeconds: 120 });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">{t('createQuiz')}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, xpReward: Number(form.xpReward), passingScore: Number(form.passingScore), timeLimitSeconds: Number(form.timeLimitSeconds) }); }} className="space-y-3">
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('quizTitle') + ' *'} required className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder={t('description')} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500">{t('xpReward')}</label><input type="number" value={form.xpReward} onChange={(e) => set('xpReward', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500">{t('passPercentage')}</label><input type="number" value={form.passingScore} onChange={(e) => set('passingScore', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500">{t('timeLimitSeconds')}</label><input type="number" value={form.timeLimitSeconds} onChange={(e) => set('timeLimitSeconds', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============ ADD QUESTION MODAL ============ */
function AddQuestionModal({ quiz, onClose, onSubmit, loading }: any) {
  const { t } = useLang();
  const [form, setForm] = useState({ questionText: '', questionType: 'MULTIPLE_CHOICE', correctAnswer: '', explanation: '', points: 1, displayOrder: 1, options: [{ id: 'a', text: '' }, { id: 'b', text: '' }, { id: 'c', text: '' }, { id: 'd', text: '' }] });
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const updateOption = (idx: number, text: string) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text };
    set('options', opts);
  };

  // Get options based on question type
  const getDisplayOptions = () => {
    if (form.questionType === 'TRUE_FALSE') {
      return [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }];
    } else if (form.questionType === 'SHORT_ANSWER') {
      return [];
    }
    return form.options.filter(o => o.text);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-1">{t('addQuestion')}</h3>
        <p className="text-sm text-gray-500 mb-4">"{quiz.title}"</p>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const submitData = { 
            ...form, 
            points: Number(form.points), 
            displayOrder: Number(form.displayOrder),
            options: form.questionType === 'TRUE_FALSE' ? [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }] : (form.questionType === 'SHORT_ANSWER' ? [] : form.options.filter(o => o.text))
          };
          onSubmit(submitData); 
        }} className="space-y-3">
          <textarea value={form.questionText} onChange={(e) => set('questionText', e.target.value)} placeholder="Question text *" required className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
          <select value={form.questionType} onChange={(e) => set('questionType', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
            <option value="TRUE_FALSE">{t('trueFalse')}</option>
            <option value="SHORT_ANSWER">{t('shortAnswer')}</option>
          </select>

          {form.questionType === 'MULTIPLE_CHOICE' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('options')}</label>
              {form.options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <input type="radio" name="correct" value={opt.id} checked={form.correctAnswer === opt.id} onChange={(e) => set('correctAnswer', e.target.value)} className="w-4 h-4" />
                  <span className="text-xs font-medium text-gray-400 w-5">{opt.id})</span>
                  <input value={opt.text} onChange={(e) => updateOption(i, e.target.value)} placeholder={`${t('option')} ${opt.id}`} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
              ))}
            </div>
          )}

          {form.questionType === 'TRUE_FALSE' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('selectCorrectAnswer')}</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="correct" value="true" checked={form.correctAnswer === 'true'} onChange={(e) => set('correctAnswer', e.target.value)} className="w-4 h-4" />
                  <label className="flex-1 cursor-pointer text-sm">True</label>
                </div>
                <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="correct" value="false" checked={form.correctAnswer === 'false'} onChange={(e) => set('correctAnswer', e.target.value)} className="w-4 h-4" />
                  <label className="flex-1 cursor-pointer text-sm">False</label>
                </div>
              </div>
            </div>
          )}

          {form.questionType === 'SHORT_ANSWER' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-500">{t('correctAnswer')} *</label>
              <input value={form.correctAnswer} onChange={(e) => set('correctAnswer', e.target.value)} required placeholder="Expected answer" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-gray-500">{t('explanation')}</label>
            <input value={form.explanation} onChange={(e) => set('explanation', e.target.value)} placeholder={t('whyThisAnswer')} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">{t('points')}</label><input type="number" value={form.points} onChange={(e) => set('points', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-gray-500">{t('order')}</label><input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">{t('cancel')}</button>
            <button type="submit" disabled={loading || !form.correctAnswer} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{loading ? '...' : t('addQuestion')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
