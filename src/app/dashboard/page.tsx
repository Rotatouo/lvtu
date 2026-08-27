"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, MapPin, Globe, Building2, BookOpen, Loader2, Sparkles, Plus } from "lucide-react";
import type { Work, Journal } from "@/types";

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

type BadgeKey = "cross_continent" | "museum_lover" | "four_seasons" | "diary_master" | "wish_collector";

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
    if (totalXp >= LEVELS[i].xp) { current = LEVELS[i]; break; }
  }
  const next = LEVELS.find((l) => l.xp > totalXp);
  const prevXp = current.xp;
  const nextXp = next ? next.xp : current.xp + 1;
  const progress = Math.min(100, Math.round(((totalXp - prevXp) / (nextXp - prevXp)) * 100));
  return { ...current, progress, nextXp: next ? next.xp : current.xp };
}

export default function DashboardPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<Array<{ name: string; reason: string }>>([]);
  const [recsLoading, setRecsLoading] = useState(false);

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

  // Stats
  const stats = useMemo(() => {
    const beenWorks = works.filter((w) => w.status === "been_there");
    const countries = new Set(beenWorks.map((w) => w.final_country).filter(Boolean));
    const cities = new Set(beenWorks.map((w) => w.final_city).filter(Boolean));
    const attractions = new Set(beenWorks.map((w) => w.final_attraction).filter(Boolean));

    // Experience
    const totalXp =
      works.length * 10 +
      journals.length * 30 +
      beenWorks.length * 25 +
      works.filter((w) => w.is_confirmed).length * 15;

    const levelInfo = computeLevel(totalXp);

    // Badges
    const continents = new Set<string>();
    const continentMap: Record<string, string> = {
      "中国": "亚洲", "日本": "亚洲", "韩国": "亚洲", "泰国": "亚洲", "越南": "亚洲", "印度": "亚洲",
      "法国": "欧洲", "英国": "欧洲", "意大利": "欧洲", "德国": "欧洲", "西班牙": "欧洲",
      "美国": "北美洲", "加拿大": "北美洲", "墨西哥": "北美洲",
      "澳大利亚": "大洋洲", "新西兰": "大洋洲",
      "巴西": "南美洲", "阿根廷": "南美洲",
      "埃及": "非洲", "南非": "非洲",
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
      totalXp,
      levelInfo,
      badges,
    };
  }, [works, journals]);

  useEffect(() => {
    if (loading || !works.some((w) => w.is_confirmed)) return;

    let cancelled = false;
    async function loadRecs() {
      setRecsLoading(true);
      try {
        const res = await fetch("/api/recommend");
        const data = await res.json();
        if (!cancelled) setRecs(data.recommendations || []);
      } catch { /* ignore */ }
      finally {
        if (!cancelled) setRecsLoading(false);
      }
    }

    loadRecs();
    return () => {
      cancelled = true;
    };
  }, [loading, works]);

  const handleAddRec = async (name: string) => {
    try {
      await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_attraction: name, source_platform: "AI推荐" }),
      });
      alert(`已添加到心愿单: ${name}`);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">我的旅程</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {works.length === 0 ? (
          <div className="text-center py-20 space-y-2">
            <Globe className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-400 text-sm">还没有旅行数据</p>
            <p className="text-gray-300 text-xs">上传你的第一张旅行截图,开始你的旅程吧!</p>
          </div>
        ) : (
          <>
            {/* 成就概览 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                Lv.{stats.levelInfo.level}
              </div>
              <div className="text-base font-medium text-blue-600 dark:text-blue-400 mb-3">
                {stats.levelInfo.title}
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.levelInfo.progress}%` }}
                />
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {stats.totalXp} / {stats.levelInfo.nextXp} XP
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Globe, label: "国家", value: stats.countries, color: "text-green-500" },
                { icon: Building2, label: "城市", value: stats.cities, color: "text-amber-500" },
                { icon: MapPin, label: "景点", value: stats.attractions, color: "text-blue-500" },
                { icon: BookOpen, label: "日记", value: stats.diaries, color: "text-purple-500" },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                  <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</div>
                  <div className="text-[11px] text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 徽章 */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">徽章收集</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {BADGES.map((b) => {
                  const earned = stats.badges[b.key];
                  return (
                    <div
                      key={b.key}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm border transition-all ${
                        earned
                          ? "border-yellow-300 dark:border-yellow-600 animate-bounce"
                          : "border-gray-100 dark:border-gray-700 opacity-40 grayscale"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{b.icon}</span>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{b.name}</p>
                      <p className="text-[9px] text-gray-400">{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI 推荐 */}
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI 推荐目的地
              </h2>
              {recsLoading && (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              )}
              {!recsLoading && recs.length === 0 && (
                <p className="text-sm text-gray-400 py-3">添加更多目的地后,AI 会为你推荐相似的去处</p>
              )}
              {recs.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {recs.map((r) => (
                    <div key={r.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[180px] shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 mb-3">{r.reason}</p>
                      <button
                        onClick={() => handleAddRec(r.name)}
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-3 h-3" /> 添加到心愿单
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
