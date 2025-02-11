import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { env } from "$amplify/env/post-confirmation";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
  
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    await client.models.UserProfile.create({
      userId: event.request.userAttributes.sub,
      name: event.request.userAttributes.email.split('@')[0],
      email: event.request.userAttributes.email,
      phone: '',
      bio: '',
    });

    return event;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};