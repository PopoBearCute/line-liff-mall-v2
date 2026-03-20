import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Group Buy Guide",
  description: "CPC group buy guide",
}

export default function IntroPage() {
  return (
    <main className="min-h-screen bg-white">
      <iframe
        title="CPC group buy guide"
        src="/intro-content/index.html"
        className="block h-screen w-full border-0 bg-white"
      />
    </main>
  )
}
