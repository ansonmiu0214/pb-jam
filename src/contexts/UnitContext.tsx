import React, { createContext, useContext, useState, useCallback } from 'react';

export type Unit = 'km' | 'mi';

interface UnitContextType {
  unit: Unit;
  setUnit: (unit: Unit) => void;
  toggleUnit: () => void;
  convertDistance: (distance: number, fromUnit: Unit, toUnit: Unit) => number;
  formatDistance: (distance: number, fromUnit: Unit) => string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const useUnit = (): UnitContextType => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};

interface UnitProviderProps {
  children: React.ReactNode;
  defaultUnit?: Unit;
}

export const UnitProvider: React.FC<UnitProviderProps> = ({ 
  children, 
  defaultUnit = 'km' 
}) => {
  const [unit, setUnit] = useState<Unit>(defaultUnit);

  const toggleUnit = useCallback(() => {
    setUnit(prevUnit => prevUnit === 'km' ? 'mi' : 'km');
  }, []);

  const convertDistance = useCallback((distance: number, fromUnit: Unit, toUnit: Unit): number => {
    if (fromUnit === toUnit) return distance;
    
    if (fromUnit === 'km' && toUnit === 'mi') {
      return distance * 0.621371; // km to miles
    } else if (fromUnit === 'mi' && toUnit === 'km') {
      return distance * 1.60934; // miles to km
    }
    
    return distance;
  }, []);

  const formatDistance = useCallback((distance: number, fromUnit: Unit): string => {
    const convertedDistance = convertDistance(distance, fromUnit, unit);
    return `${convertedDistance.toFixed(2)} ${unit}`;
  }, [unit, convertDistance]);

  const value: UnitContextType = {
    unit,
    setUnit,
    toggleUnit,
    convertDistance,
    formatDistance,
  };

  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};