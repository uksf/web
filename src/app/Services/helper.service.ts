import { Injectable } from '@angular/core';

export function nextFrame(callback: () => void) {
    setTimeout(() => {
        callback();
    }, 1);
}
