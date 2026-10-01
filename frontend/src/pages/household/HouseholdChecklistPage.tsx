import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building,
  Save,
  Upload,
  Trash2,
  Sparkles,
  Flame,
  Zap,
  Droplets,
  Layers,
  Check,
  X,
  Info,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { InspectionStatus } from '../../types';

interface MeasureItem {
  id: string;
  categoryKey: string;
  categoryTitle: string;
  categoryTitleRw: string;
  measureName: string;
  measureNameRw: string;
  frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
  frequencyRw: string;
  status: InspectionStatus | 'not_checked';
  remarks: string;
  evidencePhotos: string[];
  scheduleWeek: number;
}

const initialHouseholdMeasures: MeasureItem[] = [
  // 1. Common Circulation & Public Areas
  {
    id: 'hh-01',
    categoryKey: 'circulation',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange n\'inzira',
    measureName: 'Corridor and stairway lights intact & functional',
    measureNameRw: 'Amatara ya korodoro n\'esikariye araka neza',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'All corridor downlights operational, switches working smoothly.',
    evidencePhotos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'hh-02',
    categoryKey: 'circulation',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange n\'inzira',
    measureName: 'Floor tiles polished, clean & uncracked',
    measureNameRw: 'Amakaro ahanaguye neza, nta mpanuka',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'Tiles thoroughly scrubbed and dried.',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'hh-03',
    categoryKey: 'circulation',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange n\'inzira',
    measureName: 'Windows clean, unbroken & latching correctly',
    measureNameRw: 'Amadirishya afunga neza kandi asukuye',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'hh-04',
    categoryKey: 'circulation',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange n\'inzira',
    measureName: 'Walls & paint free of dampness or peeling',
    measureNameRw: 'Inkuta n\'irangi bimeze neza nta buhehere',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 2. Security & Guard Posts
  {
    id: 'hh-05',
    categoryKey: 'security',
    categoryTitle: '2. Security & Guard Posts',
    categoryTitleRw: '2. Umutekano n\'Irembo rikuru',
    measureName: 'Main entrance gate locks & remote access working',
    measureNameRw: 'Ingufuri z\'irembo na moteri birakora neza',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'Automated electric gate mechanism lubricated and tested.',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'hh-06',
    categoryKey: 'security',
    categoryTitle: '2. Security & Guard Posts',
    categoryTitleRw: '2. Umutekano n\'Irembo rikuru',
    measureName: 'Security lighting & CCTV cameras functional',
    measureNameRw: 'Amatara y\'umutekano na camera zirahari',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'All 8 perimeter camera feeds active on guard monitor.',
    evidencePhotos: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'hh-07',
    categoryKey: 'security',
    categoryTitle: '2. Security & Guard Posts',
    categoryTitleRw: '2. Umutekano n\'Irembo rikuru',
    measureName: 'Guard post sanitation & visitor logbook up to date',
    measureNameRw: 'Isuku y\'abarinzi n\'igitabo cy\'abashyitsi bimeze neza',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 3. Technical & Generator Backup Systems
  {
    id: 'hh-08',
    categoryKey: 'technical',
    categoryTitle: '3. Technical & Backup Generator Systems',
    categoryTitleRw: '3. Imashini y\'amashanyarazi na Generator',
    measureName: 'Generator fuel level checked & starter battery tested',
    measureNameRw: 'Lisansi ya generator na bateri bimeze neza',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'Diesel tank at 85% capacity. Battery voltage normal (24.2V).',
    evidencePhotos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'hh-09',
    categoryKey: 'technical',
    categoryTitle: '3. Technical & Backup Generator Systems',
    categoryTitleRw: '3. Imashini y\'amashanyarazi na Generator',
    measureName: 'Main electrical distribution breakers inspected',
    measureNameRw: 'Disjoncteurs z\'amashanyarazi nta kibazo zifite',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'needs_attention',
    remarks: 'Phase 2 load slight hum; scheduled technician check for Friday.',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'hh-10',
    categoryKey: 'technical',
    categoryTitle: '3. Technical & Backup Generator Systems',
    categoryTitleRw: '3. Imashini y\'amashanyarazi na Generator',
    measureName: 'Water pumps & automatic float switches verified',
    measureNameRw: 'Pompe y\'amazi n\'akuma kayobora amazi birakora',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 4. Fire Safety & Emergency Equipment
  {
    id: 'hh-11',
    categoryKey: 'firesafety',
    categoryTitle: '4. Fire Safety & Emergency Equipment',
    categoryTitleRw: '4. Ibikoresho byo kuzimya umuriro',
    measureName: 'Fire extinguishers pressure gauges in green zone',
    measureNameRw: 'Ibizimya umuriro bifite umwuka uhagije',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'All 6 powder extinguishers inspected, pins sealed in green zone.',
    evidencePhotos: ['https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'hh-12',
    categoryKey: 'firesafety',
    categoryTitle: '4. Fire Safety & Emergency Equipment',
    categoryTitleRw: '4. Ibikoresho byo kuzimya umuriro',
    measureName: 'Emergency exit doors unobstructed & signs illuminated',
    measureNameRw: 'Inzira z\'ubutabazi zifunguye nta bibangamiye',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 5. Water & Waste Management
  {
    id: 'hh-13',
    categoryKey: 'waterwaste',
    categoryTitle: '5. Water Reserves & Waste Management',
    categoryTitleRw: '5. Ibigega by\'amazi n\'imyanda',
    measureName: 'Water storage reservoir tanks clean and locked',
    measureNameRw: 'Ibigega by\'amazi bifunze neza kandi bisukuye',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'pass',
    remarks: 'Underground reserve filled; access manhole locked securely.',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'hh-14',
    categoryKey: 'waterwaste',
    categoryTitle: '5. Water Reserves & Waste Management',
    categoryTitleRw: '5. Ibigega by\'amazi n\'imyanda',
    measureName: 'Garbage collection area sanitized & bins covered',
    measureNameRw: 'Ahabikwa imyanda hateye umuti kandi hafunze',
    frequency: 'Weekly',
    frequencyRw: 'Buri cyumweru',
    status: 'not_checked',
    remarks: '',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
];

export const HouseholdChecklistPage: React.FC = () => {
  const { success } = useToast();

  const [measures, setMeasures] = useState<MeasureItem[]>(initialHouseholdMeasures);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    circulation: true,
    security: true,
    technical: false,
    firesafety: false,
    waterwaste: false,
  });

  // Drawer for Marking a Measure
  const [activeMeasure, setActiveMeasure] = useState<MeasureItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<InspectionStatus>('pass');
  const [remarks, setRemarks] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);

  // Unique Categories
  const categories = [
    {
      key: 'circulation',
      title: '1. Common Circulation & Public Areas',
      titleRw: '1. Uruhuriro rusange n\'inzira',
      icon: Building,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    },
    {
      key: 'security',
      title: '2. Security & Guard Posts',
      titleRw: '2. Umutekano n\'Irembo rikuru',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'technical',
      title: '3. Technical & Backup Generator Systems',
      titleRw: '3. Imashini y\'amashanyarazi na Generator',
      icon: Zap,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    },
    {
      key: 'firesafety',
      title: '4. Fire Safety & Emergency Equipment',
      titleRw: '4. Ibikoresho byo kuzimya umuriro',
      icon: Flame,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
    },
    {
      key: 'waterwaste',
      title: '5. Water Reserves & Waste Management',
      titleRw: '5. Ibigega by\'amazi n\'imyanda',
      icon: Droplets,
      color: 'from-sky-500 to-cyan-600',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
    },
  ];

  // Overall totals
  const totalMeasures = measures.length;
  const markedMeasures = measures.filter((m) => m.status !== 'not_checked').length;
  const overallPercentage = Math.round((markedMeasures / totalMeasures) * 100);

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.forEach((c) => {
      allExpanded[c.key] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Open inspection drawer for a measure
  const handleOpenMarkMeasure = (item: MeasureItem) => {
    setActiveMeasure(item);
    setSelectedStatus(item.status === 'not_checked' ? 'pass' : item.status);
    setRemarks(item.remarks || '');
    setEvidencePhotos(item.evidencePhotos || []);
  };

  // Inline 1-tap quick status mark
  const handleQuickMark = (itemId: string, status: InspectionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setMeasures((prev) =>
      prev.map((m) =>
        m.id === itemId
          ? {
              ...m,
              status,
              remarks: m.remarks || (status === 'pass' ? 'Checked and passed routine inspection.' : 'Needs attention.'),
            }
          : m
      )
    );

    try {
      if (status === 'pass') confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
    } catch (err) {}

    success('Marked Successfully', `Checkpoint set to ${status.toUpperCase().replace('_', ' ')}`);
  };

  // Save from drawer
  const handleSaveMeasureForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeasure) return;

    setMeasures((prev) =>
      prev.map((m) =>
        m.id === activeMeasure.id
          ? {
              ...m,
              status: selectedStatus,
              remarks: remarks || (selectedStatus === 'pass' ? 'Checked and verified in good condition.' : 'Issue noted.'),
              evidencePhotos: evidencePhotos,
            }
          : m
      )
    );

    try {
      if (selectedStatus === 'pass') confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {}

    success('Inspection Saved', `Checkpoint "${activeMeasure.measureName}" marked.`);
    setActiveMeasure(null);
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setEvidencePhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Friendly Top Header for Household Staff */}
      <div className="glass-card p-6 rounded-3xl border shadow-soft bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-extrabold text-[11px] border border-brand-200 dark:border-brand-800">
                Week 33 (August 2026)
              </span>
              <span className="text-xs font-bold text-slate-500">Kigali Heights Residences</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
              Preventive Checklist / Ibyo Kugenzura
            </h1>
            <p className="text-xs text-slate-500">
              Kanda kuri buri cyiciro (Category) ubundi ukande kuri buri kintu cyo kugenzura wemeze uko kimeze.
            </p>
          </div>

          {/* Quick Progress Dial */}
          <div className="flex items-center gap-3 shrink-0 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Weekly Progress</span>
              <p className="text-lg font-extrabold font-mono text-emerald-600">
                {markedMeasures} / {totalMeasures} <span className="text-xs text-slate-400 font-normal">Marked</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center font-extrabold text-xs text-emerald-600">
              {overallPercentage}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={expandAll}
              className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="text-[11px] font-bold text-slate-500 hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CATEGORIES ACCORDION LIST                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const catMeasures = measures.filter((m) => m.categoryKey === cat.key);
          const catTotal = catMeasures.length;
          const catMarked = catMeasures.filter((m) => m.status !== 'not_checked').length;
          const isComplete = catTotal > 0 && catMarked === catTotal;
          const isExpanded = Boolean(expandedCategories[cat.key]);
          const catPercent = catTotal > 0 ? Math.round((catMarked / catTotal) * 100) : 0;
          const Icon = cat.icon;

          return (
            <div
              key={cat.key}
              className="glass-card rounded-3xl border shadow-soft overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Category Header (Click to collapse/expand) */}
              <div
                onClick={() => toggleCategory(cat.key)}
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white">
                      {cat.title}
                    </h3>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {cat.titleRw}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {/* Category Progress Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : catMarked > 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {catMarked} of {catTotal} Checked ({catPercent}%)
                    </span>

                    {isComplete && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  {/* Toggle Arrow */}
                  <button className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Measures List */}
              {isExpanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                  {catMeasures.map((measure, idx) => {
                    const isMarked = measure.status !== 'not_checked';

                    return (
                      <div
                        key={measure.id}
                        onClick={() => handleOpenMarkMeasure(measure)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                          measure.status === 'pass'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
                            : measure.status === 'needs_attention'
                            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80'
                            : measure.status === 'failed'
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {measure.measureName}
                              </h4>
                            </div>

                            <p className="text-xs font-semibold text-slate-500 ml-8">
                              {measure.measureNameRw}
                            </p>

                            {/* Remarks & Photos if any */}
                            {measure.remarks && (
                              <p className="text-xs italic text-slate-600 dark:text-slate-300 ml-8 pt-0.5">
                                &ldquo;{measure.remarks}&rdquo;
                              </p>
                            )}

                            {measure.evidencePhotos && measure.evidencePhotos.length > 0 && (
                              <div className="flex items-center gap-2 ml-8 pt-1">
                                {measure.evidencePhotos.map((p, pIdx) => (
                                  <img
                                    key={pIdx}
                                    src={p}
                                    alt="Evidence photo"
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                  />
                                ))}
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {measure.evidencePhotos.length} Photo Proof
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quick 1-Tap Mark Actions or Status Badge */}
                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            {/* Big 1-Tap Outcome Buttons */}
                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border shadow-xs">
                              <button
                                type="button"
                                onClick={(e) => handleQuickMark(measure.id, 'pass', e)}
                                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 ${
                                  measure.status === 'pass'
                                    ? 'bg-emerald-500 text-white shadow-sm scale-105'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Pass</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleQuickMark(measure.id, 'needs_attention', e)}
                                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 ${
                                  measure.status === 'needs_attention'
                                    ? 'bg-amber-500 text-white shadow-sm scale-105'
                                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                                }`}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Attention</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleQuickMark(measure.id, 'failed', e)}
                                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 ${
                                  measure.status === 'failed'
                                    ? 'bg-rose-500 text-white shadow-sm scale-105'
                                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                                }`}
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Fail</span>
                              </button>
                            </div>

                            {/* Detailed Details Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenMarkMeasure(measure)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-500 transition-colors"
                              title="Add explanation & photo"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SLIDE-IN SIDE PANEL: MARK MEASURE WITH PHOTO & REMARKS      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          Boolean(activeMeasure) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setActiveMeasure(null)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          Boolean(activeMeasure) ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <ClipboardCheck className="w-3 h-3" />
              <span>Inspection Checkpoint</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Mark Preventive Measure
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select outcome, write remarks in English or Kinyarwanda, and attach photo evidence.
            </p>
          </div>
          <button
            onClick={() => setActiveMeasure(null)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeMeasure && (
          <form onSubmit={handleSaveMeasureForm} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Measure Info Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Checkpoint Name</span>
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                {activeMeasure.measureName}
              </p>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {activeMeasure.measureNameRw}
              </p>
            </div>

            {/* Big Outcome Selector */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                1. Hitamo uko kimeze / Select Outcome *
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('pass')}
                  className={`p-4 rounded-2xl border font-extrabold flex flex-col items-center gap-2 transition-all ${
                    selectedStatus === 'pass'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-102 ring-2 ring-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <div className="text-center">
                    <span className="block text-xs">Pass (🟢)</span>
                    <span className="text-[10px] opacity-80 font-normal">Ni Kizima</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('needs_attention')}
                  className={`p-4 rounded-2xl border font-extrabold flex flex-col items-center gap-2 transition-all ${
                    selectedStatus === 'needs_attention'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-102 ring-2 ring-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                  <div className="text-center">
                    <span className="block text-xs">Attention (🟡)</span>
                    <span className="text-[10px] opacity-80 font-normal">Gusana</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('failed')}
                  className={`p-4 rounded-2xl border font-extrabold flex flex-col items-center gap-2 transition-all ${
                    selectedStatus === 'failed'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 ring-2 ring-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50'
                  }`}
                >
                  <XCircle className="w-6 h-6" />
                  <div className="text-center">
                    <span className="block text-xs">Failed (🔴)</span>
                    <span className="text-[10px] opacity-80 font-normal">Byangiritse</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Explanation & Remarks */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                2. Sobanura uko bimeze / Explanation & Remarks *
              </label>
              <textarea
                rows={3}
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Andika ibisobanuro (e.g. Byakorewe isuku, amatara yose aratse, nta kintu cyangiritse...)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>

            {/* Photo Evidence Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  3. Ifoto y&apos;ikimenyetso / Photo Evidence ({evidencePhotos.length})
                </span>
                <span className="text-[10px] text-slate-400">Optional</span>
              </div>

              {evidencePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {evidencePhotos.map((p, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-24 bg-slate-100 dark:bg-slate-800"
                    >
                      <img
                        src={p}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEvidencePhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50/40 transition-all cursor-pointer text-center group">
                <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform mb-1">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                  Fata ifoto cyangwa kanda hano / Take Photo
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveMeasure(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
              >
                Cancel / Bireke
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save / Emeza</span>
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
};
