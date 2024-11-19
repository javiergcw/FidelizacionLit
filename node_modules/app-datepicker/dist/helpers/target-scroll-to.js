export function targetScrollTo(target, scrollToOptions) {
    if (target.scrollTo == null) {
        const { top, left } = scrollToOptions || {};
        target.scrollTop = top || 0;
        target.scrollLeft = left || 0;
    }
    else {
        target.scrollTo(scrollToOptions);
    }
}
