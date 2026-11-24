import type { WebGLCapabilities } from 'three';

const profiles = {
  ultra: {
    tier: 'ultra',
    segments: 320,
    cloudSteps: 7,
    albedoK: 8,
    lightsK: 8,
    cloudsK: 8,
    reliefK: 4,
  },
  balanced: {
    tier: 'balanced',
    segments: 192,
    cloudSteps: 3,
    albedoK: 4,
    lightsK: 4,
    cloudsK: 4,
    reliefK: 2,
  },
  mobile: {
    tier: 'mobile',
    segments: 128,
    cloudSteps: 1,
    albedoK: 4,
    lightsK: 4,
    cloudsK: 2,
    reliefK: 2,
  },
} as const;

export function getEarthQuality(
  capabilities: Pick<WebGLCapabilities, 'maxTextureSize' | 'getMaxAnisotropy'>,
  width: number,
  coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false,
  preferBalanced = new URLSearchParams(window.location.search).get('quality') === 'balanced',
) {
  if (coarsePointer || width < 760) return profiles.mobile;
  if (
    !preferBalanced &&
    width >= 1000 &&
    capabilities.maxTextureSize >= 8192 &&
    capabilities.getMaxAnisotropy() >= 8
  )
    return profiles.ultra;
  return profiles.balanced;
}
