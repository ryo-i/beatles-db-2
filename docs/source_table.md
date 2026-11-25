# BEATLES DB 元データカラム構成（Googleスプレッドシート由来）

このドキュメントは、Googleスプレッドシートからエクスポートされた元データ（JSON形式）のカラム構成・データ例・分割要否をまとめたものです。  
PostgreSQL等のデータベース設計・データ移行前の現状把握資料として利用します。

## ファイルの形

`data/data.json` は、Google スプレッドシートの API が返すセルの表です。`values` の1行目が列名、2行目以降は同じ順番の値だけです。CSV を JSON の配列に入れた形で、2行目以降に列名は繰り返しません。取り込みは、1行目の列名を同じ位置のセルに対応づけます。

---

## カラム一覧・用途・分割要否

| カラム名       | 用途・内容                                        | 値の例                                             | 分割要否・扱い         |
|:--------------|:--------------------------------------------------|:---------------------------------------------------|:-----------------------|
| id            | レコードのユニークID                              | 1, 2, 3                                            | 通常の主キー           |
| year          | 年                                                | 1961, 1962                                         | 単一値                 |
| date          | 日付                                              | 1961/10/23                                         | 単一値                 |
| icon          | アイコン種別記号                                  | T&B, BE                                            | 単一値                 |
| category      | カテゴリ                                          | Tony & Beatles, Beatles                            | 単一値                 |
| path          | パス・分類                                        | tony-beatles, beatles                              | 単一値                 |
| artist        | 表示用のアーティスト名                            | Tony Sheridan and The Beat Brothers, The Beatles   | 単一の文字列。`/` は名前の一部で、分割しない |
| country       | 国                                                | GER, UK                                            | 単一値                 |
| label         | レーベル                                          | Polydor, Parlophone                                | 単一値                 |
| format        | 形式                                              | Single, Album                                      | 単一値                 |
| title         | 作品タイトル                                      | My Bonnie, Love Me Do                              | 単一値                 |
| order         | カタログ番号                                      | TB-S-01, BE-S-01                                   | 単一値。この番号だけでリリースが分かれる |
| disc          | ディスク番号                                      | 1                                                  | 単一値                 |
| side          | レコード面                                        | A, B, 1, 2                                         | 単一値                 |
| number        | 曲順                                              | 1, 2, 3                                            | 単一値                 |
| track         | 曲名                                              | My Bonnie, Love Me Do                              | 単一値                 |
| vocal         | ボーカル担当                                      | Tony Sheridan, Paul McCartney / (John Lennon)      | `/` で分割。全体が括弧のものは補助 |
| playing       | 演奏担当（役割なしの人名）                        | John Lennon / Paul McCartney / George Harrison     | 同じ事実がパート列にあるので、クレジットには入れない |
| john          | ジョンのパート                                    | rhythm guitar, backing vocals                      | `,`区切りで分割も可    |
| paul          | ポールのパート                                    | bass, backing vocals                               | `,`区切りで分割も可    |
| george        | ジョージのパート                                  | lead guitar, backing vocals                        | `,`区切りで分割も可    |
| ringo         | リンゴのパート                                    | drums, maracas                                     | `,`区切りで分割も可    |
| musician      | 参加ミュージシャン（役割含む）                    | Pete Best : drums / Tony Sheridan : lead vocals, guitar | `/`区切り＋`: `でkey-value型 |
| songwriter    | 作詞作曲者                                        | Lennon-McCartney / Paul McCartney / (John Lennon)  | `/`区切りで一対多      |
| original      | 誰の曲か（作詞作曲者とは別）                      | traditional, The Beatles                           | `/` で複数行。persons には入れない |
| producer      | プロデューサー                                    | Bert Kaempfert / George Martin                     | `/`区切りで一対多      |
| engineer      | エンジニア                                        | Karl Hinze / Norman Smith                          | `/`区切りで一対多      |
| artwork       | アートワーク担当（役割含む）                      | Angus McBean : photography                         | `/`区切り＋`: `でkey-value型 |
| film          | その曲の映画監督                                  | Richard Lester, The Beatles / Bernard Knowles      | `/` で複数人。曲ごとに違う |
| mv            | その曲のMV監督                                    | Joseph McGrath, John Lennon / Yoko Ono             | `/` で複数人。曲ごとに違う |
| remarks       | 備考                                              | Polydorから発売されたトニーのシングルのA面 / ...   | 文字列のまま。`/` は文の区切り |
| source        | 情報源URL等                                       | https://en.wikipedia.org/... / ...                 | 文字列のまま。中身があるのは1行 |

---

## テーブル分割・正規化のための考え方・判断基準（人物統合案を含む）

- **一対多（1:N）や多対多（N:M）の関係が発生する場合はテーブルを分ける**  
  例：1曲に複数の作曲者や参加者（演奏、アートワーク等）がいる場合は中間テーブルで管理

- **何度も繰り返し使われる情報（例：リリース名・人物名・レーベル名）はテーブルを分けてID参照にする**  
  → 表記揺れや重複データを防ぎ、データの一貫性を保つ

- **演奏・作曲・アートワーク・映像等で同じ人物が登場する場合、「persons」テーブルで統合管理し、役割や分野は中間テーブルやroleで区別することで横断的な検索・集計を容易にする**

- **一対一の情報やほとんど使い回しがない属性は1テーブルにまとめる**

- **情報どうしの”まとまり感”が強い場合は1テーブルにまとめる**

- **今後の拡張や検索パターン（例：人物ごとの全活動横断検索など）を想定してテーブル分割を検討する**

- **JOIN数が多くなりすぎないようにバランスを取る**  
  目安：3〜5テーブルまでのJOINなら実用的、10以上になる場合は設計を見直す

- **選択肢が少なく、今後も増減がほぼない情報（例：format＝Album/Single/EPなど）は、テーブルを分けずにenum型やアプリの定数で管理することも検討する**

---

## 【今回のBEATLESデータ例：テーブル分割たたき台（人物統合案）】

列の行き先と、人物を二重に入れないための規則は [schema.md](schema.md) に合わせる。

- `releases`（`catalog_code` で59件。title, format, release_date, label_id, country, category, icon, path）
  - `format` は Album / Single / EP。映画と MV は format ではない
  - `catalog_code` は元の `order`。番号だけでリリースが分かれる
- `tracks`（370行。title, artist, disc, side, number, remarks, source, release_id）
  - `artist` は表示用の文字列。曲ごとに違うリリースがある
- `labels`
- `persons`（表記のまま。`Lennon-McCartney` は分割しない）
- `roles`
- `track_persons`（track_id, person_id, role_id, billing）曲の演奏・歌唱・作詞作曲・制作・映画監督・MV監督
- `track_originals`（track_id, name）元の `original`。作詞作曲者とは別
- `release_persons`（release_id, person_id, role_id）リリース全体で同じアートワーク

`playing` は役割のない人名なので、`track_persons` には入れない。備考と情報源は曲の文字列のまま残す。

---

## 備考

- `/` 区切り：一つのセルに複数のデータが入っている印。人物、役割、原曲クレジットでは行に分ける。`artist` の `/`、`remarks` の `/`、URL の中の `/` は分けない。
- `: ` 区切り：`musician` と `artwork` の「人物 : 役割」。人物と役割を別にする。
- `,` 区切り：1人が複数の役割を持つときの担当。1行1役割にする。
- `|` は、この JSON には出てこない。

---

## 参考

- 元データはGoogleスプレッドシートのヘッダー行＋データをJSON形式でエクスポートしたもの。
- 本ファイルはDB設計・データ移行（マッピング）時の参照資料とする。
