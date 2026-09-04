import { init, type LDClient } from "@launchdarkly/node-server-sdk";

let ldClient: LDClient | undefined;

export function getLaunchDarklyClient(): LDClient | undefined {
  const sdkKey = process.env.LD_SDK_KEY;

  if (!sdkKey) {
    return undefined;
  }

  if (!ldClient) {
    ldClient = init(sdkKey);
  }

  return ldClient;
}

export async function evaluateBooleanFlag(
  flagKey: string,
  context: {
    kind: "user";
    key: string;
  },
  fallback: boolean,
): Promise<boolean> {
  const client = getLaunchDarklyClient();

  if (!client) {
    return fallback;
  }

  try {
    await client.waitForInitialization({ timeout: 5 });

    return await client.boolVariation(flagKey, context, fallback);
  } catch (error) {
    console.error(
      `LaunchDarkly evaluation failed for flag "${flagKey}":`,
      error,
    );

    return fallback;
  }
}
