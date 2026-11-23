# beatles-db-2

公開中の [beatles-db](https://github.com/ryo-i/beatles-db) はそのまま残し、画面も含めて Next.js と NestJS で作り直すリポジトリです。

## 技術スタック

- フロントエンド: Next.js 15（App Router）、React 19、TypeScript、Tailwind CSS
- バックエンド: NestJS 11、TypeScript
- DB: PostgreSQL 16、Prisma
- API: OpenAPI からフロントの型を生成する。Swagger は `/api`
- テスト: フロントは Vitest と Playwright、バックエンドは Jest
- 開発環境: Docker Compose

## ドキュメント

- 起動、Swagger、Prisma Studio、Storybook: [docs/local.md](docs/local.md)
- いまのコードの置き方: [docs/architecture.md](docs/architecture.md)
- スキーマ: [docs/schema.md](docs/schema.md)
- 元データの列: [docs/source_table.md](docs/source_table.md)
- この構成に決めた理由: [docs/decision.md](docs/decision.md)
- デプロイ: [docs/deploy.md](docs/deploy.md)
