export function nextFrame(callback: () => void) {
    setTimeout(() => {
        callback();
    }, 1);
}
