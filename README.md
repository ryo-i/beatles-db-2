# beatles-db-2

ビートルズDBのリニューアル版です。公開中の [beatles-db](https://github.com/ryo-i/beatles-db) はそのまま残し、画面も含めてこちらで作り直します。

## 構成

Next.js + NestJS + PostgreSQL にします。土台は [next-nest-started](https://github.com/ryo-i/next-nest-started) の形をこのリポジトリへコピーし、ビートルズDBの機能はこちらに足します。

- フロントエンド: Next.js（App Router）
- バックエンド: NestJS
- データベース: PostgreSQL

スキーマは [docs/schema.md](docs/schema.md)、元データの列は [docs/source_table.md](docs/source_table.md) です。比べた3つの方針と、この構成に決めた理由は [docs/decision.md](docs/decision.md) にあります。
