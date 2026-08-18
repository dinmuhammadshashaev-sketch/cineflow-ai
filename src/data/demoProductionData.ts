/**
 * CineFlow AI — Polished Demo Production Data Generator
 * Provides deterministic, structured production intelligence for "NEON HARBOR"
 */

import {
  Production,
  Scene,
  Character,
  Prop,
  ProductionTask,
  ResearchQuestion,
  Source,
  Risk,
  ContinuityIssue,
  ShootDay,
  Agent
} from '../types';
import {
  DEMO_PRODUCTION_TITLE,
  DEMO_PRODUCTION_TYPE,
  DEMO_PRODUCTION_DESCRIPTION,
  DEMO_LOCATION,
  DEMO_BUDGET,
  DEMO_CURRENCY,
  DEMO_TARGET_DATES,
  DEMO_SHOOTING_DAYS,
  DEMO_SCREENPLAY_TEXT
} from './demoScript';

export const DEMO_PRODUCTION_ID = "prod_neon_harbor_001";

export function getDemoAgents(): Agent[] {
  return [
    {
      id: "agent_supervisor",
      role: "Supervisor",
      name: "Supervisor Agent",
      title: "Crew Director & Workflow Orchestrator",
      description: "Understands production goals, delegates tasks to specialists, and consolidates findings.",
      status: "COMPLETED",
      lastActivityText: "Consolidated 8 scenes, 5 risks, and 3 shoot days into production plan.",
      tasksCompletedCount: 12,
      avatarColor: "#E5A93C" // Gold
    },
    {
      id: "agent_script_analyst",
      role: "Script Analyst",
      name: "Script Analyst Agent",
      title: "Screenplay Breakdown Specialist",
      description: "Parses screenplay text for scene headings, locations, INT/EXT, DAY/NIGHT, characters, and props.",
      status: "COMPLETED",
      lastActivityText: "Parsed 8 scenes, 3 characters, and 6 core prop requirements.",
      tasksCompletedCount: 8,
      avatarColor: "#3B82F6" // Blue
    },
    {
      id: "agent_director",
      role: "Director Agent",
      name: "Director Agent",
      title: "Creative Vision & Scene Dynamics",
      description: "Evaluates scene complexity, creative tone, lighting mood, and camera setup requirements.",
      status: "COMPLETED",
      lastActivityText: "Generated creative director notes for rain lighting and atmosphere.",
      tasksCompletedCount: 8,
      avatarColor: "#8B5CF6" // Purple
    },
    {
      id: "agent_producer",
      role: "Producer Agent",
      name: "Producer Agent",
      title: "Logistics & Resource Management",
      description: "Transforms creative requirements into actionable department tasks, budgets, and milestones.",
      status: "COMPLETED",
      lastActivityText: "Generated 10 departmental production tasks across art, sound, and permits.",
      tasksCompletedCount: 10,
      avatarColor: "#10B981" // Emerald
    },
    {
      id: "agent_research",
      role: "Research Agent",
      name: "Research Agent",
      title: "External Intelligence & Fact Verification",
      description: "Queries web sources for local permits, weather guidelines, equipment, and filming laws.",
      status: "COMPLETED",
      lastActivityText: "Gathered 4 source-backed research reports for Seattle waterfront filming.",
      tasksCompletedCount: 4,
      avatarColor: "#F59E0B" // Amber
    },
    {
      id: "agent_continuity",
      role: "Continuity Agent",
      name: "Continuity Script Supervisor",
      title: "Timeline & Prop Tracking",
      description: "Detects wardrobe, prop, and narrative inconsistencies across scene order.",
      status: "COMPLETED",
      lastActivityText: "Flagged 1 critical prop continuity issue (Lanyard Key missing in Scene 5).",
      tasksCompletedCount: 6,
      avatarColor: "#EC4899" // Pink
    },
    {
      id: "agent_risk",
      role: "Risk Agent",
      name: "Risk Assessment Agent",
      title: "Safety, Legal & Environmental Auditor",
      description: "Identifies weather, location, stunt, electrical, and night shooting hazards.",
      status: "COMPLETED",
      lastActivityText: "Identified 5 production risks (1 Critical, 2 High, 2 Medium).",
      tasksCompletedCount: 5,
      avatarColor: "#EF4444" // Red
    },
    {
      id: "agent_scheduler",
      role: "Scheduler Agent",
      name: "Assistant Director & Scheduler",
      title: "Shooting Call Sheet & Day Optimizer",
      description: "Groups scenes into shooting days based on location, lighting, cast, and turnarounds.",
      status: "COMPLETED",
      lastActivityText: "Optimized 3-day shooting schedule with lighting efficiency grouping.",
      tasksCompletedCount: 3,
      avatarColor: "#06B6D4" // Cyan
    }
  ];
}

