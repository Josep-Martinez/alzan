export type VacationStatusLike = {
  date: string;
  status: string;
};

export type VacationAverageDayLike = {
  isVacation: boolean;
  loggedMealCount: number;
};

export type VacationDraftSelectionState = {
  persistedDates: Set<string>;
  draftDates: Set<string>;
  addDates: Set<string>;
  removeDates: Set<string>;
};

export const createVacationDateSet = (statuses: VacationStatusLike[] | null | undefined): Set<string> => {
  return new Set((statuses || []).filter(status => status.status === 'vacation').map(status => status.date));
};

export const diffVacationDateSelection = (
  originalDates: Set<string>,
  draftDates: Set<string>,
): { addDates: string[]; removeDates: string[] } => {
  return {
    addDates: Array.from(draftDates)
      .filter(date => !originalDates.has(date))
      .sort(),
    removeDates: Array.from(originalDates)
      .filter(date => !draftDates.has(date))
      .sort(),
  };
};

export const mergeLoadedVacationDates = (
  state: VacationDraftSelectionState,
  loadedDates: Set<string>,
): VacationDraftSelectionState => {
  const persistedDates = new Set(state.persistedDates);
  const draftDates = new Set(state.draftDates);

  loadedDates.forEach(date => {
    persistedDates.add(date);
    if (!state.removeDates.has(date)) {
      draftDates.add(date);
    }
  });

  return {
    ...state,
    persistedDates,
    draftDates,
  };
};

export const toggleVacationDraftDate = (
  state: VacationDraftSelectionState,
  date: string,
): VacationDraftSelectionState => {
  const persistedDates = new Set(state.persistedDates);
  const draftDates = new Set(state.draftDates);
  const addDates = new Set(state.addDates);
  const removeDates = new Set(state.removeDates);

  if (draftDates.has(date)) {
    draftDates.delete(date);
    if (persistedDates.has(date)) {
      removeDates.add(date);
    }
    addDates.delete(date);
  } else {
    draftDates.add(date);
    if (persistedDates.has(date)) {
      removeDates.delete(date);
    } else {
      addDates.add(date);
    }
  }

  return {
    persistedDates,
    draftDates,
    addDates,
    removeDates,
  };
};

export const clearVacationDraftSelection = (state: VacationDraftSelectionState): VacationDraftSelectionState => ({
  persistedDates: new Set(state.persistedDates),
  draftDates: new Set(),
  addDates: new Set(),
  removeDates: new Set(state.persistedDates),
});

export const clearFutureVacationDraftSelection = (
  state: VacationDraftSelectionState,
  today: string,
): VacationDraftSelectionState => {
  const draftDates = new Set<string>();
  const addDates = new Set<string>();
  const removeDates = new Set(state.removeDates);

  state.draftDates.forEach(date => {
    if (date <= today) {
      draftDates.add(date);
    }
  });

  state.addDates.forEach(date => {
    if (date <= today) {
      addDates.add(date);
    }
  });

  state.persistedDates.forEach(date => {
    if (date > today) {
      removeDates.add(date);
    }
  });

  return {
    persistedDates: new Set(state.persistedDates),
    draftDates,
    addDates,
    removeDates,
  };
};

export const getVacationDraftSelectionDiff = (
  state: VacationDraftSelectionState,
): { addDates: string[]; removeDates: string[] } => ({
  addDates: Array.from(state.addDates).sort(),
  removeDates: Array.from(state.removeDates).sort(),
});

export const getVacationNewDraftDateCount = (state: VacationDraftSelectionState): number => {
  return state.addDates.size;
};

export const shouldShowPendingPlannedMeals = (isVacationDay: boolean): boolean => {
  return !isVacationDay;
};

export const getNutritionExportAverageDayCount = (days: VacationAverageDayLike[]): number => {
  return Math.max(1, days.filter(day => !day.isVacation || day.loggedMealCount > 0).length);
};
