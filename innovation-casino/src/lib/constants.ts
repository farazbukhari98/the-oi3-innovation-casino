import { Department } from '@/types/participant';
import { ChipType } from '@/types/vote';

export const DEPARTMENTS: Department[] = [
  'Contact Center',
  'Contractor Management',
  'Credit, Collections, Energy Assistance, and Remittance',
  'Customer Care Operations and Development',
  'Demand Management and Analytics',
  'Digital Customer Experience',
  'Forecasting & Organizational Effectiveness',
  'Meter Reading and Billing',
  'OI3',
  'Operational Excellence and Development',
  'Resource Management North',
  'Resource Management South',
  'Safety North',
  'Safety South',
  'Training',
];

export const CHIP_TYPES: ChipType[] = ['time', 'talent', 'trust'];

export const CHIP_COLORS: Record<ChipType, string> = {
  time: 'bg-chip-red',
  talent: 'bg-chip-blue',
  trust: 'bg-chip-green',
};

export const DEFAULT_VOTING_DURATION = 90; // seconds

export interface SolutionDefinition {
  id: string;
  painPointId: string;
  title: string;
  description: string;
  placeholder?: boolean;
}

export interface PainPointDefinition {
  id: string;
  title: string;
  description: string;
  solutions: SolutionDefinition[];
}

export const PAIN_POINT_DEFINITIONS: PainPointDefinition[] = [
  {
    id: 'pain-point-manual-reporting',
    title: 'Manual & Redundant Reporting',
    description: 'Teams waste hours on reports that could be automated.',
    solutions: [
      {
        id: 'solution-manual-reporting-power-bi',
        painPointId: 'pain-point-manual-reporting',
        title: 'Power BI Automation',
        description: 'Automate the top 5 most common performance or compliance reports through Power BI.',
      },
      {
        id: 'solution-manual-reporting-genai-summaries',
        painPointId: 'pain-point-manual-reporting',
        title: 'GenAI Report Summaries',
        description: 'Implement a generative AI tool that automatically detects patterns and writes narrative summaries for departmental reports.',
      },
      {
        id: 'solution-manual-reporting-digital-forms',
        painPointId: 'pain-point-manual-reporting',
        title: 'Digital Request Forms',
        description: 'Create a simple digital form for all departments to request data from each other, replacing email chains.',
      },
      {
        id: 'solution-manual-reporting-insights-hub',
        painPointId: 'pain-point-manual-reporting',
        title: 'Predictive Insights Hub',
        description: 'Create a predictive insights hub that synthesizes data across service, workforce, and safety systems for proactive decisions.',
      },
    ],
  },
  {
    id: 'pain-point-data-process',
    title: 'Inefficient Data & Processes',
    description: 'Finding information is slow; data lives in disconnected systems.',
    solutions: [
      {
        id: 'solution-data-process-ai-assistant',
        painPointId: 'pain-point-data-process',
        title: 'AI-Powered Employee Assistant',
        description: 'Deploy a single AI-powered virtual assistant for employees to handle common queries on policies, pay, and benefits.',
      },
      {
        id: 'solution-data-process-tagging',
        painPointId: 'pain-point-data-process',
        title: 'Intelligent Data Tagging',
        description: 'Use AI to automatically tag, categorize, and link information across existing departmental databases.',
      },
      {
        id: 'solution-data-process-conversational-analytics',
        painPointId: 'pain-point-data-process',
        title: 'Conversational Analytics',
        description: 'Enable conversational analytics so leaders can ask natural-language questions about performance and compliance.',
      },
      {
        id: 'solution-data-process-orchestrator',
        painPointId: 'pain-point-data-process',
        title: 'Enterprise Work Orchestrator',
        description: 'Develop an AI-driven system that dynamically allocates tasks and resources across departments in real-time.',
      },
    ],
  },
  {
    id: 'pain-point-communication',
    title: 'Communication & Collaboration',
    description: "Information doesn't flow well between teams and departments.",
    solutions: [
      {
        id: 'solution-communication-notifications',
        painPointId: 'pain-point-communication',
        title: 'Automated Notifications',
        description: 'Automate email updates and alerts through adaptive notifications.',
      },
      {
        id: 'solution-communication-meeting-assistant',
        painPointId: 'pain-point-communication',
        title: 'AI Meeting Assistant',
        description: 'Use an AI tool in leadership meetings to transcribe, identify action items, and flag miscommunications.',
      },
      {
        id: 'solution-communication-collab-spaces',
        painPointId: 'pain-point-communication',
        title: 'Real-Time Collaboration Spaces',
        description: 'Create digital collaboration spaces using intelligent tags and dynamic AI search.',
      },
      {
        id: 'solution-communication-connection-engine',
        painPointId: 'pain-point-communication',
        title: 'AI Connection Engine',
        description: 'Develop an AI system that proactively connects employees working on related problems or with complementary skills.',
      },
    ],
  },
  {
    id: 'pain-point-workload',
    title: 'Workload & Workforce Management',
    description: 'Hard to see capacity and balance work across teams.',
    solutions: [
      {
        id: 'solution-workload-heatmap',
        painPointId: 'pain-point-workload',
        title: 'Workload Heat Map Dashboard',
        description: 'Implement a visual workload heat map so leadership can see capacity and bottlenecks across departments.',
      },
      {
        id: 'solution-workload-forecasting',
        painPointId: 'pain-point-workload',
        title: 'Predictive Resource Forecasting',
        description: 'Use predictive models to forecast resource demand and training requirements based on live operational data.',
      },
      {
        id: 'solution-workload-placeholder',
        painPointId: 'pain-point-workload',
        title: 'Exploratory Initiative',
        description: 'A high-potential, undefined project to explore novel workforce management solutions.',
        placeholder: true,
      },
      {
        id: 'solution-workload-talent-marketplace',
        painPointId: 'pain-point-workload',
        title: 'Dynamic Talent Marketplace',
        description: 'Create a platform where projects and tasks are visible and employees can be assigned based on skills and capacity.',
      },
    ],
  },
];

export const DEFAULT_SCENARIOS = PAIN_POINT_DEFINITIONS.map(({ id, title, description }) => ({
  id,
  title,
  description,
}));

export const DEFAULT_SCENARIO = DEFAULT_SCENARIOS[0];

export const DEFAULT_LAYER_DURATIONS = {
  layer1: 7 * 60,
  layer2: 7 * 60,
};

export const DEFAULT_CHIPS_PER_TYPE = 4;