export function getDemoProduction(): Production {
  return {
    id: DEMO_PRODUCTION_ID,
    title: DEMO_PRODUCTION_TITLE,
    type: DEMO_PRODUCTION_TYPE,
    description: DEMO_PRODUCTION_DESCRIPTION,
    location: DEMO_LOCATION,
    budget: DEMO_BUDGET,
    currency: DEMO_CURRENCY,
    targetShootingDates: DEMO_TARGET_DATES,
    shootingDaysCount: DEMO_SHOOTING_DAYS,
    notes: "Requires night rain rigging, marine port permits, and antique audio props.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    scriptText: DEMO_SCREENPLAY_TEXT,
    readinessScore: 78,
    status: "Planning"
  };
}

export function getDemoScenes(): Scene[] {
  return [
    {
      id: "scene_1",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 1,
      heading: "EXT. SEATTLE CARGO CONTAINER YARD - NIGHT",
      intExt: "EXT",
      dayNight: "NIGHT",
      location: "Seattle Cargo Yard (Pier 57)",
      summary: "Mara and Kael operate an acoustic resonance scanner amidst heavy rain and container stacks.",
      complexity: "HIGH",
      characters: ["Mara", "Kael"],
      props: ["Acoustic Resonance Scanner", "Modified Hex-Rotor Drone", "Thermal Tarp"],
      wardrobe: ["Tactical Trench with Reflective Seams", "Bone-Conduction Headphones"],
      specialRequirements: ["Rain Machine Rigging", "Waterproof Electrical Outlets", "Wet Asphalt Look"],
      directorNotes: "High contrast sodium lighting. Deep shadows between rust containers. Emphasize sound isolation.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 1,
      estimatedMinutes: 45
    },
    {
      id: "scene_2",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 2,
      heading: "INT. CARGO CONTAINER #408 - NIGHT",
      intExt: "INT",
      dayNight: "NIGHT",
      location: "Cargo Container #408",
      summary: "Mara searches the pitch-black container and discovers the steel vault box with a Trident seal.",
      complexity: "MEDIUM",
      characters: ["Mara", "Kael (V.O.)"],
      props: ["Steel Vault Box", "Magnetic Contact Mics", "Headlamp", "Wooden Crates"],
      wardrobe: ["Tactical Trench"],
      specialRequirements: ["Practical Headlamp Lighting", "Dust Effects"],
      directorNotes: "Claustrophobic camera framing. Focus on mechanical metal clicks and breathing.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 1,
      estimatedMinutes: 30
    },
    {
      id: "scene_3",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 3,
      heading: "INT. CARGO CONTAINER #408 - NIGHT (CONTINUOUS)",
      intExt: "INT",
      dayNight: "NIGHT",
      location: "Cargo Container #408",
      summary: "Mara opens the vault to find the vintage vacuum-tube reel recorder and key, but is interrupted by blue searchlight.",
      complexity: "HIGH",
      characters: ["Mara"],
      props: ["Analog Reel-To-Reel Recorder", "Vintage Brass Key on Leather Lanyard"],
      wardrobe: ["Tactical Trench", "Brass Key Lanyard"],
      specialRequirements: ["Sweeping Blue Searchlight FX", "Functional Vacuum Tube Glow"],
      directorNotes: "Key story beat. High tension contrast between warm vacuum tube orange and cold blue drone beam.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 1,
      estimatedMinutes: 35
    },
    {
      id: "scene_4",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 4,
      heading: "EXT. CARGO CONTAINER YARD - NIGHT",
      intExt: "EXT",
      dayNight: "NIGHT",
      location: "Seattle Cargo Yard (Pier 57)",
      summary: "Port Authority Drone hovers over Bay 14; Kael scrambles to signal Mara to abort.",
      complexity: "HIGH",
      characters: ["Kael", "Mara (V.O.)"],
      props: ["Drone Transmitter", "Laptop", "Wooden Pallets"],
      wardrobe: ["Hooded Rain Jacket"],
      specialRequirements: ["Spotlight Rig / Drone Prop Stunt", "Outdoor Rain Machine"],
      directorNotes: "Fast hand-held camera movements. Rapid editing between Kael's panic and drone beam.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 1,
      estimatedMinutes: 40
    },
    {
      id: "scene_5",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 5,
      heading: "EXT. PIER 62 DISUSED DOCK - NIGHT",
      intExt: "EXT",
      dayNight: "NIGHT",
      location: "Pier 62 Disused Dock",
      summary: "Mara and Kael sprint through pouring rain to the vintage Land Cruiser and discover the brass key is missing.",
      complexity: "HIGH",
      characters: ["Mara", "Kael"],
      props: ["Waterproof Pelican Case", "1984 Vintage Toyota Land Cruiser"],
      wardrobe: ["Soaked Tactical Trench"],
      specialRequirements: ["Wet Dock Pier Permit", "Stunt Sprint", "Vintage Vehicle Operation"],
      directorNotes: "Dramatic wide shot of storm crashing against dock timber pilings. Sudden moment of silence when key is missing.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 2,
      estimatedMinutes: 50
    },
    {
      id: "scene_6",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 6,
      heading: "INT. VINTAGE LAND CRUISER - NIGHT",
      intExt: "INT",
      dayNight: "NIGHT",
      location: "Vintage Land Cruiser Cab",
      summary: "Inside the warm vehicle cab, Kael hookups the audio scanner to his laptop while rain hammers the windshield.",
      complexity: "LOW",
      characters: ["Mara", "Kael"],
      props: ["Laptop", "Audio Interface", "Acoustic Scanner"],
      wardrobe: ["Towel", "Damp Trench"],
      specialRequirements: ["Car Windshield Water FX", "Dashboard Glow"],
      directorNotes: "Intimate two-shot dialogue. Condensation on glass frames the distant city lights.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 2,
      estimatedMinutes: 30
    },
    {
      id: "scene_7",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 7,
      heading: "EXT. ALKI POINT RADIO TOWER - DAWN",
      intExt: "EXT",
      dayNight: "DAWN",
      location: "Alki Point Radio Tower",
      summary: "Cold morning wind whips Mara as she delivers the reel recorder to the concrete transformer pad.",
      complexity: "MEDIUM",
      characters: ["Mara"],
      props: ["Analog Reel-To-Reel Recorder", "Pelican Case"],
      wardrobe: ["Windblown Trench"],
      specialRequirements: ["Dawn Magic Hour Timing", "Coastal High Wind Safety"],
      directorNotes: "Wide cinematic magic hour landscape. High contrast silhouette against gray ocean.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 3,
      estimatedMinutes: 40
    },
    {
      id: "scene_8",
      productionId: DEMO_PRODUCTION_ID,
      sceneNumber: 8,
      heading: "INT. ALKI TOWER BUNK ROOM - DAY",
      intExt: "INT",
      dayNight: "DAY",
      location: "Alki Tower Bunk Room",
      summary: "In a sunlit abandoned room, Mara threads magnetic tape onto the reels and plays the otherworldly beacon sound.",
      complexity: "MEDIUM",
      characters: ["Mara", "Kael"],
      props: ["Analog Reel-To-Reel Recorder", "Signal Oscilloscope Monitor", "Room Speakers"],
      wardrobe: ["Casual Dry Clothes"],
      specialRequirements: ["Dust Motes in Sunlight FX", "Audio Playback Synchronization"],
      directorNotes: "Slow push-in on Mara's reaction as the chime sounds. Resolution tone.",
      scheduleStatus: "SCHEDULED",
      shootDayNumber: 3,
      estimatedMinutes: 45
    }
  ];
}

