"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  MapPin,
  Globe,
  Building2,
  BookOpen,
  Loader2,
  Sparkles,
  Plus,
  Check,
  Compass,
} from "lucide-react";
import type { Work, Journal } from "@/types";
import PageShell, { EmptyBlock, SectionTitle } from "@/components/PageShell";

const LEVELS = [
  { level: 1, xp: 0, title: "初涉旅途" },
  { level: 2, xp: 50, title: "行路旅人" },
  { level: 3, xp: 120, title: "山海行者" },
  { level: 4, xp: 220, title: "远行客" },
  { level: 5, xp: 360, title: "天涯旅人" },
  { level: 6, xp: 550, title: "万里行舟" },
  { level: 7, xp: 800, title: "星海旅者" },
  { level: 8, xp: 1100, title: "光阴旅人" },
  { level: 9, xp: 1500, title: "天地行者" },
  { level: 10, xp: 2000, title: "无尽旅途" },
];

type BadgeKey =
  | "cross_continent"
  | "museum_lover"
  | "four_seasons"
  | "diary_master"
  | "wish_collector";

interface BadgeDef {
  key: BadgeKey;
  icon: string;
  name: string;
  desc: string;
}

const BADGES: BadgeDef[] = [
  { key: "cross_continent", icon: "🌍", name: "跨洲旅行", desc: "足迹遍布 2 个大洲" },
  { key: "museum_lover", icon: "🏛️", name: "博物馆爱好者", desc: "去过 5 个博物馆" },
  { key: "four_seasons", icon: "🌸", name: "四季旅行者", desc: "4 个不同月份去过" },
  { key: "diary_master", icon: "📝", name: "日记达人", desc: "写了 10 篇日记" },
  { key: "wish_collector", icon: "🗺️", name: "心愿满溢", desc: "心愿单 ≥ 20 个" },
];

function computeLevel(totalXp: number) {
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) {
      current = LEVELS[i];
      break;
    }
  }
  const next = LEVELS.find((l) => l.xp > totalXp);
  const prevXp = current.xp;
  const nextXp = next ? next.xp : current.xp + 1;
  const progress = Math.min(
    100,
    Math.round(((totalXp - prevXp) / (nextXp - prevXp)) * 100)
  );
  return { ...current, progress, nextXp: next ? next.xp : current.xp };
}

