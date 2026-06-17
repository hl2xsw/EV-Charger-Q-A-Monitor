import { PortalType } from "../types";

export const PORTAL_MAP: Record<PortalType, { name: string; color: string; badge: string }> = {
  naver_jisinin: {
    name: "네이버 지식iN",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badge: "🟢 지식iN"
  },
  daum_tip: {
    name: "다음 팁 (TIP)",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    badge: "🔵 다음팁"
  },
  naver_cafe: {
    name: "네이버 카페",
    color: "bg-green-50 text-green-700 border-green-200",
    badge: "☕ 네이버카페"
  },
  daum_cafe: {
    name: "다음 카페",
    color: "bg-sky-50 text-sky-700 border-sky-200",
    badge: "☕ 다음카페"
  },
  dcinside: {
    name: "디시인사이드",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    badge: "💬 디시"
  },
  fmkorea: {
    name: "에펨코리아",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    badge: "⚽ 펨코"
  },
  inven: {
    name: "인벤",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    badge: "🎮 인벤"
  },
  bobae_dream: {
    name: "보배드림",
    color: "bg-slate-100 text-slate-800 border-slate-300",
    badge: "🚗 보배"
  }
};

export const CATEGORY_COLORS: Record<string, string> = {
  "설치 문의": "bg-blue-100 text-blue-800",
  "고장/불만": "bg-red-100 text-red-800",
  "요금/효율": "bg-amber-100 text-amber-800",
  "이용 방법": "bg-indigo-100 text-indigo-800",
  "안전/사고": "bg-rose-100 text-rose-800 border border-rose-200",
  "글로벌/트렌드": "bg-purple-100 text-purple-800",
  "기타": "bg-gray-100 text-gray-800"
};
