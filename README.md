## docker環境の構築

ルートディレクトリで

```
docker-compose up -d --build
```

環境に入る際は

```
docker-compose exec amplify bash
```

## ローカルホスト立ち上げ

```
npm run dev
```

[http://localhost:3000](http://localhost:3000)でフロント環境確認可能

## sandbox立ち上げ

[初期設定](nft-owner-backend-management)後に

```
npx ampx sandbox --profile moshimoji
```

しかし、docker内ではなぜかsandboxの監視機能が働いていないので、コンテナ外で動作させた方が開発効率は上がる気がする。  
docker内でも機能はする。

### sessionが切れた場合は

以下を実行

```
aws sso login --profile moshimoji
```

## git push する前に

githubに上げる前に以下のコマンドを走らせる。  
`error`があるとbuildできないため、修正すること。

```
npm run lint:fix
```

Welcome to the moshimoji wiki!
# Docker
## コンテナ立ち上げ
`docker-compose up -d --build`でコンテナ立ち上げ。  
2回目以降は`docker-compose up -d`

## コンテナの中に入る
`docker-compose exec amplify bash`

## ローカルサーバーの立ち上げ
初回は`npm install && npm run dev`（パッケージのインストール後に立ち上げ）。  
2回目以降は`npm run dev`。  
`http://localhost:3000/`にて画面確認可能。
## コンテナを落とす
`docker-compose down`

# AWS
## SSO設定
バックエンド管理のためにAWSにアクセスする必要がある。
### 初回設定
以下コマンドを入力。  
もしawsコマンドが効かなければ[AWS CLIの導入](https://zenn.dev/hayato94087/articles/7848e9d6a2e3d6)。

```jsx
$ unset AWS_PROFILE
$ aws configure sso
```

SSOの設定は以下のように記載

それぞれの値はAWS access portalを参照にしている

```zsh
SSO session name (Recommended): session-moshimoji
SSO start URL [None]: https://d-956719651a.awsapps.com/start/#
SSO region [None]: ap-northeast-1
SSO registration scopes [sso:account:access]:
Attempting to automatically open the SSO authorization page in your default browser.
If the browser does not open or you wish to use a different device to authorize this request, open the following URL:

https://device.sso.ap-northeast-1.amazonaws.com/

Then enter the code:

MGFR-VSFS
There are 34 AWS accounts available to you.
Using the account ID 010438467173
There are 2 roles available to you.
Using the role name "moshimoji"
CLI default client Region [ap-northeast-1]:
CLI default output format [None]:
CLI profile name [moshimoji-010438467173]: moshimoji

To use this profile, specify the profile name using --profile, as shown:

aws s3 ls --profile moshimoji
```
### 2回目以降

時間が経つとセッションの有効期限が切れるため、以下のコマンドにて再度SSOログインが必要。  
このロールは12時間制限としている。  

```jsx
$ aws sso login --profile moshimoji
```

### 確認方法
コンテナ内で以下コマンドを実行。
```
npx ampx sandbox --profile moshimoji
```
以下のような出力を確認できれば成功。  
3-4分程度の時間がかかる。
```
✨  Total time: 200.22s


[Sandbox] Watching for file changes...
File written: amplify_outputs.json
```

もし、次のようなエラーが表示された場合は以下のいずれかを行う。

```
https://ap-northeast-1.console.aws.amazon.com/amplify/create/bootstraping
```

```
$ npx ampx sandbox
npm error could not determine executable to run
npm error A complete log of this run can be found in: /root/.npm/_logs/2024-07-02T10_41_57_814Z-debug-0.log
```
以下を実行して、aws-amplifyを入れ直す
```
npm i @aws-amplify/backend@1.0.3 @aws-amplify/backend-cli@1.0.4
```
# VScode拡張機能
- Code Spell Checker
- Prettier - Code formatter
- ESLint