export function getDemoCharacters(): Character[] {
  return [
    {
      id: "char_1",
      productionId: DEMO_PRODUCTION_ID,
      name: "Mara",
      roleType: "Lead",
      description: "Determined 30s audio archivist and former maritime signal analyst. Highly technical and calm under pressure.",
      castRequirements: "Female, 28-38, physically agile for rain sprint, intense screen presence.",
      sceneCount: 7,
      sceneNumbers: [1, 2, 3, 5, 6, 7, 8]
    },
    {
      id: "char_2",
      productionId: DEMO_PRODUCTION_ID,
      name: "Kael",
      roleType: "Supporting",
      description: "20s self-taught drone pilot and frequency hacker. Quick-witted, anxious, loyal.",
      castRequirements: "Male/Non-binary, 20-30, comfortable handling electronics and driving manual vehicles.",
      sceneCount: 6,
      sceneNumbers: [1, 4, 5, 6, 8]
    },
    {
      id: "char_3",
      productionId: DEMO_PRODUCTION_ID,
      name: "Port Authority Security",
      roleType: "Background / Extra",
      description: "Automated aerial drone operator and harbor patrol guard.",
      castRequirements: "Voice actor for radio comms / drone shadow operator.",
      sceneCount: 2,
      sceneNumbers: [2, 4]
    }
  ];
}

