export type EnvironmentVariable = {
  _id: string;
  key: string;
  value: string;
};

/**
 * Diff result showing what variables need to be updated
 */
export interface VariablesDiff {
    toAdd: EnvironmentVariable[];
    toUpdate: Array<{
        key: string;
        oldValue: string;
        newValue: string;
    }>;
    toDelete: EnvironmentVariable[];
}
