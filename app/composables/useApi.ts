export const useApi = () => {
    const config = useRuntimeConfig()
    const authToken = useCookie('auth_token')

    const baseURL = config.public.apiBase as string

    const apiFetch = <T>(url: string, opts: Record<string, any> = {}): Promise<T> => {
        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...((opts.headers as Record<string, string>) || {}),
        }

        if (authToken.value) {
            headers.Authorization = `Bearer ${authToken.value}`
        }

        return $fetch<T>(url, {
            baseURL,
            credentials: 'include',
            ...opts,
            headers,
        })
    }

    return { apiFetch, authToken }
}
