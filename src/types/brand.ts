export interface ColorInfo {
  hex: string;
  name: string;
  meaning: string;
}

export interface BrandColorPalette {
  primary: ColorInfo;
  secondary: ColorInfo;
  accent: ColorInfo;
}

export interface BrandVoiceInfo {
  tone: string;
  dos: string[];
  donts: string[];
}

export interface TypographyInfo {
  headingFont: string;
  bodyFont: string;
  rationale: string;
}

export interface LogoGuidelinesInfo {
  concept: string;
  usageDos: string[];
  usageDonts: string[];
}

export interface CopywritingExamplesInfo {
  socialMedia: string;
  taglines: string[];
  newsletterIntro: string;
}

export interface ImageryCategory {
  title: string;
  description: string;
  keywords: string[];
}

export interface ImageryGuidelinesInfo {
  moodDescription: string;
  photographyStyle: string;
  categories: ImageryCategory[];
}

export interface BrandGuideline {
  id?: string;
  companyName: string;
  tagline: string;
  description: string;
  brandPersonality: string[];
  brandVoice: BrandVoiceInfo;
  colorPalette: BrandColorPalette;
  typography: TypographyInfo;
  logoGuidelines: LogoGuidelinesInfo;
  copywritingExamples: CopywritingExamplesInfo;
  imageryGuidelines?: ImageryGuidelinesInfo;
  logoSymbolType?: 'tricircle' | 'geometric' | 'arc' | 'star' | 'bolt' | 'leaf' | 'wave';
  logoLetterMark?: string;
  updatedAt?: string;
}
