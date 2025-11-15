"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTemplate,
  getUi,
  getLocaleLabel,
  SUPPORTED_LOCALES,
  type Locale,
  type Task,
} from "@/lib/i18n";
import { translateWelcomeNote } from "@/lib/lingo-client";

const DEFAULT_WELCOME =
  "Welcome to the team! Use this space to celebrate new hires and explain how their work matters.";

const HERO_HIGHLIGHTS = [
  "HR writes onboarding once in English.",
  "Lingo CLI + CI auto-sync localized JSON.",
  "Lingo SDK personalizes welcome notes live.",
];
const LENGTH_ALERT_RATIO = 1.5;

type WelcomeCacheEntry = {
  source: string;
  value: string;
};

type ViewMode = "single" | "qa";

export default function Home() {
  const hrStrings = getUi("en");
  const englishTemplate = getTemplate("en");

  const [companyName, setCompanyName] = useState(englishTemplate.companyName);
  const [role, setRole] = useState(englishTemplate.role);
  const [tasks, setTasks] = useState<Task[]>(englishTemplate.tasks);
  const [welcomeNote, setWelcomeNote] = useState(DEFAULT_WELCOME);
  const [selectedLocale, setSelectedLocale] = useState<Locale>("en");
  const [translatedWelcome, setTranslatedWelcome] = useState(DEFAULT_WELCOME);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const welcomeCache = useRef<Partial<Record<Locale, WelcomeCacheEntry>>>({});

  const previewStrings = useMemo(() => getUi(selectedLocale), [selectedLocale]);
  const previewTemplate = useMemo(() => {
    if (selectedLocale === "en") {
      return { companyName, role, tasks };
    }

    return getTemplate(selectedLocale);
  }, [companyName, role, selectedLocale, tasks]);

  const shouldTranslate =
    selectedLocale !== "en" && welcomeNote.trim().length > 0;

  useEffect(() => {
    if (!shouldTranslate) {
      return;
    }

    let cancelled = false;
    const cached = welcomeCache.current[selectedLocale];
    if (cached && cached.source === welcomeNote) {
      setTranslatedWelcome(cached.value);
      return;
    }

    setIsTranslating(true);
    setTranslationError(false);

    translateWelcomeNote(welcomeNote, selectedLocale)
      .then((result) => {
        if (cancelled) return;

        welcomeCache.current[selectedLocale] = {
          source: welcomeNote,
          value: result,
        };
        setTranslatedWelcome(result);
      })
      .catch(() => {
        if (cancelled) return;
        setTranslationError(true);
        setTranslatedWelcome(welcomeNote);
      })
      .finally(() => {
        if (!cancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLocale, shouldTranslate, welcomeNote]);

  const previewWelcome =
    shouldTranslate && !translationError ? translatedWelcome : welcomeNote;

  const englishTasksById = useMemo(() => {
    return tasks.reduce<Record<string, Task>>((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {});
  }, [tasks]);

  const englishTemplateTasks = useMemo(() => {
    return englishTemplate.tasks.reduce<Record<string, Task>>((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {});
  }, [englishTemplate.tasks]);

  const qaComparisons = useMemo(() => {
    if (selectedLocale === "en") {
      return [];
    }

    const localizedTemplate = getTemplate(selectedLocale);

    return localizedTemplate.tasks.map((targetTask) => {
      const englishTask = englishTasksById[targetTask.id] ?? englishTemplateTasks[targetTask.id];
      const titleRatio =
        englishTask && englishTask.title.length > 0
          ? targetTask.title.length / englishTask.title.length
          : 1;
      const descriptionRatio =
        englishTask && englishTask.description.length > 0
          ? targetTask.description.length / englishTask.description.length
          : 1;

      const needsReview =
        titleRatio > LENGTH_ALERT_RATIO || descriptionRatio > LENGTH_ALERT_RATIO;

      return {
        id: targetTask.id,
        english: englishTask,
        target: targetTask,
        needsReview,
      };
    });
  }, [englishTemplateTasks, englishTasksById, selectedLocale]);

  const qaIssues = qaComparisons.filter((comparison) => comparison.needsReview).length;
  const localeLabel = getLocaleLabel(selectedLocale);
  const isQaMode = viewMode === "qa";

  const handleTaskChange = (index: number, field: "title" | "description", value: string) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handleDownloadPack = () => {
    const docWelcome = selectedLocale === "en" ? welcomeNote : previewWelcome;
    const docTasks = previewTemplate.tasks
      .map(
        (task, index) =>
          `<p><strong>Task ${index + 1}: ${task.title}</strong><br/>${task.description}</p>`,
      )
      .join("");

    const docHtml = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Onboarding Pack - ${localeLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a; }
            h1 { font-size: 24px; margin-bottom: 0; }
            h2 { font-size: 18px; margin-top: 24px; }
            p { font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Onboarding Pack – ${localeLabel}</h1>
          <p><strong>Locale:</strong> ${selectedLocale}</p>
          <p><strong>Company:</strong> ${previewTemplate.companyName}</p>
          <p><strong>Role:</strong> ${previewTemplate.role}</p>
          <h2>Welcome Note</h2>
          <p>${docWelcome}</p>
          <h2>Onboarding Checklist</h2>
          ${docTasks}
        </body>
      </html>`;

    const blob = new Blob([docHtml], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `onboarding-pack-${selectedLocale}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-4 rounded-3xl bg-white/80 p-6 text-center shadow-sm ring-1 ring-slate-200 md:text-left">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
              {hrStrings["app.title"]}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {hrStrings["app.subtitle"]}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              GlobalOnboard combines Lingo CLI, SDK, and CI so HR can design one onboarding flow
              and preview it for employees in any language.
            </p>
          </div>
          <ul className="grid gap-3 text-left text-sm text-slate-700 sm:grid-cols-2">
            {HERO_HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <span className="mt-0.5 text-indigo-500">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{hrStrings["hr.panel_title"]}</h2>
              <div className="text-right text-xs text-slate-500">
                <p>{hrStrings["field.base_language"]}</p>
                <p className="font-semibold">{hrStrings["field.base_language_value"]}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  {hrStrings["field.company_name"]}
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  {hrStrings["field.role"]}
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    {hrStrings["section.checklist"]}
                  </label>
                  <p className="text-xs text-slate-400">{hrStrings["section.template"]}</p>
                </div>

                <div className="mt-3 space-y-4">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          value={task.title}
                          onChange={(event) =>
                            handleTaskChange(index, "title", event.target.value)
                          }
                        />
                        <textarea
                          className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          value={task.description}
                          onChange={(event) =>
                            handleTaskChange(index, "description", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  {hrStrings["section.welcome_note"]}
                </label>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder={hrStrings["welcome.placeholder"]}
                  value={welcomeNote}
                  onChange={(event) => setWelcomeNote(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900/90 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-wide text-slate-300">
                    {previewStrings["employee.panel_title"]}
                  </p>
                  <p className="text-lg font-medium text-white">
                    {previewStrings["app.title"]}
                  </p>
                </div>

                <div className="flex flex-col gap-2 text-xs font-semibold uppercase text-slate-400">
                  <span>{hrStrings["field.language"]}</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedLocale}
                      onChange={(event) => {
                        setSelectedLocale(event.target.value as Locale);
                      }}
                      className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-white focus:outline-none"
                    >
                      {SUPPORTED_LOCALES.map((locale) => (
                        <option key={locale} value={locale} className="text-slate-900">
                          {getLocaleLabel(locale)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleDownloadPack}
                      className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
                    >
                      Download onboarding pack
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Preview mode</p>
                <div className="flex gap-1 rounded-full bg-white/10 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode("single")}
                    className={`rounded-full px-4 py-1 capitalize transition ${
                      viewMode === "single" ? "bg-white text-slate-900" : "text-slate-200"
                    }`}
                  >
                    Single preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("qa")}
                    className={`rounded-full px-4 py-1 capitalize transition ${
                      viewMode === "qa" ? "bg-white text-slate-900" : "text-slate-200"
                    }`}
                  >
                    QA view
                  </button>
                </div>
              </div>
            </div>

            {isQaMode ? (
              <div className="mt-6 space-y-5">
                {selectedLocale === "en" ? (
                  <p className="rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                    Choose a non-English locale to compare translations side-by-side.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-300">English</p>
                        <p className="text-xl font-semibold">{companyName}</p>
                        <p className="text-sm text-slate-200">{role}</p>
                      </div>
                      <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-300">
                          {localeLabel}
                        </p>
                        <p className="text-xl font-semibold">{previewTemplate.companyName}</p>
                        <p className="text-sm text-slate-200">{previewTemplate.role}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-100">
                      <p className="font-semibold uppercase tracking-wide text-slate-300">
                        Localization health
                      </p>
                      <p className="mt-1">
                        {qaIssues === 0
                          ? `${localeLabel}: All tasks fit within English length.`
                          : `${localeLabel}: ${qaIssues} ${
                              qaIssues === 1 ? "task needs" : "tasks need"
                            } review because translations are longer than English.`}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {qaComparisons.map((comparison) => (
                        <div key={comparison.id} className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl bg-white/5 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-300">
                              English
                            </p>
                            <p className="font-semibold text-white">
                              {comparison.english?.title ?? "Untitled task"}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              {comparison.english?.description ?? "No description available."}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-white/10 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-wide text-slate-300">
                                {localeLabel}
                              </p>
                              {comparison.needsReview && (
                                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200">
                                  ⚠ Longer than English
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-white">
                              {comparison.target.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-200">
                              {comparison.target.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">
                    {previewStrings["field.company_name"]}
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {previewTemplate.companyName}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{previewTemplate.role}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {previewStrings["section.welcome_note"]}
                  </p>
                  <p className="mt-2 rounded-2xl bg-white/5 p-4 text-base leading-relaxed text-slate-100">
                    {previewWelcome}
                  </p>
                  {shouldTranslate && (isTranslating || translationError) && (
                    <p className="mt-2 text-xs text-slate-300">
                      {isTranslating
                        ? previewStrings["status.translating"]
                        : previewStrings["status.translation_error"]}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    {previewStrings["section.checklist"]}
                  </p>
                  <ol className="mt-3 space-y-3">
                    {previewTemplate.tasks.map((task) => (
                      <li key={task.id} className="rounded-2xl bg-white/5 p-4">
                        <p className="font-semibold text-white">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-200">{task.description}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
