/**
 * BharatStandards AI - Centralized In-Browser Prototype & Demo Store
 * Powers full offline and Netlify static demonstration mode when backend API is offline.
 * Mirrors all benchmark SIH evaluation data: DEMO-IS-001 water heater, compliance audits,
 * risk assessments, BIS services, documents, and interactive AI assistant answers.
 */

const STORAGE_KEYS = {
  PRODUCTS: 'bs_mock_products_v2',
  DOCUMENTS: 'bs_mock_documents_v2',
  COMPLIANCE: 'bs_mock_compliance_v2',
  ACTIVITIES: 'bs_mock_activities_v2',
  CONVERSATIONS: 'bs_mock_conversations_v2',
};

// Benchmark Demonstration Standards Catalog
export const MOCK_STANDARDS = [
  {
    id: 1,
    standard_number: 'DEMO-IS-001',
    title: 'Electric Water Heater Safety — Demonstration Standard',
    category: 'Electrical Appliances',
    scope:
      'Demonstration scope for electric storage water heaters: specifies electrical safety, thermal cutoff, pressure vessel endurance, and energy efficiency for appliances operated on single-phase 230V AC mains up to 250V capacity.',
    description:
      'Synthetic benchmark standard modeling BIS Scheme-I ISI certification criteria for stationary storage type electric water heaters used in residential and commercial installations.',
    version: '2026-DEMO',
    status: 'DEMO',
    source: 'Synthetic Demo Knowledge Base',
    publication_date: '2026-01-15T00:00:00Z',
    is_demo: true,
    total_requirements: 20,
  },
  {
    id: 2,
    standard_number: 'DEMO-IS-002',
    title: 'Safety of Household and Similar Electrical Appliances — General Requirements',
    category: 'Electrical Appliances',
    scope: 'General safety requirements for domestic electrical appliances operating under 250V.',
    description: 'Fundamental electric shock, mechanical hazard, and fire resistance criteria.',
    version: '2026-DEMO',
    status: 'ACTIVE',
    source: 'Synthetic Demo Knowledge Base',
    publication_date: '2026-02-01T00:00:00Z',
    is_demo: true,
    total_requirements: 12,
  },
  {
    id: 3,
    standard_number: 'DEMO-IS-003',
    title: 'Photovoltaic Modules — Terrestrial Crystalline Silicon Performance',
    category: 'Solar & Renewable Energy',
    scope: 'Design qualification and type approval of terrestrial crystalline silicon photovoltaic modules.',
    description: 'Modeling BIS Compulsory Registration Scheme (CRS) criteria for solar PV modules.',
    version: '2026-DEMO',
    status: 'ACTIVE',
    source: 'Synthetic Demo Knowledge Base',
    publication_date: '2026-01-10T00:00:00Z',
    is_demo: true,
    total_requirements: 14,
  },
  {
    id: 4,
    standard_number: 'DEMO-IS-004',
    title: 'Energy Efficiency of Distribution Transformers',
    category: 'Power Systems',
    scope: 'Standardized energy loss thresholds and maximum total losses at 50% and 100% loading.',
    description: 'BEE and BIS mandatory conformance framework for energy-efficient transformers.',
    version: '2026-DEMO',
    status: 'ACTIVE',
    source: 'Synthetic Demo Knowledge Base',
    publication_date: '2025-11-20T00:00:00Z',
    is_demo: true,
    total_requirements: 8,
  },
  {
    id: 5,
    standard_number: 'DEMO-IS-005',
    title: 'Lead-Acid Storage Batteries — Specification',
    category: 'Energy Storage',
    scope: 'Performance and durability requirements for stationary and automotive lead-acid accumulators.',
    description: 'Electrochemical durability, cycle life, and acid mist containment standards.',
    version: '2026-DEMO',
    status: 'ACTIVE',
    source: 'Synthetic Demo Knowledge Base',
    publication_date: '2025-09-15T00:00:00Z',
    is_demo: true,
    total_requirements: 10,
  },
];

