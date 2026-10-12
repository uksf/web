import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OperationsServersComponent } from './operations-servers.component';
import { GameServer, StopPhase } from '../../models/game-server';
import { makeServer, setupOperationsServersSpec, teardownOperationsServersSpec } from './operations-servers.spec-setup';
import { killAllConfirmationMessage, killConfirmationMessage } from './operations-servers.helpers';

describe('OperationsServersComponent status', () => {
    let component: OperationsServersComponent;

    beforeEach(() => {
        component = setupOperationsServersSpec().component;
    });

    afterEach(() => {
        teardownOperationsServersSpec();
    });

    describe('getServerStatus', () => {
        it('returns "Saving to API" while the save waits on API delivery', () => {
            const server = makeServer({ status: { ...makeServer().status, stopPhase: StopPhase.Delivering } });
            expect(component.getServerStatus(server)).toBe('Saving to API');
        });

        it('returns "Stopping" when server is stopping', () => {
            const server = makeServer({ status: { ...makeServer().status, stopPhase: StopPhase.Stopping } });
            expect(component.getServerStatus(server)).toBe('Stopping');
        });

        it('returns "Launching" when launching flag is set', () => {
            const server = makeServer({ status: { ...makeServer().status, launching: true, running: false, stopPhase: StopPhase.None } });
            expect(component.getServerStatus(server)).toBe('Launching');
        });

        it('labels each stop phase from stopPhase', () => {
            const make = (stopPhase: StopPhase, running = true) => ({ status: { stopPhase, launching: false, running, startedAt: '2026-07-04T00:00:00Z' } } as GameServer);

            expect(component.getServerStatus(make(StopPhase.Ending))).toBe('Ending');
            expect(component.getServerStatus(make(StopPhase.Saving))).toBe('Saving');
            expect(component.getServerStatus(make(StopPhase.Stopping))).toBe('Stopping');
            expect(component.getServerStatus(make(StopPhase.None))).toBe('Running');
            expect(component.getServerStatus(make(StopPhase.None, false))).toBe('Offline');
        });

        it('returns "Offline" when server is not running', () => {
            const server = makeServer({ status: { ...makeServer().status, running: false } });
            expect(component.getServerStatus(server)).toBe('Offline');
        });

        it('returns "Waiting" when startedAt is not set', () => {
            const server = makeServer({ status: { ...makeServer().status, startedAt: null } });
            expect(component.getServerStatus(server)).toBe('Waiting');
        });

        it('returns "Running" for normal running server', () => {
            const server = makeServer();
            expect(component.getServerStatus(server)).toBe('Running');
        });
    });

    describe('kill availability during a stop', () => {
        const stopping = (killAllowedAt: string | null) => makeServer({ status: { ...makeServer().status, running: false, stopPhase: StopPhase.Stopping, killAllowedAt } });

        it('is not allowed before the kill offer time sent by the API', () => {
            expect(component.isKillAllowed(stopping(new Date(Date.now() + 15000).toISOString()))).toBe(false);
        });

        it('is allowed once the kill offer time has passed', () => {
            expect(component.isKillAllowed(stopping(new Date(Date.now() - 1000).toISOString()))).toBe(true);
        });

        it('is not allowed while a stop carries no offer time', () => {
            expect(component.isKillAllowed(stopping(null))).toBe(false);
        });

        it('is allowed for a running server that is not stopping', () => {
            expect(component.isKillAllowed(makeServer())).toBe(true);
        });
    });

    describe('stop availability', () => {
        it('is blocked once a stop is in progress', () => {
            expect(component.isStopping(makeServer({ status: { ...makeServer().status, stopPhase: StopPhase.Saving } }))).toBe(true);
        });

        it('is available for a running server', () => {
            expect(component.isStopping(makeServer())).toBe(false);
        });
    });

    describe('kill confirmation', () => {
        it.each([StopPhase.Ending, StopPhase.Saving, StopPhase.Delivering])('warns that unsaved persistence data is lost while the server is in %s', (stopPhase) => {
            const server = makeServer({ name: 'Main', status: { ...makeServer().status, stopPhase } });

            expect(killConfirmationMessage(server)).toBe(
                "'Main' is still saving. Killing it now loses any persistence data that has not reached the API. Kill it anyway?"
            );
        });

        it('keeps the general warning for a server that is not saving', () => {
            expect(killConfirmationMessage(makeServer({ name: 'Main' }))).toBe("Are you sure you want to kill 'Main'? This could have unexpected effects on the server");
        });
    });

    describe('kill all confirmation', () => {
        it('names the servers that are still saving and warns of persistence loss', () => {
            const servers = [
                makeServer({ name: 'Main', status: { ...makeServer().status, stopPhase: StopPhase.Delivering } }),
                makeServer({ name: 'Training' })
            ];

            expect(killAllConfirmationMessage(servers, 3)).toBe(
                'Main is still saving. Killing all 3 servers now loses any persistence data that has not reached the API. Kill them anyway?'
            );
        });

        it('keeps the general warning when no server is saving', () => {
            expect(killAllConfirmationMessage([makeServer({ name: 'Main' })], 2)).toBe(
                'Are you sure you want to kill 2 servers?\nThere could be players still on and this could have unexpected effects on the server'
            );
        });
    });
});
