import requests
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin, urlparse
import time

class CalculatorScraper:
    def __init__(self):
        self.calculators = {}  # Use a dict to handle duplicates automatically
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    def normalize_name(self, name):
        """Normalize calculator names to detect duplicates"""
        name = name.lower().strip()
        name = re.sub(r'\s*calculator\s*', '', name)
        name = re.sub(r'[^a-z0-9]', '', name)
        return name

    def scrape_omnicalculator(self):
        print("🔍 Scraping OmniCalculator...")
        base_url = "https://www.omnicalculator.com"
        
        try:
            # Get main sitemap or index page
            response = requests.get(f"{base_url}/all-calculators", headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all calculator links
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link['href']
                if '/calculator/' in href or (href.startswith('/') and 'calculator' in href):
                    full_url = urljoin(base_url, href)
                    title = link.get_text(strip=True)
                    
                    if title and len(title) > 3:
                        norm_name = self.normalize_name(title)
                        
                        if norm_name not in self.calculators:
                            self.calculators[norm_name] = {
                                'name': title,
                                'source': 'omnicalculator',
                                'url': full_url,
                                'category': self.extract_category(full_url),
                                'logic_hints': self.guess_logic(title)
                            }
            
            print(f"✅ Found {len(self.calculators)} unique calculators from OmniCalculator so far.")
            
        except Exception as e:
            print(f"❌ Error scraping OmniCalculator: {e}")

    def scrape_calculator_net(self):
        print("🔍 Scraping Calculator.net...")
        base_url = "https://www.calculator.net"
        
        try:
            # Calculator.net has a specific directory structure
            categories = [
                '/financial-calculator.html',
                '/fitness-health-calculator.html',
                '/math-calculator.html',
                '/other-calculator.html',
                '/science-calculator.html',
                '/date-calculator.html',
                '/conversion-calculator.html'
            ]
            
            for cat_link in categories:
                try:
                    response = requests.get(f"{base_url}{cat_link}", headers=self.headers)
                    response.raise_for_status()
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Look for lists of calculators
                    calc_links = soup.find_all('a', href=re.compile(r'-calculator\.html$'))
                    
                    for link in calc_links:
                        href = link['href']
                        title = link.get_text(strip=True)
                        full_url = urljoin(base_url, href)
                        
                        if title and len(title) > 3:
                            norm_name = self.normalize_name(title)
                            
                            if norm_name not in self.calculators:
                                self.calculators[norm_name] = {
                                    'name': title,
                                    'source': 'calculator.net',
                                    'url': full_url,
                                    'category': self.extract_category(full_url),
                                    'logic_hints': self.guess_logic(title)
                                }
                            # If duplicate, we keep the first one found (Omni usually has better UI logic)
                            
                except Exception as e:
                    print(f"⚠️ Error in category {cat_link}: {e}")
                    
            print(f"✅ Total unique calculators after merging: {len(self.calculators)}")
            
        except Exception as e:
            print(f"❌ Error scraping Calculator.net: {e}")

    def extract_category(self, url):
        """Extract category from URL structure"""
        parts = url.split('/')
        if 'omnicalculator' in url:
            # Usually /category/calculator-name
            if len(parts) >= 4:
                return parts[3]
        elif 'calculator.net' in url:
            # Usually based on the section
            if 'financial' in url: return 'Finance'
            if 'fitness' in url or 'health' in url: return 'Health'
            if 'math' in url: return 'Math'
            if 'science' in url: return 'Science'
            if 'date' in url: return 'Date/Time'
            if 'conversion' in url: return 'Conversion'
        return 'General'

    def guess_logic(self, name):
        """Basic heuristic to guess input/output schema based on name"""
        name_lower = name.lower()
        schema = {'inputs': [], 'outputs': []}
        
        if any(x in name_lower for x in ['loan', 'mortgage', 'interest']):
            schema['inputs'] = ['principal', 'rate', 'term', 'start_date']
            schema['outputs'] = ['monthly_payment', 'total_interest', 'payoff_date']
        elif any(x in name_lower for x in ['bmi', 'body', 'fat']):
            schema['inputs'] = ['weight', 'height', 'age', 'gender']
            schema['outputs'] = ['bmi_value', 'category', 'healthy_range']
        elif any(x in name_lower for x in ['age', 'birthday']):
            schema['inputs'] = ['birth_date', 'current_date']
            schema['outputs'] = ['years', 'months', 'days']
        elif any(x in name_lower for x in ['percentage', '%']):
            schema['inputs'] = ['value1', 'value2', 'operation_type']
            schema['outputs'] = ['result']
        elif any(x in name_lower for x in ['calorie', 'food', 'diet']):
            schema['inputs'] = ['weight', 'height', 'age', 'activity_level', 'goal']
            schema['outputs'] = ['daily_calories', 'macros']
        else:
            schema['inputs'] = ['input_1', 'input_2']
            schema['outputs'] = ['result']
            
        return schema

    def save_results(self, filename='all_calculators.json'):
        data = {
            'total_count': len(self.calculators),
            'sources': ['omnicalculator.com', 'calculator.net'],
            'deduplicated': True,
            'calculators': list(self.calculators.values())
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Saved {len(self.calculators)} unique calculators to {filename}")

if __name__ == "__main__":
    scraper = CalculatorScraper()
    
    # Step 1: Scrape both sites
    scraper.scrape_omnicalculator()
    time.sleep(2) # Be polite
    scraper.scrape_calculator_net()
    
    # Step 2: Save results
    scraper.save_results()
    
    # Print summary
    print("\n--- SUMMARY ---")
    print(f"Total Unique Calculators: {len(scraper.calculators)}")
    categories = set(c['category'] for c in scraper.calculators.values())
    print(f"Categories found: {', '.join(categories)}")
