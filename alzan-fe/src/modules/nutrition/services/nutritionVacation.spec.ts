import assert from 'node:assert/strict';

import {
  clearVacationDraftSelection,
  createVacationDateSet,
  diffVacationDateSelection,
  getVacationDraftSelectionDiff,
  getNutritionExportAverageDayCount,
  mergeLoadedVacationDates,
  shouldShowPendingPlannedMeals,
  toggleVacationDraftDate,
  type VacationDraftSelectionState,
} from './nutritionVacation';

function run() {
  const vacationDates = createVacationDateSet([
    { date: '2026-07-01', status: 'vacation' },
    { date: '2026-07-02', status: 'normal' },
    { date: '2026-07-03', status: 'vacation' },
  ]);

  assert.deepEqual(Array.from(vacationDates).sort(), ['2026-07-01', '2026-07-03']);

  const diff = diffVacationDateSelection(
    new Set(['2026-07-01', '2026-07-02']),
    new Set(['2026-07-02', '2026-07-03', '2026-07-04']),
  );

  assert.deepEqual(diff.addDates, ['2026-07-03', '2026-07-04']);
  assert.deepEqual(diff.removeDates, ['2026-07-01']);

  const crossMonthDiff = diffVacationDateSelection(
    new Set(['2026-07-31', '2026-08-02']),
    new Set(['2026-07-31', '2026-08-03', '2026-09-01']),
  );

  assert.deepEqual(crossMonthDiff.addDates, ['2026-08-03', '2026-09-01']);
  assert.deepEqual(crossMonthDiff.removeDates, ['2026-08-02']);

  const crossMonthRemovalDiff = diffVacationDateSelection(
    new Set(['2026-07-15', '2026-08-12', '2026-09-03']),
    new Set(['2026-09-03']),
  );

  assert.deepEqual(crossMonthRemovalDiff.addDates, []);
  assert.deepEqual(crossMonthRemovalDiff.removeDates, ['2026-07-15', '2026-08-12']);

  let draftState: VacationDraftSelectionState = {
    persistedDates: new Set(),
    draftDates: new Set(),
    addDates: new Set(),
    removeDates: new Set(),
  };

  draftState = mergeLoadedVacationDates(draftState, new Set(['2026-06-10']));
  draftState = toggleVacationDraftDate(draftState, '2026-06-10');
  draftState = mergeLoadedVacationDates(draftState, new Set(['2026-07-11']));
  draftState = toggleVacationDraftDate(draftState, '2026-07-11');
  draftState = mergeLoadedVacationDates(draftState, new Set());
  draftState = toggleVacationDraftDate(draftState, '2026-08-12');

  assert.deepEqual(getVacationDraftSelectionDiff(draftState), {
    addDates: ['2026-08-12'],
    removeDates: ['2026-06-10', '2026-07-11'],
  });

  draftState = clearVacationDraftSelection(mergeLoadedVacationDates(draftState, new Set(['2026-09-13'])));

  assert.deepEqual(getVacationDraftSelectionDiff(draftState), {
    addDates: [],
    removeDates: ['2026-06-10', '2026-07-11', '2026-09-13'],
  });

  assert.equal(shouldShowPendingPlannedMeals(false), true);
  assert.equal(shouldShowPendingPlannedMeals(true), false);

  assert.equal(
    getNutritionExportAverageDayCount([
      { isVacation: false, loggedMealCount: 0 },
      { isVacation: true, loggedMealCount: 0 },
      { isVacation: true, loggedMealCount: 2 },
    ]),
    2,
  );

  assert.equal(getNutritionExportAverageDayCount([{ isVacation: true, loggedMealCount: 0 }]), 1);
}

run();