export function getDemoProps(): Prop[] {
  return [
    {
      id: "prop_1",
      productionId: DEMO_PRODUCTION_ID,
      name: "Acoustic Resonance Scanner",
      category: "Hero Prop",
      description: "Custom modified brushed aluminum frequency scanner with digital VU meter and brass dials.",
      fragile: true,
      sceneNumbers: [1, 5, 6]
    },
    {
      id: "prop_2",
      productionId: DEMO_PRODUCTION_ID,
      name: "Analog Reel-To-Reel Recorder",
      category: "Hero Prop",
      description: "1960s Nagra-style portable reel recorder with exposed vacuum tubes and glowing amber meter.",
      fragile: true,
      sceneNumbers: [3, 7, 8]
    },
    {
      id: "prop_3",
      productionId: DEMO_PRODUCTION_ID,
      name: "Vintage Brass Key on Lanyard",
      category: "Hero Prop",
      description: "Heavy antique brass key on dark leather cord. Critical continuity prop.",
      fragile: false,
      sceneNumbers: [3]
    },
    {
      id: "prop_4",
      productionId: DEMO_PRODUCTION_ID,
      name: "Modified Hex-Rotor Drone",
      category: "Special Effect / SFX",
      description: "Custom matte-black heavy lift drone with antennae and LED battery indicators.",
      fragile: true,
      sceneNumbers: [1, 4]
    },
    {
      id: "prop_5",
      productionId: DEMO_PRODUCTION_ID,
      name: "1984 Vintage Toyota Land Cruiser",
      category: "Vehicle",
      description: "Dark olive green vintage 4x4 with roof rack and spotlight mount.",
      fragile: false,
      sceneNumbers: [5, 6]
    },
    {
      id: "prop_6",
      productionId: DEMO_PRODUCTION_ID,
      name: "Waterproof Pelican Case",
      category: "General",
      description: "Rugged black flight case with custom foam insert for reel recorder.",
      fragile: false,
      sceneNumbers: [5, 7]
    }
  ];
}

