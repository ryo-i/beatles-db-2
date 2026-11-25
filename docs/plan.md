# 進め方

2026-11-25 時点の順番です。テーブルの形は [schema.md](schema.md)、列の分け方は [source_table.md](source_table.md)、公開中のサイトを残す判断は [decision.md](decision.md)、一覧のあとに検討するアイデアは [ideas.md](ideas.md) にあります。

いま動いている画面は、土台の人物一覧です。370曲は PostgreSQL に入っています。

## 先に docs へ書くもの

テーブルは、列の分け方に判断が多かったので [schema.md](schema.md) を先に書いた。フロントとバックの枠は、すでに [architecture.md](architecture.md) と `features/persons/` にある。Controller、Service、Repository と、feature のフォルダをもう一度設計しない。

曲詳細に入る直前に、レスポンスの形だけ書く。URL、返すフィールド、人物と役割をどこまで含めるか。画面の項目は公開中の曲詳細に合わせ、このレスポンスから取る。コンポーネントの分割は、その API を実装しながら `features/persons/` に合わせる。動いたパスは architecture.md に追記する。

## 順番

依存は、テーブル、取り込み、API、画面の順です。API と画面は、曲詳細で先に一周し、そのあと一覧と絞り込みに広げます。終わった段は、このリストの位置のまま `[x]` にします。

- [x] **Next.js と NestJS の土台にする。**
- [x] **テーブルの形を [schema.md](schema.md) に書く。**
- [x] **曲データの記入漏れを直す。** `RS-S-01` と、「Yes It Is」のアートワーク。
- [x] **Prisma のテーブルを schema.md にする。** migration を作る。いまの `Person` は `id` と `name` だけの見本なので、曲の `persons` に差し替える。織田信長、豊臣秀吉、徳川家康の seed は使わない。
- [x] **`data/data.json` をそのテーブルへ入れる。** 370行を59リリースと370曲に分ける。人物、役割、オリジナルの分け方は schema.md に従う。入った件数と、同じカタログ番号の中で日付やアートワークが割れていないことで確認する。
- [ ] **曲詳細のレスポンスの形を docs に書く。** URL、返すフィールド、人物と役割をどこまで含めるか。画面の項目は公開中の曲詳細に合わせ、このレスポンスから取る。
- [ ] **曲詳細の読み取り API を NestJS にする。** `TracksController`、`TracksService`、`TracksRepository` の順で、Prisma は Repository だけが使う。公開中の API は JSON をその場で走査しているので、処理の写しではなく、テーブルへの問い合わせにする。曲の登録 API は公開中の画面にないので、この段では作らない。変えたら `npm run generate:api` で OpenAPI の型をフロントへ出す。
- [ ] **曲詳細の画面を `features/tracks/` に作る。** 置き方はいまの `features/persons/` と同じで、Bulletproof React の feature-based です。ページは App Router、見た目は Tailwind CSS です。Tailwind は土台に入っているので、CSS だけの差し替え作業にはしない。曲ページの title と description は `generateMetadata` でサーバーから取る。動いたパスは architecture.md に追記する。
- [ ] **一覧と絞り込みを同じ形で足す。** カテゴリ、年、format、フリーワード、人物と役割。公開中の一覧は、カテゴリのあと1条件だけです。人物と役割を横断して引くのは、ここでの新しい動作です。一覧はブラウザから API を呼ぶ。
- [ ] **人物一覧の見本を外す。** 曲の一覧と詳細が揃ってから、公開中の [beatles-db](https://github.com/ryo-i/beatles-db) の切り替えを考える。それまで公開サイトはそのまま残す。

各段で、その段の Jest または Vitest を足す。画面の見た目は、表示専用コンポーネントを Storybook で確認する。

## 3つに分けると、この中に入る

- data.json を PostgreSQL のテーブルにするのは、Prisma のテーブルと取り込みです。テーブルを作ってから入れます。
- 公開中の Next.js の API を NestJS のレイヤードアーキテクチャにするのは、曲詳細と一覧の API です。
- 公開中の画面を Bulletproof の feature にまとめ、styled-components を Tailwind にするのは、曲詳細と一覧の画面です。

このほかに、段の間でやることは次です。

- OpenAPI からフロントの型を生成する。API と画面の間に入ります。
- 取り込み結果を件数で確認する。取り込みの完了条件です。
- 見本の人物一覧と、戦国大名の seed を外す。最後の段です。
- 公開サイトの切り替えは、一覧と詳細が揃ったあとです。
- 一覧のあとで検討するアイデアは [ideas.md](ideas.md) にあります。今の順番には入れません。
