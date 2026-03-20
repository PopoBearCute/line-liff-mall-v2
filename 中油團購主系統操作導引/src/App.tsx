/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Info,
  ArrowRight,
  MousePointer2,
  Layout,
  Settings,
  Users,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

// --- Types ---
interface QA {
  question: string;
  answer: string;
}

interface Step {
  id: number;
  title: string;
  description?: string;
  content: StepContent[];
  links?: { label: string; url: string }[];
  completionTip?: string;
  qa?: QA[];
}

interface StepContent {
  image: string;
  subtitle?: string;
  description?: string;
  highlights: Highlight[];
  helpMedia?: string;
  link?: { label: string; url: string };
  linkFirst?: boolean;
  qa?: QA[];
}

interface Highlight {
  top: string;
  left: string;
  width: string;
  height: string;
  label: string;
}

interface EditorTarget {
  stepId: number;
  contentIndex: number;
  highlightIndex: number;
}

// --- Utils ---
const getImageWidth = (image: string, stepId?: number): string => {
  const isPng = image.toLowerCase().endsWith('.png');
  const factor = isPng ? (2 / 3) : 1;

  // Specific widths requested by the user
  const fixedWidths: Record<string, string> = {
    "/step1_login.png": "420px",
    "/step1_create.png": "420px",
    "/step1_final.png": "420px",
    "/step1_edit.png": "420px",
    "/step1_edit_expanded.png": "420px",
    "/QrCode.jpg": "170px",
    "/liffQRcode.png": "170px",
  };

  if (fixedWidths[image]) return fixedWidths[image];

  if (image.toLowerCase().endsWith('.gif')) return "700px";

  return `${Math.round(800 * factor)}px`;
};

/**
 * Option A Copywriting (Integrated & Plain Text)
 */
const getActionLabel = (originalLabel: string): string => {
  if (originalLabel.includes("新增使用者")) return "「新增團購主帳號」";
  if (originalLabel.includes("登入團購主帳號")) return "「團購主登入」";
  if (originalLabel.includes("團購選品頁")) return "「選品推薦作業」";
  if (originalLabel.includes("結單")) return "「結單作業」";
  if (originalLabel.includes("待收貨")) return "「收貨作業」";
  if (originalLabel.includes("待取貨")) return "「取貨作業」";
  if (originalLabel.includes("推廣獎勵辦法")) return "「下載團購業務推廣獎勵辦法」";
  return originalLabel;
};

const HIGHLIGHT_STORAGE_KEY = 'cpc-guide-highlight-editor-v4';

const cloneSteps = (): Step[] => JSON.parse(JSON.stringify(STEPS)) as Step[];

const loadStoredSteps = (): Step[] => {
  const codeSteps = cloneSteps();
  if (typeof window === 'undefined') return codeSteps;
  try {
    const raw = window.localStorage.getItem(HIGHLIGHT_STORAGE_KEY);
    if (!raw) return codeSteps;
    const storedSteps = JSON.parse(raw) as Step[];

    // Merge: only use coordinates from storage, keep text from code
    return codeSteps.map((cs) => {
      const ss = storedSteps.find(s => s.id === cs.id);
      if (!ss) return cs;
      return {
        ...cs,
        content: cs.content.map((cc, cIdx) => {
          const sc = ss.content[cIdx];
          if (!sc) return cc;
          return {
            ...cc,
            highlights: cc.highlights.map((ch, hIdx) => {
              const sh = sc.highlights[hIdx];
              if (!sh) return ch;
              return { ...ch, top: sh.top, left: sh.left, width: sh.width, height: sh.height };
            })
          };
        })
      };
    });
  } catch {
    return codeSteps;
  }
};

