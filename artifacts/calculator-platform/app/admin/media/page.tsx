'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function MediaManagerPage() {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    toast.info('Media storage is not configured. Connect object storage to enable file uploads.', { duration: 5000 });
  };

  const handleFileInput = () => {
    toast.info('Media storage is not configured. Connect object storage to enable file uploads.', { duration: 5000 });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Media Optimization Center
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Upload and optimize article images and platform illustrations. Requires object storage to be configured.
        </p>
      </div>

      {/* Storage not configured — empty state */}
      <div
        className="rounded-2xl border p-8 flex flex-col items-center justify-center gap-4 text-center"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <span className="text-5xl">🗂️</span>
        <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Object storage not connected</p>
        <p className="text-xs max-w-md" style={{ color: 'var(--text-muted)' }}>
          Media uploads require a connected object storage provider (e.g. Replit Object Storage, S3, or Cloudflare R2).
          Without storage, uploaded files cannot be persisted or served.
        </p>
        <a
          href="https://docs.replit.com/storage/object-storage"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-xl transition"
        >
          Configure Object Storage →
        </a>
      </div>

      {/* Drop zone — still renders but informs user */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition ${
          dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-[var(--border)] bg-[var(--bg-card)]'
        }`}
      >
        <span className="text-4xl mb-3">📁</span>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Drag files here, or{' '}
          <label className="text-blue-500 cursor-pointer hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Uploads are disabled until object storage is configured.
        </p>
      </div>

      {/* Usage metrics empty state */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Images', icon: '🖼️' },
          { label: 'Optimized', icon: '✅' },
          { label: 'Unused', icon: '🗑️' },
          { label: 'Storage Used', icon: '💾' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-5 flex flex-col items-center justify-center gap-2 text-center"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <span className="text-3xl">{stat.icon}</span>
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>—</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No storage connected</p>
          </div>
        ))}
      </div>
    </div>
  );
}
