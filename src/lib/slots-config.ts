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
export type SlotZone = "front" | "rear" | "top" | "driver" | "passenger";

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

const SIDE_Z = 0.968;

export const SLOTS: SlotDef[] = [
  // ---- Premium ----
  {
    id: "hood",
    label: "Hood",
    zone: "top",
    startCents: 50000,
    position: [1.7, 1.447, 0],
    rotation: FACE_UP,
    size: [1.5, 0.95],
    pitch: "The billboard. First thing anyone sees walking up to the car.",
  },
  {
    id: "spare-tire",
    label: "Spare Tire Cover",
    zone: "rear",
    startCents: 35000,
    position: [-2.575, 1.1, 0.3],
    rotation: FACE_REAR,
    size: [0.66, 0.66],
    shape: "circle",
    pitch: "The iconic G-Wagon spare. Stares at every driver stuck behind us.",
  },
  {
    id: "roof-front",
    label: "Roof (front)",
    zone: "top",
    startCents: 30000,
    position: [0.35, 1.967, 0],
    rotation: FACE_UP,
    size: [1.6, 1.4],
    pitch: "Drone shots, parking garages, tall people. Big flat canvas.",
  },
  {
    id: "roof-rear",
    label: "Roof (rear)",
    zone: "top",
    startCents: 30000,
    position: [-1.3, 1.967, 0],
    rotation: FACE_UP,
    size: [1.6, 1.4],
    pitch: "Second half of the roof. Pair it with the front for a mega banner.",
  },

  // ---- Passenger side (+Z) ----
  {
    id: "ps-front-door",
    label: "Passenger Front Door",
    zone: "passenger",
    startCents: 25000,
    position: [0.5, 0.95, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [1.0, 0.6],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ps-rear-door",
    label: "Passenger Rear Door",
    zone: "passenger",
    startCents: 25000,
    position: [-0.75, 0.95, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [1.0, 0.6],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ps-front-fender",
    label: "Passenger Front Fender",
    zone: "passenger",
    startCents: 12000,
    position: [1.8, 1.13, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.7, 0.34],
    pitch: "Right above the front wheel. Compact but classy.",
  },
  {
    id: "ps-rear-quarter",
    label: "Passenger Rear Quarter",
    zone: "passenger",
    startCents: 12000,
    position: [-1.85, 1.13, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [0.7, 0.34],
    pitch: "Rear quarter panel, the spot pros put their sponsor stickers.",
  },
  {
    id: "ps-rocker",
    label: "Passenger Side Skirt",
    zone: "passenger",
    startCents: 6000,
    position: [-0.1, 0.63, SIDE_Z],
    rotation: FACE_PASSENGER,
    size: [1.8, 0.14],
    pitch: "Long thin strip under the doors. Great for a URL.",
  },

  // ---- Driver side (-Z) ----
  {
    id: "ds-front-door",
    label: "Driver Front Door",
    zone: "driver",
    startCents: 25000,
    position: [0.5, 0.95, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [1.0, 0.6],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ds-rear-door",
    label: "Driver Rear Door",
    zone: "driver",
    startCents: 25000,
    position: [-0.75, 0.95, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [1.0, 0.6],
    pitch: "Prime side real estate at eye level.",
  },
  {
    id: "ds-front-fender",
    label: "Driver Front Fender",
    zone: "driver",
    startCents: 12000,
    position: [1.8, 1.13, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.7, 0.34],
    pitch: "Right above the front wheel. Compact but classy.",
  },
  {
    id: "ds-rear-quarter",
    label: "Driver Rear Quarter",
    zone: "driver",
    startCents: 12000,
    position: [-1.85, 1.13, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [0.7, 0.34],
    pitch: "Rear quarter panel, the spot pros put their sponsor stickers.",
  },
  {
    id: "ds-rocker",
    label: "Driver Side Skirt",
    zone: "driver",
    startCents: 6000,
    position: [-0.1, 0.63, -SIDE_Z],
    rotation: FACE_DRIVER,
    size: [1.8, 0.14],
    pitch: "Long thin strip under the doors. Great for a URL.",
  },

  // ---- Front ----
  {
    id: "windshield-strip",
    label: "Windshield Sun Strip",
    zone: "front",
    startCents: 15000,
    position: [1.216, 1.86, 0],
    rotation: FACE_FRONT,
    size: [1.55, 0.14],
    pitch: "The strip across the top of the windshield. Very rally.",
  },
  {
    id: "front-bumper",
    label: "Front Bumper",
    zone: "front",
    startCents: 20000,
    position: [2.482, 0.62, 0],
    rotation: FACE_FRONT,
    size: [1.5, 0.2],
    pitch: "Greets everyone in the rear-view mirror ahead of us.",
  },

  // ---- Rear ----
  {
    id: "rear-window",
    label: "Rear Window Banner",
    zone: "rear",
    startCents: 15000,
    position: [-2.318, 1.72, 0],
    rotation: FACE_REAR,
    size: [1.45, 0.3],
    pitch: "Top of the rear glass. Tailgaters can't miss it.",
  },
  {
    id: "tailgate",
    label: "Tailgate Panel",
    zone: "rear",
    startCents: 20000,
    position: [-2.308, 1.0, -0.42],
    rotation: FACE_REAR,
    size: [0.6, 0.6],
    pitch: "Next to the spare tire on the rear door.",
  },
  {
    id: "rear-bumper",
    label: "Rear Bumper",
    zone: "rear",
    startCents: 15000,
    position: [-2.482, 0.62, 0],
    rotation: FACE_REAR,
    size: [1.5, 0.2],
    pitch: "Bumper sticker, but make it a brand deal.",
  },
];

export const SLOT_BY_ID: Record<string, SlotDef> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
);
