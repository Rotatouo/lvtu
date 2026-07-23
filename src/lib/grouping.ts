import type { Work, GroupNode } from "@/types";

// 拍平阈值：某个层级下的作品数小于此值时跳过该层级
const FLATTEN_THRESHOLD = 5;

/**
 * 将作品列表按四级分类动态分组
 * 规则：
 * 1. 中国地区保留省份层级
 * 2. 小层级（< 阈值）自动拍平
 * 3. 优先使用 final_* 字段，fallback 到 ai_*
 */
export function buildGroupTree(works: Work[]): GroupNode[] {
  // 使用最终分类或 AI 分类
  const getField = (work: Work, field: "country" | "region" | "city" | "attraction") => {
    const finalKey = `final_${field}` as keyof Work;
    const aiKey = `ai_${field}` as keyof Work;
    return (work[finalKey] as string) || (work[aiKey] as string) || null;
  };

  // 按国家分组
  const countryMap = new Map<string, Work[]>();
  for (const work of works) {
    const country = getField(work, "country") || "未知国家";
    if (!countryMap.has(country)) countryMap.set(country, []);
    countryMap.get(country)!.push(work);
  }

  const tree: GroupNode[] = [];

  for (const [country, countryWorks] of countryMap) {
    const isChina = country === "中国";

    // 决定是否按省份分组
    if (isChina || countryWorks.length >= FLATTEN_THRESHOLD) {
      const regionMap = new Map<string, Work[]>();
      for (const w of countryWorks) {
        const region = getField(w, "region") || "未知地区";
        if (!regionMap.has(region)) regionMap.set(region, []);
        regionMap.get(region)!.push(w);
      }

      const regionNodes: GroupNode[] = [];
      for (const [region, regionWorks] of regionMap) {
        // 决定是否按城市分组
        if (regionWorks.length >= FLATTEN_THRESHOLD) {
          const cityMap = new Map<string, Work[]>();
          for (const w of regionWorks) {
            const city = getField(w, "city") || "未知城市";
            if (!cityMap.has(city)) cityMap.set(city, []);
            cityMap.get(city)!.push(w);
          }

          const cityNodes: GroupNode[] = [];
          for (const [city, cityWorks] of cityMap) {
            // 决定是否按景点分组
            if (cityWorks.length >= FLATTEN_THRESHOLD) {
              const attrMap = new Map<string, Work[]>();
              for (const w of cityWorks) {
                const attr = getField(w, "attraction") || "未知景点";
                if (!attrMap.has(attr)) attrMap.set(attr, []);
                attrMap.get(attr)!.push(w);
              }

              const attrNodes: GroupNode[] = [];
              for (const [attr, attrWorks] of attrMap) {
                attrNodes.push({
                  key: `${country}-${region}-${city}-${attr}`,
                  label: attr,
                  level: "attraction",
                  count: attrWorks.length,
                  children: [],
                  works: attrWorks,
                });
              }

              cityNodes.push({
                key: `${country}-${region}-${city}`,
                label: city,
                level: "city",
                count: cityWorks.length,
                children: attrNodes,
                works: [],
              });
            } else {
              // 城市下直接展示作品
              cityNodes.push({
                key: `${country}-${region}-${city}`,
                label: city,
                level: "city",
                count: cityWorks.length,
                children: [],
                works: cityWorks,
              });
            }
          }

          regionNodes.push({
            key: `${country}-${region}`,
            label: region,
            level: "region",
            count: regionWorks.length,
            children: cityNodes,
            works: [],
          });
        } else {
          // 省份下直接展示作品（拍平城市）
          regionNodes.push({
            key: `${country}-${region}`,
            label: region,
            level: "region",
            count: regionWorks.length,
            children: [],
            works: regionWorks,
          });
        }
      }

      tree.push({
        key: country,
        label: country,
        level: "country",
        count: countryWorks.length,
        children: regionNodes,
        works: [],
      });
    } else {
      // 小国家直接展示作品（拍平省份/城市/景点）
      tree.push({
        key: country,
        label: country,
        level: "country",
        count: countryWorks.length,
        children: [],
        works: countryWorks,
      });
    }
  }

  return tree;
}