// Benchmark Requirements for DEMO-IS-001 (15 PASS, 3 PARTIAL, 2 MISSING)
export const MOCK_REQUIREMENTS = [
  {
    id: 101,
    standard_id: 1,
    clause: '4.1',
    title: 'Electrical Insulation & Earthing Continuity',
    description: 'Ground continuity resistance between earthing terminal and accessible metallic parts must not exceed 0.1 ohm.',
    category: 'SAFETY',
    evidence_required: 'NABL accredited earth continuity lab report with calibration certificate.',
    verification_method: 'Earth bond resistance meter at 25A AC test current for 60 seconds.',
    weight: 2.0,
    page: 8,
  },
  {
    id: 102,
    standard_id: 1,
    clause: '6.1',
    title: 'Dielectric Voltage Withstand & Electric Strength',
    description: 'Appliance insulation must withstand 1500 V AC for 60 seconds without flashover or puncture.',
    category: 'SAFETY',
    evidence_required: 'High-voltage dielectric test report from accredited testing facility.',
    verification_method: 'Calibrated HV test set with leakage trip threshold set to 5 mA.',
    weight: 3.0,
    page: 12,
  },
  {
    id: 103,
    standard_id: 1,
    clause: '7.1',
    title: 'Protection Against Electric Shock & Live Contact',
    description: 'Live electrical parts must be inaccessible to standard test finger probe under 30N force.',
    category: 'SAFETY',
    evidence_required: 'Articulated finger probe test report with mechanical force gauge verification.',
    verification_method: 'Standard test finger probe inspection.',
    weight: 2.0,
    page: 14,
  },
  {
    id: 104,
    standard_id: 1,
    clause: '8.2',
    title: 'Input Power & Current Rating Tolerance',
    description: 'Power consumption under rated voltage shall not deviate by more than +5% or -10% from nameplate 2000W.',
    category: 'PERFORMANCE',
    evidence_required: 'Power analyzer calibrated report under stabilized supply voltage.',
    verification_method: 'Precision digital power meter logging at rated 230V RMS input.',
    weight: 2.0,
    page: 16,
  },
  {
    id: 105,
    standard_id: 1,
    clause: '9.3',
    title: 'Heating Performance & Thermostat Cutoff Operation',
    description: 'Thermostat must reliably cut off power at set temperature (65°C +/- 3°C) and reset within rated hysterisis.',
    category: 'PERFORMANCE',
    evidence_required: 'Thermostatic cycling thermal profile and calibration data.',
    verification_method: 'Data acquisition thermal logger with 4-point thermocouple immersion.',
    weight: 3.0,
    page: 20,
  },
  {
    id: 106,
    standard_id: 1,
    clause: '10.1',
    title: 'Thermal Cut-out Safety Backup (Non-self-resetting)',
    description: 'Independent thermal cut-out must trip before water reaches 95°C and require manual intervention to reset.',
    category: 'SAFETY',
    evidence_required: 'Thermal cut-out safety test report with trip time log.',
    verification_method: 'Simulated thermostat failure test with continuous temperature recording.',
    weight: 4.0,
    page: 24,
  },
  {
    id: 107,
    standard_id: 1,
    clause: '12.1',
    title: 'Hydrostatic Pressure Proof Test',
    description: 'Inner pressure vessel must withstand 1.2 MPa (12 bar) hydrostatic test for 15 minutes without leakage or deformation.',
    category: 'TESTING',
    evidence_required: 'Hydrostatic pressure proof test certificate with pressure graph.',
    verification_method: 'Calibrated hydraulic pump with certified digital pressure transducer.',
    weight: 3.0,
    page: 28,
  },
  {
    id: 108,
    standard_id: 1,
    clause: '13.2',
    title: 'Pressure Relief Valve (PRV) Cracking Verification',
    description: 'Safety valve must release pressure at 0.85 MPa (+/- 0.05 MPa) to prevent rupture.',
    category: 'SAFETY',
    evidence_required: 'PRV discharge test report from accredited laboratory.',
    verification_method: 'Slow-rate pneumatic/hydraulic pressure ramp with calibrated manometer.',
    weight: 2.0,
    page: 30,
  },
  {
    id: 109,
    standard_id: 1,
    clause: '14.1',
    title: 'Standing Heat Loss & Standing Loss Energy Factor',
    description: 'Standing 24-hour energy loss must not exceed 0.788 kWh/24h/45°C delta for 25L rating.',
    category: 'EFFICIENCY',
    evidence_required: 'Energy efficiency standing loss laboratory test certificate.',
    verification_method: '24-hour thermal equilibrium test in climate chamber controlled at 25°C.',
    weight: 3.0,
    page: 32,
  },
  {
    id: 110,
    standard_id: 1,
    clause: '15.2',
    title: 'Internal Corrosion Protection & Sacrificial Anode',
    description: 'Inner vessel must be enamel glass-lined or stainless steel with magnesium sacrificial anode.',
    category: 'MATERIALS',
    evidence_required: 'Vessel metallurgy certificate and anode composition report.',
    verification_method: 'Spectrometric metal analysis and coating thickness magnetic gauge inspection.',
    weight: 2.0,
    page: 34,
  },
  {
    id: 111,
    standard_id: 1,
    clause: '16.1',
    title: 'Wiring Insulation, Terminals & Cord Anchorage',
    description: 'Internal wiring must use heat-resistant silicone/PVC rated to 105°C; cord pull relief must withstand 100N pull.',
    category: 'SAFETY',
    evidence_required: 'Wiring flammability and cord pull test report.',
    verification_method: 'Cord pull fixture applying 100N force 25 times.',
    weight: 2.0,
    page: 36,
  },
  {
    id: 112,
    standard_id: 1,
    clause: '17.3',
    title: 'Corrosion Resistance of Exterior Enclosure',
    description: 'Exterior powder-coated sheet metal must withstand 96 hours continuous neutral salt spray without blistering.',
    category: 'MATERIALS',
    evidence_required: 'Neutral salt spray (NSS) chamber test certificate per IS 9844.',
    verification_method: '96-hour continuous 5% NaCl salt fog exposure at 35°C.',
    weight: 2.0,
    page: 38,
  },
  {
    id: 113,
    standard_id: 1,
    clause: '18.2',
    title: 'Quality Manual & Factory Production Control',
    description: 'The manufacturing plant must operate a formal Scheme-I Quality Manual with traceability logs and routine inspection logs.',
    category: 'DOCUMENTATION',
    evidence_required: 'Scheme-I Factory Quality Dossier, calibration certificates, and routine test logbooks.',
    verification_method: 'Auditor document review and calibration trace verification.',
    weight: 3.0,
    page: 41,
  },
  {
    id: 114,
    standard_id: 1,
    clause: '19.3',
    title: 'Ingress Protection Rating (IPX4 Splash-proof Verification)',
    description: 'Enclosure must satisfy IPX4 splash water ingress protection without moisture reaching electrical terminal blocks.',
    category: 'TESTING',
    evidence_required: 'IPX4 oscillating spray test report with humidity preconditioning certificate.',
    verification_method: '10-minute oscillating spray tube followed immediately by high-voltage dielectric check.',
    weight: 2.0,
    page: 43,
  },
  {
    id: 115,
    standard_id: 1,
    clause: '20.1',
    title: 'Protective Packaging & Transit Drop Test',
    description: 'Packaged water heater must withstand free-fall drop from 750 mm without mechanical or insulation damage.',
    category: 'PACKAGING',
    evidence_required: 'Transit packaging vibration and drop test certificate.',
    verification_method: 'Six-sided free-fall drop test per national packaging test procedures.',
    weight: 2.0,
    page: 45,
  },
  {
    id: 116,
    standard_id: 1,
    clause: '21.2',
    title: 'Routine Test Set Calibration Certificates & Audit Trace',
    description: 'Daily end-of-line test instruments (HV tester, earth bond meter, leakage meter) must possess valid NABL calibration trace.',
    category: 'DOCUMENTATION',
    evidence_required: 'Valid annual calibration certificates for end-of-line production testing apparatus.',
    verification_method: 'Review of calibration validity stamps and NABL certificate numbers.',
    weight: 2.0,
    page: 48,
  },
  {
    id: 117,
    standard_id: 1,
    clause: '11.4',
    title: 'Thermal Runaway Multi-channel Calibration Logs',
    description: 'Verification logs from multi-channel thermal probe arrays demonstrating thermocouple response under dry-burn cutoff failure mode.',
    category: 'TESTING',
    evidence_required: 'Multi-channel thermocouple calibration curve and data acquisition log during simulated dry-fire runaway.',
    verification_method: 'Continuous temperature logging at 100ms sample interval during heating element de-watering.',
    weight: 4.0,
    page: 52,
  },
  {
    id: 118,
    standard_id: 1,
    clause: '19.1',
    title: 'Bilingual Rating Plate Proof & Statutory Warnings',
    description: 'Statutory advisory warnings ("DO NOT SWITCH ON WITHOUT WATER") and full electrical parameters must be legibly marked in Hindi and English.',
    category: 'MARKING',
    evidence_required: 'Approved bilingual label engineering drawing and photographic proof of Hindi/English marking plate on appliance exterior.',
    verification_method: 'Bilingual typography inspection and rub durability test per statutory requirements.',
    weight: 4.0,
    page: 55,
  },
];