export default function DashboardPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<Array<{ name: string; reason: string }>>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [wRes, jRes] = await Promise.all([
          fetch("/api/works"),
          fetch("/api/journals"),
        ]);
        const wData = await wRes.json();
        const jData = await jRes.json();
        setWorks(wData.works || []);
        setJournals(jData.journals || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const beenWorks = works.filter((w) => w.status === "been_there");
    // 统计卡片的「国家 / 城市 / 景点」应反映用户已收集的所有地点
    //（包含想去和去过），而不是仅统计去过。否则上传的心愿单不会被计入。
    const countries = new Set(works.map((w) => w.final_country).filter(Boolean));
    const cities = new Set(works.map((w) => w.final_city).filter(Boolean));
    const attractions = new Set(
      works.map((w) => w.final_attraction).filter(Boolean)
    );

    const totalXp =
      works.length * 10 +
      journals.length * 30 +
      beenWorks.length * 25 +
      works.filter((w) => w.is_confirmed).length * 15;

    const levelInfo = computeLevel(totalXp);

    const continents = new Set<string>();
    const continentMap: Record<string, string> = {
      中国: "亚洲", 日本: "亚洲", 韩国: "亚洲", 泰国: "亚洲", 越南: "亚洲", 印度: "亚洲",
      法国: "欧洲", 英国: "欧洲", 意大利: "欧洲", 德国: "欧洲", 西班牙: "欧洲",
      美国: "北美洲", 加拿大: "北美洲", 墨西哥: "北美洲",
      澳大利亚: "大洋洲", 新西兰: "大洋洲",
      巴西: "南美洲", 阿根廷: "南美洲",
      埃及: "非洲", 南非: "非洲",
    };
    beenWorks.forEach((w) => {
      const c = continentMap[w.final_country || ""] || w.final_country;
      if (c) continents.add(c);
    });

    const museumCount = beenWorks.filter((w) =>
      /馆|院|博物馆|美术馆|展览/.test((w.final_attraction || "") + (w.final_city || ""))
    ).length;

    const months = new Set(beenWorks.map((w) => new Date(w.created_at).getMonth()));

    const badges: Record<BadgeKey, boolean> = {
      cross_continent: continents.size >= 2,
      museum_lover: museumCount >= 5,
      four_seasons: months.size >= 4,
      diary_master: journals.length >= 10,
      wish_collector: works.length >= 20,
    };

    return {
      countries: countries.size,
      cities: cities.size,
      attractions: attractions.size,
      diaries: journals.length,
      been: beenWorks.length,
      totalXp,
      levelInfo,
      badges,
    };
  }, [works, journals]);

  const loadRecs = async () => {
    if (recsLoading || recs.length > 0) return;
    setRecsLoading(true);
    try {
      const res = await fetch("/api/recommend");
      const data = await res.json();
      setRecs(data.recommendations || []);
    } catch {
      /* ignore */
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && works.filter((w) => w.is_confirmed).length > 0) {
      loadRecs();
    }
  }, [loading, works]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  const handleAddRec = async (name: string) => {
    try {
      await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          final_attraction: name,
          source_platform: "AI推荐",
        }),
      });
      setAdded((prev) => new Set(prev).add(name));
      flash(`已加入心愿单：${name}`);
    } catch {
      flash("添加失败，请重试");
    }
  };

  const earnedCount = BADGES.filter((b) => stats.badges[b.key]).length;

  return (
    <PageShell
      title="我的旅程"
      subtitle={
        loading
          ? "加载中…"
          : `Lv.${stats.levelInfo.level} · ${stats.levelInfo.title} · ${earnedCount}/${BADGES.length} 枚徽章`
      }
      icon={<Compass className="h-[17px] w-[17px]" />}
    >
      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-fg-3" />
        </div>
      )}

      {!loading && works.length === 0 && (
        <EmptyBlock
          icon={<Globe className="h-5 w-5" />}
          title="还没有旅行数据"
          hint="上传第一张旅行截图，开始你的旅程吧"
        />
      )}

      {!loading && works.length > 0 && (
        <div className="space-y-7">
          {/* ── 等级卡 ───────────────────────────────── */}
          <section
            className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: "var(--glow)" }}
            />
            <div className="relative">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold">
                <Trophy className="h-5 w-5" />
              </div>

              <div
                className="text-[52px] font-light leading-none tracking-tight text-fg"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Lv.{stats.levelInfo.level}
              </div>
              <div className="mt-1.5 text-[13px] font-medium text-brand">
                {stats.levelInfo.title}
              </div>

              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(stats.levelInfo.progress, 2)}%`,
                    background: "linear-gradient(90deg, var(--brand), var(--brand-2))",
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-fg-3">
                <span>{stats.totalXp} XP</span>
                <span>
                  {stats.levelInfo.nextXp > stats.totalXp
                    ? `距 Lv.${stats.levelInfo.level + 1} 还需 ${stats.levelInfo.nextXp - stats.totalXp} XP`
                    : "已满级"}
                </span>
              </div>
            </div>
          </section>

          {/* ── 数据统计 ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Globe, label: "国家", value: stats.countries, tone: "text-brand" },
              { icon: Building2, label: "城市", value: stats.cities, tone: "text-gold" },
              { icon: MapPin, label: "景点", value: stats.attractions, tone: "text-brand" },
              { icon: BookOpen, label: "日记", value: stats.diaries, tone: "text-gold" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-surface p-4 text-center transition-colors hover:border-line-2"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <s.icon className={`mx-auto mb-1.5 h-[18px] w-[18px] ${s.tone}`} />
                <div
                  className="text-[26px] font-light leading-none text-fg"
                  style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] tracking-wide text-fg-3">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── 徽章 ─────────────────────────────────── */}
          <section>
            <SectionTitle
              icon={<Trophy className="h-4 w-4" />}
              aside={
                <span className="text-[11px] text-fg-3">
                  {earnedCount}/{BADGES.length}
                </span>
              }
            >
              徽章收集
            </SectionTitle>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {BADGES.map((b) => {
                const earned = stats.badges[b.key];
                return (
                  <div
                    key={b.key}
                    title={b.desc}
                    className={`rounded-2xl border p-3 text-center transition-all ${
                      earned
                        ? "border-gold/50 bg-gold-soft"
                        : "border-line bg-surface opacity-45 saturate-0"
                    }`}
                  >
                    <span className="mb-1 block text-[22px] leading-none">
                      {b.icon}
                    </span>
                    <p className="text-[10px] font-medium leading-tight text-fg">
                      {b.name}
                    </p>
                    <p className="mt-0.5 text-[9px] leading-tight text-fg-3">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── AI 推荐 ──────────────────────────────── */}
          <section>
            <SectionTitle icon={<Sparkles className="h-4 w-4" />}>
              AI 推荐目的地
            </SectionTitle>

            {recsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-fg-3" />
              </div>
            )}

            {!recsLoading && recs.length === 0 && (
              <p className="rounded-2xl border border-dashed border-line-2 px-4 py-8 text-center text-xs text-fg-3">
                {works.filter((w) => w.is_confirmed).length === 0
                  ? "确认几个心愿后，AI 会为你推荐相似的去处"
                  : "暂无推荐，稍后再来看看"}
              </p>
            )}

            {recs.length > 0 && (
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                {recs.map((r) => {
                  const done = added.has(r.name);
                  return (
                    <div
                      key={r.name}
                      className="w-[190px] shrink-0 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-2"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      <p className="text-[13px] font-semibold text-fg">{r.name}</p>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-fg-2">
                        {r.reason}
                      </p>
                      <button
                        onClick={() => handleAddRec(r.name)}
                        disabled={done}
                        className={`mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                          done
                            ? "bg-brand-soft text-brand"
                            : "bg-brand text-brand-contrast hover:opacity-90"
                        }`}
                      >
                        {done ? (
                          <>
                            <Check className="h-3 w-3" /> 已添加
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" /> 加入心愿单
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* 轻提示 */}
      {toast && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-rise-in rounded-full border border-line bg-surface px-4 py-2 text-xs font-medium text-fg shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
