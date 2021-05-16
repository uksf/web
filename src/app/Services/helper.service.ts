export function nextFrame(callback: () => void) {
    setTimeout(() => {
        callback();
    }, 1);
}

export function titleCase(string: string) {
    if (string === '') {
        return string;
    }

    const doubleBarrelParts = string.split('-');
    if (doubleBarrelParts.length == 2) {
        return `${titleCase(doubleBarrelParts[0])}-${titleCase(doubleBarrelParts[1])}`;
    }

    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
