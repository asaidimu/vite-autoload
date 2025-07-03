import { describe, it, expect, vi } from 'vitest';
import { createCodeGenerator } from '../../src/utils/codegen';
import type { Logger } from '../../src/utils/logger';
import { BuildContext } from '../../src/types/transform';

describe('createCodeGenerator', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockContext: BuildContext = {
    isDev: true,
    isBuild: false,
  };

  it('should generate code for a single module with default template', () => {
    const generator = createCodeGenerator({ groups: [{ name: 'module1' }] }, mockLogger);
    const data = { module1: [{ id: 1, name: 'test' }] };
    const code = generator.generateCode(data, mockContext);
    expect(code).toContain(`export const module1 = [
    {
        "id": 1,
        "name": "test"
    }
]`);
    expect(code).toContain('export default module1');
  });

  it('should generate code for multiple modules with default template', () => {
    const generator = createCodeGenerator({ groups: [{ name: 'module1' }, { name: 'module2' }] }, mockLogger);
    const data = {
      module1: [{ id: 1, name: 'test1' }],
      module2: [{ id: 2, name: 'test2' }],
    };
    const code = generator.generateCode(data, mockContext);
    expect(code).toContain(`export const module1 = [
    {
        "id": 1,
        "name": "test1"
    }
]`);
    expect(code).toContain(`export const module2 = [
    {
        "id": 2,
        "name": "test2"
    }
]`);
    expect(code).toContain(`export default {
  module1,
  module2,
}`);
  });

  it('should use custom template if provided', () => {
    const generator = createCodeGenerator(
      {
        groups: [
          {
            name: 'module1',
            output: {
              template: 'export const myModule = {{ data }};',
            },
          },
        ],
      },
      mockLogger,
    );
    const data = { module1: [{ id: 1, name: 'test' }] };
    const code = generator.generateCode(data, mockContext);
    expect(code).toContain(`export const myModule = [
    {
        "id": 1,
        "name": "test"
    }
];`);
  });
});
