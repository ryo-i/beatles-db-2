import { PrismaPg } from '@prisma/adapter-pg';
import { CreditBilling, PrismaClient, ReleaseFormat } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { parseRows, SheetRow } from '../src/discography/parse-data';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const file = JSON.parse(
    readFileSync(join(__dirname, '../../../data/data.json'), 'utf8'),
  ) as { values: string[][] };
  const [header, ...body] = file.values;
  const rows: SheetRow[] = body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index]])),
  );
  const { releases, tracks } = parseRows(rows);

  const personNames = new Set<string>();
  const roleNames = new Set<string>();
  for (const release of releases) {
    for (const credit of release.artwork) {
      personNames.add(credit.person);
      roleNames.add(credit.role);
    }
  }
  for (const track of tracks) {
    for (const credit of track.credits) {
      personNames.add(credit.person);
      roleNames.add(credit.role);
    }
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.releasePerson.deleteMany();
      await tx.trackPerson.deleteMany();
      await tx.trackOriginal.deleteMany();
      await tx.track.deleteMany();
      await tx.release.deleteMany();
      await tx.person.deleteMany();
      await tx.role.deleteMany();
      await tx.label.deleteMany();

      await tx.label.createMany({
        data: [...new Set(releases.map((release) => release.label))].map(
          (name) => ({ name }),
        ),
      });
      await tx.person.createMany({
        data: [...personNames].map((name) => ({ name })),
      });
      await tx.role.createMany({
        data: [...roleNames].map((name) => ({ name })),
      });

      const labels = new Map(
        (await tx.label.findMany()).map((label) => [label.name, label.id]),
      );
      const persons = new Map(
        (await tx.person.findMany()).map((person) => [person.name, person.id]),
      );
      const roles = new Map(
        (await tx.role.findMany()).map((role) => [role.name, role.id]),
      );

      const releaseIds = new Map<string, number>();
      for (const release of releases) {
        const created = await tx.release.create({
          data: {
            catalogCode: release.catalogCode,
            title: release.title,
            format: release.format as ReleaseFormat,
            releaseDate: new Date(`${release.releaseDate}T00:00:00.000Z`),
            labelId: labels.get(release.label)!,
            country: release.country,
            category: release.category,
            icon: release.icon,
            path: release.path,
          },
        });
        releaseIds.set(release.catalogCode, created.id);
        if (release.artwork.length > 0) {
          await tx.releasePerson.createMany({
            data: release.artwork.map((credit) => ({
              releaseId: created.id,
              personId: persons.get(credit.person)!,
              roleId: roles.get(credit.role)!,
            })),
          });
        }
      }

      await tx.track.createMany({
        data: tracks.map((track) => ({
          id: track.id,
          releaseId: releaseIds.get(track.catalogCode)!,
          title: track.title,
          artist: track.artist,
          disc: track.disc,
          side: track.side,
          number: track.number,
          remarks: track.remarks,
          source: track.source,
        })),
      });
      await tx.trackPerson.createMany({
        data: tracks.flatMap((track) =>
          track.credits.map((credit) => ({
            trackId: track.id,
            personId: persons.get(credit.person)!,
            roleId: roles.get(credit.role)!,
            billing: credit.billing as CreditBilling,
          })),
        ),
      });
      await tx.trackOriginal.createMany({
        data: tracks.flatMap((track) =>
          track.originals.map((name) => ({
            trackId: track.id,
            name,
          })),
        ),
      });

      await tx.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('tracks', 'id'), (SELECT MAX(id) FROM tracks))`,
      );
    },
    { timeout: 20000 },
  );

  console.log(`releases ${releases.length}, tracks ${tracks.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
