export const applyOptionToPreferences = (preferences, option) => {
  const next = { ...(preferences || {}) };
  if (!option) return next;

  if (option.themes) {
    next.themes = [...(next.themes || []), ...option.themes];
  }
  if (option.experiences) {
    next.experiences = [...(next.experiences || []), ...option.experiences];
  }
  if (option.vibes) {
    next.vibes = [...(next.vibes || []), ...option.vibes];
  }
  if (option.moods) {
    next.moods = [...(next.moods || []), ...option.moods];
  }
  if (option.keywords) {
    next.keywords = [...(next.keywords || []), ...option.keywords];
  }
  if (option.pages) {
    next.pages = option.pages;
  }
  if (option.difficulty) {
    next.difficulty = option.difficulty;
  }
  if (option.standalone !== undefined) {
    next.standalone = option.standalone;
  }
  if (option.wantsSeries !== undefined) {
    next.wantsSeries = option.wantsSeries;
  }
  if (option.riskLevel) {
    next.riskLevel = option.riskLevel;
  }
  if (option.filter) {
    next.filter = option.filter;
  }
  if (option.boost) {
    next.boost = option.boost;
  }

  return next;
};

export const buildPreferencesFromAnswers = (answers = {}, path = [], questions = {}) => {
  return path.reduce((prefs, questionKey) => {
    const answerId = answers[questionKey];
    if (!answerId) return prefs;
    const question = questions[questionKey];
    const option = question?.options?.find((opt) => opt.id === answerId);
    if (!option) return prefs;
    return applyOptionToPreferences(prefs, option);
  }, {});
};
