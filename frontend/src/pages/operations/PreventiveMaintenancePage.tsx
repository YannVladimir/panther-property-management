import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Camera,
  User,
  Building,
  Calendar,
  Sparkles,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Upload,
  Eye,
  Check,
  X,
  Layers,
  ShieldCheck,
  Flame,
  Zap,
  Droplets,
  Trash2,
  Home,
  Sliders,
  Settings,
  Info,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { PreventiveTask, PreventiveCategory, InspectionStatus } from '../../types';

interface MeasureItem {
  id: string;
  categoryKey: string;
  categoryTitle: string;
  categoryTitleRw: string;
  subCategoryTitle: string;
  subCategoryTitleRw: string;
  measureName: string;
  measureNameRw: string;
  frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
  frequencyRw: string;
  assignedStaffName: string;
  status: InspectionStatus;
  remarks: string;
  lastCompletedDate?: string;
  evidencePhotos: string[];
  scheduleWeek: number;
}

const defaultMeasures: MeasureItem[] = [
  // 1.1 Corridors & Stairs
  {
    id: 'meas-01',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.1 Corridors, Stairs & Public Areas',
    subCategoryTitleRw: '1.1 Korodoro, esikariye, uruhuriro rusange',
    measureName: 'Corridor and stairway lights intact & functional',
    measureNameRw: 'amatara ntago yangiritse',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'All 24 ceiling downlights in corridors and stairways operational with no flickering.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'meas-02',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.1 Corridors, Stairs & Public Areas',
    subCategoryTitleRw: '1.1 Korodoro, esikariye, uruhuriro rusange',
    measureName: 'Floor tiles polished, clean & uncracked',
    measureNameRw: 'amakaro arasa neza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Floors scrubbed, grout clean and dry. No loose tiles identified.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-03',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.1 Corridors, Stairs & Public Areas',
    subCategoryTitleRw: '1.1 Korodoro, esikariye, uruhuriro rusange',
    measureName: 'Windows clean, unbroken & latching correctly',
    measureNameRw: 'amadirishya arasa neza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Corridor window panes wiped. Latches lock properly.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-04',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.1 Corridors, Stairs & Public Areas',
    subCategoryTitleRw: '1.1 Korodoro, esikariye, uruhuriro rusange',
    measureName: 'Staircase railings & banisters sturdy & clean',
    measureNameRw: 'ibyuma bya esikariye birasa neza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Handrails firmly bolted, no sharp edges or paint peeling.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-05',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.1 Corridors, Stairs & Public Areas',
    subCategoryTitleRw: '1.1 Korodoro, esikariye, uruhuriro rusange',
    measureName: 'Public circulation pathways tidy & unobstructed',
    measureNameRw: 'aho banyura muri rusange hasa neza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Exit pathways free from shoes, boxes or maintenance items.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 1.2 Waste Management
  {
    id: 'meas-06',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.2 Waste Management & Trash Disposal',
    subCategoryTitleRw: '1.2 Aho bajugunya imyanda',
    measureName: 'Trash bins covered & not overflowing',
    measureNameRw: 'ibidobo bijyamo imyanda ntago bisendereye',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Waste collected on schedule by COPED. Lids securely closed.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-07',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.2 Waste Management & Trash Disposal',
    subCategoryTitleRw: '1.2 Aho bajugunya imyanda',
    measureName: 'Disposal area washed, sanitized & clean',
    measureNameRw: 'aho bashyira imyanda hasa neza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Disinfectant washed on concrete pad.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-08',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.2 Waste Management & Trash Disposal',
    subCategoryTitleRw: '1.2 Aho bajugunya imyanda',
    measureName: 'No bad or foul odors present',
    measureNameRw: 'ntago hafite impumuro mbi',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Deodorizing powder applied. Area odorless.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-09',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.2 Waste Management & Trash Disposal',
    subCategoryTitleRw: '1.2 Aho bajugunya imyanda',
    measureName: 'No insects, flies or vermin around bins',
    measureNameRw: 'nta dusimba/udukoko duhari',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'No pest activity detected.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-10',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.2 Waste Management & Trash Disposal',
    subCategoryTitleRw: '1.2 Aho bajugunya imyanda',
    measureName: 'No stagnant dirty wastewater accumulation',
    measureNameRw: 'nta mazi mabi yaretse',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Drain channel clear with good gradient flow.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 1.3 Roof & Drainage
  {
    id: 'meas-11',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.3 Roof & Rainwater Gutters',
    subCategoryTitleRw: '1.3 Igisenge',
    measureName: 'Roof tiles & waterproofing sheets intact without cracks',
    measureNameRw: 'ntago hasadutse/hangiritse',
    frequency: 'Bi-Weekly',
    frequencyRw: 'buri byumweru 2',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Inspected flashing and parapet membrane. No leaks reported.',
    lastCompletedDate: '2026-08-10',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-12',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.3 Roof & Rainwater Gutters',
    subCategoryTitleRw: '1.3 Igisenge',
    measureName: 'Rain gutters & drainage downspouts clear & functional',
    measureNameRw: "imireko n'imiyoboro y'amazi irakora neza",
    frequency: 'Bi-Weekly',
    frequencyRw: 'buri byumweru 2',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Leaves and sediment cleared from gutter wire guards.',
    lastCompletedDate: '2026-08-10',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 1.4 Pest Control
  {
    id: 'meas-13',
    categoryKey: '1-urushange',
    categoryTitle: '1. Common Circulation & Public Areas',
    categoryTitleRw: '1. Uruhuriro rusange',
    subCategoryTitle: '1.4 Pest Control & Fumigation',
    subCategoryTitleRw: '1.4 Kurwanya udusimba nudukoko twangiza',
    measureName: 'No pest activity (rodents, mosquitoes, cockroaches, etc.)',
    measureNameRw: "nta bimenyetso by'udukoko (imbeba, imibu, ibinyenzi, nibindi)",
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Bait stations inspected in basement & garden. Traps active.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 2. Electrical & Generator
  {
    id: 'meas-14',
    categoryKey: '2-amashanyarazi',
    categoryTitle: '2. Electrical Systems & Backup Power',
    categoryTitleRw: "2. Amashanyarazi n'ibikoresho",
    subCategoryTitle: '2.1 Backup Diesel Generator & ATS Panels',
    subCategoryTitleRw: '2.1 Jenerateri na ATS',
    measureName: 'ATS auto-starts generator in <10s upon power outage',
    measureNameRw: 'Jenerateri itangira mu masegonda <10 amashanyarazi agiye',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Fabrice Mugabo',
    status: 'pass',
    remarks: 'Simulated REG outage: generator synchronized in 6.4 seconds. Fuel tank at 88%.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: ['https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'],
    scheduleWeek: 33,
  },
  {
    id: 'meas-15',
    categoryKey: '2-amashanyarazi',
    categoryTitle: '2. Electrical Systems & Backup Power',
    categoryTitleRw: "2. Amashanyarazi n'ibikoresho",
    subCategoryTitle: '2.2 Main Distribution Panels & Breakers',
    subCategoryTitleRw: '2.2 Tableau rusange y’amashanyarazi',
    measureName: 'No tripped breakers or thermal overheating in commercial panel',
    measureNameRw: 'Nta disjoncteur zicika cyangwa zishyushye',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Fabrice Mugabo',
    status: 'needs_attention',
    remarks: 'Thermal check: Breaker #14 on Floor 3 measured at 48°C (Needs VoltMaster load balancing check).',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 3. Water Supply & Pumps
  {
    id: 'meas-16',
    categoryKey: '3-amazi',
    categoryTitle: '3. Water Supply, Booster Pumps & Reservoirs',
    categoryTitleRw: "3. Amazi n'imiyoboro",
    subCategoryTitle: '3.1 Booster Pumps & Pressure Switches',
    subCategoryTitleRw: '3.1 Pompi z’amazi n’umuvuduko',
    measureName: 'Water booster pump delivers steady 4-6 bar pressure without leaks',
    measureNameRw: 'Pompi y’amazi itanga umuvuduko ukwiye nta kuvuza',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Aimable Nkundimana',
    status: 'pass',
    remarks: 'Pressure gauge steady at 4.8 bar. Dual pump alternating correctly.',
    lastCompletedDate: '2026-08-13',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-17',
    categoryKey: '3-amazi',
    categoryTitle: '3. Water Supply, Booster Pumps & Reservoirs',
    categoryTitleRw: "3. Amazi n'imiyoboro",
    subCategoryTitle: '3.2 Rooftop Water Storage Tanks',
    subCategoryTitleRw: '3.2 Ibitega by’amazi hejuru ku nzu',
    measureName: 'Water storage tanks sealed, clean, and float valves functioning',
    measureNameRw: 'Ibitega bifunze neza, bisukuye kandi float valve irakora',
    frequency: 'Bi-Weekly',
    frequencyRw: 'buri byumweru 2',
    assignedStaffName: 'Aimable Nkundimana',
    status: 'pass',
    remarks: 'All 4x 5000L tanks inspected. Tank covers locked with security seals.',
    lastCompletedDate: '2026-08-13',
    evidencePhotos: [],
    scheduleWeek: 33,
  },

  // 4. Security & Fire
  {
    id: 'meas-18',
    categoryKey: '4-umutekano',
    categoryTitle: '4. Security & Fire Safety Systems',
    categoryTitleRw: "4. Umutekano n'ibizimya-muriro",
    subCategoryTitle: '4.1 Fire Extinguishers & Smoke Detectors',
    subCategoryTitleRw: '4.1 Ibizimya-muriro n’utumenyetso tw’umwotsi',
    measureName: 'Fire extinguisher pressure gauges in green zone & pins sealed',
    measureNameRw: 'Ibizimya-muriro bifite umuvuduko wemewe kandi bifunze',
    frequency: 'Monthly',
    frequencyRw: 'buri kwezi',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Inspected all 16 ABC powder units. Service tags valid through Dec 2026.',
    lastCompletedDate: '2026-08-01',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
  {
    id: 'meas-19',
    categoryKey: '4-umutekano',
    categoryTitle: '4. Security & Fire Safety Systems',
    categoryTitleRw: "4. Umutekano n'ibizimya-muriro",
    subCategoryTitle: '4.2 Motorized Gate & CCTV Cameras',
    subCategoryTitleRw: '4.2 Irembo rya moteri na camera',
    measureName: 'Electric access gate smooth & all CCTV channels recording',
    measureNameRw: 'Irembo rikora neza na camera zose zifata amashusho',
    frequency: 'Weekly',
    frequencyRw: 'buri cyumweru',
    assignedStaffName: 'Emmanuel Habimana',
    status: 'pass',
    remarks: 'Sliding gate track cleaned. All 18 IP camera streams live on NVR.',
    lastCompletedDate: '2026-08-14',
    evidencePhotos: [],
    scheduleWeek: 33,
  },
];

// Months for 52-week calendar view
const calendarMonths = [
  { name: 'JANUARY', isCurrent: false, weeks: [1, 2, 3, 4] },
  { name: 'FEBRUARY', isCurrent: false, weeks: [5, 6, 7, 8] },
  { name: 'MARCH', isCurrent: false, weeks: [9, 10, 11, 12] },
  { name: 'APRIL', isCurrent: false, weeks: [13, 14, 15, 16, 17] },
  { name: 'MAY', isCurrent: false, weeks: [18, 19, 20, 21] },
  { name: 'JUNE', isCurrent: false, weeks: [22, 23, 24, 25] },
  { name: 'JULY', isCurrent: false, weeks: [26, 27, 28, 29] },
  { name: 'AUGUST', isCurrent: true, weeks: [30, 31, 32, 33, 34] },
  { name: 'SEPTEMBER', isCurrent: false, weeks: [35, 36, 37, 38] },
  { name: 'OCTOBER', isCurrent: false, weeks: [39, 40, 41, 42] },
  { name: 'NOVEMBER', isCurrent: false, weeks: [43, 44, 45, 46] },
  { name: 'DECEMBER', isCurrent: false, weeks: [47, 48, 49, 50, 51, 52] },
];

export const PreventiveMaintenancePage: React.FC = () => {
  const { properties, employees } = useData();
  const { success, info } = useToast();

  const [measures, setMeasures] = useState<MeasureItem[]>(defaultMeasures);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWeek, setActiveWeek] = useState<number>(33); // Current August 2026 week

  // Collapsed state for category cards
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Week Inspection Modal / Drawer State
  const [inspectWeekModal, setInspectWeekModal] = useState<number | null>(null);
  const [inspectSelectedCategory, setInspectSelectedCategory] = useState<string>('all');
  const [markingMeasureId, setMarkingMeasureId] = useState<string | null>(null);
  const [markingStatus, setMarkingStatus] = useState<InspectionStatus>('pass');
  const [markingRemarks, setMarkingRemarks] = useState('');
  const [markingPhotoUrl, setMarkingPhotoUrl] = useState('');

  // Configure New Measure Modal State
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [newCatMode, setNewCatMode] = useState<'existing' | 'new'>('existing');
  const [selectedCatKey, setSelectedCatKey] = useState('1-urushange');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameRw, setNewCategoryNameRw] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [newSubCategoryNameRw, setNewSubCategoryNameRw] = useState('');
  const [newMeasureName, setNewMeasureName] = useState('');
  const [newMeasureNameRw, setNewMeasureNameRw] = useState('');
  const [newFrequency, setNewFrequency] = useState<'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly'>('Weekly');
  const [newInspector, setNewInspector] = useState('Emmanuel Habimana');

  const toggleCategoryCollapse = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  // Group measures by Category
  const groupedCategories = measures.reduce((acc, item) => {
    if (!acc[item.categoryKey]) {
      acc[item.categoryKey] = {
        key: item.categoryKey,
        title: item.categoryTitle,
        titleRw: item.categoryTitleRw,
        items: [],
      };
    }
    acc[item.categoryKey].items.push(item);
    return acc;
  }, {} as Record<string, { key: string; title: string; titleRw: string; items: MeasureItem[] }>);

  const categoryList = Object.values(groupedCategories);

  // Filtered categories
  const filteredCategoryList = categoryList
    .filter((cat) => selectedCategoryKey === 'all' || cat.key === selectedCategoryKey)
    .map((cat) => {
      const items = cat.items.filter((m) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            m.measureName.toLowerCase().includes(q) ||
            m.measureNameRw.toLowerCase().includes(q) ||
            m.remarks.toLowerCase().includes(q) ||
            m.subCategoryTitle.toLowerCase().includes(q)
          );
        }
        return true;
      });
      return { ...cat, items };
    })
    .filter((cat) => cat.items.length > 0);

  // Overall counts
  const totalMeasuresCount = measures.length;
  const passedMeasuresCount = measures.filter((m) => m.status === 'pass').length;
  const attentionMeasuresCount = measures.filter((m) => m.status === 'needs_attention').length;
  const failedMeasuresCount = measures.filter((m) => m.status === 'failed').length;
  const overallPassRate = Math.round((passedMeasuresCount / totalMeasuresCount) * 100);

  // Inspection Save Handler
  const handleSaveMeasureInspection = (measureId: string) => {
    const today = new Date().toISOString().split('T')[0];

    setMeasures((prev) =>
      prev.map((m) => {
        if (m.id === measureId) {
          return {
            ...m,
            status: markingStatus,
            remarks: markingRemarks || m.remarks,
            evidencePhotos: markingPhotoUrl ? [markingPhotoUrl, ...m.evidencePhotos] : m.evidencePhotos,
            lastCompletedDate: today,
            scheduleWeek: inspectWeekModal || m.scheduleWeek,
          };
        }
        return m;
      })
    );

    success(
      'Inspection Saved',
      `Check status marked as ${markingStatus.toUpperCase()} for Week ${inspectWeekModal}.`
    );
    setMarkingMeasureId(null);
    setMarkingRemarks('');
    setMarkingPhotoUrl('');
  };

  // Add New Measure Configuration Handler
  const handleCreateNewMeasure = (e: React.FormEvent) => {
    e.preventDefault();

    let catKey = selectedCatKey;
    let catTitle = '';
    let catTitleRw = '';

    if (newCatMode === 'new') {
      catKey = `cat-${Date.now()}`;
      catTitle = newCategoryName;
      catTitleRw = newCategoryNameRw || newCategoryName;
    } else {
      const existing = measures.find((m) => m.categoryKey === selectedCatKey);
      if (existing) {
        catTitle = existing.categoryTitle;
        catTitleRw = existing.categoryTitleRw;
      }
    }

    const newMeasure: MeasureItem = {
      id: `meas-${Date.now()}`,
      categoryKey: catKey,
      categoryTitle: catTitle,
      categoryTitleRw: catTitleRw,
      subCategoryTitle: newSubCategoryName || catTitle,
      subCategoryTitleRw: newSubCategoryNameRw || catTitleRw,
      measureName: newMeasureName,
      measureNameRw: newMeasureNameRw || newMeasureName,
      frequency: newFrequency,
      frequencyRw:
        newFrequency === 'Weekly'
          ? 'buri cyumweru'
          : newFrequency === 'Bi-Weekly'
          ? 'buri byumweru 2'
          : newFrequency === 'Monthly'
          ? 'buri kwezi'
          : 'buri gihembwe',
      assignedStaffName: newInspector,
      status: 'pass',
      remarks: 'Configured & ready for inspection checklist.',
      evidencePhotos: [],
      scheduleWeek: activeWeek,
    };

    setMeasures((prev) => [...prev, newMeasure]);
    setConfigModalOpen(false);
    setNewMeasureName('');
    setNewMeasureNameRw('');
    setNewSubCategoryName('');
    setNewSubCategoryNameRw('');
    success('Configuration Saved', `Added "${newMeasureName}" to preventive maintenance standards.`);
  };

  // Get week inspection status summary helper
  const getWeekInspectionSummary = (weekNum: number) => {
    if (weekNum === 33) {
      return { status: 'checked', label: '✓ 18/19 Pass', variant: 'success', note: '1 Attention' };
    }
    if (weekNum < 33 && weekNum >= 30) {
      return { status: 'checked', label: '✓ 100% Pass', variant: 'success', note: 'Completed' };
    }
    if (weekNum < 30 && weekNum % 3 === 0) {
      return { status: 'checked', label: '✓ Checked', variant: 'success', note: 'All Pass' };
    }
    if (weekNum < 30 && weekNum % 4 === 0) {
      return { status: 'checked', label: '▲ 1 Flagged', variant: 'warning', note: 'Breaker #14' };
    }
    if (weekNum > 33) {
      return { status: 'upcoming', label: 'Upcoming', variant: 'neutral', note: 'Scheduled' };
    }
    return { status: 'checked', label: '✓ 100% Pass', variant: 'success', note: 'Completed' };
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1 border border-emerald-200 dark:border-emerald-800/60">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Quality & Preventive Facility Standards
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white">
            Preventive Maintenance System
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Annual 52-Week inspection calendar & categorized facility checkpoints (Corridors, Roof, Waste, Electrical ATS, Pest Control).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Configure Preventive Measures</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Checkpoints</span>
          <p className="text-2xl font-extrabold font-display text-slate-900 dark:text-white">
            {totalMeasuresCount} Measures
          </p>
          <p className="text-[11px] text-slate-500">Across 4 core building domains</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Pass Rate</span>
          <p className="text-2xl font-extrabold font-display text-emerald-600 dark:text-emerald-400">
            {overallPassRate}%
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">{passedMeasuresCount} tasks compliant</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Needs Attention</span>
          <p className="text-2xl font-extrabold font-display text-amber-600 dark:text-amber-400">
            {attentionMeasuresCount} Checkpoint
          </p>
          <p className="text-[11px] text-amber-600 font-semibold">Thermal breaker #14 flagged</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border shadow-soft space-y-1 bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Failed / Critical</span>
          <p className="text-2xl font-extrabold font-display text-rose-600 dark:text-rose-400">
            {failedMeasuresCount} Issues
          </p>
          <p className="text-[11px] text-slate-400">Zero critical structural failures</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. YEAR 2026: WEEKLY CALENDAR (VIEW BY WEEK)                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 rounded-3xl border shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
                YEAR 2026: WEEKLY CALENDAR
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              VIEW BY WEEK • Click on any week cell to review or log inspection measures for that period.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Current: Week 33 (August 2026)
            </span>
          </div>
        </div>

        {/* 12-Month Grid Calendar */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-6 lg:grid-cols-12 gap-2.5 min-w-[950px]">
            {calendarMonths.map((m) => {
              const isCurrentMonth = m.isCurrent || m.name === 'AUGUST';

              return (
                <div key={m.name} className="space-y-2 flex flex-col">
                  {/* Month Header Banner (Clean minimal style, active month highlighted) */}
                  <div
                    className={`py-2 px-1 text-center rounded-xl font-extrabold text-[11px] tracking-wider transition-all ${
                      isCurrentMonth
                        ? 'bg-brand-600 text-white shadow-sm border border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m.name}
                  </div>

                {/* Week Cards in Month */}
                <div className="space-y-2 flex-1">
                  {m.weeks.map((wk) => {
                    const info = getWeekInspectionSummary(wk);
                    const isActive = wk === activeWeek;

                    return (
                      <button
                        key={wk}
                        onClick={() => {
                          setInspectWeekModal(wk);
                          setActiveWeek(wk);
                        }}
                        className={`w-full p-2.5 rounded-2xl border text-left transition-all duration-200 group flex flex-col justify-between min-h-[72px] ${
                          isActive
                            ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                            : info.status === 'checked'
                            ? 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-300'
                            : 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-extrabold text-[11px] font-mono text-slate-800 dark:text-slate-200">
                            W{wk < 10 ? `0${wk}` : wk}
                          </span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                          )}
                        </div>

                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                                info.variant === 'success'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : info.variant === 'warning'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {info.label}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-400 block truncate font-medium">
                            {info.note}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. PREVENTIVE MEASURES BREAKDOWN (EXCEL-STYLE COLLAPSIBLE)  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold font-display text-slate-900 dark:text-white">
              Preventive Facility Inspection Master List
            </h2>
            <p className="text-xs text-slate-500">
              Structured inspection standards (Uruhuriro rusange, Amashanyarazi, Amazi, Umutekano) with bilingual specifications and explanation logs.
            </p>
          </div>
        </div>

        {/* Filter and Category Selection Bar */}
        <div className="glass-card p-4 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search measures by description (English or Ikinyarwanda), remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category Filter Pills / Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedCategoryKey('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryKey === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Categories ({measures.length})
            </button>
            {categoryList.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryKey(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryKey === cat.key
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat.titleRw || cat.title} ({cat.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Category Cards */}
        <div className="space-y-4">
          {filteredCategoryList.map((cat) => {
            const isCollapsed = Boolean(collapsedCategories[cat.key]);
            const catPassed = cat.items.filter((m) => m.status === 'pass').length;
            const catRate = Math.round((catPassed / cat.items.length) * 100);

            return (
              <div
                key={cat.key}
                className="glass-card rounded-3xl shadow-soft overflow-hidden border transition-all"
              >
                {/* Category Header (Click to Collapse/Expand) */}
                <div
                  onClick={() => toggleCategoryCollapse(cat.key)}
                  className="p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold font-display text-slate-900 dark:text-white">
                          {cat.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px]">
                          {cat.titleRw}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cat.items.length} Checkpoints • Standard Facility Inspection Framework
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm font-mono text-emerald-600 dark:text-emerald-400">
                      {catRate}% Compliant ({catPassed}/{cat.items.length})
                    </span>
                    <Badge variant={catRate === 100 ? 'success' : catRate >= 80 ? 'info' : 'warning'} size="sm">
                      {catRate === 100 ? 'ALL PASS' : 'FLAGGED'}
                    </Badge>
                  </div>
                </div>

                {/* Collapsible Table Content */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-50/30 dark:bg-slate-800/20">
                          <th className="py-3 px-6 w-1/4">Sub-Category & Domain</th>
                          <th className="py-3 px-4 w-1/3">Standard Measure / Ibisobanuro</th>
                          <th className="py-3 px-4">Frequency</th>
                          <th className="py-3 px-4">Inspector</th>
                          <th className="py-3 px-4">Current Status</th>
                          <th className="py-3 px-6 text-right">Remarks & Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {cat.items.map((m) => (
                          <tr
                            key={m.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                          >
                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                              <div>
                                <p className="text-xs font-extrabold text-brand-600 dark:text-brand-400">
                                  {m.subCategoryTitle}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  {m.subCategoryTitleRw}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-900 dark:text-white text-xs">
                                {m.measureName}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono italic mt-0.5">
                                &ldquo;{m.measureNameRw}&rdquo;
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                                {m.frequency} ({m.frequencyRw})
                              </span>
                            </td>
                            <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                              {m.assignedStaffName}
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                variant={
                                  m.status === 'pass'
                                    ? 'success'
                                    : m.status === 'needs_attention'
                                    ? 'warning'
                                    : m.status === 'failed'
                                    ? 'danger'
                                    : 'neutral'
                                }
                                size="sm"
                                dot
                              >
                                {m.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {m.evidencePhotos.length > 0 && (
                                  <a
                                    href={m.evidencePhotos[0]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors"
                                    title="View Evidence Photo"
                                  >
                                    <Camera className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    setInspectWeekModal(activeWeek);
                                    setMarkingMeasureId(m.id);
                                    setMarkingStatus(m.status);
                                    setMarkingRemarks(m.remarks);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs transition-colors inline-flex items-center gap-1"
                                >
                                  <ClipboardCheck className="w-3.5 h-3.5" />
                                  <span>Log Check</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: WEEK INSPECTION CHECKLIST & MARKING                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {inspectWeekModal && (
        <Modal
          isOpen={Boolean(inspectWeekModal)}
          onClose={() => {
            setInspectWeekModal(null);
            setMarkingMeasureId(null);
          }}
          title={`Week ${inspectWeekModal} Inspection Checklist & Marking`}
          subtitle="Mark check status, write remarks (Ibitekerezo/Ibisobanuro), and attach inspection evidence photos."
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Category Filter for Inspection */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  inspectSelectedCategory === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Domains ({measures.length})
              </button>
              {categoryList.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setInspectSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    inspectSelectedCategory === cat.key
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat.titleRw || cat.title}
                </button>
              ))}
            </div>

            {/* Measures List to Mark */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {measures
                .filter((m) => inspectSelectedCategory === 'all' || m.categoryKey === inspectSelectedCategory)
                .map((m) => {
                  const isMarkingThis = markingMeasureId === m.id;

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isMarkingThis
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400">
                            {m.subCategoryTitleRw || m.subCategoryTitle}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                            {m.measureName}
                          </h4>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">
                            &ldquo;{m.measureNameRw}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant={
                              m.status === 'pass'
                                ? 'success'
                                : m.status === 'needs_attention'
                                ? 'warning'
                                : m.status === 'failed'
                                ? 'danger'
                                : 'neutral'
                            }
                            size="sm"
                            dot
                          >
                            {m.status.toUpperCase()}
                          </Badge>
                          {!isMarkingThis && (
                            <button
                              onClick={() => {
                                setMarkingMeasureId(m.id);
                                setMarkingStatus(m.status);
                                setMarkingRemarks(m.remarks);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-brand-600 hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Marking Form */}
                      {isMarkingThis ? (
                        <div className="mt-4 pt-3 border-t border-brand-200 dark:border-brand-800 space-y-3">
                          <div>
                            <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                              Inspection Status *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setMarkingStatus('pass')}
                                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                                  markingStatus === 'pass'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Pass (Yujuje)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMarkingStatus('needs_attention')}
                                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                                  markingStatus === 'needs_attention'
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Needs Attention</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMarkingStatus('failed')}
                                className={`py-2 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                                  markingStatus === 'failed'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Failed (Ntibishobotse)</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                              Explanation & Remarks (Ibitekerezo / Ibisobanuro) *
                            </label>
                            <textarea
                              rows={2}
                              value={markingRemarks}
                              onChange={(e) => setMarkingRemarks(e.target.value)}
                              placeholder="Describe observation, condition found, parts checked, or follow-up needed..."
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border font-medium resize-none"
                            />
                          </div>

                          <div>
                            <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                              Evidence Photo (Upload Image)
                            </label>
                            <div className="space-y-2">
                              {markingPhotoUrl ? (
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group w-full h-36 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  <img
                                    src={markingPhotoUrl}
                                    alt="Evidence preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                    <label className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-100 transition-colors shadow-sm inline-flex items-center gap-1">
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Change</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setMarkingPhotoUrl(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setMarkingPhotoUrl('')}
                                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm inline-flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-all cursor-pointer text-center group">
                                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform mb-1.5">
                                    <Upload className="w-5 h-5" />
                                  </div>
                                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200">
                                    Click or Drag to Upload Inspection Photo
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    Supports PNG, JPG, WebP from camera or device
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setMarkingPhotoUrl(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setMarkingMeasureId(null)}
                              className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveMeasureInspection(m.id)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                            >
                              Save Inspection Check
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                          <p className="italic line-clamp-1">&ldquo;{m.remarks}&rdquo;</p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            Last: {m.lastCompletedDate || 'Pending'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. SLIDE-IN SIDE PANEL: CONFIGURE PREVENTIVE MEASURES        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          configModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setConfigModalOpen(false)}
      />

      <aside
        className={`fixed right-0 top-0 h-full z-50 w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          configModalOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-[10px] mb-1">
              <Settings className="w-3 h-3" />
              <span>Facility Standards Configuration</span>
            </div>
            <h2 className="text-lg font-extrabold font-display text-slate-900 dark:text-white">
              Configure Preventive Measure
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define new quality checkpoints, specify Kinyarwanda/English criteria, and assign frequencies.
            </p>
          </div>
          <button
            onClick={() => setConfigModalOpen(false)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleCreateNewMeasure} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Category Destination *
            </span>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setNewCatMode('existing')}
                className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                  newCatMode === 'existing'
                    ? 'bg-slate-900 dark:bg-brand-600 text-white border-slate-900 dark:border-brand-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                Add to Existing Domain
              </button>
              <button
                type="button"
                onClick={() => setNewCatMode('new')}
                className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                  newCatMode === 'new'
                    ? 'bg-slate-900 dark:bg-brand-600 text-white border-slate-900 dark:border-brand-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                Create New Domain
              </button>
            </div>

            {newCatMode === 'existing' ? (
              <div>
                <select
                  value={selectedCatKey}
                  onChange={(e) => setSelectedCatKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                >
                  {categoryList.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.title} ({cat.titleRw})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">
                    Category Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. 5. Garden & Swimming Pool"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">
                    Category Title (Ikinyarwanda)
                  </label>
                  <input
                    type="text"
                    value={newCategoryNameRw}
                    onChange={(e) => setNewCategoryNameRw(e.target.value)}
                    placeholder="e.g. 5. Ubusitani na Pisine"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Sub-Category Domain (English)
              </label>
              <input
                type="text"
                value={newSubCategoryName}
                onChange={(e) => setNewSubCategoryName(e.target.value)}
                placeholder="e.g. Pool filtration & water clarity"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Sub-Category (Ikinyarwanda)
              </label>
              <input
                type="text"
                value={newSubCategoryNameRw}
                onChange={(e) => setNewSubCategoryNameRw(e.target.value)}
                placeholder="e.g. Isukura ry'amazi ya pisine"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Preventive Measure Specification (English) *
            </label>
            <input
              type="text"
              required
              value={newMeasureName}
              onChange={(e) => setNewMeasureName(e.target.value)}
              placeholder="e.g. Inspect water pH level 7.2-7.8 & chlorine balance"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">
              Measure Criteria (Ikinyarwanda) *
            </label>
            <input
              type="text"
              required
              value={newMeasureNameRw}
              onChange={(e) => setNewMeasureNameRw(e.target.value)}
              placeholder="e.g. Amazi asa neza nta byondo kandi chlorine iringaniye"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Inspection Frequency *
              </label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              >
                <option value="Weekly">Weekly (Buri cyumweru)</option>
                <option value="Bi-Weekly">Bi-Weekly (Buri byumweru 2)</option>
                <option value="Monthly">Monthly (Buri kwezi)</option>
                <option value="Quarterly">Quarterly (Buri gihembwe)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">
                Assigned Inspector *
              </label>
              <input
                type="text"
                value={newInspector}
                onChange={(e) => setNewInspector(e.target.value)}
                placeholder="e.g. Emmanuel Habimana"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-brand-700 dark:text-brand-300">
              <Info className="w-4 h-4" />
              <span>Standard Maintenance Guidelines</span>
            </div>
            <p className="text-[11px] text-brand-800 dark:text-brand-300/80 leading-relaxed">
              Once created, this quality checkpoint will be integrated into the 52-Week inspection schedule and listed under its respective category.
            </p>
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfigModalOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Save Measure Specification</span>
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
