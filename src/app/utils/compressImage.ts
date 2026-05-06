/**
 * Client-side image compressor. Resizes to maxDimension on the longest edge
 * and re-encodes as JPEG with the given quality. Returns the original file
 * untouched if it's already small enough — no point re-encoding.
 */
export interface CompressOptions {
  /** Skip compression entirely if the input file is at most this many bytes. */
  skipBelowBytes?: number;
  /** Cap the longest edge of the image. */
  maxDimension?: number;
  /** JPEG quality 0–1. */
  quality?: number;
}

const DEFAULT_OPTS: Required<CompressOptions> = {
  skipBelowBytes: 200 * 1024, // 200 KB
  maxDimension: 1600,
  quality: 0.82,
};

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const { skipBelowBytes, maxDimension, quality } = { ...DEFAULT_OPTS, ...opts };

  if (!file.type.startsWith("image/")) return file;
  // GIF compression via canvas would lose animation — pass through unchanged.
  if (file.type === "image/gif") return file;
  if (file.size <= skipBelowBytes) return file;

  const bitmap = await loadBitmap(file);
  const { width, height } = scaleDown(bitmap.width, bitmap.height, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if ("close" in bitmap) bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;
  if (blob.size >= file.size) return file; // re-encode bigger than original — keep original

  const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to HTMLImageElement path below
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image."));
    };
    img.src = url;
  });
}

function scaleDown(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w >= h ? max / w : max / h;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}
