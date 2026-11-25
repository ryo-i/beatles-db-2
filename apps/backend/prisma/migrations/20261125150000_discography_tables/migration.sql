-- CreateEnum
CREATE TYPE "ReleaseFormat" AS ENUM ('Album', 'Single', 'EP');

-- CreateEnum
CREATE TYPE "CreditBilling" AS ENUM ('primary', 'secondary');

-- DropTable
DROP TABLE "Person";

-- CreateTable
CREATE TABLE "labels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" SERIAL NOT NULL,
    "catalog_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" "ReleaseFormat" NOT NULL,
    "release_date" DATE NOT NULL,
    "label_id" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" SERIAL NOT NULL,
    "release_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "disc" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "remarks" TEXT NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "profile" TEXT,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_persons" (
    "track_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "billing" "CreditBilling" NOT NULL,

    CONSTRAINT "track_persons_pkey" PRIMARY KEY ("track_id","person_id","role_id")
);

-- CreateTable
CREATE TABLE "track_originals" (
    "id" SERIAL NOT NULL,
    "track_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "track_originals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_persons" (
    "release_id" INTEGER NOT NULL,
    "person_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "release_persons_pkey" PRIMARY KEY ("release_id","person_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "releases_catalog_code_key" ON "releases"("catalog_code");

-- CreateIndex
CREATE INDEX "tracks_release_id_idx" ON "tracks"("release_id");

-- CreateIndex
CREATE UNIQUE INDEX "persons_name_key" ON "persons"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "track_persons_person_id_idx" ON "track_persons"("person_id");

-- CreateIndex
CREATE INDEX "track_persons_role_id_idx" ON "track_persons"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_originals_track_id_name_key" ON "track_originals"("track_id", "name");

-- CreateIndex
CREATE INDEX "release_persons_person_id_idx" ON "release_persons"("person_id");

-- CreateIndex
CREATE INDEX "release_persons_role_id_idx" ON "release_persons"("role_id");

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_persons" ADD CONSTRAINT "track_persons_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_persons" ADD CONSTRAINT "track_persons_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_persons" ADD CONSTRAINT "track_persons_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_originals" ADD CONSTRAINT "track_originals_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_persons" ADD CONSTRAINT "release_persons_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_persons" ADD CONSTRAINT "release_persons_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_persons" ADD CONSTRAINT "release_persons_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
