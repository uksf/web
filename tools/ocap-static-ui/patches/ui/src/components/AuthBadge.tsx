import { Show } from "solid-js";
import type { JSX } from "solid-js";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../hooks/useLocale";
import { SteamIcon, ShieldIcon, LogOutIcon } from "./Icons";
import styles from "./AuthBadge.module.css";

/**
 * Shared auth badge — renders Steam sign-in when unauthenticated,
 * admin badge + sign-out when authenticated.
 * In UKSF iframe embed mode: no Steam button, no logout (parent owns session).
 */
export function AuthBadge(): JSX.Element {
  const { authenticated, isAdmin, steamName, steamId, steamAvatar, loginWithSteam, logout, isEmbed } = useAuth();
  const { t } = useI18n();

  return (
    <Show
      when={authenticated()}
      fallback={
        <Show when={!isEmbed()}>
          <button class={styles.signInButton} onClick={() => loginWithSteam()}>
            <SteamIcon /> {t("sign_in")}
          </button>
        </Show>
      }
    >
      <>
        <div class={styles.adminBadge}>
          <Show when={steamAvatar()} fallback={<div class={styles.adminAvatar}>{(steamName() || "U")[0].toUpperCase()}</div>}>
            {(url) => <img src={url()} class={styles.adminAvatarImg} alt="" data-testid="admin-avatar" />}
          </Show>
          <div>
            <div class={styles.adminName}>
              {steamName() || steamId() || "User"}
            </div>
            <Show when={isAdmin()}>
              <div class={styles.adminLabel}><ShieldIcon /> ADMIN</div>
            </Show>
          </div>
        </div>
        <Show when={!isEmbed()}>
          <button class={styles.adminIconButton} onClick={() => logout()} title={t("sign_out")}>
            <LogOutIcon />
          </button>
        </Show>
      </>
    </Show>
  );
}
