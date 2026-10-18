# MD 戦績トラッカー

遊戯王マスターデュエルの DC 用の戦績記録 PWA。先攻/後攻・自分のデッキ・相手のデッキ・勝敗を記録して、勝率を集計する。

## 開発

```sh
npm install
npm run dev:offline   # ブラウザ内保存（ログイン不要）で起動
npm run dev           # Firebase につないで起動
npm test
npm run build
```

## 構成

- Vite + Preact + TypeScript、vite-plugin-pwa
- 保存先は `src/backend/` に閉じ込めてある。`Backend`（`src/backend/types.ts`）を実装して `src/backend/index.ts` で切り替える
  - `firebase.ts`: Firebase Auth（メール/パスワード）+ Firestore
  - `local.ts`: localStorage
- Firestore のセキュリティルールは `firestore.rules`
- `main` に push すると GitHub Actions で GitHub Pages にデプロイされる
- アイコンは `public/icon.svg` を編集して `npm run icons`
