// Mock que Vitest resuelve al llamar `vi.mock('axios')` sin factory.
// El código consume el export por defecto: `import axios from 'axios'`.
import { vi } from 'vitest';

export default {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};