export function getDemoTasks(): ProductionTask[] {
  return [
    {
      id: "task_1",
      productionId: DEMO_PRODUCTION_ID,
      title: "Secure Port of Seattle Container Yard Filming Permit",
      description: "Obtain night shooting authorization for Pier 57 cargo stack zone with rain machinery.",
      category: "Location & Permits",
      priority: "CRITICAL",
      status: "IN PROGRESS",
      sceneNumber: 1,
      assignedAgent: "Producer Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_2",
      productionId: DEMO_PRODUCTION_ID,
      title: "Source 1960s Vacuum-Tube Reel Recorder Hero Prop",
      description: "Rent or fabricate working Nagra-style portable recorder with functional tube backlights.",
      category: "Art & Props",
      priority: "HIGH",
      status: "DONE",
      sceneNumber: 3,
      assignedAgent: "Producer Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_3",
      productionId: DEMO_PRODUCTION_ID,
      title: "Rig Outdoor Rain Machine & Containment for Scene 1 & 4",
      description: "Coordinate water truck, pressure pumps, and runoff mitigation for container yard.",
      category: "Camera & Lighting",
      priority: "HIGH",
      status: "TO DO",
      sceneNumber: 1,
      assignedAgent: "Producer Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_4",
      productionId: DEMO_PRODUCTION_ID,
      title: "Confirm Drone Flight Safety Buffer & Federal Airspace Clearances",
      description: "File FAA Part 107 waiver for night drone flight near Elliott Bay shipping lanes.",
      category: "Safety & Legal",
      priority: "CRITICAL",
      status: "BLOCKED",
      sceneNumber: 4,
      assignedAgent: "Risk Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_5",
      productionId: DEMO_PRODUCTION_ID,
      title: "Cast Lead Actor (Mara) for Heavy Rain & Sprint Stunts",
      description: "Conduct callbacks focusing on dialogue rhythm and physical stamina.",
      category: "Casting",
      priority: "HIGH",
      status: "DONE",
      sceneNumber: 1,
      assignedAgent: "Producer Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_6",
      productionId: DEMO_PRODUCTION_ID,
      title: "Verify Alki Point Transformer AC Power Capacity",
      description: "Send location scout to test electrical panel voltage at Alki Point abandoned tower.",
      category: "Location & Permits",
      priority: "MEDIUM",
      status: "TO DO",
      sceneNumber: 7,
      assignedAgent: "Research Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_7",
      productionId: DEMO_PRODUCTION_ID,
      title: "Prepare Lanyard Key Continuity Backup Props (3 Duplicates)",
      description: "Fabricate identical brass keys for emergency replacement during rain shoots.",
      category: "Art & Props",
      priority: "HIGH",
      status: "DONE",
      sceneNumber: 3,
      assignedAgent: "Continuity Agent",
      createdAt: new Date().toISOString()
    },
    {
      id: "task_8",
      productionId: DEMO_PRODUCTION_ID,
      title: "Design Custom Sci-Fi Beacon Audio Chime Soundscape",
      description: "Compose multi-layered harmonic sound design for the reel recorder playback in Scene 8.",
      category: "Sound",
      priority: "MEDIUM",
      status: "IN PROGRESS",
      sceneNumber: 8,
      assignedAgent: "Director Agent",
      createdAt: new Date().toISOString()
    }
  ];
}

export function getDemoResearchQuestions(): ResearchQuestion[] {
  return [
    {
      id: "rq_1",
      productionId: DEMO_PRODUCTION_ID,
      question: "What are the Port of Seattle requirements for commercial night filming with rain machines?",
      sceneNumber: 1,
      importance: "CRITICAL",
      status: "FOUND",
      findings: "Port of Seattle requires a minimum $2M liability insurance, 10-day advance notice, environmental water runoff management plan, and Port Police escort for night shoots past 22:00.",
      sourceIds: ["src_1"],
      createdAt: new Date().toISOString(),
      provider: "MockResearchProvider"
    },
    {
      id: "rq_2",
      productionId: DEMO_PRODUCTION_ID,
      question: "What FAA Part 107 restrictions apply to commercial night drone operations over industrial waterways?",
      sceneNumber: 4,
      importance: "HIGH",
      status: "FOUND",
      findings: "Night drone operations require anti-collision lighting visible for 3 statute miles. Flying over non-participating personnel in container yards requires Category 2 compliant remote ID drones.",
      sourceIds: ["src_2"],
      createdAt: new Date().toISOString(),
      provider: "MockResearchProvider"
    },
    {
      id: "rq_3",
      productionId: DEMO_PRODUCTION_ID,
      question: "Is generator power required at Alki Point abandoned radio tower or are grid lines active?",
      sceneNumber: 7,
      importance: "MEDIUM",
      status: "FOUND",
      findings: "Alki Point historical structures are disconnected from public grid. A quiet inverter generator (3000W minimum) is required on site for filming and LED lighting loads.",
      sourceIds: ["src_3"],
      createdAt: new Date().toISOString(),
      provider: "MockResearchProvider"
    },
    {
      id: "rq_4",
      productionId: DEMO_PRODUCTION_ID,
      question: "What vintage Land Cruiser model years feature 24V marine-grade electrical options?",
      sceneNumber: 6,
      importance: "LOW",
      status: "FOUND",
      findings: "1981-1985 FJ60 and BJ60 Land Cruisers equipped with diesel trim featured dual 12V batteries providing 24V options ideal for powering period-accurate equipment.",
      sourceIds: ["src_4"],
      createdAt: new Date().toISOString(),
      provider: "MockResearchProvider"
    }
  ];
}

