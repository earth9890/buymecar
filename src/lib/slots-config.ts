/**
 * The ad-slot catalogue. Every slot is a rectangle glued to the G-Wagon body.
 *
 * Coordinate system (metres, car centred at origin):
 *   +X = front of the car, +Y = up, +Z = passenger side (car faces +X, so
 *   the driver sits on the -Z side, left-hand-drive).
 *
 * Positions sit ~6mm proud of the panel they decorate so they never z-fight
 * the body. If you change GWagon.tsx dimensions, move these with them.
 *
 * `rotation` orients a PlaneGeometry (which faces +Z by default) so its normal
 * points out of the body panel and its text reads correctly for a viewer
 * standing in front of that panel.
 */
export type SlotZone = "front" | "rear" | "top" | "driver" | "passenger" | "wheels" | "interior";

export interface SlotDef {
  id: string;
  label: string;
  zone: SlotZone;
  /** Opening price in USD cents. */
  startCents: number;
  position: [number, number, number];
  rotation: [number, number, number];
  /** [width, height] of the decal in metres (width = text direction). */
  size: [number, number];
  /** Round decal (diameter = size[0]); default is a rectangle. */
  shape?: "circle";
  /** Overrides for the runtime surface snap (see components/car/snap.ts). */
  snap?: { offset?: number; align?: boolean };
  /** Marketing blurb shown in the buy dialog. */
  pitch: string;
}

const HALF_PI = Math.PI / 2;

// Panel orientations (see file header).
const FACE_UP: [number, number, number] = [-HALF_PI, 0, HALF_PI];
const FACE_FRONT: [number, number, number] = [0, HALF_PI, 0];
const FACE_REAR: [number, number, number] = [0, -HALF_PI, 0];
const FACE_PASSENGER: [number, number, number] = [0, 0, 0];
const FACE_DRIVER: [number, number, number] = [0, Math.PI, 0];

const SIDE_Z = 0.958;
const GLASS_Z = 0.893;
const MIRROR_Z = 1.207;
const CAP_Z = 0.915;
const WHEEL_X = 1.445;
const WHEEL_Y = 0.41;

