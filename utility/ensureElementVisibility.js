// Jumps to a time position where the provided element is visible
export async function ensureElementVisibility(preview, elementName, addTime) {
  // Find element by name
  const element = preview.getElements().find((element) => element.source.name === elementName);
  if (element) {
    // Set playback time
    await preview.setTime(element.globalTime + addTime);
  }
}
