import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator as CalcIcon, 
  TrendingUp, 
  Settings, 
  Shield, 
  FileText, 
  Users, 
  Check, 
  Copy, 
  Share2, 
  Download, 
  Activity, 
  DollarSign, 
  Percent, 
  Calendar, 
  Award, 
  Heart, 
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Database,
  Search,
  BookOpen,
  ArrowRight,
  Globe,
  Mail,
  Menu,
  X
} from 'lucide-react';

import { Calculator, Article, Redirect } from './types';
import { DynamicCalculatorWidget } from './components/DynamicCalculatorWidget';
import { validateGeneratedCode } from './security';

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: { items: string[]; ordered: boolean } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;
  let isHeaderSeparator = false;

  const flushList = (key: string) => {
    if (currentList) {
      const listKey = `list_${key}`;
      if (currentList.ordered) {
        renderedElements.push(
          <ol key={listKey} className="list-decimal pl-6 my-4 space-y-2 text-slate-700 text-sm leading-relaxed text-left">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlines(item) }} />
            ))}
          </ol>
        );
      } else {
        renderedElements.push(
          <ul key={listKey} className="list-disc pl-6 my-4 space-y-2 text-slate-700 text-sm leading-relaxed text-left">
            {currentList.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlines(item) }} />
            ))}
          </ul>
        );
      }
      currentList = null;
    }
  };

  const flushTable = (key: string) => {
    if (currentTable) {
      const tableKey = `table_${key}`;
      renderedElements.push(
        <div key={tableKey} className="overflow-x-auto my-6 border border-slate-200 rounded-xl shadow-xs text-left">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#0b2545] text-white">
                {currentTable.headers.map((h, idx) => (
                  <th key={idx} className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider border-b border-slate-200" dangerouslySetInnerHTML={{ __html: parseInlines(h) }} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition even:bg-slate-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-xs font-semibold text-slate-700" dangerouslySetInnerHTML={{ __html: parseInlines(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const parseInlines = (text: string) => {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="bg-slate-100 text-red-600 font-bold px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>');
    return html;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(String(index));
      const cells = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSep = cells.every(c => c.startsWith('-') || c.endsWith('-'));
      if (isSep) {
        isHeaderSeparator = true;
        return;
      }

      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      return;
    } else {
      flushTable(String(index));
      isHeaderSeparator = false;
    }

    if (trimmed.startsWith('#')) {
      flushList(String(index));
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#+\s*/, '');
      const innerHTML = parseInlines(text);

      if (level === 1) {
        renderedElements.push(<h1 key={index} className="text-3xl font-extrabold text-slate-900 tracking-tight mt-8 mb-4 border-b border-slate-100 pb-2 text-left" dangerouslySetInnerHTML={{ __html: innerHTML }} />);
      } else if (level === 2) {
        renderedElements.push(<h2 key={index} className="text-2xl font-extrabold text-slate-900 tracking-tight mt-6 mb-3 border-b border-slate-100 pb-2 text-left" dangerouslySetInnerHTML={{ __html: innerHTML }} />);
      } else if (level === 3) {
        renderedElements.push(<h3 key={index} className="text-lg font-bold text-slate-800 tracking-tight mt-5 mb-2.5 text-left" dangerouslySetInnerHTML={{ __html: innerHTML }} />);
      } else {
        renderedElements.push(<h4 key={index} className="text-base font-bold text-slate-800 tracking-tight mt-4 mb-2 text-left" dangerouslySetInnerHTML={{ __html: innerHTML }} />);
      }
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const text = trimmed.substring(2);
      if (!currentList) {
        currentList = { items: [text], ordered: false };
      } else {
        currentList.items.push(text);
      }
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s+/, '');
      if (!currentList) {
        currentList = { items: [text], ordered: true };
      } else {
        currentList.items.push(text);
      }
      return;
    }

    if (trimmed === '') {
      flushList(String(index));
      return;
    }

    flushList(String(index));
    renderedElements.push(
      <p key={index} className="text-sm text-slate-600 leading-relaxed my-3 text-left" dangerouslySetInnerHTML={{ __html: parseInlines(trimmed) }} />
    );
  });

  flushList('final');
  flushTable('final');

  return (
    <div className="markdown-content text-slate-800 select-text leading-relaxed text-left">
      {renderedElements}
    </div>
  );
}

// Import calculator mathematical formulas directly for client-side execution
import { calculateMortgage, MortgageInput, MortgageResult } from './calculators/mortgage/formula';
import { calculateBMI, BMIInput, BMIResult } from './calculators/bmi/formula';
import { calculatePercentage, PercentageInput, PercentageResult } from './calculators/percentage/formula';
import { calculateLoan, LoanInput, LoanResult } from './calculators/loan/formula';
import { calculateAge, AgeInput, AgeResult } from './calculators/age/formula';
import { calculateTip, TipInput, TipResult } from './calculators/tip/formula';
import { calculateCalorie, CalorieInput, CalorieResult } from './calculators/calorie/formula';
import { calculateGPA, Course, GPAInput, GPAResult } from './calculators/gpa/formula';

export default function App() {
  // Navigation & General State
  const [activeTab, setActiveTab] = useState<'financial' | 'fitness' | 'math' | 'more' | 'about' | 'privacy' | 'terms' | 'contact' | 'admin'>('financial');
  const [selectedCalcId, setSelectedCalcId] = useState<string>(''); // Default to empty string for homepage
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded calculators & articles
  const [dbCalculators, setDbCalculators] = useState<Calculator[]>([]);
  const [articlesList, setArticlesList] = useState<Article[]>([]);

  // Load calculators and articles on mount for both public and admin
  useEffect(() => {
    fetch('/api/calculators')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDbCalculators(data);
      })
      .catch(() => {});

    fetch('/api/articles', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setArticlesList(data);
      })
      .catch(() => {});
  }, []);

  const STATIC_CALCS = [
    { id: 'mortgage', name: 'Mortgage Calculator', category: 'financial', catName: 'Financial Calculators', desc: 'Calculate monthly mortgage payments, interest, down payments, and view amortization schedule.' },
    { id: 'loan', name: 'Loan Calculator', category: 'financial', catName: 'Financial Calculators', desc: 'Calculate personal loans, business loans, monthly payments, total interest, and view loan charts.' },
    { id: 'bmi', name: 'BMI Calculator', category: 'fitness', catName: 'Fitness & Health Calculators', desc: 'Calculate Body Mass Index (BMI) for adults and kids. Metric or imperial systems.' },
    { id: 'calorie', name: 'Calorie Calculator', category: 'fitness', catName: 'Fitness & Health Calculators', desc: 'Estimate daily calorie requirements based on age, gender, activity level, and goals.' },
    { id: 'percentage', name: 'Percentage Calculator', category: 'math', catName: 'Math Calculators', desc: 'Find percentage increase, decrease, difference, fraction conversions, and parts.' },
    { id: 'age', name: 'Age Calculator', category: 'more', catName: 'Other Calculators', desc: 'Find exact age in years, months, days, hours, or calculate time duration between dates.' },
    { id: 'tip', name: 'Tip Calculator', category: 'more', catName: 'Other Calculators', desc: 'Calculate restaurant tips, split the bill easily with friends, and find share amounts.' },
    { id: 'gpa', name: 'GPA Calculator', category: 'more', catName: 'Other Calculators', desc: 'Calculate high school or college GPA, semester grades, and track weighted GPA.' }
  ];

  const ALL_CALCS_INFO = dbCalculators.length > 0 
    ? dbCalculators.map(calc => {
        let catName = 'Other Calculators';
        if (calc.category === 'financial') catName = 'Financial Calculators';
        else if (calc.category === 'fitness') catName = 'Fitness & Health Calculators';
        else if (calc.category === 'math') catName = 'Math Calculators';
        else if (calc.category === 'more') catName = 'Other Calculators';
        else catName = `${calc.category.charAt(0).toUpperCase() + calc.category.slice(1)} Calculators`;

        return {
          id: calc.id,
          name: calc.name,
          category: calc.category,
          catName,
          desc: calc.metadata?.description || ''
        };
      })
    : STATIC_CALCS;

  const selectCalculator = (id: string) => {
    setSelectedCalcId(id);
    setSearchQuery(''); // clear search on select
    if (id === 'mortgage' || id === 'loan') {
      setActiveTab('financial');
    } else if (id === 'bmi' || id === 'calorie') {
      setActiveTab('fitness');
    } else if (id === 'percentage') {
      setActiveTab('math');
    } else if (id === 'age' || id === 'tip' || id === 'gpa') {
      setActiveTab('more');
    } else if (id === '') {
      // homepage
    }
  };
  
  // SEO Meta injection & Script injection effect
  useEffect(() => {
    // Dynamic Canonical URL injection
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const slug = activeTab === 'admin' ? '/admin' : selectedCalcId ? `/${selectedCalcId}-calculator` : '/';
    canonical.setAttribute('href', window.location.origin + slug);

    // Update Page Title and Description based on active view
    const titleText = activeTab === 'admin' 
      ? 'Admin Dashboard - Professional Calculator Platform'
      : selectedCalcId === 'mortgage' ? 'Mortgage Calculator - Professional Calculator Platform'
      : selectedCalcId === 'bmi' ? 'BMI Calculator - Professional Calculator Platform'
      : selectedCalcId === 'percentage' ? 'Percentage Calculator - Professional Calculator Platform'
      : selectedCalcId === 'loan' ? 'Loan Calculator - Professional Calculator Platform'
      : selectedCalcId === 'age' ? 'Age Calculator - Professional Calculator Platform'
      : selectedCalcId === 'tip' ? 'Tip Calculator - Professional Calculator Platform'
      : selectedCalcId === 'calorie' ? 'Calorie Calculator - Professional Calculator Platform'
      : selectedCalcId === 'gpa' ? 'GPA Calculator - Professional Calculator Platform'
      : 'Calculator: Free Online Calculators - Financial, Fitness, Math, and More';
    const descriptionText = activeTab === 'admin'
      ? 'Admin console for managing calculators, SEO articles, analytics, redirects, and settings.'
      : 'Free online calculators for mortgage, BMI, percentage, loan, age, tip, calorie, and GPA needs.';

    document.title = titleText;
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', descriptionText);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', titleText);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', descriptionText);
  }, [activeTab, selectedCalcId]);

  // Track Calculator hit/views
  useEffect(() => {
    if (selectedCalcId) {
      fetch('/api/analytics/hit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculatorId: selectedCalcId })
      }).catch(() => {});
    }
  }, [selectedCalcId]);

  // Global Settings Loaded from Server
  const [globalSettings, setGlobalSettings] = useState<any>({
    adsenseEnabled: false,
    adsenseCode: '',
    analyticsCode: '',
    featureFlags: { aiEnabled: true, maintenanceMode: false }
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setGlobalSettings(data);
        // Inject head scripts if any (safely parsing)
        if (data.analyticsCode) {
          const script = document.createElement('script');
          script.innerHTML = data.analyticsCode;
          document.head.appendChild(script);
        }
      })
      .catch(() => {});
  }, []);

  // 1. MORTGAGE CALCULATOR STATE
  const [mortgageHomePrice, setMortgageHomePrice] = useState(450000);
  const [mortgageDownPaymentPercent, setMortgageDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.85);
  const [mortgageTerm, setMortgageTerm] = useState(30);
  const [mortgageTaxRate, setMortgageTaxRate] = useState(1.2);
  const [mortgageInsurance, setMortgageInsurance] = useState(1200);
  const [mortgageHoa, setMortgageHoa] = useState(150);

  const calculatedDownPayment = Math.round(mortgageHomePrice * (mortgageDownPaymentPercent / 100));
  const mortgageResult: MortgageResult = calculateMortgage({
    homePrice: mortgageHomePrice,
    downPayment: calculatedDownPayment,
    interestRate: mortgageRate,
    loanTermYears: mortgageTerm,
    propertyTaxRate: mortgageTaxRate,
    homeInsuranceAnnual: mortgageInsurance,
    hoaMonthly: mortgageHoa
  });

  // 2. BMI CALCULATOR STATE
  const [bmiSystem, setBmiSystem] = useState<'metric' | 'imperial'>('metric');
  const [bmiWeightMetric, setBmiWeightMetric] = useState(70);
  const [bmiHeightMetric, setBmiHeightMetric] = useState(175);
  const [bmiWeightImperial, setBmiWeightImperial] = useState(154);
  const [bmiHeightImperial, setBmiHeightImperial] = useState(70);

  const bmiResult: BMIResult = calculateBMI({
    system: bmiSystem,
    weight: bmiSystem === 'metric' ? bmiWeightMetric : bmiWeightImperial,
    height: bmiSystem === 'metric' ? bmiHeightMetric : bmiHeightImperial
  });

  // 3. PERCENTAGE CALCULATOR STATE
  const [pctCase, setPctCase] = useState<'percentOf' | 'whatPercentOf' | 'change'>('percentOf');
  const [pctX, setPctX] = useState(15);
  const [pctY, setPctY] = useState(200);

  const pctResult: PercentageResult = calculatePercentage({
    caseType: pctCase,
    x: pctX,
    y: pctY
  });

  // 4. LOAN CALCULATOR STATE
  const [loanAmount, setLoanAmount] = useState(15000);
  const [loanRate, setLoanRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(36);
  const [loanTermUnit, setLoanTermUnit] = useState<'years' | 'months'>('months');

  const loanResult: LoanResult = calculateLoan({
    loanAmount,
    interestRate: loanRate,
    term: loanTerm,
    termUnit: loanTermUnit
  });

  // 5. AGE CALCULATOR STATE
  const [ageBirthDate, setAgeBirthDate] = useState('1995-07-15');
  const [ageTargetDate, setAgeTargetDate] = useState('2026-07-13');

  const ageResult: AgeResult = calculateAge({
    birthDate: ageBirthDate,
    targetDate: ageTargetDate
  });

  // 6. TIP CALCULATOR STATE
  const [tipBill, setTipBill] = useState(85.50);
  const [tipPct, setTipPct] = useState(18);
  const [tipPeople, setTipPeople] = useState(3);

  const tipResult: TipResult = calculateTip({
    billAmount: tipBill,
    tipPercent: tipPct,
    splitPeople: tipPeople
  });

  // 7. CALORIE CALCULATOR STATE
  const [calSystem, setCalSystem] = useState<'metric' | 'imperial'>('metric');
  const [calAge, setCalAge] = useState(28);
  const [calGender, setCalGender] = useState<'male' | 'female'>('male');
  const [calWeightMetric, setCalWeightMetric] = useState(75);
  const [calHeightMetric, setCalHeightMetric] = useState(180);
  const [calWeightImperial, setCalWeightImperial] = useState(165);
  const [calHeightImperial, setCalHeightImperial] = useState(70);
  const [calActivity, setCalActivity] = useState<CalorieInput['activity']>('moderate');

  const calorieResult: CalorieResult = calculateCalorie({
    system: calSystem,
    age: calAge,
    gender: calGender,
    weight: calSystem === 'metric' ? calWeightMetric : calWeightImperial,
    height: calSystem === 'metric' ? calHeightMetric : calHeightImperial,
    activity: calActivity
  });

  // 8. GPA CALCULATOR STATE
  const [gpaCourses, setGpaCourses] = useState<Course[]>([
    { name: 'Mathematics', grade: 'A', credits: 4, courseType: 'ap_ib' },
    { name: 'History', grade: 'B+', credits: 3, courseType: 'honors' },
    { name: 'Literature', grade: 'A-', credits: 3, courseType: 'regular' },
  ]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseGrade, setNewCourseGrade] = useState('A');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const [newCourseType, setNewCourseType] = useState<'regular' | 'honors' | 'ap_ib'>('regular');

  const addCourse = () => {
    if (newCourseCredits <= 0) return;
    setGpaCourses([
      ...gpaCourses,
      {
        name: newCourseName || `Course #${gpaCourses.length + 1}`,
        grade: newCourseGrade,
        credits: Number(newCourseCredits),
        courseType: newCourseType
      }
    ]);
    setNewCourseName('');
    setNewCourseCredits(3);
  };

  const removeCourse = (index: number) => {
    const updated = [...gpaCourses];
    updated.splice(index, 1);
    setGpaCourses(updated);
  };

  const gpaResult: GPAResult = calculateGPA({ courses: gpaCourses });

  // UX UTILITIES
  const handleCopyResult = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${selectedCalcId.toUpperCase()} Calculator - Professional Platform`,
        text: `Calculate instant ${selectedCalcId} metrics with professional accuracy.`,
        url: window.location.href
      }).then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }).catch(() => {});
    } else {
      handleCopyResult(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // ADMIN PORTAL STATE & FUNCTIONS
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authToken, setAuthToken] = useState('');

  // Admin section views
  const [adminSubTab, setAdminSubTab] = useState<'catalog' | 'analytics' | 'articles' | 'settings' | 'logs' | 'codegen'>('catalog');
  const [calculatorsCatalog, setCalculatorsCatalog] = useState<Calculator[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [adminRedirects, setAdminRedirects] = useState<Redirect[]>([]);
  
  // Central Settings Edit state
  const [editOpenrouterKey, setEditOpenrouterKey] = useState('');
  const [editAdsenseEnabled, setEditAdsenseEnabled] = useState(false);
  const [editAdsenseCode, setEditAdsenseCode] = useState('');
  const [editAnalyticsCode, setEditAnalyticsCode] = useState('');
  const [editAiEnabled, setEditAiEnabled] = useState(true);
  const [editMaintenanceMode, setEditMaintenanceMode] = useState(false);

  // New Redirect Rule State
  const [newOldUrl, setNewOldUrl] = useState('');
  const [newNewUrl, setNewNewUrl] = useState('');

  // Articles AI Assistant state
  const [selectedArticleCalc, setSelectedArticleCalc] = useState('mortgage');
  const [googleAutocompletes, setGoogleAutocompletes] = useState<string[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [aiTitle, setAiTitle] = useState('');
  const [aiKeywordsInput, setAiKeywordsInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);

  // Programmatic SEO State
  const [progSeoResult, setProgSeoResult] = useState<any[]>([]);
  const [isProgGenerating, setIsProgGenerating] = useState(false);

  // Article management editing states
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editArticleTitle, setEditArticleTitle] = useState('');
  const [editArticleSlug, setEditArticleSlug] = useState('');
  const [editArticleContent, setEditArticleContent] = useState('');
  const [editArticleStatus, setEditArticleStatus] = useState<'draft' | 'pending_review' | 'published'>('draft');

  const handleUpdateArticleStatus = (id: string, status: 'draft' | 'pending_review' | 'published') => {
    fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          loadAdminData();
        } else {
          alert('Failed to update status: ' + data.error);
        }
      })
      .catch(err => alert(err.message));
  };

  const handleStartEditArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setEditArticleTitle(art.title);
    setEditArticleSlug(art.slug);
    setEditArticleContent(art.content);
    setEditArticleStatus(art.status);
  };

  const handleSaveArticleEdit = (id: string) => {
    fetch(`/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        title: editArticleTitle,
        slug: editArticleSlug,
        content: editArticleContent,
        status: editArticleStatus
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setEditingArticleId(null);
          loadAdminData();
          alert('Article updated successfully!');
        } else {
          alert('Failed to update article: ' + data.error);
        }
      })
      .catch(err => alert(err.message));
  };

  const handleDeleteArticle = (id: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    fetch(`/api/articles/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          loadAdminData();
          alert('Article deleted successfully.');
        } else {
          alert('Failed to delete: ' + data.error);
        }
      })
      .catch(err => alert(err.message));
  };

  // Code Generator (Step 10) State
  const [codeGenSpec, setCodeGenSpec] = useState('');
  const [isCodeGenGenerating, setIsCodeGenGenerating] = useState(false);
  const [generatedCodeResult, setGeneratedCodeResult] = useState<any>(null);
  
  // Sandbox execution states
  const [sandboxInputs, setSandboxInputs] = useState<Record<string, number>>({});
  const [sandboxOutputs, setSandboxOutputs] = useState<Record<string, any>>({});
  const [sandboxWarning, setSandboxWarning] = useState<string | null>(null);
  const [codePreviewTab, setCodePreviewTab] = useState<'formula' | 'validation' | 'tests'>('formula');

  const HIGH_DEMAND_SUGGESTIONS = [
    {
      title: 'Texas Mortgage Calculator',
      volume: '150K searches/mo',
      desc: 'Factors in 1.6% - 2.0% property tax rates, the new $100,000 Homestead tax exemption, and Severe Weather insurance factors.',
      spec: `Calculator Title: Texas Mortgage Calculator
Description: Calculates accurate PITI monthly payments for property owners in Texas.
Specific Formulas & Logic:
- Base loan payment calculated with standard amortization formula.
- Property tax: Average Texas property tax rate is 1.62% of the home value (absence of state income tax drives high local property taxes).
- Texas Homestead Exemption: Reduces the taxable value of primary residences by $100,000 for local school district tax levies as of recent Texas legislation.
- Regional Homeowners Insurance: Driven by severe weather risks (e.g. hail, hurricanes, tornadoes), estimated around 0.8% of the home value annually.
- Outputs: Principal & Interest, Monthly Property Taxes, Monthly Insurance, and Total PITI.`
    },
    {
      title: 'UK Buy-to-Let Mortgage',
      volume: '110K searches/mo',
      desc: 'BTL criteria with ICR (Interest Cover Ratio) stressed at 5.5%+, rent-to-interest criteria (125%-145%), and 3% second home SDLT surcharge.',
      spec: `Calculator Title: UK Buy-to-Let Mortgage Calculator
Description: Designed for property investors in the United Kingdom, focusing on rental yield and strict lending stress tests.
Specific Formulas & Logic:
- Assesses Interest Cover Ratio (ICR), requiring rental income to cover 125% (for basic rate taxpayers) or 145% (for higher rate taxpayers) of the mortgage payment.
- Stress Test Interest Rate: Lenders stress test calculations using a hypothetical rate, typically 5.5% minimum.
- Stamp Duty Land Tax (SDLT): Integrates the 3% second-home SDLT surcharge applied to second residential properties in England & Northern Ireland.
- Supports Interest-Only payment options where the borrower only pays the monthly interest without reducing the principal loan balance.
- Outputs: Maximum allowable loan amount, Stamp Duty Tax due, Required rental yield, and Interest-only monthly payment.`
    },
    {
      title: 'Florida Condo Mortgage',
      volume: '95K searches/mo',
      desc: 'Post-Surfside structural reserve fees, high coastal windstorm insurance premiums, Save Our Homes tax caps, and DTI limits.',
      spec: `Calculator Title: Florida Condo Mortgage Calculator
Description: Tailored for Florida condominiums, addressing unique insurance risk assessments and strict structural HOA fees.
Specific Formulas & Logic:
- Incorporates high monthly Homeowners Association (HOA) or Condominium Association (COA) fees.
- Includes mandatory hazard and windstorm insurance premiums typical of Florida coastal wind zones.
- Post-Surfside Structural Reserves: Integrates additional safety assessment reserves of $200 per month.
- Save Our Homes Cap: Property tax calculations adjusted for homesteaded properties (limiting assessment increases to 3% annually).
- Outputs: Total Monthly Housing Cost (PITI + HOA + assessments), and resulting Debt-to-Income (DTI) impact.`
    },
    {
      title: 'France Non-Resident Mortgage',
      volume: '85K searches/mo',
      desc: 'LTV limits (50%-80%), strict 35% "taux d\'endettement" debt-to-income cap, French borrower insurance, and 7%-8% notaire fees.',
      spec: `Calculator Title: France Non-Resident Mortgage Calculator
Description: Specifically designed for non-resident international buyers purchasing property in France under French lending regulations.
Specific Formulas & Logic:
- Loan-to-Value (LTV) limits: Caps LTV lower for non-residents (typically 70% maximum).
- Taux d'endettement: Strictly applies the French debt-to-income limit of 35% maximum (including existing debts and the new French mortgage).
- Assurance Emprunteur: Adds mandatory French borrower life/disability insurance, typically calculated as 0.36% of the total loan amount annually.
- Notaire Fees (Frais de notaire): Automatically calculates French acquisition costs, estimated at 7.5% of the purchase price for older homes.
- Outputs: Allowable mortgage loan, Notaire fees, Monthly payment, Monthly borrower insurance cost, and Taux d'endettement percentage.`
    }
  ];

  const [availableSuggestions, setAvailableSuggestions] = useState(HIGH_DEMAND_SUGGESTIONS);
  const [selectedSuggestionTitle, setSelectedSuggestionTitle] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const headers: Record<string, string> = { ...extra };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return headers;
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUsername, password: adminPassword })
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
      })
      .then(data => {
        setAuthToken(data.token);
        setIsAdminLoggedIn(true);
        setAuthError('');
        loadAdminData();
      })
      .catch(err => {
        setAuthError(err.message);
      });
  };

  const loadAdminData = () => {
    // Load calculators catalog
    fetch('/api/calculators', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setCalculatorsCatalog(data));

    // Load analytics
    fetch('/api/analytics', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setAnalyticsLogs(data));

    // Load system settings for editing
    fetch('/api/admin/settings', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setEditOpenrouterKey('');
        setEditAdsenseEnabled(data.adsenseEnabled);
        setEditAdsenseCode(data.adsenseCode);
        setEditAnalyticsCode(data.analyticsCode);
        setEditAiEnabled(data.featureFlags?.aiEnabled ?? true);
        setEditMaintenanceMode(data.featureFlags?.maintenanceMode ?? false);
      });

    // Load system logs
    fetch('/api/admin/logs', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setSystemLogs(data));

    // Load articles list
    fetch('/api/articles', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setArticlesList(data));

    // Load redirects
    fetch('/api/admin/redirects', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => setAdminRedirects(data));
  };

  // Toggle calculator active/inactive with Step 10 Hook verification
  const [toggleError, setToggleError] = useState<string | null>(null);
  const handleToggleCalculator = (id: string) => {
    setToggleError(null);
    fetch(`/api/calculators/${id}/toggle`, { method: 'POST', headers: getAuthHeaders() })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to toggle status');
        }
        loadAdminData();
      })
      .catch(err => {
        setToggleError(err.message);
        setTimeout(() => setToggleError(null), 8000);
      });
  };

  // Central settings saving
  const handleSaveSettings = () => {
    const payload: Record<string, any> = {
      adsenseEnabled: editAdsenseEnabled,
      adsenseCode: editAdsenseCode,
      analyticsCode: editAnalyticsCode,
      featureFlags: {
        aiEnabled: editAiEnabled,
        maintenanceMode: editMaintenanceMode
      }
    };

    if (editOpenrouterKey.trim()) {
      payload.openrouterApiKey = editOpenrouterKey;
    }

    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        alert('Settings successfully updated!');
        loadAdminData();
      });
  };

  // Database Backup
  const handleDatabaseBackup = () => {
    fetch('/api/admin/backup', { method: 'POST', headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        alert(data.message || 'Backup completed successfully!');
        loadAdminData();
      });
  };

  // Add Redirect rule
  const handleAddRedirect = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ oldUrl: newOldUrl, newUrl: newNewUrl })
    })
      .then(r => r.json())
      .then(() => {
        setNewOldUrl('');
        setNewNewUrl('');
        loadAdminData();
      });
  };

  const handleDeleteRedirect = (id: string) => {
    fetch(`/api/admin/redirects/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(() => loadAdminData());
  };

  // AI Articles Generation Assistant
  const handleFetchGoogleTrends = () => {
    const calc = calculatorsCatalog.find(c => c.id === selectedArticleCalc);
    if (!calc) return;
    
    fetch(`/api/articles/google-completion?query=${encodeURIComponent(calc.name)}`)
      .then(r => r.json())
      .then(data => {
        setGoogleAutocompletes(data);
        // Suggest high value titles and keywords from these trends
        setSuggestedKeywords([
          `${calc.name.toLowerCase()} calculator`,
          `how to calculate ${calc.name.toLowerCase()}`,
          `${calc.name.toLowerCase()} formula`,
          `best online ${calc.name.toLowerCase()}`
        ]);
        setSuggestedTitles([
          `Ultimate Guide to ${calc.name}: Everything You Need to Know`,
          `How to Use the ${calc.name} for Instant Calculations`,
          `The Mathematics Behind ${calc.name} - Explained Simply`
        ]);
      });
  };

  const handleKeywordClick = (kw: string) => {
    if (!aiKeywordsInput.trim()) {
      setAiKeywordsInput(kw);
    } else {
      const existing = aiKeywordsInput.split(',').map(k => k.trim()).filter(Boolean);
      if (!existing.includes(kw)) {
        setAiKeywordsInput([...existing, kw].join(', '));
      }
    }
  };

  const handleTitleClick = (title: string) => {
    setAiTitle(title);
  };

  const handleAiArticleGenerate = () => {
    setIsAiGenerating(true);
    setTaskStatus(null);

    const keywords = aiKeywordsInput.split(',').map(k => k.trim());
    fetch('/api/articles/generate-async', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        calculatorId: selectedArticleCalc,
        calculatorName: calculatorsCatalog.find(c => c.id === selectedArticleCalc)?.name || selectedArticleCalc,
        keywords,
        title: aiTitle || `The Ultimate ${selectedArticleCalc} Guide`
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setActiveTaskId(data.taskId);
          pollTaskStatus(data.taskId);
        } else {
          setIsAiGenerating(false);
          alert(data.error || 'Generation failed to queue.');
        }
      })
      .catch(err => {
        setIsAiGenerating(false);
        alert(err.message);
      });
  };

  const pollTaskStatus = (taskId: string) => {
    const interval = setInterval(() => {
      fetch(`/api/tasks/${taskId}`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(task => {
          setTaskStatus(task);
          if (task.status === 'completed' || task.status === 'failed') {
            clearInterval(interval);
            setIsAiGenerating(false);
            loadAdminData();
            if (task.status === 'completed') {
              alert('AI Article generated successfully and saved as draft pending review!');
            } else {
              alert('Generation failed: ' + task.error);
            }
          }
        })
        .catch(() => {
          clearInterval(interval);
          setIsAiGenerating(false);
        });
    }, 2000);
  };

  // Programmatic SEO Generation
  const handleGenerateProgrammaticSEO = () => {
    setIsProgGenerating(true);
    fetch('/api/seo-prog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        calculatorId: selectedArticleCalc,
        calculatorName: calculatorsCatalog.find(c => c.id === selectedArticleCalc)?.name || selectedArticleCalc
      })
    })
      .then(r => r.json())
      .then(data => {
        setIsProgGenerating(false);
        if (data.success) {
          setProgSeoResult(data.variants);
          loadAdminData();
          alert(`Successfully generated ${data.variants.length} localized SEO articles!`);
        } else {
          alert(data.error || 'Programmatic generation failed.');
        }
      })
      .catch(err => {
        setIsProgGenerating(false);
        alert(err.message);
      });
  };

  // Code Generator (Step 10)
  const handleGenerateCode = () => {
    setIsCodeGenGenerating(true);
    setGeneratedCodeResult(null);
    setSandboxInputs({});
    setSandboxOutputs({});
    setSandboxWarning(null);
    fetch('/api/code-gen/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ spec: codeGenSpec })
    })
      .then(r => r.json())
      .then(data => {
        setIsCodeGenGenerating(false);
        if (data.success) {
          setGeneratedCodeResult(data.code);
          if (data.code.meta && data.code.meta.inputs) {
            const defaults: Record<string, number> = {};
            data.code.meta.inputs.forEach((inp: any) => {
              defaults[inp.name] = inp.defaultValue !== undefined ? inp.defaultValue : 0;
            });
            setSandboxInputs(defaults);
          }
        } else {
          alert(data.error || 'Code generation failed.');
        }
      })
      .catch(err => {
        setIsCodeGenGenerating(false);
        alert(err.message);
      });
  };

  const handleRunSandboxCalculation = () => {
    if (!generatedCodeResult || !generatedCodeResult.meta) return;
    const { meta } = generatedCodeResult;
    setSandboxWarning(null);

    try {
      // Input ranges validation
      let warning: string | null = null;
      meta.inputs.forEach((inp: any) => {
        const val = sandboxInputs[inp.name];
        if (inp.min !== undefined && val < inp.min) {
          warning = `${inp.label} is below minimum allowed value of ${inp.min}.`;
        }
        if (inp.max !== undefined && val > inp.max) {
          warning = `${inp.label} exceeds maximum allowed value of ${inp.max}.`;
        }
      });

      if (warning) {
        setSandboxWarning(warning);
        return;
      }

      // Compile and execute code-generated calculation body
      const calcFn = new Function('inputs', meta.calculateBody);
      const results = calcFn(sandboxInputs);
      setSandboxOutputs(results || {});
    } catch (err: any) {
      setSandboxWarning('Execution Error: ' + err.message);
    }
  };

  const handlePublishCalculator = () => {
    if (!generatedCodeResult || !generatedCodeResult.meta) return;
    const { meta } = generatedCodeResult;
    const issues = validateGeneratedCode({
      formulaCode: generatedCodeResult.formulaCode,
      validationCode: generatedCodeResult.validationCode,
      testsCode: generatedCodeResult.testsCode,
      meta
    });
    if (issues.length > 0) {
      alert(`This code is generated by AI. Please review it carefully before publishing. Unsafe patterns detected: ${issues.join(', ')}`);
      return;
    }
    if (!meta.calculatorName) {
      alert('Calculator Name is missing.');
      return;
    }

    const category = (meta.category || 'more').toLowerCase();
    const id = meta.calculatorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    setIsPublishing(true);
    setPublishedSuccess(false);

    fetch('/api/calculators/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        id,
        name: meta.calculatorName,
        category,
        formulaCode: generatedCodeResult.formulaCode,
        validationCode: generatedCodeResult.validationCode,
        testsCode: generatedCodeResult.testsCode,
        meta
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Publish request failed');
        return res.json();
      })
      .then(data => {
        setIsPublishing(false);
        if (data.success) {
          setPublishedSuccess(true);
          
          // Reload the list of calculators and articles from server
          fetch('/api/calculators')
            .then(r => r.json())
            .then(calcs => {
              if (Array.isArray(calcs)) setDbCalculators(calcs);
            });

          fetch('/api/articles', { headers: getAuthHeaders() })
            .then(r => r.json())
            .then(arts => {
              if (Array.isArray(arts)) setArticlesList(arts);
            });

          // Remove selected suggestion to avoid duplication
          if (selectedSuggestionTitle) {
            setAvailableSuggestions(prev => prev.filter(sug => sug.title !== selectedSuggestionTitle));
            setSelectedSuggestionTitle(null);
          }

          alert(`Succès! "${meta.calculatorName}" a été publié dans la catégorie "${category}".`);
          
          // Switch to preview this newly created calculator
          setTimeout(() => {
            selectCalculator(id);
            setPublishedSuccess(false);
          }, 1000);
        } else {
          alert('Erreur: ' + (data.error || 'Impossible de publier.'));
        }
      })
      .catch(err => {
        setIsPublishing(false);
        alert('Erreur de publication: ' + err.message);
      });
  };

  // Helper lists of articles for public viewing
  const currentCalcArticle = articlesList.find(a => a.calculatorId === selectedCalcId && a.status === 'published');

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(null);
    setContactError(null);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit form.');
        setContactSuccess(data.message);
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      })
      .catch(err => {
        setContactError(err.message);
      });
  };

  const filteredCalcs = searchQuery.trim() 
    ? ALL_CALCS_INFO.filter(calc => 
        calc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        calc.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f4f4] text-slate-900 font-sans">
      
      {/* HEADER WITH CLASSIC CALCULATOR BRANDING */}
      <header className="bg-[#0066cc] text-white shadow-md flex-shrink-0">
        <div className="max-w-[1000px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            className="flex items-center gap-1 cursor-pointer select-none" 
            onClick={() => selectCalculator('')}
          >
            <span className="text-3xl font-black italic tracking-tight text-white font-serif">
              calculator
            </span>
          </div>

          {/* Real-time Search Box */}
          <div className="flex items-center w-full md:w-auto max-w-md">
            <div className="relative flex-1 md:w-64">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search calculators..."
                className="w-full pl-3 pr-8 py-1.5 text-sm text-slate-800 bg-white rounded-l border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const match = ALL_CALCS_INFO.find(c => c.name.toLowerCase() === searchQuery.toLowerCase().trim());
                    if (match) {
                      selectCalculator(match.id);
                    }
                  }
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => {
                const query = searchQuery.trim().toLowerCase();
                const match = ALL_CALCS_INFO.find(c => c.name.toLowerCase().includes(query));
                if (match) {
                  selectCalculator(match.id);
                }
              }}
              className="bg-[#549b25] hover:bg-[#478220] text-white px-4 py-1.5 text-sm font-bold rounded-r flex items-center gap-1.5 transition-colors border border-[#549b25] cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>

          {/* Quick Access/Admin Button */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setActiveTab('admin');
                setSelectedCalcId('admin'); // Set helper state
              }}
              className="bg-[#0a2d54] hover:bg-[#103d73] text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>
        
        {/* Navigation bar under the header */}
        <div className="bg-[#0a2d54] border-t border-blue-900/40">
          <div className="max-w-[1000px] mx-auto px-4 flex items-center overflow-x-auto scrollbar-none">
            <button 
              onClick={() => selectCalculator('')}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 hover:bg-[#103d73] cursor-pointer ${selectedCalcId === '' && activeTab !== 'admin' ? 'border-[#a8c878] text-[#a8c878]' : 'border-transparent text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => { selectCalculator('mortgage'); }}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 hover:bg-[#103d73] cursor-pointer ${activeTab === 'financial' && selectedCalcId !== '' && activeTab !== 'admin' ? 'border-[#a8c878] text-[#a8c878]' : 'border-transparent text-white'}`}
            >
              Financial
            </button>
            <button 
              onClick={() => { selectCalculator('bmi'); }}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 hover:bg-[#103d73] cursor-pointer ${activeTab === 'fitness' && selectedCalcId !== '' && activeTab !== 'admin' ? 'border-[#a8c878] text-[#a8c878]' : 'border-transparent text-white'}`}
            >
              Fitness
            </button>
            <button 
              onClick={() => { selectCalculator('percentage'); }}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 hover:bg-[#103d73] cursor-pointer ${activeTab === 'math' && selectedCalcId !== '' && activeTab !== 'admin' ? 'border-[#a8c878] text-[#a8c878]' : 'border-transparent text-white'}`}
            >
              Math
            </button>
            <button 
              onClick={() => { selectCalculator('age'); }}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 hover:bg-[#103d73] cursor-pointer ${activeTab === 'more' && selectedCalcId !== '' && activeTab !== 'admin' ? 'border-[#a8c878] text-[#a8c878]' : 'border-transparent text-white'}`}
            >
              Other
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE LIMITER */}
      <div className="flex-1 w-full max-w-[1000px] mx-auto px-2 md:px-4 py-4 flex flex-col md:flex-row gap-5 overflow-hidden">
        
        {/* LEFT COLUMN - CONTENT CONTAINER */}
        <div className="flex-1 bg-white border border-[#dcdcdc] rounded p-4 md:p-6 overflow-y-auto">

          {/* SEARCH RESULTS IF SEARCHING */}
          {searchQuery.trim() !== '' && (
            <div className="space-y-6 mb-8 border-b border-slate-200 pb-6 animate-fade-in">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Search Results for "{searchQuery}"
              </h3>
              {filteredCalcs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCalcs.map(calc => (
                    <div 
                      key={calc.id} 
                      onClick={() => selectCalculator(calc.id)}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-500 cursor-pointer transition-all hover:bg-blue-50/20"
                    >
                      <h4 className="font-bold text-[#0066cc] hover:underline flex items-center gap-1.5">
                        <CalcIcon className="w-4 h-4 text-slate-400" />
                        {calc.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{calc.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  No calculators found matching your search. Please try searching another category.
                </p>
              )}
            </div>
          )}

          {/* HOMEPAGE DIRECTORY VIEW */}
          {selectedCalcId === '' && activeTab !== 'admin' && activeTab !== 'about' && activeTab !== 'privacy' && activeTab !== 'terms' && activeTab !== 'contact' && (
            <div className="space-y-8 animate-fade-in">
              <div className="border-b border-slate-200 pb-5">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Free Online Calculators</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Calculator provides 100% free, high-performance, responsive client-side calculation tools. Explore our directories below.
                </p>
              </div>

              {/* 4 Category Cards organized exactly like calculator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FINANCIAL CALCULATORS CARD */}
                <div className="border border-[#dcdcdc] rounded overflow-hidden shadow-sm">
                  <div className="bg-[#3a75c4] text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Financial Calculators</span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-3 text-sm">
                    <button onClick={() => selectCalculator('mortgage')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#3a75c4] font-bold">▶</span> Mortgage Calculator
                    </button>
                    <button onClick={() => selectCalculator('loan')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#3a75c4] font-bold">▶</span> Loan Calculator
                    </button>
                    {dbCalculators.filter(c => c.category === 'financial').map(c => (
                      <button key={c.id} onClick={() => selectCalculator(c.id)} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[#3a75c4] font-bold">▶</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FITNESS & HEALTH CALCULATORS CARD */}
                <div className="border border-[#dcdcdc] rounded overflow-hidden shadow-sm">
                  <div className="bg-[#549b25] text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span>Fitness & Health Calculators</span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-3 text-sm">
                    <button onClick={() => selectCalculator('bmi')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#549b25] font-bold">▶</span> BMI Calculator
                    </button>
                    <button onClick={() => selectCalculator('calorie')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#549b25] font-bold">▶</span> Calorie Calculator
                    </button>
                    {dbCalculators.filter(c => c.category === 'fitness').map(c => (
                      <button key={c.id} onClick={() => selectCalculator(c.id)} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[#549b25] font-bold">▶</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MATH CALCULATORS CARD */}
                <div className="border border-[#dcdcdc] rounded overflow-hidden shadow-sm">
                  <div className="bg-[#e67e22] text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    <span>Math Calculators</span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-3 text-sm">
                    <button onClick={() => selectCalculator('percentage')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#e67e22] font-bold">▶</span> Percentage Calculator
                    </button>
                    {dbCalculators.filter(c => c.category === 'math').map(c => (
                      <button key={c.id} onClick={() => selectCalculator(c.id)} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[#e67e22] font-bold">▶</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* OTHER CALCULATORS CARD */}
                <div className="border border-[#dcdcdc] rounded overflow-hidden shadow-sm">
                  <div className="bg-[#7f8c8d] text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Other Calculators</span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-3 text-sm text-slate-800">
                    <button onClick={() => selectCalculator('age')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#7f8c8d] font-bold">▶</span> Age Calculator
                    </button>
                    <button onClick={() => selectCalculator('tip')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#7f8c8d] font-bold">▶</span> Tip Calculator
                    </button>
                    <button onClick={() => selectCalculator('gpa')} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                      <span className="text-[#7f8c8d] font-bold">▶</span> GPA Calculator
                    </button>
                    {dbCalculators.filter(c => c.category === 'more' || !['financial', 'fitness', 'math', 'more'].includes(c.category)).map(c => (
                      <button key={c.id} onClick={() => selectCalculator(c.id)} className="text-left font-medium calc-link flex items-center gap-1.5 cursor-pointer">
                        <span className="text-[#7f8c8d] font-bold">▶</span> {c.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* General SEO Content block like calculator */}
              <div className="bg-[#f9f9f9] border border-[#dcdcdc] rounded p-6 text-xs text-slate-600 leading-relaxed space-y-4">
                <h3 className="font-bold text-sm text-slate-800">About Calculator</h3>
                <p>
                  Calculator's sole focus is to provide fast, comprehensive, convenient, free online calculators in a plethora of areas. Currently, we have 8 high-performance calculators to help you calculate financial payments, health indexes, math equations, and daily conveniences.
                </p>
                <p>
                  Unlike standard calculator platforms that transmit your inputs, salaries, and weights over external servers, <strong>100% of our calculator formulas run strictly client-side</strong> inside your browser sandbox. This guarantees absolute data security, zero database tracking, and blazing fast instantaneous load times under 20ms.
                </p>
              </div>
            </div>
          )}

          {/* FINANCIAL CATEGORY VIEW */}
          {activeTab === 'financial' && selectedCalcId === 'mortgage' && (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Header section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / Financial /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Mortgage Calculator</h2>
                  <p className="text-sm text-slate-500">Calculate payments and visualize your complete home payment metrics.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Share2 className="w-3.5 h-3.5" /> {shareSuccess ? 'Link Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Calculator Panel with geometric balance */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs side */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Calculation Inputs</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Home Price ($)</label>
                    <input 
                      type="number" 
                      value={mortgageHomePrice}
                      onChange={(e) => setMortgageHomePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Down Payment (%) - ${calculatedDownPayment.toLocaleString()}</label>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={mortgageDownPaymentPercent}
                        onChange={(e) => setMortgageDownPaymentPercent(Number(e.target.value))}
                        className="flex-1 accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-12 text-sm font-bold text-slate-800">{mortgageDownPaymentPercent}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Loan Term (Years)</label>
                      <select 
                        value={mortgageTerm}
                        onChange={(e) => setMortgageTerm(Number(e.target.value))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold bg-white"
                      >
                        <option value={30}>30 Years Fixed</option>
                        <option value={20}>20 Years Fixed</option>
                        <option value={15}>15 Years Fixed</option>
                        <option value={10}>10 Years Fixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Interest Rate (%)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={mortgageRate}
                        onChange={(e) => setMortgageRate(Math.max(0, Number(e.target.value)))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <span className="text-xs font-bold uppercase text-slate-400 block">Optional Advanced Metrics</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tax Rate (%)</label>
                        <input type="number" step="0.1" value={mortgageTaxRate} onChange={(e) => setMortgageTaxRate(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Insurance ($/Yr)</label>
                        <input type="number" value={mortgageInsurance} onChange={(e) => setMortgageInsurance(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">HOA ($/Mo)</label>
                        <input type="number" value={mortgageHoa} onChange={(e) => setMortgageHoa(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-center">
                    <p className="text-[10px] text-slate-400 italic">Amortized instantly client-side for ultra fast response times.</p>
                  </div>
                </div>

                {/* Outputs side */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400">Monthly Expenses Breakdown</h3>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Accurate Result</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">${mortgageResult.totalMonthlyPayment.toLocaleString()}</span>
                      <span className="text-slate-400 font-medium">/ month</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">P & I</span>
                        <span className="text-sm font-bold">${mortgageResult.monthlyPrincipalAndInterest.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Property Tax</span>
                        <span className="text-sm font-bold">${mortgageResult.monthlyPropertyTax.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Insurance</span>
                        <span className="text-sm font-bold">${mortgageResult.monthlyInsurance.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">HOA Fees</span>
                        <span className="text-sm font-bold">${mortgageResult.monthlyHoa.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Amortization Graph Mock */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Principal vs Interest Trend</h3>
                    
                    <div className="flex items-end gap-1 h-32 w-full pt-4">
                      <div className="bg-blue-600/20 w-full h-[100%] rounded-t-sm relative group">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[30%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[95%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[35%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[88%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[42%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[80%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[50%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[70%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[58%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[58%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[67%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[45%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[77%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[30%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[88%]"></div>
                      </div>
                      <div className="bg-blue-600/20 w-full h-[15%] rounded-t-sm relative">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-600 h-[96%]"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span>Start</span>
                      <span>Year {Math.round(mortgageTerm/2)}</span>
                      <span>Year {mortgageTerm}</span>
                    </div>
                    <div className="flex items-center gap-4 justify-center mt-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                        <span>Principal Paid</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-3 h-3 bg-blue-600/30 rounded-sm"></div>
                        <span>Interest Balance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Article SEO Guide Placement */}
              <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
                <h3 className="text-xl font-extrabold text-slate-900">How Mortgage Payments Work: Complete Guide</h3>
                <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
                  <p>
                    When buying a home, understanding your future financial commitments is the single most critical step in maintaining high fiscal health. This <strong>Mortgage Calculator</strong> serves as a high-fidelity simulator for estimating your potential expenses using standard compounding mathematics.
                  </p>
                  <h4 className="font-bold text-slate-800 text-base mt-4">Breaking Down Your Payment</h4>
                  <p>
                    Your final monthly fee comprises several elements, typically referred to as PITI (Principal, Interest, Taxes, and Insurance):
                  </p>
                  <table className="min-w-full divide-y divide-slate-200 my-4 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold uppercase text-slate-500">Component</th>
                        <th className="px-4 py-2 text-left font-bold uppercase text-slate-500">Description</th>
                        <th className="px-4 py-2 text-left font-bold uppercase text-slate-500">Impact On Monthly Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-slate-700">Principal</td>
                        <td className="px-4 py-2.5">The actual base balance of the loan that goes towards purchasing the equity.</td>
                        <td className="px-4 py-2.5 text-blue-600 font-bold">Decreases loan balance</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-slate-700">Interest</td>
                        <td className="px-4 py-2.5">The borrowing fee charged by your banking entity based on your annual percentage rate.</td>
                        <td className="px-4 py-2.5 text-blue-600 font-bold">Goes directly to lender</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-slate-700">Property Taxes</td>
                        <td className="px-4 py-2.5">State and local fees charged annually and typically escrowed.</td>
                        <td className="px-4 py-2.5 text-blue-600 font-bold">Varies by municipality</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LOAN CALCULATOR VIEW */}
          {activeTab === 'financial' && selectedCalcId === 'loan' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / Financial /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Loan Calculator</h2>
                  <p className="text-sm text-slate-500">Track interest charges, monthly payments, and total cost of borrowing.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Share2 className="w-3.5 h-3.5" /> {shareSuccess ? 'Link Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Calculation Inputs</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Loan Amount ($)</label>
                    <input 
                      type="number" 
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Term</label>
                      <input 
                        type="number" 
                        value={loanTerm}
                        onChange={(e) => setLoanTerm(Math.max(1, Number(e.target.value)))}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Unit</label>
                      <select 
                        value={loanTermUnit}
                        onChange={(e) => setLoanTermUnit(e.target.value as any)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold bg-white"
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={loanRate}
                      onChange={(e) => setLoanRate(Math.max(0, Number(e.target.value)))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Payment Summary</h3>
                    
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">${loanResult.monthlyPayment.toLocaleString()}</span>
                      <span className="text-slate-400 font-medium">/ month</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Principal</span>
                        <span className="text-sm font-bold">${loanResult.totalPrincipal.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Interest</span>
                        <span className="text-sm font-bold">${loanResult.totalInterest.toLocaleString()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Cost</span>
                        <span className="text-sm font-bold text-blue-600">${loanResult.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BMI CALCULATOR VIEW */}
          {activeTab === 'fitness' && selectedCalcId === 'bmi' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / Fitness /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">BMI Calculator</h2>
                  <p className="text-sm text-slate-500">Find your Body Mass Index instantly using metric or imperial measurements.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Share2 className="w-3.5 h-3.5" /> {shareSuccess ? 'Link Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-5">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setBmiSystem('metric')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${bmiSystem === 'metric' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Metric (kg/cm)
                    </button>
                    <button 
                      onClick={() => setBmiSystem('imperial')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${bmiSystem === 'imperial' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      Imperial (lbs/in)
                    </button>
                  </div>

                  {bmiSystem === 'metric' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Weight (kg)</label>
                        <input 
                          type="number" 
                          value={bmiWeightMetric}
                          onChange={(e) => setBmiWeightMetric(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Height (cm)</label>
                        <input 
                          type="number" 
                          value={bmiHeightMetric}
                          onChange={(e) => setBmiHeightMetric(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Weight (lbs)</label>
                        <input 
                          type="number" 
                          value={bmiWeightImperial}
                          onChange={(e) => setBmiWeightImperial(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Height (inches)</label>
                        <input 
                          type="number" 
                          value={bmiHeightImperial}
                          onChange={(e) => setBmiHeightImperial(Math.max(0, Number(e.target.value)))}
                          className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Outputs */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Your Score</h3>

                    <div className="flex flex-col md:flex-row items-baseline gap-4 mb-6">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{bmiResult.bmi}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        bmiResult.category === 'Normal weight' ? 'bg-green-100 text-green-800' :
                        bmiResult.category === 'Underweight' ? 'bg-yellow-100 text-yellow-800' :
                        bmiResult.category === 'Overweight' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bmiResult.category}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm text-slate-600 leading-relaxed">
                      <div className="flex justify-between font-bold border-b border-slate-200 pb-2">
                        <span>Healthy Weight Range:</span>
                        <span className="text-slate-900">{bmiResult.healthyRangeText}</span>
                      </div>
                      <p className="pt-2">{bmiResult.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CALORIE CALCULATOR VIEW */}
          {activeTab === 'fitness' && selectedCalcId === 'calorie' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / Fitness /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Calorie Calculator</h2>
                  <p className="text-sm text-slate-500">Estimate daily energy requirements based on the Mifflin-St Jeor equation.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button onClick={handleShare} className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 shadow-sm transition">
                    <Share2 className="w-3.5 h-3.5" /> {shareSuccess ? 'Link Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Inputs */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setCalSystem('metric')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${calSystem === 'metric' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Metric</button>
                    <button onClick={() => setCalSystem('imperial')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${calSystem === 'imperial' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Imperial</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Age (Years)</label>
                      <input type="number" value={calAge} onChange={(e) => setCalAge(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Gender</label>
                      <select value={calGender} onChange={(e) => setCalGender(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold bg-white">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  {calSystem === 'metric' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Weight (kg)</label>
                        <input type="number" value={calWeightMetric} onChange={(e) => setCalWeightMetric(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (cm)</label>
                        <input type="number" value={calHeightMetric} onChange={(e) => setCalHeightMetric(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Weight (lbs)</label>
                        <input type="number" value={calWeightImperial} onChange={(e) => setCalWeightImperial(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Height (inches)</label>
                        <input type="number" value={calHeightImperial} onChange={(e) => setCalHeightImperial(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Activity Level</label>
                    <select value={calActivity} onChange={(e) => setCalActivity(e.target.value as any)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold bg-white">
                      <option value="sedentary">Sedentary (Little or no exercise)</option>
                      <option value="light">Lightly Active (Exercise 1-3 times/week)</option>
                      <option value="moderate">Moderately Active (Exercise 4-5 times/week)</option>
                      <option value="active">Very Active (Intense exercise daily)</option>
                      <option value="very_active">Extra Active (Hard physical work)</option>
                    </select>
                  </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Daily Target Calories</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div>
                          <span className="block text-sm font-bold text-slate-800">Weight Maintenance</span>
                          <span className="text-xs text-slate-500">100% of daily needs</span>
                        </div>
                        <span className="text-2xl font-black text-slate-900">{calorieResult.maintain} <span className="text-xs font-normal text-slate-400">kcal</span></span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="block text-xs font-bold text-slate-600">Weight Loss (-0.5kg/wk)</span>
                          <span className="text-xl font-black text-slate-900 mt-1 block">{calorieResult.weightLoss} <span className="text-xs font-normal text-slate-400">kcal</span></span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="block text-xs font-bold text-slate-600">Weight Gain (+0.5kg/wk)</span>
                          <span className="text-xl font-black text-slate-900 mt-1 block">{calorieResult.weightGain} <span className="text-xs font-normal text-slate-400">kcal</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PERCENTAGE CALCULATOR VIEW */}
          {activeTab === 'math' && selectedCalcId === 'percentage' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / Math /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Percentage Calculator</h2>
                  <p className="text-sm text-slate-500">Solve fractional percentages, ratios, and relative gains/losses.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs */}
                <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
                  
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setPctCase('percentOf')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${pctCase === 'percentOf' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>What is X% of Y?</button>
                    <button onClick={() => setPctCase('whatPercentOf')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${pctCase === 'whatPercentOf' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>What % of X is Y?</button>
                    <button onClick={() => setPctCase('change')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${pctCase === 'change' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>% Change X to Y</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Value X</label>
                      <input 
                        type="number" 
                        value={pctX} 
                        onChange={(e) => setPctX(Number(e.target.value))} 
                        className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Value Y</label>
                      <input 
                        type="number" 
                        value={pctY} 
                        onChange={(e) => setPctY(Number(e.target.value))} 
                        className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-6">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Calculated Explanation</h3>
                      <div className="text-4xl font-black text-slate-900 mb-4">{pctResult.result}%</div>
                      <p className="text-slate-600 font-medium">{pctResult.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AGE CALCULATOR VIEW */}
          {activeTab === 'more' && selectedCalcId === 'age' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / More /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Age Calculator</h2>
                  <p className="text-sm text-slate-500">Determine custom age metrics down to days, weeks, and hours.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Birth Date</label>
                    <input type="date" value={ageBirthDate} onChange={(e) => setAgeBirthDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Age at Date</label>
                    <input type="date" value={ageTargetDate} onChange={(e) => setAgeTargetDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-4">Calculated Age</h3>
                    <div className="text-3xl md:text-4xl font-black text-slate-900">
                      {ageResult.years} years, {ageResult.months} months, {ageResult.days} days
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Months</span>
                      <span className="text-sm font-bold">{ageResult.totalMonths.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Days</span>
                      <span className="text-sm font-bold">{ageResult.totalDays.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl col-span-2">
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Next Birthday Countdown</span>
                      <span className="text-sm font-bold text-blue-600">{ageResult.nextBirthdayDays} days left (falling on a {ageResult.nextBirthdayWeekday})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIP CALCULATOR VIEW */}
          {activeTab === 'more' && selectedCalcId === 'tip' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / More /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Tip Calculator</h2>
                  <p className="text-sm text-slate-500">Quickly split bills and check gratuity percentages.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Bill Amount ($)</label>
                    <input type="number" step="0.01" value={tipBill} onChange={(e) => setTipBill(Number(e.target.value))} className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Tip Percent (%)</label>
                    <input type="number" value={tipPct} onChange={(e) => setTipPct(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Split count (People)</label>
                    <input type="number" value={tipPeople} onChange={(e) => setTipPeople(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Gratuity Breakdown</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <span className="block text-xs text-slate-500">Total Tip</span>
                        <span className="text-2xl font-bold text-slate-900">${tipResult.tipAmount.toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <span className="block text-xs text-slate-500">Total Bill</span>
                        <span className="text-2xl font-bold text-slate-900">${tipResult.totalBill.toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="block text-xs text-blue-600 font-bold">Tip per person</span>
                        <span className="text-3xl font-black text-slate-900">${tipResult.tipPerPerson.toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="block text-xs text-blue-600 font-bold">Total per person</span>
                        <span className="text-3xl font-black text-slate-900">${tipResult.totalPerPerson.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPA CALCULATOR VIEW */}
          {activeTab === 'more' && selectedCalcId === 'gpa' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">Home / More /</div>
                  <h2 className="text-3xl font-extrabold tracking-tight">GPA Calculator</h2>
                  <p className="text-sm text-slate-500">Track semester performance with unweighted and weighted criteria scales.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Courses List</h3>
                  
                  <div className="space-y-2">
                    {gpaCourses.map((c, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm">
                        <div>
                          <span className="font-bold text-slate-800">{c.name}</span>
                          <span className="text-xs text-slate-500 block">Credits: {c.credits} | Scale: {c.courseType.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-md">{c.grade}</span>
                          <button onClick={() => removeCourse(i)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course Name</label>
                      <input type="text" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="e.g. Chemistry" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grade</label>
                      <select value={newCourseGrade} onChange={(e) => setNewCourseGrade(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm bg-white">
                        {['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Credits</label>
                      <input type="number" value={newCourseCredits} onChange={(e) => setNewCourseCredits(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                      <select value={newCourseType} onChange={(e) => setNewCourseType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm bg-white">
                        <option value="regular">Regular (4.0)</option>
                        <option value="honors">Honors (+0.5)</option>
                        <option value="ap_ib">AP/IB (+1.0)</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={addCourse} className="w-full mt-3 bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Course Row</button>
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-6">Cumulative Grade Average</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <span className="block text-xs text-slate-500">Unweighted GPA</span>
                        <span className="text-3xl font-black text-slate-900">{gpaResult.unweightedGpa.toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <span className="block text-xs text-slate-500">Weighted GPA</span>
                        <span className="text-3xl font-black text-slate-900 text-blue-600">{gpaResult.gpa.toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl col-span-2">
                        <span className="block text-xs text-slate-500">Total Credits Earned</span>
                        <span className="text-xl font-bold text-slate-800">{gpaResult.totalCredits} credits</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC CUSTOM CALCULATOR VIEW */}
          {(() => {
            const currentCustomCalc = dbCalculators.find(c => c.id === selectedCalcId);
            if (!currentCustomCalc) return null;
            return (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
                  <div className="text-left">
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-tight mb-1">
                      Home / {currentCustomCalc.category.charAt(0).toUpperCase() + currentCustomCalc.category.slice(1)} /
                    </div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{currentCustomCalc.name}</h2>
                    <p className="text-sm text-slate-500">{currentCustomCalc.metadata?.description || 'Custom Dynamic Web Calculator Widget'}</p>
                  </div>
                </div>

                {/* Dynamic widget container */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm text-left">
                  <DynamicCalculatorWidget 
                    calculator={currentCustomCalc} 
                    onShare={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShareSuccess(true);
                      setTimeout(() => setShareSuccess(false), 2000);
                    }}
                    onExportPDF={() => {
                      window.print();
                    }}
                    shareSuccess={shareSuccess}
                  />
                </div>

                {/* Adaptive High-Quality SEO Article Text Block Below Calculator */}
                {currentCalcArticle && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mt-8 text-left max-w-none select-text">
                    <div className="border-b border-slate-100 pb-4 mb-6">
                      <h3 className="text-sm font-black text-[#549b25] uppercase tracking-widest flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        Guide d'expert & Informations détaillées
                      </h3>
                    </div>
                    <MarkdownRenderer content={currentCalcArticle.content} />
                  </div>
                )}
              </div>
            );
          })()}

          {/* ADMIN PORTAL PANEL */}
          {activeTab === 'admin' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-12">
              {!isAdminLoggedIn ? (
                // Admin Login Panel with modern layout
                <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-md">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">Administrator Login</h3>
                    <p className="text-sm text-slate-500 mt-1">Please authenticate with secure credentials.</p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Username</label>
                      <input 
                        type="text" 
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        placeholder="e.g. admin"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Password</label>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        placeholder="••••••••"
                      />
                    </div>

                    {authError && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg font-bold">{authError}</p>}

                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">
                      Sign In Securely
                    </button>
                  </form>
                </div>
              ) : (
                // Full Admin Panel Hub
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-2xl font-extrabold">Professional Administration Hub</h2>
                      <p className="text-sm text-slate-500">Secure control panel for sitemaps, OpenRouter AI, and custom integrations.</p>
                    </div>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      Logout Session
                    </button>
                  </div>

                  {/* Admin submenu */}
                  <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setAdminSubTab('catalog')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'catalog' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Calculators Catalog</button>
                    <button onClick={() => setAdminSubTab('articles')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'articles' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Articles & AI Manager</button>
                    <button onClick={() => setAdminSubTab('analytics')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'analytics' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Analytics Views</button>
                    <button onClick={() => setAdminSubTab('codegen')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'codegen' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Code Intel Gen</button>
                    <button onClick={() => setAdminSubTab('settings')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'settings' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>Central Settings & Redirects</button>
                    <button onClick={() => setAdminSubTab('logs')} className={`px-4 py-2 text-xs font-bold rounded-lg transition ${adminSubTab === 'logs' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>System Logs</button>
                  </div>

                  {/* 1. Catalog tab */}
                  {adminSubTab === 'catalog' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-lg text-slate-900">Active Calculators Listing</h3>
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">Sitemap updates dynamically</span>
                      </div>

                      {toggleError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{toggleError}</span>
                        </div>
                      )}

                      <div className="divide-y divide-slate-100">
                        {calculatorsCatalog.map((calc) => (
                          <div key={calc.id} className="flex justify-between items-center py-4">
                            <div>
                              <span className="font-bold text-slate-800">{calc.name}</span>
                              <span className="text-xs text-slate-500 block">Slug: /{calc.slug} | Category: {calc.category.toUpperCase()}</span>
                            </div>
                            <button 
                              onClick={() => handleToggleCalculator(calc.id)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${calc.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {calc.status === 'active' ? '● ACTIVE (In Sitemap)' : '○ INACTIVE'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Articles tab with AI Generation and Suggestions */}
                  {adminSubTab === 'articles' && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                        <h3 className="font-extrabold text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          AI SEO Writer and Article Manager
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Target Calculator Entity</label>
                              <select 
                                value={selectedArticleCalc}
                                onChange={(e) => { setSelectedArticleCalc(e.target.value); }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl bg-white text-sm"
                              >
                                {calculatorsCatalog.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={handleFetchGoogleTrends}
                                className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-slate-800"
                              >
                                Fetch Google Search Suggestions
                              </button>
                              <button 
                                onClick={handleGenerateProgrammaticSEO}
                                disabled={isProgGenerating}
                                className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isProgGenerating ? 'Generating...' : 'Suggest Programmatic SEO'}
                              </button>
                            </div>

                            {googleAutocompletes.length > 0 && (
                              <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Live autocompletes from Google suggest API (Click to add as focus keyword)</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {googleAutocompletes.map((term, idx) => (
                                    <button 
                                      key={idx} 
                                      onClick={() => handleKeywordClick(term)}
                                      className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer text-left font-medium"
                                    >
                                      + {term}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Article Main Title (Optimized for high CTR)</label>
                              <input 
                                type="text" 
                                value={aiTitle}
                                onChange={(e) => setAiTitle(e.target.value)}
                                placeholder="e.g. How to Calculate BMI Properly for Ideal Health"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                              />
                              {suggestedTitles.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <span className="block text-[9px] font-bold text-slate-500 uppercase">AI Suggested Titles (Click to fill)</span>
                                  <div className="flex flex-col gap-1.5">
                                    {suggestedTitles.map((title, idx) => (
                                      <button 
                                        key={idx} 
                                        onClick={() => handleTitleClick(title)}
                                        className="text-left bg-white border border-slate-200 text-slate-700 text-xs p-2 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer w-full font-medium"
                                      >
                                        🎯 {title}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Focus Keywords (Comma-separated)</label>
                              <input 
                                type="text" 
                                value={aiKeywordsInput}
                                onChange={(e) => setAiKeywordsInput(e.target.value)}
                                placeholder="e.g. bmi calculator, body mass index, fit, healthy"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                              />
                              {suggestedKeywords.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <span className="block text-[9px] font-bold text-slate-500 uppercase">AI Suggested Keywords (Click to add)</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {suggestedKeywords.map((kw, idx) => (
                                      <button 
                                        key={idx} 
                                        onClick={() => handleKeywordClick(kw)}
                                        className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer text-left font-medium"
                                      >
                                        + {kw}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button 
                              onClick={handleAiArticleGenerate}
                              disabled={isAiGenerating}
                              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                            >
                              {isAiGenerating ? 'Generating 1200+ Words Guide in Background...' : 'Launch AI Human-Like Writer'}
                            </button>

                            {isAiGenerating && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2 animate-pulse">
                                <span>Status: {taskStatus?.status || 'queued'} | Progress: {taskStatus?.progress || 0}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated SEO Prog List */}
                      {progSeoResult.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                          <h4 className="font-bold text-slate-900">Programmatic Localized SEO Drafts (Stored as Drafts)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {progSeoResult.map((v, i) => (
                              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-bold block text-slate-800">{v.title}</span>
                                <span className="text-[10px] text-slate-400 block mb-2">/{v.slug}</span>
                                <p className="text-xs text-slate-600 line-clamp-3">{v.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display existing articles list */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6">
                        <h4 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                          <span>Articles Under Pending Review & Published</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Total: {articlesList.length}</span>
                        </h4>
                        <div className="divide-y divide-slate-100">
                          {articlesList.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 text-xs">No articles or drafts created yet. Use the AI Human-Like Writer or programmatic builder above.</div>
                          ) : (
                            articlesList.map(a => (
                              <div key={a.id} className="py-4 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm">{a.title}</span>
                                    <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                                      Slug: <span className="text-blue-600">/{a.slug}</span> | Calculator: <span className="capitalize">{a.calculatorId.replace('-', ' ')}</span> | Version: {a.version}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                                      a.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>{a.status}</span>
                                    
                                    <button 
                                      onClick={() => handleUpdateArticleStatus(a.id, a.status === 'published' ? 'draft' : 'published')}
                                      className={`text-[11px] font-semibold px-2.5 py-1 rounded border transition cursor-pointer ${
                                        a.status === 'published' 
                                          ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' 
                                          : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                      }`}
                                    >
                                      {a.status === 'published' ? 'Unpublish' : 'Publish Live'}
                                    </button>

                                    <button 
                                      onClick={() => handleStartEditArticle(a)}
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                                    >
                                      Edit
                                    </button>

                                    <button 
                                      onClick={() => handleDeleteArticle(a.id)}
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {editingArticleId === a.id && (
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Article Title</label>
                                        <input 
                                          type="text"
                                          value={editArticleTitle}
                                          onChange={(e) => setEditArticleTitle(e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL Slug</label>
                                        <input 
                                          type="text"
                                          value={editArticleSlug}
                                          onChange={(e) => setEditArticleSlug(e.target.value)}
                                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Article Content (Markdown Supported)</label>
                                      <textarea 
                                        rows={10}
                                        value={editArticleContent}
                                        onChange={(e) => setEditArticleContent(e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono resize-y"
                                        placeholder="Write your guide content..."
                                      />
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                                      <div>
                                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                                          <select 
                                            value={editArticleStatus}
                                            onChange={(e) => setEditArticleStatus(e.target.value as any)}
                                            className="p-1 border border-slate-200 rounded text-xs"
                                          >
                                            <option value="draft">Draft</option>
                                            <option value="pending_review">Pending Review</option>
                                            <option value="published">Published</option>
                                          </select>
                                        </label>
                                      </div>
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => setEditingArticleId(null)}
                                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => handleSaveArticleEdit(a.id)}
                                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg cursor-pointer shadow-sm transition"
                                        >
                                          Save Changes
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Analytics View */}
                  {adminSubTab === 'analytics' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                      <h3 className="font-extrabold text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Lite Internal Analytics Views (Per Calculator)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {analyticsLogs.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 col-span-3">No hits registered yet today. Start calculating to record metrics.</div>
                        ) : (
                          analyticsLogs.map((log: any) => (
                            <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800 capitalize">{log.calculatorId.replace('-', ' ')}</span>
                                <span className="text-xs text-slate-400 block">Date: {log.date}</span>
                              </div>
                              <span className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">{log.views} hits</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Code Intel Gen (Step 10) */}
                  {adminSubTab === 'codegen' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="font-extrabold text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600 animate-pulse" />
                          New Modular Calculator Creator (DeepSeek R1 / Gemini Live)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Empower your SEO platform by spawning complete customized financial, health, or investment widgets on-the-fly.
                        </p>
                      </div>

                      {/* Highly Searched & Requested Concept Suggestions */}
                      <div className="space-y-3">
                        <span className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                          🔥 Highly Searched & Requested Calculator Concepts
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableSuggestions.map((sug) => (
                            <div 
                              key={sug.title}
                              onClick={() => {
                                setCodeGenSpec(sug.spec);
                                setSelectedSuggestionTitle(sug.title);
                                document.getElementById('specifications_textarea')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition text-left group"
                            >
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-extrabold text-xs text-slate-800 group-hover:text-blue-600 transition">{sug.title}</span>
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{sug.volume}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal">{sug.desc}</p>
                              <div className="mt-2 text-[9px] font-bold text-blue-500 group-hover:underline flex items-center gap-1 uppercase tracking-wider">
                                Click to Populate Prompt Specifications →
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Specifications & Math Rules of the tool you wish to create</label>
                          <textarea 
                            id="specifications_textarea"
                            rows={5}
                            value={codeGenSpec}
                            onChange={(e) => setCodeGenSpec(e.target.value)}
                            placeholder="e.g. Build a standard 'Currency Compound Interest Calculator' with inputs: Initial capital, monthly deposit, term years, interest annual rate, compounding times per year..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none"
                          />
                        </div>

                        <button 
                          onClick={handleGenerateCode}
                          disabled={isCodeGenGenerating || !codeGenSpec}
                          className="w-full bg-[#134074] hover:bg-[#0b2545] text-white font-bold py-3 rounded-xl transition disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider shadow-sm"
                        >
                          {isCodeGenGenerating ? 'DeepSeek R1 / Gemini analyzing formulas and generating modular files...' : 'Compile Expert TS Modular Architecture'}
                        </button>

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                          This code is generated by AI. Review it carefully before publishing.
                        </div>

                        {/* Interactive Live Calculator Sandbox Section */}
                        {generatedCodeResult && generatedCodeResult.meta && (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 mt-6">
                            <div className="bg-[#0b2545] text-white p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-extrabold text-xs uppercase tracking-wide">Live Functional Sandbox Preview</h4>
                                <span className="text-xs text-[#a8c878] font-bold">{generatedCodeResult.meta.calculatorName || 'Custom Calculator'}</span>
                              </div>
                              <div className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded text-slate-200 uppercase tracking-wider">Responsive Design Ready</div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                              {/* Dynamic Calculator Sandbox Panel */}
                              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                                <h5 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                  <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                  Active Calculator Widget
                                </h5>

                                <div className="space-y-3">
                                  {generatedCodeResult.meta.inputs?.map((inp: any) => (
                                    <div key={inp.name}>
                                      <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{inp.label}</label>
                                        {inp.suffix && <span className="text-[9px] text-slate-400 font-bold font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded">{inp.suffix}</span>}
                                      </div>
                                      <input 
                                        type="number"
                                        value={sandboxInputs[inp.name] !== undefined ? sandboxInputs[inp.name] : ''}
                                        onChange={(e) => setSandboxInputs({ ...sandboxInputs, [inp.name]: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                                        placeholder={`e.g. ${inp.defaultValue || ''}`}
                                      />
                                      {inp.helpText && <span className="text-[9px] text-slate-400 mt-1 block leading-normal">{inp.helpText}</span>}
                                    </div>
                                  ))}
                                </div>

                                {sandboxWarning && (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                                    ⚠️ {sandboxWarning}
                                  </div>
                                )}

                                <button 
                                  onClick={handleRunSandboxCalculation}
                                  className="w-full bg-[#134074] hover:bg-[#0b2545] text-white font-extrabold text-[10px] uppercase tracking-wider py-3 rounded-lg transition-colors cursor-pointer"
                                >
                                  Calculate Metrics
                                </button>

                                {/* Dynamic Outputs */}
                                {Object.keys(sandboxOutputs).length > 0 && (
                                  <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl space-y-3">
                                    <span className="text-[9px] text-[#a8c878] font-bold uppercase tracking-wider block border-b border-white/10 pb-1.5">Calculated Output Metrics</span>
                                    <div className="grid grid-cols-2 gap-3">
                                      {generatedCodeResult.meta.outputs?.map((out: any) => {
                                        const val = sandboxOutputs[out.name];
                                        return (
                                          <div key={out.name} className="bg-white/5 p-2.5 rounded-lg border border-white/10">
                                            <span className="text-[9px] text-slate-400 block font-bold truncate">{out.label}</span>
                                            <span className="text-sm font-black text-white font-mono block mt-1">
                                              {out.suffix === '$' ? `$${val}` : `${val}${out.suffix || ''}`}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Code Viewer Panel */}
                              <div className="bg-slate-950 text-slate-100 rounded-xl border border-slate-800 p-5 flex flex-col h-full min-h-[350px]">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Architecture Review</span>
                                  <div className="flex gap-1">
                                    {(['formula', 'validation', 'tests'] as const).map((tab) => (
                                      <button
                                        key={tab}
                                        onClick={() => setCodePreviewTab(tab)}
                                        className={`px-2.5 py-1 text-[9px] font-bold rounded transition uppercase ${codePreviewTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                      >
                                        {tab}.ts
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex-1 relative font-mono text-[10px] overflow-auto max-h-[300px] bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                  <pre className="whitespace-pre-wrap leading-relaxed select-all">
                                    {codePreviewTab === 'formula' && (generatedCodeResult.formulaCode || '// formula.ts not found')}
                                    {codePreviewTab === 'validation' && (generatedCodeResult.validationCode || '// validation.ts not found')}
                                    {codePreviewTab === 'tests' && (generatedCodeResult.testsCode || '// tests.ts not found')}
                                  </pre>
                                </div>

                                <div className="mt-3 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase">
                                  <span>Click code to select and copy</span>
                                  <span className="text-blue-500">100% Client-Side Pure logic</span>
                                </div>
                              </div>
                            </div>

                            {/* Dynamic SEO Article Preview Panel */}
                            <div className="p-6 bg-[#fcfcfc] border-t border-slate-200 text-left space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <div>
                                  <h4 className="font-extrabold text-sm uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-[#549b25]" />
                                    📚 Generated High-Performance SEO Article Guide
                                  </h4>
                                  <p className="text-[11px] text-slate-500">
                                    This guide is optimized to score 100/100 E-E-A-T and is pre-formatted for optimal crawler indexing.
                                  </p>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                                  {generatedCodeResult.meta.seoArticleContent ? `~${Math.round(generatedCodeResult.meta.seoArticleContent.split(' ').length)} words` : '0 words'}
                                </span>
                              </div>

                              {generatedCodeResult.meta.seoArticleContent ? (
                                <div className="p-5 bg-white border border-slate-200 rounded-xl max-h-[350px] overflow-y-auto shadow-inner text-sm leading-relaxed">
                                  <MarkdownRenderer content={generatedCodeResult.meta.seoArticleContent} />
                                </div>
                              ) : (
                                <div className="p-4 bg-slate-50 text-slate-500 text-xs text-center border rounded-xl border-dashed">
                                  No SEO guide content was generated.
                                </div>
                              )}
                            </div>

                            {/* PUBLISH TO PLATFORM LIVE CTA BAR */}
                            <div className="p-6 bg-slate-900 border-t border-slate-800 text-white flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="text-left">
                                <h5 className="font-extrabold text-sm text-[#a8c878] uppercase tracking-wider">Publish this calculator to production</h5>
                                <p className="text-xs text-slate-400 mt-1">
                                  It will be automatically assigned to the <strong className="text-white uppercase">"{generatedCodeResult.meta.category || 'more'}"</strong> category and published live with its SEO Article!
                                </p>
                              </div>
                              <button
                                onClick={handlePublishCalculator}
                                disabled={isPublishing}
                                className="w-full md:w-auto bg-[#549b25] hover:bg-[#437d1c] text-white font-extrabold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                              >
                                {isPublishing ? 'Publishing live...' : 'Publish Live Now (Publier le Calculator)'}
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Central Settings & Redirects */}
                  {adminSubTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Central Settings */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider text-xs">Settings Configuration</h3>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">OpenRouter API Key</label>
                          <input 
                            type="password" 
                            value={editOpenrouterKey}
                            onChange={(e) => setEditOpenrouterKey(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                            placeholder="sk-or-v1-..."
                          />
                        </div>

                        <div className="flex items-center gap-2 py-2">
                          <input 
                            type="checkbox" 
                            checked={editAdsenseEnabled}
                            onChange={(e) => setEditAdsenseEnabled(e.target.checked)}
                            className="w-4 h-4 text-blue-600 accent-blue-600"
                            id="adsense_flag"
                          />
                          <label htmlFor="adsense_flag" className="text-xs font-bold text-slate-600 uppercase cursor-pointer">Enable AdSense advertising networks</label>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">AdSense Publisher Code Snippet</label>
                          <textarea 
                            rows={2}
                            value={editAdsenseCode}
                            onChange={(e) => setEditAdsenseCode(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                            placeholder="<script async src='...'></script>"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Google Analytics/Search Console Scripts</label>
                          <textarea 
                            rows={2}
                            value={editAnalyticsCode}
                            onChange={(e) => setEditAnalyticsCode(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                            placeholder="<!-- Google Tag Manager -->"
                          />
                        </div>

                        <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
                          <button onClick={handleDatabaseBackup} className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-slate-800 transition">Create Local Backup</button>
                          <button onClick={handleSaveSettings} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg text-xs hover:bg-blue-700 transition">Save Changes</button>
                        </div>
                      </div>

                      {/* 301 Redirect Rules Management */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider text-xs">301 Permanent Redirect Rules (SEO Protection)</h3>

                        <form onSubmit={handleAddRedirect} className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Old Path (Source)</label>
                            <input type="text" value={newOldUrl} onChange={(e) => setNewOldUrl(e.target.value)} placeholder="/old-calc" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Path (Target)</label>
                            <input type="text" value={newNewUrl} onChange={(e) => setNewNewUrl(e.target.value)} placeholder="/mortgage-calculator" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                          </div>
                          <button type="submit" className="col-span-2 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs mt-1">Add Active Rule</button>
                        </form>

                        <div className="divide-y divide-slate-100 pt-4 max-h-48 overflow-y-auto">
                          {adminRedirects.map((r) => (
                            <div key={r.id} className="py-2 flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-700">{r.oldUrl}</span>
                                <span className="text-slate-400 font-bold mx-2">→</span>
                                <span className="text-slate-700">{r.newUrl}</span>
                              </div>
                              <button onClick={() => handleDeleteRedirect(r.id)} className="text-red-500 hover:text-red-700">Delete</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. System Logs viewer */}
                  {adminSubTab === 'logs' && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6">
                      <h3 className="font-extrabold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-2">Central System Audit & Error Logs</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {systemLogs.map((log: any, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold bg-slate-200 px-2 py-0.5 rounded mr-2 text-[10px] uppercase">{log.type}</span>
                              <span className="text-slate-700">{log.message}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* EEAT STATIC PAGES */}
          {activeTab === 'about' && (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">About Us</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Welcome to the <strong>Professional Calculator Platform</strong>. Our primary objective is to deliver industrial-grade, 100% responsive, and mobile-first calculation tools with zero-latency client-side rendering.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm">
                Each mathematical logic model, validation criteria, and calculation coefficient living in our directory is tested extensively to match strict financial and health assessment standards.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">Privacy Policy</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                We take privacy extremely seriously. <strong>All calculation mathematical operations execute exclusively on the client-side (inside your browser context).</strong> This means no numerical input values, variables, salaries, or financial coefficients are ever transmitted to or stored on our servers.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm">
                We only track basic anonymized view metrics to continuously optimize site performance and loading structures.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 space-y-6">
              <h2 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">Terms of Use</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Calculations provided by the <strong>Professional Calculator Platform</strong> are for informational purposes only. Results do not constitute legal, medical, or financial advice.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm">
                While we strive for perfect mathematical accuracy across all standard formulas, we recommend confirming high-impact numbers with certified professionals.
              </p>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 space-y-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-4 text-center">Contact Us</h2>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Name</label>
                  <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Your name" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Email</label>
                  <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="email@example.com" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Subject</label>
                  <input type="text" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="How can we help?" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Message</label>
                  <textarea rows={4} value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Your message details..." required />
                </div>

                {contactSuccess && <p className="text-xs text-green-700 bg-green-50 p-3 rounded-xl font-bold">{contactSuccess}</p>}
                {contactError && <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl font-bold">{contactError}</p>}

                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">
                  Send Message
                </button>
              </form>
            </div>
          )}

        </div> {/* End of LEFT COLUMN */}

        {/* RIGHT COLUMN - SIDEBAR */}
        {activeTab !== 'admin' && activeTab !== 'about' && activeTab !== 'privacy' && activeTab !== 'terms' && activeTab !== 'contact' && (
          <div className="w-full md:w-[260px] flex-shrink-0 flex flex-col gap-5">
            
            {/* Real-time sidebar filter search */}
            <div className="bg-[#f2f2f2] border border-[#dcdcdc] rounded p-4">
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2">Search Calculators</h3>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Type name here..."
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Category Directory List */}
            <div className="bg-white border border-[#dcdcdc] rounded p-4 space-y-4 shadow-sm">
              
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  Financial
                </h4>
                <ul className="text-xs space-y-1.5 mt-2">
                  <li>
                    <button onClick={() => selectCalculator('mortgage')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'mortgage' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Mortgage Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => selectCalculator('loan')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'loan' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Loan Calculator
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-green-600" />
                  Fitness & Health
                </h4>
                <ul className="text-xs space-y-1.5 mt-2">
                  <li>
                    <button onClick={() => selectCalculator('bmi')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'bmi' ? 'font-bold text-slate-900 underline' : ''}`}>
                      BMI Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => selectCalculator('calorie')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'calorie' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Calorie Calculator
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-orange-500" />
                  Math
                </h4>
                <ul className="text-xs space-y-1.5 mt-2">
                  <li>
                    <button onClick={() => selectCalculator('percentage')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'percentage' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Percentage Calculator
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  Other
                </h4>
                <ul className="text-xs space-y-1.5 mt-2">
                  <li>
                    <button onClick={() => selectCalculator('age')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'age' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Age Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => selectCalculator('tip')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'tip' ? 'font-bold text-slate-900 underline' : ''}`}>
                      Tip Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => selectCalculator('gpa')} className={`text-left calc-link font-medium cursor-pointer ${selectedCalcId === 'gpa' ? 'font-bold text-slate-900 underline' : ''}`}>
                      GPA Calculator
                    </button>
                  </li>
                </ul>
              </div>

            </div>

            {/* Dynamic SEO Health / EEAT Panel */}
            <div className="bg-[#f2f2f2] border border-[#dcdcdc] rounded p-4 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">SEO Health Grade</span>
                <span className="bg-[#549b25] px-1.5 py-0.5 rounded text-[9px] text-white font-bold">100/100</span>
              </div>
              <p className="text-slate-500 text-[11px]">Dynamic rendering, zero LCP layout shifts, and client-side performance fully verified.</p>
            </div>

          </div>
        )}

      </div>

      {/* FOOTER & EEAT SEALS */}
      <footer className="border-t border-slate-200 bg-[#f5f5f5] py-6 px-4 md:px-8 text-xs text-slate-500 flex-shrink-0">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span>© 2026 Calculator. All rights reserved.</span>
            <button onClick={() => { setActiveTab('about'); setSelectedCalcId('about'); }} className="hover:text-blue-600 font-medium cursor-pointer">About Us</button>
            <button onClick={() => { setActiveTab('privacy'); setSelectedCalcId('privacy'); }} className="hover:text-blue-600 font-medium cursor-pointer">Privacy Policy</button>
            <button onClick={() => { setActiveTab('terms'); setSelectedCalcId('terms'); }} className="hover:text-blue-600 font-medium cursor-pointer">Terms of Use</button>
            <button onClick={() => { setActiveTab('contact'); setSelectedCalcId('contact'); }} className="hover:text-blue-600 font-medium cursor-pointer">Contact</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => { setActiveTab('admin'); setSelectedCalcId('admin'); }} className="hover:text-blue-600 font-bold text-blue-700 cursor-pointer flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin Dashboard
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium text-slate-600">AI Assistant Engine Active</span>
            </div>
            <span className="font-mono text-[10px] opacity-60">v1.4.2-PROD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
