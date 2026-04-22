"""Объединяет 4 категорийных JSON в единый cases.json с метаданными."""
import json
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

CATEGORY_MAP = {
    "alcoholic.json": ("alcoholic", "Алкоголь"),
    "wine.json": ("wine", "Вино"),
    "non_alcoholic.json": ("non_alcoholic", "Безалкогольные"),
    "general.json": ("general", "Брендинг"),
}

SUBCATEGORY_LABELS = {
    # alcohol
    "whisky": "Виски", "vodka": "Водка", "gin": "Джин", "rum": "Ром",
    "tequila": "Текила", "beer": "Пиво", "rtd": "RTD", "liqueur": "Ликёры",
    "sake": "Сакэ", "shochu": "Сётю", "baijiu": "Байцзю", "soju": "Соджу",
    # wine
    "still_red": "Красное", "still_white": "Белое", "rose": "Розе",
    "sparkling": "Игристое", "champagne": "Шампанское", "fortified": "Крепленое",
    # non-alcoholic
    "water": "Вода", "soda": "Газировка", "juice": "Сок", "energy": "Энергетик",
    "coffee": "Кофе", "tea": "Чай", "kombucha": "Комбуча", "milk": "Молоко",
    "functional": "Функциональные", "na_spirit": "0% алкоголь",
    # general
    "tech": "Tech", "fashion": "Fashion", "retail": "Ритейл", "fintech": "Финтех",
    "media": "Медиа", "cultural": "Культура", "fmcg_food": "FMCG еда",
    "fmcg_beauty": "FMCG бьюти", "luxury": "Luxury", "b2b": "B2B",
    "startup": "Стартап",
    "other": "Прочее",
}

def normalize_date(s):
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").strftime("%Y-%m-%d")
    except Exception:
        return None

def load_category(filename, cat_key, cat_label):
    path = DATA_DIR / filename
    items = json.loads(path.read_text(encoding="utf-8"))
    enriched = []
    for i, item in enumerate(items):
        item["category"] = cat_key
        item["category_label"] = cat_label
        item["id"] = f"{cat_key}-{i:03d}"
        item["published_at"] = normalize_date(item.get("published_at"))
        item["priority"] = item.get("priority") or "B"
        item["tags"] = item.get("tags") or []
        item["also_covered_by"] = item.get("also_covered_by") or []
        sub = item.get("subcategory") or "other"
        item["subcategory"] = sub
        item["subcategory_label"] = SUBCATEGORY_LABELS.get(sub, sub.title())
        enriched.append(item)
    return enriched

def main():
    all_cases = []
    summary = {}
    for fname, (key, label) in CATEGORY_MAP.items():
        cases = load_category(fname, key, label)
        all_cases.extend(cases)
        summary[key] = {
            "label": label,
            "count": len(cases),
            "priority_a": sum(1 for c in cases if c["priority"] == "A"),
            "priority_b": sum(1 for c in cases if c["priority"] == "B"),
            "priority_c": sum(1 for c in cases if c["priority"] == "C"),
        }

    # Sort: priority A first, then by date desc, then by title
    priority_order = {"A": 0, "B": 1, "C": 2}
    all_cases.sort(key=lambda c: (
        priority_order.get(c["priority"], 3),
        -(datetime.strptime(c["published_at"], "%Y-%m-%d").toordinal() if c["published_at"] else 0),
        c["title"],
    ))

    # Дедупликация картинок: если несколько кейсов ссылаются на один URL
    # или делят одну og:image — картинку оставляем только у первого (по приоритету/дате),
    # остальным очищаем image → рендерится фирменная плитка источника.
    def _imgkey(c):
        img = (c.get("image_url") or c.get("image") or "").strip()
        return img.lower() if img else None
    def _urlkey(c):
        u = (c.get("source_url") or c.get("url") or "").strip()
        return u.lower().rstrip("/") if u else None

    seen_urls = set()
    seen_imgs = set()
    dedup_stats = {"url_dupes": 0, "img_dupes": 0}
    for c in all_cases:
        img = _imgkey(c)
        url = _urlkey(c)
        if not img:
            # картинки нет — ничего не делаем
            if url:
                seen_urls.add(url)
            continue
        if url and url in seen_urls:
            c["image_url"] = ""
            c["image"] = ""
            dedup_stats["url_dupes"] += 1
            continue
        if img in seen_imgs:
            c["image_url"] = ""
            c["image"] = ""
            dedup_stats["img_dupes"] += 1
            continue
        if url:
            seen_urls.add(url)
        seen_imgs.add(img)
    print(f"  Дедуп: {dedup_stats['url_dupes']} дублей по URL, {dedup_stats['img_dupes']} дублей по картинке")

    output = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total": len(all_cases),
        "summary": summary,
        "cases": all_cases,
    }
    out_path = DATA_DIR.parent / "cases.json"
    out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Written {out_path}: {len(all_cases)} cases")
    for key, s in summary.items():
        print(f"  {s['label']}: {s['count']} (A={s['priority_a']}, B={s['priority_b']}, C={s['priority_c']})")

if __name__ == "__main__":
    main()
