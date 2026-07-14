import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "秋節禮盒銷售達人操作指引",
  description: "CPC group buy guide for sales leaders",
}

export default function SalesIntroPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="hidden min-h-screen items-center justify-center bg-slate-50 px-6 text-center min-[640px]:flex">
        <iframe
          title="秋節禮盒銷售達人操作指引"
          src="/intro-content/index.html?mode=sales"
          className="block h-screen w-full border-0 bg-white"
        />
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center min-[640px]:hidden">
        <div className="max-w-sm">
          <p className="text-xl font-bold leading-relaxed text-slate-900">
            本操作指引包含較大的系統畫面與操作標示，為確保內容清楚可讀，請使用桌上型電腦或筆記型電腦開啟。
          </p>
        </div>
      </section>
    </main>
  )
}
