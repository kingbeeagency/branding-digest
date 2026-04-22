#!/usr/bin/env python3
"""
Enrich existing cases/news with og:image / twitter:image / link[rel=image_src].
Reads data/*.json + data/news.json, fetches each source_url, extracts image URL,
writes back to the same files.
"""
import json
import re
import sys
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests not installed")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
}

# Regex patterns for OG-image extraction (fast, no BeautifulSoup)
OG_PATTERNS = [
    re.compile(r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']', re.I),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::secure_url)?["\']', re.I),
    re.compile(r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)["\']', re.I),
    re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image(?::src)?["\']', re.I),
    re.compile(r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']', re.I),
]

BAD_PATTERNS = [
    'logo', 'favicon', 'sprite', 'icon-', '-icon', 'placeholder',
    'default', 'generic', 'share-default',
]


def extract_image(html: str, base_url: str) -> str | None:
    for pat in OG_PATTERNS:
        m = pat.search(html)
        if m:
            url = m.group(1).strip()
            if not url or url.startswith('data:'):
                continue
            # Skip generic logos
            lower = url.lower()
            if any(b in lower for b in BAD_PATTERNS):
                continue
            # Make absolute
            if url.startswith('//'):
                url = 'https:' + url
            elif url.startswith('/'):
                url = urllib.parse.urljoin(base_url, url)
            return url
    return None


def fetch_og(url: str) -> str | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12, allow_redirects=True,
                            stream=True)
        # Read only first 200 KB — OG meta is always in <head>
        content = b''
        for chunk in resp.iter_content(chunk_size=32768):
            content += chunk
            if len(content) > 200_000:
                break
            if b'</head>' in content:
                break
        try:
            html = content.decode('utf-8', errors='replace')
        except Exception:
            html = content.decode('latin-1', errors='replace')
        return extract_image(html, resp.url)
    except Exception as e:
        return None


def enrich_entries(entries, id_key='id', url_key='source_url'):
    """entries: list of dicts with 'id' and 'source_url'. Returns {id: image_url}."""
    todo = [(e[id_key], e[url_key]) for e in entries
            if e.get(url_key) and not e.get('image_url')]
    print(f"  Fetching og:image for {len(todo)} entries...", flush=True)
    results = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_og, url): (eid, url) for eid, url in todo}
        for i, fut in enumerate(as_completed(futures), 1):
            eid, url = futures[fut]
            try:
                img = fut.result()
            except Exception:
                img = None
            if img:
                results[eid] = img
            if i % 10 == 0 or i == len(todo):
                print(f"    [{i}/{len(todo)}] hits: {len(results)}", flush=True)
    return results


def main():
    root = Path('/home/user/workspace/branding-dashboard')
    data_dir = root / 'data'

    # Enrich category files
    for fname in ['alcoholic.json', 'wine.json', 'non_alcoholic.json', 'general.json']:
        path = data_dir / fname
        with open(path, encoding='utf-8') as f:
            cases = json.load(f)
        print(f"\n{fname}: {len(cases)} cases", flush=True)
        enriched = enrich_entries(cases)
        n = 0
        for c in cases:
            if c['id'] in enriched and not c.get('image_url'):
                c['image_url'] = enriched[c['id']]
                n += 1
        print(f"  Added image_url to {n} cases", flush=True)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(cases, f, ensure_ascii=False, indent=2)

    # Enrich news
    news_path = data_dir / 'news.json'
    with open(news_path, encoding='utf-8') as f:
        news_data = json.load(f)
    news = news_data.get('news', [])
    print(f"\nnews.json: {len(news)} items", flush=True)
    enriched = enrich_entries(news)
    n = 0
    for x in news:
        if x['id'] in enriched and not x.get('image_url'):
            x['image_url'] = enriched[x['id']]
            n += 1
    print(f"  Added image_url to {n} news items", flush=True)
    with open(news_path, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)

    print("\nDone.")


if __name__ == '__main__':
    main()
