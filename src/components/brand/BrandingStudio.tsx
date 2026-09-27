import { authenticatedFetch } from '../../services/authenticatedFetch';
import React, { useState, useEffect } from 'react';
import { LogoSymbol } from './LogoSymbol';
import { ContrastChecker } from './ContrastChecker';
import { MockupCollateral } from './MockupCollateral';
import { hanwhaBengali, hanwhaEnglish } from '../../data/defaultBrand';
import { saveBrandGuideline, loadSavedBrandGuideline } from '../../services/brandPersistence';
import { BrandGuideline } from '../../types/brand';
import { 
  Sparkles, Save, Download, Globe, Copy, Check, Palette, 
  Type, Heart, FileText, ChevronRight, HelpCircle, Loader2, ArrowLeft, RefreshCw,
  Camera, Image
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const BrandingStudio: React.FC = () => {
  const [language, setLanguage] = useState<'bengali' | 'english'>('bengali');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Custom typewriter preview text
  const [typewriterText, setTypewriterText] = useState('');

  // Active section scroll indicator
  const [activeSection, setActiveSection] = useState('overview');

  // Master Brand State - Prefilled with Hanwha Bengali as default
  const [brand, setBrand] = useState<BrandGuideline>(hanwhaBengali);

  // Sync default typewriter text on language change
  useEffect(() => {
    setTypewriterText(
      language === 'bengali' 
        ? "আমাদের শক্তির রূপান্তর বিশ্বকে ইতিবাচকভাবে পরিবর্তন করছে।" 
        : "Powering sustainable engineering for a clean future."
    );
  }, [language]);

  // Helper to retrieve imagery guidelines dynamically
  const getImageryGuidelines = (b: BrandGuideline, lang: 'bengali' | 'english') => {
    if (b.imageryGuidelines) return b.imageryGuidelines;
    
    // Fallback based on name or generic style
    const isRedBird = b.companyName.toLowerCase().includes('red') || b.companyName.toLowerCase().includes('bird');
    if (isRedBird) {
      return {
        moodDescription: lang === 'bengali' ? 
          "প্রিমিয়াম, আন্তর্জাতিক পোশাক উৎকর্ষ এবং বৈশ্বিক সরবরাহ ব্যবস্থার গতিশীলতা। এটি ফেব্রিক টেক্সচার এবং আধুনিক লজিস্টিকসের সুক্ষ্ম ডিজাইন বহন করে।" :
          "Premium, high-end apparel craft and fluid intercontinental logistics flow. Highlight tactile fabric textures, pristine thread work, and grand distribution systems.",
        photographyStyle: lang === 'bengali' ?
          "উষ্ণ এবং প্রাকৃতিক আলো, যেখানে পোশাকের সূক্ষ্ম সুতা ও উন্নত ফাইবার টেক্সচার ফুটে ওঠে। বন্দরে লোড হতে থাকা শিপিং কন্টেইনার এবং প্রফেশনাল টিমওয়ার্ক।" :
          "Warm, natural golden hour lighting capturing precise stitch lines, spinning spindles, and massive automated cargo loading. High-contrast, candid shots with architectural precision.",
        categories: [
          {
            title: lang === 'bengali' ? "১. ফেব্রিক ও সুতার কারিগরি (Tactile Fabrics)" : "1. Fabric & Loom Artistry",
            description: lang === 'bengali' ? "প্রিমিয়াম নিটওয়্যার ফেব্রিকস, আধুনিক সেলাইয়ের নিখুঁত ক্লোজআপ এবং টেক্সটাইলের বুনন শৈলী।" : "Macro details of premium yarn, organic fibers under production, and precise sewing loops in motion.",
            keywords: ["Macro fabrics", "Cotton spindles", "Thread texture", "Sewing precise"]
          },
          {
            title: lang === 'bengali' ? "২. লজিস্টিকস ও গ্লোবাল কার্গো (Logistics Flow)" : "2. Global Cargo Velocity",
            description: lang === 'bengali' ? "সমুদ্রের বুক চিরে চলা শিপিং কন্টেইনার ভেসেল, বন্দর ও লজিস্টিকস ডিস্ট্রিবিউশন হাবের জীবন্ত ছবি।" : "Stately shots of container ships departing deepwater ports, cargo hubs, and active logistics fleets.",
            keywords: ["Vessel dispatches", "Container harbor", "Global trade lanes", "Strategic transit"]
          },
          {
            title: lang === 'bengali' ? "৩. কমপ্লায়েন্ট কারখানার কাজের পরিবেশ (Ethical RMG)" : "3. Ethical RMG Production",
            description: lang === 'bengali' ? "আমাদের গ্রিন ফ্যাক্টরি এবং আধুনিক পরিবেশে দক্ষ কর্মীদের একাগ্রতা ও পেশাদারিত্বের Candid ছবি।" : "Bright, spacious, carbon-neutral manufacturing floors with safe, compliant, and highly skilled RMG specialists.",
            keywords: ["Green certified factory", "Apparel specialists", "Worker compliance", "Quality inspections"]
          }
        ]
      };
    }

    // Default Hanwha style fallback
    return {
      moodDescription: lang === 'bengali' ? 
        "উজ্জ্বল, প্রযুক্তিগতভাবে নিখুঁত এবং বিশ্বমানের স্থাপত্যের অনুভূতি সম্পন্ন। পরিষ্কার জ্যামিতিক লাইটিং এবং প্রাকৃতিক ভারসাম্যকে প্রকাশ করে।" :
        "Bright, high-precision, and architecturally majestic. Emphasizes clean geometry, natural scale, and eco-balanced design elements.",
      photographyStyle: lang === 'bengali' ?
        "হাই-কন্ট্রাস্ট, বাস্তবসম্মত ছবি যেখানে প্রাকৃতিক আলোর সাথে প্রযুক্তি ও টেকসই কর্মক্ষমতার চমৎকার ভারসাম্য থাকে। স্টেজড বা কৃত্রিম স্টক ফটোগ্রাফি কঠোরভাবে এড়িয়ে চলুন।" :
        "High-contrast, genuine photography showing dynamic solar systems and cutting-edge engineering marvels in daylight. Stiff or over-staged setups are prohibited.",
      categories: [
        {
          title: lang === 'bengali' ? "উন্নত সৌর ও সবুজ প্রযুক্তি (Solar Power)" : "Solar Power Infrastructures",
          description: lang === 'bengali' ? "বিশাল এলাকা জুড়ে গড়ে তোলা আধুনিক সৌরবিদ্যুৎ প্যানেল এবং সূর্যের দীপ্তির সাথে প্রযুক্তির চমৎকার মেলবন্ধন প্রকাশ করে এমন দৃশ্য।" : "Aesthetic vast landscape layouts of solar installations reflecting infinite clean power under warm sunlight.",
          keywords: ["Solar arrays", "Green grid", "Sunflare", "Energy transformation"]
        },
        {
          title: lang === 'bengali' ? "মহাকাশ ও সূক্ষ্ম প্রকৌশল (Aerospace Labs)" : "Aerospace Precision Labs",
          description: lang === 'bengali' ? "অত্যন্ত সূক্ষ্ম মহাকাশ যন্ত্রাংশ তৈরির হাই-টেক ল্যাবরেটরি এবং ইঞ্জিনিয়ারদের আধুনিক ও পরিচ্ছন্ন কাজের পরিবেশ।" : "Industrial cleanliness and state-of-the-art testing of space exploration engines by focused, diverse teams.",
          keywords: ["Aerospace labs", "Propulsion tech", "Cleanroom", "Precision engineering"]
        },
        {
          title: lang === 'bengali' ? "টেকসই মানব উৎকর্ষ ও সহযোগিতা (Ethical Leadership)" : "Ethical & Global Stature",
          description: lang === 'bengali' ? "আমাদের কর্মী এবং গ্রাহকদের পারস্পরিক আস্থা ও বৈশ্বিক সুন্দর কাজের পরিবেশের স্বাভাবিক এবং স্বতঃস্ফূর্ত ছবি।" : "Candid workspace interactions illustrating safety, mutual respect, professional diversity, and cooperative sustainable milestones.",
          keywords: ["Real teamwork", "Globally inclusive", "Sincerity", "Corporate transparency"]
        }
      ]
    };
  };

  // Load saved brand from persistence on boot if any exists
  useEffect(() => {
    const fetchSaved = async () => {
      const saved = await loadSavedBrandGuideline(language === 'bengali' ? hanwhaBengali.companyName : hanwhaEnglish.companyName);
      if (saved) {
        setBrand(saved);
      } else {
        setBrand(language === 'bengali' ? hanwhaBengali : hanwhaEnglish);
      }
    };
    fetchSaved();
  }, [language]);

  // Handle Preset Switching
  const applyPreset = (preset: 'hanwha_bn' | 'hanwha_en' | 'redbird') => {
    if (preset === 'hanwha_bn') {
      setLanguage('bengali');
      setBrand(hanwhaBengali);
    } else if (preset === 'hanwha_en') {
      setLanguage('english');
      setBrand(hanwhaEnglish);
    } else {
      // Custom Red Bird International preset
      const redBird: BrandGuideline = {
        companyName: "Red Bird International",
        tagline: language === 'bengali' ? "বিশ্বমানের পোশাক রপ্তানি ও বৈশ্বিক বাণিজ্যের সেতু" : "Bridging Global Markets with Premium Apparel Export",
        description: language === 'bengali' ? 
          "রেড বার্ড ইন্টারন্যাশনাল বিশ্বব্যাপী বিশ্বমানের আরএমজি পোশাক, টেক্সটাইল এবং কাঁচামাল রপ্তানিতে শীর্ষস্থানীয়। আমরা সর্বোচ্চ গুণমান, সময়মত ডেলিভারি এবং টেকসই ব্যবসায়িক নীতির মাধ্যমে বিশ্বজুড়ে দীর্ঘস্থায়ী ব্যবসায়িক সেতু স্থাপন করি।" :
          "Red Bird International is a premium hub for apparel export, high-end garments manufacturing, and logistics management. We facilitate seamless international trade operations, adhering to strict compliance and green standards.",
        brandPersonality: language === 'bengali' ? 
          ["গতিশীল (Dynamic)", "নির্ভরযোগ্য (Reliable)", "অভিজাত (Prestige)", "বৈশ্বিক (Global)"] :
          ["Dynamic", "Reliable", "Prestige", "Global", "Ethical"],
        brandVoice: {
          tone: language === 'bengali' ? 
            "আমাদের কণ্ঠস্বর সবসময় পেশাদার, সময়ানুগ, আত্মবিশ্বাসী এবং দায়িত্বশীল। আমরা গুণমান এবং আস্থার প্রতি বিশেষ দৃষ্টিপাত করি।" :
            "Our corporate voice is highly disciplined, professional, globally compliant, and welcoming. We talk about quality and trade trust.",
          dos: language === 'bengali' ? [
            "রপ্তানি পণ্যের নিখুঁত গুণমান ও কমপ্লায়েন্স এর উপর জোর দিন।",
            "গ্রাহকদের প্রতিশ্রুতি রক্ষা এবং দ্রুত সাড়া প্রদানের কথা উল্লেখ করুন।"
          ] : [
            "Focus on garment quality benchmarks, global logistics precision, and compliance.",
            "Highlight ethical manufacturing and fast, responsive shipment dispatches."
          ],
          donts: language === 'bengali' ? [
            "ডেলিভারির সময় নিয়ে কোনো ধোঁয়াশা রাখবেন না।",
            "অস্পষ্ট বা অনির্ভরযোগ্য তথ্যের ব্যবহার এড়িয়ে চলুন।"
          ] : [
            "Avoid ambiguous timeline statements regarding shipments.",
            "Never compromise on chemical standards or labor compliance terminology."
          ]
        },
        colorPalette: {
          primary: {
            hex: "#DC2626",
            name: language === 'bengali' ? "রক্তিম লাল (Crimson Red)" : "Crimson Red",
            meaning: language === 'bengali' ? "লাল আমাদের অপরিসীম সাহস, দ্রুততা, কাজের গতি এবং বৈশ্বিক বাণিজ্যের শক্তির পরিচয় বহন করে।" : "Red symbolizes our passion, fast logistics, courage, and core global trade energy."
          },
          secondary: {
            hex: "#1E293B",
            name: language === 'bengali' ? "গাঢ় স্লেট (Deep Slate)" : "Deep Slate Navy",
            meaning: language === 'bengali' ? "স্লেট নেভি আমাদের স্থায়িত্ব, শৃঙ্খলা এবং বিশ্বস্ত কর্পোরেট কাঠামোর বহিঃপ্রকাশ ঘটায়।" : "Reflects deep institutional stability, corporate compliance, and structural integrity."
          },
          accent: {
            hex: "#D97706",
            name: language === 'bengali' ? "সোনালী অম্বর (Golden Amber)" : "Golden Amber",
            meaning: language === 'bengali' ? "এই উজ্জ্বল সোনালী অম্বর রঙটি আমাদের উচ্চমানের কারুশিল্প, সফলতা এবং প্রিমিয়াম সম্পর্কের নির্দেশক।" : "Signifies the high craftsmanship of our apparel fabrics, excellence, and valuable long-term partnerships."
          }
        },
        typography: {
          headingFont: "Outfit",
          bodyFont: "Inter",
          rationale: language === 'bengali' ? 
            "Outfit ফন্টটি আমাদের আধুনিক পোশাক শিল্পের রুচিশীলতা ফুটিয়ে তোলে এবং Inter অত্যন্ত মার্জিতভাবে কর্পোরেট বিশ্বাসযোগ্যতা বজায় রাখে।" :
            "Outfit establishes a crisp apparel and design-focused corporate stature, while Inter provides outstanding readability for supply-chain records."
        },
        logoGuidelines: {
          concept: language === 'bengali' ? 
            "লোগোটি একটি উড়ন্ত লাল পাখির ডানা মেলানো জ্যামিতিক নকশার সমন্বয়ে গঠিত, যা সীমানা ছাড়িয়ে বৈশ্বিক বাণিজ্যের বিস্তৃতিকে ইঙ্গিত করে।" :
            "A geometric red bird in full flight, symbolizing velocity, global trade connectivity, and rising success across boundaries.",
          usageDos: language === 'bengali' ? [
            "লোগোটির চারপাশে কমপক্ষে ২০% পরিষ্কার জায়গা রাখুন।",
            "গাঢ় স্লেট ব্যাকগ্রাউন্ডে সাদা বা আংশিক সোনালী লোগো ব্যবহার করুন।"
          ] : [
            "Ensure a minimum of 20% clear space buffer around the red bird wing tips.",
            "Use full flat-white overlay on dark slate background settings."
          ],
          usageDonts: language === 'bengali' ? [
            "পাখির মুখ বা ডানার অনুপাত বিকৃত করবেন না।",
            "অনুমোদিত শেড ছাড়া অন্য কোনো শেডের লাল ব্যবহার করবেন না।"
          ] : [
            "Never distort, squeeze, or flatten the geometric bird wings.",
            "Do not rotate the bird symbol upside down or colorize its beak separately."
          ]
        },
        copywritingExamples: {
          socialMedia: language === 'bengali' ? 
            "পোশাক রপ্তানিতে বিশ্বস্ত নাম রেড বার্ড ইন্টারন্যাশনাল! 🧵✈️\n\nআমরা সর্বোচ্চ গুণমানসম্পন্ন কাপড় এবং চমৎকার সুতা দিয়ে তৈরি করি এমন পোশাক যা আন্তর্জাতিক বাজারে সেরা স্থান দখল করে। সময়মত বিশ্বব্যাপী ডেলিভারির নিশ্চয়তায় আমাদের সাথে যোগাযোগ করুন। #ApparelExport #RMG #GlobalTrade #QualityApparel" :
            "Connecting looms to global runways! 🧵✈️\n\nRed Bird International delivers premium, compliantly manufactured apparel to top-tier brands worldwide. Our integrated logistics network ensures on-time cargo arrivals. Reach out to discuss sourcing solutions.\n\n#ApparelExport #GarmentsExporter #SupplyChainTrust #RedBird",
          taglines: language === 'bengali' ? [
            "সীমানা পেরিয়ে বিশ্বস্ত বাণিজ্য",
            "পোশাক শিল্পের বিশ্বমানের কারিগরি",
            "বাণিজ্য যেখানে সম্পর্কের প্রতীক"
          ] : [
            "Sourcing Excellence, Exporting Trust",
            "Global Apparel Engineering at Scale",
            "Your Reliable Bridge to Worldwide Sourcing"
          ],
          newsletterIntro: language === 'bengali' ? 
            "সম্মানিত গ্রাহক ও পার্টনারবৃন্দ, আমাদের নতুন পরিবেশ-বান্ধব আরএমজি ইউনিট চালু হওয়ার কথা জানাতে পেরে আমরা অত্যন্ত আনন্দিত। রেড বার্ড সবসময় গুণমানের সাথে সাথে টেকসই সবুজ কারখানার প্রতিশ্রুতি নিশ্চিত করে।" :
            "Dear Respected Sourcing Partners,\nWe are thrilled to present our certified carbon-neutral garment manufacturing facility, driving sustainability in compliance with major green covenants."
        },
        imageryGuidelines: {
          moodDescription: language === 'bengali' ? 
            "প্রিমিয়াম, আন্তর্জাতিক পোশাক উৎকর্ষ এবং বৈশ্বিক সরবরাহ ব্যবস্থার গতিশীলতা। এটি ফেব্রিক টেক্সচার এবং আধুনিক লজিস্টিকসের সুক্ষ্ম ডিজাইন বহন করে।" :
            "Premium, high-end apparel craft and fluid intercontinental logistics flow. Highlight tactile fabric textures, pristine thread work, and grand distribution systems.",
          photographyStyle: language === 'bengali' ?
            "উষ্ণ এবং প্রাকৃতিক আলো, যেখানে পোশাকের সূক্ষ্ম সুতা ও উন্নত ফাইবার টেক্সচার ফুটে ওঠে। বন্দরে লোড হতে থাকা শিপিং কন্টেইনার এবং প্রফেশনাল টিমওয়ার্ক।" :
            "Warm, natural golden hour lighting capturing precise stitch lines, spinning spindles, and massive automated cargo loading. High-contrast, candid shots with architectural precision.",
          categories: [
            {
              title: language === 'bengali' ? "১. ফেব্রিক ও সুতার কারিগরি (Tactile Fabrics)" : "1. Fabric & Loom Artistry",
              description: language === 'bengali' ?
                "প্রিমিয়াম নিটওয়্যার ফেব্রিকস, আধুনিক সেলাইয়ের নিখুঁত ক্লোজআপ এবং টেক্সটাইলের বুনন শৈলী।" :
                "Macro details of premium yarn, organic fibers under production, and precise sewing loops in motion.",
              keywords: ["Macro fabrics", "Cotton spindles", "Thread texture", "Sewing precise"]
            },
            {
              title: language === 'bengali' ? "২. লজিস্টিকস ও গ্লোবাল কার্গো (Logistics Flow)" : "2. Global Cargo Velocity",
              description: language === 'bengali' ?
                "সমুদ্রের বুক চিরে চলা শিপিং কন্টেইনার ভেসেল, বন্দর ও লজিস্টিকস ডিস্ট্রিবিউশন হাবের জীবন্ত ছবি।" :
                "Stately shots of container ships departing deepwater ports, cargo hubs, and active logistics fleets.",
              keywords: ["Vessel dispatches", "Container harbor", "Global trade lanes", "Strategic transit"]
            },
            {
              title: language === 'bengali' ? "৩. কমপ্লায়েন্ট কারখানার কাজের পরিবেশ (Ethical RMG)" : "3. Ethical RMG Production",
              description: language === 'bengali' ?
                "আমাদের গ্রিন ফ্যাক্টরি এবং আধুনিক পরিবেশে দক্ষ কর্মীদের একাগ্রতা ও পেশাদারিত্বের Candid ছবি।" :
                "Bright, spacious, carbon-neutral manufacturing floors with safe, compliant, and highly skilled RMG specialists.",
              keywords: ["Green certified factory", "Apparel specialists", "Worker compliance", "Quality inspections"]
            }
          ]
        },
        logoSymbolType: 'star',
        logoLetterMark: "R"
      };
      setBrand(redBird);
    }
  };

  // Trigger Gemini AI Brand Guideline Generator
  const generateBrandWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await authenticatedFetch('/api/generate-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: brand.companyName,
          description: brand.description,
          tone: brand.brandVoice.tone,
          language: language
        })
      });

      if (!response.ok) {
        throw new Error("AI Server failed to respond.");
      }

      const generatedData = await response.json();
      
      // Preserve user selections of Logo symbol type and lettermark
      setBrand({
        ...generatedData,
        logoSymbolType: brand.logoSymbolType || 'tricircle',
        logoLetterMark: brand.logoLetterMark || brand.companyName.charAt(0)
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(language === 'bengali' ? "এআই জেনারেশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।" : "AI Brand generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save brand guideline to database and local storage
  const handleSave = async () => {
    setSaveStatus('saving');
    const success = await saveBrandGuideline(brand);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Trigger Multi-page PDF Book Exporter
  const downloadBrandBookPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const sections = [
        'brand-section-overview', 
        'brand-section-logo', 
        'brand-section-colors', 
        'brand-section-typography', 
        'brand-section-copywriting',
        'brand-section-imagery',
        'branding-collateral-section'
      ];
      let pageAdded = false;

      for (const sectionId of sections) {
        const secEl = document.getElementById(sectionId);
        if (secEl) {
          if (pageAdded) {
            doc.addPage();
          }

          const canvas = await html2canvas(secEl, {
            scale: 2, // Double resolution for ultra crispness
            useCORS: true,
            backgroundColor: '#FFFFFF',
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          let heightToUse = imgHeight;
          let widthToUse = imgWidth;
          if (imgHeight > pageHeight - 24) {
            heightToUse = pageHeight - 24;
            widthToUse = (canvas.width * heightToUse) / canvas.height;
          }

          const xOffset = (imgWidth - widthToUse) / 2;

          // Header Branding Band
          doc.setFillColor(33, 37, 41); // Slate charcoal
          doc.rect(0, 0, 210, 8, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text(`${brand.companyName.toUpperCase()} - BRAND GUIDELINES`, 10, 5);

          // Embed Screenshot content
          doc.addImage(imgData, 'PNG', xOffset, 12, widthToUse, heightToUse);

          // Footer Branding Band
          doc.setFillColor(243, 115, 33); // Energy Orange
          doc.rect(0, 290, 210, 7, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.text('GENERATED BY RED BIRD BRAND STUDIO', 10, 294.5);
          doc.text('CONFIDENTIAL & OFFICIAL', 160, 294.5);

          pageAdded = true;
        }
      }

      const fileName = `${brand.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Brand_Book.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert(language === 'bengali' ? "পিডিএফ বুক তৈরি করা যায়নি।" : "Failed to compile PDF Brand Book.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to copy values to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Conversions for Hex color swatches
  const getRgbFromHex = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  const getCmykFromHex = (hex: string) => {
    const rgb = hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => r + r + g + g + b + b);
    const r = parseInt(rgb.substring(1,3), 16) / 255;
    const g = parseInt(rgb.substring(3,5), 16) / 255;
    const b = parseInt(rgb.substring(5,7), 16) / 255;
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '0%, 0%, 0%, 100%';

    const k = 1 - Math.max(r, g, b);
    if (k === 1) return '0%, 0%, 0%, 100%';

    const c = Math.round(((1 - r - k) / (1 - k)) * 100);
    const m = Math.round(((1 - g - k) / (1 - k)) * 100);
    const y = Math.round(((1 - b - k) / (1 - k)) * 100);
    const kk = Math.round(k * 100);

    return `${c}%, ${m}%, ${y}%, ${kk}%`;
  };

  // Localization Dictionary
  const ui = {
    title: language === 'bengali' ? "করপোরেট ব্র্যান্ড নির্দেশিকা স্টুডিও" : "Corporate Brand Identity Studio",
    subtitle: language === 'bengali' ? "আপনার কোম্পানির লোগো, রঙের প্যালেট এবং সামগ্রিক ব্র্যান্ড নির্দেশিকা তৈরি ও সংরক্ষণ করুন।" : "Design, analyze, and compile production-ready brand guideline books.",
    presetTitle: language === 'bengali' ? "তাত্ক্ষণিক প্রি-সেট লোড করুন" : "Quick Presets Launcher",
    btnHanwhaBn: "হানওয়া গ্রুপ (বাংলা)",
    btnHanwhaEn: "Hanwha Group (ENG)",
    btnRedBird: "Red Bird Int.",
    editorTitle: language === 'bengali' ? "ব্র্যান্ড কনফিগারেটর" : "Brand Identity Configurator",
    compNameLabel: language === 'bengali' ? "কোম্পানির নাম:" : "Company Name:",
    taglineLabel: language === 'bengali' ? "ব্র্যান্ড স্লোগান (ট্যাগলাইন):" : "Brand Tagline (Slogan):",
    descLabel: language === 'bengali' ? "কোম্পানির বিবরণ ও লক্ষ্য:" : "Company Description / Mission:",
    toneLabel: language === 'bengali' ? "ব্র্যান্ডের কণ্ঠস্বর (ভয়েস টোন):" : "Brand Voice Tone:",
    logoSettings: language === 'bengali' ? "লোগো কনফিগারেশন" : "Vector Logo Configuration",
    logoSymbolTypeLabel: language === 'bengali' ? "লোগো প্রতীক ধরণ:" : "Vector Symbol Type:",
    logoInitialLabel: language === 'bengali' ? "লোগো ইনিশিয়াল (১টি অক্ষর):" : "Logo Initial Letter:",
    colorSettings: language === 'bengali' ? "ব্র্যান্ড কালারস" : "Brand Color Selection",
    primaryColor: language === 'bengali' ? "প্রধান রং (Primary):" : "Primary Brand Color:",
    secondaryColor: language === 'bengali' ? "সহকারী রং (Secondary):" : "Secondary Brand Color:",
    accentColor: language === 'bengali' ? "উচ্চারণ রং (Accent):" : "Accent Color:",
    fontSettings: language === 'bengali' ? "টাইপোগ্রাফি জোড়" : "Typography Pairings",
    headingFontLabel: language === 'bengali' ? "শিরোনাম ফন্ট (Headings):" : "Heading Typeface:",
    bodyFontLabel: language === 'bengali' ? "মূল টেক্সট ফন্ট (Body):" : "Body Typeface:",
    btnGenerateAI: language === 'bengali' ? "এআই দিয়ে ব্র্যান্ড গাইডলাইন লিখুন" : "Generate Core Copy with AI",
    btnSave: language === 'bengali' ? "সংরক্ষণ করুন" : "Save Brand Book",
    btnDownloadPdf: language === 'bengali' ? "পিডিএফ বুক ডাউনলোড করুন" : "Download PDF Brand Book",
    previewTitle: language === 'bengali' ? "ব্র্যান্ড বুক লাইভ প্রিভিউ" : "Corporate Brand Book (Live)",
    navOverview: language === 'bengali' ? "১. পরিচয় ও লক্ষ্য" : "1. Identity & Voice",
    navLogo: language === 'bengali' ? "২. লোগো গাইডলাইন" : "2. Logo System",
    navColors: language === 'bengali' ? "৩. রঙ নির্দেশিকা" : "3. Color Palette",
    navTypo: language === 'bengali' ? "৪. টাইপোগ্রাফি" : "4. Typography",
    navCopy: language === 'bengali' ? "৫. কপিরাইটিং ডেক্স" : "5. Brand Copy",
    navImagery: language === 'bengali' ? "৬. ইমেজারি গাইড" : "6. Brand Imagery",
    personalityTitle: language === 'bengali' ? "ব্র্যান্ড ব্যক্তিত্ব (Personality)" : "Brand Personality Traits",
    voiceTitle: language === 'bengali' ? "কণ্ঠস্বর ও প্রকাশ ভঙ্গি" : "Tone of Voice",
    dosLabel: language === 'bengali' ? "যা করবেন (Dos)" : "Dos (Best Practices)",
    dontsLabel: language === 'bengali' ? "যা করবেন না (Don'ts)" : "Don'ts (To Avoid)",
    logoConceptTitle: language === 'bengali' ? "লোগো প্রতীক এবং জ্যামিতিক তাৎপর্য" : "Logo Symbol & Visual Concept",
    correctUsage: language === 'bengali' ? "অনুমোদিত ব্যবহার (Correct DO)" : "Approved Usage (DO)",
    incorrectUsage: language === 'bengali' ? "নিষিদ্ধ বিকৃতি (Incorrect DON'T)" : "Prohibited Usage (DON'T)",
    hexCopied: "Hex copied!",
    rgbCopied: "RGB copied!",
    cmykCopied: "CMYK copied!",
    typoTitle: language === 'bengali' ? "টাইপোগ্রাফি কাঠামোর যৌক্তিকতা" : "Typography Architecture",
    typoSandbox: language === 'bengali' ? "টাইপোগ্রাফি টেস্টিং স্যান্ডবক্স" : "Interactive Specimen Sandbox",
    typewriterPlaceholder: language === 'bengali' ? "টাইপ করে ফন্ট টেস্ট করুন..." : "Type custom text to test font pairings...",
    copywritingDeskTitle: language === 'bengali' ? "কপিরাইটিং এবং বিপণন বার্তা নমুনা" : "Generated Copywriting & Slogans",
    newsletterTitle: language === 'bengali' ? "অফিসিয়াল নিউজলেটার সূচনা" : "Corporate Newsletter Intro",
    alternativeTaglines: language === 'bengali' ? "বিকল্প ট্যাগলাইন সমূহ" : "Alternative Creative Taglines",
    socialPostTitle: language === 'bengali' ? "রেডি-টু-পাবলিশ সোশ্যাল মিডিয়া পোস্ট" : "Ready-to-Publish Social Media Post"
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      
      {/* Top Header Panel */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <a href="#home" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">{language === 'bengali' ? "প্রধান ওয়েবসাইট" : "Homepage"}</span>
            </a>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">{ui.title}</h1>
                <p className="text-xs text-slate-400 font-sans">{ui.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Quick Controls & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setLanguage('bengali')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'bengali' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  language === 'english' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ENGLISH
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {saveStatus === 'success' ? (language === 'bengali' ? "সংরক্ষিত!" : "Saved!") : ui.btnSave}
              </span>
            </button>

            <button
              onClick={downloadBrandBookPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? (language === 'bengali' ? "তৈরি হচ্ছে..." : "Compiling...") : ui.btnDownloadPdf}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Preset Hub */}
      <div className="bg-slate-800 text-slate-200 py-3 border-b border-slate-700/60 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">{ui.presetTitle}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => applyPreset('hanwha_bn')}
              className="bg-slate-700/80 hover:bg-slate-700 hover:text-white transition-all text-[11px] font-bold py-1 px-3 rounded-md border border-slate-600"
            >
              {ui.btnHanwhaBn}
            </button>
            <button 
              onClick={() => applyPreset('hanwha_en')}
              className="bg-slate-700/80 hover:bg-slate-700 hover:text-white transition-all text-[11px] font-bold py-1 px-3 rounded-md border border-slate-600"
            >
              {ui.btnHanwhaEn}
            </button>
            <button 
              onClick={() => applyPreset('redbird')}
              className="bg-slate-700/80 hover:bg-slate-700 hover:text-white transition-all text-[11px] font-bold py-1 px-3 rounded-md border border-slate-600"
            >
              {ui.btnRedBird}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-8 px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Configurator / Form Editor */}
          <section className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center space-x-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <span>{ui.editorTitle}</span>
              </h2>
            </div>

            {/* Input fields */}
            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">{ui.compNameLabel}</label>
                <input
                  type="text"
                  value={brand.companyName}
                  onChange={(e) => setBrand({ ...brand, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans font-medium text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">{ui.taglineLabel}</label>
                <input
                  type="text"
                  value={brand.tagline}
                  onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans font-medium text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">{ui.descLabel}</label>
                <textarea
                  value={brand.description}
                  onChange={(e) => setBrand({ ...brand, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans font-medium text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">{ui.toneLabel}</label>
                <input
                  type="text"
                  value={brand.brandVoice.tone}
                  onChange={(e) => setBrand({ 
                    ...brand, 
                    brandVoice: { ...brand.brandVoice, tone: e.target.value } 
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans font-medium text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Logo Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-100 font-sans text-xs">
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center space-x-1.5 mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{ui.logoSettings}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.logoSymbolTypeLabel}</label>
                  <select
                    value={brand.logoSymbolType || 'tricircle'}
                    onChange={(e: any) => setBrand({ ...brand, logoSymbolType: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="tricircle">Tricircle (Hanwha)</option>
                    <option value="geometric">Geometric Diamond</option>
                    <option value="arc">Tech Arcs</option>
                    <option value="star">Premium Star</option>
                    <option value="bolt">Energy Bolt</option>
                    <option value="leaf">Eco Leaf</option>
                    <option value="wave">Fluid Waves</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.logoInitialLabel}</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={brand.logoLetterMark || ''}
                    onChange={(e) => setBrand({ ...brand, logoLetterMark: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center text-slate-800 font-bold"
                    placeholder="H"
                  />
                </div>
              </div>
            </div>

            {/* Color Swatch Editors */}
            <div className="space-y-4 pt-4 border-t border-slate-100 font-sans text-xs">
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center space-x-1.5 mb-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>{ui.colorSettings}</span>
              </h3>

              <div className="space-y-3">
                {/* Primary Color */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.primaryColor}</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={brand.colorPalette.primary.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          primary: { ...brand.colorPalette.primary, hex: e.target.value }
                        }
                      })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brand.colorPalette.primary.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          primary: { ...brand.colorPalette.primary, hex: e.target.value }
                        }
                      })}
                      className="flex-1 px-3 py-1 border border-slate-200 rounded-lg font-mono text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.secondaryColor}</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={brand.colorPalette.secondary.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          secondary: { ...brand.colorPalette.secondary, hex: e.target.value }
                        }
                      })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brand.colorPalette.secondary.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          secondary: { ...brand.colorPalette.secondary, hex: e.target.value }
                        }
                      })}
                      className="flex-1 px-3 py-1 border border-slate-200 rounded-lg font-mono text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.accentColor}</label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={brand.colorPalette.accent.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          accent: { ...brand.colorPalette.accent, hex: e.target.value }
                        }
                      })}
                      className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brand.colorPalette.accent.hex}
                      onChange={(e) => setBrand({
                        ...brand,
                        colorPalette: {
                          ...brand.colorPalette,
                          accent: { ...brand.colorPalette.accent, hex: e.target.value }
                        }
                      })}
                      className="flex-1 px-3 py-1 border border-slate-200 rounded-lg font-mono text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fonts Editor */}
            <div className="space-y-4 pt-4 border-t border-slate-100 font-sans text-xs">
              <h3 className="font-bold text-slate-800 tracking-tight flex items-center space-x-1.5 mb-2">
                <Type className="w-4 h-4 text-emerald-500" />
                <span>{ui.fontSettings}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.headingFontLabel}</label>
                  <select
                    value={brand.typography.headingFont}
                    onChange={(e: any) => setBrand({
                      ...brand,
                      typography: { ...brand.typography, headingFont: e.target.value }
                    })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Fira Code">Fira Code</option>
                    <option value="Inter">Inter (Sans)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">{ui.bodyFontLabel}</label>
                  <select
                    value={brand.typography.bodyFont}
                    onChange={(e: any) => setBrand({
                      ...brand,
                      typography: { ...brand.typography, bodyFont: e.target.value }
                    })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="system-ui">System Sans</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Call to Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={generateBrandWithAI}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all text-white py-3 rounded-xl font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isGenerating ? (language === 'bengali' ? "এআই লিখছে..." : "Generating Copy...") : ui.btnGenerateAI}</span>
              </button>
            </div>
          </section>

          {/* Right Panel: The Interactive Brand Book Output */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* Quick Internal Navigation Tab Bar */}
            <div className="flex bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs overflow-x-auto gap-1">
              {([
                { id: 'overview', label: ui.navOverview },
                { id: 'logo', label: ui.navLogo },
                { id: 'colors', label: ui.navColors },
                { id: 'typography', label: ui.navTypo },
                { id: 'copywriting', label: ui.navCopy },
                { id: 'imagery', label: ui.navImagery }
              ]).map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveSection(nav.id);
                    document.getElementById(`brand-section-${nav.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                    activeSection === nav.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {nav.label}
                </button>
              ))}
            </div>

            {/* Master Page-Scroll Layout Wrapper */}
            <div className="space-y-12" id="brand-book-content-container">
              
              {/* SECTION 1: Overview & Identity */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden text-slate-800"
                id="brand-section-overview"
              >
                {/* Clean design watermarks */}
                <div className="absolute top-0 right-0 h-2 w-full flex">
                  <div className="flex-1" style={{ backgroundColor: brand.colorPalette.primary.hex }} />
                  <div className="flex-1" style={{ backgroundColor: brand.colorPalette.secondary.hex }} />
                  <div className="flex-1" style={{ backgroundColor: brand.colorPalette.accent.hex }} />
                </div>

                <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-full">
                  {language === 'bengali' ? "অধ্যায় ১" : "CHAPTER I"} • {language === 'bengali' ? "কর্পোরেট পরিচয়" : "CORPORATE STATURE"}
                </span>

                {/* Company Name & Tagline Board */}
                <div className="mt-8 border-b border-slate-100 pb-8">
                  <h1 
                    className="text-4xl md:text-5xl font-black tracking-tight text-slate-900" 
                    style={{ fontFamily: brand.typography.headingFont }}
                  >
                    {brand.companyName}
                  </h1>
                  <p 
                    className="text-lg md:text-xl font-medium mt-3 italic" 
                    style={{ color: brand.colorPalette.primary.hex, fontFamily: brand.typography.headingFont }}
                  >
                    “{brand.tagline}”
                  </p>
                </div>

                {/* Mission/Description Text block */}
                <div className="mt-8 space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block">
                    {language === 'bengali' ? "পরিচয় ও লক্ষ্য বিবরণী" : "Mission & Strategic Stance"}
                  </span>
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed font-sans font-medium">
                    {brand.description}
                  </p>
                </div>

                {/* Personality Bento Cards */}
                <div className="mt-10 space-y-3">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block">
                    {ui.personalityTitle}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {brand.brandPersonality.map((trait, idx) => (
                      <div 
                        key={idx} 
                        className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center hover:scale-105 transition-transform duration-200 cursor-default"
                        style={{ borderLeft: `3px solid ${brand.colorPalette.primary.hex}` }}
                      >
                        <span className="text-xs font-bold text-slate-700 font-sans block">{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Voice Tone Dos & Don'ts */}
                <div className="mt-10 border-t border-slate-100 pt-8 space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block">
                    {ui.voiceTitle}
                  </span>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans italic bg-indigo-50/50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                    "{brand.brandVoice.tone}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Dos */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                      <h4 className="text-xs font-bold tracking-wider text-emerald-800 uppercase flex items-center space-x-1.5 mb-3 font-sans">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>{ui.dosLabel}</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
                        {brand.brandVoice.dos.map((doItem, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{doItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Donts */}
                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5">
                      <h4 className="text-xs font-bold tracking-wider text-rose-800 uppercase flex items-center space-x-1.5 mb-3 font-sans">
                        <Check className="w-4 h-4 text-rose-400 rotate-45" />
                        <span>{ui.dontsLabel}</span>
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-600 leading-relaxed font-sans">
                        {brand.brandVoice.donts.map((dontItem, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{dontItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 2: Logo Guidelines */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-8"
                id="brand-section-logo"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-full">
                      {language === 'bengali' ? "অধ্যায় ২" : "CHAPTER II"} • {language === 'bengali' ? "লোগো সিস্টেম" : "VISUAL LOGO SYSTEM"}
                    </span>
                    <h2 
                      className="text-2xl font-bold text-slate-900 tracking-tight mt-3"
                      style={{ fontFamily: brand.typography.headingFont }}
                    >
                      {language === 'bengali' ? "কর্পোরেট প্রতীক ও লোগো" : "Corporate Logo Guidelines"}
                    </h2>
                  </div>

                  <LogoSymbol 
                    type={brand.logoSymbolType || 'tricircle'} 
                    primaryColor={brand.colorPalette.primary.hex} 
                    secondaryColor={brand.colorPalette.secondary.hex} 
                    accentColor={brand.colorPalette.accent.hex} 
                    size={64} 
                    letterMark={brand.logoLetterMark}
                  />
                </div>

                {/* Concept and drawing */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50 rounded-2xl p-6">
                  <div className="md:col-span-8 space-y-3">
                    <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">
                      {ui.logoConceptTitle}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                      {brand.logoGuidelines.concept}
                    </p>
                  </div>
                  <div className="md:col-span-4 flex items-center justify-center bg-white border rounded-xl p-4 shadow-xs">
                    <LogoSymbol 
                      type={brand.logoSymbolType || 'tricircle'} 
                      primaryColor={brand.colorPalette.primary.hex} 
                      secondaryColor={brand.colorPalette.secondary.hex} 
                      accentColor={brand.colorPalette.accent.hex} 
                      size={100} 
                      letterMark={brand.logoLetterMark}
                    />
                  </div>
                </div>

                {/* Correct vs Incorrect board */}
                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block">
                    {language === 'bengali' ? "লোগো ব্যবহারের নিয়মাবলী" : "Strict Logo Correctness Matrix"}
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Approved DO */}
                    <div className="border border-emerald-200 rounded-2xl p-5 bg-white relative overflow-hidden shadow-xs">
                      <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                        {ui.correctUsage}
                      </div>
                      <div className="h-28 flex items-center justify-center border border-dashed rounded-lg bg-slate-50/50 mb-4">
                        <LogoSymbol 
                          type={brand.logoSymbolType || 'tricircle'} 
                          primaryColor={brand.colorPalette.primary.hex} 
                          secondaryColor={brand.colorPalette.secondary.hex} 
                          accentColor={brand.colorPalette.accent.hex} 
                          size={70} 
                          letterMark={brand.logoLetterMark}
                        />
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600 font-sans">
                        {brand.logoGuidelines.usageDos.map((doItem, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{doItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prohibited DONT */}
                    <div className="border border-rose-200 rounded-2xl p-5 bg-white relative overflow-hidden shadow-xs">
                      <div className="absolute top-2 right-2 bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                        {ui.incorrectUsage}
                      </div>
                      {/* Logo stretched or colored incorrectly */}
                      <div className="h-28 flex items-center justify-center border border-dashed rounded-lg bg-rose-50/10 mb-4">
                        <LogoSymbol 
                          type={brand.logoSymbolType || 'tricircle'} 
                          primaryColor="#FF00FF" 
                          secondaryColor="#00FFFF" 
                          accentColor="#FFFF00" 
                          size={70} 
                          className="transform rotate-45 scale-x-150"
                        />
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600 font-sans">
                        {brand.logoGuidelines.usageDonts.map((dontItem, idx) => (
                          <li key={idx} className="flex items-start space-x-1.5">
                            <span className="text-rose-400 font-bold">✗</span>
                            <span>{dontItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>


              {/* SECTION 3: Color Palette guidelines */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-8"
                id="brand-section-colors"
              >
                <div className="space-y-1 border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-full">
                    {language === 'bengali' ? "অধ্যায় ৩" : "CHAPTER III"} • {language === 'bengali' ? "রঙের তালিকা" : "COLOR PSYCHOLOGY & PALETTE"}
                  </span>
                  <h2 
                    className="text-2xl font-bold text-slate-900 tracking-tight mt-3"
                    style={{ fontFamily: brand.typography.headingFont }}
                  >
                    {language === 'bengali' ? "অনুমোদিত কালার প্যালেট" : "Approved Brand Color Palette"}
                  </h2>
                </div>

                {/* The Palette Swatches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Primary Color Card */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <div className="h-24 w-full relative group transition-transform" style={{ backgroundColor: brand.colorPalette.primary.hex }}>
                      <button 
                        onClick={() => copyToClipboard(brand.colorPalette.primary.hex, 'primary')}
                        className="absolute right-2 bottom-2 bg-white/20 backdrop-blur-md p-1.5 rounded-md text-white hover:bg-white/40 transition-colors"
                        title="Copy HEX"
                      >
                        {copiedField === 'primary' ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono">PRIMARY BRAND SWATCH</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{brand.colorPalette.primary.name}</h4>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-sans leading-relaxed min-h-[50px]">
                        {brand.colorPalette.primary.meaning}
                      </p>

                      <div className="border-t border-slate-100 pt-3 space-y-1 font-mono text-[10px] text-slate-600">
                        <div className="flex justify-between">
                          <span>HEX:</span>
                          <span className="font-bold select-all">{brand.colorPalette.primary.hex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RGB:</span>
                          <span className="font-bold select-all">rgb({getRgbFromHex(brand.colorPalette.primary.hex)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CMYK:</span>
                          <span className="font-bold select-all">{getCmykFromHex(brand.colorPalette.primary.hex)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Color Card */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <div className="h-24 w-full relative group transition-transform" style={{ backgroundColor: brand.colorPalette.secondary.hex }}>
                      <button 
                        onClick={() => copyToClipboard(brand.colorPalette.secondary.hex, 'secondary')}
                        className="absolute right-2 bottom-2 bg-white/20 backdrop-blur-md p-1.5 rounded-md text-white hover:bg-white/40 transition-colors"
                        title="Copy HEX"
                      >
                        {copiedField === 'secondary' ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">SECONDARY CORPORATE BRAND</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{brand.colorPalette.secondary.name}</h4>
                      </div>

                      <p className="text-xs text-slate-500 font-sans leading-relaxed min-h-[50px]">
                        {brand.colorPalette.secondary.meaning}
                      </p>

                      <div className="border-t border-slate-100 pt-3 space-y-1 font-mono text-[10px] text-slate-600">
                        <div className="flex justify-between">
                          <span>HEX:</span>
                          <span className="font-bold select-all">{brand.colorPalette.secondary.hex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RGB:</span>
                          <span className="font-bold select-all">rgb({getRgbFromHex(brand.colorPalette.secondary.hex)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CMYK:</span>
                          <span className="font-bold select-all">{getCmykFromHex(brand.colorPalette.secondary.hex)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accent Color Card */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs bg-white">
                    <div className="h-24 w-full relative group transition-transform" style={{ backgroundColor: brand.colorPalette.accent.hex }}>
                      <button 
                        onClick={() => copyToClipboard(brand.colorPalette.accent.hex, 'accent')}
                        className="absolute right-2 bottom-2 bg-white/20 backdrop-blur-md p-1.5 rounded-md text-white hover:bg-white/40 transition-colors"
                        title="Copy HEX"
                      >
                        {copiedField === 'accent' ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">HIGH-CONTRAST ACCENT</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{brand.colorPalette.accent.name}</h4>
                      </div>

                      <p className="text-xs text-slate-500 font-sans leading-relaxed min-h-[50px]">
                        {brand.colorPalette.accent.meaning}
                      </p>

                      <div className="border-t border-slate-100 pt-3 space-y-1 font-mono text-[10px] text-slate-600">
                        <div className="flex justify-between">
                          <span>HEX:</span>
                          <span className="font-bold select-all">{brand.colorPalette.accent.hex}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RGB:</span>
                          <span className="font-bold select-all">rgb({getRgbFromHex(brand.colorPalette.accent.hex)})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CMYK:</span>
                          <span className="font-bold select-all">{getCmykFromHex(brand.colorPalette.accent.hex)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contrast ratios analyzer */}
                <ContrastChecker 
                  primaryColor={brand.colorPalette.primary.hex} 
                  secondaryColor={brand.colorPalette.secondary.hex} 
                  accentColor={brand.colorPalette.accent.hex} 
                  language={language}
                />
              </div>


              {/* SECTION 4: Typography scale & Type specimens */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-8"
                id="brand-section-typography"
              >
                <div className="space-y-1 border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-full">
                    {language === 'bengali' ? "অধ্যায় ৪" : "CHAPTER IV"} • {language === 'bengali' ? "টাইপোগ্রাফি জোড়" : "TYPOGRAPHIC SCALE"}
                  </span>
                  <h2 
                    className="text-2xl font-bold text-slate-900 tracking-tight mt-3"
                    style={{ fontFamily: brand.typography.headingFont }}
                  >
                    {language === 'bengali' ? "টাইপোগ্রাফি এবং ফন্ট নির্বাচন" : "Approved Typographic Systems"}
                  </h2>
                </div>

                {/* Fonts explanations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-2xl items-start">
                  <div>
                    <h4 className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono mb-2">
                      {ui.typoTitle}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium">
                      {brand.typography.rationale}
                    </p>
                  </div>

                  {/* Visual Specimen indicators */}
                  <div className="space-y-3 bg-white border border-slate-200/60 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500 font-sans">HEADING FONT:</span>
                      <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{brand.typography.headingFont}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500 font-sans">BODY FONT:</span>
                      <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">{brand.typography.bodyFont}</span>
                    </div>
                  </div>
                </div>

                {/* Font Specimen list */}
                <div className="space-y-4">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block">
                    {language === 'bengali' ? "টাইপোগ্রাফিক স্কেল ও প্রোটোটাইপ" : "Approved Sizing Weights"}
                  </span>

                  <div className="border rounded-xl p-6 bg-slate-50/20 space-y-6">
                    <div className="border-b pb-4">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">H1 Title Display (Extra Bold)</span>
                      <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: brand.typography.headingFont }}>
                        Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj 0123
                      </h1>
                    </div>

                    <div className="border-b pb-4">
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">H2 Heading Medium (Semi Bold)</span>
                      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: brand.typography.headingFont }}>
                        The quick brown fox jumps over the lazy dog.
                      </h2>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">Body Text Regular (Medium)</span>
                      <p className="text-sm text-slate-600 leading-relaxed font-sans font-medium" style={{ fontFamily: brand.typography.bodyFont }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac pretium urna, sit amet interdum elit. Mauris tristique scelerisque lorem non aliquet.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Typography Sandbox */}
                <div className="bg-white border rounded-2xl p-6 shadow-xs font-sans">
                  <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono block mb-3">
                    {ui.typoSandbox}
                  </span>

                  <input 
                    type="text" 
                    value={typewriterText}
                    onChange={(e) => setTypewriterText(e.target.value)}
                    placeholder={ui.typewriterPlaceholder}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  />

                  {/* Rendering preview boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-xl p-4 bg-slate-50/50">
                      <span className="text-[9px] font-bold text-slate-400 font-mono block mb-2">HEADING FONT: {brand.typography.headingFont}</span>
                      <p className="text-lg font-black tracking-tight" style={{ fontFamily: brand.typography.headingFont }}>
                        {typewriterText || "Type something..."}
                      </p>
                    </div>

                    <div className="border rounded-xl p-4 bg-slate-50/50">
                      <span className="text-[9px] font-bold text-slate-400 font-mono block mb-2">BODY FONT: {brand.typography.bodyFont}</span>
                      <p className="text-sm font-medium leading-relaxed" style={{ fontFamily: brand.typography.bodyFont }}>
                        {typewriterText || "Type something..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>


              {/* Live Mockup Collateral Section */}
              <MockupCollateral 
                companyName={brand.companyName}
                tagline={brand.tagline}
                primaryColor={brand.colorPalette.primary.hex}
                secondaryColor={brand.colorPalette.secondary.hex}
                accentColor={brand.colorPalette.accent.hex}
                logoType={brand.logoSymbolType || 'tricircle'}
                letterMark={brand.logoLetterMark || ''}
                headingFont={brand.typography.headingFont}
                bodyFont={brand.typography.bodyFont}
                language={language}
              />


              {/* SECTION 5: Copywriting examples */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm space-y-8"
                id="brand-section-copywriting"
              >
                <div className="space-y-1 border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono bg-indigo-50 px-2.5 py-1 rounded-full">
                    {language === 'bengali' ? "অধ্যায় ৫" : "CHAPTER V"} • {language === 'bengali' ? "কপিরাইটিং ডেক্স" : "MARKETING COPYWRITING DESK"}
                  </span>
                  <h2 
                    className="text-2xl font-bold text-slate-900 tracking-tight mt-3"
                    style={{ fontFamily: brand.typography.headingFont }}
                  >
                    {ui.copywritingDeskTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left block: Social media post and alternative taglines */}
                  <div className="md:col-span-7 space-y-6">
                    {/* Social Post */}
                    <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs">
                      <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono block mb-3">
                        {ui.socialPostTitle}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium">
                        {brand.copywritingExamples.socialMedia}
                      </p>
                    </div>

                    {/* Alternative taglines */}
                    <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs">
                      <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono block mb-3">
                        {ui.alternativeTaglines}
                      </span>
                      <ul className="space-y-2 text-xs font-sans">
                        {brand.copywritingExamples.taglines.map((taglineItem, idx) => (
                          <li key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-semibold flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800">“{taglineItem}”</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right block: Newsletter Intro */}
                  <div className="md:col-span-5 space-y-6">
                    <div className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs min-h-[300px] flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono block mb-3">
                          {ui.newsletterTitle}
                        </span>
                        <div className="border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                            {brand.copywritingExamples.newsletterIntro}
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex items-center space-x-3 mt-4">
                        <div className="bg-indigo-50 p-1.5 rounded-full">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 font-sans">COMMUNICATION STANDARD</p>
                          <p className="text-[8px] text-slate-400 font-mono">CODE: COM_GUIDE_V2.0</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 6: Brand Imagery & Art Direction Guidelines */}
              <div 
                className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden text-slate-800"
                id="brand-section-imagery"
              >
                {/* Clean design watermarks */}
                <div className="absolute top-0 right-0 h-2 w-full flex">
                  <div className="h-full flex-1" style={{ backgroundColor: brand.colorPalette.primary.hex }} />
                  <div className="h-full flex-1" style={{ backgroundColor: brand.colorPalette.secondary.hex }} />
                  <div className="h-full flex-1" style={{ backgroundColor: brand.colorPalette.accent.hex }} />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6 mb-8 mt-4">
                  <div>
                    <span className="text-xs font-black tracking-wider text-slate-400 font-mono block mb-1">SECTION 06</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans uppercase">
                      {language === 'bengali' ? "৬. ক্রিয়েটিভ ইমেজারি ও ফটোগ্রাফি গাইডলাইন" : "6. Creative Imagery & Photography Direction"}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Camera className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-600 font-mono">ART_DIRECTION_V1.1</span>
                  </div>
                </div>

                {/* Mood Description & Art Direction parameters */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-sm font-black tracking-widest text-slate-900 uppercase font-sans">
                      {language === 'bengali' ? "ফটোগ্রাফি মেজাজ ও পরিবেশ (Visual Mood)" : "Visual Mood & Environmental Feel"}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                      {getImageryGuidelines(brand, language).moodDescription}
                    </p>
                    
                    <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-800 mb-2 font-sans">
                        {language === 'bengali' ? "ফটোগ্রাফি স্টাইল ও ফ্রেম প্যারামিটার:" : "Camera & Frame Parameters:"}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {getImageryGuidelines(brand, language).photographyStyle}
                      </p>
                    </div>
                  </div>

                  {/* Visual Art Direction Box: Color Palette Harmony */}
                  <div className="lg:col-span-5 border border-slate-200/80 rounded-2xl p-5 bg-white shadow-xs">
                    <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase font-mono block mb-3">
                      {language === 'bengali' ? "কালার টেম্পারেচার ভারসাম্য" : "Chromatic Palette Integration"}
                    </span>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {language === 'bengali' 
                        ? "ব্র্যান্ডের ফটোগ্রাফিতে অবশ্যই আমাদের অফিসিয়াল রঙের আধিপত্য বা সূক্ষ্ম উপস্থিতি থাকতে হবে।" 
                        : "Brand photos should subtly anchor or express our official corporate color accents in natural ways."}
                    </p>
                    
                    <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex -space-x-3">
                        <div className="w-8 h-8 rounded-full border border-white" style={{ backgroundColor: brand.colorPalette.primary.hex }} />
                        <div className="w-8 h-8 rounded-full border border-white" style={{ backgroundColor: brand.colorPalette.secondary.hex }} />
                        <div className="w-8 h-8 rounded-full border border-white" style={{ backgroundColor: brand.colorPalette.accent.hex }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">HARMONY: COMPLIANT</span>
                    </div>

                    <div className="mt-4 space-y-2 text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>{language === 'bengali' ? "সরাসরি সানফ্লেয়ার (Sunflare):" : "Sunflare Contrast:"}</span>
                        <span className="font-semibold text-slate-700">30% Max</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'bengali' ? "ছায়ার গভীরতা (Shadow depth):" : "Shadow Deepness:"}</span>
                        <span className="font-semibold text-slate-700">Medium Soft</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Imagery Categories Rendering */}
                <h3 className="text-xs font-black tracking-widest text-slate-900 uppercase font-sans mb-4">
                  {language === 'bengali' ? "অনুমোদিত ক্রিয়েটিভ ক্যাটাগরি সমূহ" : "Approved Imagery Categories"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {getImageryGuidelines(brand, language).categories.map((cat, index) => (
                    <div 
                      key={index}
                      className="border border-slate-200/80 hover:border-indigo-100 transition-all rounded-2xl p-5 bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                          <Image className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-2 font-sans">{cat.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">{cat.description}</p>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-bold text-slate-400 font-mono uppercase block mb-1.5">
                          {language === 'bengali' ? "এআই কিওয়ার্ড ট্যাগস:" : "AI Prompt Keywords:"}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cat.keywords.map((kw, kwIdx) => (
                            <span 
                              key={kwIdx}
                              className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Prompt Generator Copyboard */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
                    <Sparkles className="w-48 h-48 text-indigo-400" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm font-bold tracking-wider uppercase font-sans">
                        {language === 'bengali' ? "এআই ইমেজ জেনারেশন প্রম্পট স্যান্ডবক্স" : "AI Image Prompt Copyboard"}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      {language === 'bengali' 
                        ? "ব্র্যান্ডের সাথে নিখুঁতভাবে সামঞ্জস্যপূর্ণ ইমেজ তৈরি করতে নিচের অটো-কনফিগারড প্রম্পটটি কপি করে এআই ইমেজ জেনারেটরে ব্যবহার করুন।" 
                        : "Use this automated prompt block in any state-of-the-art AI image generator to produce assets that perfectly align with your brand standards."}
                    </p>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4 mt-2">
                      <p className="text-xs text-slate-300 font-mono select-all leading-relaxed">
                        {`"A professional, high-end, editorial photograph representing ${brand.companyName}, capturing a scene of ${getImageryGuidelines(brand, language).categories[0].title}, natural golden-hour lighting on 35mm lens, depth of field, rich details, color accents matching ${brand.colorPalette.primary.hex} and ${brand.colorPalette.secondary.hex}, realistic, brand compliant --ar 16:9"`}
                      </p>
                      <button
                        onClick={() => copyToClipboard(
                          `A professional, high-end, editorial photograph representing ${brand.companyName}, capturing a scene of ${getImageryGuidelines(brand, language).categories[0].title}, natural golden-hour lighting on 35mm lens, depth of field, rich details, color accents matching ${brand.colorPalette.primary.hex} and ${brand.colorPalette.secondary.hex}, realistic, brand compliant --ar 16:9`,
                          'imagery-prompt'
                        )}
                        className="bg-slate-800 hover:bg-slate-700 transition-colors p-2 rounded-lg text-slate-300 hover:text-white shrink-0"
                      >
                        {copiedField === 'imagery-prompt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

        </div>
      </main>

      {/* Corporate footer */}
      <footer className="bg-slate-900 text-slate-500 text-xs py-8 border-t border-slate-800 px-4 md:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white tracking-widest">RED BIRD BRANDING HUB</span>
            <span className="text-slate-700">|</span>
            <span>{language === 'bengali' ? "বাংলাদেশ রপ্তানি অংশীদার" : "Global RMG Export Hub"}</span>
          </div>
          <div className="text-[10px] text-slate-600 text-center sm:text-right font-mono">
            <span>sumon.hanwha@gmail.com • APPROVED BRAND STANDARD PROTOCOL © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
