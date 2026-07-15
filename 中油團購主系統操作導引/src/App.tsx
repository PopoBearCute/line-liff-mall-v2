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
  HelpCircle,
  XCircle,
  ClipboardCopy,
  Eye,
  Truck,
  X
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
  customHeader?: boolean;
}

interface StepContent {
  image?: string;
  subtitle?: string;
  description?: string;
  highlights: Highlight[];
  helpMedia?: string;
  link?: { label: string; url: string };
  linkFirst?: boolean;
  midQa?: QA[];
  qa?: QA[];
  customComponent?: 'AccumulationFlow' | 'ClosingFlow' | 'PostClosingFlow' | 'ReceivingFlow' | 'PickupFlow' | 'RuleExplanationFlow' | 'SalesNotice' | 'SalesAccountRequest' | 'SalesOrderBridge';
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
const getImageWidth = (image?: string, stepId?: number): string => {
  if (!image) return "100%";
  if (image === "./rule_example.png") return "400px";
  const isPng = image.toLowerCase().endsWith('.png');
  const factor = isPng ? (2 / 3) : 1;

  // Specific widths requested by the user
  const fixedWidths: Record<string, string> = {
    "./step1_login.png": "420px",
    "./step1_create.png": "420px",
    "./step1_final.png": "420px",
    "./step1_edit.png": "420px",
    "./step1_edit_expanded.png": "420px",
    "./結單作業.png": "750px",
    "./QrCode.jpg": "170px",
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
  if (originalLabel.includes("結單")) return "前往【團購訂單管理作業】進行結單";
  if (originalLabel.includes("待收貨")) return "前往【團購待收貨】進行收貨";
  if (originalLabel.includes("待取貨")) return "前往【團購待取貨】進行取貨";
  return originalLabel;
};

const HIGHLIGHT_STORAGE_KEY = 'cpc-guide-highlight-editor-v4';

const cloneSteps = (steps: Step[]): Step[] => JSON.parse(JSON.stringify(steps)) as Step[];

const loadStoredSteps = (sourceSteps: Step[], storageKey: string): Step[] => {
  const codeSteps = cloneSteps(sourceSteps);
  if (typeof window === 'undefined') return codeSteps;
  try {
    const raw = window.localStorage.getItem(storageKey);
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
        image: "./step1_login.png",
        highlights: [
          { top: "59.3%", left: "16.4%", width: "63%", height: "7.5%", label: "帳號：輸入您的「站代號」" },
          { top: "68.4%", left: "15.3%", width: "63%", height: "7.5%", label: "密碼：預設為「站代號」" }
        ]
      },
      {
        subtitle: "2. 填寫帳號基本資訊",
        image: "./step1_create.png",
        helpMedia: "./manual_nav.gif",
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
        image: "./step1_final.png",
        helpMedia: "./step1_final.gif",
        highlights: [
          { top: "90%", left: "13%", width: "70%", height: "10%", label: "找到剛剛建立的帳號 (如 DXXXX-123456) 並點擊「編輯」" }
        ]
      },
      {
        subtitle: "4. 開啟團購主開關",
        image: "./step1_edit.png",
        highlights: [
          { top: "75.4%", left: "57.9%", width: "10%", height: "3.5%", label: "開啟「是否為團購主」開關" }
        ]
      },
      {
        subtitle: "5. 填寫資訊並儲存",
        image: "./step1_edit_expanded.png",
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
        image: "./step1_login.png",
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
        image: "./step3_selection.gif",
        highlights: [
          { top: "47.5%", left: "-30%", width: "30%", height: "8%", label: "選擇要推薦的商品" },
          { top: "68.7%", left: "-24.5%", width: "15%", height: "6%", label: "點擊「推薦作業」按鈕" },
          { top: "97.6%", left: "-27%", width: "20%", height: "8%", label: "頁面底部「我要推薦」" }
        ]
      },
      {
        customComponent: 'AccumulationFlow' as const,
        highlights: []
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
      },
      {
        question: "開團條件優化建議",
        answer: "如果您對目前商品的價格、出貨數量或其他合作條件有更具競爭力的反饋，歡迎隨時向多角化室同仁反應。我們會彙整您的專業見解，作為未來與廠商議價、挑選品項的重要參考，讓團購更貼切前線需求。"
      }
    ]
  },
  {
    id: 4,
    title: "出貨門檻與規則",
    content: [
      {
        customComponent: 'RuleExplanationFlow' as const,
        highlights: []
      }
    ]
  },
  {
    id: 5,
    title: "結單、收貨與取貨",
    description: "",
    content: [
      {
        customComponent: 'ClosingFlow' as const,
        highlights: []
      },
      {
        subtitle: "1. 滿足門檻後，進行「結單作業」",
        image: "./結單作業.png",
        link: { label: "團購訂單管理 (結單)", url: "https://ecm.cpc.com.tw/omotest/groupbuyselection/settlementlist" },
        highlights: [
          { top: "20%", left: "-27%", width: "40%", height: "8%", label: "1. 選擇結單商品" },
          { top: "35%", left: "-27%", width: "40%", height: "8%", label: "2. 勾選欲結訂單" },
          { top: "48%", left: "-27%", width: "40%", height: "8%", label: "點擊【結單作業】" },
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
        subtitle: "2. 物流送貨到站，簽收並取得「到站取貨單」",
        image: "./到站取貨單.gif",
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
        subtitle: "3. 清點貨品數量，進行「收貨作業」",
        image: "./收貨作業.gif",
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
        subtitle: "4. 消費者到站，進行「取貨作業」",
        image: "./取貨作業.gif",
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
    id: 6,
    title: "官方社群",
    description: "加入官方社群，掌握商品動態與問題反映窗口。",
    content: [
      {
        subtitle: "",
        description: "",
        image: "./QrCode.jpg",
        highlights: [
          { top: "50.0%", left: "-90.7%", width: "20%", height: "20%", label: "手機掃碼加入官方社群" }
        ],
        qa: [
          {
            question: "為什麼要加入社群？",
            answer: "官方社群將定期提供最新商品資訊與問題反映窗口，協助您掌握團購作業相關通知。"
          }
        ]
      }
    ],
    qa: []
  }
];

type GuideMode = 'station' | 'sales';

const EMAIL_TEMPLATE = `主旨：申請建立秋節禮盒銷售達人團購主帳號

您好，
我想申請建立「中油 PAY 行動商城」團購主帳號，申請資料如下，請協助建帳，謝謝。

【申請人資料】
姓名：
工號：
服務單位／所屬營業處：
聯絡電話：
電子信箱：

【帳號資料】
欲設定帳號：
初始密碼需求：請管理師協助設定，首次登入後我會自行修改。

【團購主資料】
團主名稱：
暱稱：
卡號：
縣市：
鄉鎮市區：
指定地址：

【備註】
若資料不足或格式需調整，再請告知我補充。`;

const buildGuideSteps = (mode: GuideMode): Step[] => {
  if (mode === 'station') return cloneSteps(STEPS);

  const reusableSteps = cloneSteps(STEPS)
    .filter((step) => step.id !== 1 && step.id !== 3)
    .map((step, index) => {
      const next: Step = { ...step, id: index + 4 };
      if (next.title === "登入團購主帳號") {
        next.description = "使用管理師協助建立的「團購主帳號」登入。";
        next.content = next.content.map((content) => ({
          ...content,
          highlights: content.highlights.map((highlight, highlightIndex) => ({
            ...highlight,
            label: highlightIndex === 0 ? "帳號：管理師提供的帳號" : "密碼：管理師提供的密碼",
          })),
        }));
      }
      if (next.title === "出貨門檻與規則") {
        next.title = "出貨條件";
        next.description = "不同禮盒商品會有不同的出貨條件，達到條件後才可以結單並讓供應商出貨。";
      }
      if (next.title === "結單、收貨與取貨") {
        const mappedContent = next.content.map((content) => {
          if (content.subtitle === "1. 滿足門檻後，進行「結單作業」") {
            return {
              ...content,
              subtitle: "",
              qa: [
                {
                  question: "什麼是結單?",
                  answer: "結單就是將訂單狀態轉為已結單，廠商就會開始出貨。",
                },
                {
                  question: "什麼時候要結單?",
                  answer: "訂單數量符合商品出貨條件後，即可進行結單。請先確認商品詳情中的「最小團購量」與「是否成箱出貨」。",
                },
                {
                  question: "同一個商品可以分批結單嗎?",
                  answer: "可以。同一個商品只要購買件數總量已符合出貨條件，就可以進行結單。您可以依實際需求選擇一次結單出貨，或分批結單讓供應商分批出貨。每次結單後，該批訂單會進入後續出貨流程；尚未結單的訂單則會繼續累積。",
                },
                {
                  question: "沒有結單會怎樣?",
                  answer: "沒有結單就不會通知供應商出貨，訂單會持續累積。若至 9/15 檔期結束仍未符合出貨條件，或已符合出貨條件但未完成結單，系統將於 9/19 00:00 啟動退款作業，將訂單款項退還至消費者帳戶。",
                },
                {
                  question: "無法達成出貨條件會怎樣?",
                  answer: "未符合出貨條件將無法結單。本檔期預計於 9/19 00:00 啟動退款作業，系統會將訂單款項退還至消費者帳戶。",
                },
              ],
            };
          }
          if (content.subtitle === "3. 清點貨品數量，進行「收貨作業」") {
            return {
              ...content,
              qa: content.qa?.map((item) => item.question === "什麼是收貨作業?"
                ? {
                    ...item,
                    answer: "收貨作業是指當供應商將商品送達您設定的指定地址時，您在系統中確認商品已到貨的流程，這會將訂單狀態更新為「待取貨」。",
                  }
                : item),
            };
          }
          if (content.subtitle === "2. 物流送貨到站，簽收並取得「到站取貨單」") {
            return {
              ...content,
              subtitle: "2. 商品送達指定地址，簽收並取得「到站取貨單」",
            };
          }
          if (content.subtitle === "4. 消費者到站，進行「取貨作業」") {
            return {
              ...content,
              subtitle: "4. 消費者取貨，進行「取貨作業」",
            };
          }
          return content;
        });
        next.content = mappedContent.flatMap((content) => (
          content.image === "./結單作業.png"
            ? [content, { customComponent: 'PostClosingFlow' as const, highlights: [] }]
          : content.subtitle === "3. 清點貨品數量，進行「收貨作業」"
            ? [{ customComponent: 'ReceivingFlow' as const, highlights: [] }, content]
            : content.subtitle === "4. 消費者取貨，進行「取貨作業」"
              ? [{ customComponent: 'PickupFlow' as const, highlights: [] }, content]
            : [content]
        ));
      }
      return next;
    });

  const salesOrderBridgeStep: Step = {
    id: 3,
    title: "禮盒銷售與訂單累積",
    description: "秋節禮盒預計於 7/29-9/15 在中油PAY APP 曝光。\n活動期間消費者可選擇您下單，訂單達出貨條件後，再由您進行結單讓供應商出貨。",
    content: [
      { customComponent: 'SalesOrderBridge', highlights: [] }
    ]
  };

  return [
    {
      id: 1,
      title: "成為團購主前，請先了解",
      description: "請先確認角色責任，再進行帳號申請與後續操作。",
      customHeader: false,
      content: [
        { customComponent: 'SalesNotice', highlights: [] }
      ]
    },
    {
      id: 2,
      title: "帳號取得說明",
      description: "銷售達人帳號需由所屬營業處零售中心多角化管理師協助建立。",
      content: [
        { customComponent: 'SalesAccountRequest', highlights: [] }
      ]
    },
    salesOrderBridgeStep,
    ...reusableSteps
  ];
};

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

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

const SALES_EMAIL_TEMPLATE = `主旨：申請建立團購主帳號

您好：

我想申請【銷售達人專用】行動商城團購主帳號，基本資料如下：

工號：
所屬營業處：
所屬零售中心：
姓名：
暱稱（APP 中揭露給消費者看的名稱）：
中油 PAY 16 碼卡號：
聯絡電話：
電子信箱：
商品送貨指定地址（縣市）：
商品送貨指定地址（鄉鎮市區）：
商品送貨指定地址（門牌）：

謝謝。`;

interface ManagerContact {
  employeeId: string;
  name: string;
  office: string;
  center: string;
}

const MANAGER_CONTACTS: ManagerContact[] = [
  { employeeId: "500577", name: "李政倫", office: "基隆營業處", center: "基隆零售服務中心" },
  { employeeId: "104205", name: "吳潔鴻", office: "台北營業處", center: "台北南區零售服務中心" },
  { employeeId: "103497", name: "李承陽", office: "桃園營業處", center: "桃園零售服務中心" },
  { employeeId: "543446", name: "邱仕強", office: "竹苗營業處", center: "新竹零售服務中心" },
  { employeeId: "545392", name: "范晨佑", office: "竹苗營業處", center: "苗栗零售服務中心" },
  { employeeId: "545422", name: "鍾名哲", office: "台中營業處", center: "台中零售服務中心" },
  { employeeId: "104221", name: "吳佾儒", office: "嘉義營業處", center: "嘉義零售服務中心" },
  { employeeId: "107981", name: "楊嘉宜", office: "嘉義營業處", center: "雲林零售服務中心" },
  { employeeId: "107026", name: "陳振隆", office: "澎湖營業處", center: "馬公直銷服務中心" },
  { employeeId: "100421", name: "李承翰", office: "台南營業處", center: "台南南區零售服務中心" },
  { employeeId: "103438", name: "歐陽嘉謙", office: "高雄營業處", center: "高雄零售服務中心" },
  { employeeId: "103519", name: "王韻茹", office: "高雄營業處", center: "屏東零售服務中心" },
  { employeeId: "107743", name: "陳柏霖", office: "高雄營業處", center: "岡山零售服務中心" },
  { employeeId: "104108", name: "柯心卉", office: "東區營業處", center: "宜蘭零售服務中心" },
  { employeeId: "107948", name: "蕭文郡", office: "東區營業處", center: "台東零售服務中心" },
  { employeeId: "107361", name: "江哲一", office: "東區營業處", center: "花蓮零售服務中心" },
];

const getManagerEmail = (employeeId: string): string => `${employeeId}@cpc.com.tw`;

const SalesNotice = () => (
  <div className="w-full max-w-6xl mx-auto">
    <img
      src="./sales-notice.png"
      alt="成為團購主前，請先了解：團購主是消費者的商品交付窗口，需完成結單、收貨、分貨、商品交付及退貨工作。"
      className="block w-full h-auto rounded-[2rem] border border-slate-100 shadow-xl"
    />
  </div>
);

const SalesAccountRequest = () => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    setCopyFailed(false);
    const ok = await copyTextToClipboard(EMAIL_TEMPLATE);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      setCopyFailed(true);
      setOpen(true);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-[2rem] border-2 border-sky-100 bg-sky-50/70 p-8 text-left">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h5 className="text-2xl font-black text-slate-900 tracking-tight">由管理師協助建帳</h5>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            銷售達人帳號需由所屬營業處零售中心多角化管理師協助建立。請複製 Email 範本，補上資料後寄給管理師。
          </p>
          <p className="mt-4 text-base leading-7 text-slate-500">
            目前為草稿，正式窗口與申請細節待確認後再定稿。
          </p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white p-6 shadow-sm">
          <h5 className="text-xl font-black text-slate-900">Email 範本工具</h5>
          <p className="mt-3 text-base leading-7 text-slate-600">
            可直接複製到剪貼簿，也可以先用小彈窗預覽內容。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-800"
            >
              {copied ? <CheckCircle2 size={20} /> : <ClipboardCopy size={20} />}
              {copied ? "已複製" : "複製 Email 範本"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-base font-black text-slate-700 transition hover:bg-slate-50"
            >
              <Eye size={20} />
              預覽範本
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            複製後請貼到 Email，補上個人資料再寄出。
          </p>
          {copyFailed && (
            <p className="mt-3 text-sm font-bold text-rose-600">
              瀏覽器未允許自動複製，請在彈窗中手動複製範本。
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h5 className="text-xl font-black text-slate-900">Email 範本預覽</h5>
                <p className="mt-1 text-sm text-slate-500">可直接複製後貼到信件內。</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="關閉"
              >
                <X size={22} />
              </button>
            </div>
            <pre className="max-h-[58vh] overflow-auto whitespace-pre-wrap px-6 py-5 text-base leading-8 text-slate-800">
              {EMAIL_TEMPLATE}
            </pre>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                <ClipboardCopy size={18} />
                複製範本
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesAccountRequestV2 = () => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState("");

  const normalizedQuery = contactQuery.trim().toLowerCase();
  const filteredContacts = MANAGER_CONTACTS.filter((contact) => {
    if (!normalizedQuery) return true;
    return [
      contact.employeeId,
      contact.name,
      contact.office,
      contact.center,
      getManagerEmail(contact.employeeId),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  const handleCopy = async () => {
    setCopyFailed(false);
    const ok = await copyTextToClipboard(SALES_EMAIL_TEMPLATE);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      setCopyFailed(true);
      setPreviewOpen(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-8 text-left shadow-sm">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex min-h-[250px] flex-col rounded-2xl border border-white bg-white/85 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">
              1
            </div>
            <div>
              <h5 className="text-xl font-black text-slate-900">複製 Email 範本</h5>
              <p className="mt-2 text-base leading-7 text-slate-600">
                請使用 Email 範本，將基本資料寄給管理師。
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                {copied ? <CheckCircle2 size={20} /> : <ClipboardCopy size={20} />}
                {copied ? "已複製" : "複製 Email 範本"}
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-base font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Eye size={20} />
                預覽範本
              </button>
            </div>
            {copyFailed && (
              <p className="mt-3 text-sm font-bold text-rose-600">
                無法自動複製，請使用預覽範本手動複製內容。
              </p>
            )}
          </div>
        </div>

        <div className="flex min-h-[250px] flex-col rounded-2xl border border-white bg-white/85 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-lg font-black text-white">
              2
            </div>
            <div>
              <h5 className="text-xl font-black text-slate-900">寄給所屬管理師</h5>
              <p className="mt-2 text-base leading-7 text-slate-600">
                銷售達人帳號需由所屬營業處零售中心多角化管理師協助建立。
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-5 text-base font-black text-sky-800 transition hover:bg-sky-100"
            >
              <Users size={20} />
              管理師聯繫方式
            </button>
          </div>
        </div>

        <div className="flex min-h-[250px] flex-col rounded-2xl border border-white bg-white/85 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-lg font-black text-white">
              3
            </div>
            <div>
              <h5 className="text-xl font-black text-slate-900">等待帳號通知</h5>
              <p className="mt-2 text-base leading-7 text-slate-600">
                帳號建立完成後，管理師會通知您帳號與初始密碼。
              </p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
              <ShieldCheck size={17} />
              完成後再登入系統
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h5 className="text-xl font-black text-slate-900">Email 範本預覽</h5>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="關閉"
              >
                <X size={22} />
              </button>
            </div>
            <pre className="max-h-[58vh] overflow-auto whitespace-pre-wrap px-6 py-5 text-base leading-8 text-slate-800">
              {SALES_EMAIL_TEMPLATE}
            </pre>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                關閉
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                <ClipboardCopy size={18} />
                複製範本
              </button>
            </div>
          </div>
        </div>
      )}

      {contactsOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h5 className="text-xl font-black text-slate-900">管理師聯繫方式</h5>
                <p className="mt-1 text-sm text-slate-500">請依所屬營業處或零售中心查找管理師信箱。</p>
              </div>
              <button
                type="button"
                onClick={() => setContactsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="關閉"
              >
                <X size={22} />
              </button>
            </div>
            <div className="px-6 py-5">
              <input
                type="search"
                value={contactQuery}
                onChange={(event) => setContactQuery(event.target.value)}
                placeholder="搜尋營業處、零售中心或姓名"
                className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
              <div className="mt-5 max-h-[52vh] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-3 font-black">姓名</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-black">信箱</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-black">營業處</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-black">零售中心</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredContacts.map((contact) => (
                      <tr key={`${contact.employeeId}-${contact.center}`} className="hover:bg-sky-50/60">
                        <td className="px-4 py-3 font-bold">{contact.name}</td>
                        <td className="px-4 py-3 font-mono text-sky-800">{getManagerEmail(contact.employeeId)}</td>
                        <td className="px-4 py-3">{contact.office}</td>
                        <td className="px-4 py-3">{contact.center}</td>
                      </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                          找不到符合的管理師資料
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setContactsOpen(false)}
                className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SalesOrderBridge = () => (
  <div className="w-full max-w-5xl mx-auto rounded-[2rem] border-2 border-emerald-100 bg-emerald-50/60 p-8 text-left">
    <div className="grid gap-5 md:grid-cols-3">
      <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">1</div>
        <h5 className="mt-4 text-xl font-black text-slate-900">商品開賣</h5>
        <p className="mt-3 text-base leading-7 text-slate-600">
          秋節禮盒會在中油 PAY 行動商城曝光，消費者可於活動期間瀏覽商品並進入下單流程。
        </p>
      </div>
      <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">2</div>
        <h5 className="mt-4 text-xl font-black text-slate-900">消費者選擇您下單</h5>
        <p className="mt-3 text-base leading-7 text-slate-600">
          消費者下單時會選擇您的暱稱與指定地點，訂單會累積在您的團購主帳號底下。
        </p>
      </div>
      <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white">3</div>
        <h5 className="mt-4 text-xl font-black text-slate-900">達條件後結單出貨</h5>
        <p className="mt-3 text-base leading-7 text-slate-600">
          當訂單數量滿足商品出貨條件後，您就可以透過結單作業，讓供應商安排出貨。
        </p>
      </div>
    </div>
  </div>
);

const AccumulationFlow = () => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 my-8 relative max-w-4xl mx-auto px-6 py-12 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
      {/* Background connector line */}
      <div className="hidden md:block absolute top-[5.2rem] left-[15%] right-[15%] h-1.5 bg-slate-200 -z-0 rounded-full" />

      {/* Node 1: Recommended */}
      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm">1. 點擊推薦</p>
          <p className="text-xs text-slate-500 mt-1">您完成推薦動作</p>
        </div>
      </div>

      {/* Node 2: Live */}
      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <Layout className="text-white w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm">2. 站點上架</p>
          <p className="text-xs text-slate-500 mt-1">商品於 APP 曝光</p>
        </div>
      </div>

      {/* Node 3: Accumulating (PULSING YELLOW) */}
      <div className="flex flex-col items-center gap-3 w-48 relative z-10">
        <div className="w-20 h-20 rounded-full bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.45)] flex items-center justify-center border-4 border-white relative z-10">
          <div className="absolute inset-1 rounded-full border-[4px] border-amber-200/70 animate-pulse" />
          <Users className="text-white w-9 h-9 relative z-10" />
        </div>
        <div className="text-center relative z-20">
          <p className="font-black text-amber-700 text-sm whitespace-nowrap tracking-tight">3. 累積訂單中</p>
          <p className="text-xs text-amber-600 mt-1">等待消費者下單</p>
        </div>
      </div>

      {/* Node 4: Target Reached */}
      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-slate-200 shadow-inner flex items-center justify-center border-4 border-white transition-all hover:bg-slate-300">
          <CheckCircle2 className="text-slate-400 w-8 h-8" />
        </div>
        <div className="text-center text-slate-400">
          <p className="font-bold text-sm">4. 達最小訂購量</p>
          <p className="text-xs mt-1">此時方可結單出貨</p>
        </div>
      </div>
    </div>
  );
};

const ClosingFlow = () => {
  const isSalesMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'sales';

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 my-8 relative max-w-4xl mx-auto px-6 py-12 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
      {/* Background connector line */}
      <div className="hidden md:block absolute top-[5.2rem] left-[15%] right-[15%] h-1.5 bg-slate-200 -z-0 rounded-full" />

      {/* Node 1: Target Reached (COMPLETED GREEN) */}
      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm tracking-tight">{isSalesMode ? "1. 滿足出貨條件" : "1. 達最小訂購量"}</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">{isSalesMode ? "可結單 ✓" : "已達標 ✓"}</p>
        </div>
      </div>

      {/* Node 2: Closing (PULSING AMBER) */}
      <div className="flex flex-col items-center gap-3 w-48 relative z-10">
        <div className="w-20 h-20 rounded-full bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center border-4 border-white relative z-10">
          <div className="absolute inset-0 rounded-full border-[6px] border-amber-300 animate-ping opacity-75" />
          <MousePointer2 className="text-white w-9 h-9 relative z-10" />
        </div>
        <div className="text-center bg-amber-100 px-4 py-2.5 rounded-2xl border border-amber-200/50 shadow-sm relative z-20">
          <p className="font-black text-amber-700 text-sm whitespace-nowrap tracking-tight">{isSalesMode ? "2. 團購主進行結單" : "2. 結單作業中"}</p>
          <p className="text-xs text-amber-600/80 mt-1 italic">{isSalesMode ? "點擊【團購訂單管理作業】" : "進行結算與出單"}</p>
        </div>
      </div>

      {/* Node 3: Receiving (GRAY) */}
      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-slate-200 shadow-inner flex items-center justify-center border-4 border-white">
          <BookOpen className="text-slate-400 w-7 h-7" />
        </div>
        <div className="text-center text-slate-400">
          <p className="font-bold text-sm tracking-tight">3. 收貨與核對</p>
          <p className="text-xs mt-1">下一步：收貨</p>
        </div>
      </div>
    </div>
  );
};

const PostClosingFlow = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-8 rounded-[2.5rem] border-2 border-emerald-100 bg-emerald-50/50 px-6 py-10 shadow-sm">
      <p className="mb-8 text-center text-lg font-black text-slate-800">
        結單完成後，等待供應商配送至指定地址。
      </p>
      <div className="relative flex flex-col items-center justify-between gap-8 md:flex-row md:gap-0">
        <div className="hidden md:block absolute top-[2.2rem] left-[15%] right-[15%] h-1.5 rounded-full bg-emerald-100" />

        <div className="relative z-10 flex w-48 flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black tracking-tight text-slate-800">1. 滿足出貨條件</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">可結單 ✓</p>
          </div>
        </div>

        <div className="relative z-10 flex w-48 flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black tracking-tight text-slate-800">2. 結單完成</p>
            <p className="mt-1 text-xs font-bold text-emerald-600">供應商準備出貨</p>
          </div>
        </div>

        <div className="relative z-10 flex w-48 flex-col items-center gap-3">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]">
            <div className="absolute inset-0 rounded-full border-[6px] border-amber-300 opacity-75 animate-ping" />
            <Truck className="relative z-10 h-9 w-9 text-white" />
          </div>
          <div className="rounded-2xl border border-amber-200/50 bg-amber-100 px-4 py-2.5 text-center shadow-sm">
            <p className="text-sm font-black tracking-tight text-amber-700">3. 等待物流到貨</p>
            <p className="mt-1 text-xs italic text-amber-600/80">下一步：收貨</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceivingFlow = () => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 my-8 relative max-w-4xl mx-auto px-6 py-12 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
      <div className="hidden md:block absolute top-[5.2rem] left-[15%] right-[15%] h-1.5 bg-slate-200 -z-0 rounded-full" />

      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm tracking-tight">1. 滿足出貨條件</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">可結單 ✓</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm tracking-tight">2. 結單完成</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">供應商出貨</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-48 relative z-10">
        <div className="w-20 h-20 rounded-full bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center border-4 border-white relative z-10">
          <div className="absolute inset-0 rounded-full border-[6px] border-amber-300 animate-ping opacity-75" />
          <BookOpen className="text-white w-9 h-9 relative z-10" />
        </div>
        <div className="text-center bg-amber-100 px-4 py-2.5 rounded-2xl border border-amber-200/50 shadow-sm relative z-20">
          <p className="font-black text-amber-700 text-sm whitespace-nowrap tracking-tight">3. 收貨與核對</p>
          <p className="text-xs text-amber-600/80 mt-1 italic">確認商品到貨</p>
        </div>
      </div>
    </div>
  );
};

const PickupFlow = () => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 my-8 relative max-w-4xl mx-auto px-6 py-12 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
      <div className="hidden md:block absolute top-[5.2rem] left-[15%] right-[15%] h-1.5 bg-slate-200 -z-0 rounded-full" />

      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm tracking-tight">1. 滿足出貨條件</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">可結單 ✓</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-40 relative z-10">
        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center border-4 border-white">
          <CheckCircle2 className="text-white w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm tracking-tight">2. 收貨完成</p>
          <p className="text-xs text-emerald-600 font-bold mt-1">商品已到貨</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-48 relative z-10">
        <div className="w-20 h-20 rounded-full bg-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.6)] flex items-center justify-center border-4 border-white relative z-10">
          <div className="absolute inset-0 rounded-full border-[6px] border-amber-300 animate-ping opacity-75" />
          <Users className="text-white w-9 h-9 relative z-10" />
        </div>
        <div className="text-center bg-amber-100 px-4 py-2.5 rounded-2xl border border-amber-200/50 shadow-sm relative z-20">
          <p className="font-black text-amber-700 text-sm whitespace-nowrap tracking-tight">3. 消費者取貨</p>
          <p className="text-xs text-amber-600/80 mt-1 italic">交付商品並發貨</p>
        </div>
      </div>
    </div>
  );
};

const RuleExplanationFlow = () => {
  const [conditionGuideOpen, setConditionGuideOpen] = useState(false);
  const [conditionGuidePreview, setConditionGuidePreview] = useState(false);
  const [productListType, setProductListType] = useState<string | null>(null);
  const isSalesMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'sales';

  if (isSalesMode) {
    const productRules = [
      { name: "韓味海苔禮盒", type: "是", condition: "6 盒的倍數" },
      { name: "金牌ONE台灣啤酒巨大啤酒罐造型存錢筒蝦餅禮盒", type: "是", condition: "12 盒的倍數" },
      { name: "赫思康咖啡禮盒", type: "是", condition: "12 盒的倍數" },
      { name: "星球工坊x不二糕餅 蛋黃酥雙色爆米花3入組", type: "是", condition: "26 盒的倍數" },
      { name: "愛之味健康油切分解茶", type: "否", condition: "6 盒以上" },
      { name: "希望綠豆湯 雪藏綠豆糕", type: "否", condition: "20 盒以上" },
      { name: "台中老太陽堂 太陽餅", type: "否", condition: "20 盒以上" },
      { name: "台中老太陽堂 檸檬蛋糕", type: "否", condition: "10 盒以上" },
      { name: "中秋烤肉組｜海陸小資超值10件組", type: "否", condition: "2 組以上" },
      { name: "中秋烤肉組｜海陸超級澎湃15件組", type: "否", condition: "2 組以上" },
      { name: "台糖酒韻豚香禮盒(冷凍)", type: "否", condition: "3 盒以上" },
      { name: "中秋節限定-MELISSA蜂蜜氣泡飲6入禮盒", type: "否", condition: "4 盒以上" },
      { name: "奧利塔雙入禮盒", type: "否", condition: "6 盒以上" },
      { name: "屏大薄鹽醬油雙入禮盒", type: "否", condition: "6 盒以上" },
      { name: "台酒清酒粕玄米菓(辣味)禮盒", type: "否", condition: "6 盒以上" },
      { name: "台酒紅麴海苔米香禮盒(全素)", type: "否", condition: "6 盒以上" },
      { name: "頂級乾燥 花好月圓禮盒(3入)", type: "否", condition: "12 盒以上" },
      { name: "嚴選甘栗禮盒", type: "否", condition: "6 盒以上" },
    ];

    const productGroups = {
      "是": productRules.filter((product) => product.type === "是"),
      "否": productRules.filter((product) => product.type === "否"),
    } as const;

    const ProductListPreview = ({ type }: { type: keyof typeof productGroups }) => (
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="text-sm font-black text-slate-900">是否成箱出貨：{type}</div>
        <div className="mt-3 space-y-2">
          {productGroups[type].slice(0, 4).map((product) => (
            <div key={product.name} className="rounded-xl bg-slate-50 px-3 py-2">
              <div className="text-xs font-bold leading-5 text-slate-700">{product.name}</div>
              <div className="mt-1 text-xs font-black text-slate-500">{product.condition}</div>
            </div>
          ))}
        </div>
        {productGroups[type].length > 4 && (
          <div className="mt-3 text-xs font-bold text-slate-400">另有 {productGroups[type].length - 4} 項，點擊查看全部。</div>
        )}
      </div>
    );

    const ProductListButton = ({ type }: { type: keyof typeof productGroups }) => (
      <div className="relative mt-4 inline-block group/product-list">
        <button
          type="button"
          onClick={() => setProductListType(type)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <HelpCircle size={16} />
          哪些商品？
        </button>
        <div className="pointer-events-none absolute bottom-full left-0 z-[200] mb-3 hidden group-hover/product-list:block">
          <ProductListPreview type={type} />
        </div>
      </div>
    );

    const ConditionFieldGuide = ({ compact = false }: { compact?: boolean }) => (
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-xl ${compact ? "w-full p-4" : "w-full p-6"}`}>
        <div className="mx-auto max-w-[720px]">
          <div className={`mb-4 rounded-xl bg-sky-50 px-4 py-3 font-bold leading-6 text-sky-900 ${compact ? "text-xs" : "text-sm"}`}>
            位置：進入「團購訂單管理作業」，點開商品訂單後查看詳情。
          </div>
          <div className="mx-auto flex flex-col items-center">
            <div className={`shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${compact ? "h-52 w-52" : "h-72 w-72"}`}>
              <img
                src="./seaweed-gift-box.png"
                alt="韓味海苔禮盒"
                className="block h-full w-full object-contain"
              />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-12 w-12 overflow-hidden rounded border border-slate-200 bg-slate-50">
                  <img src="./seaweed-gift-box.png" alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className={`mt-5 grid w-full gap-2 ${compact ? "max-w-[440px] text-xs" : "max-w-[560px] text-sm"}`}>
              {[
                ["狀態", "募集成功", false],
                ["供應商", "秋節禮盒供應商", false],
                ["商品編號", "0058151", false],
                ["商品名稱", "韓味海苔禮盒", false],
                ["配送方式", "團購主指定地點", false],
                ["最小團購量", "6", true],
                ["是否成箱出貨", "是", true],
                ["活動期間", "2026/07/29 - 2026/09/15", false],
              ].map(([label, value, highlighted]) => (
                <div
                  key={label as string}
                  className={`grid ${compact ? "grid-cols-[5.7rem_1fr]" : "grid-cols-[7.5rem_1fr]"} items-center rounded-lg px-3 py-2 ${
                    highlighted ? "border-2 border-amber-400 bg-amber-50 shadow-sm" : "border border-transparent bg-white"
                  }`}
                >
                  <span className="font-black text-slate-900">{label}</span>
                  <span className="font-bold text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-4 grid gap-3 ${compact ? "text-xs" : "grid-cols-2 text-sm"}`}>
            <div className="rounded-xl bg-amber-50 px-4 py-3 font-bold leading-6 text-amber-900">
              最小團購量：最低累積到幾盒/組才可結單。
            </div>
            <div className="rounded-xl bg-sky-50 px-4 py-3 font-bold leading-6 text-sky-900">
              是否成箱出貨：判斷是否需要整箱倍數。
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="w-full max-w-6xl mx-auto px-4 my-8 text-left space-y-6">
        <div className="rounded-[2rem] border-2 border-sky-100 bg-sky-50/70 p-7 shadow-sm" onMouseLeave={() => setConditionGuidePreview(false)}>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-2xl font-black text-slate-900">先看商品頁上的兩個欄位</h4>
            <div>
              <button
                type="button"
                onMouseEnter={() => setConditionGuidePreview(true)}
                onFocus={() => setConditionGuidePreview(true)}
                onClick={() => setConditionGuideOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-sky-200 bg-white px-4 text-sm font-black text-sky-800 shadow-sm transition hover:bg-sky-50"
              >
                <HelpCircle size={17} />
                在哪裡看？
              </button>
            </div>
          </div>
          <p className="mt-3 text-base leading-7 text-slate-600">
            請到「
            <a
              href="https://ecm.cpc.com.tw/omotest/groupbuyselection/settlementlist"
              target="_blank"
              rel="noopener noreferrer"
              className="font-black text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900 hover:decoration-sky-600"
            >
              團購訂單管理作業
            </a>
            」點開商品訂單詳情，確認「最小團購量」與「是否成箱出貨」。訂單累積到商品指定條件後，才能由您進行結單並讓供應商出貨。
          </p>
          {conditionGuidePreview && (
            <div className="mt-5 max-w-3xl">
              <ConditionFieldGuide compact />
            </div>
          )}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-indigo-50 px-5 py-4 text-2xl font-black text-slate-900">
                <span>是否成箱出貨</span>
                <span className="rounded-xl bg-indigo-600 px-5 py-2 text-3xl text-white shadow-sm">是</span>
              </div>
              <p className="mt-4 text-base font-black leading-7 text-slate-800">必須符合最小團購量的倍數。</p>
              <p className="mt-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold leading-6 text-indigo-900">
                最小團購量 6 時，6、12、18 盒可以結單；7 盒不行。
              </p>
              <ProductListButton type="是" />
            </div>
            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-2xl font-black text-slate-900">
                <span>是否成箱出貨</span>
                <span className="rounded-xl bg-emerald-600 px-5 py-2 text-3xl text-white shadow-sm">否</span>
              </div>
              <p className="mt-4 text-base font-black leading-7 text-slate-800">只要達到最小團購量即可。</p>
              <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
                最小團購量 6 時，6、7、8 盒都可以結單。
              </p>
              <ProductListButton type="否" />
            </div>
          </div>
        </div>

        {conditionGuideOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-6" role="dialog" aria-modal="true">
            <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h5 className="text-xl font-black text-slate-900">商品頁欄位位置</h5>
                  <p className="mt-1 text-sm text-slate-500">位置：團購訂單管理作業，點開商品訂單後查看詳情。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConditionGuideOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="關閉"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="p-6">
                <ConditionFieldGuide />
              </div>
              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setConditionGuideOpen(false)}
                  className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}
        {productListType && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 px-6" role="dialog" aria-modal="true">
            <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h5 className="text-xl font-black text-slate-900">是否成箱出貨：{productListType}</h5>
                  <p className="mt-1 text-sm text-slate-500">依商品出貨條件分類，請以商品詳情頁實際欄位為準。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProductListType(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label="關閉"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="grid gap-3 p-6">
                {productGroups[productListType as keyof typeof productGroups].map((product) => (
                  <div key={product.name} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="font-bold leading-6 text-slate-800">{product.name}</div>
                    <div className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 shadow-sm">{product.condition}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setProductListType(null)}
                  className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const Node = ({ value, isOk }: { value: number | string, isOk: boolean }) => (
    <div className="flex flex-col items-center gap-4 w-32 relative group">
      <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-md relative transition-all group-hover:scale-110 group-hover:-translate-y-1 ${isOk ? 'bg-indigo-50 border-4 border-indigo-200' : 'bg-white border-2 border-slate-100'}`}>
        <span className={`font-black text-3xl ${isOk ? 'text-indigo-600' : 'text-slate-400'}`}>
          {value}<span className="text-base font-bold ml-0.5">包</span>
        </span>
        {isOk ? (
          <CheckCircle2 className="absolute -bottom-2 -right-2 text-emerald-500 w-8 h-8 bg-white rounded-full border-2 border-white shadow-sm" />
        ) : (
          <XCircle className="absolute -bottom-2 -right-2 text-rose-500 w-8 h-8 bg-white rounded-full border-2 border-white shadow-sm" />
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-10 my-8 max-w-5xl mx-auto px-4">

      {/* Case A: Coffee (Any quantity OK) */}
      <div className="bg-[#f8fafc] rounded-[2.5rem] border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl font-black shrink-0">A</div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black text-slate-800">是否成箱出貨：否</h4>
            <p className="text-slate-500 text-sm mt-1">訂單共幾包都可以結單，系統會全部出貨。以下以最小團購量 10 舉例</p>
          </div>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 px-4">
          <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-1 bg-slate-200 -z-0" />
          <Node value={9} isOk={false} />
          <Node value={10} isOk={true} />
          <Node value={11} isOk={true} />
          <Node value={12} isOk={true} />
        </div>
      </div>

      {/* Case B: Congyoubing (Multiples of box size) */}
      <div className="bg-[#f8fafc] rounded-[2.5rem] border-2 border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-black shrink-0">B</div>
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black text-slate-800">是否成箱出貨：是</h4>
            <p className="text-slate-500 text-sm mt-1">訂單數量需為最小訂購量的倍數，才可結單出貨。以下以最小團購量 10 舉例。</p>
          </div>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 px-4">
          <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-1 bg-slate-200 -z-0" />
          <Node value={9} isOk={false} />
          <Node value={10} isOk={true} />
          <Node value={15} isOk={false} />
          <Node value={20} isOk={true} />
        </div>
      </div>

    </div>
  );
};

export default function App() {
  const guideMode: GuideMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'sales'
    ? 'sales'
    : 'station';
  const baseSteps = buildGuideSteps(guideMode);
  const storageKey = `${HIGHLIGHT_STORAGE_KEY}-${guideMode}`;
  const [activeStepId, setActiveStepId] = useState(1);
  const [stepsData, setStepsData] = useState<Step[]>(() => loadStoredSteps(baseSteps, storageKey));
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
      window.localStorage.setItem(storageKey, JSON.stringify(stepsData));
    }
  }, [stepsData, isEditMode, storageKey]);

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
        {guideMode === 'station' && (
          <section className="py-12">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase mb-4">多角化室</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">團購主系統操作導引</h2>
            </div>
          </section>
        )}

        {/* Guide */}
        <section className={`${guideMode === 'sales' ? 'py-8' : 'py-12'} bg-slate-50`}>
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
                    <div className={`${guideMode === 'sales' && step.customHeader === false ? 'hidden' : 'p-10 border-b border-slate-50 flex flex-col items-center justify-center gap-6 text-center'}`}>
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
                          {step.id !== 5 && <h4 className="text-3xl font-black text-slate-900 tracking-tight">{step.title}</h4>}
                          {guideMode === 'sales' && step.title === '帳號取得說明' && step.description ? (
                            <div className="mx-auto inline-flex max-w-3xl items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-6 py-4 text-left shadow-sm">
                              <ShieldCheck className="h-6 w-6 shrink-0 text-sky-700" />
                              <p className="text-lg font-black leading-8 text-slate-800">
                                銷售達人帳號需由
                                <span className="mx-1 rounded-lg bg-sky-100 px-2 py-1 text-sky-800">所屬營業處零售中心多角化管理師</span>
                                協助建立。
                              </p>
                            </div>
                          ) : step.description && (
                            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-line">{step.description}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-10 space-y-12">
                      {step.content.map((c, idx) => {
                        const width = getImageWidth(c.image, step.id);
                        return (
                          <div key={idx} className="space-y-8 flex flex-col items-center">
                            {(c.subtitle || c.description || c.link) && (
                              <div className="flex flex-col items-center justify-center gap-6 text-center w-full">
                                {c.link ? (
                                  <div className="flex flex-col items-center gap-4">
                                    {c.linkFirst ? null : (
                                      c.subtitle && <h5 className="text-2xl font-bold text-slate-800">{c.subtitle}</h5>
                                    )}

                                    {/* Mid-content QA with spacing */}
                                    {c.midQa && (
                                      <div className="my-8 flex flex-row flex-wrap gap-4 items-center justify-center w-full">
                                        {c.midQa.map((item, qIdx) => (
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

                                    <div className="relative group/link-inline inline-block mt-8 mb-4" style={{ width }}>
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
                              {c.customComponent === 'AccumulationFlow' && <AccumulationFlow />}
                              {c.customComponent === 'ClosingFlow' && <ClosingFlow />}
                              {c.customComponent === 'PostClosingFlow' && <PostClosingFlow />}
                              {c.customComponent === 'ReceivingFlow' && <ReceivingFlow />}
                              {c.customComponent === 'PickupFlow' && <PickupFlow />}
                              {c.customComponent === 'RuleExplanationFlow' && <RuleExplanationFlow />}
                              {c.customComponent === 'SalesNotice' && <SalesNotice />}
                              {c.customComponent === 'SalesAccountRequest' && <SalesAccountRequestV2 />}
                              {c.customComponent === 'SalesOrderBridge' && <SalesOrderBridge />}
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
                window.localStorage.removeItem(storageKey);
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
