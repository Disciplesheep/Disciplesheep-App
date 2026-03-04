import { useState, useEffect } from 'react';

// Discipleship levels based on 2 Timothy 2:2
export const DISCIPLESHIP_LEVELS = {
  PAUL: 'Paul', // You - the church planter
  TIMOTHY: 'Timothy', // Your direct disciples
  FAITHFUL_MEN: 'Faithful Men', // Those your Timothys are discipling
  OTHERS: 'Others' // Third generation disciples
};

// Hook for managing discipleship tracking
export function useDiscipleshipTracking() {
  const [disciples, setDisciples] = useState(() => {
    try {
      const saved = localStorage.getItem('discipleshipTree');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('discipleshipTree', JSON.stringify(disciples));
  }, [disciples]);

  const addDisciple = (disciple) => {
    setDisciples(prev => [...prev, { ...disciple, id: Date.now().toString(), addedDate: new Date().toISOString() }]);
  };

  const updateDisciple = (id, updates) => {
    setDisciples(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDisciple = (id) => {
    setDisciples(prev => prev.filter(d => d.id !== id));
  };

  // Calculate multiplication stats
  const getMultiplicationStats = () => {
    const timothys = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.TIMOTHY);
    const faithfulMen = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.FAITHFUL_MEN);
    const others = disciples.filter(d => d.level === DISCIPLESHIP_LEVELS.OTHERS);

    // Count how many people each Timothy is discipling
    const timothyStats = timothys.map(timothy => {
      const theirDisciples = faithfulMen.filter(fm => fm.discipledBy === timothy.id);
      const thirdGen = others.filter(o => 
        theirDisciples.some(d => d.id === o.discipledBy)
      );
      return {
        ...timothy,
        discipleCount: theirDisciples.length,
        thirdGenCount: thirdGen.length
      };
    });

    return {
      totalTimothys: timothys.length,
      totalFaithfulMen: faithfulMen.length,
      totalOthers: others.length,
      totalDisciples: disciples.length,
      timothyStats,
      multiplicationFactor: disciples.length > 0 ? (disciples.length / Math.max(timothys.length, 1)).toFixed(1) : 0
    };
  };

  return {
    disciples,
    addDisciple,
    updateDisciple,
    deleteDisciple,
    getMultiplicationStats
  };
}

// Calculate generation depth
export const getGenerationDepth = (disciples) => {
  const hasOthers = disciples.some(d => d.level === DISCIPLESHIP_LEVELS.OTHERS);
  const hasFaithfulMen = disciples.some(d => d.level === DISCIPLESHIP_LEVELS.FAITHFUL_MEN);
  const hasTimothys = disciples.some(d => d.level === DISCIPLESHIP_LEVELS.TIMOTHY);

  if (hasOthers) return 4; // Paul → Timothy → Faithful Men → Others
  if (hasFaithfulMen) return 3; // Paul → Timothy → Faithful Men
  if (hasTimothys) return 2; // Paul → Timothy
  return 1; // Just Paul (you)
};

// Get discipleship chain for a specific person
export const getDiscipleshipChain = (disciples, personId) => {
  const person = disciples.find(d => d.id === personId);
  if (!person) return [];

  const chain = [person];
  let currentPerson = person;

  // Walk up the chain
  while (currentPerson.discipledBy) {
    const mentor = disciples.find(d => d.id === currentPerson.discipledBy);
    if (!mentor) break;
    chain.unshift(mentor);
    currentPerson = mentor;
  }

  return chain;
};

// Get all disciples of a specific person (direct only)
export const getDirectDisciples = (disciples, mentorId) => {
  return disciples.filter(d => d.discipledBy === mentorId);
};

// Get all disciples in the lineage (recursive)
export const getAllLineageDisciples = (disciples, mentorId) => {
  const direct = getDirectDisciples(disciples, mentorId);
  const indirect = direct.flatMap(d => getAllLineageDisciples(disciples, d.id));
  return [...direct, ...indirect];
};
