import requests
from bs4 import BeautifulSoup
import json
import re

def fetch_omni_calculators():
    base_url = "https://www.omnicalculator.com"
    calculators = []
    
    # قائمة التصنيفات المعروفة
    categories = [
        'biology', 'chemistry', 'construction', 'finance', 'math', 
        'physics', 'statistics', 'food', 'health', 'everyday-life',
        'ecology', 'sports', 'astronomy', 'computer-science'
    ]
    
    for category in categories:
        try:
            url = f"{base_url}/{category}"
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # البحث عن روابط الحاسبات
                links = soup.find_all('a', href=re.compile(r'^/[^/]+$'))
                for link in links:
                    href = link.get('href', '')
                    text = link.get_text(strip=True)
                    
                    # تجنب الروابط الفارغة أو التصنيفات
                    if href and href not in ['/', f'/{category}', '#'] and len(href.split('/')) == 2:
                        calc_name = href.replace('/', '').replace('-', ' ').title()
                        if calc_name and len(calc_name) > 3:
                            calculators.append({
                                'name': calc_name,
                                'slug': href.replace('/', ''),
                                'url': f"{base_url}{href}",
                                'category': category,
                                'source': 'omnicalculator.com'
                            })
                            
        except Exception as e:
            print(f"Error fetching {category}: {e}")
    
    # إزالة التكرارات
    seen = set()
    unique_calcs = []
    for calc in calculators:
        if calc['slug'] not in seen:
            seen.add(calc['slug'])
            unique_calcs.append(calc)
    
    return unique_calcs

if __name__ == '__main__':
    calcs = fetch_omni_calculators()
    print(f"Found {len(calcs)} calculators")
    
    with open('/workspace/artifacts/calculator-platform/config/omni-full-database.json', 'w', encoding='utf-8') as f:
        json.dump(calcs, f, indent=2, ensure_ascii=False)
    
    print("Saved to omni-full-database.json")
    print("Sample:", calcs[:5] if calcs else "No data")