const parsePercent = (value: string): number => parseFloat(value.replace('%', '')) || 0;
const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`;

const isSameTarget = (a: EditorTarget | null, b: EditorTarget | null): boolean => {
  if (!a || !b) return false;
  return a.stepId === b.stepId && a.contentIndex === b.contentIndex && a.highlightIndex === b.highlightIndex;
};

const updateHighlightInSteps = (
  steps: Step[],
  target: EditorTarget,
  updater: (h: Highlight) => Highlight,
): Step[] => steps.map((s) => {
  if (s.id !== target.stepId) return s;
  return {
    ...s,
    content: s.content.map((c, cIdx) => {
      if (cIdx !== target.contentIndex) return c;
      return {
        ...c,
        highlights: c.highlights.map((h, hIdx) => hIdx === target.highlightIndex ? updater(h) : h),
      };
    }),
  };
});

const buildHighlightChangeSummary = (currentSteps: Step[]): string => {
  const lines = currentSteps.flatMap((step) => (
    step.content.flatMap((content, contentIndex) => (
      content.highlights.flatMap((highlight, highlightIndex) => {
        const oStep = STEPS.find(os => os.id === step.id);
        const oHighlight = oStep?.content[contentIndex]?.highlights[highlightIndex];

        if (!oHighlight) return [];

        const changed = (['top', 'left', 'width', 'height'] as const).filter(
          (f) => oHighlight[f] !== highlight[f],
        );

        if (changed.length === 0) return [];

        return [
          `Step ${step.id} / ${content.subtitle || content.image} / ${highlight.label}`,
          `- before: T:${oHighlight.top} L:${oHighlight.left} W:${oHighlight.width} H:${oHighlight.height}`,
          `- after:  T:${highlight.top} L:${highlight.left} W:${highlight.width} H:${highlight.height}`,
          `- changed: ${changed.join(', ')}`,
          '',
        ];
      })
    ))
  ));
  return lines.length > 0 ? lines.join('\n').trim() : '沒有變更。';
};

// --- Mock Data ---
const STEPS: Step[] = [
  {
    id: 1,
    title: "新增團購主帳號",
    completionTip: "切換帳號",
    links: [
      { label: "前往新增使用者頁面", url: "https://ecm.cpc.com.tw/omotest/user/create" }
    ],
    content: [
      {
        subtitle: "1. 登入加油站帳號",
        image: "/step1_login.png",
        highlights: [
          { top: "59.3%", left: "16.4%", width: "63%", height: "7.5%", label: "帳號：輸入您的「站代號」" },
          { top: "68.4%", left: "15.3%", width: "63%", height: "7.5%", label: "密碼：預設為「站代號」" }
        ]
      },
      {
        subtitle: "2. 填寫帳號基本資訊",
        image: "/step1_create.png",
        helpMedia: "/manual_nav.gif",
        highlights: [
          { top: "38.7%", left: "-40%", width: "60%", height: "5%", label: "輸入「工號」" },
          { top: "48%", left: "-35.4%", width: "60%", height: "5%", label: "設定您的「密碼」" },
          { top: "56.6%", left: "-15%", width: "10%", height: "4%", label: "勾選「啟用」" },
          { top: "74.3%", left: "-42.3%", width: "74%", height: "6%", label: "選擇「所屬門店」" },
          { top: "87.6%", left: "-37.7%", width: "72%", height: "6%", label: "點擊「儲存」完成設定" }
        ]
      },
      {
        subtitle: "3. 找到帳號並點擊編輯",
        image: "/step1_final.png",
        helpMedia: "/step1_final.gif",
        highlights: [
          { top: "90%", left: "13%", width: "70%", height: "10%", label: "找到剛剛建立的帳號 (如 DXXXX-123456) 並點擊「編輯」" }
        ]
      },
      {
        subtitle: "4. 開啟團購主開關",
        image: "/step1_edit.png",
        highlights: [
          { top: "75.4%", left: "57.9%", width: "10%", height: "3.5%", label: "開啟「是否為團購主」開關" }
        ]
      },
      {
        subtitle: "5. 填寫資訊並儲存",
        image: "/step1_edit_expanded.png",
        highlights: [
          { top: "16.3%", left: "-27.4%", width: "70%", height: "40%", label: "填寫團主名稱、卡號、電話等必填資訊" },
          { top: "91.2%", left: "-32.4%", width: "74%", height: "6%", label: "點擊「儲存」完成設定" }
        ]
      }
    ],
  },
  {
    id: 2,
    title: "登入團購主帳號",
    description: "使用步驟 A 建立的「團購主帳號」登入。帳號格式為「站代號-工號」，密碼為您自行設定的密碼。",
    content: [
      {
        image: "/step1_login.png",
        highlights: [
          { top: "59.7%", left: "18.6%", width: "63%", height: "7.5%", label: "帳號：DXXXX-123456" },
          { top: "68.4%", left: "18.7%", width: "63%", height: "7.5%", label: "密碼：您設定的密碼" }
        ]
      }
    ],
    links: [
      { label: "B. 登入團購主帳號", url: "https://ecm.cpc.com.tw/omotest" }
    ]
  },
  {
    id: 3,
    title: "選品推薦作業",
    description: "進入選品頁挑選商品，點擊「推薦作業」後進入商品頁，按下底部的「我要推薦」按鈕即可完成。",
    content: [
      {
        image: "/step3_selection.gif",
        highlights: [
          { top: "47.5%", left: "-30%", width: "30%", height: "8%", label: "選擇要推薦的商品" },
          { top: "68.7%", left: "-24.5%", width: "15%", height: "6%", label: "點擊「推薦作業」按鈕" },
          { top: "97.6%", left: "-27%", width: "20%", height: "8%", label: "頁面底部「我要推薦」" }
        ]
      }
    ],
    links: [
      { label: "點擊進入團購選品頁", url: "https://ecm.cpc.com.tw/omotest/groupbuyselection/selectionlist" }
    ],
    qa: [
      {
        question: "什麼是「選品推薦作業」?",
        answer: "超過三名團購主發起推薦作業，這項商品就會募集成功立案。"
      },
      {
        question: "什麼是我要推薦?",
        answer: "團購主推薦以後，消費者即可在中油PAY中，選擇貴站之團購主並配送至貴站。"
      },
      {
        question: "什麼時候要來推薦?",
        answer: "官方社群會定期通知新品上架，您可以在團購檔期中任何時間前來點擊我要推薦，並通知您的團員、好友。"
      }
    ]
  },
  {
    id: 4,
    title: "結單與取貨",
    description: "完成結單、收貨與發貨流程。",
    content: [
      {
        subtitle: "滿足最小訂購量後，可進行「結單作業」",
        image: "/結單作業.gif",
        link: { label: "團購訂單管理 (結單)", url: "https://ecm.cpc.com.tw/omotest/groupbuyselection/settlementlist" },
        highlights: [
          { top: "24%", left: "-27%", width: "40%", height: "8%", label: "1. 選擇結單商品" },
          { top: "35%", left: "-27%", width: "40%", height: "8%", label: "2. 勾選欲結訂單" },
          { top: "48%", left: "-27%", width: "40%", height: "8%", label: "3. 確認結單" },
          { top: "61.5%", left: "-32%", width: "50%", height: "10%", label: "4. 結單完成廠商開始出貨" }
        ],
        qa: [
          {
            question: "什麼是結單?",
            answer: "結單就是將訂單狀態轉為已結單，廠商就會開始出貨。"
          },
          {
            question: "什麼時候要結單?",
            answer: "團購訂單數量達最小訂購量後，即可進行結單。例如最小訂購量10包,而您勾選的訂單超過10包,即可隨時結單。"
          },
          {
            question: "未達最小訂購量會怎樣?",
            answer: "未達最小訂購量將無法結單，並在商品活動期間結束後三天系統將訂單款項退還至消費者帳戶。"
          },
          {
            question: "沒有結單會怎樣?",
            answer: "沒有結單將無法出貨，商品將持續募集，直到訂單數量達最小訂購量，或於活動期間結束後三天系統將訂單款項退還至消費者帳戶。"
          }
        ]
      },
      {
        subtitle: "1.物流送貨到站，簽收並取得「到站取貨單」",
        image: "/到站取貨單.gif",
        link: { label: "團購待收貨頁面", url: "https://ecm.cpc.com.tw/omotest/groupbuyinbound/list" },
        linkFirst: true,
        highlights: [],
        qa: [
          {
            question: "到站取貨單是什麼?",
            answer: "到站取貨單是團購主結單後，廠商出貨時會附上的單據，上面有每個客戶的取貨資訊。"
          },
          {
            question: "到站取貨單在哪裡?",
            answer: "到站取貨單在包裹內，請務必清點數量。"
          },
          {
            question: "包裹內沒有到站取貨單、或是弄丟了怎麼辦?",
            answer: "請使用團購主群組或連繫多角化室，我們將協助您處理。"
          }
        ]
      },
      {
        subtitle: "2.清點貨品數量，進行「收貨作業」",
        image: "/收貨作業.gif",
        highlights: [
          { top: "85%", left: "85%", width: "30%", height: "15%", label: "點擊確認到貨" }
        ],
        qa: [
          {
            question: "什麼是收貨作業?",
            answer: "收貨作業是指當廠商將商品送達加油站時，您在系統中確認商品已到貨的流程，這會將訂單狀態更新為「待取貨」。"
          },
          {
            question: "收貨時要注意什麼?",
            answer: "外箱若明顯破損，請向物流拒收;開箱確認商品數量與品項無誤後，請立即在系統中點擊「確認到貨」，以便消費者收到取貨通知。"
          },
          {
            question: "要通知消費者商品到貨嗎?",
            answer: "點擊確認到貨後，系統會自動發送取貨通知給消費者。"
          }
        ]
      },
      {
        subtitle: "3. 消費者到站，進行「取貨作業」",
        image: "/取貨作業.gif",
        link: { label: "團購待取貨頁面 (發貨)", url: "https://ecm.cpc.com.tw/omotest/groupbuypickup/list" },
        linkFirst: true,
        highlights: [],
        qa: [
          {
            question: "什麼是取貨作業?",
            answer: "取貨作業是指將到貨的商品交付給消費者的過程。核對客戶身分後，掃描到站取貨單中該位客戶之條碼。"
          },
          {
            question: "消費者如何取貨?",
            answer: "消費者出示證件與手機後三碼，確認商品交付即完成取貨。"
          },
          {
            question: "發貨後訂單狀態會變嗎?",
            answer: "是的，完成取貨後系統會自動將訂單狀態更新為「已取貨」，代表該筆交易已完成。"
          }
        ]
      }
    ],
    qa: []
  },
  {
    id: 5,
    title: "社群與工具",
    description: "掌握最新消息，使用工具快速分享。",
    content: [
      {
        subtitle: "1. 加入官方社群",
        description: "掌握商品動態，提供各類反饋與服務。",
        image: "/QrCode.jpg",
        highlights: [
          { top: "50.0%", left: "-90.7%", width: "20%", height: "20%", label: "手機掃碼加入官方社群" }
        ],
        qa: [
          {
            question: "為什麼要加入社群？",
            answer: "官方社群將定期提供最新商品資訊、問題反映窗口及社群轉傳素材，協助您即時分享給消費者，提升推廣與銷售效率。"
          }
        ]
      },
      {
        subtitle: "2. 社群分享工具",
        description: "分享工具，快速產生推廣圖文與連結，讓社群經營更輕鬆。",
        image: "/liffQRcode.png",
        highlights: [
          { top: "50%", left: "-84.5%", width: "20%", height: "20%", label: "掃碼開啟工具" }
        ],
        qa: [
          {
            question: "這個工具是做什麼的？",
            answer: "這是專為團購設計的整合工具。您可以生成商品 DM 與下單連結，讓成員輕鬆下單；頁面中可以統計訂單數量，也可直接分享資訊至站外或社群。"
          }
        ]
      }
    ],
    qa: []
  },
  {
    id: 6,
    title: "獎勵辦法",
    description: "詳情請見連結",
    links: [
      { label: "獎勵辦法", url: "/團購業務推廣獎勵辦法.pdf" }
    ],
    content: [
      {
        subtitle: "1. 加油站激勵獎金",
        description: "依據各站每月「團購營業額」總額，按比例計算獎金：\n\n滿 20,000 元：發放 1.5%\n滿 40,000 元：發放 2.0%\n滿 80,000 元：發放 3.0%\n範例：若當月營業額為 48,800 元，獎金計算為 48,800 × 2.0% = 976 元。",
        image: "",
        highlights: []
      },
      {
        subtitle: "2. 每季特別獎",
        description: "針對全台加油站當季銷售營業額進行排序：\n\n第 1 名：獎金 3,000 元\n第 2 名：獎金 2,000 元\n第 3 至 5 名：獎金 1,000 元",
        image: "",
        highlights: []
      },
      {
        subtitle: "3. 年度貢獻獎",
        description: "統計全年度團購總營業額：\n\n全台前 10 名 加油站：每站發放 5,000 元 獎金。",
        image: "",
        highlights: [],
        qa: [
          {
            question: "如何知道自己的銷售業績？",
            answer: "原則上於次月 15 日前完成，營業額資料由多角化室提供各營業處。"
          }
        ]
      }
    ]
  }
];

// --- Components ---

const HighlightBox: React.FC<{
  highlight: Highlight;
  status: 'hidden' | 'typing' | 'visible';
  onComplete: () => void;
  editing?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}> = ({
  highlight,
  status,
  onComplete,
  editing = false,
  selected = false,
  onSelect,
}) => {
    const [displayText, setDisplayText] = useState("");

    const hasSeparator = highlight.label.includes('：');
    const prefix = hasSeparator ? highlight.label.split('：')[0] + '：' : '';
    const typingPart = hasSeparator ? highlight.label.split('：')[1] : highlight.label;

    useEffect(() => {
      if (status === 'hidden') {
        setDisplayText("");
        return;
      }

      if (status === 'visible') {
        setDisplayText(typingPart);
        return;
      }

      let currentText = "";
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < typingPart.length) {
          currentText += typingPart.charAt(i);
          setDisplayText(currentText);
          i++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => onComplete(), 1000);
        }
      }, 100);

      return () => clearInterval(typingInterval);
    }, [status, typingPart, onComplete]);

    return (
      <motion.div
        className={`absolute z-50 transition-opacity duration-500 ${status === 'hidden' ? 'opacity-0' : 'opacity-100'} ${editing ? 'cursor-pointer' : ''}`}
        style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
        onClick={(event) => {
          if (!editing) return;
          event.stopPropagation();
          onSelect?.();
        }}
      >
        {editing && (
          <div className={`absolute inset-0 rounded-2xl border-2 ${selected ? 'border-amber-400 bg-amber-300/20' : 'border-emerald-400/70 bg-emerald-300/10'}`}>
            <div className={`absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${selected ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          </div>
        )}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className={`whitespace-nowrap text-white text-[18px] font-bold px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-1 border border-white/20 ${selected ? 'bg-amber-500' : 'bg-emerald-600'}`}>
            {prefix && <span className="text-emerald-100/80">{prefix}</span>}
            <span>{displayText}</span>
            {status === 'typing' && !editing && <span className="w-1 h-5 bg-white/60 animate-pulse ml-0.5" />}
          </div>
        </div>
      </motion.div>
    );
  };

