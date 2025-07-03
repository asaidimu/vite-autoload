import { ComponentConfig } from "../types/components";

/**
 * Represents an entry in the NameIndex, indicating whether it's a component or a group.
 */
interface NameIndexEntry {
  /** The type of the entry: 'component' or 'group'. */
  type: "component" | "group";
  /** The name of the component this entry belongs to. */
  component: string;
  /** The name of the group, if the entry is a group. */
  group?: string;
}

/**
 * Manages a unique index of component and group names to prevent naming conflicts.
 */
export class NameIndex {
  private index = new Map<string, NameIndexEntry>();

  /**
   * Creates an instance of NameIndex.
   * @param components - An array of ComponentConfig to build the index from.
   */
  constructor(components: ComponentConfig[]) {
    this.buildIndex(components);
  }

  /**
   * Builds the internal index from the provided component configurations.
   * @param components - An array of ComponentConfig.
   * @throws Error if a duplicate name is found.
   */
  private buildIndex(components: ComponentConfig[]): void {
    for (const component of components) {
      const componentEntry: NameIndexEntry = {
        type: "component",
        component: component.name,
        group: undefined, // Explicitly set to undefined for components
      };
      this.addToIndex(component.name, componentEntry);

      for (const group of component.groups) {
        const groupEntry: NameIndexEntry = {
          type: "group",
          component: component.name,
          group: group.name,
        };
        this.addToIndex(group.name, groupEntry);
      }
    }
  }

  /**
   * Adds an entry to the index.
   * @param name - The name to add.
   * @param entry - The NameIndexEntry associated with the name.
   * @throws Error if the name already exists in the index.
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
   * Looks up an entry in the index by name.
   * @param name - The name to look up.
   * @returns The NameIndexEntry if found, otherwise undefined.
   */
  lookup(name: string): NameIndexEntry | undefined {
    return this.index.get(name);
  }
}
