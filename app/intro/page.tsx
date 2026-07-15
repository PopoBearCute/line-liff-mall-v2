import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Building2, Monitor, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "團購主操作指引",
  description: "請依您的身分選擇對應的操作指引",
}

const roleCards = [
  {
    title: "我是加油站人員",
    description: "適用於加油站同仁建立與操作團購主帳號。",
    href: "/intro/station",
    icon: Building2,
    actionLabel: "進入加油站人員指引",
    cardClass: "border-emerald-100 bg-emerald-50/60 hover:border-emerald-300 hover:bg-emerald-50",
    iconClass: "bg-emerald-700 text-white",
    active: true,
  },
  {
    title: "我是秋節禮盒銷售達人",
    description: "了解如何取得帳號，並完成商品推薦、結單與交付流程。",
    href: "/intro/sales",
    icon: Sparkles,
    actionLabel: "進入銷售達人指引",
    cardClass: "border-sky-100 bg-sky-50/70 hover:border-sky-300 hover:bg-sky-50",
    iconClass: "bg-sky-700 text-white",
    active: true,
  },
]

export default function IntroPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="hidden min-h-screen min-[640px]:block">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-8 py-10">
          <header className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Monitor size={22} />
              </div>
              <p className="text-base font-bold text-slate-700">多角化經營發展室</p>
            </div>
            <p className="text-sm font-medium text-slate-500">團購主線上 SOP</p>
          </header>

          <section className="flex flex-1 flex-col justify-center py-12">
            <div className="max-w-4xl">
              <p className="mb-4 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                團購主操作指引
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                請依您的身分選擇對應的操作指引
              </h1>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6">
              {roleCards.map((card) => {
                const Icon = card.icon
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-6">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}>
                        <Icon size={28} />
                      </div>
                    </div>
                    <div className="mt-10">
                      <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        {card.title}
                      </h2>
                      <p className="mt-4 min-h-16 text-lg leading-8 text-slate-600">
                        {card.description}
                      </p>
                    </div>
                    <div
                      className="mt-8 flex items-center gap-2 text-base font-bold text-slate-700"
                    >
                      <span>{card.actionLabel}</span>
                      <ArrowRight size={18} />
                    </div>
                  </>
                )

                if (!card.active) {
                  return (
                    <div
                      key={card.title}
                      aria-disabled="true"
                      className={`min-h-[300px] rounded-lg border p-8 opacity-85 ${card.cardClass}`}
                    >
                      {content}
                    </div>
                  )
                }

                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className={`min-h-[300px] rounded-lg border p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${card.cardClass}`}
                  >
                    {content}
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 text-center min-[640px]:hidden">
        <div className="max-w-sm">
          <p className="text-xl font-bold leading-relaxed text-slate-900">
            本操作指引包含較大的系統畫面與操作標示，為確保內容清楚可讀，請使用桌上型電腦或筆記型電腦開啟。
          </p>
        </div>
      </section>
    </main>
  )
}
