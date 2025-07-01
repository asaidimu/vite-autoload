import { ComponentConfig } from "../types";

/**
 * Entry in the name index indicating where a named item is located
 */
export type NameIndexEntry = {
  component: string;
  group?: boolean;
};

/**
 * Global name index for tracking unique names across components and groups
 */
export class NameIndex {
  private readonly index = new Map<string, NameIndexEntry>();

  constructor(components: readonly ComponentConfig[]) {
    this.buildIndex(components);
  }

  /**
   * Build the name index from an array of component configurations
   */
  private buildIndex(components: readonly ComponentConfig[]): void {
    for (const component of components) {
      // Add component name to index
      this.addToIndex(component.name, { component: component.name });

      // Add each group name to index
      for (const group of component.groups) {
        this.addToIndex(group.name, {
          component: component.name,
          group: true,
        });
      }
    }
  }

  /**
   * Add a name to the index, throwing an error if the name already exists
   */
  private addToIndex(name: string, entry: NameIndexEntry): void {
    if (this.index.has(name)) {
      const existing = this.index.get(name)!;
      throw new Error(
        `Duplicate name "${name}" found. ` +
          `Already exists in component "${existing.component}"${existing.group ? " as a group" : ""}, ` +
          `cannot add to component "${entry.component}"${entry.group ? " as a group" : ""}.`,
      );
    }
    this.index.set(name, entry);
  }

  /**
   * Look up a name in the index
   */
  lookup(name: string): NameIndexEntry | undefined {
    return this.index.get(name);
  }

  /**
   * Check if a name exists in the index
   */
  has(name: string): boolean {
    return this.index.has(name);
  }

  /**
   * Get all names in the index
   */
  getAllNames(): string[] {
    return Array.from(this.index.keys());
  }

  /**
   * Get all component names (excluding groups)
   */
  getComponentNames(): string[] {
    return Array.from(this.index.entries())
      .filter(([, entry]) => !entry.group)
      .map(([name]) => name);
  }

  /**
   * Get all group names for a specific component
   */
  getGroupNames(componentName: string): string[] {
    return Array.from(this.index.entries())
      .filter(([, entry]) => entry.component === componentName && entry.group)
      .map(([name]) => name);
  }

  /**
   * Get all names (components and groups) for a specific component
   */
  getNamesForComponent(componentName: string): string[] {
    return Array.from(this.index.entries())
      .filter(([, entry]) => entry.component === componentName)
      .map(([name]) => name);
  }

  /**
   * Get the total number of indexed names
   */
  size(): number {
    return this.index.size;
  }

  /**
   * Create a new index from updated component configurations
   * Useful for rebuilding the index when configurations change
   */
  static rebuild(components: readonly ComponentConfig[]): NameIndex {
    return new NameIndex(components);
  }
}
