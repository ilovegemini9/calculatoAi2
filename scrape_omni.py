import requests
from bs4 import BeautifulSoup
import json
import time
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

def scrape_omnicalculator():
    """Scrape all calculators from omnicalculator.com using sitemap"""
    
    base_url = "https://www.omnicalculator.com"
    all_calculators = []
    seen_urls = set()
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    print("Starting OmniCalculator scraping using sitemap...")
    
    # Get sitemap index
    try:
        sitemap_index_url = f"{base_url}/sitemap.xml"
        print(f"Fetching sitemap index: {sitemap_index_url}")
        response = requests.get(sitemap_index_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse sitemap index - handle both XML namespaces and plain XML
        content = response.text
        
        # Try to extract loc tags with regex as fallback
        import re
        loc_pattern = r'<loc>([^<]+)</loc>'
        sitemap_urls = re.findall(loc_pattern, content)
        
        if not sitemap_urls:
            # Try with BeautifulSoup XML parser
            try:
                root = ET.fromstring(content.encode('utf-8'))
                # Try different namespace variations
                for ns in ['', '{http://www.sitemaps.org/schemas/sitemap/0.9}']:
                    sitemap_urls = [elem.text for elem in root.findall(f'.//{ns}sitemap/{ns}loc')]
                    if sitemap_urls:
                        break
            except Exception as e:
                print(f"XML parsing error: {e}")
        
        print(f"Found {len(sitemap_urls)} sitemaps: {sitemap_urls}")
        
        # Fetch each sitemap
        all_urls = []
        for sitemap_url in sitemap_urls:
            try:
                print(f"Fetching sitemap: {sitemap_url}")
                sitemap_response = requests.get(sitemap_url, headers=headers, timeout=60)
                sitemap_response.raise_for_status()
                
                # Parse sitemap - use regex for reliability
                sitemap_content = sitemap_response.text
                urls = re.findall(loc_pattern, sitemap_content)
                
                all_urls.extend(urls)
                print(f"  Found {len(urls)} URLs in this sitemap")
                
            except Exception as e:
                print(f"Error fetching sitemap {sitemap_url}: {e}")
                continue
        
        print(f"\nTotal URLs from sitemaps: {len(all_urls)}")
        
        # Filter for calculator URLs
        calculator_urls = [url for url in all_urls if '/calculator' in url or 
                          any(cat in url for cat in ['/finance', '/health', '/math', '/physics', '/chemistry', 
                                                      '/construction', '/everyday', '/statistics', '/biology'])]
        
        print(f"Found {len(calculator_urls)} potential calculator URLs")
        
        # Now fetch details for each calculator page (sample first 100 to avoid timeout)
        sample_size = min(100, len(calculator_urls))
        print(f"Fetching details for first {sample_size} calculators...")
        
        for i, url in enumerate(calculator_urls[:sample_size]):
            try:
                print(f"[{i+1}/{sample_size}] {url}")
                page_response = requests.get(url, headers=headers, timeout=30)
                page_response.raise_for_status()
                
                soup = BeautifulSoup(page_response.text, 'lxml')
                
                # Get title
                h1 = soup.find('h1')
                title = h1.get_text(strip=True) if h1 else urlparse(url).path.split('/')[-1].replace('-', ' ').title()
                
                # Try to determine category from URL structure
                path_parts = urlparse(url).path.strip('/').split('/')
                category = path_parts[0] if len(path_parts) > 1 else "General"
                
                # Map common categories to friendly names
                category_map = {
                    'finance': 'Finance',
                    'health': 'Health',
                    'math': 'Math',
                    'physics': 'Physics',
                    'chemistry': 'Chemistry',
                    'construction': 'Construction',
                    'everyday-life': 'Everyday Life',
                    'statistics': 'Statistics',
                    'biology': 'Biology',
                    'food': 'Food',
                    'computer': 'Computer Science',
                    'other': 'Other'
                }
                category = category_map.get(category, category.replace('-', ' ').title())
                
                if url not in seen_urls:
                    seen_urls.add(url)
                    all_calculators.append({
                        'name': title,
                        'url': url,
                        'category': category,
                        'source': 'omnicalculator.com'
                    })
                
                time.sleep(0.1)  # Be nice to the server
                
            except Exception as e:
                print(f"  Error fetching {url}: {e}")
                continue
    
    except Exception as e:
        print(f"Error with sitemap approach: {e}")
        print("Falling back to direct scraping...")
        
        # Fallback: try direct scraping of known category pages
        known_categories = [
            'finance', 'health', 'math', 'physics', 'chemistry',
            'construction', 'everyday-life', 'statistics', 'biology',
            'food', 'computer', 'other'
        ]
        
        for cat in known_categories:
            try:
                cat_url = f"{base_url}/{cat}"
                print(f"Trying category: {cat_url}")
                response = requests.get(cat_url, headers=headers, timeout=30)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'lxml')
                    links = soup.find_all('a', href=lambda x: x and '/calculator' in x or (x and cat in x))
                    for link in links:
                        href = link.get('href', '')
                        text = link.get_text(strip=True)
                        if text and href:
                            full_url = href if href.startswith('http') else urljoin(base_url, href)
                            if full_url not in seen_urls:
                                seen_urls.add(full_url)
                                all_calculators.append({
                                    'name': text,
                                    'url': full_url,
                                    'category': cat.replace('-', ' ').title(),
                                    'source': 'omnicalculator.com'
                                })
            except Exception as e:
                print(f"Error with category {cat}: {e}")
    
    print(f"\n{'='*60}")
    print(f"Total unique calculators found: {len(all_calculators)}")
    print(f"{'='*60}\n")
    
    # Save to file
    output_file = '/workspace/omni_calculators.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_calculators, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to {output_file}")
    
    # Also print summary by category
    categories = {}
    for calc in all_calculators:
        cat = calc['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\nCalculators by category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:20]:
        print(f"  {cat}: {count}")
    
    return all_calculators

if __name__ == '__main__':
    scrape_omnicalculator()
