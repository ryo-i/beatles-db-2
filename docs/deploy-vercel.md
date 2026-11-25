# Vercel と Neon に出す

ビートルズDBを、フロントとバックは Vercel の 1 プロジェクト、データベースは Neon の 1 プロジェクトとして公開する手順です。置き場所の判断は [deploy.md](deploy.md) にあります。

リポジトリには、すでに次が入っています。

- ルートの `vercel.json` が `apps/frontend` と `apps/backend` を 1 つのプロジェクトにし、`/persons` と Swagger の `/api` をバックエンドへ送ります。
- `apps/backend/scripts/vercel-prisma.js` が、Vercel 上のインストールで Prisma Client を生成し、クエリコンパイラの WASM を Function に入る形へ置き換え、接続文字列があれば `prisma migrate deploy` を実行します。

画面と API は同じホストになるので、ブラウザから見る URL は 1 つです。

## Vercel にプロジェクトを作る

1. Vercel に GitHub アカウントでログインし、対象リポジトリを Import します。
2. **Root Directory はリポジトリのルートのまま**にします。`apps/frontend` にすると `vercel.json` が読まれず、フロントだけになります。Framework Preset や Build Command は上書きしません。
3. 環境変数 `NEXT_PUBLIC_API_URL` を `/` にします。Production と Preview の両方です。この値はビルド時に埋め込まれるので、変えたあとは再デプロイが必要です。
4. Deploy します。この時点ではデータベースがまだ無いので、画面は出ても `/persons` は失敗します。

GitHub 上では、このコミットの Vercel が緑の ✓ になってから公開 URL を開きます。● のあいだは、前のデプロイが公開されたままです。

同じコミットで GitHub Actions の `CI / test` も動きます。これはテストだけで、Vercel への公開や Neon への反映は行いません。テストが失敗しても、Vercel のデプロイは続きます。テストの失敗で本番の URL を止める設定と、作業ブランチをマージ前に別 URL へ出す仕組みは [deploy.md の CI とデプロイ](deploy.md#ci-とデプロイ) にあります。

`プロジェクト名.vercel.app` がすでに使われているときは、`プロジェクト名-beta.vercel.app` のように接尾辞が付きます。アプリがベータ版という意味ではありません。

## Neon を接続する

Neon 用の設定ファイルはありません。Vercel の Marketplace（または Storage）から、このプロジェクトに Neon を接続します。

1. Region は、Vercel の Function と同じにします。既定の Function は米国東部（Washington, D.C.）です。
2. Auth と Realtime はオフにします。このアプリの API は NestJS です。
3. プランは Free にします。
4. 接続先の Vercel プロジェクトは、いま作ったプロジェクトにします。
5. Environments は **Production** と **Preview** にします。
6. **Create database branch for deployment** は **Preview だけ**オンにします。Production はオフです。Production をオンにすると、本番デプロイのたびに接続先のデータベースが変わります。
7. Custom Prefix は空にします。文字が入っていると、環境変数名が `DATABASE_URL` ではなくなります。サンプルとして `STORAGE` と表示されていても、入力されていなければそのままで構いません。
8. Sensitive はオンのままにします。オンにすると、あとから Vercel の画面では値を表示できません。接続文字列や、あとから足す署名鍵の置き方は [deploy.md の秘密と公開範囲](deploy.md#秘密と公開範囲) にあります。
9. Connect します。Skip は押しません。

接続できると、Vercel の **Settings → Environment Variables** に次が入ります。どちらも Production と Preview に付いていることを確認します。ほかの変数が増えていても、アプリが使うのはこの 2 つです。

| 名前 | 用途 |
| --- | --- |
| `DATABASE_URL` | アプリが使うプール接続 |
| `DATABASE_URL_UNPOOLED` | migration が使う直接接続 |

## 環境変数を反映して再デプロイする

変数を足しただけでは、公開中のデプロイは変わりません。

1. プロジェクトの **Deployments** を開きます。
2. 最新のデプロイの **⋯** から **Redeploy** を選びます。
3. Environment は Production、対象はいまの `main` にします。
4. **Use existing Build Cache** はオフにします。インストールからやり直すので、新しい接続文字列で migration が走ります。

緑の ✓ のあと、公開 URL の `/persons` を開きます。成功するとステータスは 200 で、中身は `[]` です。画面は「人物一覧」の **0 名** です。サンプルの 3 人は、この時点では入っていません。

Logs に SSL の警告が出ることがあります。接続に失敗したという意味ではありません。`/persons` が 200 なら、その警告は無視して構いません。

## 曲データ

`prisma/seed.ts` は行を入れません。織田信長、豊臣秀吉、徳川家康も入りません。370曲は、`data/data.json` の取り込みで後から入れます。起動時やデプロイ時には走りません。

## ローカルに残すもの

Storybook（`npm run storybook`、`http://localhost:6006`）と Prisma Studio（`npm run studio`、`http://localhost:5555`）は、この公開 URL には出しません。開発中に手元で見る画面です。Neon の表や SQL は、Neon の管理画面で見ます。
