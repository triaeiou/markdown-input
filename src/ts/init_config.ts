document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("markdown-config");
  if (el) {
    const config = JSON.parse(el.getAttribute("data-config"));
    // This only works if MarkdownInput has been brought in scope.
    MarkdownInput.init(config);
  }
});
