// 作品状态
export type WorkStatus = "want_to_go" | "been_there";

// 作品数据模型
export interface Work {
  id: string;
  image_url: string | null;
  image_thumb: string | null;
  // AI 原始结果
  ai_country: string | null;
  ai_region: string | null;
  ai_city: string | null;
  ai_attraction: string | null;
  // 用户确认后的分类
  final_country: string | null;
  final_region: string | null;
  final_city: string | null;
  final_attraction: string | null;
  is_confirmed: boolean;
  // 坐标
  lat: number | null;
  lng: number | null;
  // 百科备注
  opening_note: string | null;
  // 排序
  sort_order: number;
  // 元数据
  source_platform: string | null;
  notes: string | null;
  status: WorkStatus;
  created_at: string;
  updated_at: string;
}

// AI 分类结果
export interface ClassificationResult {
  country: string | null;
  region: string | null;
  city: string | null;
  attraction: string | null;
  confidence: "high" | "medium" | "low";
  evidence: string;
  lat: number | null;
  lng: number | null;
  opening_note: string | null;
}

// 旅行日记
export interface Journal {
  id: string;
  work_id: string;
  content: string;
  quote: string | null;
  photo_url: string | null;
  visited_at: string | null;
  created_at: string;
}

// 分组节点（用于动态拍平）
export interface GroupNode {
  key: string;
  label: string;
  level: "country" | "region" | "city" | "attraction";
  count: number;
  children: GroupNode[];
  works: Work[];
}

// 上传状态
export type UploadStatus = "idle" | "uploading" | "classifying" | "done" | "error";

// 路线
export interface Route {
  id: string;
  name: string;
  color: string;
  created_at: string;
  items?: RouteItem[];
}

export interface RouteItem {
  id: string;
  route_id: string;
  work_id: string;
  sort_order: number;
  work?: Work;
}
