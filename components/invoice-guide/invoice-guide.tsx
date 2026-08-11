"use client"

import Image from "next/image"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import styles from "./invoice-guide.module.css"

type Phase = "scenario" | "declined" | "choice" | "tutorial" | "complete"
type GuideKey = "company" | "carrier"

type AnnotationTarget = {
  left: number
  top: number
  width: number
  height: number
}

type StepAnnotation = {
  mode: "focus" | "sequence"
  targets: AnnotationTarget[]
}

type TutorialStep = {
  image: string
  imageWidth: number
  imageHeight: number
  title: string
  description: string
  alt: string
  annotation?: StepAnnotation
}

const guides: Record<GuideKey, { label: string; steps: TutorialStep[] }> = {
  company: {
    label: "統編設定",
    steps: [
      {
        image: "/invoice-guide/invoice-type.webp",
        imageWidth: 396,
        imageHeight: 528,
        title: "直接購物，結帳時選擇三聯式",
        description: "統編不需要事先到會員設定，可以直接協助顧客選購商品。進入結帳畫面後，找到「發票資訊」區塊，打開發票類型選單並選擇「三聯式（公司戶）」。",
        alt: "發票資訊選單中顯示手機載具與三聯式公司戶選項",
        annotation: {
          mode: "focus",
          targets: [{ left: 18, top: 28.5, width: 65, height: 9 }],
        },
      },
      {
        image: "/invoice-guide/company-invoice.webp",
        imageWidth: 415,
        imageHeight: 553,
        title: "填寫公司發票資訊",
        description: "依序輸入顧客的統一編號、發票抬頭與 Email，完成前再核對一次。",
        alt: "三聯式公司戶的統一編號、發票抬頭與公司 Email 欄位",
      },
      {
        image: "/invoice-guide/checkout-confirm.webp",
        imageWidth: 416,
        imageHeight: 555,
        title: "確認資料後完成結帳",
        description: "確認金額與發票資料都正確，再點選「確認結帳」。",
        alt: "中油PAY結帳明細與確認結帳按鈕",
      },
    ],
  },
  carrier: {
    label: "雲端載具設定",
    steps: [
      {
        image: "/invoice-guide/app-home.webp",
        imageWidth: 415,
        imageHeight: 553,
        title: "購物前，先打開側邊選單",
        description: "先不要開始購物。進入中油PAY首頁，點選畫面左上角的選單圖示，準備設定顧客載具。",
        alt: "中油PAY首頁左上角的側邊選單按鈕",
        annotation: {
          mode: "focus",
          targets: [{ left: 1.5, top: 0.8, width: 10.5, height: 7.5 }],
        },
      },
      {
        image: "/invoice-guide/member-settings.webp",
        imageWidth: 654,
        imageHeight: 871,
        title: "進入會員設定",
        description: "在側邊選單中找到並點選「會員設定」。",
        alt: "中油PAY側邊選單中的會員設定項目",
        annotation: {
          mode: "focus",
          targets: [{ left: 7.5, top: 39.5, width: 28, height: 14 }],
        },
      },
      {
        image: "/invoice-guide/member-edit.webp",
        imageWidth: 654,
        imageHeight: 871,
        title: "選擇會員資料修改",
        description: "在修改項目選單中，點選「會員資料修改」。",
        alt: "修改項目選單中的會員資料修改按鈕",
      },
      {
        image: "/invoice-guide/carrier-form.webp",
        imageWidth: 616,
        imageHeight: 821,
        title: "設定顧客的共通性載具",
        description: "在購物前，輸入顧客提供的共通性載具資料，並一併填寫顧客的 Email；確認內容無誤後點選「確定」。",
        alt: "會員資料修改畫面中的共通性載具欄位與確定按鈕",
        annotation: {
          mode: "sequence",
          targets: [
            { left: 7, top: 38, width: 84, height: 10 },
            { left: 7, top: 60.5, width: 84, height: 10 },
            { left: 51, top: 83, width: 45, height: 13 },
          ],
        },
      },
      {
        image: "/invoice-guide/invoice-type.webp",
        imageWidth: 396,
        imageHeight: 528,
        title: "購物後，選擇顧客的雲端載具",
        description: "完成載具設定後，再協助顧客選購商品。進入結帳畫面時，在「發票資訊」區塊選擇「手機載具」，套用購物前設定的顧客雲端載具。",
        alt: "商品結帳畫面的發票資訊選單，顯示手機載具與三聯式公司戶選項",
        annotation: {
          mode: "focus",
          targets: [{ left: 18, top: 19.5, width: 65, height: 9 }],
        },
      },
      {
        image: "/invoice-guide/checkout-confirm.webp",
        imageWidth: 416,
        imageHeight: 555,
        title: "核對後完成結帳",
        description: "確認結帳金額與顧客的載具設定都正確，再點選「確認結帳」完成本次購買。",
        alt: "中油PAY結帳明細與確認結帳按鈕",
      },
    ],
  },
}

