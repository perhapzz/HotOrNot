/**
 * Scroll to an element by id with a small delay for DOM updates.
 */
export function jumpToElement(elementId: string, offset = 100) {
  setTimeout(() => {
    const el = document.getElementById(elementId);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    }
  }, 200);
}
