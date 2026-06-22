export const publicPath =
  (window as Window & { __PLAYABLE_PUBLIC_PATH__?: string }).__PLAYABLE_PUBLIC_PATH__
  ?? import.meta.env.BASE_URL;