function ChoiceCard({
  title,
  description,
  tone = "blue",
  onClick,
}: {
  title: string
  description: string
  tone?: "blue" | "green"
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.choiceCard} ${tone === "green" ? styles.choiceCardGreen : ""}`}
      onClick={onClick}
    >
      <span className={styles.choiceCopy}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className={styles.choiceArrow} aria-hidden="true">
        <ArrowRight size={22} strokeWidth={2.2} />
      </span>
    </button>
  )
}

function AnnotationOverlay({ annotation }: { annotation?: StepAnnotation }) {
  if (!annotation) return null

  return (
    <div className={styles.annotationLayer} aria-hidden="true">
      {annotation.targets.map((target, index) => {
        const position = {
          left: `${target.left}%`,
          top: `${target.top}%`,
          width: `${target.width}%`,
          height: `${target.height}%`,
          animationDelay: `${index * 520}ms`,
        } satisfies CSSProperties

        if (annotation.mode === "focus") {
          return <span key={`${target.left}-${target.top}`} className={styles.focusMarker} style={position} />
        }

        return (
          <span key={`${target.left}-${target.top}`} className={styles.sequenceMarker} style={position}>
            <span>{index + 1}</span>
          </span>
        )
      })}
    </div>
  )
}

export function InvoiceGuide() {
  const [phase, setPhase] = useState<Phase>("scenario")
  const [guideKey, setGuideKey] = useState<GuideKey>("company")
  const [stepIndex, setStepIndex] = useState(0)
  const pageTopRef = useRef<HTMLElement>(null)

  const guide = guides[guideKey]
  const step = guide.steps[stepIndex]

  useEffect(() => {
    pageTopRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [phase, stepIndex])

  const beginGuide = (key: GuideKey) => {
    setGuideKey(key)
    setStepIndex(0)
    setPhase("tutorial")
  }

  const nextStep = () => {
    if (stepIndex === guide.steps.length - 1) {
      setPhase("complete")
      return
    }

    setStepIndex((current) => current + 1)
  }

  const previousStep = () => {
    if (stepIndex === 0) {
      setPhase("choice")
      return
    }

    setStepIndex((current) => current - 1)
  }

  const reset = () => {
    setStepIndex(0)
    setPhase("scenario")
  }

  return (
    <main ref={pageTopRef} className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.brandDot} aria-hidden="true" />
          <span>中油PAY 現場代購指引</span>
        </header>

        {phase === "scenario" && (
          <>
            <Image
              className={styles.sceneImage}
              src="/invoice-guide/scene-request.webp"
              width={900}
              height={600}
              priority
              alt="顧客詢問能否代購中油PAY商品並處理發票或統編需求"
            />
            <section className={styles.storyPanel}>
              <p className={styles.eyebrow}>現場情境</p>
              <h1>這位客人，需要幫他嗎？</h1>
              <p className={styles.lead}>代購是彈性協助，請依現場狀況決定。</p>
              <div className={styles.choiceList}>
                <ChoiceCard
                  title="幫他一把"
                  description="現場狀況允許，我願意協助代為下單"
                  onClick={() => setPhase("choice")}
                />
                <ChoiceCard
                  title="先不幫他"
                  description="目前不便代購，引導顧客自行使用中油PAY"
                  tone="green"
                  onClick={() => setPhase("declined")}
                />
              </div>
            </section>
          </>
        )}

        {phase === "declined" && (
          <>
            <Image
              className={styles.sceneImage}
              src="/invoice-guide/scene-decline.webp"
              width={900}
              height={600}
              priority
              alt="顧客了解後拿起手機，準備自行操作中油PAY"
            />
            <section className={styles.storyPanel}>
              <p className={styles.eyebrow}>友善引導</p>
              <h1>客人了解了</h1>
              <p className={styles.lead}>無法協助代購時，可請顧客自行下載或使用中油PAY完成購買。</p>
              <div className={styles.choiceList}>
                <ChoiceCard
                  title="回心轉意，幫他好了"
                  description="改由我協助處理發票需求並完成下單"
                  onClick={() => setPhase("choice")}
                />
              </div>
              <button type="button" className={styles.textButton} onClick={reset}>
                <RotateCcw size={16} /> 回到一開始
              </button>
            </section>
          </>
        )}

        {phase === "choice" && (
          <>
            <Image
              className={styles.sceneImage}
              src="/invoice-guide/scene-choice.webp"
              width={900}
              height={600}
              priority
              alt="顧客在櫃檯前等待同仁協助處理發票需求"
            />
            <section className={styles.storyPanel}>
              <p className={styles.eyebrow}>選擇操作路線</p>
              <h1>好，那客人想怎麼處理發票？</h1>
              <p className={styles.lead}>選擇需求後，畫面會一步一步帶你完成設定。</p>
              <div className={styles.choiceList}>
                <ChoiceCard
                  title="客人要打統編"
                  description="不必預先設定，購物後在結帳畫面填寫統編"
                  onClick={() => beginGuide("company")}
                />
                <ChoiceCard
                  title="客人要存雲端載具"
                  description="先設定顧客載具，再協助選購商品與結帳"
                  tone="green"
                  onClick={() => beginGuide("carrier")}
                />
              </div>
              <button type="button" className={styles.textButton} onClick={() => setPhase("scenario")}>
                <ArrowLeft size={16} /> 回上一個情境
              </button>
            </section>
          </>
        )}

        {phase === "tutorial" && (
          <section className={styles.tutorial}>
            <div className={styles.tutorialHeading}>
              <button type="button" onClick={() => setPhase("choice")} className={styles.backLink}>
                <ArrowLeft size={17} /> 重新選擇
              </button>
              <span>{guide.label}</span>
            </div>

            <div className={styles.progressBlock}>
              <div className={styles.progressMeta}>
                <span>操作步驟</span>
                <strong>{stepIndex + 1} / {guide.steps.length}</strong>
              </div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span style={{ width: `${((stepIndex + 1) / guide.steps.length) * 100}%` }} />
              </div>
            </div>

            <div className={styles.screenshotStage} key={`${guideKey}-${stepIndex}`}>
              <div
                className={styles.screenshotFrame}
                style={{ aspectRatio: `${step.imageWidth} / ${step.imageHeight}` }}
              >
                <Image
                  className={styles.screenshot}
                  src={step.image}
                  width={step.imageWidth}
                  height={step.imageHeight}
                  priority={stepIndex === 0}
                  sizes="(max-width: 520px) 100vw, 480px"
                  alt={step.alt}
                />
                <AnnotationOverlay annotation={step.annotation} />
              </div>
            </div>

            <div className={styles.instruction}>
              <span className={styles.stepBadge}>STEP {stepIndex + 1}</span>
              <h1>{step.title}</h1>
              <p>{step.description}</p>
            </div>

            <nav className={styles.controls} aria-label="教學步驟切換">
              <button type="button" className={styles.previousButton} onClick={previousStep}>
                <ArrowLeft size={19} />
                上一步
              </button>
              <button type="button" className={styles.nextButton} onClick={nextStep}>
                {stepIndex === guide.steps.length - 1 ? "完成教學" : "下一步"}
                <ArrowRight size={19} />
              </button>
            </nav>
          </section>
        )}

        {phase === "complete" && (
          <>
            <Image
              className={styles.sceneImage}
              src="/invoice-guide/scene-thanks.webp"
              width={900}
              height={600}
              priority
              alt="顧客開心地感謝同仁協助完成代購"
            />
            <section className={`${styles.storyPanel} ${styles.completeStoryPanel}`}>
              <p className={styles.eyebrow}>操作完成</p>
              <h1>最後別忘了恢復本人設定</h1>
              <p className={styles.lead}>
                代購完成後，請立即將中油PAY的發票與載具資料恢復為本人原本的設定。
              </p>
              <div className={styles.reminder}>付款完成 → 核對發票 → 恢復本人設定</div>
              <div className={styles.completeActions}>
                <button type="button" className={styles.nextButton} onClick={reset}>
                  <RotateCcw size={18} /> 下一位客人
                </button>
                <button
                  type="button"
                  className={styles.previousButton}
                  onClick={() => {
                    setStepIndex(guide.steps.length - 1)
                    setPhase("tutorial")
                  }}
                >
                  <ArrowLeft size={18} /> 回到上一步
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
