export const parseSkillsToArray = (skillsString?: string | null): string[] => {
  if (!skillsString || typeof skillsString !== "string") return [];

  return skillsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(
      (s, i, arr) =>
        arr.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i
    );
};