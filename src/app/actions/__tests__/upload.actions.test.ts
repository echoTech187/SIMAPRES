import { describe, it, expect } from 'vitest';
import { uploadEvidenceMediaAction } from '../upload.actions';

describe('Server Action Integration: upload.actions (Media Upload SOP)', () => {
  it('uploadEvidenceMediaAction: informs user that visual uploads are disabled per field efficiency SOP', async () => {
    const formData = new FormData();
    const result = await uploadEvidenceMediaAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Upload bukti visual telah dinonaktifkan sesuai SOP SIMAPRES 110');
  });
});
