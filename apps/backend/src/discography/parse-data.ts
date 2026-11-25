export type Billing = 'primary' | 'secondary';

export type Credit = {
  person: string;
  role: string;
  billing: Billing;
};

export type ReleaseDraft = {
  catalogCode: string;
  title: string;
  format: 'Album' | 'Single' | 'EP';
  releaseDate: string;
  label: string;
  country: string;
  category: string;
  icon: string;
  path: string;
  artwork: Credit[];
};

export type TrackDraft = {
  id: number;
  catalogCode: string;
  title: string;
  artist: string;
  disc: number;
  side: string;
  number: number;
  remarks: string;
  source: string;
  credits: Credit[];
  originals: string[];
};

export type SheetRow = Record<string, string>;

const MEMBERS: Record<string, string> = {
  john: 'John Lennon',
  paul: 'Paul McCartney',
  george: 'George Harrison',
  ringo: 'Ringo Starr',
};

const SLASH = /\s+\/\s+/;

const FORMATS = new Set(['Album', 'Single', 'EP']);

function isBlank(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === '-' || trimmed === '–';
}

function splitSlash(value: string): string[] {
  if (isBlank(value)) {
    return [];
  }
  return value
    .split(SLASH)
    .map((part) => part.trim())
    .filter((part) => !isBlank(part));
}

function splitRoles(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

function personBilling(segment: string): { name: string; billing: Billing } {
  const trimmed = segment.trim().replace(/,+$/, '').trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return { name: trimmed.slice(1, -1).trim(), billing: 'secondary' };
  }
  return { name: trimmed, billing: 'primary' };
}

function hasVocal(credits: Credit[], person: string): boolean {
  return credits.some(
    (credit) => credit.person === person && /vocal/i.test(credit.role),
  );
}

function addCredit(credits: Credit[], credit: Credit) {
  const existing = credits.find(
    (item) => item.person === credit.person && item.role === credit.role,
  );
  if (!existing) {
    credits.push(credit);
    return;
  }
  if (credit.billing === 'secondary') {
    existing.billing = 'secondary';
  }
}

function addNamedCredits(credits: Credit[], value: string, role: string) {
  for (const segment of splitSlash(value)) {
    const { name, billing } = personBilling(segment);
    if (name === '') {
      continue;
    }
    addCredit(credits, { person: name, role, billing });
  }
}

function addPersonRoles(
  credits: Credit[],
  value: string,
  fallbackRole?: string,
) {
  for (const segment of splitSlash(value)) {
    const colon = segment.indexOf(' : ');
    const namePart = colon === -1 ? segment : segment.slice(0, colon);
    const rolePart =
      colon === -1 ? (fallbackRole ?? '') : segment.slice(colon + 3);
    const { name, billing } = personBilling(namePart);
    const roles = splitRoles(rolePart);
    if (name === '' || roles.length === 0) {
      continue;
    }
    for (const role of roles) {
      addCredit(credits, { person: name, role, billing });
    }
  }
}

function releaseDate(row: SheetRow): string {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(row.date.trim());
  if (!match || match[1] !== row.year.trim()) {
    throw new Error(`日付が年と合いません: ${row.id} ${row.date}`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function parseRow(row: SheetRow): {
  track: TrackDraft;
  release: ReleaseDraft;
} {
  if (!FORMATS.has(row.format)) {
    throw new Error(`format が想定外です: ${row.id} ${row.format}`);
  }

  const credits: Credit[] = [];
  for (const [column, person] of Object.entries(MEMBERS)) {
    if (isBlank(row[column])) {
      continue;
    }
    for (const role of splitRoles(row[column])) {
      addCredit(credits, { person, role, billing: 'primary' });
    }
  }
  addPersonRoles(credits, row.musician);

  for (const segment of splitSlash(row.vocal)) {
    const { name, billing } = personBilling(segment);
    if (name === '') {
      continue;
    }
    if (billing === 'primary' && hasVocal(credits, name)) {
      continue;
    }
    addCredit(credits, { person: name, role: 'vocal', billing });
  }

  addNamedCredits(credits, row.songwriter, 'songwriter');
  addNamedCredits(credits, row.producer, 'producer');
  addNamedCredits(credits, row.engineer, 'engineer');
  addNamedCredits(credits, row.film, 'film director');
  addNamedCredits(credits, row.mv, 'mv director');

  const artwork: Credit[] = [];
  addPersonRoles(artwork, row.artwork);

  return {
    release: {
      catalogCode: row.order.trim(),
      title: row.title,
      format: row.format as ReleaseDraft['format'],
      releaseDate: releaseDate(row),
      label: row.label.trim(),
      country: row.country.trim(),
      category: row.category.trim(),
      icon: row.icon.trim(),
      path: row.path.trim(),
      artwork,
    },
    track: {
      id: Number(row.id),
      catalogCode: row.order.trim(),
      title: row.track,
      artist: row.artist,
      disc: Number(row.disc),
      side: row.side,
      number: Number(row.number),
      remarks: row.remarks,
      source: row.source,
      credits,
      originals: splitSlash(row.original),
    },
  };
}

const RELEASE_KEYS = [
  'title',
  'format',
  'releaseDate',
  'label',
  'country',
  'category',
  'icon',
  'path',
] as const;

export function parseRows(rows: SheetRow[]): {
  releases: ReleaseDraft[];
  tracks: TrackDraft[];
} {
  const releases = new Map<string, ReleaseDraft>();
  const tracks: TrackDraft[] = [];

  for (const row of rows) {
    const parsed = parseRow(row);
    const existing = releases.get(parsed.release.catalogCode);
    if (!existing) {
      releases.set(parsed.release.catalogCode, parsed.release);
    } else {
      for (const key of RELEASE_KEYS) {
        if (existing[key] !== parsed.release[key]) {
          throw new Error(
            `${parsed.release.catalogCode} の ${key} が曲ごとに違います`,
          );
        }
      }
      if (
        JSON.stringify(existing.artwork) !==
        JSON.stringify(parsed.release.artwork)
      ) {
        throw new Error(
          `${parsed.release.catalogCode} のアートワークが曲ごとに違います`,
        );
      }
    }
    tracks.push(parsed.track);
  }

  return { releases: [...releases.values()], tracks };
}
