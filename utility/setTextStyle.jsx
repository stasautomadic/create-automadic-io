export async function setTextStyle(
  preview,
  selector,
  style,
  modifications,
) {
  if (style === 'block-text') {
    modifications[`${selector}.background_border_radius`] = '0%';
  } else if (style === 'rounded-text') {
    modifications[`${selector}.background_border_radius`] = '50%';
  }

  await preview.setModifications(modifications);
}
