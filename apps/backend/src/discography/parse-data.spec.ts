import { readFileSync } from 'fs';
import { join } from 'path';
import { parseRow, parseRows, SheetRow } from './parse-data';

function row(partial: Partial<SheetRow>): SheetRow {
  return {
    id: '1',
    year: '1962',
    date: '1962/10/05',
    icon: 'BE',
    category: 'Beatles',
    path: 'beatles',
    artist: 'The Beatles',
    country: 'UK',
    label: 'Parlophone',
    format: 'Single',
    title: 'Love Me Do',
    order: 'BE-S-01',
    disc: '1',
    side: 'A',
    number: '1',
    track: 'Love Me Do',
    vocal: '-',
    playing: 'John Lennon / Paul McCartney',
    john: '-',
    paul: '-',
    george: '-',
    ringo: '-',
    musician: '-',
    songwriter: '-',
    original: '-',
    producer: '-',
    engineer: '-',
    artwork: '-',
    film: '-',
    mv: '-',
    remarks: '備考 / そのまま',
    source: '-',
    ...partial,
  };
}

describe('parseRow', () => {
  it('パート列のカンマだけを役割にし、playing は入れない', () => {
    const { track } = parseRow(
      row({
        john: 'rhythm guitar, backing vocals',
        paul: 'bass, lead/rhythm guitar',
      }),
    );

    expect(track.credits).toEqual([
      { person: 'John Lennon', role: 'rhythm guitar', billing: 'primary' },
      { person: 'John Lennon', role: 'backing vocals', billing: 'primary' },
      { person: 'Paul McCartney', role: 'bass', billing: 'primary' },
      {
        person: 'Paul McCartney',
        role: 'lead/rhythm guitar',
        billing: 'primary',
      },
    ]);
    expect(track.remarks).toBe('備考 / そのまま');
    expect(track.artist).toBe('The Beatles');
  });

  it('musician と artwork は人物と役割に分ける', () => {
    const parsed = parseRow(
      row({
        musician: 'Pete Best : drums / Tony Sheridan : lead vocals, guitar',
        artwork:
          'Robert Freeman : photography / Charles Front : lettering, design',
      }),
    );

    expect(parsed.track.credits).toEqual([
      { person: 'Pete Best', role: 'drums', billing: 'primary' },
      { person: 'Tony Sheridan', role: 'lead vocals', billing: 'primary' },
      { person: 'Tony Sheridan', role: 'guitar', billing: 'primary' },
    ]);
    expect(parsed.release.artwork).toEqual([
      { person: 'Robert Freeman', role: 'photography', billing: 'primary' },
      { person: 'Charles Front', role: 'lettering', billing: 'primary' },
      { person: 'Charles Front', role: 'design', billing: 'primary' },
    ]);
  });

  it('括弧のボーカルは補助にし、パート列にある主ボーカルは足さない', () => {
    const { track } = parseRow(
      row({
        john: 'vocals, harmonica',
        paul: 'bass',
        vocal: 'Paul McCartney / (John Lennon)',
      }),
    );

    expect(track.credits).toContainEqual({
      person: 'John Lennon',
      role: 'vocals',
      billing: 'primary',
    });
    expect(track.credits).toContainEqual({
      person: 'John Lennon',
      role: 'vocal',
      billing: 'secondary',
    });
    expect(track.credits).toContainEqual({
      person: 'Paul McCartney',
      role: 'vocal',
      billing: 'primary',
    });
    expect(
      track.credits.filter(
        (credit) => credit.person === 'John Lennon' && credit.role === 'vocal',
      ),
    ).toHaveLength(1);
  });

  it('Lennon-McCartney は分けず、名前の途中の括弧は補助にしない', () => {
    const { track } = parseRow(
      row({
        songwriter: 'Lennon-McCartney / John Lennon / (Paul McCartney)',
        musician: 'Uncredited (played by the Beatles) : tambourine',
      }),
    );

    expect(track.credits).toEqual([
      {
        person: 'Uncredited (played by the Beatles)',
        role: 'tambourine',
        billing: 'primary',
      },
      { person: 'Lennon-McCartney', role: 'songwriter', billing: 'primary' },
      { person: 'John Lennon', role: 'songwriter', billing: 'primary' },
      { person: 'Paul McCartney', role: 'songwriter', billing: 'secondary' },
    ]);
  });
});

describe('parseRows', () => {
  it('370曲を59リリースに分ける', () => {
    const file = JSON.parse(
      readFileSync(join(__dirname, '../../../../data/data.json'), 'utf8'),
    ) as { values: string[][] };
    const [header, ...body] = file.values;
    const rows = body.map((cells) =>
      Object.fromEntries(header.map((key, index) => [key, cells[index]])),
    );
    const parsed = parseRows(rows);

    expect(parsed.tracks).toHaveLength(370);
    expect(parsed.releases).toHaveLength(59);
    expect(parsed.releases.map((release) => release.catalogCode)).toContain(
      'RS-S-01',
    );
    expect(
      parsed.releases.find((release) => release.catalogCode === 'BE-S-09')
        ?.artwork,
    ).toContainEqual({
      person: 'Robert Freeman',
      role: 'photography',
      billing: 'primary',
    });
  });
});
