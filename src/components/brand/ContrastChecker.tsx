import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';

interface ContrastCheckerProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  language: 'bengali' | 'english';
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  language
}) => {
  const [colorA, setColorA] = useState(primaryColor);
  const [colorB, setColorB] = useState('#FFFFFF');
  const [contrast, setContrast] = useState<number>(4.5);

  // Sync color selection when props change
  useEffect(() => {
    setColorA(primaryColor);
  }, [primaryColor]);

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Helper to calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  // Calculate contrast ratio
  useEffect(() => {
    try {
      const rgbA = hexToRgb(colorA);
      const rgbB = hexToRgb(colorB);
      const l1 = getLuminance(rgbA.r, rgbA.g, rgbA.b);
      const l2 = getLuminance(rgbB.r, rgbB.g, rgbB.b);
      const brightest = Math.max(l1, l2);
      const darkest = Math.min(l1, l2);
      const ratio = (brightest + 0.05) / (darkest + 0.05);
      setContrast(parseFloat(ratio.toFixed(2)));
    } catch (e) {
      setContrast(1.0);
    }
  }, [colorA, colorB]);

  const passesAA_Normal = contrast >= 4.5;
  const passesAA_Large = contrast >= 3.0;
  const passesAAA_Normal = contrast >= 7.0;
  const passesAAA_Large = contrast >= 4.5;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mt-6" id="brand-contrast-checker">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
        <Info className="w-5 h-5 text-indigo-500" />
        <h4 className="font-bold text-slate-800 tracking-tight font-sans">
          {language === 'bengali' ? "কালার কনট্রাস্ট ও অ্যাক্সেসিবিলিটি" : "WCAG Contrast & Accessibility Analyst"}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colors Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 font-sans">
              {language === 'bengali' ? "টেক্সট কালার (রঙ ১):" : "Text Color (A):"}
            </label>
            <div className="flex space-x-2">
              <input 
                type="color" 
                value={colorA} 
                onChange={(e) => setColorA(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
              <input 
                type="text" 
                value={colorA} 
                onChange={(e) => setColorA(e.target.value)}
                className="flex-1 px-3 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700"
              />
            </div>
            {/* Quick Palette shortcuts */}
            <div className="flex space-x-1.5 mt-2">
              <button onClick={() => setColorA(primaryColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: primaryColor }} title="Primary" />
              <button onClick={() => setColorA(secondaryColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: secondaryColor }} title="Secondary" />
              <button onClick={() => setColorA(accentColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: accentColor }} title="Accent" />
              <button onClick={() => setColorA('#FFFFFF')} className="w-5 h-5 rounded border border-slate-200 bg-white" title="White" />
              <button onClick={() => setColorA('#1E293B')} className="w-5 h-5 rounded border border-slate-200 bg-slate-800" title="Slate" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 font-sans">
              {language === 'bengali' ? "ব্যাকগ্রাউন্ড কালার (রঙ ২):" : "Background Color (B):"}
            </label>
            <div className="flex space-x-2">
              <input 
                type="color" 
                value={colorB} 
                onChange={(e) => setColorB(e.target.value)}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
              />
              <input 
                type="text" 
                value={colorB} 
                onChange={(e) => setColorB(e.target.value)}
                className="flex-1 px-3 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700"
              />
            </div>
            {/* Quick Palette shortcuts */}
            <div className="flex space-x-1.5 mt-2">
              <button onClick={() => setColorB(primaryColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: primaryColor }} title="Primary" />
              <button onClick={() => setColorB(secondaryColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: secondaryColor }} title="Secondary" />
              <button onClick={() => setColorB(accentColor)} className="w-5 h-5 rounded border border-slate-200" style={{ backgroundColor: accentColor }} title="Accent" />
              <button onClick={() => setColorB('#FFFFFF')} className="w-5 h-5 rounded border border-slate-200 bg-white" title="White" />
              <button onClick={() => setColorB('#1E293B')} className="w-5 h-5 rounded border border-slate-200 bg-slate-800" title="Slate" />
            </div>
          </div>
        </div>

        {/* Live Preview Specimen */}
        <div 
          className="border rounded-xl p-5 flex flex-col justify-between aspect-video md:aspect-auto"
          style={{ backgroundColor: colorB, color: colorA, borderColor: `${colorA}15` }}
        >
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-75 font-sans">
              {language === 'bengali' ? "পঠনযোগ্যতার নমুনা" : "Readability Sample"}
            </span>
            <h5 className="text-lg font-bold tracking-tight mt-1 leading-tight font-sans">
              {language === 'bengali' ? "আমরা টেকসই শক্তিতে বিশ্বাস করি" : "We power future transitions."}
            </h5>
          </div>
          <p className="text-xs opacity-85 leading-relaxed mt-2 font-sans">
            {language === 'bengali' ? 
              "আমাদের উদ্ভাবনী প্রযুক্তিগুলো উন্নত কার্বন নিঃসরণ হ্রাস সমাধান সরবরাহ করে।" : 
              "Our engineering delivers optimal carbon-neutral solutions globally."}
          </p>
          <div className="flex items-center space-x-2 mt-4 text-[10px] opacity-75 font-mono">
            <span>A: {colorA}</span>
            <span>•</span>
            <span>B: {colorB}</span>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-500 font-sans">
                {language === 'bengali' ? "কনট্রাস্ট রেশিও:" : "Contrast Ratio:"}
              </span>
              <button 
                onClick={() => {
                  const temp = colorA;
                  setColorA(colorB);
                  setColorB(temp);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Swap colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-black text-slate-800 font-mono">{contrast}:1</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                contrast >= 4.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {contrast >= 4.5 ? (language === 'bengali' ? "নিরাপদ" : "Safe") : (language === 'bengali' ? "ঝুঁকিপূর্ণ" : "Low Contrast")}
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-3 border-t border-slate-200/60 pt-3">
            {/* AA Regular */}
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-slate-500">{language === 'bengali' ? "AA লেভেল (সাধারণ টেক্সট):" : "WCAG AA (Normal Text):"}</span>
              <div className="flex items-center space-x-1">
                {passesAA_Normal ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className={`font-semibold ${passesAA_Normal ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passesAA_Normal ? (language === 'bengali' ? "পাস" : "Pass") : (language === 'bengali' ? "ফেল" : "Fail")}
                </span>
              </div>
            </div>

            {/* AAA Regular */}
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-slate-500">{language === 'bengali' ? "AAA লেভেল (সাধারণ টেক্সট):" : "WCAG AAA (Normal Text):"}</span>
              <div className="flex items-center space-x-1">
                {passesAAA_Normal ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className={`font-semibold ${passesAAA_Normal ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passesAAA_Normal ? (language === 'bengali' ? "পাস" : "Pass") : (language === 'bengali' ? "ফেল" : "Fail")}
                </span>
              </div>
            </div>

            {/* AA Large */}
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="text-slate-500">{language === 'bengali' ? "AA লেভেল (বড় টেক্সট):" : "WCAG AA (Large Text):"}</span>
              <div className="flex items-center space-x-1">
                {passesAA_Large ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className={`font-semibold ${passesAA_Large ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {passesAA_Large ? (language === 'bengali' ? "পাস" : "Pass") : (language === 'bengali' ? "ফেল" : "Fail")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
