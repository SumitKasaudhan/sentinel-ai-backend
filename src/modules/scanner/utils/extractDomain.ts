export const extractDomain = (
  input: string
): string => {
  try {
    if (
      !input.startsWith("http://") &&
      !input.startsWith("https://")
    ) {
      input = `https://${input}`;
    }

    const url = new URL(input);

    return url.hostname.replace(
      /^www\./,
      ""
    );
  } catch {
    return input;
  }
};