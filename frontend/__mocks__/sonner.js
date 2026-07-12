// Mock que Vitest resuelve al llamar `vi.mock('sonner')` sin factory.
// El código consume el named export `toast`: `import { toast } from 'sonner'`.
import { vi } from 'vitest';

export const toast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
