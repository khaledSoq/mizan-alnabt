export type Kind =
  | "cons"
  | "alif_madd"
  | "waw"
  | "ya"
  | "wasl"
  | "ta_marbuta"
  | "collapsed";

export type Phoneme = {
  char: string;
  kind: Kind;
  fixed: number | null;
  display: boolean;
  wordI: number;
  hint: string;
};

export type Hemistich = {
  raw: string;
  cleaned: string;
  words: string[];
  phonemes: Phoneme[];
};

export type Foot = {
  key: string;
  bits: string;
  name: string;
  laNaam: string[];
  zihaf?: string;
};

export type Meter = {
  id: string;
  name: string;
  fasih: string;
  priority: number;
  footKeys: string[];
  note: string;
  templates: string[];
  templateFeet: Foot[][];
};

export type Candidate = {
  bits: string;
  assign: number[];
  cost: number;
  laNaam: string[];
};

export type LetterOut = {
  char: string;
  bit: number | null;
  skipped: boolean;
  kind: string;
  wordI: number;
  locked: boolean;
};

export type BoxOut = {
  index: number;
  name: string;
  laNaam: string[];
  bits: string;
  broken: boolean;
  zihaf: string | null;
};

export type AltOut = {
  bits: string;
  laNaam: string[];
  meterName: string;
  score: number;
  note: string;
};

export type HemistichResult = {
  ok: boolean;
  message: string;
  text: string;
  cleaned: string;
  meterId: string;
  meterName: string;
  fasih: string;
  score: number;
  accepted: boolean;
  bits: string;
  laNaam: string[];
  letters: LetterOut[];
  boxes: BoxOut[];
  firstDiff: number | null;
  brokenBox: number | null;
  alts: AltOut[];
  mode: "discover" | "check";
};

export type MeterListItem = {
  id: string;
  name: string;
  fasih?: string;
  feet: string[];
  bits: string;
  note?: string;
};

export type WeighResult = {
  ok: boolean;
  message: string;
  sameMeter?: boolean;
  hemistichs: HemistichResult[];
  meters: MeterListItem[];
  mode: string;
  selected: string;
};
