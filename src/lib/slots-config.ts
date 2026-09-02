/**
 * The ad-slot catalogue, measured against the scanned 2020 AMG G63 in
 * public/models/g63.glb (see components/car/GltfCar.tsx for the frame:
 * car faces +X, +Y up, +Z passenger side, floor at y = 0, length 4.87 m).
 *
 * Positions only need to be roughly on the panel: at runtime every slot is
 * raycast onto the real mesh and rendered as a projected decal clipped to
 * that panel (components/car/snap.ts + ProjectedDecal.tsx), so nothing
 * overflows an edge or floats off a curve.
 *
 * `rotation` orients the decal so its +Z points out of the panel and its +Y
 * is "up" for the text. `size` is [width, height] in metres.
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
  size: [number, number];
  /** Round decal (diameter = size[0]); default is a rectangle. */
  shape?: "circle";
  /** Runtime surface-snap overrides (see components/car/snap.ts). */
  /** `flat`: render as a flat disc/plane at the snap point instead of projecting onto the mesh (spoked rims). */
  snap?: { offset?: number; align?: boolean; depth?: number; flat?: boolean };
  pitch: string;
}

const HALF_PI = Math.PI / 2;
const FACE_UP: [number, number, number] = [-HALF_PI, 0, HALF_PI];
const FACE_FRONT: [number, number, number] = [0, HALF_PI, 0];
const FACE_REAR: [number, number, number] = [0, -HALF_PI, 0];
const FACE_PASSENGER: [number, number, number] = [0, 0, 0];
const FACE_DRIVER: [number, number, number] = [0, Math.PI, 0];

// Measured on the scan.
const SIDE_Z = 1.0; // outside the body (0.89) and flares (0.98); snap pulls it in
const FRONT_X = 2.6;
const REAR_X = -2.7;
const TOP_Y = 2.1;
const WHEEL_FRONT_X = 1.55;
const WHEEL_REAR_X = -1.25;
const WHEEL_Y = 0.41;

function mirrored(
  base: Omit<SlotDef, "id" | "label" | "zone" | "rotation" | "position"> & {
    key: string;
    label: string;
    x: number;
    y: number;
    z?: number;
  },
): SlotDef[] {
  const z = base.z ?? SIDE_Z;
  return [
    {
      id: `ps-${base.key}`,
      label: `Passenger ${base.label}`,
      zone: "passenger",
      startCents: base.startCents,
      position: [base.x, base.y, z],
      rotation: FACE_PASSENGER,
      size: base.size,
      shape: base.shape,
      snap: base.snap,
      pitch: base.pitch,
    },
    {
      id: `ds-${base.key}`,
      label: `Driver ${base.label}`,
      zone: "driver",
      startCents: base.startCents,
      position: [base.x, base.y, -z],
      rotation: FACE_DRIVER,
      size: base.size,
      shape: base.shape,
      snap: base.snap,
      pitch: base.pitch,
    },
  ];
}

