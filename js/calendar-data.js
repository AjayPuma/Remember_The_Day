
window.CalendarData = (() => {
  const scriptUrl = document.currentScript.src;

  async function loadFile(filename) {
    const url = new URL(`../data/${filename}`, scriptUrl);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.status}`);
    }

    return response.json();
  }

  async function loadAll() {
    const [festivals, importantDays, publicHolidays] =
      await Promise.all([
        loadFile("festivals.json"),
        loadFile("important-days.json"),
        loadFile("public-holidays.json")
      ]);

    return { festivals, importantDays, publicHolidays };
  }

  function makeDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function getDateForYear(item, year) {
    if (item.datesByYear?.[year]) {
      const [y, m, d] = item.datesByYear[year]
        .split("-")
        .map(Number);
      return makeDate(y, m, d);
    }

    if (item.dateType === "fixed") {
      return makeDate(year, item.month, item.day);
    }

    if (item.dateType === "nth-weekday") {
      const first = makeDate(year, item.month, 1);
      if (!first) return null;

      const offset =
        (item.weekday - first.getDay() + 7) % 7;

      return makeDate(
        year,
        item.month,
        1 + offset + (item.occurrence - 1) * 7
      );
    }

    return null;
  }

  function daysUntil(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((date - today) / 86400000);
  }

  async function getUpcoming(days = 365) {
    const data = await loadAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setDate(end.getDate() + days);

    const items = [
      ...data.festivals.map(item => ({
        ...item,
        section: "festival"
      })),
      ...data.importantDays.map(item => ({
        ...item,
        section: "important-day"
      }))
    ];

    const results = [];

    for (const item of items) {
      for (
        let year = today.getFullYear();
        year <= end.getFullYear();
        year++
      ) {
        const date = getDateForYear(item, year);

        if (date && date >= today && date <= end) {
          results.push({
            ...item,
            date,
            daysUntil: daysUntil(date)
          });
        }
      }
    }

    for (const item of data.publicHolidays) {
      const [year, month, day] = item.date
        .split("-")
        .map(Number);

      const date = makeDate(year, month, day);

      if (date && date >= today && date <= end) {
        results.push({
          ...item,
          date,
          daysUntil: daysUntil(date),
          section: "public-holiday"
        });
      }
    }

    return results.sort((a, b) => a.date - b.date);
  }

  return { loadAll, getUpcoming, getDateForYear };
})();
