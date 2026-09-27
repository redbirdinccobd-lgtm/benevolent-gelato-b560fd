import React, { useState } from 'react';
import { LogoSymbol } from './LogoSymbol';
import { User, Mail, Phone, MapPin, Globe, Award, Sparkles } from 'lucide-react';

interface MockupCollateralProps {
  companyName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoType: 'tricircle' | 'geometric' | 'arc' | 'star' | 'bolt' | 'leaf' | 'wave';
  letterMark: string;
  headingFont: string;
  bodyFont: string;
  language: 'bengali' | 'english';
}

export const MockupCollateral: React.FC<MockupCollateralProps> = ({
  companyName,
  tagline,
  primaryColor,
  secondaryColor,
  accentColor,
  logoType,
  letterMark,
  headingFont,
  bodyFont,
  language
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'letterhead' | 'merch' | 'social'>('card');

  const text = {
    card: language === 'bengali' ? "বিজনেস কার্ড" : "Business Card",
    letterhead: language === 'bengali' ? "লেটারহেড" : "Letterhead",
    merch: language === 'bengali' ? "মার্চেন্ডাইজ" : "Merchandise Mocks",
    social: language === 'bengali' ? "সোশ্যাল ব্যানার" : "Social Cover",
    name: language === 'bengali' ? "সুমন হানওয়া" : "Sumon Hanwha",
    title: language === 'bengali' ? "প্রধান প্রযুক্তি কর্মকর্তা (CTO)" : "Chief Technology Officer (CTO)",
    phone: "+৮৮০ ১৭৯৯-হানওয়া",
    email: "sumon.hanwha@gmail.com",
    address: language === 'bengali' ? "গুলশান এভিনিউ, ঢাকা, বাংলাদেশ" : "Gulshan Avenue, Dhaka, Bangladesh",
    web: "www.hanwha-group.com",
    subject: language === 'bengali' ? "বিষয়: অফিসিয়াল কর্পোরেট প্রস্তাবনা" : "Subject: Official Corporate Proposal",
    letterBody: language === 'bengali' ? 
      "সম্মানিত গ্রাহক,\nহানওয়া গ্রুপের পক্ষ থেকে শুভেচ্ছা। আমরা আমাদের নতুন টেকসই সবুজ শক্তি প্রকল্পে আপনাকে আমন্ত্রণ জানাতে পেরে আনন্দিত। আমাদের উদ্ভাবনী সমাধানগুলো কার্বন নিঃসরণ কমাতে এবং একটি পরিষ্কার পৃথিবী গড়ে তুলতে সাহায্য করবে। আশা করি আমাদের এই প্রযুক্তিগত মেলবন্ধন আমাদের ব্যবসায়িক সম্পর্ককে আরও সুদৃঢ় করবে।" :
      "Dear Valued Partners,\nGreetings from Hanwha. We are proud to present our clean energy initiative, accelerating the global transition to sustainable infrastructures. Our engineering teams have developed high-efficiency solar modules designed to meet and exceed global energy standards. We look forward to a sustainable partnership.",
    signature: language === 'bengali' ? "পরিচালক, ব্র্যান্ডিং বিভাগ" : "Director, Branding Division"
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm overflow-hidden" id="branding-collateral-section">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-800 tracking-tight font-sans">
            {language === 'bengali' ? "রিয়েল-ওয়ার্ল্ড ব্র্যান্ড সিমুলেটর" : "Live Collateral Simulator"}
          </h3>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/60 p-1 rounded-lg">
          {(['card', 'letterhead', 'merch', 'social'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {text[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Mockup Canvas */}
      <div className="min-h-[340px] flex items-center justify-center p-4 bg-slate-100 rounded-xl border border-slate-200/50">
        
        {/* Business Card Preview */}
        {activeTab === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* Front Side */}
            <div 
              className="aspect-[1.75/1] rounded-xl shadow-md p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl"
              style={{ backgroundColor: secondaryColor, color: '#FFFFFF' }}
            >
              {/* Subtle design accents */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-25 blur-xl pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
              <div 
                className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-20 blur-lg pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />

              <div className="flex items-center space-x-2 z-10">
                <LogoSymbol 
                  type={logoType} 
                  primaryColor={primaryColor} 
                  secondaryColor="#FFFFFF" 
                  accentColor={accentColor} 
                  size={36} 
                />
                <div>
                  <h4 className="text-sm font-bold tracking-wider uppercase font-sans" style={{ fontFamily: headingFont }}>
                    {companyName.split(' ')[0]}
                  </h4>
                  <p className="text-[9px] opacity-75 font-sans truncate max-w-[160px]">{tagline}</p>
                </div>
              </div>

              <div className="z-10 border-t border-white/10 pt-3">
                <h5 className="text-sm font-semibold tracking-wide font-sans">{text.name}</h5>
                <p className="text-[10px] opacity-75 mb-2 font-sans">{text.title}</p>
                <div className="flex items-center space-x-1.5 text-[8px] opacity-90 font-sans mt-0.5">
                  <Mail className="w-2.5 h-2.5" />
                  <span>{text.email}</span>
                </div>
              </div>
            </div>

            {/* Back Side */}
            <div 
              className="aspect-[1.75/1] rounded-xl shadow-md p-5 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:shadow-xl"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${secondaryColor}30` }}
            >
              <div 
                className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-10 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
              <div 
                className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full opacity-10 pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />

              <LogoSymbol 
                type={logoType} 
                primaryColor={primaryColor} 
                secondaryColor={secondaryColor} 
                accentColor={accentColor} 
                size={54} 
                letterMark={letterMark}
              />
              <h4 className="text-sm font-bold mt-2 uppercase tracking-widest text-slate-800" style={{ fontFamily: headingFont }}>
                {companyName}
              </h4>
              <p className="text-[9px] text-slate-400 mt-1 font-sans text-center px-4 italic">{tagline}</p>
            </div>
          </div>
        )}

        {/* Letterhead Preview */}
        {activeTab === 'letterhead' && (
          <div className="bg-white w-full max-w-md aspect-[1/1.4] shadow-lg rounded-lg p-6 flex flex-col justify-between border border-slate-200 relative overflow-hidden text-slate-800 font-sans">
            {/* Header branding band */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1" style={{ backgroundColor: primaryColor }} />
              <div className="flex-1" style={{ backgroundColor: secondaryColor }} />
              <div className="flex-1" style={{ backgroundColor: accentColor }} />
            </div>

            {/* Letterhead Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mt-1">
              <div className="flex items-center space-x-2">
                <LogoSymbol 
                  type={logoType} 
                  primaryColor={primaryColor} 
                  secondaryColor={secondaryColor} 
                  accentColor={accentColor} 
                  size={32} 
                />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900" style={{ fontFamily: headingFont }}>{companyName}</h4>
                  <p className="text-[7px] text-slate-400">{tagline}</p>
                </div>
              </div>
              <div className="text-right text-[7px] text-slate-400 space-y-0.5">
                <div className="flex items-center justify-end space-x-1">
                  <Globe className="w-2 h-2" />
                  <span>{text.web}</span>
                </div>
                <div className="flex items-center justify-end space-x-1">
                  <MapPin className="w-2 h-2" />
                  <span>{text.address}</span>
                </div>
              </div>
            </div>

            {/* Letter Body */}
            <div className="flex-1 py-4 text-[9px] text-slate-600 leading-relaxed relative">
              {/* Subtle watermark in background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <LogoSymbol 
                  type={logoType} 
                  primaryColor={primaryColor} 
                  secondaryColor={secondaryColor} 
                  accentColor={accentColor} 
                  size={150} 
                />
              </div>

              <div className="flex justify-between text-[8px] font-semibold text-slate-400 mb-3">
                <span>Ref: HW-092/2026</span>
                <span>Date: {new Date().toLocaleDateString(language === 'bengali' ? 'bn-BD' : 'en-US')}</span>
              </div>

              <h5 className="font-bold text-slate-800 mb-2">{text.subject}</h5>
              <p className="whitespace-pre-line">{text.letterBody}</p>

              <div className="mt-8 text-right">
                <p className="font-semibold text-slate-800">{text.name}</p>
                <p className="text-[7px] text-slate-400">{text.signature}</p>
                {/* Simulated signature or seal */}
                <div className="inline-block mt-1 w-12 h-6 opacity-30 border border-dashed rounded flex items-center justify-center text-[6px]" style={{ borderColor: primaryColor, color: primaryColor }}>
                  SEAL Approved
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[7px] text-slate-400">
              <span>{text.phone} | {text.email}</span>
              <span className="font-semibold" style={{ color: primaryColor }}>{companyName} Brand Protected</span>
            </div>
          </div>
        )}

        {/* Merchandise Mocks (T-Shirt & Mug) */}
        {activeTab === 'merch' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
            {/* T-Shirt Mock */}
            <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
              <span className="absolute top-2 left-2 text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Premium Apparel</span>
              
              {/* Custom SVG T-Shirt Grid */}
              <div className="w-36 h-36 relative flex items-center justify-center">
                {/* SVG T-shirt silhouette */}
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  <path 
                    d="M 20 10 L 35 15 L 42 12 Q 50 16, 58 12 L 65 15 L 80 10 L 76 30 L 70 30 L 70 90 L 30 90 L 30 30 L 24 30 Z" 
                    fill={primaryColor} 
                    className="transition-colors duration-300"
                  />
                  {/* Sleeve/Collar stitch lines */}
                  <path d="M 35 15 L 30 30" stroke="#000" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.3" />
                  <path d="M 65 15 L 70 30" stroke="#000" strokeWidth="0.5" strokeDasharray="1 1" opacity="0.3" />
                  <path d="M 42 12 Q 50 16, 58 12" fill="none" stroke={secondaryColor} strokeWidth="1.5" opacity="0.6" />
                </svg>

                {/* Printed Logo overlay on chest */}
                <div className="absolute top-[32%] flex flex-col items-center scale-[0.6]">
                  <LogoSymbol 
                    type={logoType} 
                    primaryColor="#FFFFFF" 
                    secondaryColor={secondaryColor} 
                    accentColor={accentColor} 
                    size={40} 
                  />
                  <span className="text-[5px] font-bold tracking-widest text-white mt-0.5 uppercase">{companyName.split(' ')[0]}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-700 mt-2">{language === 'bengali' ? "ব্র্যান্ডেড পলো টি-শার্ট" : "Branded Premium Tee"}</p>
            </div>

            {/* Coffee Mug Mock */}
            <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
              <span className="absolute top-2 left-2 text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Merchandise</span>
              
              {/* Custom SVG Coffee Mug with handle */}
              <div className="w-32 h-32 relative flex items-center justify-center mt-2">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                  {/* Mug Handle */}
                  <path 
                    d="M 65 30 Q 82 30, 82 50 T 65 70" 
                    fill="none" 
                    stroke={accentColor} 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                  />
                  {/* Mug Body */}
                  <path 
                    d="M 25 20 L 65 20 Q 67 20, 67 23 L 65 80 Q 65 85, 60 85 L 30 85 Q 25 85, 25 80 Z" 
                    fill="#FFFFFF" 
                    stroke="#E2E8F0" 
                    strokeWidth="1"
                  />
                  {/* Mug Rim Shading */}
                  <ellipse cx="45" cy="20" rx="20" ry="2.5" fill="#E2E8F0" opacity="0.5" />
                  {/* Mug Inner Shading (brand secondary color accent inside!) */}
                  <ellipse cx="45" cy="20" rx="19.5" ry="2" fill={secondaryColor} />
                </svg>

                {/* Printed Logo on Mug front */}
                <div className="absolute top-[40%] left-[26%] flex flex-col items-center scale-[0.65]">
                  <LogoSymbol 
                    type={logoType} 
                    primaryColor={primaryColor} 
                    secondaryColor={secondaryColor} 
                    accentColor={accentColor} 
                    size={32} 
                  />
                  <span className="text-[5px] font-bold tracking-widest text-slate-800 mt-1 uppercase">{companyName.split(' ')[0]}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-700 mt-2">{language === 'bengali' ? "সিরামিক কফি মগ" : "Ceramic Brand Mug"}</p>
            </div>
          </div>
        )}

        {/* Social Media Linkedin Cover Banner */}
        {activeTab === 'social' && (
          <div className="bg-white w-full max-w-lg shadow-md rounded-xl overflow-hidden border border-slate-200">
            {/* The Cover Banner itself */}
            <div 
              className="w-full aspect-[3/1] relative flex items-center justify-between p-6 overflow-hidden"
              style={{ backgroundColor: secondaryColor }}
            >
              {/* Dynamic decorative vector waves in brand colors */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 transform translate-x-10 scale-125"
                style={{
                  background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 60%), radial-gradient(circle, ${accentColor}30 40%, transparent 80%)`
                }}
              />
              {/* Floating vector shapes matching the palette */}
              <div className="absolute right-4 top-4 w-12 h-12 rounded-full opacity-25 blur-sm" style={{ backgroundColor: primaryColor }} />
              <div className="absolute right-20 bottom-2 w-16 h-16 rounded-full opacity-20 blur-md" style={{ backgroundColor: accentColor }} />

              <div className="flex items-center space-x-3 z-10 text-white">
                <div className="bg-white p-2.5 rounded-lg shadow-sm">
                  <LogoSymbol 
                    type={logoType} 
                    primaryColor={primaryColor} 
                    secondaryColor={secondaryColor} 
                    accentColor={accentColor} 
                    size={36} 
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-wider uppercase font-sans text-white" style={{ fontFamily: headingFont }}>
                    {companyName}
                  </h4>
                  <p className="text-[8px] text-slate-300 font-sans tracking-wide mt-0.5 truncate max-w-[200px]">{tagline}</p>
                </div>
              </div>

              <div className="z-10 bg-white/10 backdrop-blur-xs px-2 py-1.5 rounded-md border border-white/10 text-[7px] text-white/90 font-sans text-right max-w-[120px] shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-400 inline-block mr-1" />
                <span>{language === 'bengali' ? "উদ্ভাবন ও টেকসই শক্তি" : "Shaping Clean Energy"}</span>
              </div>
            </div>

            {/* Profile Picture Mock below banner */}
            <div className="px-6 py-4 flex items-center justify-between bg-slate-50 border-t border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-300 -mt-10 overflow-hidden shadow-sm flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">{companyName}</h5>
                  <p className="text-[9px] text-slate-400">{language === 'bengali' ? "শিল্প প্রতিষ্ঠান • ১০,০০০+ কর্মী" : "Industrial Manufacturing • 10,000+ employees"}</p>
                </div>
              </div>
              <button className="bg-indigo-600 text-white px-3 py-1 text-[9px] font-bold rounded-full shadow-sm hover:bg-indigo-700 transition-colors">
                {language === 'bengali' ? "ফলো করুন" : "+ Follow"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
