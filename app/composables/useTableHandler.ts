// Shared interface for table mutation handlers.
// Both estimate pages and template pages provide this via Vue's provide/inject.

export interface TableHandler {
    addGroup: (estimateId: string | number, name?: string) => void
    removeGroup: (estimateId: string | number, groupId: string | number) => void
    updateGroupName: (estimateId: string | number, groupId: string | number, name: string) => void
    addRow: (estimateId: string | number, groupId: string | number) => void
    removeRow: (estimateId: string | number, groupId: string | number, rowId: string | number) => void
    updateRow: (estimateId: string | number, groupId: string | number, rowId: string | number, data: Record<string, any>) => void
}
