import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useRealtimeData = (selectedDate: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Format date from YYYY-MM-DD to DD-MM-YYYY
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return;
    const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

    setLoading(true);
    const docRef = doc(db, 'realtime', formattedDate);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to realtime data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  return { data, loading };
};
