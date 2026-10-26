// Uses the existing middleware/uploadMemory.js (Multer memoryStorage).
// Browser sends multipart/form-data with the single field named `image`.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024;

function matchesImageSignature(file) {
  const bytes = file?.buffer;
  if (!bytes || bytes.length < 12) return false;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  return (file.mimetype === 'image/jpeg' && jpeg)
    || (file.mimetype === 'image/png' && png)
    || (file.mimetype === 'image/webp' && webp);
}

export async function uploadCampaignPoster(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Select a campaign poster image.' });
    if (!ALLOWED_TYPES.has(req.file.mimetype) || !matchesImageSignature(req.file)) {
      return res.status(415).json({ message: 'Only valid JPG, PNG and WebP images are supported.' });
    }
    if (req.file.size > MAX_SIZE) {
      return res.status(413).json({ message: 'Campaign poster cannot exceed 5 MB.' });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'Backend IMGBB_API_KEY is not configured.' });
    }

    const payload = new URLSearchParams();
    payload.set('key', apiKey);
    payload.set('image', req.file.buffer.toString('base64'));
    payload.set('name', `campaign-${Date.now()}`);

    // Requires Node.js 18+ built-in fetch.
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload,
      signal: AbortSignal.timeout(25000),
    });
    const data = await response.json().catch(() => ({}));
    const imageUrl = data?.data?.url;
    if (!response.ok || data?.success !== true || typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
      console.error('ImgBB campaign upload failed', { status: response.status, code: data?.error?.code });
      return res.status(502).json({ message: 'Poster upload failed at ImgBB.' });
    }
    return res.status(201).json({ imageUrl });
  } catch (error) {
    console.error('Campaign poster upload error', error?.name || error);
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return res.status(504).json({ message: 'ImgBB upload timed out.' });
    }
    return res.status(500).json({ message: 'Could not upload campaign poster.' });
  }
}