export const SLOTS: SlotDef[] = [
  // ---- Premium ----
  {
    id: "hood",
    label: "Hood",
    zone: "top",
    startCents: 100000,
    position: [1.6, 1.467, 0],
    rotation: FACE_UP,
    size: [1.3, 1.0],
    pitch: "The billboard. First thing anyone sees walking up to the car.",
  },
  {
    id: "spare-tire",
    label: "Spare Tire Cover",
    zone: "rear",
    startCents: 70000,
    position: [-2.6, 1.15, -0.15],
    rotation: FACE_REAR,
    size: [0.7, 0.7],
    shape: "circle",
    snap: { offset: 0.035, align: false },
    pitch: "The iconic G-Wagon spare. Stares at every driver stuck behind us.",
  },
  {
    id: "roof-front",
    label: "Roof (front)",
    zone: "top",
    startCents: 60000,
    position: [-0.1, 1.967, 0],
    rotation: FACE_UP,
    size: [1.3, 1.35],
    pitch: "Drone shots, parking garages, tall people. Big flat canvas.",
  },
  {
    id: "roof-rear",
    label: "Roof (rear)",
    zone: "top",
    startCents: 60000,
    position: [-1.32, 1.967, 0],
    rotation: FACE_UP,
    size: [1.3, 1.15],
    pitch: "Second half of the roof. Pair it with the front for a mega banner.",
  },

  // ---- Passenger side (+Z) ----
  {
    id: "ps-front-door",
    label: "Passenger Front Door",
    zone: "passenger",
    startCents: 50000,
    position: [0.44, 0.97, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.9, 0.5],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ps-rear-door",
    label: "Passenger Rear Door",
    zone: "passenger",
    startCents: 50000,
    position: [-0.72, 0.97, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.9, 0.5],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ps-front-fender",
    label: "Passenger Front Fender",
    zone: "passenger",
    startCents: 25000,
    position: [1.8, 1.16, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.7, 0.3],
    pitch: "Right above the front wheel. Compact but classy.",
  },
  {
    id: "ps-rear-quarter",
    label: "Passenger Rear Quarter",
    zone: "passenger",
    startCents: 25000,
    position: [-1.85, 1.16, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.7, 0.3],
    pitch: "Rear quarter panel, the spot pros put their sponsor stickers.",
  },
  {
    id: "ps-rocker",
    label: "Passenger Side Skirt",
    zone: "passenger",
    startCents: 12000,
    position: [-0.1, 0.66, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [1.7, 0.12],
    pitch: "Long thin strip under the doors. Great for a URL.",
  },

  // ---- Driver side (-Z) ----
  {
    id: "ds-front-door",
    label: "Driver Front Door",
    zone: "driver",
    startCents: 50000,
    position: [0.44, 0.97, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.9, 0.5],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ds-rear-door",
    label: "Driver Rear Door",
    zone: "driver",
    startCents: 50000,
    position: [-0.72, 0.97, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.9, 0.5],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ds-front-fender",
    label: "Driver Front Fender",
    zone: "driver",
    startCents: 25000,
    position: [1.8, 1.16, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.7, 0.3],
    pitch: "Right above the front wheel. Compact but classy.",
  },
  {
    id: "ds-rear-quarter",
    label: "Driver Rear Quarter",
    zone: "driver",
    startCents: 25000,
    position: [-1.85, 1.16, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.7, 0.3],
    pitch: "Rear quarter panel, the spot pros put their sponsor stickers.",
  },
  {
    id: "ds-rocker",
    label: "Driver Side Skirt",
    zone: "driver",
    startCents: 12000,
    position: [-0.1, 0.66, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [1.7, 0.12],
    pitch: "Long thin strip under the doors. Great for a URL.",
  },

  // ---- Front ----
  {
    id: "windshield-strip",
    label: "Windshield Sun Strip",
    zone: "front",
    startCents: 30000,
    position: [1.192, 1.74, 0],
    rotation: FACE_FRONT,
    size: [1.5, 0.1],
    pitch: "The strip across the top of the windshield. Very rally.",
  },
  {
    id: "front-bumper",
    label: "Front Bumper",
    zone: "front",
    startCents: 40000,
    position: [2.447, 0.66, 0],
    rotation: FACE_FRONT,
    size: [1.4, 0.18],
    pitch: "Greets everyone in the rear-view mirror ahead of us.",
  },

  // ---- Rear ----
  {
    id: "rear-window",
    label: "Rear Window Banner",
    zone: "rear",
    startCents: 30000,
    position: [-2.293, 1.74, 0],
    rotation: FACE_REAR,
    size: [1.4, 0.22],
    pitch: "Top of the rear glass. Tailgaters can't miss it.",
  },
  {
    id: "tailgate",
    label: "Tailgate Panel",
    zone: "rear",
    startCents: 40000,
    position: [-2.308, 1.0, 0.52],
    rotation: FACE_REAR,
    size: [0.55, 0.55],
    pitch: "Next to the spare tire on the rear door.",
  },
  {
    id: "rear-bumper",
    label: "Rear Bumper",
    zone: "rear",
    startCents: 30000,
    position: [-2.447, 0.66, 0],
    rotation: FACE_REAR,
    size: [1.4, 0.18],
    pitch: "Bumper sticker, but make it a brand deal.",
  },
  // ---- Mirrors ----
  {
    id: "ps-mirror",
    label: "Passenger Mirror Cap",
    zone: "passenger",
    startCents: 20000,
    position: [0.62, 1.32, MIRROR_Z],
    rotation: FACE_PASSENGER,
    size: [0.22, 0.12],
    pitch: "Tiny, but every side-view photo has it.",
  },
  {
    id: "ds-mirror",
    label: "Driver Mirror Cap",
    zone: "driver",
    startCents: 20000,
    position: [0.62, 1.32, -MIRROR_Z],
    rotation: FACE_DRIVER,
    size: [0.22, 0.12],
    pitch: "Tiny, but every side-view photo has it.",
  },

  // ---- Rear quarter glass (perforated window film) ----
  {
    id: "ps-quarter-glass",
    label: "Passenger Quarter Glass",
    zone: "passenger",
    startCents: 25000,
    position: [-1.77, 1.63, GLASS_Z],
    rotation: FACE_PASSENGER,
    size: [0.82, 0.42],
    pitch: "See-through window film on the rear side glass.",
  },
  {
    id: "ds-quarter-glass",
    label: "Driver Quarter Glass",
    zone: "driver",
    startCents: 25000,
    position: [-1.77, 1.63, -GLASS_Z],
    rotation: FACE_DRIVER,
    size: [0.82, 0.42],
    pitch: "See-through window film on the rear side glass.",
  },

  // ---- Wheel centre caps ----
  ...([
    ["fl", WHEEL_X, 1, "Front Left"],
    ["fr", WHEEL_X, -1, "Front Right"],
    ["rl", -WHEEL_X, 1, "Rear Left"],
    ["rr", -WHEEL_X, -1, "Rear Right"],
  ] as const).map(([k, x, side, label]): SlotDef => ({
    id: `cap-${k}`,
    label: `${label} Wheel Cap`,
    zone: "wheels",
    startCents: 8000,
    position: [x, WHEEL_Y, side * CAP_Z],
    rotation: side > 0 ? FACE_PASSENGER : FACE_DRIVER,
    size: [0.1, 0.1],
    shape: "circle",
    pitch: "Your logo where the star usually goes. Four of them spin.",
  })),

  // ---- Interior ----
  {
    id: "headrest-driver",
    label: "Driver Headrest",
    zone: "interior",
    startCents: 15000,
    position: [-0.076, 1.64, -0.42],
    rotation: FACE_REAR,
    size: [0.24, 0.12],
    pitch: "Embroidered on the headrest. Seen by everyone in the back seat.",
  },
  {
    id: "headrest-passenger",
    label: "Passenger Headrest",
    zone: "interior",
    startCents: 15000,
    position: [-0.076, 1.64, 0.42],
    rotation: FACE_REAR,
    size: [0.24, 0.12],
    pitch: "Embroidered on the headrest. Seen by everyone in the back seat.",
  },
  {
    id: "mbux-screen",
    label: "Dashboard Screen",
    zone: "interior",
    startCents: 30000,
    position: [0.684, 1.33, 0.12],
    rotation: FACE_REAR,
    size: [0.88, 0.14],
    pitch: "The MBUX widescreen. Your brand as the wallpaper.",
  },
];

export const SLOT_BY_ID: Record<string, SlotDef> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
);
