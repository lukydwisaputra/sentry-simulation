export type ReleaseConfig = {
  version: string;
  featureFlags: Record<string, boolean>;
  deployedAt: string;
};

const RELEASE_CONFIGS: Record<string, ReleaseConfig> = {
  "v1.0.0-demo": {
    version: "v1.0.0-demo",
    featureFlags: { newCheckout: true, betaDashboard: false },
    deployedAt: "2026-06-25T00:00:00Z",
  },
};

export function getReleaseConfig(version: string): ReleaseConfig {
  const config = RELEASE_CONFIGS[version];
  // BUG: config is undefined for unknown versions — accessing .featureFlags throws TypeError
  return { ...config, featureFlags: config.featureFlags };
}