export function getDemoSources(): Source[] {
  return [
    {
      id: "src_1",
      title: "Port of Seattle Film & Photography Guidelines (2025/2026)",
      domain: "portseattle.org",
      url: "https://www.portseattle.org/permits/filming-guidelines",
      relatedResearchId: "rq_1",
      relatedSceneNumber: 1,
      retrievedDate: new Date().toISOString().split('T')[0],
      evidenceSummary: "Detailed guidelines on environmental runoff compliance, security escorts, and insurance minimums for industrial container yards.",
      isDemoMock: true
    },
    {
      id: "src_2",
      title: "FAA Part 107 Waiver & Night Operations Advisory",
      domain: "faa.gov",
      url: "https://www.faa.gov/uas/commercial_operators/part_107_waivers",
      relatedResearchId: "rq_2",
      relatedSceneNumber: 4,
      retrievedDate: new Date().toISOString().split('T')[0],
      evidenceSummary: "Specifies anti-collision strobe light requirements and airspace restrictions near maritime shipping channels.",
      isDemoMock: true
    },
    {
      id: "src_3",
      title: "Seattle Parks & Recreation Historic Sites Filming Portal",
      domain: "seattle.gov",
      url: "https://www.seattle.gov/parks/film-permits/alki-point",
      relatedResearchId: "rq_3",
      relatedSceneNumber: 7,
      retrievedDate: new Date().toISOString().split('T')[0],
      evidenceSummary: "Confirms grid power disconnection at Alki Point historical lighthouse compound and silent generator requirements.",
      isDemoMock: true
    },
    {
      id: "src_4",
      title: "Toyota Land Cruiser Heritage Archive - FJ60 Technical Specs",
      domain: "landcruiserheritage.org",
      url: "https://www.landcruiserheritage.org/specs/fj60-1984",
      relatedResearchId: "rq_4",
      relatedSceneNumber: 6,
      retrievedDate: new Date().toISOString().split('T')[0],
      evidenceSummary: "Technical wiring schematic verifying dual battery configurations in 1984 export variants.",
      isDemoMock: true
    }
  ];
}

export function getDemoRisks(): Risk[] {
  return [
    {
      id: "risk_1",
      productionId: DEMO_PRODUCTION_ID,
      title: "Electrical Hazard during Heavy Outdoor Rain Rigging (Scene 1 & 4)",
      description: "High volume rain machines operating near 220V light fixtures in container yard.",
      severity: "CRITICAL",
      sceneNumber: 1,
      reason: "Combining high-pressure water pumps with heavy lighting units on wet metal ground creates electrocution and equipment destruction risk.",
      recommendedAction: "Mandate GFCI breakers on all lines, elevate junction boxes on rubber risers, assign dedicated set safety officer.",
      status: "OPEN",
      createdAt: new Date().toISOString()
    },
    {
      id: "risk_2",
      productionId: DEMO_PRODUCTION_ID,
      title: "Night Drone Flight Collision Risk in Maritime Port Airspace (Scene 4)",
      description: "Operating hex-rotor drone near high-mast crane structures and fog.",
      severity: "HIGH",
      sceneNumber: 4,
      reason: "Low visibility fog and strong waterfront wind gusts can disrupt drone GPS hover stability near container stacks.",
      recommendedAction: "Use tethered flight system or certified drone pilot with prop guards and strobe beacon.",
      status: "IN_REVIEW",
      createdAt: new Date().toISOString()
    },
    {
      id: "risk_3",
      productionId: DEMO_PRODUCTION_ID,
      title: "Water Damage Vulnerability to Fragile 1960s Vacuum-Tube Recorder",
      description: "Hero prop exposed to simulated rain and sea spray in Scene 3 & 7.",
      severity: "HIGH",
      sceneNumber: 3,
      reason: "Original vacuum-tube components and exposed wiring will short-circuit if exposed to water droplets.",
      recommendedAction: "Encase internal electronics with hydrophobic spray, fit transparent waterproof sleeve for rain scenes, keep backup dummy prop.",
      status: "MITIGATED",
      createdAt: new Date().toISOString()
    },
    {
      id: "risk_4",
      productionId: DEMO_PRODUCTION_ID,
      title: "Slip and Fall Hazard on Wet Wooden Dock Timber (Scene 5)",
      description: "Actors sprinting through heavy rain on Pier 62 disused dock.",
      severity: "MEDIUM",
      sceneNumber: 5,
      reason: "Algae-covered wet dock timber becomes extremely slick during rain shoots.",
      recommendedAction: "Apply non-slip clear grip spray to actor boot soles and clear dock path of loose debris prior to rolling.",
      status: "OPEN",
      createdAt: new Date().toISOString()
    },
    {
      id: "risk_5",
      productionId: DEMO_PRODUCTION_ID,
      title: "Uncertain Power Availability at Alki Point Tower (Scene 7)",
      description: "Assumed grid power for heavy film lights during dawn shoot.",
      severity: "MEDIUM",
      sceneNumber: 7,
      reason: "Site research confirms electrical grid is disconnected at historical tower site.",
      recommendedAction: "Reserve 3000W quiet Honda inverter generator and 100ft heavy duty stinger extension cables.",
      status: "RESOLVED",
      createdAt: new Date().toISOString()
    }
  ];
}

