## 進捗メモ（手動更新）
- [x] フェーズ1：基盤構築 — 完了（2026/06/21）
- [ ] フェーズ2：認証 
- [ ] フェーズ3：コアSNS 
- [ ] フェーズ4：ゲーム機能
- [ ] フェーズ5：実用ツール
- [ ] フェーズ6：設定・仕上げ

フェーズ1の基盤構築が完了。次はフェーズ2の認証機能（signup/login APIの動作確認、メール送信、P-01/P-02画面の仕上げ）に進みます。 (disable recaps in /config)

接続手順

1. Windows側（管理者PowerShellで実行）

スタートメニューで「PowerShell」を右クリック → 管理者として実行 → 以下を貼り付けて実行：

C:\Users\Public\setup-expo-forward.ps1

または直接コマンドを実行：

netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=172.27.220.238
netsh advfirewall firewall add rule name="Expo Metro 8081" dir=in action=allow protocol=TCP localport=8081

2. WSL2側（起動）

npm run start:lan

3. iPhone（Expo Go）

Expo Go を開いて右上「Enter URL manually」から：
exp://192.168.11.19:8081

---

▎ ポイント： WSL2は起動するたびにIPが変わる場合があります。変わった場合は hostname -I でWSL2 IPを確認して、管理者PowerShellで再度 portproxy add を実行してください。