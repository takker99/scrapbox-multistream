export const toLc = (title: string) =>
  title.toLowerCase().replaceAll(" ", "_").replaceAll("/", "%2F");
