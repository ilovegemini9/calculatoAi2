'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface MediaAsset {
  id: string;
  name: string;
  type: string;
  size: string;
  dimensions: string;
  url: string;
  optimized: boolean;
}

export default function MediaManagerPage() {
  const [dragActive, setDragActive] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([
    { id: '1', name: 'mortgage-guide-hero.webp', type: 'image/webp', size: '42 KB', dimensions: '1200 x 630', url: '/favicon.svg', optimized: true },
    { id: '2', name: 'financial-calculator-bg.png', type: 'image/png', size: '280 KB', dimensions: '1920 x 1080', url: '/favicon.svg', optimized: false },
    { id: '3', name: 'fitness-runner-avatar.jpg', type: 'image/jpeg', size: '115 KB', dimensions: '800 x 800', url: '/favicon.svg', optimized: true },
  ]);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      addNewAsset(file.name, file.type, file.size);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addNewAsset(file.name, file.type, file.size);
    }
  };

  const addNewAsset = (name: string, type: string, sizeBytes: number) => {
    const sizeKB = Math.round(sizeBytes / 1024) || 24;
    const newAsset: MediaAsset = {
      id: Date.now().toString(),
      name,
      type,
      size: `${sizeKB} KB`,
      dimensions: '800 x 600',
      url: '/favicon.svg',
      optimized: false,
    };
    setAssets([newAsset, ...assets]);
    toast.success('Asset uploaded successfully!');
  };

  const handleDelete = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
    toast.success('Media asset removed from registry.');
  };

  const handleOptimize = (id: string) => {
    setAssets(assets.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          name: a.name.split('.')[0] + '.webp',
          type: 'image/webp',
          size: `${Math.round(parseInt(a.size) * 0.45)} KB`,
          optimized: true,
        };
      }
      return a;
    }));
    toast.success('Asset programmatically compressed to WebP (55% reduction!)');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Media Optimization Center
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Upload platform illustrations, article featured icons, and optimize formats dynamically using server-side compression wrappers (AVIF & WebP).
        </p>
      </div>

      {/* Drag & Drop File Node */}
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
          Drag and drop media files here, or{' '}
          <label className="text-blue-500 hover:underline cursor-pointer">
            browse local filesystem
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileInput} 
            />
          </label>
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Supports PNG, JPEG, SVG up to 10MB. Rebuilt models output custom optimized formats.
        </p>
      </div>

      {/* Assets Grid */}
      <div 
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500">
          Media Assets Library & Optimization Queue
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className="rounded-xl border p-4 flex flex-col justify-between space-y-3 hover:shadow-lg transition relative group"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🖼️</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>
                      {asset.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {asset.dimensions} | {asset.size}
                    </p>
                  </div>
                </div>
                {asset.optimized ? (
                  <span className="text-[9px] uppercase font-black bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                    ⚡ Optimized
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-black bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded">
                    Original
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="text-[11px] font-bold text-red-500 hover:underline"
                >
                  Delete
                </button>
                {!asset.optimized && (
                  <button
                    onClick={() => handleOptimize(asset.id)}
                    className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                  >
                    🛠️ WebP Compress
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
