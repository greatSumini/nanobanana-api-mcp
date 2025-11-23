import { normalizePath } from '../../../src/utils/path-utils.js';

describe('normalizePath', () => {
  it('should remove leading slash', () => {
    expect(normalizePath('/path/to/file.ts')).toBe('path/to/file.ts');
  });

  it('should remove trailing slash', () => {
    expect(normalizePath('path/to/dir/')).toBe('path/to/dir');
  });

  it('should remove both leading and trailing slashes', () => {
    expect(normalizePath('/path/to/dir/')).toBe('path/to/dir');
  });

  it('should handle path without slashes', () => {
    expect(normalizePath('file.ts')).toBe('file.ts');
  });

  it('should handle empty string', () => {
    expect(normalizePath('')).toBe('');
  });

  it('should handle root path', () => {
    expect(normalizePath('/')).toBe('');
  });

  it('should handle multiple leading slashes', () => {
    expect(normalizePath('///path/to/file.ts')).toBe('path/to/file.ts');
  });

  it('should handle multiple trailing slashes', () => {
    expect(normalizePath('path/to/dir///')).toBe('path/to/dir');
  });

  it('should preserve internal slashes', () => {
    expect(normalizePath('path/to/deeply/nested/file.ts')).toBe(
      'path/to/deeply/nested/file.ts'
    );
  });

  it('should handle Windows-style paths', () => {
    expect(normalizePath('path\\to\\file.ts')).toBe('path/to/file.ts');
  });

  it('should handle mixed slashes', () => {
    expect(normalizePath('path/to\\file.ts')).toBe('path/to/file.ts');
  });
});
