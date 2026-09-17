// Chrome's "Save as PDF" suggests the page's <title> as the filename, so
// setting the title to a document's Ref No. makes the saved PDF filename
// match it automatically. "/" isn't valid in filenames, so it's swapped
// for "-" first.
export function toFilenameSafe(ref: string): string {
  return ref.replace(/\//g, "-");
}
