import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// ---- Types ----

export interface EstimateRow {
    id: number | string
    feature: string
    assumptions: string
    designMin: number
    designMost: number
    designMax: number
    beMin: number
    beMost: number
    beMax: number
    feMin: number
    feMost: number
    feMax: number
    sortOrder: number
}

export interface EstimateGroup {
    id: number | string
    name: string
    rows: EstimateRow[]
    sortOrder: number
}

export interface Estimate {
    id: number | string
    name: string
    createdAt: string
    updatedAt: string
    groups: EstimateGroup[]
}

// ---- API response types (snake_case from Laravel) ----

export interface ApiRow {
    id: number
    feature: string
    assumptions: string | null
    design_min: number
    design_most: number
    design_max: number
    be_min: number
    be_most: number
    be_max: number
    fe_min: number
    fe_most: number
    fe_max: number
    sort_order: number
}

export interface ApiGroup {
    id: number
    name: string
    sort_order: number
    rows: ApiRow[]
}

interface ApiEstimate {
    id: number
    name: string
    created_at: string
    updated_at: string
    groups: ApiGroup[]
}

// ---- Transformers ----

export function apiRowToRow(r: ApiRow): EstimateRow {
    return {
        id: r.id,
        feature: r.feature || '',
        assumptions: r.assumptions || '',
        designMin: r.design_min || 0,
        designMost: r.design_most || 0,
        designMax: r.design_max || 0,
        beMin: r.be_min || 0,
        beMost: r.be_most || 0,
        beMax: r.be_max || 0,
        feMin: r.fe_min || 0,
        feMost: r.fe_most || 0,
        feMax: r.fe_max || 0,
        sortOrder: r.sort_order || 0,
    }
}

export function apiGroupToGroup(g: ApiGroup): EstimateGroup {
    return {
        id: g.id,
        name: g.name,
        sortOrder: g.sort_order || 0,
        rows: (g.rows || []).map(apiRowToRow),
    }
}

function apiEstimateToEstimate(e: ApiEstimate): Estimate {
    return {
        id: e.id,
        name: e.name,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        groups: (e.groups || []).map(apiGroupToGroup),
    }
}

function rowToApiRow(r: EstimateRow) {
    return {
        id: typeof r.id === 'number' ? r.id : undefined,
        feature: r.feature,
        assumptions: r.assumptions,
        design_min: r.designMin,
        design_most: r.designMost,
        design_max: r.designMax,
        be_min: r.beMin,
        be_most: r.beMost,
        be_max: r.beMax,
        fe_min: r.feMin,
        fe_most: r.feMost,
        fe_max: r.feMax,
        sort_order: r.sortOrder,
    }
}

export function groupToApiGroup(g: EstimateGroup) {
    return {
        id: typeof g.id === 'number' ? g.id : undefined,
        name: g.name,
        sort_order: g.sortOrder,
        rows: g.rows.map(rowToApiRow),
    }
}

// ---- Helpers ----

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createRow(overrides?: Partial<EstimateRow>): EstimateRow {
    return {
        id: generateId(),
        feature: '',
        assumptions: '',
        designMin: 0,
        designMost: 0,
        designMax: 0,
        beMin: 0,
        beMost: 0,
        beMax: 0,
        feMin: 0,
        feMost: 0,
        feMax: 0,
        sortOrder: 0,
        ...overrides,
    }
}

export function createGroup(name = ''): EstimateGroup {
    return {
        id: generateId(),
        name,
        rows: [],
        sortOrder: 0,
    }
}

// ---- Calculation helpers ----

type NumericField = keyof Pick<
    EstimateRow,
    | 'designMin' | 'designMost' | 'designMax'
    | 'beMin' | 'beMost' | 'beMax'
    | 'feMin' | 'feMost' | 'feMax'
>

const NUMERIC_FIELDS: NumericField[] = [
    'designMin', 'designMost', 'designMax',
    'beMin', 'beMost', 'beMax',
    'feMin', 'feMost', 'feMax',
]

export function sumField(rows: EstimateRow[], field: NumericField): number {
    return rows.reduce((acc, row) => acc + (row[field] || 0), 0)
}

export function groupTotals(group: EstimateGroup): Record<NumericField, number> {
    const result = {} as Record<NumericField, number>
    for (const field of NUMERIC_FIELDS) {
        result[field] = sumField(group.rows, field)
    }
    return result
}

export function grandTotals(groups: EstimateGroup[]): Record<NumericField, number> {
    const result = {} as Record<NumericField, number>
    for (const field of NUMERIC_FIELDS) {
        result[field] = groups.reduce((acc, g) => acc + sumField(g.rows, field), 0)
    }
    return result
}

// ---- Store ----

const STORAGE_KEY = 'estimate-app-data'

function loadFromStorage(): Estimate[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveToStorage(estimates: Estimate[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates))
}

