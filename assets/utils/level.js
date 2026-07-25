export function getLevelData(totalPoints) {
  const maxLevel = 100;
  const baseRequirement = 30;
  const growthRate = 1.5;

  let level = 0;
  let cumulativePoints = 0;
  let requiredForNext = baseRequirement;
  let pointsAtLevelStart = 0;

  for (let i = 1; i <= maxLevel; i++) {
    cumulativePoints += requiredForNext;

    if (totalPoints < cumulativePoints) {
      break;
    }

    level = i;
    pointsAtLevelStart = cumulativePoints;
    requiredForNext *= growthRate;
  }

  return {
    level, // aktualny level
    currentLevelPoints: Math.round(totalPoints - pointsAtLevelStart), // "zresetowane" punkty w obrębie levelu
    pointsToNextLevel: level < maxLevel ? Math.round(requiredForNext) : 0, // ile trzeba na kolejny
  };
}
