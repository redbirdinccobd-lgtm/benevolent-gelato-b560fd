import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import { BrandGuideline } from '../types/brand';

const LOCAL_STORAGE_KEY = 'brand_guideline_studio_saved';

export const saveBrandGuideline = async (guideline: BrandGuideline): Promise<boolean> => {
  const cleanGuideline = {
    ...guideline,
    updatedAt: new Date().toISOString(),
    userEmail: auth?.currentUser?.email || 'anonymous'
  };

  // Always save to LocalStorage first as an instant fallback
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanGuideline));
  } catch (err) {
    console.error("Local storage save error:", err);
  }

  // Try saving to Firestore if available
  if (db) {
    const docId = guideline.companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `brand_guidelines/${docId}`;
    try {
      await setDoc(doc(db, 'brand_guidelines', docId), {
        ...cleanGuideline,
        updatedAt: Timestamp.now()
      });
      console.log("Saved brand guideline to Firestore at:", path);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  }

  return false;
};

export const loadSavedBrandGuideline = async (companyName?: string): Promise<BrandGuideline | null> => {
  // Try loading from Firestore first
  if (db && companyName) {
    const docId = companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const path = `brand_guidelines/${docId}`;
    try {
      const q = query(collection(db, 'brand_guidelines'), where('companyName', '==', companyName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        const brand: BrandGuideline = {
          companyName: docData.companyName,
          tagline: docData.tagline,
          description: docData.description,
          brandPersonality: docData.brandPersonality,
          brandVoice: docData.brandVoice,
          colorPalette: docData.colorPalette,
          typography: docData.typography,
          logoGuidelines: docData.logoGuidelines,
          copywritingExamples: docData.copywritingExamples,
          logoSymbolType: docData.logoSymbolType || 'tricircle',
          logoLetterMark: docData.logoLetterMark || '',
        };
        return brand;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  // Fallback to LocalStorage
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as BrandGuideline;
    }
  } catch (err) {
    console.error("Local storage load error:", err);
  }

  return null;
};
