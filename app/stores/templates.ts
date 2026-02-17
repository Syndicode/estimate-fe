import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    type EstimateGroup,
    type EstimateRow,
    type ApiGroup,
    type ApiRow,
    apiRowToRow,
    apiGroupToGroup,
    groupToApiGroup,
    createGroup,
    createRow,
    generateId,
} from '~/stores/estimates'

// ---- Template types ----

export interface Template {
    id: number | string
    name: string
    data: EstimateGroup[]
    createdAt: string
    updatedAt: string
}

interface ApiTemplate {
    id: number
    name: string
    data: ApiGroup[]
    created_at: string
    updated_at: string
}

// ---- Transformers ----

function apiTemplateToTemplate(t: ApiTemplate): Template {
    return {
        id: t.id,
        name: t.name,
        data: (t.data || []).map((g: any) => ({
            id: generateId(),
            name: g.name || '',
            sortOrder: g.sort_order ?? 0,
            rows: (g.rows || []).map((r: any) => ({
                id: generateId(),
                feature: r.feature || '',
                assumptions: r.assumptions || '',
                designMin: r.design_min ?? 0,
                designMost: r.design_most ?? 0,
                designMax: r.design_max ?? 0,
                beMin: r.be_min ?? 0,
                beMost: r.be_most ?? 0,
                beMax: r.be_max ?? 0,
                feMin: r.fe_min ?? 0,
                feMost: r.fe_most ?? 0,
                feMax: r.fe_max ?? 0,
                sortOrder: r.sort_order ?? 0,
            })),
        })),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
    }
}

function groupsToApiData(groups: EstimateGroup[]) {
    return groups.map(g => ({
        name: g.name,
        sort_order: g.sortOrder,
        rows: g.rows.map(r => ({
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
        })),
    }))
}

// ---- Store ----

export const useTemplatesStore = defineStore('templates', () => {
    const templates = ref<Template[]>([])
    const loading = ref(false)
    const saving = ref(false)

    // --- Getters ---
    const templatesList = computed(() =>
        [...templates.value].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    )

    function getTemplate(id: string | number): Template | undefined {
        return templates.value.find(t => String(t.id) === String(id))
    }

    // --- API actions ---

    async function fetchTemplates() {
        const { apiFetch } = useApi()
        loading.value = true
        try {
            const data = await apiFetch<ApiTemplate[]>('/templates')
            templates.value = data.map(apiTemplateToTemplate)
        } finally {
            loading.value = false
        }
    }

    async function fetchTemplate(id: string | number): Promise<Template> {
        const { apiFetch } = useApi()
        const data = await apiFetch<ApiTemplate>(`/templates/${id}`)
        const template = apiTemplateToTemplate(data)

        // Upsert into local list
        const idx = templates.value.findIndex(t => String(t.id) === String(id))
        if (idx >= 0) {
            templates.value[idx] = template
        } else {
            templates.value.push(template)
        }

        return template
    }

    async function createTemplate(name: string, data: EstimateGroup[] = []): Promise<Template> {
        const { apiFetch } = useApi()
        const resp = await apiFetch<ApiTemplate>('/templates', {
            method: 'POST',
            body: {
                name,
                data: groupsToApiData(data.length > 0 ? data : [createGroup('New Group')]),
            },
        })
        const template = apiTemplateToTemplate(resp)
        templates.value.push(template)
        return template
    }

    async function updateTemplate(id: string | number, name: string, groups: EstimateGroup[]) {
        const { apiFetch } = useApi()
        saving.value = true
        try {
            const resp = await apiFetch<ApiTemplate>(`/templates/${id}`, {
                method: 'PUT',
                body: {
                    name,
                    data: groupsToApiData(groups),
                },
            })
            const updated = apiTemplateToTemplate(resp)
            const idx = templates.value.findIndex(t => String(t.id) === String(id))
            if (idx >= 0) {
                templates.value[idx] = updated
            }
            return updated
        } finally {
            saving.value = false
        }
    }

    async function deleteTemplate(id: string | number) {
        const { apiFetch } = useApi()
        await apiFetch(`/templates/${id}`, { method: 'DELETE' })
        templates.value = templates.value.filter(t => String(t.id) !== String(id))
    }

    async function applyTemplate(templateId: string | number, estimateName: string) {
        const { apiFetch } = useApi()
        const resp = await apiFetch<any>(`/templates/${templateId}/apply`, {
            method: 'POST',
            body: { name: estimateName },
        })
        return resp
    }

    // --- Group/Row mutations (for template editor) ---

    function addGroupToTemplate(templateId: string | number, name = 'New Group') {
        const t = getTemplate(templateId)
        if (!t) return
        t.data.push(createGroup(name))
    }

    function removeGroupFromTemplate(templateId: string | number, groupId: string | number) {
        const t = getTemplate(templateId)
        if (!t) return
        t.data = t.data.filter(g => String(g.id) !== String(groupId))
    }

    function addRowToTemplateGroup(templateId: string | number, groupId: string | number) {
        const t = getTemplate(templateId)
        if (!t) return
        const g = t.data.find(g => String(g.id) === String(groupId))
        if (g) g.rows.push(createRow())
    }

    function removeRowFromTemplateGroup(templateId: string | number, groupId: string | number, rowId: string | number) {
        const t = getTemplate(templateId)
        if (!t) return
        const g = t.data.find(g => String(g.id) === String(groupId))
        if (g) g.rows = g.rows.filter(r => String(r.id) !== String(rowId))
    }

    function updateTemplateGroupName(templateId: string | number, groupId: string | number, name: string) {
        const t = getTemplate(templateId)
        if (!t) return
        const g = t.data.find(g => String(g.id) === String(groupId))
        if (g) g.name = name
    }

    function updateTemplateRow(templateId: string | number, groupId: string | number, rowId: string | number, field: string, value: any) {
        const t = getTemplate(templateId)
        if (!t) return
        const g = t.data.find(g => String(g.id) === String(groupId))
        if (!g) return
        const r = g.rows.find(r => String(r.id) === String(rowId))
        if (r) (r as any)[field] = value
    }

    return {
        templates,
        loading,
        saving,
        templatesList,
        getTemplate,
        fetchTemplates,
        fetchTemplate,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        applyTemplate,
        addGroupToTemplate,
        removeGroupFromTemplate,
        addRowToTemplateGroup,
        removeRowFromTemplateGroup,
        updateTemplateGroupName,
        updateTemplateRow,
    }
})
