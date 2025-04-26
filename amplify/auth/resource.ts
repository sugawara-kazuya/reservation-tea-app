import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    // 必要に応じてusernameやphoneを追加可能
  },
  triggers: {
    postConfirmation
  },
  passwordPolicy: {
    minimumLength: 4,          // 最小文字数
    requireLowercase: true,    // 小文字必須
    requireUppercase: false,   // 大文字不要
    requireNumbers: false,     // 数字不要
    requireSymbols: false      // 記号不要
  }
});