export const useEstimatesStore = defineStore('estimates', () => {
    const estimates = ref<Estimate[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const useBackend = ref(false)

    // Persist on every change (for offline/localStorage mode)
    watch(estimates, (val) => {
        if (!useBackend.value) saveToStorage(val)
    }, { deep: true })

    // --- Getters ---

    const estimatesList = computed(() =>
        [...estimates.value].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    )

    function getEstimate(id: string | number): Estimate | undefined {
        return estimates.value.find((e) => String(e.id) === String(id))
    }

    // --- Init: decide mode and load data ---

    async function init() {
        const authToken = useCookie('auth_token')
        if (authToken.value) {
            useBackend.value = true
            await fetchEstimates()
        } else {
            useBackend.value = false
            estimates.value = loadFromStorage()
        }
    }

    // --- API methods ---

    async function fetchEstimates() {
        loading.value = true
        try {
            const { apiFetch } = useApi()
            const data = await apiFetch<ApiEstimate[]>('/estimates')
            estimates.value = data.map(apiEstimateToEstimate)
        } catch (e) {
            console.error('Failed to fetch estimates:', e)
        } finally {
            loading.value = false
        }
    }

    async function saveEstimateToApi(estimate: Estimate) {
        saving.value = true
        try {
            const { apiFetch } = useApi()
            const data = await apiFetch<ApiEstimate>(`/estimates/${estimate.id}`, {
                method: 'PUT',
                body: {
                    name: estimate.name,
                    groups: estimate.groups.map(groupToApiGroup),
                },
            })
            // Update local state with server response
            const idx = estimates.value.findIndex(e => String(e.id) === String(estimate.id))
            if (idx !== -1) {
                estimates.value[idx] = apiEstimateToEstimate(data)
            }
        } catch (e) {
            console.error('Failed to save estimate:', e)
        } finally {
            saving.value = false
        }
    }

    // --- Estimate CRUD ---

    async function createEstimate(name: string): Promise<Estimate> {
        if (useBackend.value) {
            const { apiFetch } = useApi()
            const data = await apiFetch<ApiEstimate>('/estimates', {
                method: 'POST',
                body: { name },
            })
            const estimate = apiEstimateToEstimate(data)
            estimates.value.push(estimate)
            return estimate
        }

        const now = new Date().toISOString()
        const estimate: Estimate = {
            id: generateId(),
            name,
            createdAt: now,
            updatedAt: now,
            groups: [],
        }
        estimates.value.push(estimate)
        return estimate
    }

    async function deleteEstimate(id: string | number) {
        if (useBackend.value) {
            try {
                const { apiFetch } = useApi()
                await apiFetch(`/estimates/${id}`, { method: 'DELETE' })
            } catch (e) {
                console.error('Failed to delete estimate:', e)
            }
        }
        const idx = estimates.value.findIndex((e) => String(e.id) === String(id))
        if (idx !== -1) estimates.value.splice(idx, 1)
    }

    function updateEstimateName(id: string | number, name: string) {
        const est = getEstimate(id)
        if (est) {
            est.name = name
            est.updatedAt = new Date().toISOString()
        }
    }

    // --- Group CRUD ---

    function addGroup(estimateId: string | number, name = 'New Group'): EstimateGroup | undefined {
        const est = getEstimate(estimateId)
        if (!est) return
        const group = createGroup(name)
        group.sortOrder = est.groups.length
        est.groups.push(group)
        est.updatedAt = new Date().toISOString()
        return group
    }

    function removeGroup(estimateId: string | number, groupId: string | number) {
        const est = getEstimate(estimateId)
        if (!est) return
        const idx = est.groups.findIndex((g) => String(g.id) === String(groupId))
        if (idx !== -1) {
            est.groups.splice(idx, 1)
            est.updatedAt = new Date().toISOString()
        }
    }

    function updateGroupName(estimateId: string | number, groupId: string | number, name: string) {
        const est = getEstimate(estimateId)
        if (!est) return
        const group = est.groups.find((g) => String(g.id) === String(groupId))
        if (group) {
            group.name = name
            est.updatedAt = new Date().toISOString()
        }
    }

    // --- Row CRUD ---

    function addRow(estimateId: string | number, groupId: string | number, overrides?: Partial<EstimateRow>): EstimateRow | undefined {
        const est = getEstimate(estimateId)
        if (!est) return
        const group = est.groups.find((g) => String(g.id) === String(groupId))
        if (!group) return
        const row = createRow(overrides)
        row.sortOrder = group.rows.length
        group.rows.push(row)
        est.updatedAt = new Date().toISOString()
        return row
    }

    function removeRow(estimateId: string | number, groupId: string | number, rowId: string | number) {
        const est = getEstimate(estimateId)
        if (!est) return
        const group = est.groups.find((g) => String(g.id) === String(groupId))
        if (!group) return
        const idx = group.rows.findIndex((r) => String(r.id) === String(rowId))
        if (idx !== -1) {
            group.rows.splice(idx, 1)
            est.updatedAt = new Date().toISOString()
        }
    }

    function updateRow(estimateId: string | number, groupId: string | number, rowId: string | number, updates: Partial<EstimateRow>) {
        const est = getEstimate(estimateId)
        if (!est) return
        const group = est.groups.find((g) => String(g.id) === String(groupId))
        if (!group) return
        const row = group.rows.find((r) => String(r.id) === String(rowId))
        if (!row) return
        Object.assign(row, updates)
        est.updatedAt = new Date().toISOString()
    }

    return {
        estimates,
        estimatesList,
        loading,
        saving,
        useBackend,
        getEstimate,
        init,
        fetchEstimates,
        saveEstimateToApi,
        createEstimate,
        deleteEstimate,
        updateEstimateName,
        addGroup,
        removeGroup,
        updateGroupName,
        addRow,
        removeRow,
        updateRow,
    }
})
