export interface ClientConfig {
  baseUrl: string
  token?: string
}

export interface ListResult<T> {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

export interface SendOptions {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

export class PocketBaseClient {
  public baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private getBaseUrl(): string {
    if (this.baseUrl) return this.baseUrl
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin
    }
    return ''
  }

  async send<T = unknown>(path: string, options: SendOptions = {}): Promise<T> {
    const base = this.getBaseUrl()
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(`${base}${cleanPath}`)

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    const headers: Record<string, string> = {
      ...(options.headers || {}),
    }

    let bodyData: BodyInit | undefined
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      bodyData = JSON.stringify(options.body)
    }

    const response = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: bodyData,
    })

    if (!response.ok) {
      let errData: unknown
      try {
        errData = await response.json()
      } catch {
        // silent
      }
      const err = new Error(`PocketBase request failed with status ${response.status}`)
      ;(err as unknown as { status: number; data: unknown }).status = response.status
      ;(err as unknown as { status: number; data: unknown }).data = errData
      throw err
    }

    // Some endpoints may return empty response (like 204)
    if (response.status === 204) {
      return {} as T
    }

    return (await response.json()) as T
  }

  collection<T = unknown>(collectionName: string) {
    return {
      getFullList: async (
        options: { sort?: string; filter?: string; fields?: string } = {},
      ): Promise<T[]> => {
        const params: Record<string, string | number | boolean | undefined> = {
          page: 1,
          perPage: 500,
          sort: options.sort,
          filter: options.filter,
          fields: options.fields,
        }
        const res = await this.send<ListResult<T>>(`/api/collections/${collectionName}/records`, {
          method: 'GET',
          params,
        })
        return res.items || []
      },

      getFirstListItem: async (filter: string, options: { fields?: string } = {}): Promise<T> => {
        const params: Record<string, string | number | boolean | undefined> = {
          page: 1,
          perPage: 1,
          filter,
          fields: options.fields,
        }
        const res = await this.send<ListResult<T>>(`/api/collections/${collectionName}/records`, {
          method: 'GET',
          params,
        })
        if (!res.items || res.items.length === 0) {
          const err = new Error(`The requested resource wasn't found in ${collectionName}.`)
          ;(err as unknown as { status: number }).status = 404
          throw err
        }
        return res.items[0]
      },

      create: async (data: Record<string, unknown>): Promise<T> => {
        return this.send<T>(`/api/collections/${collectionName}/records`, {
          method: 'POST',
          body: data,
        })
      },
    }
  }
}

// Global PocketBase instance reading from environment or default to current origin
const pbUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POCKETBASE_URL) || ''
export const pb = new PocketBaseClient(pbUrl)
