import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global confirm function for tests
global.confirm = vi.fn(() => true);