export function getDemoContinuityIssues(): ContinuityIssue[] {
  return [
    {
      id: "cont_1",
      productionId: DEMO_PRODUCTION_ID,
      title: "Brass Key Lanyard Disappears Between Scene 3 and Scene 5",
      description: "In Scene 3, Mara holds the brass key attached to her neck lanyard. In Scene 5 script notes, she discovers the key is missing at the Land Cruiser door. Ensure prop drops in container yard during Scene 4 escape.",
      category: "Prop",
      sceneNumbers: [3, 4, 5],
      severity: "HIGH",
      status: "OPEN",
      recommendation: "Add explicit action beat in Scene 4 where Mara's lanyard catches on container door latch and snaps off before she runs."
    },
    {
      id: "cont_2",
      productionId: DEMO_PRODUCTION_ID,
      title: "Mara Trench Coat Wetness Inconsistency",
      description: "Scene 1 (heavy rain) coat is dripping wet. Scene 2 (inside container) coat must maintain wet sheen rather than drying off.",
      category: "Wardrobe",
      sceneNumbers: [1, 2],
      severity: "MEDIUM",
      status: "RESOLVED",
      recommendation: "Wardrobe department to maintain glycerin water spray bottle on stand-by inside container set."
    }
  ];
}

export function getDemoShootDays(): ShootDay[] {
  return [
    {
      id: "day_1",
      productionId: DEMO_PRODUCTION_ID,
      dayNumber: 1,
      date: "2026-10-12",
      locationName: "Seattle Cargo Yard (Pier 57)",
      sceneNumbers: [1, 2, 3, 4],
      dayNightFocus: "NIGHT (18:00 - 03:00)",
      estimatedHours: 9,
      notes: "Heavy rain rigging night. Port Authority Police escort required. All electrical lines must be elevated.",
      warnings: ["Rain Machine Setup required at 16:00", "High Electrocution Risk - GFCI Check mandatory"]
    },
    {
      id: "day_2",
      productionId: DEMO_PRODUCTION_ID,
      dayNumber: 2,
      date: "2026-10-13",
      locationName: "Pier 62 Dock & Vintage Land Cruiser",
      sceneNumbers: [5, 6],
      dayNightFocus: "NIGHT (19:00 - 02:00)",
      estimatedHours: 7,
      notes: "Sprinting stunt on dock. Vehicle interior dialogue with windshield rain rigging.",
      warnings: ["Non-slip footwear check for stunt sprint", "Vintage vehicle battery monitor"]
    },
    {
      id: "day_3",
      productionId: DEMO_PRODUCTION_ID,
      dayNumber: 3,
      date: "2026-10-14",
      locationName: "Alki Point Radio Tower",
      sceneNumbers: [7, 8],
      dayNightFocus: "DAWN / DAY (05:30 - 13:00)",
      estimatedHours: 7.5,
      notes: "Magic hour dawn exterior shot at 06:15. Sunlit interior bunk room setup.",
      warnings: ["Inverter Generator required on site", "High wind coastal hazard"]
    }
  ];
}
