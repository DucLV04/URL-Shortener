import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type ShortUrlRecord = {
  shortCode: string
  originalUrl: string
  clicks: number
  createdAt: string
}

type ShortenResponse = {
  record: ShortUrlRecord
  shortUrl: string
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
console.log("👉 API URL hiện tại là:", apiBaseUrl);
const localStorageKey = 'url-shortener:recent-urls'

function App() {
  const [inputUrl, setInputUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [latestShortUrl, setLatestShortUrl] = useState('')
  const [urls, setUrls] = useState<ShortUrlRecord[]>([])
  const [copiedValue, setCopiedValue] = useState('')

  useEffect(() => {
    const cachedUrls = window.localStorage.getItem(localStorageKey)

    if (cachedUrls) {
      setUrls(JSON.parse(cachedUrls) as ShortUrlRecord[])
    }

    void loadUrls()
  }, [])

  useEffect(() => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(urls))
  }, [urls])

  const totalClicks = useMemo(
    () => urls.reduce((sum, record) => sum + record.clicks, 0),
    [urls],
  )

  async function loadUrls() {
    try {
      const response = await fetch(`${apiBaseUrl}/api/urls`)
      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { urls: ShortUrlRecord[] }
      setUrls(data.urls)
    } catch {
      return
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: inputUrl }),
      })

      const data = (await response.json()) as ShortenResponse & { message?: string }

      if (!response.ok) {
        throw new Error(data.message ?? 'Không thể rút gọn liên kết')
      }

      setStatus('idle')
      setInputUrl('')
      setLatestShortUrl(data.shortUrl)
      setUrls((currentUrls) => [data.record, ...currentUrls.filter((item) => item.shortCode !== data.record.shortCode)])
      setMessage('Đã tạo link rút gọn thành công.')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    }
  }

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedValue(value)

    window.setTimeout(() => {
      setCopiedValue('')
    }, 1500)
  }

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)]" />

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Cloud-based URL Shortener & Analytics
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Rút gọn liên kết, theo dõi lượt click.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Dán một URL bất kỳ, tạo link ngắn tức thì và xem bảng thống kê click ngay trên dashboard.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
                <div className="space-y-2">
                  <label htmlFor="originalUrl" className="text-sm font-medium text-slate-700">
                    URL gốc
                  </label>
                  <input
                    id="originalUrl"
                    type="url"
                    required
                    value={inputUrl}
                    onChange={(event) => setInputUrl(event.target.value)}
                    placeholder="https://example.com/very/long/link"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Đang xử lý...' : 'Rút gọn ngay'}
                  </button>

                  {latestShortUrl ? (
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(latestShortUrl)}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      {copiedValue === latestShortUrl ? 'Đã copy' : 'Copy link mới'}
                    </button>
                  ) : null}
                </div>

                {message ? (
                  <p className={status === 'error' ? 'text-sm text-rose-600' : 'text-sm text-emerald-700'}>{message}</p>
                ) : null}

                {latestShortUrl ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Latest short link</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href={latestShortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all font-medium text-emerald-950 underline-offset-4 hover:underline"
                      >
                        {latestShortUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(latestShortUrl)}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ) : null}
              </form>
            </div>

            <aside className="grid content-start gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total links</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{urls.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <p className="text-sm text-slate-500">Total clicks</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{totalClicks}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">Recent URLs</h2>
                  <button
                    type="button"
                    onClick={() => void loadUrls()}
                    className="text-sm font-medium text-slate-600 hover:text-slate-950"
                  >
                    Refresh
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {urls.length === 0 ? (
                    <p className="text-sm leading-6 text-slate-500">
                      Chưa có link nào. Tạo link đầu tiên để thấy dashboard hoạt động.
                    </p>
                  ) : (
                    urls.slice(0, 4).map((record) => (
                      <div key={record.shortCode} className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-950">{record.originalUrl}</p>
                            <p className="mt-1 text-xs text-slate-500">/{record.shortCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-950">{record.clicks}</p>
                            <p className="text-xs text-slate-500">clicks</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sm:px-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Analytics dashboard</h2>
              <p className="text-sm text-slate-500">Theo dõi click count và lịch sử tạo link.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Short link</th>
                  <th className="px-6 py-4">Original URL</th>
                  <th className="px-6 py-4">Clicks</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {urls.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-sm text-slate-500" colSpan={4}>
                      Chưa có dữ liệu để hiển thị.
                    </td>
                  </tr>
                ) : (
                  urls.map((record) => (
                    <tr key={record.shortCode} className="align-top">
                      <td className="px-6 py-4 text-sm font-medium text-slate-950">/{record.shortCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <a href={record.originalUrl} target="_blank" rel="noreferrer" className="break-all hover:underline">
                          {record.originalUrl}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-950">{record.clicks}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(record.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
