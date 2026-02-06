/**
 * 画像の余白を検出してクロップする関数
 * @param {File} file - 画像ファイル
 * @param {number} threshold - 色のしきい値 (0-255)
 * @returns {Promise<{blob: Blob, originalName: string, width: number, height: number}>}
 */
export async function cropImageMargins(file, threshold = 240) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 元の画像サイズ
      const originalWidth = img.width;
      const originalHeight = img.height;

      // 一時的なCanvasに画像を描画
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0);

      // ピクセルデータを取得
      const imageData = tempCtx.getImageData(0, 0, originalWidth, originalHeight);
      const data = imageData.data;

      // 余白を検出する関数
      const isTransparentOrWhite = (r, g, b, a) => {
        // 透明ピクセルのチェック
        if (a < 128) return true;
        
        // 白またはグレーがかった白のチェック
        const brightness = (r + g + b) / 3;
        return brightness >= threshold;
      };

      // 左端を検出
      let left = 0;
      for (let x = 0; x < originalWidth; x++) {
        let hasContent = false;
        for (let y = 0; y < originalHeight; y++) {
          const idx = (y * originalWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          
          if (!isTransparentOrWhite(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          left = x;
          break;
        }
      }

      // 右端を検出
      let right = originalWidth - 1;
      for (let x = originalWidth - 1; x >= 0; x--) {
        let hasContent = false;
        for (let y = 0; y < originalHeight; y++) {
          const idx = (y * originalWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          
          if (!isTransparentOrWhite(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          right = x;
          break;
        }
      }

      // 上端を検出
      let top = 0;
      for (let y = 0; y < originalHeight; y++) {
        let hasContent = false;
        for (let x = 0; x < originalWidth; x++) {
          const idx = (y * originalWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          
          if (!isTransparentOrWhite(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          top = y;
          break;
        }
      }

      // 下端を検出
      let bottom = originalHeight - 1;
      for (let y = originalHeight - 1; y >= 0; y--) {
        let hasContent = false;
        for (let x = 0; x < originalWidth; x++) {
          const idx = (y * originalWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          
          if (!isTransparentOrWhite(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          bottom = y;
          break;
        }
      }

      // クロップ領域を計算
      const cropWidth = right - left + 1;
      const cropHeight = bottom - top + 1;

      // 有効なコンテンツがない場合、元の画像を返す
      if (cropWidth <= 0 || cropHeight <= 0 || left >= right || top >= bottom) {
        canvas.width = originalWidth;
        canvas.height = originalHeight;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve({
            blob,
            originalName: file.name,
            width: originalWidth,
            height: originalHeight,
          });
        }, file.type);
        return;
      }

      // クロップした画像を描画
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(
        img,
        left, top, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      // Blobに変換
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error('画像の変換に失敗しました'));
          return;
        }
        resolve({
          blob,
          originalName: file.name,
          width: cropWidth,
          height: cropHeight,
        });
      }, file.type);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = url;
  });
}