// Initial Benchmark Product
const INITIAL_PRODUCTS = [
  {
    id: 1,
    user_id: 1,
    name: 'Domestic Electric Water Heater',
    category: 'Electrical Appliances',
    manufacturer: 'Bharat ElectroCorp Ltd.',
    model_number: 'DEWH-25L-2026',
    description:
      'Stationary residential storage electric water heater (25L capacity, 2000W heating element, 230V AC single-phase). Fitted with immersion heating unit, dual thermostat cut-offs, and enamel-lined pressure vessel.',
    intended_use: 'Domestic sanitary hot water supply for residential bathrooms and kitchens.',
    technical_details:
      'Voltage: 230V AC, 50Hz\nRated Power: 2000W\nTank Capacity: 25 Litres\nWorking Pressure: 0.8 MPa (8 bar)\nInsulation: High-density CFC-free polyurethane foam (PUF)\nSafety: Dual thermal cutoff, pressure relief safety valve (PRV), IPX4 splash proof.\nTarget Market: Domestic Indian Market (Scheme-I ISI Mark Certification)',
    status: 'READY',
    created_at: '2026-09-06T10:00:00Z',
    updated_at: '2026-09-06T10:00:00Z',
  },
];

// Initial Documents
const INITIAL_DOCUMENTS = [
  {
    id: 1,
    user_id: 1,
    product_id: 1,
    filename: 'dewh_test_report_nabl_2026.pdf',
    original_filename: 'NABL Laboratory Test Report - DEWH 25L (2026).pdf',
    file_type: 'PDF',
    mime_type: 'application/pdf',
    file_size: 2450000,
    status: 'PROCESSED',
    page_count: 12,
    created_at: '2026-09-06T10:05:00Z',
  },
  {
    id: 2,
    user_id: 1,
    product_id: 1,
    filename: 'dewh_user_installation_manual_2026.pdf',
    original_filename: 'Installation & Technical User Manual - DEWH 25L.pdf',
    file_type: 'PDF',
    mime_type: 'application/pdf',
    file_size: 1180000,
    status: 'PROCESSED',
    page_count: 24,
    created_at: '2026-09-06T10:06:00Z',
  },
];

// Initial Compliance Report
const INITIAL_COMPLIANCE_REPORTS = [
  {
    id: 1,
    product_id: 1,
    standard_id: 1,
    user_id: 1,
    readiness_score: 78,
    status: 'COMPLETED',
    total_requirements: 20,
    passed_requirements: 15,
    partial_requirements: 3,
    missing_requirements: 2,
    risk_score: 39,
    risk_level: 'MEDIUM',
    summary_text:
      'Product DEWH-25L-2026 exhibits high baseline compliance (78% readiness score) against DEMO-IS-001. 15 safety & performance clauses fully verified. 3 partial items require updated calibration trace. 2 gaps detected: missing bilingual rating plate marking (Clause 19.1) and dry-burn calibration logs (Clause 11.4).',
    created_at: '2026-09-06T10:10:00Z',
    updated_at: '2026-09-06T10:10:00Z',
  },
];

