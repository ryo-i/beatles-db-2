# 構成の方針

2026-11-14 に、公開中の beatles-db、このリポジトリ（当時の名前は beatles-db-backend）、next-nest-started の3つを比べて決めた内容です。

## 結論

このリポジトリを `beatles-db-2` とし、Next.js + NestJS + PostgreSQL で作り直す。

- 公開中の [ryo-i/beatles-db](https://github.com/ryo-i/beatles-db) は、このまま残す。中で構成を入れ替えない。
- 画面も Next.js 15 の App Router で書く。土台は [next-nest-started](https://github.com/ryo-i/next-nest-started) をコピーする。ビートルズの機能はスターター側には足さない。
- データベースの形は [schema.md](schema.md) と [source_table.md](source_table.md) を起点にする。元データは `data/data.json`（370曲、32列）で、公開中の `pages/api/data/beatles.json` と同一である。

リポジトリ名に fullstack や next-nest は入れない。同じプロダクトの2本目なので `-2` にした。

## 比べた3つの方針

### 1. 公開中の beatles-db のままにする

Next.js 12.0.10、React 17、Pages Router、styled-components。API は `pages/api` が JSON の配列をその場で走査する。データベースはない。一覧は50件で、`category` のあと year から search までは if/else で1条件だけ適用している。曲ページの生成は `https://beatles-db.vercel.app` を直接呼んでいる。

公開を続けるには足りている。人物と役割を横断して引く形にはしない。

### 2. バックエンドだけを分け、画面は今のままにする

このリポジトリを作ったときの想定です。README には「バックエンド部分を NestJS にする」と書いてあり、会話の途中では Next.js の API と PostgreSQL でバックエンドだけを独立させる案もありました。いずれにしても、公開中の画面は残して取得先だけを差し替える方針です。

アプリのコードはなく、揃っていたのはスキーマ案と元データだけでした。画面を Next.js 15 で作り直すなら、古い Pages Router を残したあとでもう一度移すことになります。

### 3. next-nest-started の形で、画面も含めて作り直す

Next.js 15、React 19、App Router、Tailwind。バックエンドは NestJS 11 で、Controller、Service、Repository、Prisma。データベースは PostgreSQL 16。OpenAPI の型生成、Docker、CI、Vercel と Neon の手順がスターターにあります。スターターの `Person` は `id` と `name` だけなので、テーブルは schema.md の方を使います。

採用したのはこの方針です。

## この方針にした理由

Next.js 12 から 15 への差は、依存関係の更新では埋まりません。ページの書き方、データ取得、スタイルが別物なので、公開中のリポジトリをその場で直す作業は、別の場所で書き直すのと同じ量になります。

作業の本体はフレームワークではなく、370行のスプレッドシートを `releases` / `tracks` / `persons` / `roles` に分けることです。データ量のために PostgreSQL が必要なわけではありません。人物と役割を横断して引ける形にするためのデータベースです。

受け皿はこのリポジトリにしました。リネーム前の中身は docs と `data/data.json` と README だけで、既存の画面と衝突しないためです。スキーマを検討したコミットもここに残っています。

## 実装に入るときに持ち越すこと

- 曲詳細は、今 `getStaticProps` で曲ごとの title と description を出している。スターターの人物一覧はブラウザから API を呼ぶ形なので、曲ページは App Router の `generateMetadata` でサーバーから取る。一覧の絞り込みはブラウザから呼ぶ。
- 新しい生成経路は、本番の `beatles-db.vercel.app` を経由しない。公開中のサイトは、370曲の一覧と詳細が揃うまで残す。
- `playing`、`songwriter`、`artwork` など `/` 区切りの列は、人物と役割に分ける。`remarks` の `/` は文の区切りなので、文字列のまま残す。`source` は中身があるのが1行である。
- `john` / `paul` / `george` / `ringo` は、`playing` や `musician` と同じ事実の別表記である。
- `artist` は13種類あり、同一人物でも表記が分かれる。表示用の文字列はリリースに残し、`persons` へ自動では同一視しない。
