// Updates the provided modifications object
export async function setPropertyValue(
  preview,
  selector,
  value,
  modifications,
) {
  if (value.trim()) {
    // If a non-empty value is passed, update the modifications based on the provided selector
    modifications[selector] = value;
  } else {
    // If an empty value is passed, remove it from the modifications map, restoring its default
    delete modifications[selector];
  }

  // Set the template modifications
  await preview.setModifications(modifications);
}
