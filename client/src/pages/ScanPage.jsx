import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useSession } from '../context/SessionContext';

const CATEGORY_HINTS = [
  { id: 'cards', label: 'Cards', icon: '🃏' },
  { id: 'sports', label: 'Sports', icon: '⚾' },
  { id: 'collectibles', label: 'Collectibles', icon: '🏆' },
  { id: 'vintage', label: 'Vintage', icon: '🏺' },
];

export default function ScanPage() {
  const navigate = useNavigate();
  const { saveLastScan } = useSession();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    setError(null);
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleScan = async () => {
    if (!file) {
      setError('Please select an image first');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      saveLastScan(response.data);
      navigate(`/results/${response.data.scanId}`, { state: { scan: response.data } });
    } catch (err) {
      console.error('[Scan] Error:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to scan image. Please try again.'
      );
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan Item</h1>
        <p className="text-gray-500 text-sm mt-1">
          Take a clear photo of your item for best results
        </p>
      </div>

      {/* Tips */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800 space-y-1">
        <div className="font-semibold mb-2">📸 Scanning Tips</div>
        <div>• For cards: include all text (player name, year, set, card number)</div>
        <div>• Good lighting, flat surface, no glare</div>
        <div>• Include any grading label (PSA, BGS, SGC)</div>
        <div>• Show the full item without cropping</div>
      </div>

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-2xl transition-all ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : preview
            ? 'border-brand-300 bg-white'
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-contain rounded-2xl"
            />
            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center">
                <div className="relative w-3/4 h-1 bg-brand-400 opacity-80 overflow-hidden rounded-full mb-4">
                  <div className="absolute inset-0 bg-brand-200 animate-pulse" />
                </div>
                <div className="text-white font-semibold animate-pulse">Analyzing...</div>
              </div>
            )}
            {/* Change button */}
            {!scanning && (
              <button
                onClick={() => { setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow hover:bg-white transition-colors"
                title="Remove image"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-gray-600 font-medium mb-4">
              Drop an image here, or choose:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Category hint chips */}
      {preview && !scanning && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Category hint (optional):</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_HINTS.map(({ id, label, icon }) => (
              <span
                key={id}
                className="badge bg-gray-100 text-gray-600 cursor-default px-3 py-1"
              >
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scan button */}
      <button
        onClick={handleScan}
        disabled={!file || scanning}
        className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-3"
      >
        {scanning ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing Image...
          </>
        ) : (
          <>
            <span>🔍</span>
            Get Pricing
          </>
        )}
      </button>
    </div>
  );
}
