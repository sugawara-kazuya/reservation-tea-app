import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { postConfirmation } from './auth/post-confirmation/resource';
import { storage } from "./storage/resource";

// バックエンド定義
const backend = defineBackend({
  auth,
  data,
  storage,
  postConfirmation,
});

// Cognito UserPoolの設定を上書き
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 4,
    requireLowercase: true,
    requireUppercase: false,
    requireNumbers: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 3
  }
};
