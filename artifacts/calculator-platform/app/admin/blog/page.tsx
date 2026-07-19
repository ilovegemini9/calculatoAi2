'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CALCULATORS } from '@/config/calculators';

interface Article {
  id: string;
  calculatorId: string;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'pending_review' | 'published';
  seoData: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl: string;
  };
  version: number;
  createdAt: string;
}

export default function BlogWorkspacePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);

  useEffect(() => {
    fetch('/api/admin/blog')
      .then((res) => res.json())
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load articles.');
        setLoading(false);
      });
  }, []);

  const handleEdit = (article: Article) => {
    setEditingArticle({ ...article });
  };

  const handleCreateNew = () => {
    setEditingArticle({
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      calculatorId: '',
      seoData: {
        title: '',
        description: '',
        keywords: [],
        canonicalUrl: '',
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article? This is irreversible.')) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles(articles.filter((a) => a.id !== id));
        toast.success('Article deleted successfully.');
      } else {
        toast.error('Failed to delete article.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title || !editingArticle.content) {
      toast.error('Please fill in required fields.');
      return;
    }

    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingArticle),
      });

      if (res.ok) {
        const data = await res.json();
        if (editingArticle.id) {
          setArticles(articles.map((a) => (a.id === data.article.id ? data.article : a)));
          toast.success('Article updated successfully.');
        } else {
          setArticles([data.article, ...articles]);
          toast.success('Article created successfully.');
        }
        setEditingArticle(null);
      } else {
        toast.error('Failed to save article.');
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading blog workspace...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Editorial Blog Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Write, publish, and revision articles linking directly to calculators to drive SEO authority.
          </p>
        </div>
        {!editingArticle && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            Create New Article
          </button>
        )}
      </div>

      {editingArticle ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div 
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                {editingArticle.id ? `Editing: ${editingArticle.title}` : 'New Article Draft'}
              </h2>
              <button
                type="button"
                onClick={() => setEditingArticle(null)}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                ← Cancel & Return
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingArticle.title || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  placeholder="e.g. How Is Your Mortgage Payment Calculated?"
                  className="w-full p-3 border rounded-xl outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  URL Slug (Auto Generated if Empty)
                </label>
                <input
                  type="text"
                  value={editingArticle.slug || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                  placeholder="e.g. mortgage-payment-calculation"
                  className="w-full p-3 border rounded-xl outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Link to Calculator
                </label>
                <select
                  value={editingArticle.calculatorId || ''}
                  onChange={(e) => setEditingArticle({ ...editingArticle, calculatorId: e.target.value })}
                  className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">No link (General article)</option>
                  {CALCULATORS.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Publishing Status
                </label>
                <select
                  value={editingArticle.status || 'draft'}
                  onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as 'draft' | 'pending_review' | 'published' })}
                  className="w-full p-3 border rounded-xl outline-none text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="draft">Draft (Private)</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="published">Published (Public)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Article Body Content (supports Markdown / HTML) *
              </label>
              <textarea
                rows={12}
                required
                value={editingArticle.content || ''}
                onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                placeholder="Write article body..."
                className="w-full p-3 border rounded-xl outline-none text-xs font-mono leading-relaxed"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* SEO Specific Sub-box */}
          <div 
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500">
              SEO Google-Search Tuning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Meta Title Tag
                </label>
                <input
                  type="text"
                  value={editingArticle.seoData?.title || ''}
                  onChange={(e) => setEditingArticle({
                    ...editingArticle,
                    seoData: { ...editingArticle.seoData!, title: e.target.value }
                  })}
                  placeholder="Custom search listing title"
                  className="w-full p-3 border rounded-xl outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Meta Description Tag
                </label>
                <input
                  type="text"
                  value={editingArticle.seoData?.description || ''}
                  onChange={(e) => setEditingArticle({
                    ...editingArticle,
                    seoData: { ...editingArticle.seoData!, description: e.target.value }
                  })}
                  placeholder="Custom search listing summary..."
                  className="w-full p-3 border rounded-xl outline-none text-sm"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingArticle(null)}
              className="px-5 py-2.5 border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--bg-card-hover)] transition"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-lg shadow-blue-600/20"
            >
              Save Article
            </button>
          </div>
        </form>
      ) : (
        <div 
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {articles.length === 0 ? (
            <div className="p-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No articles found. Click &quot;Create New Article&quot; to begin writing.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {articles.map((art) => (
                <div key={art.id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{art.title}</h2>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        art.status === 'published' ? 'bg-green-500/15 text-green-500' : 'bg-orange-500/15 text-orange-500'
                      }`}>
                        {art.status}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Slug: <span className="font-mono">/blog/{art.slug}</span> | Linked: <span className="font-mono">{art.calculatorId || 'None'}</span> | Rev: {art.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(art)}
                      className="text-xs font-bold text-blue-500 hover:underline"
                    >
                      Edit
                    </button>
                    <span className="text-[var(--border)]">|</span>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
