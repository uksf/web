export function nextFrame(callback: () => void) {
    setTimeout(() => {
        callback();
    }, 1);
}

export function debounce<T extends unknown[], U>(callback: (...args: T) => PromiseLike<U> | U, wait: number) {
    let timer: any;

    return (...args: T): Promise<U> => {
        clearTimeout(timer);
        return new Promise((resolve) => {
            timer = setTimeout(() => resolve(callback(...args)), wait);
        });
    };
}

export function any<T = any>(arr: T[], predicate: (t: T) => boolean = Boolean) {
    return arr.some(predicate);
}

export function all<T = any>(arr: T[], predicate: (t: T) => boolean = Boolean) {
    return arr.every(predicate);
}

export function buildQuery(filter: string): string {
    return filter.replace(/( ?)(and)( ?)/i, '&&').replace(/( ?)(or)( ?)/i, '||');
}

export function titleCase(string: string) {
    if (string === '') {
        return string;
    }

    string = string.trim();
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}

export function nameCase(string: string) {
    if (string === '') {
        return string;
    }

    string = string.trim();

    if (string !== null && typeof string !== 'undefined' && string !== '') {
        let chunks = [];
        let buffer = '';
        let isFirstChunk = true;
        for (let x = 0; x < string.length; x++) {
            if (string[x].match(/[\s]+/) || string[x] == '-' || string[x] == '.' || string[x] == ',') {
                chunks.push(processChunk(`${buffer}${string[x]}`, isFirstChunk));
                isFirstChunk = false;
                buffer = '';
            } else {
                buffer += string[x];
            }
        }

        if (buffer != '') {
            chunks.push(processChunk(buffer, isFirstChunk));
        }

        return chunks.join('').trim();
    }

    return '';
}

function processChunk(string: string, isFirstChunk: boolean) {
    if (string.match(/^(van|von|der|la|d[aeio]|d[ao]s|dit)[\s]+.*$/i) && isFirstChunk === false) {
        return string.toLowerCase();
    }

    // Ordinal suffixes (I - VIII only)
    if (string.match(/^(i{3}|i{1,2}v?|v?i{1,2})[\s,]*$/i)) {
        return string.toUpperCase();
    }

    string = string.toLowerCase();
    string = toUpperCaseAt(string, 0);

    // Third character capitalized, like D'Angelo, McDonald, St. John, 0'Neil
    if (string.match(/(^|\s)+(Mc|[DO]'|St\.|St[.]?[\s]|Dewolf)/i)) {
        string = toUpperCaseAt(string, 2);
    }

    // Fourth character capitalized, like MacDonald, MacRae
    if (string.match(/(^|\s*)(Mac)(allist|arth|b|c(allu|art|ask|l|r|ull)|d|f|g|i(nn|nty|saa|v)|kinn|kn|l(a|ea|eo)|m|na[mu]|n[ei]|ph|q|ra|sw|ta|w)/i)) {
        string = toUpperCaseAt(string, 3);
    }

    return string;
}

function toUpperCaseAt(string: string, index: number) {
    return string.substr(0, index) + string.charAt(index).toUpperCase() + string.substr(index + 1);
}
