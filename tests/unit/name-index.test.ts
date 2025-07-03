import { describe, it, expect, beforeEach } from 'vitest';
import { NameIndex } from '../../src/utils/name-index';
import { ComponentConfig } from '../../src/types/components';

describe('NameIndex', () => {
  let components: ComponentConfig[];
  let nameIndex: NameIndex;

  beforeEach(() => {
    components = [
      {
        name: 'routes',
        strategy: {},
        groups: [
          { name: 'views', input: {} as any },
          { name: 'api', input: {} as any },
        ],
      },
      {
        name: 'components',
        strategy: {},
        groups: [
          { name: 'ui', input: {} as any },
        ],
      },
    ];
    nameIndex = new NameIndex(components);
  });

  it('should correctly lookup a component name', () => {
    const result = nameIndex.lookup('routes');
    expect(result).toEqual({
      type: 'component',
      component: 'routes',
      group: undefined,
    });
  });

  it('should correctly lookup a group name', () => {
    const result = nameIndex.lookup('views');
    expect(result).toEqual({
      type: 'group',
      component: 'routes',
      group: 'views',
    });
  });

  it('should return undefined for a non-existent name', () => {
    const result = nameIndex.lookup('nonExistent');
    expect(result).toBeUndefined();
  });

  it('should throw an error for duplicate group names across different components', () => {
    const newComponents: ComponentConfig[] = [
      {
        name: 'app',
        strategy: {},
        groups: [
          { name: 'common', input: {} as any },
        ],
      },
      {
        name: 'admin',
        strategy: {},
        groups: [
          { name: 'common', input: {} as any }, // Duplicate group name
        ],
      },
    ];
    expect(() => new NameIndex(newComponents)).toThrowError(
      'Duplicate name "common" found. Already exists in component "app" as a group, cannot add to component "admin" as a group.'
    );
  });

  it('should throw an error when component name is same as group name', () => {
    const newComponents: ComponentConfig[] = [
      {
        name: 'test',
        strategy: {},
        groups: [
          { name: 'test', input: {} as any },
        ],
      },
    ];
    expect(() => new NameIndex(newComponents)).toThrowError(
      'Duplicate name "test" found. Already exists in component "test", cannot add to component "test" as a group.'
    );
  });

  it('should handle an empty components array', () => {
    const emptyIndex = new NameIndex([]);
    expect(emptyIndex.lookup('any')).toBeUndefined();
  });

  it('should handle a component with no groups', () => {
    const newComponents: ComponentConfig[] = [
      {
        name: 'noGroups',
        strategy: {},
        groups: [],
      },
    ];
    const index = new NameIndex(newComponents);
    expect(index.lookup('noGroups')).toEqual({
      type: 'component',
      component: 'noGroups',
      group: undefined,
    });
  });

  it('should throw an error for duplicate component names', () => {
    const newComponents: ComponentConfig[] = [
      {
        name: 'duplicate',
        strategy: {},
        groups: [],
      },
      {
        name: 'duplicate',
        strategy: {},
        groups: [],
      },
    ];
    expect(() => new NameIndex(newComponents)).toThrowError(
      'Duplicate name "duplicate" found. Already exists in component "duplicate", cannot add to component "duplicate".'
    );
  });

  it('should throw an error for duplicate group names within the same component', () => {
    const newComponents: ComponentConfig[] = [
      {
        name: 'componentWithDuplicateGroup',
        strategy: {},
        groups: [
          { name: 'groupA', input: {} as any },
          { name: 'groupA', input: {} as any },
        ],
      },
    ];
    expect(() => new NameIndex(newComponents)).toThrowError(
      'Duplicate name "groupA" found. Already exists in component "componentWithDuplicateGroup" as a group, cannot add to component "componentWithDuplicateGroup" as a group.'
    );
  });
});