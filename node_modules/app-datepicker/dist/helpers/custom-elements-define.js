export function customElementsDefine(tagName, baseClass) {
    if (window.customElements && !window.customElements.get(tagName)) {
        window.customElements.define(tagName, baseClass);
    }
}
