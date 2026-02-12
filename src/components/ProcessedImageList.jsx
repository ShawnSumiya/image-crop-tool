import { useEffect, useState } from 'react';
import JSZip from 'jszip';

export default function ProcessedImageList({ processedImages, onRemove, isProUser }) {
  const [imageUrls, setImageUrls] = useState({});

  // 画像URLの生成とクリーンアップ
  useEffect(() => {
    const urls = {};
    processedImages.forEach((image, index) => {
      urls[index] = URL.createObjectURL(image.blob);
    });
    setImageUrls(urls);

    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [processedImages]);

  const handleDownload = (image, index) => {
    const url = URL.createObjectURL(image.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cropped_${image.originalName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    if (processedImages.length === 0) return;

    const zip = new JSZip();
    const promises = processedImages.map(async (image, index) => {
      const arrayBuffer = await image.blob.arrayBuffer();
      zip.file(`cropped_${image.originalName}`, arrayBuffer);
    });

    await Promise.all(promises);

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cropped_images.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (processedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          処理済み画像 ({processedImages.length}枚)
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadAll}
            disabled={!isProUser || processedImages.length === 0}
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              !isProUser
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            すべてダウンロード (ZIP)
          </button>
          {!isProUser && (
            <span className="text-xs text-gray-500">
              🔓 Pro版で一括ダウンロード（ZIP）が利用できます
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedImages.map((image, index) => (
          <div
            key={`${image.originalName}-${index}`}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative mb-3">
              <img
                src={imageUrls[index]}
                alt={`Cropped ${image.originalName}`}
                className="w-full h-48 object-contain rounded border border-gray-200 bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 truncate">
                {image.originalName}
              </p>
              <p className="text-xs text-gray-500">
                サイズ: {image.width} × {image.height}px
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(image, index)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  ダウンロード
                </button>
                {onRemove && (
                  <button
                    onClick={() => onRemove(index)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
