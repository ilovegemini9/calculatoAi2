import puppeteer from 'puppeteer';
import * as fs from 'fs';

interface Calculator {
  name: string;
  url: string;
  category: string;
}

async function scrapeOmniCalculator() {
  console.log('Starting OmniCalculator scraping...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  const allCalculators: Calculator[] = [];
  const seenUrls = new Set<string>();
  
  try {
    // Visit the main calculators page
    await page.goto('https://www.omnicalculator.com/all-calculators', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for content to load
    await page.waitForSelector('.calculator-list, .all-calculators, a[href*="/calculator"]', { timeout: 10000 }).catch(() => {
      console.log('Standard selector not found, trying alternative approach...');
    });
    
    // Extract all calculator links
    const calculators = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/calculator"]'));
      const results: { name: string; url: string; category: string }[] = [];
      
      links.forEach((link: any) => {
        const href = link.getAttribute('href');
        const text = link.textContent?.trim() || '';
        
        if (href && text && !href.includes('#')) {
          // Try to find category from parent elements
          let category = 'General';
          let parent = link.parentElement;
          while (parent && parent.tagName !== 'BODY') {
            if (parent.classList.contains('category') || parent.classList.contains('section')) {
              category = (parent.querySelector('h2, h3, .title') as HTMLElement)?.textContent?.trim() || 'General';
              break;
            }
            parent = parent.parentElement;
          }
          
          results.push({
            name: text,
            url: href.startsWith('http') ? href : `https://www.omnicalculator.com${href}`,
            category
          });
        }
      });
      
      return results;
    });
    
    console.log(`Found ${calculators.length} calculators on main page`);
    
    // Add to allCalculators with deduplication
    calculators.forEach(calc => {
      if (!seenUrls.has(calc.url)) {
        seenUrls.add(calc.url);
        allCalculators.push(calc);
      }
    });
    
    // Try to find category pages and scrape them
    const categoryLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/category"], a[href*="/tag"]'));
      return links.map((link: any) => link.getAttribute('href')).filter(Boolean) as string[];
    });
    
    console.log(`Found ${categoryLinks.length} category pages`);
    
    // Scrape each category page
    for (const catLink of categoryLinks.slice(0, 20)) { // Limit to first 20 categories to avoid timeout
      try {
        const fullUrl = catLink!.startsWith('http') ? catLink : `https://www.omnicalculator.com${catLink}`;
        console.log(`Scraping category: ${fullUrl}`);
        
        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const categoryCalcs = await page.evaluate((categoryUrl: string) => {
          const links = Array.from(document.querySelectorAll('a[href*="/calculator"]'));
          const results: { name: string; url: string; category: string }[] = [];
          
          // Extract category name from URL or page title
          let categoryName = categoryUrl.split('/').pop() || 'General';
          const title = document.querySelector('h1')?.textContent?.trim();
          if (title) categoryName = title;
          
          links.forEach((link: any) => {
            const href = link.getAttribute('href');
            const text = link.textContent?.trim() || '';
            
            if (href && text && !href.includes('#')) {
              results.push({
                name: text,
                url: href.startsWith('http') ? href : `https://www.omnicalculator.com${href}`,
                category: categoryName
              });
            }
          });
          
          return results;
        }, fullUrl);
        
        categoryCalcs.forEach(calc => {
          if (!seenUrls.has(calc.url)) {
            seenUrls.add(calc.url);
            allCalculators.push(calc);
          }
        });
        
      } catch (error) {
        console.error(`Error scraping category ${catLink}:`, error);
      }
    }
    
    console.log(`\nTotal unique calculators found: ${allCalculators.length}`);
    
    // Save to file
    fs.writeFileSync('/workspace/omni_calculators.json', JSON.stringify(allCalculators, null, 2));
    console.log('Saved to /workspace/omni_calculators.json');
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
  
  return allCalculators;
}

scrapeOmniCalculator().then(() => {
  console.log('Scraping completed!');
}).catch(console.error);