const HighlightGroup = ({
  highlights,
  editing = false,
  selectedIndex = null,
  onSelect,
}: {
  highlights: Highlight[];
  editing?: boolean;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReset, setIsReset] = useState(false);

  const handleComplete = () => {
    if (activeIndex < highlights.length - 1) {
      setActiveIndex(prev => prev + 1);
    } else {
      setIsReset(true);
      setTimeout(() => { setActiveIndex(0); setIsReset(false); }, 4000);
    }
  };

  return (
    <div>
      {highlights.map((h, i) => (
        <HighlightBox
          key={i}
          highlight={h}
          status={editing ? 'visible' : isReset ? 'visible' : i < activeIndex ? 'visible' : i === activeIndex ? 'typing' : 'hidden'}
          onComplete={handleComplete}
          editing={editing}
          selected={selectedIndex === i}
          onSelect={() => onSelect?.(i)}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [activeStepId, setActiveStepId] = useState(1);
  const [stepsData, setStepsData] = useState<Step[]>(loadStoredSteps);
  const [isEditMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('edit') === '1';
  });
  const [selectedTarget, setSelectedTarget] = useState<EditorTarget | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      let candidateId = activeStepId;
      const steps = stepsData.map(s => document.getElementById(`step-${s.id}`));
      steps.forEach(el => {
        if (el && el.getBoundingClientRect().top <= 200) candidateId = parseInt(el.id.replace('step-', ''));
      });
      setActiveStepId(candidateId);
    }, { rootMargin: '0px 0px -60% 0px' });
    stepsData.forEach(s => { const el = document.getElementById(`step-${s.id}`); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [activeStepId, stepsData]);

  // Keyboard micro-adjustments
  useEffect(() => {
    if (!isEditMode || !selectedTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;

      const moveStep = e.shiftKey ? 2 : 0.5;
      const isResize = e.altKey;

      setStepsData(prev => updateHighlightInSteps(prev, selectedTarget, (h) => {
        const next = { ...h };
        if (e.key === 'ArrowUp') {
          if (isResize) next.height = formatPercent(parsePercent(h.height) - moveStep);
          else next.top = formatPercent(parsePercent(h.top) - moveStep);
        }
        if (e.key === 'ArrowDown') {
          if (isResize) next.height = formatPercent(parsePercent(h.height) + moveStep);
          else next.top = formatPercent(parsePercent(h.top) + moveStep);
        }
        if (e.key === 'ArrowLeft') {
          if (isResize) next.width = formatPercent(parsePercent(h.width) - moveStep);
          else next.left = formatPercent(parsePercent(h.left) - moveStep);
        }
        if (e.key === 'ArrowRight') {
          if (isResize) next.width = formatPercent(parsePercent(h.width) + moveStep);
          else next.left = formatPercent(parsePercent(h.left) + moveStep);
        }
        return next;
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedTarget]);

  // Save to LS
  useEffect(() => {
    if (isEditMode) {
      window.localStorage.setItem(HIGHLIGHT_STORAGE_KEY, JSON.stringify(stepsData));
    }
  }, [stepsData, isEditMode]);

  const handleCanvasPlacement = (e: React.MouseEvent, stepId: number, cIdx: number) => {
    if (!isEditMode || !selectedTarget) return;
    if (selectedTarget.stepId !== stepId || selectedTarget.contentIndex !== cIdx) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setStepsData(prev => updateHighlightInSteps(prev, selectedTarget, (h) => ({
      ...h,
      top: formatPercent(y),
      left: formatPercent(x),
    })));
  };

  return (
    <div className="min-h-screen flex flex-col scroll-smooth relative bg-white">
      {/* Shimmer CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase mb-4">多角化室</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">團購主系統操作導引</h2>
          </div>
        </section>

        {/* Guide */}
        <section className="py-12 bg-slate-50">
          <div className="px-4 lg:px-10">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 shrink-0">
                <div className="sticky top-24 space-y-2">
                  {stepsData.map((s) => (
                    <a key={s.id} href={`#step-${s.id}`} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 ${activeStepId === s.id ? "bg-white shadow-lg text-emerald-600 border-l-4 border-emerald-500" : "text-slate-500 hover:text-emerald-600 border-l-4 border-transparent"}`}>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${activeStepId === s.id ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{String.fromCharCode(64 + s.id)}</span>
                      <p className="font-bold text-lg">{s.title}</p>
                    </a>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-16">
                {stepsData.map((step) => (
                  <motion.div key={step.id} id={`step-${step.id}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-[32px] shadow-xl border border-slate-100 scroll-mt-24 overflow-hidden">
                    <div className="p-10 border-b border-slate-50 flex flex-col items-center justify-center gap-6 text-center">
                      {step.links?.[0] ? (
                        <div className="flex flex-col items-center gap-6">
                          <div className="relative group/link-primary" style={{ width: getImageWidth(step.content[0].image, step.id) }}>
                            <a href={step.links[0].url} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden px-6 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl shadow-slate-900/20 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98] border-2 border-slate-700/50 w-full text-center hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] group">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                              <div className="flex items-center justify-center gap-3 relative z-10 w-full text-center">
                                {getActionLabel(step.links[0].label)}
                              </div>
                            </a>

                            {/* Click Simulation Animation */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-[75%] pointer-events-none z-20">
                              {[...Array(7)].map((_, i) => (
                                <motion.div key={i} className="absolute top-0 left-0 w-10 h-10 -ml-5 -mt-5 bg-emerald-300 rounded-full opacity-0" animate={{ scale: [0, 2.5], opacity: [0, 0.5, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5, delay: 0.5 + (i * 0.2) }} />
                              ))}
                              <motion.div animate={{ scale: [1, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 1], x: [20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20], y: [20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20], opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 text-emerald-400/80 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] origin-top-left">
                                <MousePointer2 size={42} className="fill-emerald-500/50" />
                              </motion.div>
                            </div>
                          </div>
                          {step.description && (
                            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto -mt-2">{step.description}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-3xl font-black text-slate-900 tracking-tight">{step.title}</h4>
                          {step.description && (
                            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto">{step.description}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-10 space-y-12">
                      {step.content.map((c, idx) => {
                        const width = getImageWidth(c.image, step.id);
                        return (
                          <div key={idx} className="space-y-8 flex flex-col items-center">
                            {(c.subtitle || c.description) && (
                              <div className="flex flex-col items-center justify-center gap-6 text-center w-full">
                                {c.link ? (
                                  <div className="flex flex-col items-center gap-4">
                                    {c.linkFirst ? null : (
                                      c.subtitle && <h5 className="text-2xl font-bold text-slate-800">{c.subtitle}</h5>
                                    )}
                                    <div className="relative group/link-inline inline-block" style={{ width }}>
                                      <a href={c.link.url} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-lg shadow-slate-900/20 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98] border-2 border-slate-700/50 w-full text-center hover:shadow-[0_15px_30px_rgba(16,185,129,0.3)] group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                                        <div className="flex items-center justify-center gap-2 relative z-10">
                                          {getActionLabel(c.link.label)}
                                        </div>
                                      </a>

                                      {/* Animated Mouse for Inline Link */}
                                      <div className="absolute left-1/2 -translate-x-1/2 top-[80%] pointer-events-none z-20">
                                        {[...Array(5)].map((_, i) => (
                                          <motion.div key={i} className="absolute top-0 left-0 w-8 h-8 -ml-4 -mt-4 bg-emerald-300 rounded-full opacity-0" animate={{ scale: [0, 2], opacity: [0, 0.5, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2.5, delay: 0.5 + (i * 0.2) }} />
                                        ))}
                                        <motion.div animate={{ scale: [1, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 0.8, 1, 1], opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] }} transition={{ duration: 4, repeat: Infinity }} className="relative z-10 text-emerald-400 drop-shadow-md">
                                          <MousePointer2 size={36} className="fill-emerald-500/50" />
                                        </motion.div>
                                      </div>
                                    </div>
                                    {c.linkFirst && c.subtitle && (
                                      <h5 className="text-2xl font-bold text-slate-800">{c.subtitle}</h5>
                                    )}
                                    {c.description && (
                                      <p className="text-slate-500 text-base max-w-xl mx-auto -mt-2 whitespace-pre-line">{c.description}</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <h5 className="text-2xl font-bold text-slate-800">{c.subtitle}</h5>
                                    {c.description && (
                                      <p className="text-slate-500 text-base max-w-xl mx-auto whitespace-pre-line">{c.description}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="relative w-full flex flex-col items-center">
                              {c.image && (
                                <div className="relative mx-auto w-fit">
                                  <div className="absolute inset-0 z-40">
                                    <HighlightGroup
                                      highlights={c.highlights}
                                      editing={isEditMode}
                                      selectedIndex={isSameTarget(selectedTarget, { stepId: step.id, contentIndex: idx, highlightIndex: 0 }) ? selectedTarget?.highlightIndex : null}
                                      onSelect={(hIdx) => setSelectedTarget({ stepId: step.id, contentIndex: idx, highlightIndex: hIdx })}
                                    />
                                  </div>
                                  <div
                                    className={`relative group border border-slate-200 rounded-3xl overflow-hidden shadow-2xl ${isEditMode ? 'cursor-crosshair' : ''}`}
                                    style={{ width: width }}
                                    onClick={(e) => handleCanvasPlacement(e, step.id, idx)}
                                  >
                                    <img src={c.image} alt="" className="w-full h-auto block" />
                                  </div>
                                  {c.helpMedia && (
                                    <div className="absolute -right-20 lg:-right-32 top-1/2 -translate-y-1/2 group/help z-50 pointer-events-auto">
                                      <div className="flex flex-col items-center gap-2 cursor-help p-5 rounded-[2rem] bg-amber-50 border-2 border-amber-200 shadow-xl">
                                        <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-4 border-white"><Info size={24} /></div>
                                        <p className="text-amber-900 font-bold text-xs whitespace-nowrap">找不到畫面？</p>
                                      </div>
                                      <div className="absolute right-full mr-12 top-1/2 -translate-y-1/2 w-[700px] opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-300 z-[100]">
                                        <div className="bg-white rounded-[2.5rem] shadow-2xl border-8 border-amber-500 overflow-hidden">
                                          {c.helpMedia.endsWith('.mp4') ? <video src={c.helpMedia} autoPlay loop muted playsInline className="w-full h-auto block" /> : <img src={c.helpMedia} alt="" className="w-full h-auto block" />}
                                        </div>
                                        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 rotate-45 rounded-md shadow-lg" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {(c.qa || (step.qa && idx === step.content.length - 1)) && (
                                <div className="mt-8 flex flex-row flex-wrap gap-4 items-center justify-center w-full">
                                  {(c.qa || step.qa || []).map((item, qIdx) => (
                                    <div key={qIdx} className="relative group/qa">
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 opacity-0 group-hover/qa:opacity-100 pointer-events-none transition-all duration-300 z-[100]">
                                        <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-2xl text-sm leading-relaxed relative border border-emerald-400/30">
                                          <div className="font-bold mb-1 text-emerald-100 flex items-center gap-2"><HelpCircle size={14} />說明</div>
                                          {item.answer}<div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-emerald-600" />
                                        </div>
                                      </div>
                                      <button className="flex items-center gap-3 px-6 py-4 bg-emerald-50/40 hover:bg-emerald-100 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold shadow-sm transition-all active:scale-[0.98]">
                                        <HelpCircle size={18} className="text-emerald-500 shrink-0" />
                                        <span>{item.question}</span>
                                        <ChevronRight size={16} className="ml-auto text-emerald-300" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {step.completionTip && (
                      <div className="bg-emerald-50/70 p-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20 border-t border-emerald-100/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
                            <CheckCircle2 size={24} />
                          </div>
                          <span className="text-emerald-900 font-black text-2xl tracking-tight whitespace-nowrap text-center">下一步：{step.completionTip}</span>
                        </div>

                        {step.id === 1 && (
                          <div className="relative group/logout w-full md:w-auto">
                            <a href="https://ecm.cpc.com.tw/omotest/userauth/logout" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] relative overflow-hidden group">
                              <span className="relative z-10 text-xl">立即登出</span>
                              <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            </a>

                            {/* Animated Mouse for Logout - Outside A tag */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-[75%] pointer-events-none">
                              <motion.div
                                animate={{
                                  scale: [1, 0.9, 1],
                                  opacity: [0, 1, 0]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-slate-500/40"
                              >
                                <MousePointer2 size={32} />
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}

              </div>
            </div >
          </div >
        </section >
      </main >

      <footer className="bg-slate-900 text-slate-400 py-16 px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-12 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3"><div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Layout size={24} /></div><span className="text-white font-black text-xl tracking-tight">多角化室</span></div>
            <p className="text-sm opacity-60">多角化經營發展室 敬上</p>
          </div>
        </div>
      </footer>
      {isEditMode && (
        <div className="fixed top-24 right-10 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-[1000] p-6 text-white flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Settings className="text-emerald-400 rotate-90" />
            <span className="font-black text-xl tracking-tight uppercase">Editor Mode</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {!selectedTarget ? (
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center">
                <MousePointer2 className="mx-auto mb-3 text-slate-500" />
                <p className="text-slate-400 text-sm">請在左側點擊亮點<br />或圖片位置開始編輯</p>
              </div>
            ) : (
              <>
                <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
                  <p className="text-xs text-emerald-400 font-bold mb-1">SELECTED TARGET</p>
                  <p className="text-sm font-bold truncate">
                    {stepsData.find(s => s.id === selectedTarget.stepId)?.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 opacity-70">
                    S{selectedTarget.stepId} / C{selectedTarget.contentIndex} / H{selectedTarget.highlightIndex}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-500 mb-1">TOP</p>
                    <p className="font-mono text-sm">{stepsData.find(s => s.id === selectedTarget.stepId)?.content[selectedTarget.contentIndex].highlights[selectedTarget.highlightIndex].top}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-500 mb-1">LEFT</p>
                    <p className="font-mono text-sm">{stepsData.find(s => s.id === selectedTarget.stepId)?.content[selectedTarget.contentIndex].highlights[selectedTarget.highlightIndex].left}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-500 mb-1">WIDTH</p>
                    <p className="font-mono text-sm">{stepsData.find(s => s.id === selectedTarget.stepId)?.content[selectedTarget.contentIndex].highlights[selectedTarget.highlightIndex].width}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-500 mb-1">HEIGHT</p>
                    <p className="font-mono text-sm">{stepsData.find(s => s.id === selectedTarget.stepId)?.content[selectedTarget.contentIndex].highlights[selectedTarget.highlightIndex].height}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                  <p className="text-[10px] text-slate-500">Shortcut Keys</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Move</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded font-mono">ARROWS</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Scale</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded font-mono">ALT + ARROWS</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Fast</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded font-mono">SHIFT</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (confirm('確定要捨棄所有編輯，重設為程式碼預設值嗎？')) {
                window.localStorage.removeItem(HIGHLIGHT_STORAGE_KEY);
                window.location.reload();
              }
            }}
            className="w-full py-3 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl font-bold text-sm border border-white/10 mb-2"
          >
            重設為代碼預設值
          </button>

          <button
            onClick={() => {
              const summary = buildHighlightChangeSummary(stepsData);
              console.log('--- HIGHLIGHTS CHANGE SUMMARY ---\n' + summary);
              alert('座標變更新已匯出至 Console (偵課視窗)');
            }}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-2xl font-black shadow-lg shadow-emerald-900/40 mb-4"
          >
            匯出座標摘要
          </button>
        </div>
      )}
    </div>
  );
}