// Initial BIS Services
export const MOCK_SERVICES = [
  {
    id: 1,
    service_code: 'DEMO-SERVICE-001',
    name: 'BIS Scheme-I Product Certification (ISI Mark) — Demonstration Guide',
    description:
      'Synthetic demonstration guidance modeling the BIS Scheme-I Product Certification process. Structured roadmap for establishing in-house factory testing, third-party type examination, and statutory audit readiness.',
    category: 'CERTIFICATION',
    user_type: 'BOTH',
    eligibility:
      'Domestic and international manufacturers possessing an active manufacturing facility, calibrated laboratory equipment for routine batch testing, and a documented quality management system.',
    required_documents: [
      'Factory Quality Control Plan (QAP) & Inspection Schedule',
      'Manufacturing Facility Layout & Machinery Inventory',
      'In-House Calibrated Test Equipment Calibration Certificates',
      'Third-Party Type Test Dossier from NABL / BIS-Recognized Laboratory',
      'Critical Component Conformance Certificates (Thermostat, Thermal Cut-out, Wiring)',
      'Factory Registration / Business Incorporation Certificate',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Factory Quality Management & Testing Facility Setup',
        description: 'Ensure in-house testing equipment is calibrated and Scheme-I Quality Assurance Plan (QAP) is documented.',
        action_type: 'VIEW_STANDARD',
        action_target: '/standards',
      },
      {
        step_number: 2,
        title: 'Preliminary Type Examination at Accredited Laboratory',
        description: 'Submit representative production samples to an accredited laboratory for statutory testing.',
        action_type: 'UPLOAD_DOCUMENT',
        action_target: '/documents',
      },
      {
        step_number: 3,
        title: 'Manakonline Portal Application Submission',
        description: 'File statutory Form-V along with factory layout, test reports, and initial statutory fee.',
        action_type: 'OPEN_OFFICIAL_SOURCE',
        action_target: 'https://www.manakonline.in',
      },
      {
        step_number: 4,
        title: 'Factory Verification Audit by BIS Inspecting Officer',
        description: 'BIS inspecting officer visits manufacturing premises to verify manufacturing capability and routine testing.',
        action_type: 'CONTACT_AUTHORITY',
        action_target: 'https://bis.gov.in',
      },
      {
        step_number: 5,
        title: 'Grant of Certification License & ISI Mark Allotment',
        description: 'Upon successful inspection and independent sample testing, CM/L certification license number is issued.',
        action_type: 'VIEW_SERVICE',
        action_target: '/services/1',
      },
    ],
    official_source_name: 'Manakonline BIS Portal',
    official_source_url: 'https://www.manakonline.in',
    status: 'ACTIVE',
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-06T10:00:00Z',
  },
  {
    id: 2,
    service_code: 'DEMO-SERVICE-002',
    name: 'Compulsory Registration Scheme (CRS) for Electronic & IT Goods',
    description:
      'Self-declaration of conformity framework mandated under MeitY notifications for electronics, IT equipment, and solar inverters.',
    category: 'REGISTRATION',
    user_type: 'INDUSTRY',
    eligibility: 'Electronic equipment and solar module manufacturers distributing in the Indian domestic market.',
    required_documents: [
      'NABL Test Report per applicable Indian Standard',
      'Brand / Trademark Registration Certificate',
      'Factory Business License and Authorized Indian Representative (AIR) appointment',
    ],
    steps: [
      {
        step_number: 1,
        title: 'Sample Testing at BIS Recognized Laboratory',
        description: 'Send safety-critical electronic samples for safety and EMC testing under relevant IS standard.',
        action_type: 'UPLOAD_DOCUMENT',
        action_target: '/documents',
      },
      {
        step_number: 2,
        title: 'Online CRS Portal Filing',
        description: 'Register brand and submit test report within 90 days of issuance.',
        action_type: 'OPEN_OFFICIAL_SOURCE',
        action_target: 'https://www.crsbis.in',
      },
      {
        step_number: 3,
        title: 'Registration Grant & Standard Mark Labeling',
        description: 'Receive R-number and affix CRS safety logo on product packaging.',
        action_type: 'VIEW_SERVICE',
        action_target: '/services/2',
      },
    ],
    official_source_name: 'BIS CRS Portal',
    official_source_url: 'https://www.crsbis.in',
    status: 'ACTIVE',
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-06T10:00:00Z',
  },
  {
    id: 3,
    service_code: 'DEMO-SERVICE-003',
    name: 'BIS Laboratory Recognition Scheme (LRS)',
    description:
      'Audit and recognition scheme for external third-party test laboratories verifying conformity with Indian Standards.',
    category: 'TESTING',
    user_type: 'LABORATORY',
    eligibility: 'Test laboratories with ISO/IEC 17025 accreditation.',
    required_documents: ['NABL Accreditation Certificate', 'Equipment Calibration Traceability', 'Proficiency Testing Records'],
    steps: [
      {
        step_number: 1,
        title: 'Accreditation Scope Verification',
        description: 'Ensure ISO/IEC 17025 scope matches target Indian Standards.',
        action_type: 'VIEW_STANDARD',
        action_target: '/standards',
      },
      {
        step_number: 2,
        title: 'Audit and Proficiency Evaluation',
        description: 'BIS technical assessment team validates inter-laboratory comparisons.',
        action_type: 'CONTACT_AUTHORITY',
        action_target: 'https://bis.gov.in',
      },
    ],
    official_source_name: 'BIS National Laboratories',
    official_source_url: 'https://www.bis.gov.in',
    status: 'ACTIVE',
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-06T10:00:00Z',
  },
  {
    id: 4,
    service_code: 'DEMO-SERVICE-004',
    name: 'Hallmarking Scheme for Precious Metal Articles',
    description:
      'Purity certification and laser marking for gold and silver jewelry verifying BIS purity standards and HUID traceability.',
    category: 'HALLMARKING',
    user_type: 'BOTH',
    eligibility: 'Jewelers, precious metal assaying and hallmarking centers.',
    required_documents: ['Assaying Equipment Calibration', 'HUID Laser Marking Logs'],
    steps: [
      {
        step_number: 1,
        title: 'Assaying Center Registration',
        description: 'Register certified assaying facility with XRF and cupellation assaying.',
        action_type: 'OPEN_OFFICIAL_SOURCE',
        action_target: 'https://www.manakonline.in',
      },
      {
        step_number: 2,
        title: 'HUID Traceability Integration',
        description: 'Integrate unique 6-digit alphanumeric HUID marking system.',
        action_type: 'VIEW_SERVICE',
        action_target: '/services/4',
      },
    ],
    official_source_name: 'BIS Hallmarking Directorate',
    official_source_url: 'https://www.bis.gov.in',
    status: 'ACTIVE',
    is_demo: true,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-06T10:00:00Z',
  },
];

