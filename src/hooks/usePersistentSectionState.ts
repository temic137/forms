import { useState, useEffect } from 'react';

interface SectionStates {
  [key: string]: boolean;
}

export function usePersistentSectionState(
  defaultStates: SectionStates,
  storageKey: string = 'builder-section-states'
) {
  const [expandedSections, setExpandedSections] = useState<SectionStates>(defaultStates);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setExpandedSections({ ...defaultStates, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load section states:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage when states change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(expandedSections));
      } catch (error) {
        console.error('Failed to save section states:', error);
      }
    }
  }, [expandedSections, storageKey, isLoaded]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const setSection = (section: string, expanded: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: expanded,
    }));
  };

  return {
    expandedSections,
    toggleSection,
    setSection,
    isLoaded,
  };
}
