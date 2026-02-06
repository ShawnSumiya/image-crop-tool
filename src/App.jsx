import { useState, useCallback } from 'react';
import ImageDropZone from './components/ImageDropZone';
import ProcessedImageList from './components/ProcessedImageList';
import { cropImageMargins } from './utils/imageCrop';

function App() {
  const [processedImages, setProcessedImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [threshold, setThreshold] = useState(240);

  const handleFilesSelected = useCallback(async (files) => {
    setProcessing(true);
    setProcessingCount(files.length);

    const newProcessedImages = [];

    // 非同期で全画像を処理
    const processPromises = files.map(async (file) => {
      try {
        const result = await cropImageMargins(file, threshold);
        return result;
      } catch (error) {
        console.error(`画像処理エラー (${file.name}):`, error);
        return null;
      } finally {
        setProcessingCount((prev) => Math.max(0, prev - 1));
      }
    });

    const results = await Promise.all(processPromises);
    const validResults = results.filter((result) => result !== null);

    setProcessedImages((prev) => [...prev, ...validResults]);
    setProcessing(false);
    setProcessingCount(0);
  }, [threshold]);

  const handleRemoveImage = useCallback((index) => {
    setProcessedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            画像余白自動クロップツール
          </h1>
          <p className="text-gray-600">
            画像の周囲の透明または白い余白を自動で検出して切り取ります
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              色のしきい値 (Threshold): {threshold}
            </label>
            <input
              type="range"
              min="200"
              max="255"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>厳しい (200)</span>
              <span>緩い (255)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              値が大きいほど、より明るい色まで余白として認識します
            </p>
          </div>

          <ImageDropZone onFilesSelected={handleFilesSelected} />

          {processing && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-blue-600">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="font-medium">
                  処理中... ({processingCount}枚残り)
                </span>
              </div>
            </div>
          )}
        </div>

        <ProcessedImageList
          processedImages={processedImages}
          onRemove={handleRemoveImage}
        />
      </div>
    </div>
  );
}

export default App;