// Helper to access LocalStorage with fallback
const getList = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveList = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Local save warning for ${key}:`, e);
  }
};

/**
 * Universal Mock Request Router
 * Transparently intercepts endpoints and returns realistic demo data when the backend API is offline.
 */
export const demoMockStore = {
  handleRequest(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const cleanEndpoint = endpoint.replace(/^\/api/, '').replace(/\/+$/, '');
    const urlParts = cleanEndpoint.split('?')[0].split('/').filter(Boolean);

    // 0. AUTHENTICATION
    if (urlParts[0] === 'auth') {
      if (urlParts[1] === 'me') {
        const cachedUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('bharat_standards_user') : null;
        if (cachedUserRaw) {
          try {
            return JSON.parse(cachedUserRaw);
          } catch (e) {}
        }
        return {
          id: 1,
          name: 'Demo Compliance Officer',
          email: 'demo@bharatstandards.ai',
          role: 'industry',
          is_active: true,
        };
      }
      if (urlParts[1] === 'login') {
        return {
          access_token: `bs_demo_token_${Date.now()}`,
          token_type: 'bearer',
          user: {
            id: 1,
            name: 'Demo Compliance Officer',
            email: 'demo@bharatstandards.ai',
            role: 'industry',
            is_active: true,
          },
        };
      }
      if (urlParts[1] === 'logout') {
        return { message: 'Logged out successfully' };
      }
    }

    // 1. STANDARDS
    if (urlParts[0] === 'standards') {
      if (urlParts.length === 1) {
        // GET /standards
        return {
          items: MOCK_STANDARDS,
          total: MOCK_STANDARDS.length,
          page: 1,
          page_size: 50,
          total_pages: 1,
        };
      }
      if (urlParts.length === 2) {
        // GET /standards/:id
        const stdId = urlParts[1];
        const std =
          MOCK_STANDARDS.find((s) => s.standard_number === stdId || String(s.id) === stdId) ||
          MOCK_STANDARDS[0];
        return {
          ...std,
          requirements: MOCK_REQUIREMENTS,
          total_requirements: MOCK_REQUIREMENTS.length,
        };
      }
      if (urlParts.length === 3 && urlParts[2] === 'requirements') {
        // GET /standards/:id/requirements
        return MOCK_REQUIREMENTS;
      }
    }

    // 2. PRODUCTS
    if (urlParts[0] === 'products') {
      const products = getList(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

      if (urlParts.length === 1) {
        if (method === 'GET') {
          return { items: products, total: products.length };
        }
        if (method === 'POST') {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
          const newProduct = {
            id: Date.now(),
            user_id: 1,
            name: body.name || 'New Product',
            category: body.category || 'General',
            manufacturer: body.manufacturer || 'Bharat Manufacturer Ltd.',
            model_number: body.model_number || 'MODEL-2026',
            description: body.description || '',
            intended_use: body.intended_use || '',
            technical_details: body.technical_details || '',
            status: 'READY',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          products.unshift(newProduct);
          saveList(STORAGE_KEYS.PRODUCTS, products);
          return newProduct;
        }
      }

      if (urlParts.length === 2) {
        const prodId = urlParts[1];
        const prod = products.find((p) => String(p.id) === prodId) || products[0];

        if (method === 'GET') {
          return prod;
        }
        if (method === 'PUT') {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
          const updated = { ...prod, ...body, updated_at: new Date().toISOString() };
          const nextProducts = products.map((p) => (String(p.id) === prodId ? updated : p));
          saveList(STORAGE_KEYS.PRODUCTS, nextProducts);
          return updated;
        }
        if (method === 'DELETE') {
          const nextProducts = products.filter((p) => String(p.id) !== prodId);
          saveList(STORAGE_KEYS.PRODUCTS, nextProducts);
          return { message: 'Product deleted successfully' };
        }
      }

      if (urlParts.length === 3 && (urlParts[2] === 'analyze' || urlParts[2] === 'analysis')) {
        return {
          product_id: parseInt(urlParts[1], 10) || 1,
          applicable_standards: [MOCK_STANDARDS[0], MOCK_STANDARDS[1]],
          confidence_score: 0.95,
          recommended_schemes: ['Scheme-I ISI Mark Certification'],
        };
      }

      if (urlParts.length === 3 && urlParts[2] === 'services') {
        return [
          {
            service: MOCK_SERVICES[0],
            match_reason: 'Mandatory statutory Scheme-I conformity for domestic appliances',
            priority: 'CRITICAL',
            suggested_actions: ['Conduct preliminary type examination', 'Prepare in-house testing logs'],
          },
          {
            service: MOCK_SERVICES[1],
            match_reason: 'Electronic components and safety controls verification',
            priority: 'HIGH',
            suggested_actions: ['Check CRS component coverage', 'Gather laboratory certificates'],
          },
        ];
      }
    }

    // 3. DOCUMENTS
    if (urlParts[0] === 'documents') {
      const documents = getList(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
      if (urlParts.length === 1) {
        return { items: documents, total: documents.length };
      }
      if (urlParts.length === 2) {
        return documents.find((d) => String(d.id) === urlParts[1]) || documents[0];
      }
    }

    // 4. COMPLIANCE
    if (urlParts[0] === 'compliance') {
      const reports = getList(STORAGE_KEYS.COMPLIANCE, INITIAL_COMPLIANCE_REPORTS);
      const rep = reports[0];

      if (urlParts.length === 1) {
        return reports;
      }

      if (urlParts[1] === 'check' && method === 'POST') {
        return rep;
      }

      if (urlParts[1] === 'product' && urlParts[3] === 'latest') {
        return rep;
      }

      if (urlParts.length === 2) {
        return rep;
      }

      if (urlParts[2] === 'results') {
        return MOCK_REQUIREMENTS.map((r, i) => {
          let status = 'PASS';
          if (r.clause === '19.3' || r.clause === '20.1' || r.clause === '21.2') status = 'PARTIAL';
          if (r.clause === '11.4' || r.clause === '19.1') status = 'MISSING';
          return {
            id: 200 + i,
            report_id: 1,
            requirement_id: r.id,
            clause: r.clause,
            title: r.title,
            category: r.category,
            status,
            weight: r.weight,
            confidence: status === 'PASS' ? 0.95 : status === 'PARTIAL' ? 0.75 : 0.9,
            evidence:
              status === 'PASS'
                ? 'Verified in laboratory test report Section 3.2.'
                : status === 'PARTIAL'
                ? 'Calibration valid until last month; renewal required.'
                : 'No evidence found in uploaded dossier.',
            recommended_action:
              status === 'MISSING'
                ? `Update engineering documentation to incorporate ${r.title}.`
                : null,
          };
        });
      }

      if (urlParts[2] === 'gaps') {
        return [
          {
            id: 1,
            clause: '19.1',
            title: 'Bilingual Rating Plate Proof & Statutory Warnings',
            priority: 'HIGH',
            description: 'Statutory advisory warnings must be legibly marked in Hindi and English.',
            recommended_action: 'Affix bilingual label engraving plate before final BIS factory audit.',
          },
          {
            id: 2,
            clause: '11.4',
            title: 'Thermal Runaway Multi-channel Calibration Logs',
            priority: 'CRITICAL',
            description: 'Thermal probe array calibration curves required during dry-burn cutoff.',
            recommended_action: 'Perform 100ms multi-channel thermocouple logging at accredited test laboratory.',
          },
        ];
      }

      if (urlParts[2] === 'summary') {
        return {
          report_id: 1,
          readiness_score: 78,
          status: 'COMPLETED',
          pass_count: 15,
          partial_count: 3,
          missing_count: 2,
          total_count: 20,
          risk_score: 39,
          risk_level: 'MEDIUM',
        };
      }

      if (urlParts[2] === 'risk' || urlParts[2] === 'risks') {
        return {
          report_id: 1,
          product_name: 'Domestic Electric Water Heater',
          standard_number: 'DEMO-IS-001',
          overall_risk_score: 39,
          overall_risk_level: 'MEDIUM',
          top_risks: [
            {
              id: 1,
              requirement_id: 118,
              clause: '19.1',
              title: 'Bilingual Rating Plate Proof',
              risk_score: 55,
              risk_level: 'HIGH',
              status: 'MISSING',
              reasons: ['Statutory requirement for market clearance', 'Missing Hindi warnings'],
            },
            {
              id: 2,
              requirement_id: 117,
              clause: '11.4',
              title: 'Thermal Runaway Dry-Burn Cutoff',
              risk_score: 68,
              risk_level: 'HIGH',
              status: 'MISSING',
              reasons: ['Critical safety cut-off redundancy', 'High risk of thermal vessel rupture'],
            },
          ],
        };
      }

      if (urlParts[2] === 'what-if' && method === 'POST') {
        return {
          simulated_score: 95,
          score_delta: +17,
          simulated_risk_score: 18,
          simulated_risk_level: 'LOW',
          resolved_count: 2,
        };
      }
    }

    // 5. BIS SERVICES
    if (urlParts[0] === 'services' || urlParts[0] === 'bis-services') {
      if (urlParts.length === 1) {
        return {
          items: MOCK_SERVICES,
          total: MOCK_SERVICES.length,
          page: 1,
          page_size: 10,
          pages: 1,
        };
      }
      if (urlParts.length === 2) {
        if (urlParts[1] === 'recommended') {
          return [
            {
              service: MOCK_SERVICES[0],
              match_reason: 'Statutory compliance requirement for domestic electrical appliances',
              priority: 'HIGH',
              suggested_actions: ['Prepare Factory Quality Plan (QAP)', 'Engage accredited testing laboratory'],
            },
            {
              service: MOCK_SERVICES[1],
              match_reason: 'Compulsory self-declaration standard for safety controls',
              priority: 'MEDIUM',
              suggested_actions: ['Review component test reports', 'Map standard clauses'],
            },
          ];
        }
        return (
          MOCK_SERVICES.find((s) => s.service_code === urlParts[1] || String(s.id) === urlParts[1]) ||
          MOCK_SERVICES[0]
        );
      }
    }

    // 6. ACTIVITY LOG
    if (urlParts[0] === 'activity') {
      const logs = [
        {
          id: 1,
          action: 'COMPLIANCE_EVALUATED',
          entity_type: 'compliance_report',
          entity_id: 1,
          description: 'Evaluated Domestic Electric Water Heater against DEMO-IS-001 (78% readiness).',
          created_at: '2026-09-06T10:10:00Z',
        },
        {
          id: 2,
          action: 'DOCUMENT_UPLOADED',
          entity_type: 'document',
          entity_id: 1,
          description: 'Uploaded NABL Laboratory Test Report - DEWH 25L (2026).pdf',
          created_at: '2026-09-06T10:05:00Z',
        },
        {
          id: 3,
          action: 'PRODUCT_CREATED',
          entity_type: 'product',
          entity_id: 1,
          description: 'Registered new product "Domestic Electric Water Heater (DEWH-25L-2026)".',
          created_at: '2026-09-06T10:00:00Z',
        },
      ];
      return {
        items: logs,
        total: logs.length,
        page: 1,
        pages: 1,
      };
    }

    // 7. REPORTS
    if (urlParts[0] === 'reports') {
      return [
        {
          id: 1,
          compliance_report_id: 1,
          report_number: 'REP-2026-001',
          title: 'BIS Scheme-I Compliance Dossier — DEWH 25L',
          status: 'GENERATED',
          readiness_score: 78,
          created_at: '2026-09-06T10:15:00Z',
        },
      ];
    }

    // 8. AI ASSISTANT CHAT
    if (urlParts[0] === 'assistant') {
      if (urlParts[1] === 'chat' && method === 'POST') {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        const q = (body.message || '').toLowerCase();
        let answer =
          'Under Indian Standard DEMO-IS-001 for electric water heaters, stationary storage appliances must satisfy 20 statutory clauses under Scheme-I ISI Mark Certification. Key mandatory requirements include 1500V dielectric voltage withstand (Clause 6.1), non-self-resetting thermal cutouts (Clause 10.1), and 1.2 MPa hydrostatic pressure proofing (Clause 12.1).';

        if (q.includes('pressure') || q.includes('tank')) {
          answer =
            'Clause 12.1 specifies that the inner water vessel must be subjected to a hydrostatic proof test of 1.2 MPa (12 bar) for 15 minutes. No permanent deformation or water sweating through the enamel glass-lined vessel is permitted.';
        } else if (q.includes('qco') || q.includes('order')) {
          answer =
            'Under Ministry of Consumer Affairs Quality Control Orders (QCO), electric storage water heaters are covered under mandatory Scheme-I ISI Mark certification. Selling uncertified units is legally prohibited in India.';
        } else if (q.includes('gap') || q.includes('missing') || q.includes('risk')) {
          answer =
            'Your current audit identifies 2 gaps: Clause 19.1 (missing bilingual Hindi/English rating plate) and Clause 11.4 (thermocouple logs for dry-burn testing). Resolving these two will increase your readiness score to 95% (Low Risk).';
        }

        return {
          answer,
          sources: [
            {
              source_type: 'standard',
              title: 'DEMO-IS-001 (Section 4 & 12)',
              clause: 'Clause 6.1 / 12.1',
              snippet: 'Mandatory dielectric and pressure vessel testing criteria.',
              confidence: 0.94,
              is_demo: true,
            },
          ],
          confidence: 0.95,
          recommended_actions: [
            'Inspect bilingual marking plate draft (Clause 19.1)',
            'Schedule accredited laboratory NABL re-test',
          ],
        };
      }

      if (urlParts[1] === 'conversations') {
        return [];
      }
    }

    // 9. MONGODB HEALTH & TELEMETRY
    if (urlParts[0] === 'mongodb') {
      if (urlParts[1] === 'health') {
        return {
          status: 'connected',
          mode: 'in-browser state mirror (offline / demo)',
          is_mock: true,
          database: 'bharat_standards',
          collections_count: 5,
          collections: ['users', 'products', 'standards', 'compliance_reports', 'documents'],
          total_documents: 28,
        };
      }
      if (urlParts[1] === 'collections') {
        return {
          users: { count: 3 },
          products: { count: getList(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS).length },
          standards: { count: 5 },
          compliance_reports: { count: 1 },
          documents: { count: getList(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS).length },
        };
      }
      if (urlParts[1] === 'frontend-state') {
        return { exists: true, data: null };
      }
    }

    // 10. ADMIN PORTAL TELEMETRY & MANAGEMENT
    if (urlParts[0] === 'admin') {
      if (urlParts[1] === 'metrics') {
        return {
          totals: {
            users: 3,
            admins: 1,
            suspended_users: 0,
            products: getList(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS).length,
            standards: MOCK_STANDARDS.length,
            archived_standards: 0,
            requirements: MOCK_REQUIREMENTS.length,
            documents: getList(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS).length,
            reports: 1,
            bis_services: MOCK_SERVICES.length,
            audit_events: 18,
            indexed_items: 25,
            unindexed_items: 0,
          },
          velocity: {
            new_users: 2,
            new_reports: 1,
            audit_events: 6,
          },
          top_standards: [
            { code: 'DEMO-IS-001', title: 'Domestic Electric Water Heaters', evaluations: 12 },
            { code: 'IS 2082:2018', title: 'Stationary Storage Water Heaters', evaluations: 8 },
          ],
          top_gaps: [
            { description: 'Clause 19.1 Bilingual Rating Plate Proof', priority: 'HIGH', count: 3 },
            { description: 'Clause 11.4 Dry-Burn Thermal Cutoff', priority: 'HIGH', count: 2 },
          ],
          daily_velocity: [
            { date: '2026-09-01', audits: 4, reports: 1, users: 1 },
            { date: '2026-09-02', audits: 6, reports: 2, users: 0 },
            { date: '2026-09-03', audits: 8, reports: 1, users: 1 },
            { date: '2026-09-04', audits: 12, reports: 3, users: 1 },
            { date: '2026-09-05', audits: 15, reports: 2, users: 0 },
            { date: '2026-09-06', audits: 18, reports: 4, users: 1 },
          ],
        };
      }

      if (urlParts[1] === 'health') {
        return {
          overall_status: 'HEALTHY',
          timestamp: new Date().toISOString(),
          subsystems: {
            database: { status: 'HEALTHY', latency_ms: 12, details: 'In-browser state mirror active' },
            api_gateway: { status: 'HEALTHY', latency_ms: 8, details: 'Proxy and fallback route operational' },
            document_processing: { status: 'HEALTHY', latency_ms: 24, details: 'PDF OCR and parsing pipeline active' },
            ai_reasoning_engine: { status: 'HEALTHY', latency_ms: 45, details: 'Synthetic compliance evaluator ready' },
            vector_embedding_service: { status: 'HEALTHY', latency_ms: 15, details: 'Local semantic vector index operational' },
            mongodb: { status: 'HEALTHY', latency_ms: 10, details: 'Resilient MongoDB persistence state active' },
          },
        };
      }

      if (urlParts[1] === 'standards') {
        return MOCK_STANDARDS;
      }

      if (urlParts[1] === 'bis-services') {
        return MOCK_SERVICES;
      }

      if (urlParts[1] === 'users') {
        return [
          {
            id: 1,
            email: 'admin@bharatstandards.ai',
            full_name: 'Lead Compliance Auditor',
            role: 'ADMIN',
            status: 'ACTIVE',
            created_at: '2026-09-01T00:00:00Z',
            last_login: '2026-09-06T10:00:00Z',
          },
          {
            id: 2,
            email: 'demo@bharatstandards.ai',
            full_name: 'Bharat Manufacturing Enterprise',
            role: 'INDUSTRY',
            status: 'ACTIVE',
            created_at: '2026-09-02T00:00:00Z',
            last_login: '2026-09-06T12:00:00Z',
          },
          {
            id: 3,
            email: 'consumer@bharatstandards.ai',
            full_name: 'Priya Sharma (Citizen Buyer)',
            role: 'CONSUMER',
            status: 'ACTIVE',
            created_at: '2026-09-03T00:00:00Z',
            last_login: '2026-09-06T14:00:00Z',
          },
        ];
      }

      if (urlParts[1] === 'audit') {
        return {
          items: [
            {
              id: 1,
              action: 'COMPLIANCE_EVALUATED',
              entity_type: 'compliance_report',
              entity_id: 1,
              user_id: 1,
              description: 'Evaluated Domestic Electric Water Heater against DEMO-IS-001 (78% readiness).',
              created_at: '2026-09-06T10:10:00Z',
            },
            {
              id: 2,
              action: 'DOCUMENT_UPLOADED',
              entity_type: 'document',
              entity_id: 1,
              user_id: 1,
              description: 'Uploaded NABL Laboratory Test Report - DEWH 25L (2026).pdf',
              created_at: '2026-09-06T10:05:00Z',
            },
          ],
          total: 2,
          page: 1,
          pages: 1,
        };
      }

      if (urlParts[1] === 'requirements') {
        return MOCK_REQUIREMENTS;
      }

      if (urlParts[1] === 'knowledge-sources') {
        return [
          {
            id: 1,
            title: 'Bureau of Indian Standards Official Portal',
            url: 'https://www.bis.gov.in',
            source_type: 'PORTAL',
            status: 'ACTIVE',
            last_synced_at: '2026-09-06T00:00:00Z',
          },
          {
            id: 2,
            title: 'Manakonline BIS E-Governance Platform',
            url: 'https://www.manakonline.in',
            source_type: 'SCHEME_DATABASE',
            status: 'ACTIVE',
            last_synced_at: '2026-09-06T00:00:00Z',
          },
        ];
      }
    }

    return undefined; // Not handled, fallback to normal error
  },
};
