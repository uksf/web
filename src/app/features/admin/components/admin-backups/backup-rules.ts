import { BackupEntry, BackupRule } from '@app/features/admin/models/backup';

/** Includes and excludes are one list to the user: a pattern keeps files, the same prefixed with ! keeps them out. */
export function toRules(entry: BackupEntry): BackupRule[] {
    return [...entry.includePatterns.map((text) => ({ text, exclude: false })), ...entry.excludes.map((text) => ({ text: `!${text}`, exclude: true }))];
}

export function withRule(entry: BackupEntry, rule: string): BackupEntry {
    const trimmed = rule.trim();

    return trimmed.startsWith('!')
        ? { ...entry, excludes: [...entry.excludes, trimmed.slice(1).trim()] }
        : { ...entry, includePatterns: [...entry.includePatterns, trimmed] };
}

export function withoutRule(entry: BackupEntry, rule: BackupRule): BackupEntry {
    return rule.exclude
        ? { ...entry, excludes: entry.excludes.filter((x) => x !== rule.text.slice(1)) }
        : { ...entry, includePatterns: entry.includePatterns.filter((x) => x !== rule.text) };
}

export function isRuleEmpty(rule: string): boolean {
    const trimmed = rule?.trim();
    return !trimmed || trimmed === '!';
}