export const SLOTS: SlotDef[] = [
  // ---------- Top ----------
  {
    id: "hood",
    label: "Hood",
    zone: "top",
    startCents: 100000,
    position: [1.5, TOP_Y, 0],
    rotation: FACE_UP,
    size: [1.3, 0.85],
    pitch: "The billboard. First thing anyone sees walking up to the car.",
  },
  {
    id: "roof-front",
    label: "Roof (front)",
    zone: "top",
    startCents: 45000,
    position: [0.1, TOP_Y, 0],
    rotation: FACE_UP,
    size: [1.3, 0.62],
    pitch: "Between the windshield and the sunroof.",
  },
  {
    id: "sunroof",
    label: "Sunroof Glass",
    zone: "top",
    startCents: 40000,
    position: [-0.5, TOP_Y, 0],
    rotation: FACE_UP,
    size: [0.72, 0.36],
    pitch: "Printed on the panoramic glass. Drone-shot favourite.",
  },
  {
    id: "roof-rear",
    label: "Roof (rear)",
    zone: "top",
    startCents: 60000,
    position: [-1.42, TOP_Y, 0],
    rotation: FACE_UP,
    size: [1.3, 1.15],
    pitch: "The biggest flat panel on the car.",
  },

  // ---------- Sides (mirrored) ----------
  ...mirrored({
    key: "front-door",
    label: "Front Door",
    startCents: 50000,
    x: 0.4,
    y: 0.74,
    size: [0.78, 0.34],
    pitch: "Prime side real estate at eye level.",
  }),
  ...mirrored({
    key: "rear-door",
    label: "Rear Door",
    startCents: 50000,
    x: -0.58,
    y: 0.74,
    size: [0.72, 0.34],
    pitch: "Prime side real estate at eye level.",
  }),
  ...mirrored({
    key: "rear-quarter",
    label: "Rear Quarter",
    startCents: 25000,
    x: -1.82,
    y: 0.85,
    size: [0.3, 0.5],
    pitch: "The tall panel behind the rear wheel.",
  }),
  ...mirrored({
    key: "fender",
    label: "Front Fender",
    startCents: 15000,
    x: 1.6,
    y: 1.12,
    size: [0.5, 0.1],
    pitch: "The strip above the front wheel, next to the G63 badge.",
  }),
  ...mirrored({
    key: "rear-door-glass",
    label: "Rear Door Glass",
    startCents: 25000,
    x: -0.6,
    y: 1.5,
    z: 0.95,
    size: [0.5, 0.32],
    pitch: "Perforated window film, see-through from inside.",
  }),
  ...mirrored({
    key: "quarter-glass",
    label: "Quarter Glass",
    startCents: 20000,
    x: -1.45,
    y: 1.5,
    z: 0.95,
    size: [0.42, 0.32],
    pitch: "Perforated window film on the rearmost side glass.",
  }),
  ...mirrored({
    key: "mirror",
    label: "Mirror Cap",
    startCents: 20000,
    x: 0.75,
    y: 1.33,
    z: 1.3,
    size: [0.2, 0.09],
    pitch: "Tiny, but in every side photo.",
  }),

  // ---------- Front ----------
  {
    id: "windshield-strip",
    label: "Windshield Sun Strip",
    zone: "front",
    startCents: 30000,
    position: [FRONT_X, 1.64, 0],
    rotation: FACE_FRONT,
    size: [1.3, 0.1],
    pitch: "Across the top of the windshield. Very rally.",
  },
  {
    id: "front-fascia",
    label: "Front Fascia",
    zone: "front",
    startCents: 35000,
    position: [FRONT_X, 1.06, 0],
    rotation: FACE_FRONT,
    size: [1.0, 0.12],
    pitch: "Between the headlights, right under the star.",
  },
  {
    id: "front-plate",
    label: "Front Number Plate",
    zone: "front",
    startCents: 30000,
    position: [FRONT_X, 0.62, 0],
    rotation: FACE_FRONT,
    size: [0.52, 0.1],
    pitch: "Where the plate goes. Your name instead.",
  },
  ...([1, -1] as const).map(
    (s): SlotDef => ({
      id: s > 0 ? "headlight-ps" : "headlight-ds",
      label: s > 0 ? "Passenger Headlight" : "Driver Headlight",
      zone: "front",
      startCents: 25000,
      position: [FRONT_X, 0.88, s * 0.75],
      rotation: FACE_FRONT,
      size: [0.24, 0.24],
      shape: "circle",
      snap: { align: false, offset: 0.012, depth: 0.25 },
      pitch: "A ring on the iconic round LED headlight.",
    }),
  ),

  // ---------- Rear ----------
  {
    id: "rear-window",
    label: "Rear Window Strip",
    zone: "rear",
    startCents: 25000,
    position: [REAR_X, 1.63, 0],
    rotation: FACE_REAR,
    size: [0.9, 0.1],
    pitch: "Top of the rear glass, above the spare.",
  },
  {
    id: "spare-tire",
    label: "Spare Wheel Cover",
    zone: "rear",
    startCents: 70000,
    position: [REAR_X, 1.15, -0.1],
    rotation: FACE_REAR,
    size: [0.62, 0.62],
    shape: "circle",
    snap: { offset: 0.03, align: false, depth: 0.25 },
    pitch: "The G-Wagon spare. Stares at every driver stuck behind us.",
  },
  {
    id: "tailgate",
    label: "Tailgate Panel",
    zone: "rear",
    startCents: 40000,
    position: [REAR_X, 1.15, 0.5],
    rotation: FACE_REAR,
    size: [0.46, 0.5],
    pitch: "Next to the spare on the rear door.",
  },
  {
    id: "rear-bumper",
    label: "Rear Bumper",
    zone: "rear",
    startCents: 25000,
    position: [REAR_X, 0.72, 0],
    rotation: FACE_REAR,
    size: [0.8, 0.1],
    pitch: "Between the tail lights.",
  },
  {
    id: "rear-plate",
    label: "Rear Number Plate",
    zone: "rear",
    startCents: 30000,
    position: [REAR_X, 0.56, 0],
    rotation: FACE_REAR,
    size: [0.5, 0.1],
    pitch: "The actual plate holder. Tailgaters read it all day.",
  },

  // ---------- Wheels ----------
  ...([
    ["fl", WHEEL_FRONT_X, 1, "Front Left"],
    ["fr", WHEEL_FRONT_X, -1, "Front Right"],
    ["rl", WHEEL_REAR_X, 1, "Rear Left"],
    ["rr", WHEEL_REAR_X, -1, "Rear Right"],
  ] as const).map(
    ([k, x, side, label]): SlotDef => ({
      id: `wheel-${k}`,
      label: `${label} Wheel`,
      zone: "wheels",
      startCents: 15000,
      position: [x, WHEEL_Y, side * 1.1],
      rotation: side > 0 ? FACE_PASSENGER : FACE_DRIVER,
      size: [0.5, 0.5],
      shape: "circle",
      snap: { align: false, offset: 0.02, flat: true },
      pitch: "The whole rim face. Four of them, and they spin.",
    }),
  ),

  // ---------- Interior ----------
  {
    id: "headrest-driver",
    label: "Driver Headrest",
    zone: "interior",
    startCents: 15000,
    position: [-0.4, 1.55, -0.4],
    rotation: FACE_REAR,
    size: [0.22, 0.1],
    snap: { depth: 0.15 },
    pitch: "Embroidered on the headrest. Seen by everyone in the back.",
  },
  {
    id: "headrest-passenger",
    label: "Passenger Headrest",
    zone: "interior",
    startCents: 15000,
    position: [-0.4, 1.55, 0.4],
    rotation: FACE_REAR,
    size: [0.22, 0.1],
    snap: { depth: 0.15 },
    pitch: "Embroidered on the headrest. Seen by everyone in the back.",
  },
  {
    id: "mbux-screen",
    label: "Dashboard Screen",
    zone: "interior",
    startCents: 30000,
    position: [0.64, 1.3, 0.12],
    rotation: FACE_REAR,
    size: [0.7, 0.12],
    snap: { depth: 0.12 },
    pitch: "The MBUX widescreen. Your brand as the wallpaper.",
  },
];

export const SLOT_BY_ID: Record<string, SlotDef> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
);
