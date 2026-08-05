import { isMarketingRuntimeEnabled } from '@/lib/marketing/runtime'

export const META = {
  pixelId: process.env.META_PIXEL_ID!,
  accessToken: process.env.META_CAPI_ACCESS_TOKEN!, // system-user token, server only
  apiVersion: process.env.META_GRAPH_API_VERSION ?? 'v21.0',
  testEventCode: process.env.META_TEST_EVENT_CODE, // set ONLY outside production
}

export const isMetaDeliveryEnabled = () =>
  isMarketingRuntimeEnabled() && Boolean(META.pixelId?.trim() && META.accessToken?.trim())

export const metaEndpoint = () =>
  `https://graph.facebook.com/${META.apiVersion}/${META.pixelId}/events`
