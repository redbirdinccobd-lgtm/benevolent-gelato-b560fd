import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface AIMemory {
  id?: string;
  userId: string;
  category: 'preference' | 'rule' | 'fact' | 'interaction_pattern';
  content: string;
  context?: string;
  importance: number;
  updatedAt: string;
}

/**
 * Saves a new piece of knowledge to the AI's long-term memory.
 */
export const saveMemory = async (memory: Omit<AIMemory, 'userId' | 'updatedAt'>) => {
  if (!auth.currentUser) return null;

  try {
    const memoryData = {
      ...memory,
      userId: auth.currentUser.uid,
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'ai_memories'), memoryData);
    return { id: docRef.id, ...memoryData };
  } catch (error) {
    console.error('Error saving memory:', error);
    return null;
  }
};

/**
 * Retrieves relevant memories for the current user.
 */
export const getRelevantMemories = async (category?: string) => {
  if (!auth.currentUser) return [];

  try {
    let q = query(
      collection(db, 'ai_memories'),
      where('userId', '==', auth.currentUser.uid),
      limit(50)
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIMemory));
  } catch (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
};
