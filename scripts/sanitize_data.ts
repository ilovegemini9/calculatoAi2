import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OMNI_FILE = path.join(__dirname, '../omni_calculators.json');
const NET_FILE = path.join(__dirname, '../calculator_net_fixed.json');
const OUTPUT_FILE = path.join(__dirname, '../lib/data/calculators_db.json');

function sanitizeText(text: string): string {
  if (!text) return '';
  // إزالة الرموز غير الصالحة لـ UTF-8 واستبدالها
  return text.replace(/[^\x00-\x7F]/g, ''); 
}

function loadAndSanitize(filePath: string, isWrapped?: boolean): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return [];
  }
  
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    let data;
    
    // محاولة إصلاح JSON المكسور
    if (isWrapped) {
      // ملف مغلف بـ metadata
      const jsonStart = raw.indexOf('[');
      const jsonEnd = raw.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No array found in wrapped JSON');
      }
      const cleanJson = raw.substring(jsonStart, jsonEnd + 1);
      data = JSON.parse(cleanJson);
    } else {
      // ملف JSON عادي
      data = JSON.parse(raw);
    }
    
    return data.map((item: any) => ({
      id: item.id || item.slug || sanitizeText(item.title || item.name).toLowerCase().replace(/\s+/g, '-'),
      title: sanitizeText(item.title || item.name),
      url: item.url,
      source: item.source || 'unknown',
      category: item.category || 'general',
      description: sanitizeText(item.description || '')
    }));
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error);
    return [];
  }
}

async function main() {
  console.log('🧹 Sanitizing calculator data...');
  
  const omniData = loadAndSanitize(OMNI_FILE, false); // omni_calculators.json هو array مباشر
  const netData = loadAndSanitize(NET_FILE, false); // calculator_net_fixed.json هو array مباشر
  
  // دمج البيانات وإزالة التكرار بناءً على ID
  const allCalculators = [...omniData, ...netData];
  const uniqueMap = new Map();
  
  allCalculators.forEach(calc => {
    if (!uniqueMap.has(calc.id)) {
      uniqueMap.set(calc.id, calc);
    }
  });
  
  const finalData = Array.from(uniqueMap.values());
  
  // تأكد من وجود المجلد
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
  
  console.log(`✅ Successfully saved ${finalData.length} calculators to ${OUTPUT_FILE}`);
}

main().catch(console.error);
